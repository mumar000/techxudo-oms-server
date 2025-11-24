import cron from "node-cron";
import Onboarding from "../../models/Onboarding.js";
import EmailService from "../email/emailService.js";

/**
 * Cron Service - Handles all scheduled tasks
 */

class CronService {
  /**
   * Alternative: Simplified reminder job that regenerates tokens
   * This version regenerates tokens for reminders since we can't recover original tokens
   */
  initializeOnboardingReminderJob() {
    return cron.schedule(
      "0 9 * * *",
      async () => {
        console.log("🔄 Running onboarding reminder cron job...");

        try {
          // Find all pending onboarding
          const pendingOnboardings = await Onboarding.find({
            status: "pending",
            tokenExpiry: { $gt: new Date() },
          });

          console.log(
            `Found ${pendingOnboardings.length} pending onboarding(s)`
          );

          for (const onboarding of pendingOnboardings) {
            try {
              let reminderType = null;

              // Determine which reminder to send
              if (onboarding.shouldSendReminder("first")) {
                reminderType = "first";
              } else if (onboarding.shouldSendReminder("second")) {
                reminderType = "second";
              } else if (onboarding.shouldSendReminder("final")) {
                reminderType = "final";
              }

              if (reminderType) {
                // Generate new token for reminder email
                const plainToken = onboarding.generateToken();
                await onboarding.save();

                // Send reminder email
                await EmailService.sendReminderEmail(
                  onboarding.offerDetails,
                  plainToken,
                  reminderType
                );

                // Record reminder
                onboarding.reminders.push({
                  sentAt: new Date(),
                  type: reminderType,
                });

                await onboarding.save();

                console.log(
                  `✅ ${reminderType} reminder sent to ${onboarding.offerDetails.email}`
                );
              }
            } catch (error) {
              console.error(
                `❌ Error sending reminder to ${onboarding.offerDetails.email}:`,
                error.message
              );
            }
          }

          // Mark expired onboarding
          const expiredResult = await Onboarding.updateMany(
            {
              status: "pending",
              tokenExpiry: { $lte: new Date() },
            },
            {
              $set: { status: "expired" },
            }
          );

          if (expiredResult.modifiedCount > 0) {
            console.log(
              `✅ Marked ${expiredResult.modifiedCount} onboarding(s) as expired`
            );
          }

          console.log("✅ Onboarding reminder cron job completed");
        } catch (error) {
          console.error("❌ Error in onboarding reminder cron job:", error);
        }
      },
      {
        scheduled: false,
        timezone: "Asia/Karachi",
      }
    );
  }

  /**
   * Start all cron jobs
   */
  startCronJobs() {
    console.log("🚀 Starting cron jobs...");

    // Get the onboarding reminder job
    const onboardingReminderJob = this.initializeOnboardingReminderJob();

    // Start the job
    onboardingReminderJob.start();

    console.log("✅ Cron jobs started successfully");
    console.log(
      "   - Onboarding reminder job: Daily at 9:00 AM (Asia/Karachi)"
    );

    return {
      onboardingReminderJob,
    };
  }

  /**
   * Stop all cron jobs
   */
  stopCronJobs(jobs) {
    console.log("⏹️  Stopping cron jobs...");

    if (jobs.onboardingReminderJob) {
      jobs.onboardingReminderJob.stop();
    }

    console.log("✅ Cron jobs stopped");
  }
}

const cronService = new CronService();

export const startCronJobs = cronService.startCronJobs.bind(cronService);
export const stopCronJobs = cronService.stopCronJobs.bind(cronService);

export default cronService;
