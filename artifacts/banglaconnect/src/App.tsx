import { useEffect } from "react";
import { useLocation, Switch, Route, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import {
  ClerkProvider,
  useAuth,
  useClerk,
  SignIn,
  SignedIn,
  SignedOut,
} from "@clerk/clerk-react";

import { Toaster } from "@/components/ui/toaster";
import { shadcn } from "@clerk/themes";

import { setBaseUrl, setAuthTokenGetter } from "@/lib/custom-fetch";

/* ---------------- PAGES ---------------- */
import HomePage from "@/pages/home";
import DashboardPage from "@/pages/dashboard";
import MentorsPage from "@/pages/mentors";
import MentorProfilePage from "@/pages/mentors/[id]";
import EditProfilePage from "@/pages/profile/edit";
import ViewProfilePage from "@/pages/profile/[id]";
import ConnectionsPage from "@/pages/connections";
import BlogsPage from "@/pages/blogs/index";
import BlogDetailPage from "@/pages/blogs/[id]";
import NewsPage from "@/pages/news/index";
import JobsPage from "@/pages/jobs/index";
import JobDetailPage from "@/pages/jobs/[id]";
import EventsPage from "@/pages/events/index";
import EventDetailPage from "@/pages/events/[id]";
import ChatPage from "@/pages/chat";
import VaultPage from "@/pages/vault";
import SupportPage from "@/pages/support";
import AdminPage from "@/pages/admin";
import NotFound from "@/pages/not-found";
import Layout from "./components/layout";

const queryClient = new QueryClient();

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

const clerkAppearance = {
  baseTheme: shadcn,
  cssLayerName: "clerk",
};

/* ---------------- AUTH INIT ---------------- */
function AuthInitializer() {
  const { getToken } = useAuth();

  useEffect(() => {
    setAuthTokenGetter(() => getToken);
  }, [getToken]);

  return null;
}

/* ---------------- SIGN IN PAGE ---------------- */
function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </div>
  );
}

/* ---------------- ROUTER ---------------- */
function Router() {
  return (
    <Switch>
      {/* Public */}
      <Route path="/" component={HomePage} />

      {/* Auth pages (NO layout, NO redirects inside Switch) */}
      <Route path="/sign-in" component={SignInPage} />

      {/* Protected App */}
      <Route>
        <SignedIn>
          <Layout>
            <Switch>
              <Route path="/dashboard" component={DashboardPage} />
              <Route path="/profile" component={EditProfilePage} />
              <Route path="/profile/:id" component={ViewProfilePage} />
              <Route path="/connections" component={ConnectionsPage} />
              <Route path="/chat" component={ChatPage} />
              <Route path="/vault" component={VaultPage} />
              <Route path="/support" component={SupportPage} />
              <Route path="/admin" component={AdminPage} />

              {/* Public content inside app */}
              <Route path="/mentors" component={MentorsPage} />
              <Route path="/mentors/:id" component={MentorProfilePage} />
              <Route path="/blogs" component={BlogsPage} />
              <Route path="/blogs/:id" component={BlogDetailPage} />
              <Route path="/news" component={NewsPage} />
              <Route path="/jobs" component={JobsPage} />
              <Route path="/jobs/:id" component={JobDetailPage} />
              <Route path="/events" component={EventsPage} />
              <Route path="/events/:id" component={EventDetailPage} />

              <Route component={NotFound} />
            </Switch>
          </Layout>
        </SignedIn>

        <SignedOut>
          <Redirect to="/sign-in" />
        </SignedOut>
      </Route>
    </Switch>
  );
}

/* ---------------- APP ---------------- */
export default function App() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_URL;
    if (apiUrl) setBaseUrl(apiUrl);
  }, []);

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      appearance={clerkAppearance}
      signInUrl="/sign-in"
      routerPush={(to) => setLocation(to)}
      routerReplace={(to) => setLocation(to, { replace: true })}
    >
      <AuthInitializer />

      <QueryClientProvider client={queryClient}>
        <Router />
      </QueryClientProvider>

      <Toaster />
    </ClerkProvider>
  );
}