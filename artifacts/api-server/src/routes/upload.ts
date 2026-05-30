import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../middlewares/auth.js";
import { uploadAvatar } from "../lib/cloudinary.js";

const router = Router();

router.post("/upload/avatar", requireAuth, async (req, res) => {
  const userId = req.user!.userId;
  const { image } = req.body as { image: string };

  if (!image) {
    res.status(400).json({ message: "Image data required (base64)" });
    return;
  }

  const MAX_SIZE = 5 * 1024 * 1024;
  const base64Len = image.length * 0.75;
  if (base64Len > MAX_SIZE) {
    res.status(400).json({ message: "Image too large (max 5MB)" });
    return;
  }

  try {
    const avatarUrl = await uploadAvatar(image, userId);
    await db.update(usersTable).set({ avatarUrl } as never).where(eq(usersTable.id, userId));
    res.json({ avatarUrl, message: "Avatar mis à jour !" });
  } catch (err: any) {
    res.status(500).json({ message: "Upload failed: " + (err?.message ?? "unknown error") });
  }
});

export default router;
