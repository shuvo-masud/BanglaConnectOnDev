import { useGetJob, getGetJobQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Building2, MapPin, Clock, Globe, Briefcase, ExternalLink, Share2, UserCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function JobDetailPage() {
  const [, params] = useRoute("/jobs/:id");
  const id = Number(params?.id);
  
  const { data: job, isLoading } = useGetJob(id, { 
    query: { 
      enabled: !!id, 
      queryKey: getGetJobQueryKey(id) 
    } 
  });

  if (isLoading) return (
    <div className="p-6 max-w-4xl mx-auto w-full animate-pulse">
      <div className="h-8 w-24 bg-gray-200 rounded mb-8"></div>
      <div className="h-12 w-3/4 bg-gray-200 rounded mb-4"></div>
      <div className="h-6 w-1/2 bg-gray-200 rounded mb-8"></div>
      <div className="h-px w-full bg-gray-200 mb-8"></div>
      <div className="space-y-4">
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-full"></div>
        <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      </div>
    </div>
  );
  
  if (!job) return (
    <div className="p-6 text-center py-20">
      <h2 className="text-2xl font-bold">Job not found</h2>
      <Link href="/jobs"><Button className="mt-4">Back to Jobs</Button></Link>
    </div>
  );

  return (
    <div className="pb-20 bg-gray-50/50 min-h-screen">
      {/* Header section */}
      <div className="bg-white border-b border-gray-200 pt-8 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <Link href="/jobs" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to all jobs
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4">{job.title}</h1>
              
              <div className="flex flex-wrap gap-4 text-base text-gray-600 mb-6">
                <div className="flex items-center gap-1.5 font-medium text-gray-900">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  {job.company}
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  {job.location}
                </div>
                <div className="flex items-center gap-1.5 capitalize">
                  <Clock className="w-5 h-5 text-gray-400" />
                  {job.jobType?.replace('-', ' ')}
                </div>
                {job.workMode && (
                  <div className="flex items-center gap-1.5 capitalize text-emerald-700 font-medium">
                    <Globe className="w-5 h-5 text-emerald-500" />
                    {job.workMode}
                  </div>
                )}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {job.tags?.map(tag => (
                  <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-200 font-normal">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div className="flex flex-col gap-3 min-w-[200px] shrink-0">
              {job.applyUrl ? (
                <Button size="lg" className="w-full text-base font-semibold shadow-md" onClick={() => window.open(job.applyUrl, '_blank')}>
                  Apply Now <ExternalLink className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button size="lg" className="w-full text-base font-semibold shadow-md">
                  Apply for this role
                </Button>
              )}
              <Button size="lg" variant="outline" className="w-full">
                <Share2 className="w-4 h-4 mr-2" /> Share Job
              </Button>
              
              <p className="text-center text-sm text-gray-400 mt-2">
                Posted {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-10 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Job Description</h2>
            <div className="prose prose-teal max-w-none text-gray-700">
              {job.description.split('\n').map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
        </div>
        
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">About the Company</h3>
            <p className="font-medium text-lg text-gray-900 mb-2">{job.company}</p>
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
              <MapPin className="w-4 h-4" /> {job.location}
            </div>
          </div>
          
          {job.postedBy && (
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-4">Posted By</h3>
              <Link href={`/profile/${job.postedById}`} className="flex items-center gap-3 group">
                <Avatar className="w-12 h-12 border">
                  <AvatarImage src={job.postedBy.imageUrl || undefined} />
                  <AvatarFallback><UserCircle className="w-6 h-6" /></AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                    {job.postedBy.firstName} {job.postedBy.lastName}
                  </p>
                  <p className="text-xs text-gray-500">{job.postedBy.role}</p>
                </div>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
