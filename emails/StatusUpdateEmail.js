import React from "react";
import { Section, Text, Button } from "@react-email/components";
import EmailLayout from "./components/EmailLayout.js"; // Assuming you have this

const StatusUpdateEmail = ({ employeeName, requestType, status, comments, frontendUrl }) => {
  const isApproved = status === 'approved' || status === 'generated';
  const color = isApproved ? "#48bb78" : "#f56565"; // Green or Red
  const emoji = isApproved ? "✅" : "❌";

  return React.createElement(EmailLayout, { preview: `Your ${requestType} has been ${status}` },
    React.createElement(Section, { style: { padding: "40px 30px" } },
      React.createElement(Text, { style: { fontSize: "24px", fontWeight: "bold" } }, 
        `Hi ${employeeName},`
      ),
      
      React.createElement(Text, { style: { fontSize: "16px", margin: "20px 0" } },
        `Your request for a ` + 
        React.createElement("strong", null, requestType) +
        ` has been reviewed.`
      ),

      // Status Box
      React.createElement(Section, { 
        style: { 
          backgroundColor: isApproved ? "#f0fff4" : "#fff5f5",
          borderLeft: `4px solid ${color}`,
          padding: "20px",
          margin: "30px 0"
        } 
      },
        React.createElement(Text, { style: { color: color, fontWeight: "bold", margin: 0 } },
          `${emoji} Status: ${status.toUpperCase()}`
        ),
        comments && React.createElement(Text, { style: { marginTop: "10px", color: "#4a5568" } },
          `Admin Comments: "${comments}"`
        )
      ),

      React.createElement(Button, { 
        href: `${frontendUrl}/dashboard`,
        style: {
          backgroundColor: "#5a67d8",
          color: "#fff",
          padding: "12px 24px",
          borderRadius: "6px",
          textDecoration: "none",
          fontWeight: "bold"
        } 
      }, "View Dashboard")
    )
  );
};

export default StatusUpdateEmail;