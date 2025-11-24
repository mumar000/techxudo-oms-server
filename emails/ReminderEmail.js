import React from "react";
import { Section, Text, Button } from "@react-email/components";
import EmailLayout from "./components/EmailLayout.js";

const ReminderEmail = ({ offerData, token, frontendUrl, reminderType }) => {
  const { fullName, designation } = offerData;
  const onboardingUrl = `${frontendUrl}/onboarding/${token}`;

  const reminderMessages = {
    first: {
      subject: "Reminder: Your Offer Letter is Waiting",
      urgency: "You still have 4 days to respond",
      emoji: "⏰"
    },
    second: {
      subject: "⏰ Reminder: 2 Days Left to Respond",
      urgency: "Only 2 days remaining!",
      emoji: "⚠️"
    },
    final: {
      subject: "⚠️ Final Reminder: Offer Expires Tomorrow",
      urgency: "This is your final reminder - expires in 24 hours!",
      emoji: "🚨"
    }
  };

  const message = reminderMessages[reminderType] || reminderMessages.first;

  return React.createElement(EmailLayout, { preview: message.subject },
    // Content
    React.createElement(Section, { style: content },
      React.createElement(Text, { style: greeting }, `Hi ${fullName},`),

      React.createElement(Text, { style: paragraph },
        "We noticed you haven't responded to your offer letter for the ",
        React.createElement("strong", null, designation),
        " position yet."
      ),

      // Urgency Banner
      React.createElement(Section, { style: urgencyBox },
        React.createElement(Text, { style: urgencyText },
          `${message.emoji} ${message.urgency}`
        )
      ),

      React.createElement(Text, { style: paragraph },
        "Please take a moment to review your offer letter and let us know your decision. We're excited about the possibility of you joining our team!"
      ),

      // CTA Button
      React.createElement(Section, { style: buttonContainer },
        React.createElement(Button, { href: onboardingUrl, style: button },
          "Review Offer Letter"
        )
      ),

      React.createElement(Text, { style: paragraph },
        "If you have any questions or concerns, please don't hesitate to contact us. We're here to help!"
      ),

      React.createElement(Text, { style: signature },
        "Best regards,",
        React.createElement("br"),
        React.createElement("strong", null, "Techxudo HR Team")
      )
    )
  );
};

// Styles
const content = {
  padding: "40px 30px"
};

const greeting = {
  margin: "0 0 20px 0",
  color: "#2d3748",
  fontSize: "24px",
  fontWeight: "700"
};

const paragraph = {
  margin: "0 0 20px 0",
  color: "#4a5568",
  fontSize: "16px",
  lineHeight: "1.7"
};

const urgencyBox = {
  backgroundColor: "#fff5f5",
  borderLeft: "4px solid #fc8181",
  padding: "20px",
  margin: "30px 0",
  borderRadius: "4px"
};

const urgencyText = {
  margin: 0,
  color: "#742a2a",
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: "1.6"
};

const buttonContainer = {
  margin: "30px 0",
  textAlign: "center"
};

const button = {
  display: "inline-block",
  padding: "16px 48px",
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "16px",
  fontWeight: "600",
  borderRadius: "6px",
  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)"
};

const signature = {
  margin: "30px 0 0 0",
  color: "#2d3748",
  fontSize: "15px",
  lineHeight: "1.8"
};

export default ReminderEmail;
