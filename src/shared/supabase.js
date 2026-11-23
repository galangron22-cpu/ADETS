import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || "https://zpiypvienwzdtzsekglf.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwaXlwdmllbnd6ZHR6c2VrZ2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0NjAyOTUsImV4cCI6MjExMDAzNjI5NX0.TqdqnIWY7gOlHCdmEaqaxnL8LG4mF6o5otS9J_ZLUY0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

// Helper for authenticated API calls to Vercel Serverless /api/* endpoints
export async function fetchApi(endpoint, options = {}) {
  const session = (await supabase.auth.getSession()).data?.session;
  const token = session?.access_token;

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  const contentType = res.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }
    return data;
  }

  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }

  return res;
}

