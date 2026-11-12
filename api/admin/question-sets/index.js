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
  const { user, profile, client, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return json(res, 401, { error: authError || "Authentication required" });
  }

  if (profile?.role !== "Teacher" && profile?.role !== "Admin") {
    return json(res, 403, { error: "Forbidden: Teacher or Admin role required" });
  }

  if (req.method === "POST") {
    try {
      const body = await parseBody(req);
      const { title, description, strand_id, question_ids = [] } = body;

      if (!title || !strand_id) {
        return json(res, 400, { error: "title and strand_id are required" });
      }

      // Create question set
      const { data: newSet, error: setErr } = await client
        .from("question_sets")
        .insert({
          title,
          description: description || "",
          strand_id,
          version: 1,
          status: "Draft",
          created_by: user.id
        })
        .select("question_set_id")
        .single();

      if (setErr) return json(res, 500, { error: setErr.message });

      // Link question items if provided
      if (Array.isArray(question_ids) && question_ids.length > 0) {
        const items = question_ids.map((qId, index) => ({
          question_set_id: newSet.question_set_id,
          question_id: qId,
          display_order: index + 1
        }));
        await client.from("question_set_items").insert(items);
      }

      return json(res, 201, {
        success: true,
        question_set_id: newSet.question_set_id,
        status: "Draft"
      });
    } catch (err) {
      return json(res, 500, { error: err.message });
    }
  }

  return json(res, 405, { error: "Method not allowed" });
}

