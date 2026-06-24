import { Router } from "express";
import { db } from "../db";
import { profilesTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";

const router = Router();

/**
 * GET current user profile
 */
router.get("/me", async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const profile = await db.query.profilesTable.findFirst({
      where: eq(profilesTable.clerkId, userId),
    });

    return res.json(profile ?? null);
  } catch (err) {
    return res.status(500).json({ error: "Failed to fetch profile" });
  }
});

/**
 * CREATE / UPDATE current user profile
 */
router.post("/me", async (req, res) => {
  try {
    const { userId } = getAuth(req);

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { fullName, avatarUrl } = req.body;

    if (!fullName) {
      return res.status(400).json({ error: "fullName is required" });
    }

    const existing = await db.query.profilesTable.findFirst({
      where: eq(profilesTable.clerkId, userId),
    });

    // UPDATE
    if (existing) {
      const updated = await db
        .update(profilesTable)
        .set({
          fullName,
          avatarUrl: avatarUrl ?? null,
        })
        .where(eq(profilesTable.clerkId, userId))
        .returning();

      return res.json(updated[0]);
    }

    // INSERT
    const created = await db
      .insert(profilesTable)
      .values({
        clerkId: userId,
        fullName,
        avatarUrl: avatarUrl ?? null,
      })
      .returning();

    return res.json(created[0]);
  } catch (err) {
    return res.status(500).json({ error: "Failed to save profile" });
  }
});

export default router;