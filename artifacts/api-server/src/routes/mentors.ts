import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, profilesTable } from "@workspace/db";
import {
  ListMentorsQueryParams,
  ListMentorsResponse,
  GetMentorStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/mentors", async (req, res): Promise<void> => {
  const query = ListMentorsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { specialty, country, available, search } = query.data;

  const conditions = [
    eq(profilesTable.role, "mentor"),
    eq(profilesTable.mentorStatus, "approved"),
  ];

  if (country) {
    conditions.push(eq(profilesTable.country, country));
  }

  if (available !== undefined) {
    conditions.push(eq(profilesTable.mentorAvailable, available));
  }

  let mentors = await db
    .select()
    .from(profilesTable)
    .where(and(...conditions))
    .orderBy(profilesTable.createdAt);

  if (specialty) {
    mentors = mentors.filter((m) =>
      m.specialties.some((s) =>
        s.toLowerCase().includes(specialty.toLowerCase()),
      ),
    );
  }

  if (search) {
    const q = search.toLowerCase();
    mentors = mentors.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.bio?.toLowerCase().includes(q) ||
        m.city?.toLowerCase().includes(q) ||
        m.specialties.some((s) => s.toLowerCase().includes(q)),
    );
  }

  res.json(
    ListMentorsResponse.parse(
      mentors.map((m) => ({ ...m, createdAt: m.createdAt.toISOString() })),
    ),
  );
});

router.get("/mentors/stats", async (_req, res): Promise<void> => {
  const mentors = await db
    .select()
    .from(profilesTable)
    .where(and(eq(profilesTable.role, "mentor"), eq(profilesTable.mentorStatus, "approved")));

  const available = mentors.filter((m) => m.mentorAvailable);
  const countries = new Set(mentors.map((m) => m.country)).size;

  const specialtyMap = new Map<string, number>();
  for (const mentor of mentors) {
    for (const s of mentor.specialties) {
      specialtyMap.set(s, (specialtyMap.get(s) ?? 0) + 1);
    }
  }

  const specialtyCounts = Array.from(specialtyMap.entries())
    .map(([specialty, count]) => ({ specialty, count }))
    .sort((a, b) => b.count - a.count);

  res.json(
    GetMentorStatsResponse.parse({
      totalMentors: mentors.length,
      availableMentors: available.length,
      totalCountries: countries,
      specialtyCounts,
    }),
  );
});

export default router;
