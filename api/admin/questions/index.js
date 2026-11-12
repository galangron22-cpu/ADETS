import { getUserFromRequest, json } from "../../_lib/supabase.js";

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
  // 1. Verify Teacher or Admin role (TC-ADM-05)
  const { user, profile, client, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return json(res, 401, { error: authError || "Authentication required" });
  }

  if (profile?.role !== "Teacher" && profile?.role !== "Admin") {
    return json(res, 403, { error: "Forbidden: Administrative access required" });
  }

  if (req.method === "GET") {
    try {
      let query = client
        .from("questions")
        .select(`
          question_id,
          topic_id,
          question_text,
          explanation,
          difficulty,
          source_type,
          status,
          created_by,
          reviewed_by,
          reviewed_at,
          rejection_reason,
          created_at,
          topics (
            name,
            strand_id,
            learning_strands (code, name)
          ),
          question_choices (
            choice_id,
            choice_label,
            choice_text,
            is_correct,
            display_order
          )
        `)
        .order("created_at", { ascending: false });

      if (req.query.status) {
        query = query.eq("status", req.query.status);
      }

      if (req.query.strand_id) {
        query = query.eq("topics.strand_id", req.query.strand_id);
      }

      const { data, error } = await query;
      if (error) return json(res, 500, { error: error.message });

      let list = data || [];
      if (req.query.q) {
        const search = req.query.q.toLowerCase();
        list = list.filter(item => item.question_text.toLowerCase().includes(search));
      }

      const formatted = list.map(q => {
        const sortedChoices = (q.question_choices || []).sort((a, b) => a.display_order - b.display_order);
        const correctIndex = sortedChoices.findIndex(c => c.is_correct);

        return {
          id: q.question_id,
          topic_id: q.topic_id,
          topic_name: q.topics?.name,
          strand_id: q.topics?.strand_id,
          strand_code: q.topics?.learning_strands?.code,
          text: q.question_text,
          choices: sortedChoices.map(c => c.choice_text),
          choice_ids: sortedChoices.map(c => c.choice_id),
          ans: correctIndex >= 0 ? correctIndex : 0,
          exp: q.explanation,
          diff: q.difficulty,
          src: q.source_type,
          status: q.status,
          rejection_reason: q.rejection_reason,
          created_at: q.created_at
        };
      });

      return json(res, 200, { questions: formatted });
    } catch (err) {
      return json(res, 500, { error: err.message });
    }
  }

  if (req.method === "POST") {
    // TC-ADM-01: Create manual question with four choices and one correct answer
    try {
      const body = await parseBody(req);
      const { topic_id, question_text, choices, correct_index, explanation, difficulty = "Medium", status = "Draft" } = body;

      if (!topic_id || !question_text) {
        return json(res, 400, { error: "topic_id and question_text are required" });
      }

      if (!Array.isArray(choices) || choices.length !== 4) {
        return json(res, 400, { error: "Exactly 4 choices are required" });
      }

      const { data: newQ, error: qErr } = await client
        .from("questions")
        .insert({
          topic_id,
          question_text,
          explanation: explanation || "",
          difficulty,
          source_type: "Manual",
          status: profile.role === "Admin" && status === "Approved" ? "Approved" : "Draft",
          created_by: user.id
        })
        .select("question_id")
        .single();

      if (qErr) return json(res, 500, { error: qErr.message });

      const labels = ["A", "B", "C", "D"];
      const choiceInserts = choices.map((c, i) => ({
        question_id: newQ.question_id,
        choice_label: labels[i],
        choice_text: String(c),
        is_correct: i === parseInt(correct_index || 0),
        display_order: i + 1
      }));

      const { error: cErr } = await client.from("question_choices").insert(choiceInserts);
      if (cErr) return json(res, 500, { error: cErr.message });

      return json(res, 201, {
        success: true,
        question_id: newQ.question_id,
        status: status
      });
    } catch (err) {
      return json(res, 500, { error: err.message });
    }
  }

  return json(res, 405, { error: "Method not allowed" });
}

