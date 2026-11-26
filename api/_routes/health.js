/**
 * GET /api/health
 * Health-check endpoint verifying server uptime and live Supabase connectivity.
 */
import { getSupabase, json } from "../_lib/supabase.js";

export default async function handler(req, res) {
  try {
    const supabase = getSupabase();
    const { count, error } = await supabase
      .from("learning_strands")
      .select("*", { count: "exact", head: true });

    if (error) {
      return json(res, 500, { status: "error", message: error.message });
    }

    return json(res, 200, {
      status: "ok",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: "connected",
      strands_count: count
    });
  } catch (err) {
    return json(res, 500, { status: "error", message: err.message });
  }
}

