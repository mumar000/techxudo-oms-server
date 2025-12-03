import mongoose from "mongoose";
import crypto from "crypto";

const onboardingSchema = new mongoose.Schema(
  {
    // Employee Reference
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true
    },

    // Onboarding Token
    token: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    tokenExpiry: {
      type: Date,
      required: true,
      index: true
    },

    // Status Tracking
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed", "expired", "revoked"],
      default: "pending",
      required: true,
      index: true
    },

    // Offer Details (snapshot at time of creation)
    offerDetails: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      designation: { type: String, required: true },
      department: { type: String, default: "" },
      salary: { type: Number, required: true },
      joiningDate: { type: Date, required: true },
      phone: { type: String, required: true }
    },

    // Acceptance/Rejection Details
    respondedAt: { type: Date },
    rejectionReason: { type: String },

    // Onboarding Completion Details
    completedAt: { type: Date },

    // Revocation Details (Admin can revoke after acceptance)
    revokedAt: { type: Date },
    revokedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    revocationReason: { type: String },

    // Reminder Tracking
    reminders: [
      {
        sentAt: { type: Date, required: true },
        type: { type: String, enum: ["first", "second", "final"], required: true }
      }
    ],

    // Metadata
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

// Generate unique onboarding token
onboardingSchema.methods.generateToken = function () {
  const token = crypto.randomBytes(32).toString("hex");
  this.token = crypto.createHash("sha256").update(token).digest("hex");
  this.tokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  return token;
};

// Check if token is expired
onboardingSchema.methods.isExpired = function () {
  return this.tokenExpiry < new Date();
};

// Check if reminders should be sent
onboardingSchema.methods.shouldSendReminder = function (type) {
  const now = Date.now();
  const createdAt = this.createdAt.getTime();
  const daysSinceCreation = (now - createdAt) / (1000 * 60 * 60 * 24);

  const reminderSent = this.reminders.some((r) => r.type === type);

  if (type === "first" && daysSinceCreation >= 3 && !reminderSent) {
    return true;
  }
  if (type === "second" && daysSinceCreation >= 5 && !reminderSent) {
    return true;
  }
  if (type === "final" && daysSinceCreation >= 6.5 && !reminderSent) {
    return true;
  }

  return false;
};

// Static method to find by unhashed token
onboardingSchema.statics.findByToken = async function (token) {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
  return this.findOne({ token: hashedToken });
};

// Add organization-based indexes
onboardingSchema.index({ organizationId: 1, status: 1 });
onboardingSchema.index({ organizationId: 1, createdAt: -1 });

export default mongoose.model("Onboarding", onboardingSchema);
