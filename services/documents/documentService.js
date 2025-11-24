import Document from "../../models/Document.js";
import DocumentTemplate from "../../models/DocumentTemplate.js";
import User from "../../models/User.js";
import { generateSignedPDF } from "../../utils/pdfGenerator.js";
import emailService from "../../services/email/emailService.js";

// Helper function to escape special regex characters
const escapeRegExp = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Create document from template
export const createDocumentFromTemplateService = async (
  userId,
  templateId,
  employeeId,
  placeholderValues
) => {
  // Find the document template
  const template = await DocumentTemplate.findById(templateId);
  if (!template) {
    throw new Error("Document template not found");
  }

  // Verify employee exists
  const employee = await User.findById(employeeId);
  if (!employee) {
    throw new Error("Employee not found");
  }

  // Get admin (document creator) for email
  const admin = await User.findById(userId);

  // Replace placeholders in content
  let content = template.content;
  if (placeholderValues) {
    Object.keys(placeholderValues).forEach((key) => {
      const placeholder = `{{${key}}}`;
      content = content.replace(
        new RegExp(placeholder, "g"),
        placeholderValues[key]
      );
    });
  }

  // Create document
  const document = new Document({
    title: template.name,
    type: template.type,
    content: content,
    createdBy: userId,
    sentTo: employeeId,
    status: "sent", // Set as sent since it will be sent to the employee
    sentAt: new Date(),
  });

  // Add initial entry to timeline
  document.timeline.push({
    action: "created",
    by: userId,
    at: new Date(),
    details: "Document created from template",
  });

  await document.save();

  // Send notification email to employee
  try {
    await emailService.sendDocumentNotification(employee, admin, document);
  } catch (emailError) {
    console.error("Failed to send document notification email:", emailError);
    // Dont throw error as it shouldnt prevent document creation
  }

  return document;
};

// Upload custom document
export const uploadDocumentService = async (
  userId,
  employeeId,
  title,
  type,
  pdfUrl
) => {
  // Verify employee exists
  const employee = await User.findById(employeeId);
  if (!employee) {
    throw new Error("Employee not found");
  }

  // Get admin (document creator) for email
  const admin = await User.findById(userId);

  const document = new Document({
    title: title || "Custom Document",
    type: type || "contract",
    content: "Custom document content",
    pdfUrl: pdfUrl || "",
    createdBy: userId,
    sentTo: employeeId,
    status: "sent",
    sentAt: new Date(),
  });

  // Add initial entry to timeline
  document.timeline.push({
    action: "created",
    by: userId,
    at: new Date(),
    details: "Custom document uploaded",
  });

  await document.save();

  // Send notification email to employee
  try {
    await emailService.sendDocumentNotification(employee, admin, document);
  } catch (emailError) {
    console.error("Failed to send document notification email:", emailError);
    // Dont throw error as it shouldnt prevent document creation
  }

  return document;
};

// Get all documents for a user
export const getDocumentsService = async (userId, userRole, options = {}) => {
  let query = {};

  // Admin can see all documents they created, employee can see documents sent to them
  if (userRole === "admin") {
    query.createdBy = userId;
  } else {
    query.sentTo = userId;
  }

  // Add any additional query conditions from options
  if (options.status) {
    query.status = options.status;
  }

  const documents = await Document.find(query)
    .populate("createdBy", "fullName email role")
    .populate("sentTo", "fullName email role")
    .sort({ createdAt: -1 });

  // Process template variables for each document
  await Promise.all(documents.map(async (document) => {
    if (document.sentTo) {
      document.content = await processDocumentTemplate(document, document.sentTo);
    }
  }));

  return documents;
};

// Get pending documents for employee
export const getPendingDocumentsService = async (userId) => {
  const documents = await Document.find({
    sentTo: userId,
    status: { $in: ["sent", "viewed"] }, // Documents that are not yet signed or rejected
  })
    .populate("createdBy", "fullName email role")
    .populate("sentTo", "fullName email role")
    .sort({ createdAt: -1 });

  // Process template variables for each document
  await Promise.all(documents.map(async (document) => {
    if (document.sentTo) {
      document.content = await processDocumentTemplate(document, document.sentTo);
    }
  }));

  return documents;
};

// Get document by ID
export const getDocumentByIdService = async (documentId) => {
  const document = await Document.findById(documentId)
    .populate("createdBy", "fullName email role")
    .populate("sentTo", "fullName email role");

  if (document) {
    // Process template variables using the populated recipient user data
    if (document.sentTo) {
      document.content = await processDocumentTemplate(document, document.sentTo);
    }
  }

  return document;
};

// Check document access authorization
export const checkDocumentAccess = (document, userId, userRole) => {
  if (userRole === "admin") {
    // Admin can access documents they created
    return document.createdBy.toString() === userId.toString();
  } else if (userRole === "employee") {
    // Employee can access documents sent to them
    // Handle both populated (object) and non-populated (string/ID)
    const sentToId =
      typeof document.sentTo === "object"
        ? document.sentTo._id
        : document.sentTo;
    return sentToId.toString() === userId.toString();
  }
  return false;
};
// Sign document
export const signDocumentService = async (
  documentId,
  userId,
  signatureData
) => {
  const document = await Document.findById(documentId);

  if (!document) {
    throw new Error("Document not found");
  }

  // Check if document can be signed (not already signed/rejected/expired)
  if (document.status !== "sent" && document.status !== "viewed") {
    throw new Error("Document cannot be signed at this time");
  }

  // Check if document has expired
  if (document.expiresAt && new Date() > document.expiresAt) {
    await document.updateStatus(
      "expired",
      userId,
      "Document expired before signing"
    );
    throw new Error("Document has expired");
  }

  // Update document with signature
  document.signature = {
    signedBy: userId,
    signedAt: new Date(),
    signatureImage: signatureData.signatureImage,
    ipAddress: signatureData.ipAddress || "",
    userAgent: signatureData.userAgent || "",
  };

  await document.updateStatus("signed", userId, "Document signed by recipient");

  // Generate signed PDF if needed
  try {
    const signedPdfBuffer = await generateSignedPDF(document);
    // In a real implementation, you would save this to Cloudinary or file storage
    // and update the document.pdfUrl accordingly
    console.log("Signed PDF generated for document:", document._id);
  } catch (error) {
    console.error("Error generating signed PDF:", error);
    // Dont throw error here as it shouldnt prevent the signing process
  }

  // Send notification to admin that document was signed
  try {
    const admin = await User.findById(document.createdBy);
    const employee = await User.findById(document.sentTo);
    await emailService.sendDocumentSignedNotification(
      admin,
      employee,
      document
    );
  } catch (emailError) {
    console.error(
      "Failed to send document signed notification email:",
      emailError
    );
    // Dont throw error as it shouldnt prevent the signing process
  }

  return document;
};

// Decline document
export const declineDocumentService = async (documentId, userId, reason) => {
  const document = await Document.findById(documentId);

  if (!document) {
    throw new Error("Document not found");
  }

  // Check if document can be declined
  if (document.status !== "sent" && document.status !== "viewed") {
    throw new Error("Document cannot be declined at this time");
  }

  // Update document status and reason
  document.rejectionReason = reason || "";
  await document.updateStatus(
    "rejected",
    userId,
    `Document declined: ${reason || "No reason provided"}`
  );

  // Send notification to admin that document was declined
  try {
    const admin = await User.findById(document.createdBy);
    const employee = await User.findById(document.sentTo);
    await emailService.sendDocumentDeclinedNotification(
      admin,
      employee,
      document
    );
  } catch (emailError) {
    console.error(
      "Failed to send document declined notification email:",
      emailError
    );
    // Dont throw error as it shouldnt prevent the declining process
  }

  return document;
};

// Resend document
export const resendDocumentService = async (documentId, userId) => {
  const document = await Document.findById(documentId);

  if (!document) {
    throw new Error("Document not found");
  }

  // Check if document was created by current user (admin)
  if (document.createdBy.toString() !== userId.toString()) {
    throw new Error("Only document creator can resend");
  }

  // Get employee and admin for email
  const employee = await User.findById(document.sentTo);
  const admin = await User.findById(userId);

  // Update document status
  await document.updateStatus("sent", userId, "Document resent to employee");

  // Send notification email to employee again
  try {
    await emailService.sendDocumentNotification(employee, admin, document);
  } catch (emailError) {
    console.error("Failed to send document notification email:", emailError);
    // Dont throw error as it shouldnt prevent document resending
  }

  return document;
};

// Delete document
export const deleteDocumentService = async (documentId, userId) => {
  const document = await Document.findById(documentId);

  if (!document) {
    throw new Error("Document not found");
  }

  // Check if document was created by current user (admin)
  if (document.createdBy.toString() !== userId.toString()) {
    throw new Error("Only document creator can delete");
  }

  await Document.findByIdAndDelete(documentId);
  return true;
};

// Process template placeholders in document content
export const processDocumentTemplate = async (document, recipientUser = null) => {
  let content = document.content || '';

  // If no recipient provided, return content as-is
  if (!recipientUser) {
    return content;
  }

  // Map common template variables to user properties
  const templateData = {
    // User basic information
    'employee_name': recipientUser.fullName || '',
    'name': recipientUser.fullName || '',
    'full_name': recipientUser.fullName || '',

    // User role and position
    'position': recipientUser.designation || '',
    'designation': recipientUser.designation || '',
    'role': recipientUser.role || '',

    // User contact information
    'email': recipientUser.email || '',
    'phone': recipientUser.phone || '',

    // Employment details
    'department': recipientUser.department || '',
    'joining_date': recipientUser.joiningDate ? new Date(recipientUser.joiningDate).toLocaleDateString() : '',
    'salary': recipientUser.salary ? `Rs. ${recipientUser.salary.toLocaleString()}` : '',
    'monthly_salary': recipientUser.salary ? `Rs. ${recipientUser.salary.toLocaleString()}` : '',
    'cnic': recipientUser.cnic || '',

    // Personal details
    'date_of_birth': recipientUser.dateOfBirth ? new Date(recipientUser.dateOfBirth).toLocaleDateString() : '',

    // Address details
    'address': recipientUser.address?.street || '',
    'city': recipientUser.address?.city || '',
    'state': recipientUser.address?.state || '',
    'zip_code': recipientUser.address?.zipCode || '',
    'country': recipientUser.address?.country || '',

    // Company related (for now using placeholder, in a real system you'd fetch company data)
    'company_name': process.env.COMPANY_NAME || 'TechXudo',
    'company_address': process.env.COMPANY_ADDRESS || '123 Business St, City',
    'date': new Date().toLocaleDateString(),
    'current_date': new Date().toLocaleDateString(),
    'timestamp': new Date().toLocaleString(),
  };

  // Replace all placeholders in content
  Object.keys(templateData).forEach(key => {
    const placeholder = `{{${key}}}`;
    const value = templateData[key] || '';

    // Create a global regex to replace all occurrences of the placeholder
    const regex = new RegExp(escapeRegExp(placeholder), 'g');
    content = content.replace(regex, value);
  });

  return content;
};

// Validate document recipients
export const validateDocumentRecipients = async (recipients) => {
  const validRecipients = [];
  const invalidRecipients = [];

  for (const recipientId of recipients) {
    const user = await User.findById(recipientId);
    if (user) {
      validRecipients.push(user);
    } else {
      invalidRecipients.push(recipientId);
    }
  }

  return { validRecipients, invalidRecipients };
};
