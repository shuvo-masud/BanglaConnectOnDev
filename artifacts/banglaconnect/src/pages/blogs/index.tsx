import { useListBlogs, useCreateBlog, getListBlogsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@clerk/clerk-react";
import { Search, UserCircle, Calendar as CalendarIcon, Tag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function BlogsPage() {
  const [search, setSearch] = useState("");
  const { data: blogs, isLoading } = useListBlogs({ search: search || undefined });
  const { isSignedIn } = useUser();

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community Blogs</h1>
          <p className="text-gray-500 mt-1">Insights, stories, and expertise from the community.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search blogs..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {isSignedIn && <CreateBlogDialog />}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="border rounded-2xl overflow-hidden flex flex-col h-full bg-white shadow-sm">
              <Skeleton className="h-48 w-full rounded-none" />
              <div className="p-5 flex-1 flex flex-col">
                <Skeleton className="h-6 w-3/4 mb-3" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-4" />
                <div className="mt-auto flex items-center gap-3">
                  <Skeleton className="w-8 h-8 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : blogs?.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-gray-50">
          <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No blogs found</h3>
          <p className="text-gray-500 mt-2">Be the first to share your thoughts!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {blogs?.map(blog => (
            <Link key={blog.id} href={`/blogs/${blog.id}`}>
              <div className="border border-gray-100 rounded-2xl overflow-hidden flex flex-col h-full bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group">
                {blog.coverImageUrl ? (
                  <img src={blog.coverImageUrl} alt={blog.title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-teal-100 to-emerald-100 flex items-center justify-center">
                    <BookOpenIcon className="w-12 h-12 text-teal-300" />
                  </div>
                )}
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {blog.tags?.map(tag => (
                      <Badge key={tag} variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 border-none font-normal text-xs px-2 py-0.5">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  
                  <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors line-clamp-2">
                    {blog.title}
                  </h3>
                  
                  <p className="text-gray-500 text-sm mb-4 line-clamp-3 flex-1">
                    {blog.excerpt || "Click to read more..."}
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between border-t border-gray-50 pt-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6 border">
                        <AvatarImage src={blog.author?.imageUrl || undefined} />
                        <AvatarFallback><UserCircle className="w-4 h-4" /></AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium text-gray-700">
                        {blog.author?.firstName} {blog.author?.lastName}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <CalendarIcon className="w-3 h-3" />
                      {format(new Date(blog.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateBlogDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  
  const createBlog = useCreateBlog();
  const queryClient = useQueryClient();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createBlog.mutate(
      { 
        data: { 
          title, 
          excerpt,
          content, 
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
          published: true 
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListBlogsQueryKey() });
          setOpen(false);
          setTitle("");
          setContent("");
          setExcerpt("");
          setTags("");
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Write a Post</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Create New Blog Post</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 overflow-hidden mt-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" required value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="excerpt">Excerpt (Optional)</Label>
            <Input id="excerpt" value={excerpt} onChange={e => setExcerpt(e.target.value)} placeholder="A brief summary of your post" />
          </div>
          <div className="grid gap-2 flex-1 min-h-0">
            <Label htmlFor="content">Content</Label>
            <Textarea 
              id="content" 
              required 
              value={content} 
              onChange={e => setContent(e.target.value)} 
              className="h-full resize-none min-h-[200px]"
              placeholder="Write your article here..."
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="tags">Tags (comma separated)</Label>
            <Input id="tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="tech, career, advice" />
          </div>
          <div className="flex justify-end pt-4 border-t">
            <Button type="button" variant="outline" className="mr-2" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createBlog.isPending}>
              {createBlog.isPending ? "Publishing..." : "Publish Post"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Temporary icon for placeholder
function BookOpenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
