import { useListNews, useCreateNews, getListNewsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@clerk/clerk-react";
import { Search, ExternalLink, Calendar as CalendarIcon, Newspaper as NewsIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function NewsPage() {
  const [search, setSearch] = useState("");
  const { data: news, isLoading } = useListNews({ search: search || undefined });
  const { isSignedIn } = useUser();

  return (
    <div className="p-6 md:p-10 max-w-5xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community News</h1>
          <p className="text-gray-500 mt-1">Updates and announcements from the diaspora.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search news..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {isSignedIn && <CreateNewsDialog />}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="border rounded-xl p-5 bg-white shadow-sm flex gap-5">
              <Skeleton className="w-32 h-32 rounded-lg shrink-0 hidden sm:block" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-2 pt-2">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : news?.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-gray-50">
          <NewsIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No news found</h3>
          <p className="text-gray-500 mt-2">Submit a news item to keep the community updated.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {news?.map(item => (
            <div key={item.id} className="border border-gray-100 rounded-xl bg-white shadow-sm hover:shadow-md transition-all p-5 flex flex-col sm:flex-row gap-6 group">
              {item.coverImageUrl ? (
                <div className="w-full sm:w-40 sm:h-32 h-48 shrink-0 rounded-lg overflow-hidden">
                  <img src={item.coverImageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className="w-full sm:w-40 sm:h-32 h-48 shrink-0 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg flex items-center justify-center border border-red-100/50">
                  <NewsIcon className="w-10 h-10 text-red-300" />
                </div>
              )}
              
              <div className="flex-1 flex flex-col min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {item.source && (
                    <Badge variant="outline" className="text-xs bg-gray-50">
                      {item.source}
                    </Badge>
                  )}
                  {item.tags?.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="bg-red-50 text-red-700 hover:bg-red-100 border-none font-normal text-xs px-2 py-0.5">
                      {tag}
                    </Badge>
                  ))}
                  <span className="text-xs text-gray-400 flex items-center gap-1 ml-auto">
                    <CalendarIcon className="w-3 h-3" />
                    {format(new Date(item.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2 leading-tight">
                  {item.title}
                </h3>
                
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {item.summary}
                </p>
                
                <div className="mt-auto pt-2">
                  {item.externalUrl ? (
                    <a 
                      href={item.externalUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                    >
                      Read full article <ExternalLink className="w-3 h-3 ml-1.5" />
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400 italic">Internal news</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateNewsDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [source, setSource] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [tags, setTags] = useState("");
  
  const createNews = useCreateNews();
  const queryClient = useQueryClient();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createNews.mutate(
      { 
        data: { 
          title, 
          summary,
          source: source || undefined,
          externalUrl: externalUrl || undefined,
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListNewsQueryKey() });
          setOpen(false);
          setTitle("");
          setSummary("");
          setSource("");
          setExternalUrl("");
          setTags("");
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Submit News</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Submit Community News</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Headline</Label>
            <Input id="title" required value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="summary">Summary</Label>
            <Textarea 
              id="summary" 
              required 
              value={summary} 
              onChange={e => setSummary(e.target.value)}
              className="resize-none h-24"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="source">Source Name</Label>
              <Input id="source" value={source} onChange={e => setSource(e.target.value)} placeholder="e.g. Daily Star" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="url">Link (URL)</Label>
              <Input id="url" type="url" value={externalUrl} onChange={e => setExternalUrl(e.target.value)} placeholder="https://..." />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="tech, announcement" />
          </div>
          <div className="flex justify-end pt-4 border-t mt-2">
            <Button type="button" variant="outline" className="mr-2" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createNews.isPending}>
              {createNews.isPending ? "Submitting..." : "Submit News"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
