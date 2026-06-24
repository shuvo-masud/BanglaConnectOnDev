import { useRoute, Link } from "wouter";
import { useUser } from "@clerk/clerk-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  MapPin,
  Video,
  ExternalLink,
  UserCircle,
  Users,
  Radio,
  CheckCircle2,
  Loader2,
  Maximize2,
} from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

function LiveStreamPlayer({ streamUrl, title }: { streamUrl: string; title: string }) {
  const [fullscreen, setFullscreen] = useState(false);

  const isYoutube = streamUrl.includes("youtube.com") || streamUrl.includes("youtu.be");
  const isTwitch = streamUrl.includes("twitch.tv");
  const isVimeo = streamUrl.includes("vimeo.com");

  function getEmbedUrl(url: string) {
    if (isYoutube) {
      const videoId = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/)?.[1];
      if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`;
      const liveMatch = url.match(/live\/([^?]+)/)?.[1];
      if (liveMatch) return `https://www.youtube.com/embed/${liveMatch}?autoplay=1`;
    }
    if (isTwitch) {
      const channel = url.match(/twitch\.tv\/([^/?]+)/)?.[1];
      if (channel) return `https://player.twitch.tv/?channel=${channel}&parent=${window.location.hostname}&autoplay=true`;
    }
    if (isVimeo) {
      const id = url.match(/vimeo\.com\/(\d+)/)?.[1];
      if (id) return `https://player.vimeo.com/video/${id}?autoplay=1`;
    }
    return url;
  }

  const embedUrl = getEmbedUrl(streamUrl);
  const isEmbeddable = isYoutube || isTwitch || isVimeo;

  return (
    <div className={`${fullscreen ? "fixed inset-0 z-50 bg-black" : "relative"} mb-8`}>
      <div className={`${fullscreen ? "h-full" : "relative w-full"} rounded-2xl overflow-hidden bg-black shadow-xl`}>
        {/* Live badge */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-red-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
          <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
          LIVE
        </div>

        {/* Fullscreen toggle */}
        <button
          onClick={() => setFullscreen(!fullscreen)}
          className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg transition-colors"
        >
          <Maximize2 className="w-4 h-4" />
        </button>

        {isEmbeddable ? (
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            className={`w-full ${fullscreen ? "h-full" : "aspect-video"} border-0`}
          />
        ) : (
          <div className={`w-full ${fullscreen ? "h-full" : "aspect-video"} flex flex-col items-center justify-center gap-4 bg-gray-900`}>
            <Radio className="w-12 h-12 text-red-400 animate-pulse" />
            <p className="text-white font-semibold">Live Stream in Progress</p>
            <a
              href={streamUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors"
            >
              Open Stream <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        )}
      </div>

      {fullscreen && (
        <button
          onClick={() => setFullscreen(false)}
          className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export default function EventDetailPage() {
  const [, params] = useRoute("/events/:id");
  const id = Number(params?.id);
  const { isSignedIn } = useUser();
  const qc = useQueryClient();

  const { data: event, isLoading } = useQuery<any>({
    queryKey: ["event", id],
    queryFn: () => apiFetch(`/api/events/${id}`),
    enabled: !!id,
    refetchInterval: (data) => (data?.isLive ? 15000 : false),
  });

  const rsvpMutation = useMutation({
    mutationFn: (rsvped: boolean) =>
      apiFetch(`/api/events/${id}/rsvp`, { method: rsvped ? "DELETE" : "POST" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["event", id] }),
  });

  if (isLoading)
    return (
      <div className="p-6 max-w-4xl mx-auto w-full animate-pulse">
        <div className="h-8 w-24 bg-gray-200 rounded mb-8" />
        <div className="h-64 w-full bg-gray-200 rounded-2xl mb-8" />
        <div className="h-10 w-3/4 bg-gray-200 rounded mb-6" />
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    );

  if (!event)
    return (
      <div className="p-6 text-center py-20">
        <h2 className="text-2xl font-bold">Event not found</h2>
        <Link href="/events">
          <Button className="mt-4">Back to Events</Button>
        </Link>
      </div>
    );

  const isLiveNow = event.isLive && event.streamUrl;
  const hasRsvped = event.userRsvped ?? false;

  return (
    <div className="pb-20">
      <div className="max-w-4xl mx-auto px-6 pt-10">
        <Link
          href="/events"
          className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to all events
        </Link>

        {/* Live Stream Player — shown prominently when live */}
        {isLiveNow && (
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-3">
              <Radio className="w-5 h-5 text-red-500 animate-pulse" />
              <span className="text-red-600 font-bold text-lg">This event is streaming live now!</span>
            </div>
            <LiveStreamPlayer streamUrl={event.streamUrl} title={event.title} />
          </div>
        )}

        {/* Cover image (only if not live) */}
        {!isLiveNow && event.coverImageUrl && (
          <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden mb-10 shadow-md">
            <img src={event.coverImageUrl} alt={event.title} className="w-full h-full object-cover" />
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Left: event details */}
          <div className="md:col-span-2">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {event.category && (
                <Badge variant="secondary" className="bg-purple-100 text-purple-800 font-medium px-3 py-1 capitalize">
                  {event.category}
                </Badge>
              )}
              {isLiveNow && (
                <Badge className="bg-red-600 text-white border-none px-3 py-1 gap-1.5">
                  <span className="w-2 h-2 bg-white rounded-full animate-pulse inline-block" />
                  LIVE NOW
                </Badge>
              )}
              {event.isVirtual && !isLiveNow && (
                <Badge className="bg-blue-50 text-blue-700 border-none px-3 py-1 gap-1.5">
                  <Video className="w-3 h-3" /> Virtual
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              {event.title}
            </h1>

            {event.rsvpCount > 0 && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                <Users className="w-4 h-4" />
                <span>{event.rsvpCount} {event.rsvpCount === 1 ? "person" : "people"} attending</span>
              </div>
            )}

            <div className="prose prose-teal max-w-none text-gray-700 mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">About this event</h3>
              {event.description.split("\n").map((paragraph: string, i: number) => (
                <p key={i}>{paragraph}</p>
              ))}
            </div>

            {/* Tags */}
            {event.tags?.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-100">
                {event.tags.map((tag: string) => (
                  <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Right: sidebar */}
          <div className="md:col-span-1">
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-100 sticky top-24 space-y-6">
              {/* Date */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Date & Time</p>
                  <p className="text-gray-600 text-sm mt-1">
                    {format(new Date(event.eventDate), "EEEE, MMMM d, yyyy")}
                  </p>
                  <p className="text-gray-600 text-sm">{format(new Date(event.eventDate), "h:mm a")}</p>
                </div>
              </div>

              {/* Location */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
                  {event.isVirtual || isLiveNow ? (
                    <Video className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <MapPin className="w-5 h-5 text-primary" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {isLiveNow ? "Live Stream" : event.isVirtual ? "Virtual Event" : "Location"}
                  </p>
                  <p className="text-gray-600 text-sm mt-1">
                    {isLiveNow
                      ? "Watch the stream above"
                      : event.isVirtual
                      ? "Link provided upon registration"
                      : event.location}
                  </p>
                </div>
              </div>

              {/* RSVP / Register button */}
              <div className="pt-2">
                {event.registrationUrl && !isLiveNow ? (
                  <Button
                    size="lg"
                    className="w-full text-base shadow-md"
                    onClick={() => window.open(event.registrationUrl, "_blank")}
                  >
                    Register Now <ExternalLink className="w-4 h-4 ml-2" />
                  </Button>
                ) : isSignedIn ? (
                  <Button
                    size="lg"
                    className={`w-full text-base shadow-md gap-2 ${hasRsvped ? "bg-emerald-600 hover:bg-red-500" : ""}`}
                    onClick={() => rsvpMutation.mutate(hasRsvped)}
                    disabled={rsvpMutation.isPending}
                  >
                    {rsvpMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : hasRsvped ? (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        Attending · Cancel RSVP
                      </>
                    ) : (
                      <>
                        <Users className="w-4 h-4" />
                        RSVP to Event
                      </>
                    )}
                  </Button>
                ) : (
                  <Link href="/sign-in">
                    <Button size="lg" className="w-full text-base shadow-md">
                      Sign in to RSVP
                    </Button>
                  </Link>
                )}
              </div>

              {/* Organizer */}
              {event.organizer && (
                <div className="pt-4 border-t border-gray-200">
                  <p className="text-sm font-medium text-gray-500 mb-3">Hosted By</p>
                  <Link href={`/profile/${event.organizerId}`} className="flex items-center gap-3 group">
                    <Avatar className="w-10 h-10 border">
                      <AvatarImage src={event.organizer.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {event.organizer.fullName?.charAt(0) || <UserCircle className="w-5 h-5" />}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-gray-900 group-hover:text-primary transition-colors text-sm">
                        {event.organizer.fullName}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">{event.organizer.role}</p>
                    </div>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
