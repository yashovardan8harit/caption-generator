import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import axios from "axios";

// Existing utility function
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Uploads a file to Cloudinary using signed upload (from FastAPI backend)
 * @param {File} file 
 * @param {Function} onProgress - Optional progress callback
 * @returns {Promise<string>} image URL
 */
export const uploadToCloudinary = async (file, onProgress = null) => {
  try {
    // Validate file
    if (!file) {
      throw new Error("No file provided");
    }

    // Check file size (optional - adjust limit as needed)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error("File size too large. Maximum allowed size is 10MB.");
    }

    // Check file type
    if (!file.type.startsWith('image/')) {
      throw new Error("Please upload only image files");
    }

    console.log("Starting upload process for file:", file.name);

    // 1. Get signature & credentials from backend
    console.log("Fetching signature from backend...");
    const { data } = await axios.get("http://localhost:8000/generate-signature");
    
    console.log("Signature received:", {
      api_key: data.api_key,
      cloud_name: data.cloud_name,
      timestamp: data.timestamp
    });

    // 2. Prepare form data
    const formData = new FormData();
    formData.append("file", file);
    formData.append("api_key", data.api_key);
    formData.append("timestamp", data.timestamp);
    formData.append("signature", data.signature);
    formData.append("folder", "uploads"); // optional: change as needed

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${data.cloud_name}/image/upload`;
    console.log("Uploading to Cloudinary URL:", cloudinaryUrl);

    // 3. Upload image to Cloudinary with progress tracking
    const response = await axios.post(cloudinaryUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.lengthComputable) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          console.log(`Upload progress: ${percentCompleted}%`);
          
          // Call progress callback if provided
          if (onProgress && typeof onProgress === 'function') {
            onProgress(percentCompleted);
          }
        }
      },
      timeout: 30000, // 30 second timeout
    });

    console.log("Upload successful:", {
      url: response.data.secure_url,
      public_id: response.data.public_id,
      format: response.data.format,
      width: response.data.width,
      height: response.data.height,
      bytes: response.data.bytes
    });

    return response.data.secure_url;

  } catch (err) {
    console.error("Cloudinary upload error:", err);
    
    // Handle different types of errors
    if (err.response) {
      // Server responded with error status
      const errorMessage = err.response.data?.error?.message || 
                          err.response.data?.message || 
                          `Upload failed with status ${err.response.status}`;
      console.error("Server error:", err.response.data);
      throw new Error(errorMessage);
    } else if (err.request) {
      // Request made but no response received
      console.error("Network error:", err.request);
      throw new Error("Network error: Could not connect to upload service");
    } else if (err.code === 'ECONNABORTED') {
      // Request timeout
      throw new Error("Upload timeout: The file is taking too long to upload");
    } else {
      // Something else happened
      throw new Error(err.message || "Unknown upload error occurred");
    }
  }
};

/**
 * Alternative upload method using upload preset (if you prefer unsigned uploads)
 * @param {File} file 
 * @param {string} uploadPreset 
 * @param {string} cloudName 
 * @returns {Promise<string>}
 */
export const uploadToCloudinaryUnsigned = async (file, uploadPreset, cloudName) => {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", uploadPreset);
    
    const response = await axios.post(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      formData
    );
    
    return response.data.secure_url;
  } catch (error) {
    console.error("Unsigned upload error:", error);
    throw error;
  }
};