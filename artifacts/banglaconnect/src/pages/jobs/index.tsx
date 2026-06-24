import { useListJobs, useCreateJob, getListJobsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@clerk/clerk-react";
import { Search, Briefcase, MapPin, Building2, Clock, Globe } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatDistanceToNow } from "date-fns";

export default function JobsPage() {
  const [search, setSearch] = useState("");
  const [workMode, setWorkMode] = useState<string>("all");
  
  const { data: jobs, isLoading } = useListJobs({ 
    search: search || undefined,
    workMode: workMode !== "all" ? workMode : undefined
  });
  
  const { isSignedIn } = useUser();

  const getWorkModeColor = (mode: string) => {
    switch (mode?.toLowerCase()) {
      case 'remote': return 'bg-emerald-100 text-emerald-800';
      case 'hybrid': return 'bg-blue-100 text-blue-800';
      case 'onsite': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Job Board</h1>
          <p className="text-gray-500 mt-1">Discover opportunities within our global network.</p>
        </div>
        
        {isSignedIn && <CreateJobDialog />}
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm mb-8 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input 
            placeholder="Search jobs by title or keyword..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-gray-50 border-transparent focus:bg-white"
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <span className="text-sm font-medium text-gray-500 whitespace-nowrap">Work Mode:</span>
          <ToggleGroup type="single" value={workMode} onValueChange={(v) => v && setWorkMode(v)} className="justify-start">
            <ToggleGroupItem value="all" className="px-3">All</ToggleGroupItem>
            <ToggleGroupItem value="remote" className="px-3">Remote</ToggleGroupItem>
            <ToggleGroupItem value="hybrid" className="px-3">Hybrid</ToggleGroupItem>
            <ToggleGroupItem value="onsite" className="px-3">On-site</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="border rounded-xl p-6 bg-white shadow-sm">
              <Skeleton className="h-6 w-1/2 mb-2" />
              <Skeleton className="h-4 w-1/3 mb-6" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-20 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : jobs?.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-gray-50">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No jobs found</h3>
          <p className="text-gray-500 mt-2">Try adjusting your search filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {jobs?.map(job => (
            <Link key={job.id} href={`/jobs/${job.id}`}>
              <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm hover:shadow-md transition-all hover:border-primary/30 cursor-pointer h-full flex flex-col">
                <div className="flex justify-between items-start mb-2 gap-4">
                  <h3 className="text-xl font-bold text-gray-900 leading-tight">
                    {job.title}
                  </h3>
                  {job.workMode && (
                    <Badge variant="secondary" className={`${getWorkModeColor(job.workMode)} border-none capitalize`}>
                      {job.workMode}
                    </Badge>
                  )}
                </div>
                
                <div className="text-lg text-gray-700 font-medium mb-4 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-gray-400" />
                  {job.company}
                </div>
                
                <div className="flex flex-wrap gap-y-2 gap-x-6 text-sm text-gray-600 mb-6">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    {job.location}
                  </div>
                  {job.jobType && (
                    <div className="flex items-center gap-1.5 capitalize">
                      <Clock className="w-4 h-4 text-gray-400" />
                      {job.jobType.replace('-', ' ')}
                    </div>
                  )}
                </div>
                
                <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="flex gap-2 flex-wrap">
                    {job.tags?.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs text-gray-500 border-gray-200 font-normal">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap">
                    {formatDistanceToNow(new Date(job.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateJobDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [jobType, setJobType] = useState("full-time");
  const [workMode, setWorkMode] = useState("remote");
  const [applyUrl, setApplyUrl] = useState("");
  const [tags, setTags] = useState("");
  
  const createJob = useCreateJob();
  const queryClient = useQueryClient();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createJob.mutate(
      { 
        data: { 
          title, 
          company,
          location,
          description,
          jobType,
          workMode,
          applyUrl: applyUrl || undefined,
          tags: tags.split(",").map(t => t.trim()).filter(Boolean),
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListJobsQueryKey() });
          setOpen(false);
          // reset form
          setTitle(""); setCompany(""); setLocation(""); setDescription(""); setApplyUrl(""); setTags("");
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Briefcase className="w-4 h-4 mr-2" /> Post a Job</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Post a Job Opportunity</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-4 overflow-y-auto mt-4 px-1">
          <div className="grid gap-2">
            <Label htmlFor="title">Job Title</Label>
            <Input id="title" required value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="company">Company</Label>
              <Input id="company" required value={company} onChange={e => setCompany(e.target.value)} placeholder="Acme Inc." />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" required value={location} onChange={e => setLocation(e.target.value)} placeholder="San Francisco, CA" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Job Type</Label>
              <Select value={jobType} onValueChange={setJobType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="full-time">Full-time</SelectItem>
                  <SelectItem value="part-time">Part-time</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Work Mode</Label>
              <Select value={workMode} onValueChange={setWorkMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="hybrid">Hybrid</SelectItem>
                  <SelectItem value="onsite">On-site</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2 flex-1 min-h-[150px]">
            <Label htmlFor="description">Job Description</Label>
            <Textarea 
              id="description" 
              required 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="h-full resize-none"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="applyUrl">Application Link (Optional)</Label>
            <Input id="applyUrl" type="url" value={applyUrl} onChange={e => setApplyUrl(e.target.value)} placeholder="https://careers..." />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tags">Skills / Tags (comma separated)</Label>
            <Input id="tags" value={tags} onChange={e => setTags(e.target.value)} placeholder="React, Node.js, Design" />
          </div>

          <div className="flex justify-end pt-4 border-t shrink-0">
            <Button type="button" variant="outline" className="mr-2" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createJob.isPending}>
              {createJob.isPending ? "Posting..." : "Post Job"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
