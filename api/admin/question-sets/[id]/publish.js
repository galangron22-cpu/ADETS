/**
 * PATCH /api/admin/question-sets/:id/publish
 * Transitions a question set to 'Published' status (Administrator-only governance action).
 */
import { getUserFromRequest, json } from "../../../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const { id } = req.query;
  if (!id) return json(res, 400, { error: "Missing question set id" });

  const { user, profile, client, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return json(res, 401, { error: authError || "Authentication required" });
  }

  // Strictly Admin per specification A2
  if (profile?.role !== "Admin") {
    return json(res, 403, { error: "Forbidden: Only Administrators can publish question sets" });
  }

  try {
    const { data, error } = await client
      .from("question_sets")
      .update({
        status: "Published",
        published_at: new Date().toISOString()
      })
      .eq("question_set_id", id)
      .select()
      .single();

    if (error) return json(res, 500, { error: error.message });

    return json(res, 200, {
      success: true,
      message: "Question set published successfully for all learners",
      question_set: data
    });
  } catch (err) {
    return json(res, 500, { error: err.message });
  }
}

