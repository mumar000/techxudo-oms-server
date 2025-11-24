import React from "react";
import { Section, Text, Button } from "@react-email/components";
import EmailLayout from "./components/EmailLayout.js";

const AbsentNotificationEmail = ({ employeeName, date, frontendUrl }) => {
  const attendanceUrl = `${frontendUrl}/employee/attendance`;

  return React.createElement(EmailLayout, { preview: `Absent Notification - ${date}` },
    // Alert Banner
    React.createElement(Section, { style: banner },
      React.createElement(Text, { style: bannerTitle },
        "❌ Absent Notification"
      ),
      React.createElement(Text, { style: bannerSubtitle },
        "You have been marked absent"
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
        "You have been marked ",
        React.createElement("strong", { style: { color: "#dc2626" } }, "ABSENT"),
        " for today as you did not check in."
      ),

      // Absence Details Card
      React.createElement(Section, { style: detailsBox },
        React.createElement(Section, { style: detailRow },
          React.createElement(Text, { style: detailLabel }, "Date:"),
          React.createElement(Text, { style: { ...detailValue, fontWeight: "bold" } }, date)
        ),

        React.createElement(Section, { style: detailRow },
          React.createElement(Text, { style: detailLabel }, "Status:"),
          React.createElement(Text, { style: { ...detailValue, color: "#dc2626", fontWeight: "bold" } },
            "ABSENT"
          )
        )
      ),

      // Warning Box
      React.createElement(Section, { style: warningBox },
        React.createElement(Text, { style: warningTitle },
          "⚠️ Important:"
        ),
        React.createElement("ul", { style: warningList },
          React.createElement("li", { style: warningItem },
            "This absence will be counted against your attendance record"
          ),
          React.createElement("li", { style: warningItem },
            "Unauthorized absences may result in salary deduction"
          ),
          React.createElement("li", { style: warningItem },
            "Please contact HR if this is an error"
          )
        )
      ),

      React.createElement(Text, { style: paragraph },
        "If you were absent due to a valid reason (illness, emergency, etc.), please submit a correction request along with supporting documents as soon as possible."
      ),

      // CTA Button
      React.createElement(Section, { style: buttonContainer },
        React.createElement(Button, { href: attendanceUrl, style: button },
          "SUBMIT CORRECTION REQUEST"
        )
      ),

      // Tip Box
      React.createElement(Section, { style: tipBox },
        React.createElement(Text, { style: tipText },
          React.createElement("strong", null, "💡 Note: "),
          "To avoid being marked absent in the future, make sure to check in before the office check-in deadline. You can check in using the mobile app or office QR code."
        )
      )
    ),

    // Footer
    React.createElement(Section, { style: footer },
      React.createElement(Text, { style: footerText },
        "This is an automated notification from the Attendance System."
      ),
      React.createElement(Text, { style: footerSubtext },
        "For assistance, please contact HR Department."
      )
    )
  );
};

// Styles
const banner = {
  backgroundColor: "#fef2f2",
  padding: "30px",
  textAlign: "center",
  borderBottom: "3px solid #dc2626"
};

const bannerTitle = {
  margin: 0,
  color: "#dc2626",
  fontSize: "28px",
  fontWeight: "700"
};

const bannerSubtitle = {
  margin: "10px 0 0 0",
  color: "#991b1b",
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
  border: "2px solid #ef4444"
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
  fontSize: "16px"
};

const warningBox = {
  backgroundColor: "#fee2e2",
  padding: "15px",
  borderRadius: "6px",
  marginBottom: "20px"
};

const warningTitle = {
  margin: "0 0 10px 0",
  color: "#991b1b",
  fontSize: "14px",
  fontWeight: "bold"
};

const warningList = {
  margin: 0,
  paddingLeft: "20px",
  color: "#991b1b",
  fontSize: "14px",
  lineHeight: "1.6"
};

const warningItem = {
  marginBottom: "5px"
};

const buttonContainer = {
  margin: "40px 0",
  textAlign: "center"
};

const button = {
  display: "inline-block",
  padding: "14px 32px",
  background: "#dc2626",
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "16px",
  fontWeight: "600",
  borderRadius: "6px",
  boxShadow: "0 4px 12px rgba(220, 38, 38, 0.4)"
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

export default AbsentNotificationEmail;
