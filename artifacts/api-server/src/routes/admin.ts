import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, profilesTable, supportTicketsTable } from "@workspace/db";
import { requireAuth, getAuthUserId } from "../lib/auth";

const router: IRouter = Router();

async function getAdminProfile(req: any) {
  const userId = getAuthUserId(req);
  if (!userId) return null;
  const profile = await db.query.profilesTable.findFirst({ where: eq(profilesTable.clerkId, userId) });
  if (!profile || profile.role !== "admin") return null;
  return profile;
}

router.get("/admin/mentors", requireAuth, async (req, res): Promise<void> => {
  const admin = await getAdminProfile(req);
  if (!admin) { res.status(403).json({ error: "Admin access required" }); return; }

  const status = (req.query.status as string) || "pending";
  const mentors = await db.select().from(profilesTable)
    .where(eq(profilesTable.mentorStatus, status))
    .orderBy(desc(profilesTable.createdAt));

  res.json(mentors.map(m => ({ ...m, createdAt: m.createdAt.toISOString() })));
});

router.patch("/admin/mentors/:id/status", requireAuth, async (req, res): Promise<void> => {
  const admin = await getAdminProfile(req);
  if (!admin) { res.status(403).json({ error: "Admin access required" }); return; }

  const { mentorStatus } = req.body;
  if (!["pending", "approved", "rejected"].includes(mentorStatus)) {
    res.status(400).json({ error: "Invalid mentor status" }); return;
  }

  const [updated] = await db.update(profilesTable)
    .set({ mentorStatus })
    .where(eq(profilesTable.id, parseInt(String(req.params.id))))
    .returning();

  if (!updated) { res.status(404).json({ error: "Profile not found" }); return; }
  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

router.get("/admin/tickets", requireAuth, async (req, res): Promise<void> => {
  const admin = await getAdminProfile(req);
  if (!admin) { res.status(403).json({ error: "Admin access required" }); return; }

  const status = req.query.status as string | undefined;

  const rows = await db.select({
    ticket: supportTicketsTable,
    user: profilesTable,
  }).from(supportTicketsTable)
    .leftJoin(profilesTable, eq(supportTicketsTable.userId, profilesTable.id))
    .orderBy(desc(supportTicketsTable.createdAt));

  let tickets = rows.map(r => ({
    ...r.ticket,
    createdAt: r.ticket.createdAt.toISOString(),
    updatedAt: r.ticket.updatedAt.toISOString(),
    user: r.user ? { ...r.user, createdAt: r.user.createdAt.toISOString() } : null,
  }));

  if (status) tickets = tickets.filter(t => t.status === status);
  res.json(tickets);
});

router.patch("/admin/tickets/:id", requireAuth, async (req, res): Promise<void> => {
  const admin = await getAdminProfile(req);
  if (!admin) { res.status(403).json({ error: "Admin access required" }); return; }

  const { status, adminNotes } = req.body;
  const [updated] = await db.update(supportTicketsTable)
    .set({
      ...(status ? { status } : {}),
      ...(adminNotes !== undefined ? { adminNotes } : {}),
      updatedAt: new Date(),
    })
    .where(eq(supportTicketsTable.id, parseInt(String(req.params.id))))
    .returning();

  if (!updated) { res.status(404).json({ error: "Not found" }); return; }
  res.json({ ...updated, createdAt: updated.createdAt.toISOString(), updatedAt: updated.updatedAt.toISOString() });
});

router.get("/admin/users", requireAuth, async (req, res): Promise<void> => {
  const admin = await getAdminProfile(req);
  if (!admin) { res.status(403).json({ error: "Admin access required" }); return; }

  const users = await db.select().from(profilesTable).orderBy(desc(profilesTable.createdAt));
  res.json(users.map(u => ({ ...u, createdAt: u.createdAt.toISOString() })));
});

router.post("/admin/setup", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const existingAdmins = await db.select().from(profilesTable)
    .where(eq(profilesTable.role, "admin"));

  if (existingAdmins.length > 0) {
    res.status(400).json({ error: "An admin already exists. Contact them to grant you access." });
    return;
  }

  const [updated] = await db.update(profilesTable)
    .set({ role: "admin" })
    .where(eq(profilesTable.clerkId, userId))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Profile not found. Please complete your profile first." });
    return;
  }

  res.json({ ...updated, createdAt: updated.createdAt.toISOString() });
});

export default router;
