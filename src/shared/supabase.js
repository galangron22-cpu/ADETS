/**
 * Browser-side Supabase client singleton and authenticated `fetchApi` wrapper for Vercel `/api/*` serverless routes.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL || "https://zpiypvienwzdtzsekglf.supabase.co";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwaXlwdmllbnd6ZHR6c2VrZ2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0NjAyOTUsImV4cCI6MjExMDAzNjI5NX0.TqdqnIWY7gOlHCdmEaqaxnL8LG4mF6o5otS9J_ZLUY0";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

let inFlightSessionPromise = null;

async function getAccessToken() {
  if (!inFlightSessionPromise) {
    inFlightSessionPromise = supabase.auth.getSession().finally(() => {
      inFlightSessionPromise = null;
    });
  }
  const { data } = await inFlightSessionPromise;
  return data?.session?.access_token || null;
}

// Helper for authenticated (or public with `{ auth: false }`) API calls to Vercel Serverless /api/* endpoints
export async function fetchApi(endpoint, options = {}) {
  const { _retried = false, auth = true, ...fetchOptions } = options;
  const token = auth ? await getAccessToken() : null;

  const headers = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers || {})
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...fetchOptions,
    headers
  });

  // Recover seamlessly if an offline device held a short-lived expired access token upon reconnect
  if (res.status === 401 && token && !_retried) {
    const { data: refreshed } = await supabase.auth.refreshSession().catch(() => ({ data: null }));
    if (refreshed?.session?.access_token && refreshed.session.access_token !== token) {
      return fetchApi(endpoint, { ...fetchOptions, auth, _retried: true });
    }
  }

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

