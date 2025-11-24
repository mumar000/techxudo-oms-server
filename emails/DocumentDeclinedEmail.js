import React from "react";
import { Section, Text } from "@react-email/components";
import EmailLayout from "./components/EmailLayout.js";

const DocumentDeclinedEmail = ({ admin, employee, document }) => {
  const { fullName: adminName } = admin;
  const { fullName: employeeName, email: employeeEmail } = employee;
  const { type, title, rejectionReason } = document;

  const formattedDate = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return React.createElement(EmailLayout, { preview: `Document Declined: ${title}` },
    // Warning Banner
    React.createElement(Section, { style: banner },
      React.createElement(Text, { style: bannerTitle },
        "Document Declined"
      ),
      React.createElement(Text, { style: bannerSubtitle },
        "An employee has declined to sign a document"
      )
    ),

    // Main Content
    React.createElement(Section, { style: content },
      React.createElement(Text, { style: greeting },
        "Hi ",
        React.createElement("strong", null, adminName),
        ","
      ),

      React.createElement(Text, { style: paragraph },
        React.createElement("strong", null, employeeName),
        " has declined the ",
        React.createElement("strong", null, type.toUpperCase()),
        " titled \"",
        React.createElement("strong", null, title),
        "\"."
      ),

      // Decline Details Card
      React.createElement(Section, { style: detailsBox },
        React.createElement(Text, { style: detailsTitle }, "Details:"),

        React.createElement(Section, { style: detailRow },
          React.createElement(Text, { style: detailLabel }, "Declined by:"),
          React.createElement(Text, { style: detailValue }, `${employeeName} (${employeeEmail})`)
        ),

        React.createElement(Section, { style: detailRow },
          React.createElement(Text, { style: detailLabel }, "Document:"),
          React.createElement(Text, { style: detailValue }, title)
        ),

        React.createElement(Section, { style: detailRow },
          React.createElement(Text, { style: detailLabel }, "Document Type:"),
          React.createElement(Text, { style: detailValue }, type.toUpperCase())
        ),

        React.createElement(Section, { style: detailRow },
          React.createElement(Text, { style: detailLabel }, "Declined at:"),
          React.createElement(Text, { style: detailValue }, formattedDate)
        ),

        React.createElement(Section, { style: reasonBox },
          React.createElement(Text, { style: reasonLabel }, "Reason:"),
          React.createElement(Text, { style: reasonText },
            rejectionReason || "No reason provided"
          )
        )
      ),

      // Suggestion Box
      React.createElement(Section, { style: infoBox },
        React.createElement(Text, { style: infoText },
          React.createElement("strong", null, "Next Steps: "),
          "You may want to contact the employee to discuss the matter or create a revised document."
        )
      ),

      React.createElement(Text, { style: paragraph },
        "Please reach out to ",
        React.createElement("strong", null, employeeName),
        " at ",
        React.createElement("a", { href: `mailto:${employeeEmail}`, style: link }, employeeEmail),
        " if you need to discuss this further."
      )
    )
  );
};

// Styles
const banner = {
  backgroundColor: "#f8f9fa",
  padding: "30px",
  textAlign: "center",
  borderBottom: "3px solid #dc3545"
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
  backgroundColor: "#fff5f5",
  padding: "20px",
  borderRadius: "6px",
  margin: "30px 0",
  borderLeft: "4px solid #dc3545"
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
  minWidth: "120px"
};

const detailValue = {
  margin: 0,
  color: "#2d3748",
  fontSize: "15px",
  display: "inline-block"
};

const reasonBox = {
  marginTop: "20px",
  paddingTop: "15px",
  borderTop: "1px solid #e2e8f0"
};

const reasonLabel = {
  margin: "0 0 10px 0",
  color: "#718096",
  fontSize: "13px",
  fontWeight: "600",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const reasonText = {
  margin: 0,
  color: "#742a2a",
  fontSize: "15px",
  lineHeight: "1.6",
  fontStyle: "italic"
};

const infoBox = {
  backgroundColor: "#edf2f7",
  padding: "15px",
  borderRadius: "6px",
  margin: "30px 0"
};

const infoText = {
  margin: 0,
  color: "#2d3748",
  fontSize: "14px",
  lineHeight: "1.6"
};

const link = {
  color: "#007bff",
  textDecoration: "none"
};

export default DocumentDeclinedEmail;
