import { useListMentors, useGetMentorStats } from "@workspace/api-client-react";
import { Link } from "wouter";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Briefcase, Filter, Users } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function MentorsPage() {
  const [search, setSearch] = useState("");
  const [specialty, setSpecialty] = useState<string>("all");
  
  const { data: mentors, isLoading } = useListMentors(
    { 
      search: search || undefined, 
      specialty: specialty !== "all" ? specialty : undefined 
    }, 
    {
      query: {
        queryKey: ["mentors", search, specialty]
      }
    }
  );

  const { data: stats } = useGetMentorStats();

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Mentor Directory</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Connect with experienced professionals willing to guide you.
          </p>
        </div>
        
        {stats && (
          <div className="flex gap-4 text-sm bg-muted/50 p-3 rounded-lg border border-border">
            <div className="flex flex-col items-center px-4 border-r border-border">
              <span className="font-bold text-xl text-primary">{stats.availableMentors}</span>
              <span className="text-muted-foreground">Available</span>
            </div>
            <div className="flex flex-col items-center px-4">
              <span className="font-bold text-xl">{stats.totalCountries}</span>
              <span className="text-muted-foreground">Countries</span>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input 
            placeholder="Search by name, company, or bio..." 
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full sm:w-64">
          <Select value={specialty} onValueChange={setSpecialty}>
            <SelectTrigger>
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-muted-foreground" />
                <SelectValue placeholder="All Specialties" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Specialties</SelectItem>
              {stats?.specialtyCounts.map((s) => (
                <SelectItem key={s.specialty} value={s.specialty}>
                  {s.specialty} ({s.count})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="border-border">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="h-16 w-16 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <div className="mt-6 space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : mentors?.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-xl border border-dashed border-border">
          <Users className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
          <h3 className="text-xl font-medium text-foreground">No mentors found</h3>
          <p className="text-muted-foreground mt-2">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mentors?.map((mentor) => (
            <Link key={mentor.id} href={`/mentors/${mentor.id}`}>
              <Card className="h-full border-border hover:border-primary hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="p-6 flex flex-col h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-16 w-16 border-2 border-transparent group-hover:border-primary transition-colors">
                      <AvatarImage src={mentor.avatarUrl || undefined} />
                      <AvatarFallback className="text-lg">{mentor.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg text-foreground truncate">{mentor.fullName}</h3>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                        <Briefcase size={14} />
                        <span className="truncate">{mentor.profession || mentor.professionalField || "Professional"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                        <MapPin size={14} />
                        <span className="truncate">{mentor.city ? `${mentor.city}, ` : ''}{mentor.country}</span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-foreground/80 line-clamp-3 mb-4 flex-1">
                    {mentor.bio || "No bio provided."}
                  </p>

                  <div className="mt-auto">
                    <div className="flex flex-wrap gap-1.5">
                      {mentor.specialties?.slice(0, 3).map((spec) => (
                        <Badge key={spec} variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                          {spec}
                        </Badge>
                      ))}
                      {mentor.specialties && mentor.specialties.length > 3 && (
                        <Badge variant="outline" className="text-muted-foreground">
                          +{mentor.specialties.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
