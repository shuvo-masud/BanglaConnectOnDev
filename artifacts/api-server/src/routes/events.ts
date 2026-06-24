import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, eventsTable, profilesTable, eventRsvpsTable } from "@workspace/db";
import { requireAuth, getAuthUserId } from "../lib/auth";

const router: IRouter = Router();

async function enrichEvent(event: typeof eventsTable.$inferSelect, currentProfileId?: number) {
  let organizer;
  if (event.organizerId) {
    const [o] = await db.select().from(profilesTable).where(eq(profilesTable.id, event.organizerId));
    organizer = o ? { ...o, createdAt: o.createdAt.toISOString() } : undefined;
  }

  const rsvps = await db.select().from(eventRsvpsTable).where(eq(eventRsvpsTable.eventId, event.id));
  const rsvpCount = rsvps.length;
  const userRsvped = currentProfileId ? rsvps.some(r => r.userId === currentProfileId) : false;

  return {
    ...event,
    eventDate: event.eventDate.toISOString(),
    endDate: event.endDate ? event.endDate.toISOString() : null,
    createdAt: event.createdAt.toISOString(),
    organizer,
    rsvpCount,
    userRsvped,
  };
}

async function getCurrentProfile(req: any) {
  const userId = getAuthUserId(req);
  if (!userId) return null;
  return db.query.profilesTable.findFirst({ where: eq(profilesTable.clerkId, userId) }) ?? null;
}

router.get("/events", async (req, res): Promise<void> => {
  const { category, upcoming, search } = req.query as Record<string, string | undefined>;

  let rows = await db.select().from(eventsTable).orderBy(desc(eventsTable.eventDate));

  if (category) rows = rows.filter((e) => e.category === category);
  if (upcoming === "true") rows = rows.filter((e) => e.eventDate >= new Date());
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter((e) => e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q));
  }

  const profile = await getCurrentProfile(req);
  const enriched = await Promise.all(rows.map(e => enrichEvent(e, profile?.id)));
  res.json(enriched);
});

router.get("/events/:id", async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id));
  if (isNaN(id)) { res.status(400).json({ error: "Invalid ID" }); return; }

  const [event] = await db.select().from(eventsTable).where(eq(eventsTable.id, id));
  if (!event) { res.status(404).json({ error: "Not found" }); return; }

  const profile = await getCurrentProfile(req);
  res.json(await enrichEvent(event, profile?.id));
});

router.post("/events", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const [profile] = await db.select().from(profilesTable).where(eq(profilesTable.clerkId, userId));
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  const { title, description, category, eventDate, endDate, location, isVirtual, isLive, streamUrl, registrationUrl, coverImageUrl, tags } = req.body;
  if (!title || !description || !eventDate) { res.status(400).json({ error: "title, description, eventDate required" }); return; }

  const [event] = await db.insert(eventsTable).values({
    title,
    description,
    category: category || "general",
    eventDate: new Date(eventDate),
    endDate: endDate ? new Date(endDate) : null,
    location: location || null,
    isVirtual: isVirtual ?? false,
    isLive: isLive ?? false,
    streamUrl: streamUrl || null,
    registrationUrl: registrationUrl || null,
    coverImageUrl: coverImageUrl || null,
    tags: tags || [],
    organizerId: profile.id,
  }).returning();

  res.status(201).json(await enrichEvent(event, profile.id));
});

router.post("/events/:id/rsvp", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const profile = await db.query.profilesTable.findFirst({ where: eq(profilesTable.clerkId, userId) });
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  const eventId = parseInt(String(req.params.id));
  const event = await db.query.eventsTable.findFirst({ where: eq(eventsTable.id, eventId) });
  if (!event) { res.status(404).json({ error: "Event not found" }); return; }

  const existing = await db.query.eventRsvpsTable.findFirst({
    where: and(eq(eventRsvpsTable.eventId, eventId), eq(eventRsvpsTable.userId, profile.id)),
  });

  if (!existing) {
    await db.insert(eventRsvpsTable).values({ eventId, userId: profile.id });
  }

  const rsvps = await db.select().from(eventRsvpsTable).where(eq(eventRsvpsTable.eventId, eventId));
  res.status(201).json({ rsvped: true, rsvpCount: rsvps.length });
});

router.delete("/events/:id/rsvp", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const profile = await db.query.profilesTable.findFirst({ where: eq(profilesTable.clerkId, userId) });
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  const eventId = parseInt(String(req.params.id));
  await db.delete(eventRsvpsTable).where(
    and(eq(eventRsvpsTable.eventId, eventId), eq(eventRsvpsTable.userId, profile.id))
  );

  const rsvps = await db.select().from(eventRsvpsTable).where(eq(eventRsvpsTable.eventId, eventId));
  res.json({ rsvped: false, rsvpCount: rsvps.length });
});

export default router;
