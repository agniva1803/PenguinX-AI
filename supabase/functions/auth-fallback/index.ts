import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AuthMode = "signup" | "login";

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { mode, email, password, fullName } = await req.json() as {
      mode: AuthMode;
      email: string;
      password: string;
      fullName?: string;
    };

    if (mode !== "signup" && mode !== "login") {
      throw new Error("Invalid auth mode");
    }

    if (!email || !password || !isValidEmail(email)) {
      throw new Error("Please provide a valid email and password");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");

    if (!supabaseUrl || !anonKey) {
      throw new Error("Backend auth configuration is missing");
    }

    const authHeaders = {
      "Content-Type": "application/json",
      apikey: anonKey,
      authorization: `Bearer ${anonKey}`,
      "x-client-info": "auth-fallback-function",
    };

    const signIn = async () => {
      const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: authHeaders,
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      return { res, data };
    };

    if (mode === "login") {
      const { res, data } = await signIn();

      if (!res.ok) {
        return new Response(JSON.stringify({ error: data?.msg || data?.error_description || "Login failed" }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        session: {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
        },
        user: data.user,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signupRes = await fetch(`${supabaseUrl}/auth/v1/signup`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        email,
        password,
        data: {
          full_name: fullName || "",
        },
      }),
    });

    const signupData = await signupRes.json();

    if (signupRes.ok && signupData?.access_token && signupData?.refresh_token) {
      return new Response(JSON.stringify({
        session: {
          access_token: signupData.access_token,
          refresh_token: signupData.refresh_token,
        },
        user: signupData.user,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (signupRes.ok) {
      const { res: signInRes, data: signInData } = await signIn();
      if (!signInRes.ok) {
        return new Response(JSON.stringify({ error: signInData?.msg || signInData?.error_description || "Signup completed but login failed" }), {
          status: signInRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        session: {
          access_token: signInData.access_token,
          refresh_token: signInData.refresh_token,
        },
        user: signInData.user,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signupMessage = signupData?.msg || signupData?.error_description || "Signup failed";

    if (signupRes.status === 422) {
      const { res: signInRes, data: signInData } = await signIn();
      if (signInRes.ok) {
        return new Response(JSON.stringify({
          session: {
            access_token: signInData.access_token,
            refresh_token: signInData.refresh_token,
          },
          user: signInData.user,
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ error: signupMessage }), {
      status: signupRes.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
