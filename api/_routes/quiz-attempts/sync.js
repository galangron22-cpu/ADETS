/**
 * POST /api/quiz-attempts/sync
 * Idempotently syncs offline or online learner quiz attempts and re-calculates scores server-side against stored answer keys.
 */
import crypto from "node:crypto";
import { getUserFromRequest, json } from "../../_lib/supabase.js";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Returns true when `val` is a valid UUID string accepted by PostgreSQL `uuid` columns. */
function isUuid(val) {
  return typeof val === "string" && UUID_RE.test(val.trim());
}

/**
 * Normalizes `rawAttemptId` to a PostgreSQL-compatible UUID.
 * Legacy client IDs (e.g. `att_<timestamp>` from non-HTTPS Android browsers) are mapped
 * deterministically per `(userId, rawAttemptId)` so retries stay idempotent without collisions.
 */
function normalizeAttemptUuid(rawAttemptId, userId) {
  if (isUuid(rawAttemptId)) {
    return rawAttemptId.trim();
  }
  const seed = `${userId}:${rawAttemptId ?? `${Date.now()}-${Math.random()}`}`;
  const hash = crypto.createHash("sha256").update(seed).digest();
  hash[6] = (hash[6] & 0x0f) | 0x40;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString("hex");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

/** Reads and parses the incoming JSON request body when not pre-parsed by the runtime. */
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
    const rawAttemptId = raw.attempt_id ?? raw.id;
    const syncKey = rawAttemptId ?? null;
    const attemptId = normalizeAttemptUuid(rawAttemptId, user.id);
    const rawSetId = raw.question_set_id ?? raw.set ?? raw.set_id;
    const answersObj = raw.answers || raw.ans || {}; // Map of { [question_id]: selected_choice_id or index }

    if (rawSetId === undefined || rawSetId === null || String(rawSetId).trim() === "") {
      errors.push({ attempt_id: syncKey, error: "Missing question_set_id" });
      continue;
    }

    const setId = String(rawSetId).trim();
    if (!isUuid(setId)) {
      errors.push({
        attempt_id: syncKey,
        error: "Sample offline sets cannot sync to cloud progress. Complete a published assessment instead."
      });
      continue;
    }

    try {
      // 2. Query correct choices from database for score re-validation
      const allAnswerEntries = Object.entries(answersObj);
      const validQuestionIds = allAnswerEntries.map(([qId]) => qId).filter(isUuid);
      const rawTotal = Number(raw.total);
      let verifiedScore = 0;
      const totalQuestions = Number.isFinite(rawTotal) && rawTotal > 0 ? rawTotal : allAnswerEntries.length;

      let choicesData = [];
      if (validQuestionIds.length > 0) {
        const { data: choices, error: choiceErr } = await client
          .from("question_choices")
          .select("choice_id, question_id, choice_label, is_correct, display_order")
          .in("question_id", validQuestionIds);

        if (choiceErr) {
          errors.push({ attempt_id: syncKey, error: choiceErr.message });
          continue;
        }
        if (choices) {
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
      const answeredAt = raw.completed_at || new Date().toISOString();
      for (const [qId, selectedVal] of allAnswerEntries) {
        if (!isUuid(qId) || !choicesByQuestion.has(qId)) {
          continue;
        }

        const qChoices = choicesByQuestion.get(qId).slice().sort((a, b) => a.display_order - b.display_order);
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
          answered_at: answeredAt
        });
      }

      // 3. Upsert attempt record (Idempotent: prevents duplicates on retry)
      const nowIso = new Date().toISOString();
      const attemptRow = {
        attempt_id: attemptId,
        learner_id: user.id,
        question_set_id: setId,
        started_at: raw.started_at || raw.completed_at || nowIso,
        completed_at: raw.completed_at || nowIso,
        status: "completed",
        score: verifiedScore, // Server re-calculated score protects against client tampering
        total_questions: totalQuestions
      };

      const { error: upsertErr } = await client
        .from("quiz_attempts")
        .upsert(attemptRow, { onConflict: "attempt_id" });

      if (upsertErr) {
        errors.push({ attempt_id: syncKey, error: upsertErr.message });
        continue;
      }

      // 4. Upsert individual answers
      if (answerRows.length > 0) {
        const { error: ansErr } = await client
          .from("attempt_answers")
          .upsert(answerRows, { onConflict: "attempt_id,question_id" });
        if (ansErr) {
          errors.push({ attempt_id: syncKey, error: ansErr.message });
          continue;
        }
      }

      syncedIds.push(syncKey || attemptId);
    } catch (e) {
      errors.push({ attempt_id: syncKey, error: e.message });
    }
  }

  return json(res, 200, {
    success: true,
    synced_count: syncedIds.length,
    synced_ids: syncedIds,
    errors: errors.length ? errors : undefined
  });
}

