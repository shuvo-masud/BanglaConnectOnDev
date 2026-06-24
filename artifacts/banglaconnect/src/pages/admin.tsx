import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Shield, Users, LifeBuoy, CheckCircle2, XCircle, Clock, AlertCircle, GraduationCap, Rocket, Loader2 } from "lucide-react";
import { format } from "date-fns";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

function statusBadge(status: string) {
  switch (status) {
    case "open": return <Badge className="bg-blue-50 text-blue-700 border-none text-xs"><AlertCircle className="w-3 h-3 mr-1" />Open</Badge>;
    case "in_progress": return <Badge className="bg-amber-50 text-amber-700 border-none text-xs"><Clock className="w-3 h-3 mr-1" />In Progress</Badge>;
    case "resolved": return <Badge className="bg-emerald-50 text-emerald-700 border-none text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Resolved</Badge>;
    default: return <Badge variant="secondary" className="text-xs">{status}</Badge>;
  }
}

function mentorStatusBadge(status: string) {
  switch (status) {
    case "pending": return <Badge className="bg-amber-50 text-amber-700 border-none text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    case "approved": return <Badge className="bg-emerald-50 text-emerald-700 border-none text-xs"><CheckCircle2 className="w-3 h-3 mr-1" />Approved</Badge>;
    case "rejected": return <Badge className="bg-red-50 text-red-700 border-none text-xs"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
    default: return <Badge variant="secondary" className="text-xs">{status}</Badge>;
  }
}

function AdminSetupPrompt() {
  const qc = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const setupMutation = useMutation({
    mutationFn: () => apiFetch("/api/admin/setup", { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-profile"] });
      qc.invalidateQueries({ queryKey: ["admin-check"] });
      window.location.reload();
    },
    onError: (e: Error) => setError(e.message),
  });

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
        <Rocket className="w-10 h-10 text-primary" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Set Up Admin Access</h2>
      <p className="text-gray-500 max-w-sm mb-2">
        No admin exists yet. Click below to make yourself the first admin. This only works once — after that, only existing admins can grant access.
      </p>
      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-4 py-2 mb-4 max-w-sm">
          {error}
        </p>
      )}
      <Button
        onClick={() => setupMutation.mutate()}
        disabled={setupMutation.isPending}
        size="lg"
        className="gap-2 mt-2"
      >
        {setupMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
        Make Me Admin
      </Button>
    </div>
  );
}

function MentorQueue() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState("pending");

  const { data: mentors, isLoading } = useQuery<any[]>({
    queryKey: ["admin-mentors", filterStatus],
    queryFn: () => apiFetch(`/api/admin/mentors?status=${filterStatus}`),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, mentorStatus }: { id: number; mentorStatus: string }) =>
      apiFetch(`/api/admin/mentors/${id}/status`, { method: "PATCH", body: JSON.stringify({ mentorStatus }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-mentors"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        {mentors && <span className="text-sm text-gray-500">{mentors.length} mentor(s)</span>}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 p-4 bg-white border rounded-xl">
              <Skeleton className="w-12 h-12 rounded-full" />
              <div className="flex-1"><Skeleton className="h-4 w-40 mb-2" /><Skeleton className="h-3 w-60" /></div>
            </div>
          ))}
        </div>
      ) : mentors?.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50">
          <GraduationCap className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No {filterStatus} mentors</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mentors?.map((mentor: any) => (
            <div key={mentor.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
              <Avatar className="w-12 h-12 border">
                <AvatarImage src={mentor.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">{mentor.fullName?.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="font-semibold text-gray-900">{mentor.fullName}</span>
                  {mentorStatusBadge(mentor.mentorStatus)}
                </div>
                <p className="text-sm text-gray-500 truncate">{mentor.profession || mentor.professionalField || "No profession listed"} · {mentor.country}</p>
                {mentor.bio && <p className="text-xs text-gray-400 truncate mt-1">{mentor.bio}</p>}
              </div>
              {mentor.mentorStatus === "pending" && (
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white gap-1"
                    onClick={() => updateStatus.mutate({ id: mentor.id, mentorStatus: "approved" })}>
                    <CheckCircle2 className="w-3.5 h-3.5" />Approve
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 gap-1"
                    onClick={() => updateStatus.mutate({ id: mentor.id, mentorStatus: "rejected" })}>
                    <XCircle className="w-3.5 h-3.5" />Reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SupportQueue() {
  const qc = useQueryClient();
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: tickets, isLoading } = useQuery<any[]>({
    queryKey: ["admin-tickets", filterStatus],
    queryFn: () => apiFetch(`/api/admin/tickets${filterStatus !== "all" ? `?status=${filterStatus}` : ""}`),
  });

  const updateTicket = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiFetch(`/api/admin/tickets/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-tickets"] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        {tickets && <span className="text-sm text-gray-500">{tickets.length} ticket(s)</span>}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="p-4 bg-white border rounded-xl">
              <Skeleton className="h-4 w-24 mb-2" /><Skeleton className="h-5 w-3/4" />
            </div>
          ))}
        </div>
      ) : tickets?.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed rounded-xl bg-gray-50">
          <LifeBuoy className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">No tickets found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets?.map((ticket: any) => (
            <div key={ticket.id} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {statusBadge(ticket.status)}
                    <span className="text-xs text-gray-400">#{ticket.id} · {format(new Date(ticket.createdAt), "MMM d, yyyy")}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{ticket.subject}</h3>
                  {ticket.user && <p className="text-sm text-gray-500 mt-0.5">by {ticket.user.fullName}</p>}
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{ticket.description}</p>
                </div>
                <Select value={ticket.status} onValueChange={(s) => updateTicket.mutate({ id: ticket.id, status: s })}>
                  <SelectTrigger className="w-36 shrink-0"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function UsersList() {
  const { data: users, isLoading } = useQuery<any[]>({
    queryKey: ["admin-users"],
    queryFn: () => apiFetch("/api/admin/users"),
  });

  const roleBadge = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-red-50 text-red-700",
      mentor: "bg-blue-50 text-blue-700",
      professional: "bg-purple-50 text-purple-700",
      student: "bg-gray-100 text-gray-600",
    };
    return <Badge className={`${colors[role] || "bg-gray-100 text-gray-600"} border-none text-xs`}>{role}</Badge>;
  };

  return (
    <div className="space-y-3">
      {isLoading ? (
        Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 p-4 bg-white border rounded-xl">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="flex-1"><Skeleton className="h-4 w-40 mb-1" /><Skeleton className="h-3 w-24" /></div>
          </div>
        ))
      ) : (
        users?.map((user: any) => (
          <div key={user.id} className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl shadow-sm">
            <Avatar className="w-10 h-10 border">
              <AvatarImage src={user.avatarUrl || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">{user.fullName?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900 text-sm">{user.fullName}</span>
                {roleBadge(user.role)}
                {user.role === "mentor" && mentorStatusBadge(user.mentorStatus)}
              </div>
              <p className="text-xs text-gray-500 truncate">{user.country} · Joined {format(new Date(user.createdAt), "MMM yyyy")}</p>
            </div>
          </div>
        ))
      )}
      {users && <p className="text-sm text-gray-400 text-center">{users.length} total users</p>}
    </div>
  );
}

export default function AdminPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [, navigate] = useLocation();

  const { data: profile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["admin-check"],
    queryFn: () => apiFetch("/api/profiles/me"),
    enabled: !!isSignedIn,
    retry: false,
  });

  if (!isLoaded || profileLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <Shield className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Area</h2>
        <p className="text-gray-500 mb-6">Sign in to access the admin dashboard.</p>
        <Button onClick={() => navigate("/sign-in")}>Sign In</Button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <Shield className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Profile required</h2>
        <p className="text-gray-500 mb-4">Please set up your profile first.</p>
        <Button onClick={() => navigate("/profile")}>Set Up Profile</Button>
      </div>
    );
  }

  if (profile.role !== "admin") {
    return <AdminSetupPrompt />;
  }

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-600" />
          </div>
          Admin Dashboard
        </h1>
        <p className="text-gray-500 mt-1">Manage mentors, support tickets, and users.</p>
      </div>

      <Tabs defaultValue="mentors">
        <TabsList className="mb-6 bg-gray-100/80">
          <TabsTrigger value="mentors" className="gap-2">
            <GraduationCap className="w-4 h-4" />Mentor Approvals
          </TabsTrigger>
          <TabsTrigger value="support" className="gap-2">
            <LifeBuoy className="w-4 h-4" />Support Tickets
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />All Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mentors"><MentorQueue /></TabsContent>
        <TabsContent value="support"><SupportQueue /></TabsContent>
        <TabsContent value="users"><UsersList /></TabsContent>
      </Tabs>
    </div>
  );
}
