import mongoose from "mongoose";

const attendanceRequestSchema = new mongoose.Schema(
  {
    // Employee who made the request
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    // Reference to existing attendance (if correcting)
    attendanceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Attendance"
    },

    // Request Type
    requestType: {
      type: String,
      enum: [
        "forgot-checkin",
        "forgot-checkout",
        "correction",
        "late-approval"
      ],
      required: true
    },

    // Requested Details
    requestedDate: {
      type: Date,
      required: true
    },
    requestedCheckIn: {
      type: Date
    },
    requestedCheckOut: {
      type: Date
    },

    // Reason and Supporting Documents
    reason: {
      type: String,
      required: true
    },
    attachments: [
      {
        type: String // Cloudinary URLs
      }
    ],

    // Status
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true
    },

    // Admin Review
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    reviewedAt: {
      type: Date
    },
    adminComments: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
attendanceRequestSchema.index({ userId: 1, createdAt: -1 });
attendanceRequestSchema.index({ status: 1, createdAt: -1 });

// Organization-based indexes
attendanceRequestSchema.index({ organizationId: 1, userId: 1 });
attendanceRequestSchema.index({ organizationId: 1, status: 1 });
attendanceRequestSchema.index({ organizationId: 1, createdAt: -1 });

export default mongoose.model("AttendanceRequest", attendanceRequestSchema);
