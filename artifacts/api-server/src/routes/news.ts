import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, newsTable, profilesTable } from "@workspace/db";
import {
  ListNewsResponse,
  GetNewsItemResponse,
  CreateNewsBody,
  GetNewsItemParams,
} from "@workspace/api-zod";
import { requireAuth, getAuthUserId } from "../lib/auth";

const router: IRouter = Router();

async function enrichNews(item: typeof newsTable.$inferSelect) {
  let author;
  if (item.authorId) {
    const [a] = await db.select().from(profilesTable).where(eq(profilesTable.id, item.authorId));
    author = a ? { ...a, createdAt: a.createdAt.toISOString() } : undefined;
  }
  return { ...item, createdAt: item.createdAt.toISOString(), author };
}

router.get("/news", async (req, res): Promise<void> => {
  const { tag, search } = req.query as { tag?: string; search?: string };

  let rows = await db.select().from(newsTable).orderBy(desc(newsTable.createdAt));

  if (tag) rows = rows.filter((n) => n.tags.includes(tag));
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter((n) => n.title.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q));
  }

  const enriched = await Promise.all(rows.map(enrichNews));
  res.json(ListNewsResponse.parse(enriched));
});

router.get("/news/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetNewsItemParams.safeParse({ id: rawId });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [item] = await db.select().from(newsTable).where(eq(newsTable.id, params.data.id));
  if (!item) { res.status(404).json({ error: "Not found" }); return; }

  res.json(GetNewsItemResponse.parse(await enrichNews(item)));
});

router.post("/news", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const parsed = CreateNewsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.clerkId, userId));
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  const [item] = await db.insert(newsTable).values({
    ...parsed.data,
    authorId: profile.id,
    tags: parsed.data.tags ?? [],
  }).returning();

  res.status(201).json(await enrichNews(item));
});

export default router;
