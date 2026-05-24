import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

async function testUpload() {
  try {
    console.log("Uploading test image...");

    const result = await cloudinary.uploader.upload(
      "https://res.cloudinary.com/demo/image/upload/sample.jpg",
      {
        folder: "civicsync-test",
      }
    );

    console.log("✅ Upload successful!");
    console.log("Public ID:", result.public_id);
    console.log("URL:", result.secure_url);

    // Optional: Fetch details to confirm API access
    const info = await cloudinary.api.resource(result.public_id);

    console.log("✅ Fetch successful!");
    console.log("Resource format:", info.format);
  } catch (error) {
    console.error("❌ Cloudinary test failed:");
    console.error(error);
  }
}

testUpload();