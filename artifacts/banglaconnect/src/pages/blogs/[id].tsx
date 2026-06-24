import { useGetBlog, getGetBlogQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, UserCircle, Calendar as CalendarIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function BlogDetailPage() {
  const [, params] = useRoute("/blogs/:id");
  const id = Number(params?.id);
  
  const { data: blog, isLoading } = useGetBlog(id, { 
    query: { 
      enabled: !!id, 
      queryKey: getGetBlogQueryKey(id) 
    } 
  });

  if (isLoading) {
    return (
      <div className="p-6 max-w-4xl mx-auto w-full animate-pulse">
        <div className="h-8 w-24 bg-gray-200 rounded mb-8"></div>
        <div className="h-[400px] w-full bg-gray-200 rounded-2xl mb-8"></div>
        <div className="h-12 w-3/4 bg-gray-200 rounded mb-6"></div>
        <div className="flex gap-4 mb-10">
          <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
          <div className="space-y-2 flex-1">
            <div className="h-4 w-32 bg-gray-200 rounded"></div>
            <div className="h-3 w-24 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-full"></div>
          <div className="h-4 bg-gray-200 rounded w-5/6"></div>
        </div>
      </div>
    );
  }
  
  if (!blog) return (
    <div className="p-6 text-center py-20">
      <h2 className="text-2xl font-bold">Blog not found</h2>
      <Link href="/blogs"><Button className="mt-4">Back to Blogs</Button></Link>
    </div>
  );

  return (
    <div className="pb-20">
      {/* Hero Header */}
      <div className="bg-gray-50 border-b">
        <div className="max-w-4xl mx-auto px-6 py-12 md:py-16">
          <Link href="/blogs" className="inline-flex items-center text-sm text-gray-500 hover:text-primary mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to all blogs
          </Link>
          
          <div className="flex flex-wrap gap-2 mb-6">
            {blog.tags?.map(tag => (
              <Badge key={tag} variant="secondary" className="bg-teal-100/50 text-teal-800 hover:bg-teal-100 border-none font-medium px-3 py-1">
                {tag}
              </Badge>
            ))}
          </div>
          
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 leading-tight mb-8">
            {blog.title}
          </h1>
          
          <div className="flex items-center justify-between border-t border-gray-200 pt-6">
            <Link href={`/profile/${blog.authorId}`} className="flex items-center gap-4 group cursor-pointer">
              <Avatar className="w-14 h-14 border-2 border-white shadow-sm group-hover:border-primary transition-colors">
                <AvatarImage src={blog.author?.imageUrl || undefined} />
                <AvatarFallback className="text-lg"><UserCircle className="w-8 h-8" /></AvatarFallback>
              </Avatar>
              <div>
                <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                  {blog.author?.firstName} {blog.author?.lastName}
                </p>
                <p className="text-sm text-gray-500">
                  {blog.author?.role || "Community Member"}
                </p>
              </div>
            </Link>
            
            <div className="text-right">
              <p className="text-sm text-gray-500 flex items-center justify-end gap-1.5 mb-1">
                <CalendarIcon className="w-4 h-4" />
                Published
              </p>
              <p className="font-medium text-gray-900">
                {format(new Date(blog.createdAt), "MMMM d, yyyy")}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-10">
        {blog.coverImageUrl && (
          <div className="w-full aspect-[21/9] rounded-2xl overflow-hidden mb-12 shadow-md">
            <img 
              src={blog.coverImageUrl} 
              alt={blog.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="prose prose-lg prose-teal max-w-3xl mx-auto">
          {blog.content.split('\n').map((paragraph, index) => (
            <p key={index} className="text-gray-800 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
