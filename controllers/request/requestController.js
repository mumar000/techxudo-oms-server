import DocumentRequest from "../../models/DocumentRequest.js";
import { generateAndUploadPDF } from "../../utils/pdfService.js";
import emailService from "../../services/email/emailService.js";

export const requestDocument = async (req, res) => {
  try {
    const { type, customType, reason } = req.body;

    // Validate required fields
    if (!type || !reason) {
      return res.status(400).json({
        message: "Document type and reason are required",
      });
    }

    // Validate document type
    const validTypes = ["recommendation", "certificate", "experience"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        message:
          "Invalid document type. Valid types are: recommendation, certificate, experience",
      });
    }

    // For certificate type, customType is required
    if (type === "certificate" && !customType) {
      return res.status(400).json({
        message: "Custom type is required for certificate requests",
      });
    }

    const docRequest = await DocumentRequest.create({
      userId: req.user.id,
      type,
      customType,
      reason,
      status: "pending",
    });

    res.status(201).json(docRequest);
  } catch (error) {
    console.error("Error in requestDocument:", error);
    res.status(500).json({ message: error.message });
  }
};

export const generateDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const { htmlContent } = req.body; // Admin sends the template HTML with filled data
    const adminId = req.user.id;

    console.log("=== Generate Document Request ===");
    console.log("Request ID:", id);
    console.log("Admin ID:", adminId);
    console.log("HTML Content Length:", htmlContent?.length);

    // Validate required fields
    if (!htmlContent) {
      return res
        .status(400)
        .json({ message: "HTML content is required for document generation" });
    }

    const docRequest = await DocumentRequest.findById(id).populate("userId");
    if (!docRequest) {
      console.error("Document request not found:", id);
      return res.status(404).json({ message: "Document request not found" });
    }

    console.log("Document Request Found:", {
      type: docRequest.type,
      status: docRequest.status,
      userId: docRequest.userId?._id
    });

    if (docRequest.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Document request is already processed" });
    }

    // Generate PDF & Upload to Cloudinary
    const fileName = `${docRequest.type}-${docRequest.userId.fullName}`;
    console.log("Generating PDF with filename:", fileName);

    const pdfUrl = await generateAndUploadPDF(htmlContent, fileName);
    console.log("PDF Generated and uploaded:", pdfUrl);

    // Update Request
    docRequest.status = "generated";
    docRequest.generatedDocumentUrl = pdfUrl;
    docRequest.reviewedBy = adminId;
    docRequest.reviewedAt = new Date();
    docRequest.completedAt = new Date(); // Set completion time
    await docRequest.save();

    console.log("Document request updated successfully");

    // Notify Employee (skip if email service fails)
    try {
      await emailService.sendStatusUpdateEmail(
        docRequest.userId,
        "Document Request",
        "generated",
        "Your document is ready for download."
      );
      console.log("Email notification sent");
    } catch (emailError) {
      console.error("Email notification failed (non-critical):", emailError.message);
      // Don't fail the request if email fails
    }

    res.json({ message: "Document generated successfully", url: pdfUrl });
  } catch (error) {
    console.error("=== Error in generateDocument ===");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    res.status(500).json({ message: error.message, error: error.toString() });
  }
};

export const getRequestDocuments = async (req, res) => {
  try {
    const { role, id } = req.user;
    let query = {};

    if (role !== "admin") query.userId = id;

    const requests = await DocumentRequest.find(query)
      .populate("userId", "fullName designation")
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Download document endpoint
export const downloadDocument = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id) {
      return res
        .status(400)
        .json({ message: "Document request ID is required" });
    }

    const docRequest = await DocumentRequest.findById(id).populate("userId");
    if (!docRequest)
      return res.status(404).json({ message: "Document request not found" });

    // Check if user is the document owner or admin
    if (
      req.user.role !== "admin" &&
      docRequest.userId._id.toString() !== userId.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (docRequest.status !== "generated") {
      return res
        .status(400)
        .json({ message: "Document is not ready for download" });
    }

    if (!docRequest.generatedDocumentUrl) {
      return res
        .status(400)
        .json({ message: "Document file is not available" });
    }

    // Update status to indicate download
    if (req.user.role !== "admin") {
      // Only update status for employee, not admin preview
      docRequest.status = "downloaded";
      await docRequest.save();
    }

    // Redirect to document URL
    res.redirect(docRequest.generatedDocumentUrl);
  } catch (error) {
    console.error("Error in downloadDocument:", error);
    res.status(500).json({ message: error.message });
  }
};

// Cancel document request
export const cancelDocumentRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    if (!id) {
      return res
        .status(400)
        .json({ message: "Document request ID is required" });
    }

    const docRequest = await DocumentRequest.findById(id);
    if (!docRequest)
      return res.status(404).json({ message: "Document request not found" });

    if (docRequest.userId.toString() !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    if (docRequest.status !== "pending") {
      return res
        .status(400)
        .json({ message: "Cannot cancel processed request" });
    }

    docRequest.status = "cancelled";
    await docRequest.save();

    res.json({ message: "Document request cancelled", docRequest });
  } catch (error) {
    console.error("Error in cancelDocumentRequest:", error);
    res.status(500).json({ message: error.message });
  }
};
