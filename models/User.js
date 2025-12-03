import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const userSchema = new mongoose.Schema(
  {
    // Basic Information
    fullName: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    passwordHash: {
      type: String,
      required: [true, "Password is required"],
    },

    // Role
    role: {
      type: String,
      enum: ["admin", "employee"],
      default: "employee",
      required: true,
    },

    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: function () {
        return this.role !== "superadmin";
      },
      index: true,
    },

    // Account Status
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },

    //Enhance onboarding status
    onboardingStatus: {
      appointmentLetterSent: {
        type: Boolean,
        default: false,
      },
      appointmentLetterViewed: {
        type: Boolean,
        default: false,
      },
      appointmentLetterAccepted: {
        type: Boolean,
        default: false,
      },
      employmentFormSubmitted: {
        type: Boolean,
        default: false,
      },
      employmentFormApproved: {
        type: Boolean,
        default: false,
      },
      contractSent: {
        type: Boolean,
        default: false,
      },
      contractSigned: {
        type: Boolean,
        default: false,
      },
      credentialsSet: {
        type: Boolean,
        default: false,
      },
      isComplete: {
        type: Boolean,
        default: false,
      },
      currentStep: {
        type: String,
        enum: [
          "appointment_pending",
          "appointment_sent",
          "employment_form",
          "contract_pending",
          "contract_sent",
          "credentials_setup",
          "completed",
        ],
        default: "appointment_pending",
      },
      completedAt: {
        type: Date,
        default: null,
      },
    },
    employmentDetails: {
      photo: { type: String, default: "" },
      legalName: { type: String, default: "" },
      fatherName: { type: String, default: "" },
      guardianName: { type: String, default: "" },
      guardianCNIC: { type: String, default: "" },

      cnicFrontImage: { type: String, default: "" },
      cnicBackImage: { type: String, default: "" },
      cnicIssueDate: { type: Date },
      cnicExpiryDate: { type: Date },

      maritalStatus: {
        type: String,
        enum: ["single", "married", "divorced", "widowed"],
        default: "single",
      },

      secondaryAddress: {
        street: { type: String, default: "" },
        city: { type: String, default: "" },
        state: { type: String, default: "" },
        zipCode: { type: String, default: "" },
        country: { type: String, default: "" },
      },

      acceptedPolicies: [
        {
          policyId: mongoose.Schema.Types.ObjectId,
          policyTitle: String,
          acceptedAt: Date,
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);
userSchema.index({ organizationId: 1, role: 1 });
userSchema.index({ organizationId: 1, isActive: 1 });
userSchema.index({ organizationId: 1, department: 1 });
userSchema.index({ email: 1, organizationId: 1 });

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

userSchema.virtual("onboardingProgress").get(function () {
  const steps = [
    this.onboardingStatus.appointmentLetterAccepted,
    this.onboardingStatus.employmentFormSubmitted,
    this.onboardingStatus.employmentFormApproved,
    this.onboardingStatus.contractSigned,
    this.onboardingStatus.credentialsSet,
  ];

  const completed = steps.filter(Boolean).length;
  return Math.round((completed / steps.length) * 100);
});

userSchema.methods.isBoardingComplete = function () {
  return this.onboardingStatus.isComplete;
};

userSchema.methods.updateOnboardingSteps = async function (step, data = {}) {
  const stepMap = {
    appointment_sent: {
      appointmentLetterSent: true,
      currentStep: "appointment_letter",
    },
    appointment_viewed: {
      appointmentLetterViewed: true,
    },
    appointment_accepted: {
      appointmentLetterAccepted: true,
      currentStep: "employment_form",
    },
    employment_form_submitted: {
      employmentFormSubmitted: true,
      currentStep: "contract_pending",
    },
    employment_form_approved: {
      employmentFormApproved: true,
      currentStep: "contract_sent",
    },
    contract_sent: {
      contractSent: true,
      currentStep: "contract_sent",
    },
    contract_signed: {
      contractSigned: true,
      currentStep: "credentials_setup",
    },
    credentials_set: {
      credentialsSet: true,
      currentStep: "completed",
      isComplete: true,
      completedAt: new Date(),
    },
  };

  if (stepMap[step]) {
    Object.assign(this.onboardingStatus, stepMap[step]);
    if (data) Object.assign(this, data);
    return await this.save();
  }

  throw new Error(`Invalid onboarding steps`);
};

userSchema.statics.findByOrganization = function (
  organizationId,
  options = {}
) {
  const query = this.find({ organizationId, ...options.filer })
    .select(options.select || "-passwordHash -refreshToken")
    .lean(options.lean !== false);

  if (options.populate) query.populate(options.populate);
  if (options.sort) query.sort(options.sort);
  if (options.limit) query.limit(options.limit);

  return query;
};

userSchema.statics.getOrganizationStats = async function (organizationId) {
  return await this.aggregate([
    { $match: { organizationId: mongoose.Types.ObjectId(organizationId) } },
    {
      $group: {
        _id: "$role",
        count: { $sum: 1 },
      },
    },
  ]);
};
export default mongoose.model("User", userSchema);
