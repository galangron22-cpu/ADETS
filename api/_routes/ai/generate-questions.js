/**
 * POST /api/ai/generate-questions
 * Generates DepEd ALS multiple-choice draft questions for Teachers/Admins via Google Gemini
 * and saves them in 'Pending' status for Admin review before publishing.
 */
import { GoogleGenAI } from "@google/genai";
import { getUserFromRequest, json } from "../../_lib/supabase.js";
import fs from "fs";
import path from "path";

/** Loads the Gemini API key from process environment or local `.env` fallback. */
function getGeminiApiKey() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your_gemini_api_key_here") {
    return process.env.GEMINI_API_KEY;
  }
  try {
    const envPath = path.resolve(process.cwd(), ".env");
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, "utf-8");
      const match = content.match(/GEMINI_API_KEY=(.+)/);
      if (match && match[1].trim() !== "your_gemini_api_key_here") {
        return match[1].trim();
      }
    }
  } catch (e) {}
  return null;
}

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

  // 1. Role verification: Only Teacher or Admin (TC-ADM-05 protection)
  const { user, profile, client, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return json(res, 401, { error: authError || "Authentication required" });
  }

  if (profile?.role !== "Teacher" && profile?.role !== "Admin") {
    return json(res, 403, { error: "Forbidden: Only Teachers and Administrators can generate questions" });
  }

  let body;
  try {
    body = await parseBody(req);
  } catch (e) {
    return json(res, 400, { error: "Invalid JSON payload" });
  }

  const { topic_id, strand_id, difficulty = "Medium", count = 3 } = body;
  const numQuestions = Math.min(Math.max(parseInt(count) || 1, 1), 5); // 1 to 5 questions

  if (!topic_id && !strand_id) {
    return json(res, 400, { error: "topic_id or strand_id is required" });
  }

  // 2. Fetch topic and strand details
  let targetTopicId = topic_id;
  let topicName = "General Practice";
  let strandCode = "ALS";

  if (targetTopicId) {
    const { data: topic } = await client
      .from("topics")
      .select("topic_id, name, strand_id, learning_strands (code, name)")
      .eq("topic_id", targetTopicId)
      .single();

    if (topic) {
      topicName = topic.name;
      strandCode = topic.learning_strands?.code || "ALS";
    }
  } else if (strand_id) {
    // Find first active topic for the strand
    const { data: topics } = await client
      .from("topics")
      .select("topic_id, name, learning_strands (code)")
      .eq("strand_id", strand_id)
      .limit(1);

    if (topics && topics.length > 0) {
      targetTopicId = topics[0].topic_id;
      topicName = topics[0].name;
      strandCode = topics[0].learning_strands?.code || "ALS";
    }
  }

  if (!targetTopicId) {
    return json(res, 400, { error: "No valid topic found for question generation" });
  }

  const apiKey = getGeminiApiKey();
  let generatedItems = [];

  if (apiKey && apiKey !== "your_gemini_api_key_here") {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Generate exactly ${numQuestions} multiple-choice question(s) suitable for Philippine DepEd Alternative Learning System (ALS) A&E examination.
Strand: ${strandCode}
Topic: ${topicName}
Difficulty: ${difficulty}

You must return valid JSON with an array of questions:
[
  {
    "question_text": "...",
    "choices": ["Choice A text", "Choice B text", "Choice C text", "Choice D text"],
    "correct_index": 1,
    "explanation": "..."
  }
]
Important:
- Provide exactly 4 choices (index 0 to 3).
- Provide a clear educational explanation of why the correct choice is right.
- Return ONLY the JSON array, no markdown fences or preamble.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          temperature: 0.2
        }
      });

      const parsed = JSON.parse(response.text || "[]");
      if (Array.isArray(parsed)) {
        generatedItems = parsed;
      }
    } catch (err) {
      console.error("Gemini question generation error:", err);
    }
  }

  // Fallback template questions if AI key is missing or fails
  if (!generatedItems.length) {
    generatedItems = [
      {
        question_text: `[Sample AI Draft] What is a primary concept covered under ${topicName}?`,
        choices: ["Option A: Foundation", "Option B: Principle", "Option C: Application", "Option D: Evaluation"],
        correct_index: 0,
        explanation: `Under ${topicName}, understanding foundations is the initial competency required in ALS.`
      }
    ];
  }

  // 3. Insert generated questions into questions & question_choices with status = 'Pending'
  const createdQuestionIds = [];
  for (const item of generatedItems) {
    const { data: newQ, error: qErr } = await client
      .from("questions")
      .insert({
        topic_id: targetTopicId,
        question_text: item.question_text,
        explanation: item.explanation || "",
        difficulty: difficulty,
        source_type: "AI",
        status: "Pending", // Mandated: Must enter review queue, never published directly
        created_by: user.id
      })
      .select("question_id")
      .single();

    if (qErr || !newQ) continue;

    const labels = ["A", "B", "C", "D"];
    const choiceInserts = (item.choices || []).slice(0, 4).map((cText, idx) => ({
      question_id: newQ.question_id,
      choice_label: labels[idx],
      choice_text: String(cText),
      is_correct: idx === (item.correct_index || 0),
      display_order: idx + 1
    }));

    if (choiceInserts.length === 4) {
      await client.from("question_choices").insert(choiceInserts);
      createdQuestionIds.push(newQ.question_id);
    }
  }

  return json(res, 201, {
    success: true,
    message: `Generated ${createdQuestionIds.length} draft question(s) in Pending review status.`,
    created_count: createdQuestionIds.length,
    question_ids: createdQuestionIds
  });
}

