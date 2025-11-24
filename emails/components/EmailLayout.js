import React from "react";
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Hr
} from "@react-email/components";

const EmailLayout = ({ children, preview }) => {
  return React.createElement(Html, null,
    React.createElement(Head, null),
    React.createElement(Body, { style: main },
      React.createElement(Container, { style: container },
        // Header
        React.createElement(Section, { style: header },
          React.createElement(Text, { style: headerTitle }, "Techxudo"),
          React.createElement(Text, { style: headerSubtitle }, "Office Management System")
        ),

        // Main Content
        children,

        // Footer
        React.createElement(Section, { style: footer },
          React.createElement(Hr, { style: footerDivider }),
          React.createElement(Text, { style: footerText },
            `© ${new Date().getFullYear()} Techxudo. All rights reserved.`
          ),
          React.createElement(Text, { style: footerSubtext },
            "This is an automated email. Please do not reply to this message."
          )
        )
      )
    )
  );
};

// Styles
const main = {
  backgroundColor: "#f4f7fa",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
};

const container = {
  margin: "40px auto",
  width: "600px",
  backgroundColor: "#ffffff",
  borderRadius: "8px",
  overflow: "hidden",
  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
};

const header = {
  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
  padding: "40px 30px",
  textAlign: "center"
};

const headerTitle = {
  margin: 0,
  color: "#ffffff",
  fontSize: "32px",
  fontWeight: "600",
  lineHeight: "1.2"
};

const headerSubtitle = {
  margin: "10px 0 0 0",
  color: "#ffffff",
  fontSize: "16px",
  opacity: "0.9",
  fontWeight: "400"
};

const footer = {
  backgroundColor: "#2d3748",
  padding: "30px",
  textAlign: "center"
};

const footerDivider = {
  borderColor: "#4a5568",
  margin: "0 0 20px 0"
};

const footerText = {
  margin: "0 0 10px 0",
  color: "#a0aec0",
  fontSize: "14px"
};

const footerSubtext = {
  margin: 0,
  color: "#718096",
  fontSize: "12px"
};

export default EmailLayout;
