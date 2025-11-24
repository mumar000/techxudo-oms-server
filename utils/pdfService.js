import html_to_pdf from 'html-pdf-node';
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

// Configure Cloudinary (Backend Side)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Generates a PDF from HTML and uploads it to Cloudinary
 * @param {string} htmlContent - The HTML string to convert
 * @param {string} fileName - Desired filename
 * @returns {Promise<string>} - Cloudinary URL
 */
export const generateAndUploadPDF = async (htmlContent, fileName) => {
  try {
    console.log("=== PDF Generation Started ===");
    console.log("Filename:", fileName);
    console.log("HTML Content Length:", htmlContent?.length);

    const options = { format: 'A4', printBackground: true };
    const file = { content: htmlContent };

    // 1. Generate Buffer
    console.log("Generating PDF buffer...");
    const pdfBuffer = await html_to_pdf.generatePdf(file, options);
    console.log("PDF Buffer generated, size:", pdfBuffer?.length, "bytes");

    // Check Cloudinary config
    console.log("Cloudinary Config:", {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? "Set" : "Missing",
      api_secret: process.env.CLOUDINARY_API_SECRET ? "Set" : "Missing"
    });

    // 2. Upload Buffer to Cloudinary using base64
    console.log("Uploading to Cloudinary...");

    // Convert buffer to base64
    const base64Pdf = `data:application/pdf;base64,${pdfBuffer.toString('base64')}`;

    return new Promise((resolve, reject) => {
      cloudinary.uploader.upload(
        base64Pdf,
        {
          resource_type: 'raw',
          public_id: `documents/${fileName}_${Date.now()}`,
          format: 'pdf',
          access_mode: 'public'
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary Upload Error:", error);
            reject(error);
          } else {
            console.log("Upload successful! URL:", result.secure_url);
            resolve(result.secure_url);
          }
        }
      );
    });
  } catch (error) {
    console.error("=== PDF Generation Error ===");
    console.error("Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    throw new Error(`Failed to generate document: ${error.message}`);
  }
};