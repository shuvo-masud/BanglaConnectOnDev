import { useState } from "react";
import { useUser } from "@clerk/clerk-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Lock, Globe, Plus, Vault as VaultIcon, Pencil, Trash2, FileText, Tag, X } from "lucide-react";
import { format } from "date-fns";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

async function apiFetch<T = any>(
  path: string,
  opts: RequestInit = {}
): Promise<T | null> {
  const url = `${BASE.replace(/\/$/, "")}${path.startsWith("/") ? path : `/${path}`}`;

  const headers = new Headers(opts.headers || {});

  // Default JSON header only if not already set
  if (!headers.has("Content-Type") && opts.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(url, {
    ...opts,
    headers,
  });

  // Handle empty response safely
  if (res.status === 204) return null;

  const contentType = res.headers.get("content-type");

  const data = contentType?.includes("application/json")
    ? await res.json().catch(() => null)
    : await res.text().catch(() => null);

  if (!res.ok) {
    throw new Error(
      typeof data === "string"
        ? data
        : data?.message || `Request failed: ${res.status}`
    );
  }

  return data;
}

type VaultItem = {
  id: number;
  title: string;
  description?: string | null;
  content?: string | null;
  visibility: "public" | "private";
  coverImageUrl?: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
};

function VaultItemCard({ item, onEdit, onDelete }: { item: VaultItem; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all group">
      {item.coverImageUrl && (
        <img src={item.coverImageUrl} alt={item.title} className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300" />
      )}
      {!item.coverImageUrl && (
        <div className="w-full h-36 bg-gradient-to-br from-violet-50 to-indigo-100 flex items-center justify-center">
          <FileText className="w-10 h-10 text-violet-300" />
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="font-bold text-gray-900 line-clamp-1">{item.title}</h3>
          <Badge
            variant="secondary"
            className={`shrink-0 text-xs border-none ${item.visibility === "public" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-600"}`}
          >
            {item.visibility === "public" ? <Globe className="w-3 h-3 mr-1" /> : <Lock className="w-3 h-3 mr-1" />}
            {item.visibility}
          </Badge>
        </div>
        {item.description && (
          <p className="text-sm text-gray-500 line-clamp-2 mb-3">{item.description}</p>
        )}
        {item.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {item.tags.slice(0, 3).map(tag => (
              <span key={tag} className="text-xs bg-violet-50 text-violet-700 px-2 py-0.5 rounded-full">{tag}</span>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <span className="text-xs text-gray-400">{format(new Date(item.updatedAt), "MMM d, yyyy")}</span>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-primary" onClick={onEdit}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-500 hover:text-destructive" onClick={onDelete}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function VaultItemForm({ item, onClose }: { item?: VaultItem | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [title, setTitle] = useState(item?.title || "");
  const [description, setDescription] = useState(item?.description || "");
  const [content, setContent] = useState(item?.content || "");
  const [visibility, setVisibility] = useState<"public" | "private">(item?.visibility || "private");
  const [coverImageUrl, setCoverImageUrl] = useState(item?.coverImageUrl || "");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>(item?.tags || []);

  const mutation = useMutation({
    mutationFn: (data: any) =>
      item
        ? apiFetch(`/api/vault/${item.id}`, { method: "PUT", body: JSON.stringify(data) })
        : apiFetch("/api/vault", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vault"] });
      onClose();
    },
  });

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    mutation.mutate({ title: title.trim(), description: description || undefined, content: content || undefined, visibility, coverImageUrl: coverImageUrl || undefined, tags });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input id="title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Give your item a title" className="mt-1" required />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Brief description" className="mt-1 min-h-[60px]" />
      </div>
      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea id="content" value={content} onChange={e => setContent(e.target.value)} placeholder="Add detailed content, notes, or ideas..." className="mt-1 min-h-[100px]" />
      </div>
      <div>
        <Label htmlFor="coverImageUrl">Cover Image URL</Label>
        <Input id="coverImageUrl" value={coverImageUrl} onChange={e => setCoverImageUrl(e.target.value)} placeholder="https://..." className="mt-1" />
      </div>
      <div>
        <Label>Visibility</Label>
        <Select value={visibility} onValueChange={(v: "public" | "private") => setVisibility(v)}>
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="private">Private — Only you</SelectItem>
            <SelectItem value="public">Public — Anyone can see</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label>Tags</Label>
        <div className="flex gap-2 mt-1">
          <Input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Add a tag..." className="flex-1" />
          <Button type="button" variant="outline" onClick={addTag}>Add</Button>
        </div>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {tags.map(t => (
              <span key={t} className="flex items-center gap-1 bg-violet-50 text-violet-700 px-2 py-1 rounded-full text-xs">
                {t}
                <X className="w-3 h-3 cursor-pointer" onClick={() => setTags(tags.filter(x => x !== t))} />
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex gap-2 pt-2">
        <Button type="submit" disabled={!title.trim() || mutation.isPending} className="flex-1">
          {mutation.isPending ? "Saving..." : item ? "Save Changes" : "Create Item"}
        </Button>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}

export default function VaultPage() {
  const { isSignedIn, isLoaded } = useUser();
  const [, navigate] = useLocation();
  const qc = useQueryClient();
  const [editItem, setEditItem] = useState<VaultItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: items, isLoading } = useQuery<VaultItem[]>({
    queryKey: ["vault"],
    queryFn: () => apiFetch("/api/vault"),
    enabled: !!isSignedIn,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/vault/${id}`, { method: "DELETE" }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vault"] }),
  });

  if (!isLoaded) return null;

  if (!isSignedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center">
        <div className="w-20 h-20 rounded-full bg-violet-100 flex items-center justify-center mb-4">
          <Lock className="w-10 h-10 text-violet-400" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your Personal Vault</h2>
        <p className="text-gray-500 mb-6">Sign in to access your private workspace for projects, ideas, and portfolio items.</p>
        <Button onClick={() => navigate("/sign-in")}>Sign In to Access Vault</Button>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center">
              <Lock className="w-5 h-5 text-violet-600" />
            </div>
            My Vault
          </h1>
          <p className="text-gray-500 mt-1">Your personal workspace — projects, ideas, and portfolio items.</p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditItem(null); }}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              New Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editItem ? "Edit Item" : "Add to Vault"}</DialogTitle>
            </DialogHeader>
            <VaultItemForm item={editItem} onClose={() => { setDialogOpen(false); setEditItem(null); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-3 mb-6">
        <Badge variant="secondary" className="bg-gray-100 text-gray-700 px-3 py-1">
          {items?.length || 0} items
        </Badge>
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 px-3 py-1">
          {items?.filter(i => i.visibility === "public").length || 0} public
        </Badge>
        <Badge variant="secondary" className="bg-gray-100 text-gray-600 px-3 py-1">
          {items?.filter(i => i.visibility === "private").length || 0} private
        </Badge>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white border rounded-2xl overflow-hidden shadow-sm">
              <Skeleton className="h-36 w-full rounded-none" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : items?.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-gray-50">
          <div className="w-16 h-16 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-violet-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Your Vault is Empty</h3>
          <p className="text-gray-500 mb-6">Start adding projects, ideas, portfolio pieces, and more.</p>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Add Your First Item
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {items?.map(item => (
            <VaultItemCard
              key={item.id}
              item={item}
              onEdit={() => { setEditItem(item); setDialogOpen(true); }}
              onDelete={() => { if (confirm("Delete this item?")) deleteMutation.mutate(item.id); }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
