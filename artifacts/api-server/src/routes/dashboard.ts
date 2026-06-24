import { Router, type IRouter } from "express";
import { eq, or, and, desc } from "drizzle-orm";
import { db, profilesTable, connectionsTable } from "@workspace/db";
import { GetDashboardSummaryResponse } from "@workspace/api-zod";
import { requireAuth, getAuthUserId } from "../lib/auth";

const router: IRouter = Router();

router.get(
  "/dashboard/summary",
  requireAuth,
  async (req, res): Promise<void> => {
    const userId = getAuthUserId(req)!;

    const [myProfile] = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.clerkId, userId));

    const allMentors = await db
      .select()
      .from(profilesTable)
      .where(eq(profilesTable.role, "mentor"));

    const availableMentors = allMentors.filter((m) => m.mentorAvailable).length;

    let myConnectionCount = 0;
    let pendingRequests = 0;

    if (myProfile) {
      const connections = await db
        .select()
        .from(connectionsTable)
        .where(
          or(
            eq(connectionsTable.fromProfileId, myProfile.id),
            eq(connectionsTable.toProfileId, myProfile.id),
          ),
        );

      myConnectionCount = connections.filter(
        (c) => c.status === "accepted",
      ).length;
      pendingRequests = connections.filter(
        (c) => c.status === "pending" && c.toProfileId === myProfile.id,
      ).length;
    }

    const recentProfiles = await db
      .select()
      .from(profilesTable)
      .orderBy(desc(profilesTable.createdAt))
      .limit(6);

    const recentMembers = recentProfiles
      .filter((p) => p.clerkId !== userId)
      .slice(0, 5);

    res.json(
      GetDashboardSummaryResponse.parse({
        totalMentors: allMentors.length,
        availableMentors,
        myConnectionCount,
        pendingRequests,
        recentMembers: recentMembers.map((p) => ({
          ...p,
          createdAt: p.createdAt.toISOString(),
        })),
      }),
    );
  },
);

export default router;
