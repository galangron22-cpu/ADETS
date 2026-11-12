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
  if (req.method !== "PATCH") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const { id } = req.query;
  if (!id) return json(res, 400, { error: "Missing question id" });

  const { user, profile, client, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return json(res, 401, { error: authError || "Authentication required" });
  }

  // Strictly Admin for Approve / Reject (Per user specification A2)
  if (profile?.role !== "Admin") {
    return json(res, 403, { error: "Forbidden: Only Administrators can review, approve, or reject questions" });
  }

  try {
    const body = await parseBody(req);
    const { status, rejection_reason } = body;

    if (!["Approved", "Rejected", "Draft", "Archived"].includes(status)) {
      return json(res, 400, { error: "Invalid status value" });
    }

    // TC-ADM-04: Reject without reason is blocked
    if (status === "Rejected" && (!rejection_reason || !rejection_reason.trim())) {
      return json(res, 400, { error: "Rejection reason is required" });
    }

    const updates = {
      status,
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (status === "Rejected") {
      updates.rejection_reason = rejection_reason.trim();
    } else {
      updates.rejection_reason = null;
    }

    const { data, error } = await client
      .from("questions")
      .update(updates)
      .eq("question_id", id)
      .select()
      .single();

    if (error) return json(res, 500, { error: error.message });

    return json(res, 200, {
      success: true,
      question: data
    });
  } catch (err) {
    return json(res, 500, { error: err.message });
  }
}

