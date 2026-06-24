import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Send, ArrowLeft, Users } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch(path: string, opts?: RequestInit) {
  const res = await fetch(`${BASE}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts?.headers },
  });
  if (!res.ok) throw new Error(await res.text());
  if (res.status === 204) return null;
  return res.json();
}

function useApiQuery<T>(key: unknown[], path: string, enabled = true) {
  return useQuery<T>({
    queryKey: key,
    queryFn: () => apiFetch(path),
    enabled,
    refetchInterval: 3000,
  });
}

export default function ChatPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [selectedConvId, setSelectedConvId] = useState<number | null>(null);
  const [messageText, setMessageText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: loadingConvs } = useApiQuery<any[]>(
    ["conversations"],
    "/api/chat/conversations",
    isSignedIn
  );

  const { data: messages, isLoading: loadingMsgs } = useApiQuery<any[]>(
    ["messages", selectedConvId],
    `/api/chat/conversations/${selectedConvId}/messages`,
    !!selectedConvId && isSignedIn
  );

  const sendMutation = useMutation({
    mutationFn: (content: string) =>
      apiFetch(`/api/chat/conversations/${selectedConvId}/messages`, {
        method: "POST",
        body: JSON.stringify({ content }),
      }),
    onSuccess: () => {
      setMessageText("");
      qc.invalidateQueries({ queryKey: ["messages", selectedConvId] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign in to chat</h2>
        <p className="text-gray-500 mb-6">Connect with mentors and community members through direct messages.</p>
        <Button onClick={() => navigate("/sign-in")}>Sign In</Button>
      </div>
    );
  }

  const selectedConv = conversations?.find((c) => c.id === selectedConvId);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim() || !selectedConvId) return;
    sendMutation.mutate(messageText.trim());
  };

  return (
    <div className="flex h-[calc(100vh-0px)] max-h-screen overflow-hidden">
      {/* Conversation List */}
      <div className={`${selectedConvId ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r border-gray-200 bg-white`}>
        <div className="p-4 border-b border-gray-100">
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Messages
          </h1>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-12 h-12 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-32 mb-2" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations?.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm">No conversations yet.</p>
              <p className="text-gray-400 text-xs mt-1">Visit a profile to start chatting.</p>
            </div>
          ) : (
            conversations?.map((conv) => {
              const me = conv.participant1?.clerkId;
              const other = conv.participant1Id === conv.participant2Id
                ? conv.participant1
                : (conv.participant1 && conv.participant2)
                  ? conv.participant1
                  : conv.participant2;
              const otherPerson = conv.participant2 || conv.participant1;

              return (
                <button
                  key={conv.id}
                  className={`w-full text-left flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 ${selectedConvId === conv.id ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}
                  onClick={() => setSelectedConvId(conv.id)}
                >
                  <Avatar className="w-12 h-12 border border-gray-100 shrink-0">
                    <AvatarImage src={otherPerson?.avatarUrl || undefined} />
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {otherPerson?.fullName?.charAt(0) || "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <span className="font-semibold text-gray-900 truncate text-sm">{otherPerson?.fullName || "Unknown"}</span>
                      {conv.lastMessageAt && (
                        <span className="text-xs text-gray-400 shrink-0 ml-2">
                          {formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: false })}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {conv.lastMessage?.content || "Start a conversation"}
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Message Window */}
      <div className={`${selectedConvId ? "flex" : "hidden md:flex"} flex-1 flex-col bg-gray-50`}>
        {selectedConvId && selectedConv ? (
          <>
            {/* Header */}
            <div className="flex items-center gap-3 p-4 bg-white border-b border-gray-200 shadow-sm">
              <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConvId(null)}>
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <Avatar className="w-10 h-10 border">
                <AvatarImage src={(selectedConv.participant2 || selectedConv.participant1)?.avatarUrl || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                  {(selectedConv.participant2 || selectedConv.participant1)?.fullName?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-900">
                  {(selectedConv.participant2 || selectedConv.participant1)?.fullName || "Unknown"}
                </p>
                <p className="text-xs text-gray-500">
                  {(selectedConv.participant2 || selectedConv.participant1)?.role}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMsgs ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : ""}`}>
                      <Skeleton className="h-10 w-48 rounded-2xl" />
                    </div>
                  ))}
                </div>
              ) : messages?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-12">
                  <MessageCircle className="w-10 h-10 text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">No messages yet. Say hello!</p>
                </div>
              ) : (
                messages?.map((msg) => {
                  const isMe = msg.sender?.clerkId === undefined;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"} gap-2`}>
                      {!isMe && (
                        <Avatar className="w-7 h-7 border shrink-0 mt-1">
                          <AvatarImage src={msg.sender?.avatarUrl || undefined} />
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {msg.sender?.fullName?.charAt(0) || "?"}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-xs lg:max-w-md`}>
                        <div className={`px-4 py-2 rounded-2xl text-sm leading-relaxed ${isMe ? "bg-primary text-white rounded-br-sm" : "bg-white text-gray-900 shadow-sm rounded-bl-sm"}`}>
                          {msg.content}
                        </div>
                        <p className={`text-xs text-gray-400 mt-1 ${isMe ? "text-right" : ""}`}>
                          {format(new Date(msg.createdAt), "h:mm a")}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200">
              <div className="flex gap-2">
                <Input
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                  autoFocus
                />
                <Button type="submit" disabled={!messageText.trim() || sendMutation.isPending} className="px-4">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Your Messages</h2>
            <p className="text-gray-500 text-sm max-w-xs">
              Select a conversation to start chatting, or visit someone's profile to send them a message.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
