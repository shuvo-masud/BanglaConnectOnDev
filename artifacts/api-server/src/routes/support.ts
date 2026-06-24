import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, supportTicketsTable, profilesTable } from "@workspace/db";
import { requireAuth, getAuthUserId } from "../lib/auth";

const router: IRouter = Router();

router.get("/support/tickets", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const profile = await db.query.profilesTable.findFirst({ where: eq(profilesTable.clerkId, userId) });
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  const tickets = await db.select().from(supportTicketsTable)
    .where(eq(supportTicketsTable.userId, profile.id))
    .orderBy(desc(supportTicketsTable.createdAt));

  res.json(tickets.map(t => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
  })));
});

router.post("/support/tickets", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const profile = await db.query.profilesTable.findFirst({ where: eq(profilesTable.clerkId, userId) });
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  const { subject, description } = req.body;
  if (!subject || !description) { res.status(400).json({ error: "subject and description are required" }); return; }

  const [ticket] = await db.insert(supportTicketsTable).values({
    userId: profile.id,
    subject,
    description,
    status: "open",
  }).returning();

  res.status(201).json({ ...ticket, createdAt: ticket.createdAt.toISOString(), updatedAt: ticket.updatedAt.toISOString() });
});

router.get("/support/tickets/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const profile = await db.query.profilesTable.findFirst({ where: eq(profilesTable.clerkId, userId) });
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  const ticket = await db.query.supportTicketsTable.findFirst({
    where: eq(supportTicketsTable.id, parseInt(String(req.params.id))),
  });
  if (!ticket) { res.status(404).json({ error: "Not found" }); return; }
  if (ticket.userId !== profile.id && profile.role !== "admin") { res.status(403).json({ error: "Forbidden" }); return; }

  res.json({ ...ticket, createdAt: ticket.createdAt.toISOString(), updatedAt: ticket.updatedAt.toISOString() });
});

export default router;
