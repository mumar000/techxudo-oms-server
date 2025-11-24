import React from "react";
import { Section, Text, Button } from "@react-email/components";
import EmailLayout from "./components/EmailLayout.js";

const DocumentNotificationEmail = ({ employee, admin, document, frontendUrl }) => {
  const { fullName: employeeName } = employee;
  const { fullName: adminName, email: adminEmail } = admin;
  const { _id, type, title, sentAt } = document;

  const documentUrl = `${frontendUrl}/employee/documents/${_id}/sign`;

  const formattedDate = new Date(sentAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return React.createElement(EmailLayout, { preview: `Action Required: Sign Your ${type.toUpperCase()}` },
    // Header Banner
    React.createElement(Section, { style: banner },
      React.createElement(Text, { style: bannerTitle },
        "Document Signature Request"
      ),
      React.createElement(Text, { style: bannerSubtitle },
        "Please review and sign this document"
      )
    ),

    // Main Content
    React.createElement(Section, { style: content },
      React.createElement(Text, { style: greeting },
        "Hi ",
        React.createElement("strong", null, employeeName),
        ","
      ),

      React.createElement(Text, { style: paragraph },
        React.createElement("strong", null, adminName),
        " has sent you a ",
        React.createElement("strong", null, type.toUpperCase()),
        " titled \"",
        React.createElement("strong", null, title),
        "\" for your signature."
      ),

      // Document Details Card
      React.createElement(Section, { style: detailsBox },
        React.createElement(Text, { style: detailsTitle }, "Document Details:"),

        React.createElement(Section, { style: detailRow },
          React.createElement(Text, { style: detailLabel }, "Type:"),
          React.createElement(Text, { style: detailValue }, type.toUpperCase())
        ),

        React.createElement(Section, { style: detailRow },
          React.createElement(Text, { style: detailLabel }, "Title:"),
          React.createElement(Text, { style: detailValue }, title)
        ),

        React.createElement(Section, { style: detailRow },
          React.createElement(Text, { style: detailLabel }, "Sent by:"),
          React.createElement(Text, { style: detailValue }, `${adminName} (${adminEmail})`)
        ),

        React.createElement(Section, { style: detailRow },
          React.createElement(Text, { style: detailLabel }, "Sent on:"),
          React.createElement(Text, { style: detailValue }, formattedDate)
        )
      ),

      React.createElement(Section, { style: warningBox },
        React.createElement(Text, { style: warningText },
          React.createElement("strong", null, "Important:"),
          " This is a legally binding document. Please review carefully before signing."
        )
      ),

      // CTA Button
      React.createElement(Section, { style: buttonContainer },
        React.createElement(Button, { href: documentUrl, style: button },
          "VIEW & SIGN DOCUMENT"
        )
      ),

      React.createElement(Text, { style: paragraph },
        "If you have any questions about this document, please contact ",
        React.createElement("strong", null, adminName),
        " at ",
        React.createElement("a", { href: `mailto:${adminEmail}`, style: link }, adminEmail),
        "."
      )
    )
  );
};

// Styles
const banner = {
  backgroundColor: "#f8f9fa",
  padding: "30px",
  textAlign: "center",
  borderBottom: "3px solid #007bff"
};

const bannerTitle = {
  margin: 0,
  color: "#2d3748",
  fontSize: "28px",
  fontWeight: "700"
};

const bannerSubtitle = {
  margin: "10px 0 0 0",
  color: "#4a5568",
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
  backgroundColor: "#f8f9fa",
  padding: "20px",
  borderRadius: "6px",
  margin: "30px 0"
};

const detailsTitle = {
  margin: "0 0 20px 0",
  color: "#2d3748",
  fontSize: "18px",
  fontWeight: "600"
};

const detailRow = {
  marginBottom: "12px"
};

const detailLabel = {
  margin: 0,
  color: "#718096",
  fontSize: "13px",
  fontWeight: "600",
  display: "inline-block",
  minWidth: "100px"
};

const detailValue = {
  margin: 0,
  color: "#2d3748",
  fontSize: "15px",
  display: "inline-block"
};

const warningBox = {
  backgroundColor: "#fff5f5",
  borderLeft: "4px solid #fc8181",
  padding: "15px",
  margin: "30px 0",
  borderRadius: "4px"
};

const warningText = {
  margin: 0,
  color: "#742a2a",
  fontSize: "14px",
  lineHeight: "1.6"
};

const buttonContainer = {
  margin: "40px 0",
  textAlign: "center"
};

const button = {
  display: "inline-block",
  padding: "16px 48px",
  background: "#007bff",
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "16px",
  fontWeight: "600",
  borderRadius: "6px",
  boxShadow: "0 4px 12px rgba(0, 123, 255, 0.4)"
};

const link = {
  color: "#007bff",
  textDecoration: "none"
};

export default DocumentNotificationEmail;
