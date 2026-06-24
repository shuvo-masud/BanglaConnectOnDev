import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { LifeBuoy, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

import { customFetch } from "@/lib/custom-fetch";

/* ---------------- API ---------------- */

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  return customFetch(path, options);
}

/* ---------------- PAGE ---------------- */

export default function SupportPage() {
  const queryClient = useQueryClient();

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  /* GET tickets */
  const { data: tickets, isLoading } = useQuery({
    queryKey: ["support-tickets"],
    queryFn: () => apiFetch<any[]>("/api/support"),
  });

  /* CREATE ticket */
  const createTicket = useMutation({
    mutationFn: () =>
      apiFetch("/api/support", {
        method: "POST",
        body: JSON.stringify({ title, message }),
      }),
    onSuccess: () => {
      setTitle("");
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["support-tickets"] });
    },
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <LifeBuoy className="w-5 h-5" />
        <h1 className="text-xl font-semibold">Support</h1>
      </div>

      {/* Create ticket */}
      <div className="space-y-3 border rounded-lg p-4">
        <div>
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Issue title"
          />
        </div>

        <div>
          <Label>Message</Label>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Describe your issue"
          />
        </div>

        <Button
          onClick={() => createTicket.mutate()}
          disabled={!title || !message || createTicket.isPending}
        >
          Submit
        </Button>
      </div>

      {/* Tickets list */}
      <div className="space-y-3">
        {isLoading && <Skeleton className="h-20 w-full" />}

        {tickets?.map((t: any) => (
          <div key={t.id} className="border rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <h2 className="font-medium">{t.title}</h2>

              <Badge>
                {t.status === "open" && (
                  <span className="flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Open
                  </span>
                )}
                {t.status === "closed" && (
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Closed
                  </span>
                )}
                {t.status === "pending" && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> Pending
                  </span>
                )}
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">{t.message}</p>

            <div className="text-xs text-gray-500">
              {t.createdAt ? format(new Date(t.createdAt), "PPpp") : null}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}