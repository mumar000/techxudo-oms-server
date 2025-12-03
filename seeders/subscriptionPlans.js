import mongoose from "mongoose";
import dotenv from "dotenv";
import SubscriptionPlan from "../models/SubscriptionPlan.js";
import connectDB from "../config/db.js";

dotenv.config();

/**
 * 🌱 Subscription Plans Seed Data
 * Run: node seeders/subscriptionPlans.js
 */

const subscriptionPlans = [
  {
    name: "Free",
    slug: "free",
    description: "Perfect for trying out the platform. Get started with basic features at no cost.",
    pricing: {
      monthly: 0,
      yearly: 0,
      currency: "USD"
    },
    features: {
      userLimit: 5,
      storageLimit: 2, // GB
      customBranding: false,
      prioritySupport: false,
      advancedReports: false,
      apiAccess: false,
      customDomains: false,
      multipleSignatories: false,
      customPolicies: false
    },
    displayOrder: 1,
    isPopular: false,
    isActive: true
  },
  {
    name: "Startup",
    slug: "startup",
    description: "Ideal for small teams and growing businesses. Unlock essential features to scale.",
    pricing: {
      monthly: 29,
      yearly: 290, // 2 months free
      currency: "USD"
    },
    features: {
      userLimit: 20,
      storageLimit: 10, // GB
      customBranding: true,
      prioritySupport: false,
      advancedReports: true,
      apiAccess: false,
      customDomains: false,
      multipleSignatories: true,
      customPolicies: true
    },
    displayOrder: 2,
    isPopular: true,
    isActive: true
  },
  {
    name: "Business",
    slug: "business",
    description: "For established businesses needing advanced features and priority support.",
    pricing: {
      monthly: 79,
      yearly: 790, // 2 months free
      currency: "USD"
    },
    features: {
      userLimit: 100,
      storageLimit: 50, // GB
      customBranding: true,
      prioritySupport: true,
      advancedReports: true,
      apiAccess: true,
      customDomains: true,
      multipleSignatories: true,
      customPolicies: true
    },
    displayOrder: 3,
    isPopular: false,
    isActive: true
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    description: "Unlimited power for large organizations. Custom solutions and dedicated support.",
    pricing: {
      monthly: 199,
      yearly: 1990, // 2 months free
      currency: "USD"
    },
    features: {
      userLimit: -1, // Unlimited
      storageLimit: 500, // GB
      customBranding: true,
      prioritySupport: true,
      advancedReports: true,
      apiAccess: true,
      customDomains: true,
      multipleSignatories: true,
      customPolicies: true
    },
    displayOrder: 4,
    isPopular: false,
    isActive: true
  }
];

const seedSubscriptionPlans = async () => {
  try {
    await connectDB();

    // Clear existing plans
    await SubscriptionPlan.deleteMany({});
    console.log("🗑️  Cleared existing subscription plans");

    // Insert new plans
    const plans = await SubscriptionPlan.insertMany(subscriptionPlans);
    console.log("✅ Seeded subscription plans successfully:");

    plans.forEach(plan => {
      console.log(`   - ${plan.name} (${plan.slug}): $${plan.pricing.monthly}/month`);
    });

    console.log("\n📊 Total plans created:", plans.length);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding subscription plans:", error);
    process.exit(1);
  }
};

// Run seeder if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedSubscriptionPlans();
}

export default seedSubscriptionPlans;
