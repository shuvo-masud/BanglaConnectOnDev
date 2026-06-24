import { useListEvents, useCreateEvent, getListEventsQueryKey } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@clerk/clerk-react";
import { Search, Calendar as CalendarIcon, MapPin, Video, Users, PartyPopper } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";

export default function EventsPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<string>("all");
  
  const { data: events, isLoading } = useListEvents({ 
    search: search || undefined,
    category: category !== "all" ? category : undefined
  });
  
  const { isSignedIn } = useUser();

  const getCategoryColor = (cat: string) => {
    switch (cat?.toLowerCase()) {
      case 'cultural': return 'bg-purple-100 text-purple-800';
      case 'networking': return 'bg-teal-100 text-teal-800';
      case 'workshop': return 'bg-blue-100 text-blue-800';
      case 'startup': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Community Events</h1>
          <p className="text-gray-500 mt-1">Meetups, cultural festivals, and workshops.</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input 
              placeholder="Search events..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          {isSignedIn && <CreateEventDialog />}
        </div>
      </div>

      <Tabs defaultValue="all" className="mb-8" onValueChange={setCategory}>
        <TabsList className="bg-gray-100/80 p-1 w-full sm:w-auto overflow-x-auto justify-start h-auto flex-wrap">
          <TabsTrigger value="all" className="rounded-md">All Events</TabsTrigger>
          <TabsTrigger value="cultural" className="rounded-md">Cultural</TabsTrigger>
          <TabsTrigger value="networking" className="rounded-md">Networking</TabsTrigger>
          <TabsTrigger value="workshop" className="rounded-md">Workshop</TabsTrigger>
          <TabsTrigger value="startup" className="rounded-md">Startup</TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="border rounded-2xl p-0 bg-white shadow-sm flex flex-col">
              <Skeleton className="h-40 w-full rounded-t-2xl rounded-b-none" />
              <div className="p-5 flex-1">
                <Skeleton className="h-4 w-24 mb-4" />
                <Skeleton className="h-6 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : events?.length === 0 ? (
        <div className="text-center py-20 border-2 border-dashed rounded-2xl bg-gray-50">
          <PartyPopper className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No events found</h3>
          <p className="text-gray-500 mt-2">Check back later or host your own event.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events?.map(event => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <div className="border border-gray-100 rounded-2xl overflow-hidden flex flex-col h-full bg-white shadow-sm hover:shadow-md transition-all cursor-pointer group">
                <div className="relative h-48 bg-gray-100">
                  {event.coverImageUrl ? (
                    <img src={event.coverImageUrl} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
                      <CalendarIcon className="w-12 h-12 text-purple-300" />
                    </div>
                  )}
                  {event.category && (
                    <div className="absolute top-4 left-4">
                      <Badge className={`${getCategoryColor(event.category)} border-none shadow-sm capitalize px-3 py-1 font-medium`}>
                        {event.category}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex gap-4 mb-4">
                    <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg p-2 min-w-[60px] border border-gray-100">
                      <span className="text-sm font-bold text-primary uppercase leading-none">
                        {format(new Date(event.eventDate), "MMM")}
                      </span>
                      <span className="text-xl font-extrabold text-gray-900 leading-none mt-1">
                        {format(new Date(event.eventDate), "dd")}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900 leading-tight group-hover:text-primary transition-colors line-clamp-2 mb-2">
                        {event.title}
                      </h3>
                      <div className="flex items-center text-sm text-gray-600 font-medium">
                        <CalendarIcon className="w-4 h-4 mr-1.5 text-gray-400" />
                        {format(new Date(event.eventDate), "h:mm a")}
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-4 border-t border-gray-50 flex items-center gap-2 text-sm text-gray-600">
                    {event.isVirtual ? (
                      <><Video className="w-4 h-4 text-emerald-500" /> Virtual Event</>
                    ) : (
                      <><MapPin className="w-4 h-4 text-gray-400" /> <span className="truncate">{event.location}</span></>
                    )}
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

function CreateEventDialog() {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [category, setCategory] = useState("networking");
  const [isVirtual, setIsVirtual] = useState(false);
  const [location, setLocation] = useState("");
  const [registrationUrl, setRegistrationUrl] = useState("");
  
  const createEvent = useCreateEvent();
  const queryClient = useQueryClient();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createEvent.mutate(
      { 
        data: { 
          title, 
          description,
          eventDate: new Date(eventDate).toISOString(),
          category,
          isVirtual,
          location: isVirtual ? undefined : location,
          registrationUrl: registrationUrl || undefined,
        } 
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListEventsQueryKey() });
          setOpen(false);
        }
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Event</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Host an Event</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Event Name</Label>
            <Input id="title" required value={title} onChange={e => setTitle(e.target.value)} />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="date">Date & Time</Label>
              <Input id="date" type="datetime-local" required value={eventDate} onChange={e => setEventDate(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="networking">Networking</SelectItem>
                  <SelectItem value="cultural">Cultural</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="startup">Startup</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input 
              type="checkbox" 
              id="isVirtual" 
              checked={isVirtual} 
              onChange={e => setIsVirtual(e.target.checked)} 
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="isVirtual" className="font-normal">This is a virtual/online event</Label>
          </div>

          {!isVirtual && (
            <div className="grid gap-2">
              <Label htmlFor="location">Location</Label>
              <Input id="location" required={!isVirtual} value={location} onChange={e => setLocation(e.target.value)} placeholder="Venue name or address" />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea 
              id="description" 
              required 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              className="resize-none h-24"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="url">Registration Link (Optional)</Label>
            <Input id="url" type="url" value={registrationUrl} onChange={e => setRegistrationUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className="flex justify-end pt-4 border-t mt-2">
            <Button type="button" variant="outline" className="mr-2" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={createEvent.isPending}>
              {createEvent.isPending ? "Creating..." : "Create Event"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
