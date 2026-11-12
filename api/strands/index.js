import { getSupabase, json } from "../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("learning_strands")
      .select("strand_id, code, name, description, display_order, is_active")
      .eq("is_active", true)
      .order("display_order", { ascending: true });

    if (error) {
      return json(res, 500, { error: error.message });
    }

    return json(res, 200, { strands: data });
  } catch (err) {
    return json(res, 500, { error: err.message });
  }
}

