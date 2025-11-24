import cron from "node-cron";
import Attendance from "../../models/Attendance.js";
import User from "../../models/User.js";
import LeaveRequest from "../../models/LeaveRequest.js";
import AttendanceSettings from "../../models/AttendanceSettings.js";
import emailService from "../email/emailService.js";

/**
 * Auto-mark absent employees
 * Runs at 10:00 AM every day
 */
const autoMarkAbsent = cron.schedule(
  "0 10 * * *",
  async () => {
    try {
      console.log("[CRON] Running auto-mark absent job...");

      const settings = await AttendanceSettings.findOne();
      if (!settings || !settings.autoMarkAbsent.enabled) {
        console.log("[CRON] Auto-mark absent is disabled");
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if today is a weekend
      const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
      if (!settings.workingDays.includes(dayName)) {
        console.log("[CRON] Today is not a working day");
        return;
      }

      // Check if today is a holiday
      const isHoliday = settings.holidays.some((holiday) => {
        const holidayDate = new Date(holiday.date);
        holidayDate.setHours(0, 0, 0, 0);
        return holidayDate.getTime() === today.getTime();
      });

      if (isHoliday) {
        console.log("[CRON] Today is a holiday");
        return;
      }

      // Get all active employees
      const allEmployees = await User.find({ role: "employee", isActive: true });

      // Get attendance records for today
      const todayAttendances = await Attendance.find({ date: today });
      const checkedInUserIds = todayAttendances.map((a) => a.userId.toString());

      // Get employees on approved leave
      const leavesToday = await LeaveRequest.find({
        status: "approved",
        startDate: { $lte: today },
        endDate: { $gte: today },
      });
      const onLeaveUserIds = leavesToday.map((l) => l.userId.toString());

      // Find absentees (not checked in and not on leave)
      const absentees = allEmployees.filter((emp) => {
        const empId = emp._id.toString();
        return !checkedInUserIds.includes(empId) && !onLeaveUserIds.includes(empId);
      });

      // Mark absent
      const markedAbsent = [];
      for (const employee of absentees) {
        await Attendance.create({
          userId: employee._id,
          date: today,
          status: "absent",
          isManualEntry: true,
          adminNotes: "Auto-marked absent by system",
        });
        markedAbsent.push(employee);

        // Send absent notification to employee
        try {
          await emailService.sendAbsentNotification(employee);
        } catch (emailError) {
          console.error(`[CRON] Failed to send absent email to ${employee.email}:`, emailError);
        }
      }

      console.log(`[CRON] Marked ${markedAbsent.length} employees as absent`);

      // Send notification email to admin
      if (settings.notifications.absenteeAlert.enabled && markedAbsent.length > 0) {
        await emailService.sendAbsenteeAlert(markedAbsent, settings.notifications.adminEmails);
      }
    } catch (error) {
      console.error("[CRON] Error in auto-mark absent:", error);
    }
  },
  {
    scheduled: false,
  }
);

/**
 * Send check-in reminders
 * Runs at 8:45 AM every day
 */
const sendCheckInReminders = cron.schedule(
  "45 8 * * *",
  async () => {
    try {
      console.log("[CRON] Sending check-in reminders...");

      const settings = await AttendanceSettings.findOne();
      if (!settings) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if working day
      const dayName = today.toLocaleDateString("en-US", { weekday: "long" });
      if (!settings.workingDays.includes(dayName)) return;

      // Get all active employees
      const employees = await User.find({ role: "employee", isActive: true });

      // Get who already checked in
      const todayAttendances = await Attendance.find({ date: today });
      const checkedInUserIds = todayAttendances.map((a) => a.userId.toString());

      // Get employees on leave
      const leavesToday = await LeaveRequest.find({
        status: "approved",
        startDate: { $lte: today },
        endDate: { $gte: today },
      });
      const onLeaveUserIds = leavesToday.map((l) => l.userId.toString());

      // Filter employees who need reminder
      const needsReminder = employees.filter((emp) => {
        const empId = emp._id.toString();
        return !checkedInUserIds.includes(empId) && !onLeaveUserIds.includes(empId);
      });

      // Send reminders
      for (const employee of needsReminder) {
        await emailService.sendCheckInReminder(employee);
      }

      console.log(`[CRON] Sent check-in reminders to ${needsReminder.length} employees`);
    } catch (error) {
      console.error("[CRON] Error sending check-in reminders:", error);
    }
  },
  {
    scheduled: false,
  }
);

/**
 * Send check-out reminders
 * Runs at 6:00 PM every day
 */
const sendCheckOutReminders = cron.schedule(
  "0 18 * * *",
  async () => {
    try {
      console.log("[CRON] Sending check-out reminders...");

      const settings = await AttendanceSettings.findOne();
      if (!settings || !settings.notifications.missedCheckoutAlert.enabled) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Find employees who checked in but haven't checked out
      const attendances = await Attendance.find({
        date: today,
        "checkIn.time": { $exists: true },
        "checkOut.time": { $exists: false },
      }).populate("userId");

      for (const attendance of attendances) {
        if (attendance.userId) {
          await emailService.sendCheckOutReminder(attendance.userId);
        }
      }

      console.log(`[CRON] Sent check-out reminders to ${attendances.length} employees`);
    } catch (error) {
      console.error("[CRON] Error sending check-out reminders:", error);
    }
  },
  {
    scheduled: false,
  }
);

/**
 * Generate daily attendance report
 * Runs at 11:55 PM every day
 */
const generateDailyReport = cron.schedule(
  "55 23 * * *",
  async () => {
    try {
      console.log("[CRON] Generating daily attendance report...");

      const settings = await AttendanceSettings.findOne();
      if (!settings) return;

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get all attendance for today
      const attendances = await Attendance.find({ date: today }).populate(
        "userId",
        "fullName designation department"
      );

      const totalEmployees = await User.countDocuments({ role: "employee", isActive: true });
      const presentCount = attendances.filter(
        (a) => a.status === "present" || a.status === "late"
      ).length;
      const absentCount = totalEmployees - attendances.length;
      const lateCount = attendances.filter((a) => a.lateArrival.isLate).length;

      const report = {
        date: today,
        totalEmployees,
        presentCount,
        absentCount,
        lateCount,
        attendances,
      };

      // Send report to admin emails
      if (settings.notifications.adminEmails && settings.notifications.adminEmails.length > 0) {
        await emailService.sendDailyAttendanceReport(report, settings.notifications.adminEmails);
      }

      console.log("[CRON] Daily report generated and sent");
    } catch (error) {
      console.error("[CRON] Error generating daily report:", error);
    }
  },
  {
    scheduled: false,
  }
);

/**
 * Start all attendance cron jobs
 */
export const startAttendanceCronJobs = () => {
  console.log("[CRON] Starting attendance cron jobs...");
  autoMarkAbsent.start();
  sendCheckInReminders.start();
  sendCheckOutReminders.start();
  generateDailyReport.start();
  console.log("[CRON] Attendance cron jobs started successfully");
};

/**
 * Stop all attendance cron jobs
 */
export const stopAttendanceCronJobs = () => {
  console.log("[CRON] Stopping attendance cron jobs...");
  autoMarkAbsent.stop();
  sendCheckInReminders.stop();
  sendCheckOutReminders.stop();
  generateDailyReport.stop();
  console.log("[CRON] Attendance cron jobs stopped");
};

export default {
  startAttendanceCronJobs,
  stopAttendanceCronJobs,
};
