import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function uploadAvatar(base64Data: string, userId: number): Promise<string> {
  const result = await cloudinary.uploader.upload(base64Data, {
    folder: "boost-community/avatars",
    public_id: `user_${userId}`,
    overwrite: true,
    transformation: [{ width: 400, height: 400, crop: "fill", gravity: "face" }],
  });
  return result.secure_url;
}

export { cloudinary };
