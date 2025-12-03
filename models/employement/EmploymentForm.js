import mongoose from "mongoose";

const employmentFormSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    appointmentLetterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AppointmentLetter",
      required: true,
    },
    employeeEmail: {
      type: String,
      required: true,
      trim: true,
    },

    personalInfo: {
      photo: String,
      legalName: {
        type: String,
        required: true,
      },
      fatherName: String,
      guardianName: String,
      guardianCNIC: String,
      dateOfBirth: Date,
      gender: String,
      maritalStatus: String,
    },

    cnicInfo: {
      cnicNumber: {
        type: String,
        required: true,
      },
      cnicFrontImage: String,
      cnicBackImage: String,
      cnicIssueDate: Date,
      cnicExpiryDate: Date,
    },

    contactInfo: {
      phone: {
        type: String,
        required: true,
      },
      alternatePhone: String,
      email: {
        type: String,
        required: true,
      },
      emergencyContact: {
        name: String,
        relationship: String,
        phone: String,
      },
    },

    addresses: {
      primaryAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
      },
      secondaryAddress: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
      },
    },

    acceptedPolicies: [
      {
        policyId: mongoose.Schema.Types.ObjectId,
        policyTitle: String,
        acceptedAt: Date,
      },
    ],

    status: {
      type: String,
      enum: ["draft", "submitted", "approved", "rejected"],
      default: "draft",
      index: true,
    },
    submittedAt: Date,
    reviewedAt: Date,
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    createdAt: Date,
    updatedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
employmentFormSchema.index({ organizationId: 1, status: 1 });
employmentFormSchema.index({ employeeEmail: 1, organizationId: 1 });

export default mongoose.model("EmploymentForm", employmentFormSchema);
