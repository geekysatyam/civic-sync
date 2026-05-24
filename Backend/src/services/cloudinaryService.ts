import { Readable } from 'node:stream';
import { v2 as cloudinary } from 'cloudinary';

let configured = false;

function ensureConfig() {
  if (configured) return;
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (CLOUDINARY_CLOUD_NAME && CLOUDINARY_API_KEY && CLOUDINARY_API_SECRET) {
    cloudinary.config({
      cloud_name: CLOUDINARY_CLOUD_NAME,
      api_key: CLOUDINARY_API_KEY,
      api_secret: CLOUDINARY_API_SECRET,
    });
    configured = true;
  }
}

export async function uploadBuffer(
  buffer: Buffer,
  folder = 'civicsync'
): Promise<{ url: string; publicId: string }> {
  ensureConfig();
  if (!configured || !process.env.CLOUDINARY_CLOUD_NAME) {
    return {
      url: '/placeholder.svg',
      publicId: 'local-placeholder',
    };
  }
  const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream({ folder }, (err, res) => {
      if (err || !res) reject(err ?? new Error('Upload failed'));
      else resolve({ secure_url: res.secure_url, public_id: res.public_id });
    });
    Readable.from(buffer).pipe(upload);
  });
  return { url: result.secure_url, publicId: result.public_id };
}
