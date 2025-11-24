import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    // Basic Information
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"]
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"]
    },

    // Role
    role: {
      type: String,
      enum: ["admin", "employee"],
      default: "employee",
      required: true
    },

    // Employee Specific Fields (from OMS document)
    designation: {
      type: String,
      default: ""
    },
    department: {
      type: String,
      default: ""
    },
    joiningDate: {
      type: Date
    },
    salary: {
      type: Number,
      default: 0
    },
    phone: {
      type: String,
      default: ""
    },
    cnic: {
      type: String,
      default: ""
    },
    dateOfBirth: {
      type: Date
    },
    address: {
      street: { type: String, default: "" },
      city: { type: String, default: "" },
      state: { type: String, default: "" },
      zipCode: { type: String, default: "" },
      country: { type: String, default: "" }
    },
    emergencyContact: {
      name: { type: String, default: "" },
      relationship: { type: String, default: "" },
      phone: { type: String, default: "" }
    },

    // Profile
    profile: {
      avatar: { type: String, default: "" },
      bio: { type: String, default: "" },
      cnicImage: { type: String, default: "" } // Cloudinary URL from frontend
    },

    // Social Links
    socialLinks: {
      github: { type: String, default: "" },
      linkedin: { type: String, default: "" }
    },
     leaveBalances: {
      casual: { type: Number, default: 12 }, 
      sick: { type: Number, default: 10 },   
      annual: { type: Number, default: 15 }  
    },
    leaveUsage: {
      casualUsed: { type: Number, default: 0 },
      sickUsed: { type: Number, default: 0 },
      annualUsed: { type: Number, default: 0 }
    },
    // Account Status
    isActive: {
      type: Boolean,
      default: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },

    // Password Reset
    passwordResetToken: { type: String },
    passwordResetExpires: { type: Date },

    // Email Verification
    emailVerificationToken: { type: String },
    emailVerificationExpires: { type: Date },

    // Refresh Tokens
    refreshTokens: [String]
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("passwordHash")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

// Create password reset token
userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");

  this.passwordResetToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

  return resetToken;
};

// Create email verification token
userSchema.methods.createEmailVerificationToken = function () {
  const token = crypto.randomBytes(32).toString("hex");

  this.emailVerificationToken = crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");

  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours

  return token;
};

export default mongoose.model("User", userSchema);
