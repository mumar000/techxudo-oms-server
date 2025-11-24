import React from "react";
import { Section, Text, Button } from "@react-email/components";
import EmailLayout from "./components/EmailLayout.js";

const LateArrivalEmail = ({ employeeName, checkInTime, minutesLate, date, frontendUrl }) => {
  const attendanceUrl = `${frontendUrl}/employee/attendance`;

  return React.createElement(EmailLayout, { preview: `Late Arrival - ${minutesLate} minutes late` },
    // Warning Banner
    React.createElement(Section, { style: banner },
      React.createElement(Text, { style: bannerTitle },
        "⏰ Late Arrival Notification"
      ),
      React.createElement(Text, { style: bannerSubtitle },
        "You checked in late today"
      )
    ),

    // Main Content
    React.createElement(Section, { style: content },
      React.createElement(Text, { style: greeting },
        "Hello ",
        React.createElement("strong", null, employeeName),
        ","
      ),

      React.createElement(Text, { style: paragraph },
        "This is a notification that you checked in late today."
      ),

      // Late Arrival Details Card
      React.createElement(Section, { style: detailsBox },
        React.createElement(Section, { style: detailRow },
          React.createElement(Text, { style: detailLabel }, "Date:"),
          React.createElement(Text, { style: detailValue }, date)
        ),

        React.createElement(Section, { style: detailRow },
          React.createElement(Text, { style: detailLabel }, "Check-In Time:"),
          React.createElement(Text, { style: detailValue }, checkInTime)
        ),

        React.createElement(Section, { style: detailRow },
          React.createElement(Text, { style: detailLabel }, "Late By:"),
          React.createElement(Text, { style: { ...detailValue, color: "#dc2626", fontWeight: "bold" } },
            `${minutesLate} minutes`
          )
        )
      ),

      React.createElement(Text, { style: paragraph },
        "Please try to arrive on time to avoid late arrival penalties. If you were late due to a valid reason, you can submit a correction request from the attendance page."
      ),

      // CTA Button
      React.createElement(Section, { style: buttonContainer },
        React.createElement(Button, { href: attendanceUrl, style: button },
          "VIEW ATTENDANCE"
        )
      ),

      // Tip Box
      React.createElement(Section, { style: tipBox },
        React.createElement(Text, { style: tipText },
          React.createElement("strong", null, "💡 Tip: "),
          "Set an alarm or reminder to help you arrive on time. Multiple late arrivals may affect your performance review."
        )
      )
    ),

    // Footer
    React.createElement(Section, { style: footer },
      React.createElement(Text, { style: footerText },
        "This is an automated notification from the Attendance System."
      ),
      React.createElement(Text, { style: footerSubtext },
        "If you have any questions, please contact HR."
      )
    )
  );
};

// Styles
const banner = {
  backgroundColor: "#fffbeb",
  padding: "30px",
  textAlign: "center",
  borderBottom: "3px solid #f59e0b"
};

const bannerTitle = {
  margin: 0,
  color: "#f59e0b",
  fontSize: "28px",
  fontWeight: "700"
};

const bannerSubtitle = {
  margin: "10px 0 0 0",
  color: "#92400e",
  fontSize: "16px"
};

const content = {
  padding: "40px 30px"
};

const greeting = {
  margin: "0 0 20px 0",
  color: "#2d3748",
  fontSize: "16px",
  lineHeight: "1.6"
};

const paragraph = {
  margin: "0 0 20px 0",
  color: "#4a5568",
  fontSize: "15px",
  lineHeight: "1.7"
};

const detailsBox = {
  backgroundColor: "#fff",
  padding: "20px",
  borderRadius: "8px",
  margin: "30px 0",
  border: "2px solid #fbbf24"
};

const detailRow = {
  marginBottom: "12px",
  display: "flex",
  justifyContent: "space-between"
};

const detailLabel = {
  margin: 0,
  color: "#718096",
  fontSize: "14px",
  fontWeight: "600"
};

const detailValue = {
  margin: 0,
  color: "#2d3748",
  fontSize: "14px"
};

const buttonContainer = {
  margin: "40px 0",
  textAlign: "center"
};

const button = {
  display: "inline-block",
  padding: "14px 32px",
  background: "#f59e0b",
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "16px",
  fontWeight: "600",
  borderRadius: "6px",
  boxShadow: "0 4px 12px rgba(245, 158, 11, 0.4)"
};

const tipBox = {
  backgroundColor: "#fef3c7",
  padding: "15px",
  borderRadius: "6px",
  marginTop: "20px"
};

const tipText = {
  margin: 0,
  color: "#92400e",
  fontSize: "13px",
  lineHeight: "1.6"
};

const footer = {
  padding: "30px 40px",
  textAlign: "center"
};

const footerText = {
  margin: 0,
  color: "#718096",
  fontSize: "14px"
};

const footerSubtext = {
  margin: "10px 0 0 0",
  color: "#a0aec0",
  fontSize: "12px"
};

export default LateArrivalEmail;
