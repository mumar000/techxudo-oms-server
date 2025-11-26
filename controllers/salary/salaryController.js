import SalaryHistory from "../../models/SalaryHistory.js";
import User from "../../models/User.js";
import mongoose from "mongoose";
import salaryService from "../../services/salary/salaryService.js";

/**
 * EMPLOYEE ENDPOINTS
 */

/**
 * Get my salary history
 * GET /api/salary/my-history
 */
export const getMySalaryHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year, month, page = 1, limit = 12 } = req.query;

    const query = { userId };

    if (year) {
      query.year = parseInt(year);
    }
    if (month) {
      query.month = parseInt(month);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const salaries = await SalaryHistory.find(query)
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("createdBy updatedBy", "fullName email")
      .lean();

    const total = await SalaryHistory.countDocuments(query);

    res.json({
      salaries,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Error in getMySalaryHistory:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get my current month salary
 * GET /api/salary/my-current
 */
export const getMyCurrentSalary = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const salary = await SalaryHistory.findOne({
      userId,
      month: currentMonth,
      year: currentYear
    })
      .populate("createdBy updatedBy", "fullName email")
      .lean();

    res.json(salary);
  } catch (error) {
    console.error("Error in getMyCurrentSalary:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get my salary summary
 * GET /api/salary/my-summary
 */
export const getMySalarySummary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { year } = req.query;

    const summary = await salaryService.getUserSalarySummary(
      userId,
      year ? parseInt(year) : new Date().getFullYear()
    );

    res.json(summary);
  } catch (error) {
    console.error("Error in getMySalarySummary:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Export my salary history (PDF/CSV)
 * GET /api/salary/my-export
 */
export const exportMySalary = async (req, res) => {
  try {
    const userId = req.user.id;
    const { format = "csv", year, startMonth, endMonth } = req.query;

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const salaries = await salaryService.getSalariesForExport(
      userId,
      year ? parseInt(year) : null,
      startMonth ? parseInt(startMonth) : null,
      endMonth ? parseInt(endMonth) : null
    );

    if (format === "csv") {
      const csv = await salaryService.generateCSV(salaries, user);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="salary-history-${user.fullName}-${year || "all"}.csv"`
      );
      return res.send(csv);
    } else if (format === "pdf") {
      const pdf = await salaryService.generatePDF(salaries, user);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="salary-history-${user.fullName}-${year || "all"}.pdf"`
      );
      return res.send(pdf);
    } else {
      return res.status(400).json({ message: "Invalid export format" });
    }
  } catch (error) {
    console.error("Error in exportMySalary:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * ADMIN ENDPOINTS
 */

/**
 * Get all salary history with filters
 * GET /api/salary/admin/all
 */
export const getAllSalaryHistory = async (req, res) => {
  try {
    const {
      year,
      month,
      userId,
      paymentStatus,
      department,
      page = 1,
      limit = 50,
      search
    } = req.query;

    let query = {};

    if (year) {
      query.year = parseInt(year);
    }
    if (month) {
      query.month = parseInt(month);
    }
    if (userId) {
      query.userId = userId;
    }
    if (paymentStatus) {
      query.paymentStatus = paymentStatus;
    }

    // Search by employee name
    let userIds = null;
    if (search || department) {
      const userQuery = {};
      if (search) {
        userQuery.$or = [
          { fullName: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } }
        ];
      }
      if (department) {
        userQuery.department = department;
      }

      const users = await User.find(userQuery).select("_id");
      userIds = users.map((u) => u._id);
      query.userId = { $in: userIds };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const salaries = await SalaryHistory.find(query)
      .sort({ year: -1, month: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "fullName email designation department")
      .populate("createdBy updatedBy", "fullName email")
      .lean();

    const total = await SalaryHistory.countDocuments(query);

    // Calculate totals
    const totals = await salaryService.calculateTotals(query);

    res.json({
      salaries,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit))
      },
      totals
    });
  } catch (error) {
    console.error("Error in getAllSalaryHistory:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get salary by ID
 * GET /api/salary/admin/:id
 */
export const getSalaryById = async (req, res) => {
  try {
    const { id } = req.params;

    const salary = await SalaryHistory.findById(id)
      .populate("userId", "fullName email designation department salary")
      .populate("createdBy updatedBy lockedBy", "fullName email")
      .populate("increment.approvedBy", "fullName email");

    if (!salary) {
      return res.status(404).json({ message: "Salary record not found" });
    }

    res.json(salary);
  } catch (error) {
    console.error("Error in getSalaryById:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Create salary entry
 * POST /api/salary/admin/create
 */
export const createSalaryEntry = async (req, res) => {
  try {
    const adminId = req.user.id;
    const {
      userId,
      month,
      year,
      baseSalary,
      allowances,
      bonuses,
      increment,
      deductions,
      attendanceDetails,
      notes
    } = req.body;

    // Validate required fields
    if (!userId || !month || !year || baseSalary === undefined) {
      return res.status(400).json({
        message: "userId, month, year, and baseSalary are required"
      });
    }

    // Check if userId is an email address
    let actualUserId = userId;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      // If userId is not a valid ObjectId, assume it's an email and find the user
      const user = await User.findOne({ email: userId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      actualUserId = user._id;
    }

    // Check if salary already exists for this month
    const existing = await SalaryHistory.findOne({ userId: actualUserId, month, year });
    if (existing) {
      return res.status(400).json({
        message: `Salary for ${month}/${year} already exists. Use update instead.`
      });
    }

    // Get user's current salary if not provided
    let finalBaseSalary = baseSalary;
    if (!baseSalary || baseSalary === 0) {
      const user = await User.findById(actualUserId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      finalBaseSalary = user.salary || 0;
    }

    // Create salary entry
    const salary = await SalaryHistory.create({
      userId: actualUserId,
      month: parseInt(month),
      year: parseInt(year),
      baseSalary: finalBaseSalary,
      allowances: allowances || [],
      bonuses: bonuses || [],
      increment: increment || {},
      deductions: deductions || [],
      attendanceDetails: attendanceDetails || {},
      notes: notes || "",
      createdBy: adminId
    });

    const populatedSalary = await SalaryHistory.findById(salary._id)
      .populate("userId", "fullName email designation department")
      .populate("createdBy", "fullName email");

    res.status(201).json({
      message: "Salary entry created successfully",
      salary: populatedSalary
    });
  } catch (error) {
    console.error("Error in createSalaryEntry:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update salary entry
 * PUT /api/salary/admin/:id
 */
export const updateSalaryEntry = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;
    const updateData = req.body;

    const salary = await SalaryHistory.findById(id);
    if (!salary) {
      return res.status(404).json({ message: "Salary record not found" });
    }

    // Check if editable
    if (!salary.isEditable()) {
      return res.status(403).json({
        message: "This salary record is locked or already paid and cannot be edited"
      });
    }

    // Update fields
    const allowedFields = [
      "baseSalary",
      "allowances",
      "bonuses",
      "increment",
      "deductions",
      "attendanceDetails",
      "paymentStatus",
      "paymentDate",
      "paymentMethod",
      "transactionId",
      "notes",
      "adminNotes"
    ];

    allowedFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        salary[field] = updateData[field];
      }
    });

    salary.updatedBy = adminId;
    await salary.save();

    const updatedSalary = await SalaryHistory.findById(id)
      .populate("userId", "fullName email designation department")
      .populate("createdBy updatedBy", "fullName email");

    res.json({
      message: "Salary entry updated successfully",
      salary: updatedSalary
    });
  } catch (error) {
    console.error("Error in updateSalaryEntry:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete salary entry
 * DELETE /api/salary/admin/:id
 */
export const deleteSalaryEntry = async (req, res) => {
  try {
    const { id } = req.params;

    const salary = await SalaryHistory.findById(id);
    if (!salary) {
      return res.status(404).json({ message: "Salary record not found" });
    }

    // Check if editable
    if (!salary.isEditable()) {
      return res.status(403).json({
        message:
          "This salary record is locked or already paid and cannot be deleted"
      });
    }

    await salary.deleteOne();

    res.json({ message: "Salary entry deleted successfully" });
  } catch (error) {
    console.error("Error in deleteSalaryEntry:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Lock salary entry (prevent further edits)
 * POST /api/salary/admin/:id/lock
 */
export const lockSalaryEntry = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { id } = req.params;

    const salary = await SalaryHistory.findById(id);
    if (!salary) {
      return res.status(404).json({ message: "Salary record not found" });
    }

    if (salary.isLocked) {
      return res.status(400).json({ message: "Salary record is already locked" });
    }

    await salary.lockRecord(adminId);

    res.json({ message: "Salary entry locked successfully" });
  } catch (error) {
    console.error("Error in lockSalaryEntry:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Bulk generate salaries for all employees
 * POST /api/salary/admin/bulk-generate
 */
export const bulkGenerateSalaries = async (req, res) => {
  try {
    const adminId = req.user.id;
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ message: "Month and year are required" });
    }

    const result = await salaryService.bulkGenerateSalaries(
      parseInt(month),
      parseInt(year),
      adminId
    );

    res.json({
      message: "Salaries generated successfully",
      ...result
    });
  } catch (error) {
    console.error("Error in bulkGenerateSalaries:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get salary statistics
 * GET /api/salary/admin/statistics
 */
export const getSalaryStatistics = async (req, res) => {
  try {
    const { year, month } = req.query;

    const stats = await salaryService.getSalaryStatistics(
      year ? parseInt(year) : new Date().getFullYear(),
      month ? parseInt(month) : null
    );

    res.json(stats);
  } catch (error) {
    console.error("Error in getSalaryStatistics:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Export all salaries (Admin)
 * GET /api/salary/admin/export
 */
export const exportAllSalaries = async (req, res) => {
  try {
    const { format = "csv", year, month } = req.query;

    const salaries = await salaryService.getAllSalariesForExport(
      year ? parseInt(year) : null,
      month ? parseInt(month) : null
    );

    if (format === "csv") {
      const csv = await salaryService.generateBulkCSV(salaries);
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="all-salaries-${year || "all"}-${month || "all"}.csv"`
      );
      return res.send(csv);
    } else if (format === "pdf") {
      const pdf = await salaryService.generateBulkPDF(salaries);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="all-salaries-${year || "all"}-${month || "all"}.pdf"`
      );
      return res.send(pdf);
    } else {
      return res.status(400).json({ message: "Invalid export format" });
    }
  } catch (error) {
    console.error("Error in exportAllSalaries:", error);
    res.status(500).json({ message: error.message });
  }
};
