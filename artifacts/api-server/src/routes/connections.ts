import { Router, type IRouter } from "express";
import { eq, or, and } from "drizzle-orm";
import { db, connectionsTable, profilesTable } from "@workspace/db";
import {
  ListConnectionsResponse,
  RequestConnectionBody,
  UpdateConnectionParams,
  UpdateConnectionBody,
  UpdateConnectionResponse,
} from "@workspace/api-zod";
import { requireAuth, getAuthUserId } from "../lib/auth";

const router: IRouter = Router();

router.get("/connections", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;

  const [myProfile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkId, userId));

  if (!myProfile) {
    res.json([]);
    return;
  }

  const rows = await db
    .select()
    .from(connectionsTable)
    .where(
      or(
        eq(connectionsTable.fromProfileId, myProfile.id),
        eq(connectionsTable.toProfileId, myProfile.id),
      ),
    )
    .orderBy(connectionsTable.createdAt);

  const profileIds = new Set<number>();
  for (const r of rows) {
    profileIds.add(r.fromProfileId);
    profileIds.add(r.toProfileId);
  }

  const profiles = await db
    .select()
    .from(profilesTable)
    .where(
      or(
        ...Array.from(profileIds).map((id) => eq(profilesTable.id, id)),
      ),
    );

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const enriched = rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    fromProfile: (() => {
      const p = profileMap.get(r.fromProfileId);
      return p ? { ...p, createdAt: p.createdAt.toISOString() } : undefined;
    })(),
    toProfile: (() => {
      const p = profileMap.get(r.toProfileId);
      return p ? { ...p, createdAt: p.createdAt.toISOString() } : undefined;
    })(),
  }));

  res.json(ListConnectionsResponse.parse(enriched));
});

router.post("/connections", requireAuth, async (req, res): Promise<void> => {
  const userId = getAuthUserId(req)!;

  const parsed = RequestConnectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [myProfile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.clerkId, userId));

  if (!myProfile) {
    res.status(404).json({ error: "Your profile not found" });
    return;
  }

  if (myProfile.id === parsed.data.toProfileId) {
    res.status(400).json({ error: "Cannot connect with yourself" });
    return;
  }

  const [existing] = await db
    .select()
    .from(connectionsTable)
    .where(
      or(
        and(
          eq(connectionsTable.fromProfileId, myProfile.id),
          eq(connectionsTable.toProfileId, parsed.data.toProfileId),
        ),
        and(
          eq(connectionsTable.fromProfileId, parsed.data.toProfileId),
          eq(connectionsTable.toProfileId, myProfile.id),
        ),
      ),
    );

  if (existing) {
    res.status(409).json({ error: "Connection already exists" });
    return;
  }

  const [connection] = await db
    .insert(connectionsTable)
    .values({
      fromProfileId: myProfile.id,
      toProfileId: parsed.data.toProfileId,
      message: parsed.data.message ?? null,
      status: "pending",
    })
    .returning();

  const [fromProfile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, connection.fromProfileId));

  const [toProfile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, connection.toProfileId));

  res.status(201).json({
    ...connection,
    createdAt: connection.createdAt.toISOString(),
    fromProfile: fromProfile ? { ...fromProfile, createdAt: fromProfile.createdAt.toISOString() } : undefined,
    toProfile: toProfile ? { ...toProfile, createdAt: toProfile.createdAt.toISOString() } : undefined,
  });
});

router.patch("/connections/:id", requireAuth, async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateConnectionParams.safeParse({ id: rawId });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateConnectionBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [connection] = await db
    .update(connectionsTable)
    .set({ status: parsed.data.status })
    .where(eq(connectionsTable.id, params.data.id))
    .returning();

  if (!connection) {
    res.status(404).json({ error: "Connection not found" });
    return;
  }

  const [fromProfile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, connection.fromProfileId));

  const [toProfile] = await db
    .select()
    .from(profilesTable)
    .where(eq(profilesTable.id, connection.toProfileId));

  res.json(
    UpdateConnectionResponse.parse({
      ...connection,
      createdAt: connection.createdAt.toISOString(),
      fromProfile: fromProfile ? { ...fromProfile, createdAt: fromProfile.createdAt.toISOString() } : undefined,
      toProfile: toProfile ? { ...toProfile, createdAt: toProfile.createdAt.toISOString() } : undefined,
    }),
  );
});

export default router;
