import { Router, type IRouter } from "express";
import { eq, or, and, desc } from "drizzle-orm";
import { db, conversationsTable, messagesTable, profilesTable } from "@workspace/db";
import { requireAuth, getAuthUserId } from "../lib/auth";

const router: IRouter = Router();

function serializeProfile(p: any) {
  return p ? { ...p, createdAt: p.createdAt.toISOString() } : null;
}

function serializeMsg(m: any, sender?: any) {
  return {
    ...m,
    createdAt: m.createdAt.toISOString(),
    readAt: m.readAt ? m.readAt.toISOString() : null,
    sender: sender ? serializeProfile(sender) : null,
  };
}

router.get("/chat/conversations", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const profile = await db.query.profilesTable.findFirst({ where: eq(profilesTable.clerkId, userId) });
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  const convs = await db.select().from(conversationsTable)
    .where(or(eq(conversationsTable.participant1Id, profile.id), eq(conversationsTable.participant2Id, profile.id)))
    .orderBy(desc(conversationsTable.lastMessageAt));

  const result = await Promise.all(convs.map(async (conv) => {
    const [p1, p2] = await Promise.all([
      db.query.profilesTable.findFirst({ where: eq(profilesTable.id, conv.participant1Id) }),
      db.query.profilesTable.findFirst({ where: eq(profilesTable.id, conv.participant2Id) }),
    ]);
    const [lastMsg] = await db.select({
      message: messagesTable,
      sender: profilesTable,
    }).from(messagesTable)
      .leftJoin(profilesTable, eq(messagesTable.senderId, profilesTable.id))
      .where(eq(messagesTable.conversationId, conv.id))
      .orderBy(desc(messagesTable.createdAt))
      .limit(1);

    return {
      ...conv,
      lastMessageAt: conv.lastMessageAt.toISOString(),
      createdAt: conv.createdAt.toISOString(),
      participant1: serializeProfile(p1),
      participant2: serializeProfile(p2),
      lastMessage: lastMsg ? serializeMsg(lastMsg.message, lastMsg.sender) : null,
    };
  }));

  res.json(result);
});

router.post("/chat/conversations", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const profile = await db.query.profilesTable.findFirst({ where: eq(profilesTable.clerkId, userId) });
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  const { otherProfileId } = req.body;
  if (!otherProfileId) { res.status(400).json({ error: "otherProfileId is required" }); return; }

  const p1 = Math.min(profile.id, otherProfileId);
  const p2 = Math.max(profile.id, otherProfileId);

  const existing = await db.query.conversationsTable.findFirst({
    where: and(eq(conversationsTable.participant1Id, p1), eq(conversationsTable.participant2Id, p2)),
  });

  const conv = existing ?? (await db.insert(conversationsTable).values({ participant1Id: p1, participant2Id: p2 }).returning())[0];

  const [part1, part2] = await Promise.all([
    db.query.profilesTable.findFirst({ where: eq(profilesTable.id, conv.participant1Id) }),
    db.query.profilesTable.findFirst({ where: eq(profilesTable.id, conv.participant2Id) }),
  ]);

  res.json({
    ...conv,
    lastMessageAt: conv.lastMessageAt.toISOString(),
    createdAt: conv.createdAt.toISOString(),
    participant1: serializeProfile(part1),
    participant2: serializeProfile(part2),
    lastMessage: null,
  });
});

router.get("/chat/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const profile = await db.query.profilesTable.findFirst({ where: eq(profilesTable.clerkId, userId) });
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  const convId = parseInt(String(req.params.id));
  const conv = await db.query.conversationsTable.findFirst({ where: eq(conversationsTable.id, convId) });
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
  if (conv.participant1Id !== profile.id && conv.participant2Id !== profile.id) { res.status(403).json({ error: "Forbidden" }); return; }

  const msgs = await db.select({
    message: messagesTable,
    sender: profilesTable,
  }).from(messagesTable)
    .leftJoin(profilesTable, eq(messagesTable.senderId, profilesTable.id))
    .where(eq(messagesTable.conversationId, convId))
    .orderBy(messagesTable.createdAt);

  res.json(msgs.map(m => serializeMsg(m.message, m.sender)));
});

router.post("/chat/conversations/:id/messages", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;
  const profile = await db.query.profilesTable.findFirst({ where: eq(profilesTable.clerkId, userId) });
  if (!profile) { res.status(404).json({ error: "Profile not found" }); return; }

  const convId = parseInt(String(req.params.id));
  const conv = await db.query.conversationsTable.findFirst({ where: eq(conversationsTable.id, convId) });
  if (!conv) { res.status(404).json({ error: "Conversation not found" }); return; }
  if (conv.participant1Id !== profile.id && conv.participant2Id !== profile.id) { res.status(403).json({ error: "Forbidden" }); return; }

  const { content } = req.body;
  if (!content?.trim()) { res.status(400).json({ error: "content is required" }); return; }

  const [[msg]] = await Promise.all([
    db.insert(messagesTable).values({ conversationId: convId, senderId: profile.id, content }).returning(),
    db.update(conversationsTable).set({ lastMessageAt: new Date() }).where(eq(conversationsTable.id, convId)),
  ]);

  res.status(201).json(serializeMsg(msg, profile));
});

export default router;
