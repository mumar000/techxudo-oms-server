import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema(
  {
    // Core Fields
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    date: {
      type: Date,
      required: true,
      index: true
    },

    // Check-in Details
    checkIn: {
      time: {
        type: Date
      },
      method: {
        type: String,
        enum: ["manual", "qr", "auto"],
        default: "manual"
      },
      ipAddress: {
        type: String
      },
      deviceInfo: {
        type: String
      },
      qrCode: {
        type: String // QR code data that was scanned
      },
      location: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String }
      },
      notes: {
        type: String
      }
    },

    // Check-out Details
    checkOut: {
      time: {
        type: Date
      },
      method: {
        type: String,
        enum: ["manual", "qr", "auto"]
      },
      ipAddress: {
        type: String
      },
      deviceInfo: {
        type: String
      },
      qrCode: {
        type: String
      },
      location: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String }
      },
      notes: {
        type: String
      }
    },

    // Calculated Fields
    hoursWorked: {
      type: Number,
      default: 0
    },
    overtimeHours: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: [
        "present",
        "absent",
        "late",
        "half-day",
        "on-leave",
        "holiday",
        "weekend"
      ],
      default: "present",
      index: true
    },

    // Work Details
    workType: {
      type: String,
      enum: ["office", "remote", "hybrid", "field"],
      default: "office"
    },

    // Late/Early Tracking
    lateArrival: {
      isLate: {
        type: Boolean,
        default: false
      },
      minutesLate: {
        type: Number,
        default: 0
      },
      reason: {
        type: String
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    },

    earlyDeparture: {
      isEarly: {
        type: Boolean,
        default: false
      },
      minutesEarly: {
        type: Number,
        default: 0
      },
      reason: {
        type: String
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    },

    // Admin Actions
    isManualEntry: {
      type: Boolean,
      default: false
    },
    markedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    adminNotes: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Compound index for unique attendance per user per day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

// Index for efficient queries
attendanceSchema.index({ status: 1, createdAt: -1 });
attendanceSchema.index({ date: -1 });

// Method to calculate hours worked
attendanceSchema.methods.calculateHours = function () {
  if (this.checkIn?.time && this.checkOut?.time) {
    const diffMs = this.checkOut.time - this.checkIn.time;
    const hours = diffMs / (1000 * 60 * 60);
    this.hoursWorked = Math.round(hours * 100) / 100; // Round to 2 decimal places

    // Calculate overtime (if more than 8 hours)
    if (hours > 8) {
      this.overtimeHours = Math.round((hours - 8) * 100) / 100;
    }
  }
  return this.hoursWorked;
};

// Method to check if late
attendanceSchema.methods.checkIfLate = function (shiftStartTime = "09:00", graceMinutes = 15) {
  if (!this.checkIn?.time) return false;

  const checkInTime = new Date(this.checkIn.time);
  const checkInHours = checkInTime.getHours();
  const checkInMinutes = checkInTime.getMinutes();

  const [shiftHour, shiftMinute] = shiftStartTime.split(":").map(Number);

  // Calculate total minutes from midnight
  const checkInTotalMinutes = checkInHours * 60 + checkInMinutes;
  const shiftStartTotalMinutes = shiftHour * 60 + shiftMinute + graceMinutes;

  if (checkInTotalMinutes > shiftStartTotalMinutes) {
    this.lateArrival.isLate = true;
    this.lateArrival.minutesLate = checkInTotalMinutes - shiftStartTotalMinutes;
    this.status = "late";
    return true;
  }

  return false;
};

export default mongoose.model("Attendance", attendanceSchema);
