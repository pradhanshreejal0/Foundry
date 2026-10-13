import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, AlertCircle, X } from "lucide-react";
import { uploadImage } from "@/lib/upload";

/**
 * Unified image uploader component for admin pages
 * Accepts any image format, handles errors, shows preview
 *
 * @param {Object} props
 * @param {function} props.onUpload - Callback when image is uploaded (receives URL)
 * @param {string} props.imageUrl - Current image URL (optional, for display)
 * @param {string} props.label - Label for the uploader (default: "Upload Image")
 * @param {string} props.accessToken - Auth token for upload
 * @param {boolean} props.disabled - Disable uploader
 * @returns {JSX.Element}
 */
export default function ImageUploader({
  onUpload,
  imageUrl,
  label = "Upload Image",
  accessToken,
  disabled = false,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [preview, setPreview] = useState(imageUrl || "");

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset error
    setError("");

    // Validate file is an image
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }

    // Validate file size (10 MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Image must be smaller than 10 MB");
      return;
    }

    setUploading(true);

    try {
      const url = await uploadImage(file, accessToken);
      setPreview(url);
      onUpload(url);
    } catch (err) {
      const errorMessage = err.message || "Image upload failed";
      setError(errorMessage);
      console.error("Image upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const clearImage = () => {
    setPreview("");
    setError("");
    onUpload("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">{label}</label>
        {preview && (
          <button
            type="button"
            onClick={clearImage}
            className="text-xs text-destructive hover:text-destructive/80 transition"
          >
            Clear
          </button>
        )}
      </div>

      {/* Upload Button */}
      <label
        className={`flex items-center justify-center rounded-lg border-2 border-dashed border-input p-6 cursor-pointer transition ${
          uploading || disabled
            ? "opacity-50 cursor-not-allowed"
            : "hover:border-primary hover:bg-primary/5"
        }`}
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading || disabled}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-2 text-center">
          {uploading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-6 h-6 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  Click to upload
                </p>
                <p className="text-xs text-muted-foreground">
                  Any image format • Max 10 MB
                </p>
              </div>
            </>
          )}
        </div>
      </label>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-destructive">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Image Preview */}
      {preview && !error && (
        <div className="rounded-lg border border-input overflow-hidden bg-muted">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-auto max-h-64 object-cover"
          />
          <div className="p-2 bg-muted text-xs text-muted-foreground">
            <p className="truncate">Image uploaded successfully</p>
          </div>
        </div>
      )}
    </div>
  );
}
