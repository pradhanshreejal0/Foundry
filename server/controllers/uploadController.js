import cloudinary from "../config/cloudinary.js";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

/**
 * Validate SVG for malicious content (scripts, event handlers, etc.)
 */
const validateSVG = (svgContent) => {
  const svg = svgContent.toString("utf8");

  // Block common XSS vectors in SVG: scripts, event handlers, javascript: /
  // data: URLs, and elements that can load external content.
  if (
    /<script[\s>]/i.test(svg) ||
    /\son\w+\s*=/i.test(svg) ||
    /javascript\s*:/i.test(svg) ||
    /data\s*:/i.test(svg) ||
    /<(foreignObject|embed|object|iframe|link|meta)[\s>]/i.test(svg)
  ) {
    throw new Error("Unsafe SVG content detected. SVG contains scripts, event handlers, or external content.");
  }
};

/**
 * Upload a Buffer to Cloudinary via stream (avoids base64 overhead).
 * For SVG, use data URI encoding for safer handling.
 */
const uploadToCloudinary = (buffer, mimeType, options = {}) => {
  return new Promise((resolve, reject) => {
    // For SVG, convert to data URI to preserve format
    if (mimeType === "image/svg+xml") {
      const base64 = buffer.toString("base64");
      const dataURI = `data:image/svg+xml;base64,${base64}`;

      cloudinary.uploader.upload(
        dataURI,
        {
          folder: "ecommerce",
          resource_type: "image",
          ...options,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
    } else {
      // For raster images, use stream for efficiency
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "ecommerce",
          resource_type: "image",
          transformation: [
            { width: 1600, height: 1600, crop: "limit" },
            { quality: "auto" },
            { fetch_format: "auto" },
          ],
          ...options,
        },
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      stream.end(buffer);
    }
  });
};

export const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image file provided",
      });
    }

    if (!ALLOWED_MIME_TYPES.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Invalid image type. Allowed: JPEG, PNG, WebP, GIF, SVG, BMP, TIFF",
      });
    }

    if (req.file.size > MAX_FILE_SIZE) {
      return res.status(400).json({
        success: false,
        message: "Image size must be less than 10 MB",
      });
    }

    if (!req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "Invalid image file (no buffer)",
      });
    }

    // Validate SVG for security
    if (req.file.mimetype === "image/svg+xml") {
      try {
        validateSVG(req.file.buffer);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: error.message,
        });
      }
    }

    const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype);

    return res.status(201).json({
      success: true,
      message: "Image uploaded successfully",
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return res.status(500).json({
      success: false,
      message: "Image upload failed",
    });
  }
};
