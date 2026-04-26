import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PenguinLogo } from "@/components/PenguinLogo";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Mail, Lock, ArrowLeft, User } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [searchParams] = useSearchParams();
  const initialMode = searchParams.get("mode") === "login" ? "login" : "signup";
  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const clearLocalSession = async () => {
    await supabase.auth.signOut({ scope: "local" });
  };

  const completeLogin = async (title: string, description: string) => {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session?.user) {
      await clearLocalSession().catch(() => {});
      throw new Error("Account was accepted, but the session was not created. Please try signing in again.");
    }

    toast({ title, description });
    navigate("/dashboard", { replace: true });
  };

  const persistFallbackSession = (session: any, user: any) => {
    const supabaseUrl = new URL(import.meta.env.VITE_SUPABASE_URL);
    const storageKey = `sb-${supabaseUrl.hostname.split(".")[0]}-auth-token`;
    const accessPayload = JSON.parse(atob(session.access_token.split(".")[1] ?? ""));

    localStorage.setItem(storageKey, JSON.stringify({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: accessPayload.exp,
      expires_in: Math.max(0, accessPayload.exp - Math.floor(Date.now() / 1000)),
      token_type: "bearer",
      user,
    }));
  };

  // If user is already logged in, redirect to dashboard
  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        // getSession may resolve with an auth refresh error instead of throwing
        await clearLocalSession().catch(() => {});
        return;
      }

      if (session?.user) {
        navigate("/dashboard", { replace: true });
      }
    }).catch(async () => {
      // Clear stale local tokens to stop refresh loops after network/proxy failures
      await clearLocalSession().catch(() => {});
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Ensure stale/broken refresh tokens don't interfere with a fresh auth attempt
    await clearLocalSession().catch(() => {});

    const tryAuthFallback = async () => {
      const payload = { mode, email, password, fullName };
      const fallbackResponse = await fetch("/cloud-functions/auth-fallback", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await fallbackResponse.json().catch(() => ({}));

      if (!fallbackResponse.ok) {
        throw new Error(data?.error || "Auth fallback failed");
      }

      const accessToken = data?.session?.access_token;
      const refreshToken = data?.session?.refresh_token;

      if (!accessToken || !refreshToken) {
        throw new Error(data?.error || "No session returned from fallback");
      }

      persistFallbackSession(data.session, data.user);

      await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      }).catch(() => null);
    };

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;

        if (data.session?.user) {
          await completeLogin("Account created!", "Welcome to PenguinX AI. Let's start your career journey!");
        } else if (data.user) {
          toast({
            title: "Check your email",
            description: "Your account was created. Please verify your email, then sign in.",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        await completeLogin("Welcome back!", "You've successfully signed in.");
      }
    } catch (error: any) {
      const message = error?.message || "Something went wrong. Please try again.";
      const normalizedMessage = message.toLowerCase();
      const isFetchError =
        normalizedMessage.includes("failed to fetch") ||
        normalizedMessage.includes("networkerror") ||
        normalizedMessage.includes("network request") ||
        normalizedMessage.includes("fetch") ||
        error?.name === "TypeError";

      if (isFetchError) {
        try {
          await clearLocalSession().catch(() => {});
          await tryAuthFallback();
          toast({
            title: mode === "signup" ? "Account created!" : "Welcome back!",
            description: "You've successfully signed in.",
          });
          navigate("/dashboard", { replace: true });
          return;
        } catch (fallbackError: any) {
          toast({
            title: "Connection error",
            description: fallbackError?.message || "Unable to reach authentication service. Please try again in a moment.",
            variant: "destructive",
          });
          return;
        }
      }

      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden px-4">
      {/* Background effects */}
      <div className="absolute inset-0 gradient-hero opacity-10" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        {/* Back to home */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <Card variant="elevated" className="border-2">
          <CardHeader className="text-center pb-2">
            <div className="flex justify-center mb-4">
              <PenguinLogo size="lg" showText={false} />
            </div>
            <CardTitle className="text-2xl">
              {mode === "login" ? "Welcome back!" : "Create your account"}
            </CardTitle>
            <CardDescription>
              {mode === "login"
                ? "Sign in to continue your career journey"
                : "Start your journey to career success"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="John Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Loading..." : mode === "login" ? "Sign In" : "Create Account"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              {mode === "login" ? (
                <p className="text-muted-foreground">
                  Don't have an account?{" "}
                  <button
                    onClick={() => setMode("signup")}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    onClick={() => setMode("login")}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
