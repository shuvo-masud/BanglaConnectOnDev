import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";

import {
  useGetProfile,
  useRequestConnection,
  getListConnectionsQueryKey,
} from "@workspace/api-client-react";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import { MapPin, Briefcase, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

/* ---------------- TYPES (optional but recommended) ---------------- */

type Mentor = {
  id: string;
  fullName: string;
  avatarUrl?: string;
  profession?: string;
  professionalField?: string;
  city?: string;
  country?: string;
  bio?: string;
  skills?: string[];
  specialties?: string[];
  interests?: string[];
  mentorAvailable?: boolean;
};

/* ---------------- PAGE ---------------- */

export default function MentorProfilePage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [message, setMessage] = useState("");
  const [showConnectForm, setShowConnectForm] = useState(false);

  const {
    data: mentor,
    isLoading,
  } = useGetProfile(id!, {
    query: {
      enabled: !!id,
    },
  }) as { data?: Mentor; isLoading: boolean };

  const { mutate: requestConnection, isPending } = useRequestConnection();

  /* ---------------- LOADING ---------------- */

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-24" />
        <Card>
          <CardContent className="p-8 flex flex-col md:flex-row gap-8">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="flex-1 space-y-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ---------------- NOT FOUND ---------------- */

  if (!mentor) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Mentor not found</h2>
        <Link href="/mentors">
          <Button variant="link" className="mt-4">
            Return to directory
          </Button>
        </Link>
      </div>
    );
  }

  /* ---------------- CONNECT ---------------- */

  const handleConnect = () => {
    requestConnection(
      {
        data: {
          toProfileId: mentor.id,
          message: message.trim() || undefined,
        },
      },
      {
        onSuccess: () => {
          toast({
            title: "Request sent",
            description: `Connection request sent to ${mentor.fullName}`,
          });

          setShowConnectForm(false);
          setMessage("");

          queryClient.invalidateQueries({
            queryKey: getListConnectionsQueryKey(),
          });
        },
        onError: (err: any) => {
          toast({
            title: "Failed",
            description: err?.message || "Something went wrong",
            variant: "destructive",
          });
        },
      }
    );
  };

  const title = mentor.profession || mentor.professionalField || "Mentor";

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* BACK */}
      <Link href="/mentors">
        <Button variant="ghost" className="gap-2 -ml-4 text-muted-foreground">
          <ArrowLeft size={16} /> Back to Mentors
        </Button>
      </Link>

      <Card>
        <div className="h-32 bg-gradient-to-r from-primary/20 to-transparent" />

        <CardContent className="p-8 pt-0">
          {/* HEADER */}
          <div className="flex flex-col md:flex-row gap-6">
            <Avatar className="h-32 w-32 -mt-16 border-4 border-background">
              <AvatarImage src={mentor.avatarUrl} />
              <AvatarFallback>
                {mentor.fullName?.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1">
              <h1 className="text-3xl font-bold">{mentor.fullName}</h1>

              <div className="flex items-center gap-2 text-muted-foreground mt-2">
                <Briefcase size={16} />
                <span>{title}</span>
              </div>

              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <MapPin size={16} />
                <span>
                  {mentor.city ? `${mentor.city}, ` : ""}
                  {mentor.country}
                </span>
              </div>

              {/* CONNECT */}
              {!showConnectForm ? (
                <Button
                  className="mt-4"
                  disabled={!mentor.mentorAvailable}
                  onClick={() => setShowConnectForm(true)}
                >
                  {mentor.mentorAvailable ? "Connect" : "Not Available"}
                </Button>
              ) : (
                <div className="mt-4 p-4 border rounded-lg space-y-3">
                  <Textarea
                    placeholder="Add a message (optional)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                  />

                  <div className="flex gap-2">
                    <Button
                      onClick={handleConnect}
                      disabled={isPending}
                      className="flex-1"
                    >
                      {isPending ? "Sending..." : "Send"}
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => setShowConnectForm(false)}
                      disabled={isPending}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BIO */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-semibold">About</h3>
            <p className="mt-2 text-muted-foreground whitespace-pre-wrap">
              {mentor.bio || "No bio provided."}
            </p>
          </div>

          {/* SKILLS */}
          {mentor.skills?.length ? (
            <div className="mt-6">
              <h3 className="text-lg font-semibold">Skills</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {mentor.skills.map((s) => (
                  <Badge key={s} variant="outline">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          {/* SPECIALTIES */}
          {mentor.specialties?.length ? (
            <div className="mt-6">
              <h3 className="text-lg font-semibold">Specialties</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {mentor.specialties.map((s) => (
                  <Badge key={s} className="bg-primary/10 text-primary">
                    {s}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}

          {/* INTERESTS */}
          {mentor.interests?.length ? (
            <div className="mt-6">
              <h3 className="text-lg font-semibold">Interests</h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {mentor.interests.map((i) => (
                  <Badge key={i} variant="secondary">
                    {i}
                  </Badge>
                ))}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}