import {
  useGetDashboardSummary,
  useGetMyProfile,
} from "@workspace/api-client-react";
import { Redirect, Link } from "wouter";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { Users, UserPlus, Network, ArrowRight } from "lucide-react";

export default function DashboardPage() {
  const {
    data: profile,
    isLoading: isProfileLoading,
    error: profileError,
  } = useGetMyProfile({
    query: {
      retry: false,
    },
  });

  const { data: summary, isLoading: isSummaryLoading } =
    useGetDashboardSummary({
      query: {
        enabled: !!profile,
      },
    });

  // Redirect if profile doesn't exist
  if (
    !isProfileLoading &&
    (!profile || (profileError as any)?.status === 404)
  ) {
    return <Redirect to="/profile?setup=true" />;
  }

  // Loading state
  if (isProfileLoading || !profile) {
    return (
      <div className="p-8 space-y-8">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // ✅ SAFE NAME HANDLING (FIXED BUG)
  const firstName = (() => {
    const name = profile?.fullName?.trim();
    if (!name) return "User";
    return name.split(" ")[0];
  })();

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome back, {firstName}
          </h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Here's what's happening in your network today.
          </p>
        </div>

        <Link href="/mentors">
          <Button className="gap-2">
            Find Mentors <ArrowRight size={16} />
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Connections */}
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              My Connections
            </CardTitle>
            <Network className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <Link href="/connections">
                <div className="text-3xl font-bold text-primary hover:underline cursor-pointer">
                  {summary?.myConnectionCount ?? 0}
                </div>
              </Link>
            )}
          </CardContent>
        </Card>

        {/* Pending Requests */}
        <Card className="border-border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Requests
            </CardTitle>
            <UserPlus className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold">
                {summary?.pendingRequests ?? 0}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mentors */}
        <Card className="border-border shadow-sm bg-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-primary">
              Available Mentors
            </CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-3xl font-bold text-primary">
                {summary?.availableMentors ?? 0}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Members */}
      <Card>
        <CardHeader>
          <CardTitle>New Members</CardTitle>
          <CardDescription>
            Say hello to recently joined community members
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isSummaryLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : summary?.recentMembers?.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {summary.recentMembers.map((member) => (
                <Link key={member.id} href={`/profile/${member.id}`}>
                  <div className="flex items-center gap-4 p-4 rounded-xl border border-border hover:bg-muted/50 transition-colors cursor-pointer group">
                    <Avatar className="h-12 w-12 border-2 border-transparent group-hover:border-primary transition-colors">
                      <AvatarImage src={member.avatarUrl || undefined} />
                      <AvatarFallback>
                        {member.fullName?.charAt(0) ?? "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-foreground truncate">
                        {member.fullName ?? "Unknown"}
                      </h4>
                      <p className="text-sm text-muted-foreground truncate capitalize">
                        {member.role} •{" "}
                        {member.city ? `${member.city}, ` : ""}
                        {member.country}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground py-4">
              No recent members found.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}