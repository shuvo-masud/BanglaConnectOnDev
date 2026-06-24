import { useEffect, useState, useRef } from "react";
import { useGetMyProfile, useUpsertMyProfile, getGetMyProfileQueryKey } from "@workspace/api-client-react";
import { useLocation, useSearch } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useUser } from "@clerk/clerk-react";

const MENTOR_SPECIALTIES = [
  "AI/ML", "Web Dev", "Mobile Dev", "Data Science", 
  "Career Guidance", "Business", "Finance", "Research", 
  "Medicine", "Law", "Engineering", "Design"
];

const profileSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  role: z.enum(["student", "mentor", "professional"]),
  bio: z.string().optional(),
  country: z.string().min(2, "Country is required"),
  city: z.string().optional(),
  avatarUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  skills: z.array(z.string()).default([]),
  interests: z.array(z.string()).default([]),
  
  // Professional specific
  profession: z.string().optional(),
  professionalField: z.string().optional(),
  
  // Mentor specific
  specialties: z.array(z.string()).default([]),
  mentorAvailable: z.boolean().default(false),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function EditProfilePage() {
  const [, setLocation] = useLocation();
  const search = useSearch();
  const isSetup = new URLSearchParams(search).get("setup") === "true";
  const { user } = useUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile, isLoading, error } = useGetMyProfile({
    query: {
      retry: false
    }
  });

  const { mutate: upsertProfile, isPending: isSaving } = useUpsertMyProfile();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      role: "student",
      country: "",
      city: "",
      bio: "",
      avatarUrl: user?.imageUrl || "",
      skills: [],
      interests: [],
      profession: "",
      professionalField: "",
      specialties: [],
      mentorAvailable: false,
    }
  });

  const initializedRef = useRef(false);

  useEffect(() => {
    if (profile && !initializedRef.current) {
      initializedRef.current = true;
      form.reset({
        fullName: profile.fullName,
        role: profile.role,
        country: profile.country,
        city: profile.city || "",
        bio: profile.bio || "",
        avatarUrl: profile.avatarUrl || "",
        skills: profile.skills || [],
        interests: profile.interests || [],
        profession: profile.profession || "",
        professionalField: profile.professionalField || "",
        specialties: profile.specialties || [],
        mentorAvailable: profile.mentorAvailable || false,
      });
    }
  }, [profile, form]);

  const onSubmit = (data: ProfileFormValues) => {
    upsertProfile({
      data: {
        ...data,
        avatarUrl: data.avatarUrl || undefined,
        city: data.city || undefined,
        bio: data.bio || undefined,
        profession: data.profession || undefined,
        professionalField: data.professionalField || undefined,
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Profile saved",
          description: "Your profile has been updated successfully.",
        });
        queryClient.invalidateQueries({ queryKey: getGetMyProfileQueryKey() });
        if (isSetup) {
          setLocation("/dashboard");
        }
      },
      onError: (err: any) => {
        toast({
          variant: "destructive",
          title: "Error saving profile",
          description: err.message || "Please check your inputs and try again.",
        });
      }
    });
  };

  const role = form.watch("role");

  // Tag Input Component inline
  const TagInput = ({ field, placeholder }: { field: any, placeholder: string }) => {
    const [inputValue, setInputValue] = useState("");
    
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && inputValue.trim()) {
        e.preventDefault();
        if (!field.value.includes(inputValue.trim())) {
          field.onChange([...field.value, inputValue.trim()]);
        }
        setInputValue("");
      }
    };

    const removeTag = (indexToRemove: number) => {
      field.onChange(field.value.filter((_: any, index: number) => index !== indexToRemove));
    };

    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {field.value.map((tag: string, index: number) => (
            <Badge key={index} variant="secondary" className="px-2 py-1 flex items-center gap-1">
              {tag}
              <X 
                size={14} 
                className="cursor-pointer hover:text-destructive transition-colors" 
                onClick={() => removeTag(index)}
              />
            </Badge>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Input 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1"
          />
          <Button 
            type="button" 
            variant="outline" 
            size="icon"
            onClick={() => {
              if (inputValue.trim() && !field.value.includes(inputValue.trim())) {
                field.onChange([...field.value, inputValue.trim()]);
                setInputValue("");
              }
            }}
          >
            <Plus size={16} />
          </Button>
        </div>
      </div>
    );
  };

  // Multi-select for specialties inline
  const SpecialtiesSelect = ({ field }: { field: any }) => {
    const toggleSpecialty = (specialty: string) => {
      const current = field.value || [];
      if (current.includes(specialty)) {
        field.onChange(current.filter((s: string) => s !== specialty));
      } else {
        field.onChange([...current, specialty]);
      }
    };

    return (
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {MENTOR_SPECIALTIES.map((spec) => {
            const isSelected = field.value?.includes(spec);
            return (
              <Badge 
                key={spec}
                variant={isSelected ? "default" : "outline"}
                className={`cursor-pointer px-3 py-1.5 transition-colors ${isSelected ? 'bg-primary hover:bg-primary/90' : 'hover:bg-muted'}`}
                onClick={() => toggleSpecialty(spec)}
              >
                {spec}
              </Badge>
            );
          })}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardContent className="p-6 space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {isSetup ? "Complete Your Profile" : "Edit Profile"}
        </h1>
        <p className="text-muted-foreground mt-1 text-lg">
          {isSetup 
            ? "Tell us a bit about yourself so others can connect with you." 
            : "Update your information to keep your network informed."}
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Your public identity on BanglaConnect</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Primary Role <span className="text-destructive">*</span></FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="student">Student</SelectItem>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="mentor">Mentor</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country <span className="text-destructive">*</span></FormLabel>
                      <FormControl>
                        <Input placeholder="USA, Bangladesh, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input placeholder="San Francisco, Dhaka, etc." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Tell the community about your background and goals..." 
                        className="resize-none min-h-32" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>Write a brief introduction. Include what you're looking for.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="avatarUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avatar URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/avatar.jpg" {...field} />
                    </FormControl>
                    <FormDescription>Leave blank to use your Google/Clerk profile picture.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          {/* Role Specific Sections */}
          {(role === "student" || role === "professional") && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Skills & Interests</CardTitle>
                <CardDescription>What you know and what you want to learn</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="skills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skills</FormLabel>
                      <FormControl>
                        <TagInput field={field} placeholder="Type a skill and press Enter..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="interests"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Interests</FormLabel>
                      <FormControl>
                        <TagInput field={field} placeholder="Type an interest and press Enter..." />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          )}

          {role === "professional" && (
            <Card className="border-border">
              <CardHeader>
                <CardTitle>Professional Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="profession"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Profession / Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Software Engineer, Product Manager..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="professionalField"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry / Field</FormLabel>
                        <FormControl>
                          <Input placeholder="Tech, Healthcare, Finance..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {role === "mentor" && (
            <Card className="border-border border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-primary">Mentorship Details</CardTitle>
                <CardDescription>Help guide the next generation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FormField
                  control={form.control}
                  name="mentorAvailable"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border p-4 bg-card">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Available for Mentorship</FormLabel>
                        <FormDescription>
                          Turn this off if you are currently too busy to take on new mentees.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialties"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mentorship Specialties</FormLabel>
                      <FormControl>
                        <SpecialtiesSelect field={field} />
                      </FormControl>
                      <FormDescription className="mt-2">
                        Select the areas where you feel comfortable guiding others.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border/50">
                  <FormField
                    control={form.control}
                    name="profession"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Senior Developer, Founder..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="professionalField"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Industry</FormLabel>
                        <FormControl>
                          <Input placeholder="Technology..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          <div className="flex justify-end pt-4 pb-12">
            <Button type="submit" size="lg" className="w-full md:w-auto px-8 gap-2" disabled={isSaving}>
              <Save size={18} />
              {isSaving ? "Saving..." : "Save Profile"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
