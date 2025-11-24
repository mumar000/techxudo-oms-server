import React from "react";
import { Section, Text, Button } from "@react-email/components";
import EmailLayout from "./components/EmailLayout.js";

const DocumentSignedEmail = ({ admin, employee, document, frontendUrl }) => {
  const { fullName: adminName } = admin;
  const { fullName: employeeName, email: employeeEmail } = employee;
  const { _id, type, title, signature } = document;

  const downloadUrl = `${frontendUrl}/admin/documents/${_id}/download`;

  const formattedDate = new Date(signature.signedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  return React.createElement(EmailLayout, { preview: `Document Signed: ${title}` },
    // Success Banner
    React.createElement(Section, { style: banner },
      React.createElement(Text, { style: bannerTitle },
        "Document Signed ✓"
      ),
      React.createElement(Text, { style: bannerSubtitle },
        "An employee has successfully signed a document"
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
        " has signed the ",
        React.createElement("strong", null, type.toUpperCase()),
        " titled \"",
        React.createElement("strong", null, title),
        "\"."
      ),

      // Signature Details Card
      React.createElement(Section, { style: detailsBox },
        React.createElement(Text, { style: detailsTitle }, "Signature Details:"),

        React.createElement(Section, { style: detailRow },
          React.createElement(Text, { style: detailLabel }, "Signed by:"),
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
          React.createElement(Text, { style: detailLabel }, "Signed at:"),
          React.createElement(Text, { style: detailValue }, formattedDate)
        )
      ),

      // CTA Button
      React.createElement(Section, { style: buttonContainer },
        React.createElement(Button, { href: downloadUrl, style: button },
          "DOWNLOAD SIGNED DOCUMENT"
        )
      ),

      React.createElement(Text, { style: paragraph },
        "The signed document is now available for download in the system."
      )
    )
  );
};

// Styles
const banner = {
  backgroundColor: "#f8f9fa",
  padding: "30px",
  textAlign: "center",
  borderBottom: "3px solid #28a745"
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
  backgroundColor: "#f0f9f4",
  padding: "20px",
  borderRadius: "6px",
  margin: "30px 0",
  borderLeft: "4px solid #28a745"
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

const buttonContainer = {
  margin: "40px 0",
  textAlign: "center"
};

const button = {
  display: "inline-block",
  padding: "16px 48px",
  background: "#28a745",
  color: "#ffffff",
  textDecoration: "none",
  fontSize: "16px",
  fontWeight: "600",
  borderRadius: "6px",
  boxShadow: "0 4px 12px rgba(40, 167, 69, 0.4)"
};

export default DocumentSignedEmail;
