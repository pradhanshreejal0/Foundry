import multer from "multer";

// Allowed image MIME types
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
  "image/bmp",
  "image/tiff",
];

// Files are kept in memory (not on disk) and then sent on to Cloudinary.
// Supports raster images (JPEG, PNG, WebP, GIF, BMP, TIFF) and vector images (SVG).
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) =>
    ALLOWED_MIME_TYPES.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error("Unsupported image format. Allowed: JPEG, PNG, WebP, GIF, SVG, BMP, TIFF"), false),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});
