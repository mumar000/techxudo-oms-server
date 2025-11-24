import mongoose from "mongoose";

const documentSchema = new mongoose.Schema(
  {
    // Document Information
    title: {
      type: String,
      required: [true, "Document title is required"],
      trim: true,
    },
    type: {
      type: String,
      required: [true, "Document type is required"],
      enum: ["contract", "nda", "undertaking"],
      lowercase: true,
    },
    content: {
      type: String, // HTML/Text content of the document
      default: "",
    },
    pdfUrl: {
      type: String, // Cloudinary URL for the PDF
      default: "",
    },

    // User References
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sentTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    // Status
    status: {
      type: String,
      enum: [
        "draft",
        "sent",
        "viewed",
        "signed",
        "rejected",
        "expired",
        "revoked",
      ],
      default: "draft",
    },

    // Signature Details
    signature: {
      signedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      signedAt: { type: Date },
      signatureImage: { type: String }, // Base64 or URL
      ipAddress: { type: String },
      userAgent: { type: String },
    },

    // Metadata
    sentAt: { type: Date },
    expiresAt: { type: Date }, // Optional expiry
    rejectionReason: { type: String, default: "" },

    // Audit Trail
    timeline: [
      {
        action: {
          type: String,
          required: true,
          enum: [
            "created",
            "sent",
            "viewed",
            "signed",
            "rejected",
            "downloaded",
          ],
        },
        by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        at: { type: Date, default: Date.now },
        details: { type: String, default: "" },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Add document status change methods
documentSchema.methods.updateStatus = function (
  newStatus,
  userId,
  details = ""
) {
  this.status = newStatus;

  // Add to timeline
  this.timeline.push({
    action: newStatus,
    by: userId,
    at: new Date(),
    details: details,
  });

  return this.save();
};

// Indexes for better query performance
documentSchema.index({ sentTo: 1, status: 1 });
documentSchema.index({ createdBy: 1, status: 1 });
documentSchema.index({ status: 1, createdAt: -1 });

export default mongoose.model("Document", documentSchema);
