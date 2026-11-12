import { getUserFromRequest, json } from "../../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const { user, profile, client, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return json(res, 401, { error: authError || "Authentication required" });
  }

  if (profile?.role !== "Admin") {
    return json(res, 403, { error: "Forbidden: Administrator role required" });
  }

  try {
    let query = client
      .from("profiles")
      .select("profile_id, display_name, role, account_status, created_at")
      .order("created_at", { ascending: false });

    if (req.query.role) {
      query = query.eq("role", req.query.role);
    }

    const { data, error } = await query;
    if (error) return json(res, 500, { error: error.message });

    let accounts = data || [];
    if (req.query.q) {
      const q = req.query.q.toLowerCase();
      accounts = accounts.filter(a => (a.display_name || "").toLowerCase().includes(q));
    }

    return json(res, 200, { accounts });
  } catch (err) {
    return json(res, 500, { error: err.message });
  }
}

