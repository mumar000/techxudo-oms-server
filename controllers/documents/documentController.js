import {
  createDocumentFromTemplateService,
  uploadDocumentService,
  getDocumentsService,
  getPendingDocumentsService,
  getDocumentByIdService,
  checkDocumentAccess,
  signDocumentService,
  declineDocumentService,
  resendDocumentService,
  deleteDocumentService,
} from "../../services/documents/documentService.js";
import { validationResult } from "express-validator";

// Create document from template
export const createDocumentFromTemplate = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { templateId, employeeId, placeholderValues } = req.body;

    const document = await createDocumentFromTemplateService(
      req.user._id,
      templateId,
      employeeId,
      placeholderValues
    );

    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error("Error creating document from template:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Upload custom document
export const uploadDocument = async (req, res) => {
  try {
    const { employeeId, title, type, pdfUrl } = req.body;

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Document file is required",
      });
    }

    const document = await uploadDocumentService(
      req.user._id,
      employeeId,
      title,
      type,
      pdfUrl
    );

    res.status(201).json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error("Error uploading document:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get all documents (admin) or documents for logged in user (employee)
export const getDocuments = async (req, res) => {
  try {
    const { status } = req.query;

    const documents = await getDocumentsService(req.user._id, req.user.role, {
      status,
    });

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    console.error("Error fetching documents:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get pending documents for employee
export const getPendingDocuments = async (req, res) => {
  try {
    if (req.user.role !== "employee") {
      return res.status(403).json({
        success: false,
        error: "Access denied. Employee privileges required.",
      });
    }

    const documents = await getPendingDocumentsService(req.user._id);

    res.status(200).json({
      success: true,
      count: documents.length,
      data: documents,
    });
  } catch (error) {
    console.error("Error fetching pending documents:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get document by ID
export const getDocumentById = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await getDocumentByIdService(id);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: "Document not found",
      });
    }

    // Check authorization
    const hasAccess = checkDocumentAccess(
      document,
      req.user._id,
      req.user.role
    );
    if (!hasAccess) {
      if (req.user.role === "admin") {
        return res.status(403).json({
          success: false,
          error: "Access denied. You did not create this document.",
        });
      } else {
        return res.status(403).json({
          success: false,
          error: "Access denied. This document was not sent to you.",
        });
      }
    }

    // Update status to viewed if it was sent and user is employee
    if (req.user.role === "employee" && document.status === "sent") {
      await document.updateStatus(
        "viewed",
        req.user._id,
        "Document viewed by recipient"
      );
    }

    res.status(200).json({
      success: true,
      data: document,
    });
  } catch (error) {
    console.error("Error fetching document:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Sign document
export const signDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { signatureImage } = req.body;

    if (!signatureImage) {
      return res.status(400).json({
        success: false,
        error: "Signature image is required",
      });
    }

    const signatureData = {
      signatureImage,
      ipAddress: req.ip,
      userAgent: req.get("User-Agent"),
    };

    const document = await signDocumentService(id, req.user._id, signatureData);

    res.status(200).json({
      success: true,
      data: document,
      message: "Document signed successfully",
    });
  } catch (error) {
    console.error("Error signing document:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Decline document
export const declineDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const document = await declineDocumentService(id, req.user._id, reason);

    res.status(200).json({
      success: true,
      data: document,
      message: "Document declined successfully",
    });
  } catch (error) {
    console.error("Error declining document:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Resend document
export const resendDocument = async (req, res) => {
  try {
    const { id } = req.params;

    const document = await resendDocumentService(id, req.user._id);

    res.status(200).json({
      success: true,
      data: document,
      message: "Document resent successfully",
    });
  } catch (error) {
    console.error("Error resending document:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete document
export const deleteDocument = async (req, res) => {
  try {
    const { id } = req.params;

    await deleteDocumentService(id, req.user._id);

    res.status(200).json({
      success: true,
      message: "Document deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
