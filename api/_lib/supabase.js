/**
 * Shared Supabase client factory, Bearer-token authentication helper, and JSON response helper
 * used by Vercel serverless API handlers.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "https://zpiypvienwzdtzsekglf.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpwaXlwdmllbnd6ZHR6c2VrZ2xmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQ0NjAyOTUsImV4cCI6MjExMDAzNjI5NX0.TqdqnIWY7gOlHCdmEaqaxnL8LG4mF6o5otS9J_ZLUY0";

/** Creates a Supabase client, optionally scoped to a user's JWT for Row-Level Security. */
export function getSupabase(authToken = null) {
  const options = {};
  if (authToken) {
    options.global = {
      headers: {
        Authorization: `Bearer ${authToken}`
      }
    };
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, options);
}

/** Validates the request's Bearer token and returns the authenticated Supabase user and profile. */
export async function getUserFromRequest(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return { user: null, profile: null, error: "Missing or invalid authorization header" };
  }

  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  const client = getSupabase(token);
  const { data: { user }, error } = await client.auth.getUser(token);

  if (error || !user) {
    return { user: null, profile: null, error: error?.message || "Invalid or expired session token" };
  }

  // Fetch role and status from profiles
  const { data: profile } = await client
    .from("profiles")
    .select("profile_id, display_name, role, account_status")
    .eq("profile_id", user.id)
    .single();

  return { user, profile, client, token };
}

/** Sends a standardized JSON HTTP response with status code and Content-Type header. */
export function json(res, statusCode, data) {
  res.statusCode = statusCode;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(data));
}

