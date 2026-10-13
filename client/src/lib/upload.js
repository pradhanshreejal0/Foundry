import { api } from "./api";

/**
 * Upload an image file to the backend (which uploads to Cloudinary)
 * @param {File} file
 * @param {string} accessToken
 * @returns {Promise<string>} - Cloudinary secure URL
 */
export async function uploadImage(file, accessToken) {
  const formData = new FormData();
  formData.append("image", file);

  const data = await api("/upload", {
    method: "POST",
    body: formData,
    accessToken,
  });

  return data.url;
}
