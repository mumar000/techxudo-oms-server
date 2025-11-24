import { PDFDocument, rgb } from "pdf-lib";

/**
 * Generate a signed PDF by embedding signature image into the document
 * @param {Object} document - The document object with content and signature
 * @returns {Buffer} - Generated PDF buffer
 */
export const generateSignedPDF = async (document) => {
  try {
    // For simplicity, creating a new PDF from document content
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 800]);
    const { width, height } = page.getSize();

    // Add document content
    const content = document.content || "Digital Document Content";
    page.drawText(content, { x: 50, y: height - 50, size: 12 });

    // If signature exists, add signature section
    if (document.signature) {
      let yPos = height - 150;
      page.drawText("Digital Signature:", {
        x: 50,
        y: yPos,
        size: 14,
        color: rgb(0, 0, 0),
      });
      yPos -= 20;
      if (document.sentTo) {
        page.drawText(
          `Signed by: ${document.sentTo.toString()}", { x: 50, y: yPos, size: 12 }`
        );
      }
      yPos -= 15;
      if (document.signature.signedAt) {
        const signedAt = new Date(document.signature.signedAt).toLocaleString();
        page.drawText(
          `Date Signed: ${signedAt}", { x: 50, y: yPos, size: 12 }`
        );
      }
    }

    // Add document metadata
    let yPos = 100;
    page.drawText(`Title: ${document.title}", { x: 50, y: yPos, size: 10 }`);
    yPos -= 15;
    page.drawText(`Type: ${document.type}", { x: 50, y: yPos, size: 10 }`);
    yPos -= 15;
    if (document.createdAt) {
      const createdAt = new Date(document.createdAt).toLocaleString();
      page.drawText(`Created: ${createdAt}", { x: 50, y: yPos, size: 10 }`);
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error("Error generating signed PDF:", error);
    throw new Error("Failed to generate signed PDF");
  }
};

/**
 * Function to embed signature in PDF
 * @param {Buffer} pdfBuffer - PDF buffer to add signature to
 * @param {Object} signatureData - Signature data to embed
 * @returns {Buffer} - Modified PDF buffer
 */
export const embedSignatureInPDF = async (pdfBuffer, signatureData) => {
  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const { width, height } = lastPage.getSize();

    // Add signature information to the last page
    lastPage.drawText("Digitally Signed", { x: 50, y: height - 50, size: 14 });
    lastPage.drawText(
      `Signed by: ${signatureData.signedBy}", { x: 50, y: height - 70, size: 12 }`
    );
    lastPage.drawText(
      `Date: ${new Date().toLocaleString()}", { x: 50, y: height - 90, size: 12 }`
    );

    const modifiedPdfBytes = await pdfDoc.save();
    return Buffer.from(modifiedPdfBytes);
  } catch (error) {
    console.error("Error embedding signature in PDF:", error);
    throw new Error("Failed to embed signature in PDF");
  }
};
