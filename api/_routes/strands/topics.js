/**
 * GET /api/strands/:id/topics
 * Lists active ALS curriculum topics belonging to the specified learning strand ID.
 */
import { getSupabase, json } from "../../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const { id } = req.query;
  if (!id) {
    return json(res, 400, { error: "Missing strand id" });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("topics")
      .select("topic_id, strand_id, parent_topic_id, name, description, display_order, is_active")
      .eq("strand_id", id)
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      return json(res, 500, { error: error.message });
    }

    res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=3600");
    return json(res, 200, { topics: data });
  } catch (err) {
    return json(res, 500, { error: err.message });
  }
}

