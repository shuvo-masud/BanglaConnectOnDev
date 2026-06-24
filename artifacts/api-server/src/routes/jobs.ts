import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, jobsTable, profilesTable } from "@workspace/db";
import {
  ListJobsResponse,
  GetJobResponse,
  CreateJobBody,
  GetJobParams,
} from "@workspace/api-zod";
import { requireAuth, getAuthUserId } from "../lib/auth";

const router: IRouter = Router();

async function enrichJob(job: typeof jobsTable.$inferSelect) {
  let postedBy;
  if (job.postedById) {
    const [p] = await db.select().from(profilesTable).where(eq(profilesTable.id, job.postedById));
    postedBy = p ? { ...p, createdAt: p.createdAt.toISOString() } : undefined;
  }
  return {
    ...job,
    createdAt: job.createdAt.toISOString(),
    expiresAt: job.expiresAt ? job.expiresAt.toISOString() : null,
    postedBy,
  };
}

router.get("/jobs", async (req, res): Promise<void> => {
  const { workMode, tag, search, location } = req.query as Record<string, string | undefined>;

  let rows = await db.select().from(jobsTable).orderBy(desc(jobsTable.createdAt));

  if (workMode) rows = rows.filter((j) => j.workMode === workMode);
  if (location) rows = rows.filter((j) => j.location.toLowerCase().includes(location.toLowerCase()));
  if (tag) rows = rows.filter((j) => j.tags.includes(tag));
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter((j) => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q));
  }

  const enriched = await Promise.all(rows.map(enrichJob));
  res.json(ListJobsResponse.parse(enriched));
});

router.get("/jobs/:id", async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetJobParams.safeParse({ id: rawId });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [job] = await db.select().from(jobsTable).where(eq(jobsTable.id, params.data.id));
  if (!job) { res.status(404).json({ error: "Not found" }); return; }

  res.json(GetJobResponse.parse(await enrichJob(job)));
});

router.post("/jobs", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const parsed = CreateJobBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.clerkId, userId));
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  const [job] = await db.insert(jobsTable).values({
    ...parsed.data,
    postedById: profile.id,
    tags: parsed.data.tags ?? [],
    jobType: parsed.data.jobType ?? "full-time",
    workMode: parsed.data.workMode ?? "onsite",
    expiresAt: parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : null,
  }).returning();

  res.status(201).json(await enrichJob(job));
});

export default router;
