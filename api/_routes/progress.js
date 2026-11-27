/**
 * GET /api/progress
 * Computes authenticated learner mastery averages per ALS learning strand and overall progress.
 */
import { getUserFromRequest, json } from "../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const { user, profile, client, error: authError } = await getUserFromRequest(req);
  if (authError || !user) {
    return json(res, 401, { error: authError || "Authentication required" });
  }

  try {
    // 1 & 2. Fetch strands and user attempts in parallel
    const [{ data: strands, error: sErr }, { data: attempts, error: aErr }] = await Promise.all([
      client
        .from("learning_strands")
        .select("strand_id, code, name, display_order")
        .eq("is_active", true)
        .order("display_order", { ascending: true }),
      client
        .from("quiz_attempts")
        .select(`
          score,
          total_questions,
          question_sets (strand_id)
        `)
        .eq("learner_id", user.id)
    ]);

    if (sErr) return json(res, 500, { error: sErr.message });
    if (aErr) return json(res, 500, { error: aErr.message });

    // 3. Compute score per strand
    const strandStats = (strands || []).map(strand => {
      const strandAttempts = (attempts || []).filter(
        a => a.question_sets?.strand_id === strand.strand_id
      );

      const count = strandAttempts.length;
      let avg = 0;
      if (count > 0) {
        const sum = strandAttempts.reduce((acc, curr) => {
          return acc + (curr.total_questions ? (curr.score / curr.total_questions) * 100 : 0);
        }, 0);
        avg = Math.round(sum / count);
      }

      return {
        strand_id: strand.strand_id,
        code: strand.code,
        name: strand.name,
        average_score: avg,
        attempts_count: count
      };
    });

    const totalAttempts = attempts?.length || 0;
    const overallAvg = strandStats.length
      ? Math.round(strandStats.reduce((acc, s) => acc + s.average_score, 0) / strandStats.length)
      : 0;

    return json(res, 200, {
      overall_progress: overallAvg,
      total_attempts: totalAttempts,
      strands: strandStats
    });
  } catch (err) {
    return json(res, 500, { error: err.message });
  }
}

