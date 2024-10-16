import cloudinary from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";
import { v4 as uuidv4 } from "uuid";

dotenv.config();

cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const cloudinaryStorage = (folderName) => {
  return new CloudinaryStorage({
    cloudinary: cloudinary.v2,
    params: {
      folder: `${process.env.CLOUDINARY_FOLDER_NAME}/${folderName}`,
      allowed_formats: ["jpg", "jpeg", "png"],
      public_id: (_, __) => {
        const uniqueFileName = `${Date.now()}-${uuidv4()}`;
        return uniqueFileName;
      },
    },
  });
};

export const deleteImageFromCloudinary = async (publicId) => {
  try {
    await cloudinary.v2.uploader.destroy(publicId);
    console.log(`Image with publicId ${publicId} deleted from Cloudinary.`);
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
    throw new Error("Failed to delete image from Cloudinary");
  }
};
