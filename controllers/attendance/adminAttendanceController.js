import Attendance from "../../models/Attendance.js";
import AttendanceRequest from "../../models/AttendanceRequest.js";
import AttendanceSettings from "../../models/AttendanceSettings.js";
import User from "../../models/User.js";
import attendanceService from "../../services/attendance/attendanceService.js";
import qrService from "../../services/attendance/qrService.js";

/**
 * Generate QR code for attendance
 * GET /api/attendance/admin/generate-qr
 */
export const generateQRCode = async (req, res) => {
  try {
    const qrData = await qrService.generateQRCode();
    res.json(qrData);
  } catch (error) {
    console.error("Error in generateQRCode:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all attendance records (with filters)
 * GET /api/attendance/admin/all
 */
export const getAllAttendance = async (req, res) => {
  try {
    const { userId, startDate, endDate, status, department, page = 1, limit = 50 } = req.query;

    const query = { organizationId: req.user.organizationId };

    if (userId) {
      query.userId = userId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    }

    if (status) {
      query.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    let attendances = await Attendance.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "fullName designation email department")
      .populate("markedBy", "fullName");

    // Filter by department if specified
    if (department) {
      attendances = attendances.filter((a) => a.userId?.department === department);
    }

    const total = await Attendance.countDocuments(query);

    res.json({
      attendances,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error in getAllAttendance:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get attendance for specific employee
 * GET /api/attendance/admin/employee/:userId
 */
export const getEmployeeAttendance = async (req, res) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate, page = 1, limit = 30 } = req.query;

    const query = {
      userId,
      organizationId: req.user.organizationId
    };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const attendances = await Attendance.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "fullName designation email department");

    const total = await Attendance.countDocuments(query);

    // Get statistics
    const stats = await attendanceService.getUserStats(userId, startDate, endDate);

    res.json({
      attendances,
      stats,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error in getEmployeeAttendance:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Manual attendance entry
 * POST /api/attendance/admin/manual-entry
 */
export const manualAttendanceEntry = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { userId, date, checkInTime, checkOutTime, status, notes } = req.body;

    if (!userId || !date) {
      return res.status(400).json({ message: "User ID and date are required" });
    }

    const attendanceDate = new Date(date);
    attendanceDate.setHours(0, 0, 0, 0);

    // Check if attendance already exists
    let attendance = await Attendance.findOne({
      userId,
      date: attendanceDate,
      organizationId: req.user.organizationId
    });

    if (attendance) {
      // Update existing
      if (checkInTime) {
        attendance.checkIn = {
          ...attendance.checkIn,
          time: new Date(checkInTime),
          method: "manual"
        };
      }
      if (checkOutTime) {
        attendance.checkOut = {
          ...attendance.checkOut,
          time: new Date(checkOutTime),
          method: "manual"
        };
      }
      if (status) {
        attendance.status = status;
      }
      attendance.isManualEntry = true;
      attendance.markedBy = adminId;
      if (notes) {
        attendance.adminNotes = notes;
      }

      // Ensure organizationId is set
      attendance.organizationId = req.user.organizationId;

      // Recalculate hours if both times present
      if (attendance.checkIn?.time && attendance.checkOut?.time) {
        attendance.calculateHours();
      }

      await attendance.save();
    } else {
      // Create new
      const attendanceData = {
        userId,
        organizationId: req.user.organizationId,
        date: attendanceDate,
        status: status || "present",
        isManualEntry: true,
        markedBy: adminId,
        adminNotes: notes || ""
      };

      if (checkInTime) {
        attendanceData.checkIn = {
          time: new Date(checkInTime),
          method: "manual"
        };
      }

      if (checkOutTime) {
        attendanceData.checkOut = {
          time: new Date(checkOutTime),
          method: "manual"
        };
      }

      attendance = await Attendance.create(attendanceData);

      // Calculate hours if both times present
      if (checkInTime && checkOutTime) {
        attendance.calculateHours();
        await attendance.save();
      }
    }

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate("userId", "fullName designation email")
      .populate("markedBy", "fullName");

    res.json({
      message: "Attendance marked successfully",
      attendance: populatedAttendance
    });
  } catch (error) {
    console.error("Error in manualAttendanceEntry:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update attendance
 * PUT /api/attendance/admin/:id
 */
export const updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const updates = req.body;

    const attendance = await Attendance.findOne({ _id: id, organizationId: req.user.organizationId });
    if (!attendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    // Update fields
    if (updates.checkInTime) {
      attendance.checkIn.time = new Date(updates.checkInTime);
    }
    if (updates.checkOutTime) {
      attendance.checkOut.time = new Date(updates.checkOutTime);
    }
    if (updates.status) {
      attendance.status = updates.status;
    }
    if (updates.adminNotes) {
      attendance.adminNotes = updates.adminNotes;
    }

    attendance.markedBy = adminId;
    attendance.isManualEntry = true;

    // Recalculate hours
    if (attendance.checkIn?.time && attendance.checkOut?.time) {
      attendance.calculateHours();
    }

    await attendance.save();

    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate("userId", "fullName designation email")
      .populate("markedBy", "fullName");

    res.json({
      message: "Attendance updated successfully",
      attendance: populatedAttendance
    });
  } catch (error) {
    console.error("Error in updateAttendance:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete attendance
 * DELETE /api/attendance/admin/:id
 */
export const deleteAttendance = async (req, res) => {
  try {
    const { id } = req.params;

    const attendance = await Attendance.findOneAndDelete({ _id: id, organizationId: req.user.organizationId });
    if (!attendance) {
      return res.status(404).json({ message: "Attendance not found" });
    }

    res.json({ message: "Attendance deleted successfully" });
  } catch (error) {
    console.error("Error in deleteAttendance:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get daily report
 * GET /api/attendance/admin/reports/daily
 */
export const getDailyReport = async (req, res) => {
  try {
    const { date = new Date() } = req.query;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Get all employees in the organization
    const totalEmployees = await User.countDocuments({
      role: "employee",
      isActive: true,
      organizationId: req.user.organizationId
    });

    // Get attendance for the date
    const attendances = await Attendance.find({
      date: targetDate,
      organizationId: req.user.organizationId
    }).populate(
      "userId",
      "fullName designation department"
    );

    const presentCount = attendances.filter(
      (a) => a.status === "present" || a.status === "late"
    ).length;
    const absentCount = totalEmployees - attendances.length;
    const lateCount = attendances.filter((a) => a.lateArrival.isLate).length;
    const onLeaveCount = attendances.filter((a) => a.status === "on-leave").length;

    const totalHours = attendances.reduce((sum, a) => sum + (a.hoursWorked || 0), 0);
    const averageHours = attendances.length > 0 ? totalHours / attendances.length : 0;

    // Get absentees and late arrivals
    const absentees = await attendanceService.getAbsentees(targetDate);
    const lateArrivals = await attendanceService.getLateArrivals(targetDate);

    res.json({
      date: targetDate,
      summary: {
        totalEmployees,
        presentCount,
        absentCount,
        lateCount,
        onLeaveCount,
        averageHours: Math.round(averageHours * 100) / 100
      },
      attendances,
      absentees,
      lateArrivals
    });
  } catch (error) {
    console.error("Error in getDailyReport:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get weekly report
 * GET /api/attendance/admin/reports/weekly
 */
export const getWeeklyReport = async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;

    // Default to current week if no dates provided
    const today = new Date();
    const start = startDate
      ? new Date(startDate)
      : new Date(today.setDate(today.getDate() - today.getDay())); // Start of week (Sunday)
    const end = endDate ? new Date(endDate) : new Date(today.setDate(today.getDate() + 6)); // End of week

    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const query = {
      date: {
        $gte: start,
        $lte: end
      }
    };

    if (userId) {
      query.userId = userId;
    }

    // Add organization filter to the query
    query.organizationId = req.user.organizationId;

    const attendances = await Attendance.find(query).populate(
      "userId",
      "fullName designation department"
    );

    // Group by date for daily breakdown
    const dailyStats = {};
    attendances.forEach((att) => {
      const dateKey = att.date.toISOString().split("T")[0];
      if (!dailyStats[dateKey]) {
        dailyStats[dateKey] = {
          date: dateKey,
          present: 0,
          late: 0,
          totalHours: 0
        };
      }
      if (att.status === "present" || att.status === "late") {
        dailyStats[dateKey].present++;
      }
      if (att.lateArrival?.isLate) {
        dailyStats[dateKey].late++;
      }
      dailyStats[dateKey].totalHours += att.hoursWorked || 0;
    });

    // Calculate totals
    const totalDays = attendances.length;
    const presentDays = attendances.filter((a) => a.status === "present" || a.status === "late")
      .length;
    const lateDays = attendances.filter((a) => a.lateArrival.isLate).length;
    const totalHours = attendances.reduce((sum, a) => sum + (a.hoursWorked || 0), 0);
    const averageHours = totalDays > 0 ? totalHours / totalDays : 0;

    res.json({
      period: {
        startDate: start,
        endDate: end
      },
      summary: {
        totalDays,
        presentDays,
        lateDays,
        totalHours: Math.round(totalHours * 100) / 100,
        averageHours: Math.round(averageHours * 100) / 100
      },
      dailyBreakdown: Object.values(dailyStats),
      attendances
    });
  } catch (error) {
    console.error("Error in getWeeklyReport:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get monthly report
 * GET /api/attendance/admin/reports/monthly
 */
export const getMonthlyReport = async (req, res) => {
  try {
    const { month, year, userId } = req.query;

    const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth();
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 0);

    const query = {
      date: {
        $gte: startDate,
        $lte: endDate
      }
    };

    if (userId) {
      query.userId = userId;
    }

    // Add organization filter to the query
    query.organizationId = req.user.organizationId;

    const attendances = await Attendance.find(query).populate(
      "userId",
      "fullName designation department"
    );

    // Calculate statistics
    const totalDays = attendances.length;
    const presentDays = attendances.filter((a) => a.status === "present" || a.status === "late")
      .length;
    const absentDays = attendances.filter((a) => a.status === "absent").length;
    const lateDays = attendances.filter((a) => a.lateArrival.isLate).length;
    const totalHours = attendances.reduce((sum, a) => sum + (a.hoursWorked || 0), 0);
    const averageHours = totalDays > 0 ? totalHours / totalDays : 0;

    res.json({
      period: {
        month: targetMonth + 1,
        year: targetYear,
        startDate,
        endDate
      },
      summary: {
        totalDays,
        presentDays,
        absentDays,
        lateDays,
        totalHours: Math.round(totalHours * 100) / 100,
        averageHours: Math.round(averageHours * 100) / 100
      },
      attendances
    });
  } catch (error) {
    console.error("Error in getMonthlyReport:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get dashboard statistics
 * GET /api/attendance/admin/statistics/dashboard
 */
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's stats
    const totalEmployees = await User.countDocuments({
      role: "employee",
      isActive: true,
      organizationId: req.user.organizationId
    });
    const todayAttendances = await Attendance.find({
      date: today,
      organizationId: req.user.organizationId
    });

    const presentToday = todayAttendances.filter(
      (a) => a.status === "present" || a.status === "late"
    ).length;
    const absentToday = totalEmployees - todayAttendances.length;
    const lateToday = todayAttendances.filter((a) => a.lateArrival.isLate).length;

    const todayHours = todayAttendances.reduce((sum, a) => sum + (a.hoursWorked || 0), 0);
    const averageHoursToday =
      todayAttendances.length > 0 ? todayHours / todayAttendances.length : 0;

    // This month's stats
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthAttendances = await Attendance.find({
      date: { $gte: monthStart, $lte: today },
      organizationId: req.user.organizationId
    });

    const avgAttendanceRate =
      totalEmployees > 0
        ? Math.round((monthAttendances.length / (totalEmployees * today.getDate())) * 100)
        : 0;

    res.json({
      today: {
        totalEmployees,
        present: presentToday,
        absent: absentToday,
        late: lateToday,
        averageHours: Math.round(averageHoursToday * 100) / 100
      },
      thisMonth: {
        totalRecords: monthAttendances.length,
        averageAttendanceRate: avgAttendanceRate
      }
    });
  } catch (error) {
    console.error("Error in getDashboardStats:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all correction requests
 * GET /api/attendance/admin/corrections
 */
export const getCorrectionRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const query = { organizationId: req.user.organizationId };
    if (status) {
      query.status = status;
    }

    const requests = await AttendanceRequest.find(query)
      .sort({ createdAt: -1 })
      .populate("userId", "fullName designation email")
      .populate("reviewedBy", "fullName")
      .populate("attendanceId");

    res.json(requests);
  } catch (error) {
    console.error("Error in getCorrectionRequests:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Review correction request (approve/reject)
 * PUT /api/attendance/admin/corrections/:id
 */
export const reviewCorrectionRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { status, comments } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const request = await AttendanceRequest.findOne({ _id: id, organizationId: req.user.organizationId });
    if (!request) {
      return res.status(404).json({ message: "Request not found" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already processed" });
    }

    // Update request
    request.status = status;
    request.reviewedBy = adminId;
    request.reviewedAt = new Date();
    request.adminComments = comments || "";
    await request.save();

    // If approved, update/create attendance record
    if (status === "approved") {
      const attendanceDate = new Date(request.requestedDate);
      attendanceDate.setHours(0, 0, 0, 0);

      let attendance = await Attendance.findOne({
        userId: request.userId,
        date: attendanceDate,
        organizationId: req.user.organizationId
      });

      if (attendance) {
        // Update existing
        if (request.requestedCheckIn) {
          attendance.checkIn.time = request.requestedCheckIn;
        }
        if (request.requestedCheckOut) {
          attendance.checkOut.time = request.requestedCheckOut;
        }
        attendance.calculateHours();
        await attendance.save();
      } else {
        // Create new
        attendance = await Attendance.create({
          userId: request.userId,
          organizationId: req.user.organizationId,
          date: attendanceDate,
          checkIn: request.requestedCheckIn
            ? { time: request.requestedCheckIn, method: "manual" }
            : undefined,
          checkOut: request.requestedCheckOut
            ? { time: request.requestedCheckOut, method: "manual" }
            : undefined,
          status: "present",
          isManualEntry: true,
          markedBy: adminId
        });

        if (request.requestedCheckIn && request.requestedCheckOut) {
          attendance.calculateHours();
          await attendance.save();
        }
      }
    }

    const populatedRequest = await AttendanceRequest.findById(request._id)
      .populate("userId", "fullName designation email")
      .populate("reviewedBy", "fullName");

    res.json({
      message: `Request ${status}`,
      request: populatedRequest
    });
  } catch (error) {
    console.error("Error in reviewCorrectionRequest:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get/Update attendance settings
 */
export const getSettings = async (req, res) => {
  try {
    let settings = await AttendanceSettings.findOne({ organizationId: req.user.organizationId });

    if (!settings) {
      // Create default settings for this organization
      settings = await AttendanceSettings.create({
        organizationId: req.user.organizationId
      });
    }

    res.json(settings);
  } catch (error) {
    console.error("Error in getSettings:", error);
    res.status(500).json({ message: error.message });
  }
};

export const updateSettings = async (req, res) => {
  try {
    let settings = await AttendanceSettings.findOne({ organizationId: req.user.organizationId });

    if (!settings) {
      settings = await AttendanceSettings.create({
        ...req.body,
        organizationId: req.user.organizationId
      });
    } else {
      // Update settings - use findOneAndUpdate to handle nested objects properly
      settings = await AttendanceSettings.findOneAndUpdate(
        { organizationId: req.user.organizationId },
        { $set: req.body },
        { new: true, runValidators: true }
      );
    }

    res.json({
      message: "Settings updated successfully",
      settings
    });
  } catch (error) {
    console.error("Error in updateSettings:", error);
    // Return more detailed error information
    if (error.name === "ValidationError") {
      return res.status(400).json({
        message: "Validation error",
        errors: Object.keys(error.errors).map(key => ({
          field: key,
          message: error.errors[key].message
        }))
      });
    }
    res.status(500).json({ message: error.message });
  }
};
