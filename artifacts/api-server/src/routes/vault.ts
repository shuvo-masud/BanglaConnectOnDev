import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import { db, vaultItemsTable, profilesTable } from "@workspace/db";
import { requireAuth, getAuthUserId } from "../lib/auth";

const router: IRouter = Router();

router.get("/vault", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const profile = await db.query.profilesTable.findFirst({ where: eq(profilesTable.clerkId, userId) });
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  const items = await db.select().from(vaultItemsTable)
    .where(eq(vaultItemsTable.ownerId, profile.id))
    .orderBy(desc(vaultItemsTable.updatedAt));

  res.json(items.map(i => ({ ...i, createdAt: i.createdAt.toISOString(), updatedAt: i.updatedAt.toISOString() })));
});

router.post("/vault", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const profile = await db.query.profilesTable.findFirst({ where: eq(profilesTable.clerkId, userId) });
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  const { title, description, content, visibility, coverImageUrl, fileUrl, fileType, tags } = req.body;
  if (!title) { res.status(400).json({ error: "title is required" }); return; }

  const [item] = await db.insert(vaultItemsTable).values({
    ownerId: profile.id,
    title,
    description: description || null,
    content: content || null,
    visibility: visibility || "private",
    coverImageUrl: coverImageUrl || null,
    fileUrl: fileUrl || null,
    fileType: fileType || null,
    tags: tags || [],
  }).returning();

  res.status(201).json({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() });
});

router.get("/vault/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const profile = await db.query.profilesTable.findFirst({ where: eq(profilesTable.clerkId, userId) });
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  const item = await db.query.vaultItemsTable.findFirst({
    where: and(eq(vaultItemsTable.id, parseInt(String(req.params.id))), eq(vaultItemsTable.ownerId, profile.id)),
  });
  if (!item) { res.status(404).json({ error: "Not found" }); return; }

  res.json({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() });
});

router.put("/vault/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const profile = await db.query.profilesTable.findFirst({ where: eq(profilesTable.clerkId, userId) });
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  const { title, description, content, visibility, coverImageUrl, fileUrl, fileType, tags } = req.body;

  const [item] = await db.update(vaultItemsTable).set({
    title,
    description: description || null,
    content: content || null,
    visibility: visibility || "private",
    coverImageUrl: coverImageUrl || null,
    fileUrl: fileUrl || null,
    fileType: fileType || null,
    tags: tags || [],
    updatedAt: new Date(),
  }).where(and(eq(vaultItemsTable.id, parseInt(String(req.params.id))), eq(vaultItemsTable.ownerId, profile.id))).returning();

  if (!item) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...item, createdAt: item.createdAt.toISOString(), updatedAt: item.updatedAt.toISOString() });
});

router.delete("/vault/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const profile = await db.query.profilesTable.findFirst({ where: eq(profilesTable.clerkId, userId) });
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  await db.delete(vaultItemsTable).where(
    and(eq(vaultItemsTable.id, parseInt(String(req.params.id))), eq(vaultItemsTable.ownerId, profile.id))
  );
  res.status(204).send();
});

export default router;
