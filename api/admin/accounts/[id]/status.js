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
  if (!id) return json(res, 400, { error: "Missing account profile id" });

  const { user, profile, client, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return json(res, 401, { error: authError || "Authentication required" });
  }

  if (profile?.role !== "Admin") {
    return json(res, 403, { error: "Forbidden: Administrator role required" });
  }

  try {
    const body = await parseBody(req);
    const { status, role } = body;

    const updates = {};
    if (status && ["Active", "Suspended"].includes(status)) {
      updates.account_status = status;
    }
    if (role && ["Learner", "Teacher", "Admin"].includes(role)) {
      updates.role = role;
    }

    if (!Object.keys(updates).length) {
      return json(res, 400, { error: "No valid status or role updates provided" });
    }

    const { data, error } = await client
      .from("profiles")
      .update(updates)
      .eq("profile_id", id)
      .select()
      .single();

    if (error) return json(res, 500, { error: error.message });

    return json(res, 200, {
      success: true,
      account: data
    });
  } catch (err) {
    return json(res, 500, { error: err.message });
  }
}

