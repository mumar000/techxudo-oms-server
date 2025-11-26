import SalaryHistory from "../../models/SalaryHistory.js";
import User from "../../models/User.js";
import Attendance from "../../models/Attendance.js";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import Papa from "papaparse";

class SalaryService {
  /**
   * Get user salary summary for a year
   */
  async getUserSalarySummary(userId, year) {
    const salaries = await SalaryHistory.find({
      userId,
      year
    }).lean();

    if (salaries.length === 0) {
      return {
        totalGrossSalary: 0,
        totalNetSalary: 0,
        totalDeductions: 0,
        totalBonuses: 0,
        totalAllowances: 0,
        averageNetSalary: 0,
        monthCount: 0,
        highestSalary: 0,
        lowestSalary: 0
      };
    }

    const totalGrossSalary = salaries.reduce((sum, s) => sum + s.grossSalary, 0);
    const totalNetSalary = salaries.reduce((sum, s) => sum + s.netSalary, 0);
    const totalDeductions = salaries.reduce((sum, s) => sum + s.totalDeductions, 0);
    const totalBonuses = salaries.reduce((sum, s) => sum + s.totalBonuses, 0);
    const totalAllowances = salaries.reduce((sum, s) => sum + s.totalAllowances, 0);

    const netSalaries = salaries.map((s) => s.netSalary);
    const highestSalary = Math.max(...netSalaries);
    const lowestSalary = Math.min(...netSalaries);

    return {
      totalGrossSalary,
      totalNetSalary,
      totalDeductions,
      totalBonuses,
      totalAllowances,
      averageNetSalary: totalNetSalary / salaries.length,
      monthCount: salaries.length,
      highestSalary,
      lowestSalary,
      year
    };
  }

  /**
   * Get salaries for export
   */
  async getSalariesForExport(userId, year, startMonth, endMonth) {
    const query = { userId };

    if (year) {
      query.year = year;
    }

    if (startMonth && endMonth) {
      query.$and = [{ month: { $gte: startMonth } }, { month: { $lte: endMonth } }];
    }

    return await SalaryHistory.find(query)
      .sort({ year: -1, month: -1 })
      .populate("userId", "fullName email designation department")
      .lean();
  }

  /**
   * Get all salaries for export (Admin)
   */
  async getAllSalariesForExport(year, month) {
    const query = {};

    if (year) {
      query.year = year;
    }
    if (month) {
      query.month = month;
    }

    return await SalaryHistory.find(query)
      .sort({ year: -1, month: -1 })
      .populate("userId", "fullName email designation department employeeId")
      .lean();
  }

  /**
   * Generate CSV for employee
   */
  async generateCSV(salaries, user) {
    const data = salaries.map((salary) => ({
      Month: salary.month,
      Year: salary.year,
      "Base Salary": salary.baseSalary,
      Allowances: salary.totalAllowances,
      Bonuses: salary.totalBonuses,
      Overtime: salary.attendanceDetails?.overtimeAmount || 0,
      "Gross Salary": salary.grossSalary,
      Deductions: salary.totalDeductions,
      "Net Salary": salary.netSalary,
      "Payment Status": salary.paymentStatus,
      "Payment Date": salary.paymentDate || "N/A"
    }));

    const csv = Papa.unparse(data);
    return csv;
  }

  /**
   * Generate bulk CSV for admin
   */
  async generateBulkCSV(salaries) {
    const data = salaries.map((salary) => ({
      "Employee Name": salary.userId?.fullName || "N/A",
      Email: salary.userId?.email || "N/A",
      Department: salary.userId?.department || "N/A",
      Designation: salary.userId?.designation || "N/A",
      Month: salary.month,
      Year: salary.year,
      "Base Salary": salary.baseSalary,
      Allowances: salary.totalAllowances,
      Bonuses: salary.totalBonuses,
      "Gross Salary": salary.grossSalary,
      Deductions: salary.totalDeductions,
      "Net Salary": salary.netSalary,
      "Payment Status": salary.paymentStatus
    }));

    const csv = Papa.unparse(data);
    return csv;
  }

  /**
   * Generate PDF for employee
   */
  async generatePDF(salaries, user) {
    try {
      const pdfDoc = await PDFDocument.create();
      const timesRomanFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const timesBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const page = pdfDoc.addPage([595, 842]); // A4 size
      const { width, height } = page.getSize();

      // Header
      page.drawText("Salary History", {
        x: 200,
        y: height - 50,
        size: 20,
        font: timesBoldFont,
        color: rgb(0, 0, 0)
      });

      page.drawText(`Employee: ${user.fullName}`, {
        x: 50,
        y: height - 90,
        size: 12,
        font: timesRomanFont
      });

      page.drawText(`Email: ${user.email}`, {
        x: 50,
        y: height - 110,
        size: 12,
        font: timesRomanFont
      });

      page.drawText(`Department: ${user.department || "N/A"}`, {
        x: 50,
        y: height - 130,
        size: 12,
        font: timesRomanFont
      });

      // Table header
      let yPosition = height - 170;
      const tableHeaders = [
        { label: "Month/Year", x: 50 },
        { label: "Base", x: 150 },
        { label: "Allowances", x: 220 },
        { label: "Bonuses", x: 310 },
        { label: "Deductions", x: 380 },
        { label: "Net Salary", x: 470 }
      ];

      tableHeaders.forEach((header) => {
        page.drawText(header.label, {
          x: header.x,
          y: yPosition,
          size: 10,
          font: timesBoldFont
        });
      });

      // Draw line
      yPosition -= 5;
      page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: 550, y: yPosition },
        thickness: 1,
        color: rgb(0, 0, 0)
      });

      // Table rows
      yPosition -= 20;
      salaries.forEach((salary) => {
        if (yPosition < 50) {
          // Add new page if needed
          return;
        }

        page.drawText(`${salary.month}/${salary.year}`, {
          x: 50,
          y: yPosition,
          size: 9,
          font: timesRomanFont
        });
        page.drawText(salary.baseSalary.toFixed(0), {
          x: 150,
          y: yPosition,
          size: 9,
          font: timesRomanFont
        });
        page.drawText(salary.totalAllowances.toFixed(0), {
          x: 220,
          y: yPosition,
          size: 9,
          font: timesRomanFont
        });
        page.drawText(salary.totalBonuses.toFixed(0), {
          x: 310,
          y: yPosition,
          size: 9,
          font: timesRomanFont
        });
        page.drawText(salary.totalDeductions.toFixed(0), {
          x: 380,
          y: yPosition,
          size: 9,
          font: timesRomanFont
        });
        page.drawText(salary.netSalary.toFixed(0), {
          x: 470,
          y: yPosition,
          size: 9,
          font: timesRomanFont
        });

        yPosition -= 20;
      });

      // Footer
      page.drawText(`Generated on ${new Date().toLocaleDateString()}`, {
        x: 200,
        y: 30,
        size: 8,
        font: timesRomanFont
      });

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Generate bulk PDF for admin
   */
  async generateBulkPDF(salaries) {
    try {
      const pdfDoc = await PDFDocument.create();
      const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const page = pdfDoc.addPage([842, 595]); // A4 Landscape
      const { width, height } = page.getSize();

      // Header
      page.drawText("All Employees Salary Report", {
        x: 250,
        y: height - 50,
        size: 18,
        font: boldFont
      });

      // Table header
      let yPosition = height - 100;
      const tableHeaders = [
        { label: "Employee", x: 50 },
        { label: "Dept", x: 160 },
        { label: "Month/Yr", x: 230 },
        { label: "Base", x: 300 },
        { label: "Allow", x: 370 },
        { label: "Bonus", x: 430 },
        { label: "Deduct", x: 490 },
        { label: "Net", x: 560 },
        { label: "Status", x: 640 }
      ];

      tableHeaders.forEach((header) => {
        page.drawText(header.label, {
          x: header.x,
          y: yPosition,
          size: 9,
          font: boldFont
        });
      });

      // Draw line
      yPosition -= 5;
      page.drawLine({
        start: { x: 50, y: yPosition },
        end: { x: 750, y: yPosition },
        thickness: 1
      });

      // Table rows
      yPosition -= 20;
      salaries.slice(0, 25).forEach((salary) => {
        // Limit to first 25 for single page
        if (yPosition < 100) {
          return;
        }

        page.drawText(
          (salary.userId?.fullName?.substring(0, 15) || "N/A"),
          { x: 50, y: yPosition, size: 8, font }
        );
        page.drawText(
          (salary.userId?.department?.substring(0, 10) || "N/A"),
          { x: 160, y: yPosition, size: 8, font }
        );
        page.drawText(
          `${salary.month}/${salary.year}`,
          { x: 230, y: yPosition, size: 8, font }
        );
        page.drawText(
          salary.baseSalary.toFixed(0),
          { x: 300, y: yPosition, size: 8, font }
        );
        page.drawText(
          salary.totalAllowances.toFixed(0),
          { x: 370, y: yPosition, size: 8, font }
        );
        page.drawText(
          salary.totalBonuses.toFixed(0),
          { x: 430, y: yPosition, size: 8, font }
        );
        page.drawText(
          salary.totalDeductions.toFixed(0),
          { x: 490, y: yPosition, size: 8, font }
        );
        page.drawText(
          salary.netSalary.toFixed(0),
          { x: 560, y: yPosition, size: 8, font }
        );
        page.drawText(
          salary.paymentStatus,
          { x: 640, y: yPosition, size: 8, font }
        );

        yPosition -= 18;
      });

      // Summary
      const totalNet = salaries.reduce((sum, s) => sum + s.netSalary, 0);
      yPosition -= 20;
      page.drawText(`Total Employees: ${salaries.length}`, {
        x: 50,
        y: yPosition,
        size: 10,
        font: boldFont
      });
      page.drawText(`Total Payout: ${totalNet.toFixed(0)}`, {
        x: 50,
        y: yPosition - 20,
        size: 10,
        font: boldFont
      });

      // Footer
      page.drawText(`Generated on ${new Date().toLocaleDateString()}`, {
        x: 300,
        y: 30,
        size: 8,
        font
      });

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate totals for a query
   */
  async calculateTotals(query) {
    const result = await SalaryHistory.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalGrossSalary: { $sum: "$grossSalary" },
          totalNetSalary: { $sum: "$netSalary" },
          totalDeductions: { $sum: "$totalDeductions" },
          totalBonuses: { $sum: "$totalBonuses" },
          totalAllowances: { $sum: "$totalAllowances" },
          count: { $sum: 1 }
        }
      }
    ]);

    return result.length > 0 ? result[0] : {
      totalGrossSalary: 0,
      totalNetSalary: 0,
      totalDeductions: 0,
      totalBonuses: 0,
      totalAllowances: 0,
      count: 0
    };
  }

  /**
   * Bulk generate salaries for all active employees
   */
  async bulkGenerateSalaries(month, year, adminId) {
    // Check if salaries already exist
    const existingCount = await SalaryHistory.countDocuments({ month, year });
    if (existingCount > 0) {
      throw new Error(`Salaries for ${month}/${year} already exist. Delete them first.`);
    }

    // Get all active employees
    const employees = await User.find({ role: "employee", isActive: true }).lean();

    if (employees.length === 0) {
      throw new Error("No active employees found");
    }

    // Calculate attendance for the month
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const salaries = [];
    let successCount = 0;
    let failureCount = 0;
    const errors = [];

    for (const employee of employees) {
      try {
        // Get attendance data for the month
        const attendances = await Attendance.find({
          userId: employee._id,
          date: { $gte: startDate, $lte: endDate }
        }).lean();

        const totalWorkingDays = endDate.getDate();
        const presentDays = attendances.filter(
          (a) => a.status === "present" || a.status === "late"
        ).length;
        const absentDays = attendances.filter((a) => a.status === "absent").length;
        const lateDays = attendances.filter((a) => a.lateArrival?.isLate).length;
        const overtimeHours = attendances.reduce(
          (sum, a) => sum + (a.overtimeHours || 0),
          0
        );

        // Calculate deduction for absences
        const perDaySalary = employee.salary / totalWorkingDays;
        const absentDeduction = absentDays * perDaySalary;

        const deductions = [];
        if (absentDeduction > 0) {
          deductions.push({
            type: "absent-deduction",
            amount: absentDeduction,
            description: `${absentDays} days absent`
          });
        }

        // Create salary entry
        const salary = await SalaryHistory.create({
          userId: employee._id,
          month,
          year,
          baseSalary: employee.salary || 0,
          deductions,
          attendanceDetails: {
            totalWorkingDays,
            presentDays,
            absentDays,
            lateDays,
            overtimeHours
          },
          createdBy: adminId,
          paymentStatus: "pending"
        });

        salaries.push(salary);
        successCount++;
      } catch (error) {
        failureCount++;
        errors.push({
          employeeName: employee.fullName,
          error: error.message
        });
      }
    }

    return {
      successCount,
      failureCount,
      totalEmployees: employees.length,
      errors: errors.length > 0 ? errors : undefined
    };
  }

  /**
   * Get salary statistics
   */
  async getSalaryStatistics(year, month) {
    const query = { year };
    if (month) {
      query.month = month;
    }

    const stats = await SalaryHistory.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$paymentStatus",
          count: { $sum: 1 },
          totalAmount: { $sum: "$netSalary" }
        }
      }
    ]);

    const totals = await this.calculateTotals(query);

    // Get department-wise breakdown
    const departmentStats = await SalaryHistory.aggregate([
      { $match: query },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user"
        }
      },
      { $unwind: "$user" },
      {
        $group: {
          _id: "$user.department",
          count: { $sum: 1 },
          totalAmount: { $sum: "$netSalary" },
          avgSalary: { $avg: "$netSalary" }
        }
      }
    ]);

    return {
      statusBreakdown: stats,
      departmentBreakdown: departmentStats,
      ...totals
    };
  }
}

export default new SalaryService();
