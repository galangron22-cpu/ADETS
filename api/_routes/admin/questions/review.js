/**
 * PATCH /api/admin/questions/:id
 * Allows Educators to update question content / save Draft or Pending items,
 * and allows Administrators to approve, reject (with required rejection_reason), or archive items.
 */
import { getUserFromRequest, json } from "../../../_lib/supabase.js";

async function parseBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", chunk => { data += chunk; });
    req.on("end", () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch (e) {
        reject(e);
      }
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "PATCH") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const { id } = req.query;
  if (!id) return json(res, 400, { error: "Missing question id" });

  const { user, profile, client, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return json(res, 401, { error: authError || "Authentication required" });
  }

  if (profile?.role !== "Teacher" && profile?.role !== "Admin") {
    return json(res, 403, { error: "Forbidden: Educator or Administrator role required" });
  }

  try {
    const body = await parseBody(req);
    const { status, rejection_reason, topic_id, question_text, choices, correct_index, explanation, difficulty } = body;

    if (!["Approved", "Rejected", "Draft", "Pending", "Archived"].includes(status)) {
      return json(res, 400, { error: "Invalid status value" });
    }

    // Strictly Admin for Approve / Reject / Archive (Per user specification A2)
    if (profile.role !== "Admin" && ["Approved", "Rejected", "Archived"].includes(status)) {
      return json(res, 403, { error: "Forbidden: Only Administrators can review, approve, or reject questions" });
    }

    // TC-ADM-04: Reject without reason is blocked
    if (status === "Rejected" && (!rejection_reason || !rejection_reason.trim())) {
      return json(res, 400, { error: "Rejection reason is required" });
    }

    const updates = {
      status,
      updated_at: new Date().toISOString()
    };

    if (topic_id) updates.topic_id = topic_id;
    if (typeof question_text === "string" && question_text.trim()) updates.question_text = question_text.trim();
    if (typeof explanation === "string") updates.explanation = explanation;
    if (difficulty) updates.difficulty = difficulty;

    if (profile.role === "Admin" && ["Approved", "Rejected"].includes(status)) {
      updates.reviewed_by = user.id;
      updates.reviewed_at = new Date().toISOString();
      updates.rejection_reason = status === "Rejected" ? rejection_reason.trim() : null;
    } else if (status === "Pending" || status === "Draft") {
      updates.rejection_reason = null;
    }

    const { data, error } = await client
      .from("questions")
      .update(updates)
      .eq("question_id", id)
      .select()
      .single();

    if (error) return json(res, 500, { error: error.message });

    // Update 4 choices if provided
    if (Array.isArray(choices) && choices.length === 4) {
      const { data: existingChoices } = await client
        .from("question_choices")
        .select("choice_id, display_order")
        .eq("question_id", id)
        .order("display_order", { ascending: true });

      const correctIdx = parseInt(correct_index ?? 0, 10);
      if (existingChoices && existingChoices.length === 4) {
        for (let i = 0; i < 4; i++) {
          await client
            .from("question_choices")
            .update({
              choice_text: String(choices[i]),
              is_correct: i === correctIdx
            })
            .eq("choice_id", existingChoices[i].choice_id);
        }
      }
    }

    return json(res, 200, {
      success: true,
      question: data
    });
  } catch (err) {
    return json(res, 500, { error: err.message });
  }
}

