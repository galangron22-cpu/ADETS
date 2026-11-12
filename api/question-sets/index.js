import { getSupabase, json } from "../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method not allowed" });
  }

  try {
    const supabase = getSupabase();
    let query = supabase
      .from("question_sets")
      .select(`
        question_set_id,
        title,
        description,
        strand_id,
        version,
        status,
        published_at,
        learning_strands (code, name),
        question_set_items (count)
      `)
      .eq("status", "Published")
      .order("published_at", { ascending: false });

    if (req.query.strand_id) {
      query = query.eq("strand_id", req.query.strand_id);
    }

    const { data, error } = await query;
    if (error) {
      return json(res, 500, { error: error.message });
    }

    const sets = (data || []).map(s => ({
      id: s.question_set_id,
      title: s.title,
      description: s.description,
      strand_id: s.strand_id,
      strand_code: s.learning_strands?.code,
      strand_name: s.learning_strands?.name,
      ver: s.version,
      status: s.status,
      question_count: s.question_set_items?.[0]?.count || 0
    }));

    return json(res, 200, { question_sets: sets });
  } catch (err) {
    return json(res, 500, { error: err.message });
  }
}

