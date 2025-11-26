import mongoose from "mongoose";

const salaryHistorySchema = new mongoose.Schema(
  {
    // Employee Reference
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },

    // Salary Period
    month: {
      type: Number,
      required: true,
      min: 1,
      max: 12,
      index: true
    },
    year: {
      type: Number,
      required: true,
      index: true
    },

    // Base Salary
    baseSalary: {
      type: Number,
      required: true,
      default: 0
    },

    // Allowances & Bonuses
    allowances: [
      {
        type: {
          type: String,
          enum: [
            "house-rent",
            "transport",
            "medical",
            "meal",
            "mobile",
            "travel",
            "special",
            "other"
          ],
          required: true
        },
        amount: {
          type: Number,
          required: true,
          default: 0
        },
        description: {
          type: String,
          default: ""
        }
      }
    ],

    // Bonuses & Increments
    bonuses: [
      {
        type: {
          type: String,
          enum: [
            "performance",
            "annual",
            "project",
            "festival",
            "referral",
            "retention",
            "other"
          ],
          required: true
        },
        amount: {
          type: Number,
          required: true,
          default: 0
        },
        description: {
          type: String,
          default: ""
        },
        date: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // Increments (Permanent Salary Increase)
    increment: {
      previousSalary: {
        type: Number,
        default: 0
      },
      newSalary: {
        type: Number,
        default: 0
      },
      incrementAmount: {
        type: Number,
        default: 0
      },
      incrementPercentage: {
        type: Number,
        default: 0
      },
      effectiveDate: {
        type: Date
      },
      reason: {
        type: String,
        default: ""
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    },

    // Deductions
    deductions: [
      {
        type: {
          type: String,
          enum: [
            "tax",
            "provident-fund",
            "insurance",
            "loan",
            "advance",
            "late-fine",
            "absent-deduction",
            "damages",
            "other"
          ],
          required: true
        },
        amount: {
          type: Number,
          required: true,
          default: 0
        },
        description: {
          type: String,
          default: ""
        }
      }
    ],

    // Attendance-based Calculations
    attendanceDetails: {
      totalWorkingDays: {
        type: Number,
        default: 0
      },
      presentDays: {
        type: Number,
        default: 0
      },
      absentDays: {
        type: Number,
        default: 0
      },
      lateDays: {
        type: Number,
        default: 0
      },
      halfDays: {
        type: Number,
        default: 0
      },
      overtimeHours: {
        type: Number,
        default: 0
      },
      overtimeAmount: {
        type: Number,
        default: 0
      }
    },

    // Calculated Totals
    totalAllowances: {
      type: Number,
      default: 0
    },
    totalBonuses: {
      type: Number,
      default: 0
    },
    totalDeductions: {
      type: Number,
      default: 0
    },
    grossSalary: {
      type: Number,
      default: 0
    },
    netSalary: {
      type: Number,
      default: 0
    },

    // Payment Details
    paymentStatus: {
      type: String,
      enum: ["pending", "processing", "paid", "hold", "cancelled"],
      default: "pending",
      index: true
    },
    paymentDate: {
      type: Date
    },
    paymentMethod: {
      type: String,
      enum: ["bank-transfer", "cash", "cheque", "online"],
      default: "bank-transfer"
    },
    transactionId: {
      type: String,
      default: ""
    },

    // Admin Notes
    notes: {
      type: String,
      default: ""
    },
    adminNotes: {
      type: String,
      default: ""
    },

    // Employee Acknowledgment
    acknowledged: {
      type: Boolean,
      default: false
    },
    acknowledgedAt: {
      type: Date
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },

    // Audit Trail
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    isLocked: {
      type: Boolean,
      default: false // Once locked, cannot be edited
    },
    lockedAt: {
      type: Date
    },
    lockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }
  },
  {
    timestamps: true
  }
);

// Compound Index for unique salary per employee per month
salaryHistorySchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });

// Index for filtering by payment status
salaryHistorySchema.index({ paymentStatus: 1, year: 1, month: 1 });

// Calculate totals before saving
salaryHistorySchema.pre("save", function (next) {
  // Calculate total allowances
  this.totalAllowances = this.allowances.reduce(
    (sum, allowance) => sum + (allowance.amount || 0),
    0
  );

  // Calculate total bonuses
  this.totalBonuses = this.bonuses.reduce(
    (sum, bonus) => sum + (bonus.amount || 0),
    0
  );

  // Calculate total deductions
  this.totalDeductions = this.deductions.reduce(
    (sum, deduction) => sum + (deduction.amount || 0),
    0
  );

  // Calculate gross salary (base + allowances + bonuses + overtime)
  this.grossSalary =
    (this.baseSalary || 0) +
    this.totalAllowances +
    this.totalBonuses +
    (this.attendanceDetails?.overtimeAmount || 0);

  // Calculate net salary (gross - deductions)
  this.netSalary = this.grossSalary - this.totalDeductions;

  // Ensure net salary is not negative
  if (this.netSalary < 0) {
    this.netSalary = 0;
  }

  next();
});

// Method to lock salary record
salaryHistorySchema.methods.lockRecord = function (adminId) {
  this.isLocked = true;
  this.lockedAt = new Date();
  this.lockedBy = adminId;
  return this.save();
};

// Method to check if editable
salaryHistorySchema.methods.isEditable = function () {
  return !this.isLocked && this.paymentStatus !== "paid";
};

// Method to acknowledge salary by employee
salaryHistorySchema.methods.acknowledgeSalary = function (userId) {
  this.acknowledged = true;
  this.acknowledgedAt = new Date();
  this.acknowledgedBy = userId;
  return this.save();
};

// Method to check if employee can acknowledge
salaryHistorySchema.methods.canBeAcknowledged = function () {
  return !this.acknowledged && this.paymentStatus === "paid";
};

// Static method to get salary summary for a user
salaryHistorySchema.statics.getUserSalarySummary = async function (userId, year) {
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        year: year || new Date().getFullYear()
      }
    },
    {
      $group: {
        _id: null,
        totalGrossSalary: { $sum: "$grossSalary" },
        totalNetSalary: { $sum: "$netSalary" },
        totalDeductions: { $sum: "$totalDeductions" },
        totalBonuses: { $sum: "$totalBonuses" },
        averageNetSalary: { $avg: "$netSalary" },
        monthCount: { $sum: 1 }
      }
    }
  ]);
};

const SalaryHistory = mongoose.model("SalaryHistory", salaryHistorySchema);

export default SalaryHistory;
