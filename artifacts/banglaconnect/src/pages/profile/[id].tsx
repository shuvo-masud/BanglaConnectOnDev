import { useGetProfile } from "@workspace/api-client-react";
import { useParams, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Briefcase, ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function ViewProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { data: profile, isLoading } = useGetProfile(id, {
    query: {
      enabled: !!id,
    }
  });

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-8 w-24" />
        <Card>
          <CardContent className="p-8">
            <Skeleton className="h-32 w-32 rounded-full mb-6" />
            <Skeleton className="h-8 w-64 mb-4" />
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-4 w-48 mb-6" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold">Profile not found</h2>
        <Link href="/dashboard">
          <Button variant="link" className="mt-4">Return to dashboard</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <Link href="/dashboard">
        <Button variant="ghost" className="gap-2 -ml-4 text-muted-foreground">
          <ArrowLeft size={16} /> Back to Dashboard
        </Button>
      </Link>

      <Card className="border-border overflow-hidden">
        <div className="h-32 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-muted via-muted/50 to-transparent"></div>
        <CardContent className="p-8 pt-0 relative">
          <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
            <Avatar className="h-32 w-32 border-4 border-card -mt-16 bg-card">
              <AvatarImage src={profile.avatarUrl || undefined} />
              <AvatarFallback className="text-4xl">{profile.fullName.charAt(0)}</AvatarFallback>
            </Avatar>
            
            <div className="flex-1 mt-2 md:mt-4">
              <h1 className="text-3xl font-bold text-foreground">{profile.fullName}</h1>
              <div className="flex flex-wrap gap-4 text-muted-foreground mt-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="capitalize px-3 py-1 text-sm font-medium">
                    {profile.role}
                  </Badge>
                </div>
                {(profile.profession || profile.professionalField) && (
                  <div className="flex items-center gap-2">
                    <Briefcase size={16} />
                    <span>{profile.profession || profile.professionalField}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <MapPin size={16} />
                  <span>{profile.city ? `${profile.city}, ` : ''}{profile.country}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <section>
                <h3 className="text-lg font-semibold mb-3">About</h3>
                <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {profile.bio || "This user hasn't written a bio yet."}
                </p>
              </section>

              {profile.skills && profile.skills.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold mb-3">Skills</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.skills.map(skill => (
                      <Badge key={skill} variant="outline">{skill}</Badge>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="space-y-6">
              {profile.role === 'mentor' && profile.specialties && profile.specialties.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold mb-3">Mentorship Specialties</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.specialties.map(spec => (
                      <Badge key={spec} className="bg-primary/10 text-primary hover:bg-primary/20 border-0">{spec}</Badge>
                    ))}
                  </div>
                </section>
              )}

              {profile.interests && profile.interests.length > 0 && (
                <section>
                  <h3 className="text-lg font-semibold mb-3">Interests</h3>
                  <div className="flex flex-wrap gap-2">
                    {profile.interests.map(interest => (
                      <Badge key={interest} variant="secondary">{interest}</Badge>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
