import mongoose from "mongoose";

const documentTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Template name is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Template type is required"],
      enum: ["contract", "nda", "undertaking"],
      lowercase: true,
    },
    content: {
      type: String, // Template content with placeholders
      required: [true, "Template content is required"],
    },
    placeholders: {
      type: [String], // Array of placeholders like ["{{employeeName}}", "{{joiningDate}}"]
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
documentTemplateSchema.index({ type: 1, isActive: 1 });
documentTemplateSchema.index({ createdBy: 1 });

export default mongoose.model("DocumentTemplate", documentTemplateSchema);
