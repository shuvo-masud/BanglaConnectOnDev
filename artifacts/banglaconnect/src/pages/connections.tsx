import { useState } from "react";
import { useListConnections, useUpdateConnection, getListConnectionsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Check, X, Clock, Network, User } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/clerk-react";

export default function ConnectionsPage() {
  const { data: connections, isLoading } = useListConnections();
  const { mutate: updateConnection } = useUpdateConnection();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useUser();

  const handleUpdate = (id: number, status: "accepted" | "declined") => {
    updateConnection({
      id,
      data: { status }
    }, {
      onSuccess: () => {
        toast({
          title: `Request ${status}`,
          description: `The connection request has been ${status}.`
        });
        queryClient.invalidateQueries({ queryKey: getListConnectionsQueryKey() });
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Action failed",
          description: err.message || "Could not process request"
        });
      }
    });
  };

  if (isLoading || !user) {
    return (
      <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-full max-w-md" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32 w-full" />)}
        </div>
      </div>
    );
  }

  // A connection's profile info depends on whether we are the sender or receiver
  const getOtherProfile = (conn: any) => {
    // Determine which profile represents the "other" person
    // If we're the receiver (toProfileId matches our profile), then the other is fromProfile
    if (conn.toProfile?.clerkId === user.id) return conn.fromProfile;
    return conn.toProfile;
  };

  const isReceivedRequest = (conn: any) => conn.toProfile?.clerkId === user.id && conn.status === "pending";
  const isSentRequest = (conn: any) => conn.fromProfile?.clerkId === user.id && conn.status === "pending";
  
  const acceptedConnections = connections?.filter(c => c.status === "accepted") || [];
  const pendingReceived = connections?.filter(isReceivedRequest) || [];
  const pendingSent = connections?.filter(isSentRequest) || [];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">My Connections</h1>
        <p className="text-muted-foreground mt-1 text-lg">
          Manage your network and connection requests.
        </p>
      </div>

      <Tabs defaultValue="my-network" className="w-full">
        <TabsList className="w-full sm:w-auto grid w-full grid-cols-3 sm:inline-flex">
          <TabsTrigger value="my-network" className="gap-2">
            <Network size={16} /> Network ({acceptedConnections.length})
          </TabsTrigger>
          <TabsTrigger value="received" className="gap-2">
            <User size={16} /> Received {pendingReceived.length > 0 && <Badge variant="secondary" className="ml-1 h-5 px-1.5">{pendingReceived.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="sent" className="gap-2">
            <Clock size={16} /> Sent ({pendingSent.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-network" className="mt-6">
          {acceptedConnections.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-xl border border-border">
              <Network className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <h3 className="text-xl font-medium text-foreground">No connections yet</h3>
              <p className="text-muted-foreground mt-2 mb-6">Start building your network by connecting with others.</p>
              <Link href="/mentors">
                <Button>Find Mentors</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {acceptedConnections.map((conn) => {
                const other = getOtherProfile(conn);
                if (!other) return null;
                return (
                  <Card key={conn.id} className="border-border">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <Avatar className="h-12 w-12 border border-border">
                          <AvatarImage src={other.avatarUrl || undefined} />
                          <AvatarFallback>{other.fullName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <Link href={`/profile/${other.id}`}>
                            <h4 className="font-semibold hover:text-primary transition-colors truncate cursor-pointer">{other.fullName}</h4>
                          </Link>
                          <p className="text-sm text-muted-foreground truncate capitalize">{other.role} • {other.country}</p>
                        </div>
                      </div>
                      <Link href={`/profile/${other.id}`}>
                        <Button variant="ghost" size="sm">View</Button>
                      </Link>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="received" className="mt-6">
          {pendingReceived.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p>No pending requests received.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingReceived.map((conn) => {
                const sender = conn.fromProfile;
                if (!sender) return null;
                return (
                  <Card key={conn.id} className="border-border">
                    <CardContent className="p-5">
                      <div className="flex items-start gap-4">
                        <Avatar className="h-12 w-12 border border-border">
                          <AvatarImage src={sender.avatarUrl || undefined} />
                          <AvatarFallback>{sender.fullName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <Link href={`/profile/${sender.id}`}>
                            <h4 className="font-semibold hover:text-primary transition-colors truncate cursor-pointer">{sender.fullName}</h4>
                          </Link>
                          <p className="text-sm text-muted-foreground truncate capitalize">{sender.role}</p>
                          {conn.message && (
                            <p className="text-sm mt-2 text-foreground/80 bg-muted/50 p-2 rounded-md italic">"{conn.message}"</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                        <Button 
                          onClick={() => handleUpdate(conn.id, "accepted")}
                          className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                          size="sm"
                        >
                          <Check size={16} className="mr-1" /> Accept
                        </Button>
                        <Button 
                          onClick={() => handleUpdate(conn.id, "declined")}
                          variant="outline"
                          className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive border-destructive/20"
                          size="sm"
                        >
                          <X size={16} className="mr-1" /> Decline
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          {pendingSent.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <p>No pending requests sent.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pendingSent.map((conn) => {
                const receiver = conn.toProfile;
                if (!receiver) return null;
                return (
                  <Card key={conn.id} className="border-border bg-muted/30">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <Avatar className="h-10 w-10 border border-border opacity-70">
                          <AvatarImage src={receiver.avatarUrl || undefined} />
                          <AvatarFallback>{receiver.fullName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h4 className="font-medium text-foreground/80 truncate">{receiver.fullName}</h4>
                          <div className="flex items-center text-xs text-muted-foreground mt-0.5">
                            <Clock size={12} className="mr-1" /> Pending
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
