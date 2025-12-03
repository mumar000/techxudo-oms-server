import mongoose from "mongoose";

const subscriptionPlanSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: "",
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    description: {
      type: String,
      required: true,
    },
    pricing: {
      monthly: {
        type: Number,
        required: true,
        min: 0,
      },
      yearly: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        default: "USD",
      },
    },

    features: {
      userLimit: {
        type: Number,
        required: true,
        default: 5,
      },
      storageLimit: {
        type: Number,
        default: 5,
      },
      customBranding: {
        type: Boolean,
        default: false,
      },
      prioritySupport: {
        type: Boolean,
        default: false,
      },
      advancedReports: {
        type: Boolean,
        default: false,
      },
      apiAccess: {
        type: Boolean,
        default: false,
      },
      customDomains: {
        type: Boolean,
        default: false,
      },
      multipleSignatories: {
        type: Boolean,
        default: false,
      },
      customPolicies: {
        type: Boolean,
        default: false,
      },
    },

    // Display
    displayOrder: {
      type: Number,
      default: 0,
    },
    isPopular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },

    // Stripe Integration
    stripeProductId: {
      type: String,
      default: "",
    },
    stripePriceId: {
      monthly: { type: String, default: "" },
      yearly: { type: String, default: "" },
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
subscriptionPlanSchema.index({ slug: 1 });
subscriptionPlanSchema.index({ isActive: 1 });

export default mongoose.model("SubscriptionPlan", subscriptionPlanSchema);
