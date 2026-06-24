import { Router, type IRouter } from "express";
import { eq, desc, ilike, or } from "drizzle-orm";
import { db, blogsTable, profilesTable } from "@workspace/db";
import {
  ListBlogsResponse,
  GetBlogResponse,
  CreateBlogBody,
  UpdateBlogBody,
  GetBlogParams,
  UpdateBlogParams,
  DeleteBlogParams,
} from "@workspace/api-zod";
import { requireAuth, getAuthUserId } from "../lib/auth";

const router: IRouter = Router();

async function enrichBlog(blog: typeof blogsTable.$inferSelect) {
  const [author] = await db.select().from(profilesTable).where(eq(profilesTable.id, blog.authorId));
  return {
    ...blog,
    createdAt: blog.createdAt.toISOString(),
    updatedAt: blog.updatedAt.toISOString(),
    author: author ? { ...author, createdAt: author.createdAt.toISOString() } : undefined,
  };
}

router.get("/blogs", async (req, res): Promise<void> => {
  const { tag, search } = req.query as { tag?: string; search?: string };

  let rows = await db
    .select()
    .from(blogsTable)
    .where(eq(blogsTable.published, true))
    .orderBy(desc(blogsTable.createdAt));

  if (tag) rows = rows.filter((b) => b.tags.includes(tag));
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter((b) => b.title.toLowerCase().includes(q) || b.excerpt?.toLowerCase().includes(q));
  }

  const enriched = await Promise.all(rows.map(enrichBlog));
  res.json(ListBlogsResponse.parse(enriched));
});

router.get("/blogs/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetBlogParams.safeParse({ id: rawId });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [blog] = await db.select().from(blogsTable).where(eq(blogsTable.id, params.data.id));
  if (!blog) { res.status(404).json({ error: "Not found" }); return; }

  res.json(GetBlogResponse.parse(await enrichBlog(blog)));
});

router.post("/blogs", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const parsed = CreateBlogBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.clerkId, userId));
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  const [blog] = await db.insert(blogsTable).values({
    ...parsed.data,
    authorId: profile.id,
    tags: parsed.data.tags ?? [],
    published: parsed.data.published ?? true,
  }).returning();

  res.status(201).json(await enrichBlog(blog));
});

router.put("/blogs/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateBlogParams.safeParse({ id: rawId });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const parsed = UpdateBlogBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.clerkId, userId));
  const [existing] = await db.select().from(blogsTable).where(eq(blogsTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (!profile || existing.authorId !== profile.id) { res.status(403).json({ error: "Forbidden" }); return; }

  const [blog] = await db.update(blogsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(eq(blogsTable.id, params.data.id))
    .returning();

  res.json(await enrichBlog(blog));
});

router.delete("/blogs/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteBlogParams.safeParse({ id: rawId });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.clerkId, userId));
  const [existing] = await db.select().from(blogsTable).where(eq(blogsTable.id, params.data.id));
  if (!existing) { res.status(404).json({ error: "Not found" }); return; }
  if (!profile || existing.authorId !== profile.id) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.delete(blogsTable).where(eq(blogsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
