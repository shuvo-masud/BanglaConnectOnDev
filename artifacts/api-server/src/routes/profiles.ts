import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";
import {
  GetMyProfileResponse,
  UpsertMyProfileBody,
  UpsertMyProfileResponse,
  GetProfileParams,
  GetProfileResponse,
} from "@workspace/api-zod";
import { requireAuth, getAuthUserId } from "../lib/auth";

const router: IRouter = Router();

router.get("/profiles/me", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;

  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkId, userId));

  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json(GetMyProfileResponse.parse({
    ...profile,
    createdAt: profile.createdAt.toISOString(),
  }));
});

router.put("/profiles/me", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;

  const parsed = UpsertMyProfileBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const data = parsed.data;

  const [existing] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkId, userId));

  let profile;
  if (existing) {
    [profile] = await db
      .update(profilesTable)
      .set({
        fullName: data.fullName,
        role: data.role,
        bio: data.bio ?? null,
        country: data.country,
        city: data.city ?? null,
        skills: data.skills ?? [],
        interests: data.interests ?? [],
        professionalField: data.professionalField ?? null,
        profession: data.profession ?? null,
        specialties: data.specialties ?? [],
        mentorAvailable: data.mentorAvailable ?? false,
        avatarUrl: data.avatarUrl ?? null,
      })
      .where(eq(profilesTable.clerkId, userId))
      .returning();
  } else {
    [profile] = await db
      .insert(profilesTable)
      .values({
        clerkId: userId,
        fullName: data.fullName,
        role: data.role,
        bio: data.bio ?? null,
        country: data.country,
        city: data.city ?? null,
        skills: data.skills ?? [],
        interests: data.interests ?? [],
        professionalField: data.professionalField ?? null,
        profession: data.profession ?? null,
        specialties: data.specialties ?? [],
        mentorAvailable: data.mentorAvailable ?? false,
        avatarUrl: data.avatarUrl ?? null,
      })
      .returning();
  }

  res.json(UpsertMyProfileResponse.parse({
    ...profile,
    createdAt: profile.createdAt.toISOString(),
  }));
});

router.get("/profiles/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetProfileParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [profile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, Number(params.data.id)));

  if (!profile) {
    res.status(404).json({ error: "Profile not found" });
    return;
  }

  res.json(GetProfileResponse.parse({
    ...profile,
    createdAt: profile.createdAt.toISOString(),
  }));
});

export default router;
