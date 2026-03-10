"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const handleAuth = async (session: any) => {
      if (!session?.user) return;
      
      const { user } = session;
      
      // Fetch user profile
      let { data: profile, error: fetchError } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (fetchError && fetchError.code === "PGRST116") {
        // No profile exists, create default customer profile
        const { data: newProfile, error: insertError } = await supabase
          .from("users")
          .insert([
            {
              id: user.id,
              role: "customer",
              full_name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
            }
          ])
          .select("role")
          .single();
          
        if (insertError) {
          console.error("Error creating profile:", insertError);
          // If RLS prevents inserting from the client, fallback safely
          if (mounted) router.push("/app");
          return;
        }
        profile = newProfile;
      }

      if (!mounted) return;

      const role = profile?.role || "customer";
      if (role === "owner") {
        router.push("/owner/dashboard");
      } else {
        router.push("/app");
      }
    };

    // Check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && mounted) handleAuth(session);
    });

    // Listen for auth changes (like returning from OAuth or Magic Link)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && mounted) handleAuth(session);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/login`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Check your email for the login link!");
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/login`,
      },
    });

    if (error) {
      setError(error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-background">
      {/* Left Panel - Branding (Hidden on mobile) */}
      <div className="hidden md:flex md:w-1/2 bg-primary text-white flex-col justify-center items-center p-12 relative overflow-hidden">
        <div className="relative z-10 text-center space-y-6 max-w-lg">
          <h1 className="text-6xl font-extrabold tracking-tight">
            BOOK<span className="text-accent">NGO</span>
          </h1>
          <div className="text-8xl my-8">✂</div>
          <p className="text-2xl font-medium tracking-wide text-[#EEEEEE]">
            Book Smart. Look Sharp.
          </p>
        </div>
        
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 0,20 L 40,20 M 20,0 L 20,40" stroke="white" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#pattern)" />
          </svg>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 md:p-16">
        <div className="w-full max-w-md space-y-8">
          
          {/* Mobile Branding Header */}
          <div className="md:hidden text-center mb-10">
            <h1 className="text-4xl font-extrabold text-primary tracking-tight">
              BOOK<span className="text-accent">NGO</span>
            </h1>
            <p className="mt-2 text-muted">Book Smart. Look Sharp.</p>
          </div>

          <div className="text-center">
            <h2 className="text-3xl font-bold text-primary">Welcome Back</h2>
            <p className="mt-2 text-muted">Enter your details to access your account.</p>
          </div>

          {message && (
            <div className="p-4 bg-green-50 text-green-700 text-sm rounded-md border border-green-200 text-center font-medium">
              {message}
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-sm rounded-md border border-red-200 text-center font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailLogin} className="space-y-6 mt-8">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none block w-full px-4 py-3 border border-[#EEEEEE] rounded-md placeholder-muted text-primary focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent shadow-sm bg-background"
                placeholder="Email address"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-primary bg-accent hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent transition-colors disabled:opacity-50"
            >
              {loading ? "Sending..." : "Continue with Email"}
            </button>
          </form>

          <div className="mt-6 flex items-center justify-center">
            <div className="w-full border-t border-[#EEEEEE]"></div>
            <div className="px-4 text-sm text-muted bg-background">or</div>
            <div className="w-full border-t border-[#EEEEEE]"></div>
          </div>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-bold text-white bg-primary hover:bg-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors mt-6"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}
