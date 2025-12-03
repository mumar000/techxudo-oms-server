import mongoose from "mongoose";

const attendanceSettingsSchema = new mongoose.Schema(
  {
    // Organization reference to make settings organization-specific
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      unique: true, // Each organization can only have one set of settings
      index: true
    },

    // Office Timing Configuration
    workingDays: {
      type: [String],
      default: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]
    },

    // Holidays
    holidays: [
      {
        date: { type: Date, required: true },
        name: { type: String, required: true },
        type: {
          type: String,
          enum: ["public", "company", "optional"],
          default: "public"
        }
      }
    ],

    // Shift Configuration
    defaultShift: {
      name: {
        type: String,
        default: "Regular Shift"
      },
      startTime: {
        type: String,
        default: "09:00"
      },
      endTime: {
        type: String,
        default: "18:00"
      },
      graceTime: {
        type: Number,
        default: 15 // minutes
      },
      minimumHours: {
        type: Number,
        default: 8
      },
      breakTime: {
        type: Number,
        default: 60 // minutes
      }
    },

    // QR Code Settings
    qrCode: {
      enabled: {
        type: Boolean,
        default: true
      },
      secret: {
        type: String,
        default: ""
      },
      expiryMinutes: {
        type: Number,
        default: 5 // QR code valid for 5 minutes
      },
      officeCode: {
        type: String,
        default: "TECHXUDO-OFFICE"
      }
    },

    // IP Whitelist
    ipWhitelist: {
      enabled: {
        type: Boolean,
        default: false
      },
      allowedIPs: {
        type: [String],
        default: []
      }
    },

    // Geolocation Settings
    geofencing: {
      enabled: {
        type: Boolean,
        default: false
      },
      officeLocations: [
        {
          name: { type: String, required: true },
          latitude: { type: Number, required: true },
          longitude: { type: Number, required: true },
          radius: { type: Number, default: 100 } // in meters
        }
      ]
    },

    // Notification Settings
    notifications: {
      absenteeAlert: {
        enabled: { type: Boolean, default: true },
        time: { type: String, default: "10:00" }
      },
      lateArrivalAlert: {
        enabled: { type: Boolean, default: true }
      },
      missedCheckoutAlert: {
        enabled: { type: Boolean, default: true },
        time: { type: String, default: "19:00" }
      },
      adminEmails: {
        type: [String],
        default: []
      }
    },

    // Auto-mark Settings
    autoMarkAbsent: {
      enabled: {
        type: Boolean,
        default: true
      },
      afterTime: {
        type: String,
        default: "10:00"
      }
    },

    // Department-specific settings (optional for future)
    departments: [
      {
        name: { type: String },
        allowRemote: { type: Boolean, default: false },
        requireQR: { type: Boolean, default: true },
        requireGeolocation: { type: Boolean, default: false }
      }
    ]
  },
  {
    timestamps: true
  }
);

export default mongoose.model("AttendanceSettings", attendanceSettingsSchema);
