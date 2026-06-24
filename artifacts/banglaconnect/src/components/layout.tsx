import { Link, useLocation } from "wouter";
import { useClerk, useUser, SignedIn, SignedOut } from "@clerk/clerk-react";
import {
  LayoutDashboard,
  Users,
  Network,
  UserCircle,
  LogOut,
  Menu,
  BookOpen,
  Newspaper,
  Briefcase,
  Calendar,
  MessageCircle,
  Lock,
  LifeBuoy,
  Shield,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import { useState } from "react";

/* ---------------- NAV DATA ---------------- */

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, authRequired: true },
  { href: "/mentors", label: "Mentors", icon: Users, authRequired: false },
  { href: "/connections", label: "Connections", icon: Network, authRequired: true },
  { href: "/chat", label: "Chat", icon: MessageCircle, authRequired: true },
  { href: "/vault", label: "Vault", icon: Lock, authRequired: true },
  { href: "/profile", label: "Profile", icon: UserCircle, authRequired: true },
];

const communityItems = [
  { href: "/blogs", label: "Blogs", icon: BookOpen, authRequired: false },
  { href: "/news", label: "News", icon: Newspaper, authRequired: false },
  { href: "/jobs", label: "Jobs", icon: Briefcase, authRequired: false },
  { href: "/events", label: "Events", icon: Calendar, authRequired: false },
];

const bottomItems = [
  { href: "/support", label: "Support", icon: LifeBuoy, authRequired: true },
  { href: "/admin", label: "Admin", icon: Shield, authRequired: true },
];

/* ---------------- COMPONENT ---------------- */

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { signOut } = useClerk();
  const { user, isSignedIn } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  const handleSignOut = () => {
    signOut({ redirectUrl: basePath || "/" });
  };

  /* ---------------- NAV LINKS ---------------- */

  const NavLinks = () => (
    <div className="flex flex-col gap-2 w-full">
      {navItems.map((item) => {
        if (item.authRequired && !isSignedIn) return null;

        const Icon = item.icon;
        const isActive =
          location === item.href || location.startsWith(`${item.href}/`);

        return (
          <Link key={item.href} href={item.href}>
            <span
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors w-full cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Icon size={20} />
              {item.label}
            </span>
          </Link>
        );
      })}

      <div className="mt-4 mb-2 px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
        Community
      </div>

      {communityItems.map((item) => {
        const Icon = item.icon;
        const isActive =
          location === item.href || location.startsWith(`${item.href}/`);

        return (
          <Link key={item.href} href={item.href}>
            <span
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors w-full cursor-pointer ${
                isActive
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <Icon size={20} />
              {item.label}
            </span>
          </Link>
        );
      })}

      {isSignedIn && (
        <>
          <div className="mt-4 mb-2 px-3 text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
            Account
          </div>

          {bottomItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              location === item.href || location.startsWith(`${item.href}/`);

            return (
              <Link key={item.href} href={item.href}>
                <span
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors w-full cursor-pointer ${
                    isActive
                      ? "bg-primary text-primary-foreground font-medium"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon size={20} />
                  {item.label}
                </span>
              </Link>
            );
          })}
        </>
      )}
    </div>
  );

  /* ---------------- USER SECTION ---------------- */

  const UserSection = () => (
    <div className="flex items-center justify-between p-4 border-t border-sidebar-border w-full">
      <SignedIn>
        <div className="flex items-center gap-3 overflow-hidden">
          <Avatar className="w-10 h-10 border border-sidebar-border">
            <AvatarImage src={user?.imageUrl} />
            <AvatarFallback>
              {user?.firstName?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-medium truncate text-sidebar-foreground">
              {user?.fullName || "User"}
            </span>
            <span className="text-xs text-sidebar-foreground/70 truncate">
              {user?.primaryEmailAddress?.emailAddress}
            </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleSignOut}
          title="Sign Out"
          className="shrink-0 text-sidebar-foreground hover:text-destructive hover:bg-destructive/10"
        >
          <LogOut size={18} />
        </Button>
      </SignedIn>

      <SignedOut>
        <Link href="/sign-in" className="w-full">
          <Button className="w-full">Sign In</Button>
        </Link>
      </SignedOut>
    </div>
  );

  /* ---------------- UI ---------------- */

  return (
    <div className="flex min-h-screen w-full bg-background flex-col md:flex-row">
      {/* Mobile Navbar */}
      <div className="md:hidden flex items-center justify-between p-4 border-b bg-sidebar">
        <div className="flex items-center gap-2">
          <Network className="text-primary" size={24} />
          <span className="font-bold text-lg text-sidebar-foreground">
            BanglaConnect
          </span>
        </div>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu size={24} />
            </Button>
          </SheetTrigger>

          <SheetContent side="left" className="w-[280px] p-0 flex flex-col bg-sidebar">
            <SheetHeader className="p-4 border-b border-sidebar-border text-left">
              <SheetTitle className="flex items-center gap-2">
                <Network className="text-primary" size={24} />
                BanglaConnect
              </SheetTitle>
            </SheetHeader>

            <div className="p-4 flex-1 overflow-y-auto">
              <NavLinks />
            </div>

            <UserSection />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-64 border-r border-sidebar-border bg-sidebar h-screen sticky top-0">
        <div className="p-6">
          <Link href="/">
            <div className="flex items-center gap-2 mb-8 cursor-pointer">
              <Network className="text-primary" size={28} />
              <span className="font-bold text-xl text-sidebar-foreground">
                BanglaConnect
              </span>
            </div>
          </Link>

          <NavLinks />
        </div>

        <div className="mt-auto">
          <UserSection />
        </div>
      </div>

      {/* Main */}
      <main className="flex-1 w-full flex flex-col min-h-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}