import Attendance from "../../models/Attendance.js";
import User from "../../models/User.js";
import AttendanceSettings from "../../models/AttendanceSettings.js";
import LeaveRequest from "../../models/LeaveRequest.js";

class AttendanceService {
  /**
   * Get or create today's attendance for a user
   */
  async getTodayAttendance(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let attendance = await Attendance.findOne({
      userId,
      date: today
    }).populate("userId", "fullName designation email department");

    return attendance;
  }

  /**
   * Check if user can check-in (not already checked in, not on leave, etc.)
   */
  async canCheckIn(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already has attendance for today
    const existingAttendance = await Attendance.findOne({
      userId,
      date: today
    });

    if (existingAttendance && existingAttendance.checkIn?.time) {
      return {
        canCheckIn: false,
        reason: "Already checked in today",
        attendance: existingAttendance
      };
    }

    // Check if on approved leave
    const leaveToday = await LeaveRequest.findOne({
      userId,
      status: "approved",
      startDate: { $lte: today },
      endDate: { $gte: today }
    });

    if (leaveToday) {
      return {
        canCheckIn: false,
        reason: "You are on approved leave today"
      };
    }

    // Check if it's a weekend or holiday
    const settings = await AttendanceSettings.findOne();
    if (settings) {
      const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
      if (!settings.workingDays.includes(dayName)) {
        return {
          canCheckIn: false,
          reason: "Today is a weekend"
        };
      }

      // Check holidays
      const isHoliday = settings.holidays.some((holiday) => {
        const holidayDate = new Date(holiday.date);
        holidayDate.setHours(0, 0, 0, 0);
        return holidayDate.getTime() === today.getTime();
      });

      if (isHoliday) {
        return {
          canCheckIn: false,
          reason: "Today is a holiday"
        };
      }
    }

    return { canCheckIn: true };
  }

  /**
   * Check if user can check-out
   */
  async canCheckOut(userId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      userId,
      date: today
    });

    if (!attendance) {
      return {
        canCheckOut: false,
        reason: "You haven't checked in today"
      };
    }

    if (!attendance.checkIn?.time) {
      return {
        canCheckOut: false,
        reason: "You haven't checked in today"
      };
    }

    if (attendance.checkOut?.time) {
      return {
        canCheckOut: false,
        reason: "Already checked out today",
        attendance
      };
    }

    return { canCheckOut: true, attendance };
  }

  /**
   * Get attendance statistics for a user
   */
  async getUserStats(userId, startDate, endDate) {
    const query = { userId };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendances = await Attendance.find(query);

    const stats = {
      totalDays: attendances.length,
      presentDays: attendances.filter((a) => a.status === "present" || a.status === "late").length,
      absentDays: attendances.filter((a) => a.status === "absent").length,
      lateDays: attendances.filter((a) => a.lateArrival.isLate).length,
      leaveDays: attendances.filter((a) => a.status === "on-leave").length,
      averageHours: 0,
      totalHours: 0,
      onTimePercentage: 0
    };

    if (stats.totalDays > 0) {
      stats.totalHours = attendances.reduce((sum, a) => sum + (a.hoursWorked || 0), 0);
      stats.averageHours = Math.round((stats.totalHours / stats.totalDays) * 100) / 100;

      const onTimeDays = stats.presentDays - stats.lateDays;
      stats.onTimePercentage = Math.round((onTimeDays / stats.totalDays) * 100);
    }

    return stats;
  }

  /**
   * Get all absentees for a specific date
   */
  async getAbsentees(date = new Date()) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Get all active employees
    const allEmployees = await User.find({ role: "employee", isActive: true }).select(
      "fullName email designation department"
    );

    // Get attendance for the date
    const attendances = await Attendance.find({ date: targetDate });
    const attendedUserIds = attendances.map((a) => a.userId.toString());

    // Get approved leaves for the date
    const leaves = await LeaveRequest.find({
      status: "approved",
      startDate: { $lte: targetDate },
      endDate: { $gte: targetDate }
    });
    const onLeaveUserIds = leaves.map((l) => l.userId.toString());

    // Filter absentees (not attended and not on leave)
    const absentees = allEmployees.filter((emp) => {
      const empId = emp._id.toString();
      return !attendedUserIds.includes(empId) && !onLeaveUserIds.includes(empId);
    });

    return absentees;
  }

  /**
   * Get late arrivals for a specific date
   */
  async getLateArrivals(date = new Date()) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    const lateAttendances = await Attendance.find({
      date: targetDate,
      "lateArrival.isLate": true
    }).populate("userId", "fullName email designation department");

    return lateAttendances;
  }

  /**
   * Calculate if check-in is late
   */
  async calculateLateStatus(checkInTime, userId) {
    const settings = await AttendanceSettings.findOne();
    const user = await User.findById(userId);

    let shiftStartTime = "09:00";
    let graceMinutes = 15;

    if (settings && settings.defaultShift) {
      shiftStartTime = settings.defaultShift.startTime;
      graceMinutes = settings.defaultShift.graceTime;
    }

    const checkIn = new Date(checkInTime);
    const checkInHours = checkIn.getHours();
    const checkInMinutes = checkIn.getMinutes();

    const [shiftHour, shiftMinute] = shiftStartTime.split(":").map(Number);

    const checkInTotalMinutes = checkInHours * 60 + checkInMinutes;
    const shiftStartTotalMinutes = shiftHour * 60 + shiftMinute + graceMinutes;

    if (checkInTotalMinutes > shiftStartTotalMinutes) {
      return {
        isLate: true,
        minutesLate: checkInTotalMinutes - shiftStartTotalMinutes
      };
    }

    return { isLate: false, minutesLate: 0 };
  }
}

export default new AttendanceService();
