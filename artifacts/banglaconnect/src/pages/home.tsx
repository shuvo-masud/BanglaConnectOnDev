import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Network, Globe, BookOpen, Users, Briefcase, Newspaper, Tv2, ArrowRight, CheckCircle2, Star, TrendingUp, Shield } from "lucide-react";

const featureCards = [
  {
    icon: BookOpen,
    label: "Blogs",
    description: "Read insights from our community",
    bg: "bg-blue-100",
    color: "text-blue-600",
    href: "/blogs",
  },
  {
    icon: Newspaper,
    label: "News",
    description: "Stay updated with latest happenings",
    bg: "bg-red-100",
    color: "text-red-500",
    href: "/news",
  },
  {
    icon: Briefcase,
    label: "Jobs",
    description: "Find opportunities worldwide",
    bg: "bg-emerald-100",
    color: "text-emerald-600",
    href: "/jobs",
  },
  {
    icon: Tv2,
    label: "Entertainment",
    description: "Explore community events",
    bg: "bg-orange-100",
    color: "text-orange-500",
    href: "/events",
  },
];

const features = [
  {
    icon: Globe,
    title: "Global Network",
    description: "Connect with Bangladeshi professionals from Silicon Valley to Tokyo. Expand your horizons beyond borders.",
    bg: "bg-blue-50",
    color: "text-blue-600",
  },
  {
    icon: Star,
    title: "Expert Mentorship",
    description: "Get 1:1 guidance from industry veterans in tech, finance, medicine, and more. Accelerate your career.",
    bg: "bg-emerald-50",
    color: "text-emerald-600",
  },
  {
    icon: TrendingUp,
    title: "Career Growth",
    description: "Access exclusive job opportunities, internships, and career resources curated for the diaspora.",
    bg: "bg-purple-50",
    color: "text-purple-600",
  },
  {
    icon: Users,
    title: "Community First",
    description: "A warm, welcoming space built around shared culture and professional aspirations.",
    bg: "bg-orange-50",
    color: "text-orange-500",
  },
  {
    icon: Shield,
    title: "Trusted & Safe",
    description: "Verified profiles and a respectful environment where your data and privacy are always protected.",
    bg: "bg-red-50",
    color: "text-red-500",
  },
  {
    icon: BookOpen,
    title: "Learn & Share",
    description: "Discover blogs, news, and resources written by community members for community members.",
    bg: "bg-teal-50",
    color: "text-teal-600",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Globe className="text-white" size={18} />
            </div>
            <div>
              <span className="font-bold text-xl text-foreground">BanglaConnect</span>
              <p className="text-xs text-muted-foreground leading-none">When people connect, opportunities multiply.</p>
            </div>
          </div>
          <div className="flex gap-3 items-center">
            <Link href="/sign-in">
              <Button variant="ghost" className="font-medium" data-testid="link-sign-in">Sign In</Button>
            </Link>
            <Link href="/sign-up">
              <Button className="font-medium" data-testid="link-get-started">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Feature cards row */}
        <div className="border-b bg-white">
          <div className="container mx-auto px-6 py-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {featureCards.map((card) => (
                <Link
                  key={card.label}
                  href={card.href}
                  data-testid={`feature-card-${card.label.toLowerCase()}`}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group cursor-pointer"
                >
                  <div className={`w-10 h-10 rounded-xl ${card.bg} flex items-center justify-center flex-shrink-0`}>
                    <card.icon className={card.color} size={20} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-gray-900 group-hover:text-primary transition-colors">{card.label}</p>
                    <p className="text-xs text-gray-500 leading-tight">{card.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Hero section */}
        <section className="py-20 md:py-28 px-6 bg-gradient-to-b from-white via-[hsl(160_60%_98%)] to-white">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-gray-900 mb-6 leading-tight">
              Connect with{" "}
              <span className="text-primary">Bangladeshi<br />Mentors</span>{" "}
              Worldwide
            </h1>
            <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              BanglaConnect bridges the gap between ambitious Bangladeshi students abroad and experienced professionals ready to guide their journey. Find your mentor, build your network, achieve your dreams.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
              <Link href="/mentors">
                <Button
                  size="lg"
                  className="text-base px-8 h-13 w-full sm:w-auto shadow-md hover:shadow-lg transition-all"
                  data-testid="button-find-mentor"
                >
                  Find Your Mentor <ArrowRight className="ml-2" size={18} />
                </Button>
              </Link>
              <Link href="/sign-up">
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base px-8 h-13 w-full sm:w-auto border-2"
                  data-testid="button-become-mentor"
                >
                  Become a Mentor
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="text-primary" size={16} />
                Free to join
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="text-primary" size={16} />
                500+ mentors
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="text-primary" size={16} />
                30+ countries
              </span>
            </div>
          </div>
        </section>

        {/* Everything you need section */}
        <section className="py-20 px-6 bg-gray-50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-14">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Everything you need to succeed
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto">
                One platform for mentorship, networking, jobs, and community — built for Bangladeshis, by Bangladeshis.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="bg-white p-7 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
                  data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <div className={`w-12 h-12 ${feature.bg} rounded-xl flex items-center justify-center mb-5`}>
                    <feature.icon className={feature.color} size={24} />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
                  <p className="text-gray-500 leading-relaxed text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA banner */}
        <section className="py-20 px-6 bg-primary">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to grow with your community?
            </h2>
            <p className="text-lg text-white/80 mb-8 max-w-xl mx-auto">
              Join thousands of Bangladeshi students and professionals building their futures together.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-gray-50 text-base px-8 h-13 shadow-md font-semibold"
                  data-testid="button-cta-join"
                >
                  Join for Free
                </Button>
              </Link>
              <Link href="/mentors">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white/10 text-base px-8 h-13"
                  data-testid="button-cta-browse"
                >
                  Browse Mentors
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 py-10 text-center text-gray-400">
        <div className="container mx-auto px-6">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <Globe className="text-white" size={15} />
            </div>
            <span className="font-semibold text-white">BanglaConnect</span>
          </div>
          <p className="text-sm">© {new Date().getFullYear()} BanglaConnect. Empowering the diaspora.</p>
        </div>
      </footer>
    </div>
  );
}
