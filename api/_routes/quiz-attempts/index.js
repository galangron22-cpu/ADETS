/**
 * GET /api/quiz-attempts
 * Retrieves completed quiz attempt history scoped to the signed-in learner (or filtered by learner_id for staff).
 */
import { getUserFromRequest, json } from "../../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const { user, profile, client, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return json(res, 401, { error: authError || "Authentication required" });
  }

  try {
    let query = client
      .from("quiz_attempts")
      .select(`
        attempt_id,
        learner_id,
        question_set_id,
        started_at,
        completed_at,
        status,
        score,
        total_questions,
        question_sets (title, strand_id, learning_strands (code, name))
      `)
      .order("completed_at", { ascending: false });

    // Learners can only view their own attempts (RLS also enforces this)
    if (profile?.role === "Learner") {
      query = query.eq("learner_id", user.id);
    } else if (req.query.learner_id) {
      query = query.eq("learner_id", req.query.learner_id);
    }

    const { data, error } = await query;
    if (error) {
      return json(res, 500, { error: error.message });
    }

    const formatted = (data || []).map(a => ({
      attempt_id: a.attempt_id,
      set_id: a.question_set_id,
      set_title: a.question_sets?.title,
      strand_code: a.question_sets?.learning_strands?.code,
      strand_name: a.question_sets?.learning_strands?.name,
      score: a.score,
      total: a.total_questions,
      percentage: a.total_questions ? Math.round((a.score / a.total_questions) * 100) : 0,
      completed_at: a.completed_at
    }));

    return json(res, 200, { attempts: formatted });
  } catch (err) {
    return json(res, 500, { error: err.message });
  }
}

