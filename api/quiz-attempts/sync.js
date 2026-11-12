import { getUserFromRequest, json } from "../_lib/supabase.js";

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
  if (req.method !== "POST") {
    return json(res, 405, { error: "Method not allowed" });
  }

  // 1. Authenticate user
  const { user, profile, client, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return json(res, 401, { error: authError || "Authentication required" });
  }

  let body;
  try {
    body = await parseBody(req);
  } catch (e) {
    return json(res, 400, { error: "Invalid JSON payload" });
  }

  const rawAttempts = Array.isArray(body.attempts) ? body.attempts : (body.attempt ? [body.attempt] : []);
  if (!rawAttempts.length) {
    return json(res, 400, { error: "No attempts provided for synchronization" });
  }

  const syncedIds = [];
  const errors = [];

  for (const raw of rawAttempts) {
    const attemptId = raw.attempt_id || raw.id;
    const setId = raw.question_set_id || raw.set;
    const answersObj = raw.answers || raw.ans || {}; // Map of { [question_id]: selected_choice_id or index }

    if (!setId) {
      errors.push({ attempt_id: attemptId, error: "Missing question_set_id" });
      continue;
    }

    try {
      // 2. Query correct choices from database for score re-validation
      const questionIds = Object.keys(answersObj);
      let verifiedScore = 0;
      let totalQuestions = questionIds.length;

      let choicesData = [];
      if (questionIds.length > 0) {
        const { data: choices, error: choiceErr } = await client
          .from("question_choices")
          .select("choice_id, question_id, choice_label, is_correct, display_order")
          .in("question_id", questionIds);

        if (!choiceErr && choices) {
          choicesData = choices;
        }
      }

      // Group choices by question_id
      const choicesByQuestion = new Map();
      for (const c of choicesData) {
        if (!choicesByQuestion.has(c.question_id)) {
          choicesByQuestion.set(c.question_id, []);
        }
        choicesByQuestion.get(c.question_id).push(c);
      }

      // Prepare answer rows & recalculate server-verified score
      const answerRows = [];
      for (const [qId, selectedVal] of Object.entries(answersObj)) {
        const qChoices = (choicesByQuestion.get(qId) || []).sort((a, b) => a.display_order - b.display_order);
        let selectedChoice = null;

        // Check if selectedVal is choice_id UUID or 0-indexed number
        if (typeof selectedVal === "number") {
          selectedChoice = qChoices[selectedVal] || null;
        } else if (typeof selectedVal === "string") {
          selectedChoice = qChoices.find(c => c.choice_id === selectedVal || c.choice_label === selectedVal) || null;
        }

        const isCorrect = selectedChoice ? Boolean(selectedChoice.is_correct) : false;
        if (isCorrect) verifiedScore++;

        answerRows.push({
          attempt_id: attemptId,
          question_id: qId,
          selected_choice_id: selectedChoice ? selectedChoice.choice_id : null,
          is_correct: isCorrect,
          answered_at: raw.completed_at || new Date().toISOString()
        });
      }

      // 3. Upsert attempt record (Idempotent: prevents duplicates on retry)
      const attemptRow = {
        attempt_id: attemptId,
        learner_id: user.id,
        question_set_id: setId,
        started_at: raw.started_at || new Date().toISOString(),
        completed_at: raw.completed_at || new Date().toISOString(),
        status: "completed",
        score: verifiedScore, // Server re-calculated score protects against client tampering
        total_questions: totalQuestions || raw.total || 0
      };

      const { error: upsertErr } = await client
        .from("quiz_attempts")
        .upsert(attemptRow, { onConflict: "attempt_id" });

      if (upsertErr) {
        errors.push({ attempt_id: attemptId, error: upsertErr.message });
        continue;
      }

      // 4. Upsert individual answers
      if (answerRows.length > 0) {
        await client
          .from("attempt_answers")
          .upsert(answerRows, { onConflict: "attempt_id,question_id" });
      }

      syncedIds.push(attemptId);
    } catch (e) {
      errors.push({ attempt_id: attemptId, error: e.message });
    }
  }

  return json(res, 200, {
    success: true,
    synced_count: syncedIds.length,
    synced_ids: syncedIds,
    errors: errors.length ? errors : undefined
  });
}

