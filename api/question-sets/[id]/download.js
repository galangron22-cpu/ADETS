import { getSupabase, json } from "../../_lib/supabase.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return json(res, 405, { error: "Method not allowed" });
  }

  const { id } = req.query;
  if (!id) {
    return json(res, 400, { error: "Missing question set id" });
  }

  try {
    const supabase = getSupabase();

    // 1. Fetch question set
    const { data: qSet, error: setError } = await supabase
      .from("question_sets")
      .select(`
        question_set_id,
        title,
        description,
        strand_id,
        version,
        status,
        published_at,
        learning_strands (code, name)
      `)
      .eq("question_set_id", id)
      .eq("status", "Published")
      .single();

    if (setError || !qSet) {
      return json(res, 404, { error: "Published question set not found" });
    }

    // 2. Fetch linked question items in display_order
    const { data: items, error: itemsError } = await supabase
      .from("question_set_items")
      .select("question_id, display_order")
      .eq("question_set_id", id)
      .order("display_order", { ascending: true });

    if (itemsError) {
      return json(res, 500, { error: itemsError.message });
    }

    const questionIds = items.map(i => i.question_id);
    if (!questionIds.length) {
      return json(res, 200, {
        set: qSet,
        questions: []
      });
    }

    // 3. Fetch questions and their choices
    const { data: questions, error: qError } = await supabase
      .from("questions")
      .select(`
        question_id,
        topic_id,
        question_text,
        explanation,
        difficulty,
        question_choices (
          choice_id,
          choice_label,
          choice_text,
          is_correct,
          display_order
        )
      `)
      .in("question_id", questionIds)
      .eq("status", "Approved");

    if (qError) {
      return json(res, 500, { error: qError.message });
    }

    // Sort questions matching question_set_items display_order
    const orderMap = new Map(items.map(i => [i.question_id, i.display_order]));
    const formattedQuestions = questions
      .sort((a, b) => (orderMap.get(a.question_id) || 0) - (orderMap.get(b.question_id) || 0))
      .map(q => {
        const sortedChoices = (q.question_choices || []).sort(
          (a, b) => (a.display_order || 0) - (b.display_order || 0)
        );
        const correctChoiceIndex = sortedChoices.findIndex(c => c.is_correct);

        return {
          id: q.question_id,
          text: q.question_text,
          explanation: q.explanation,
          difficulty: q.difficulty,
          choices: sortedChoices.map(c => c.choice_text),
          choice_ids: sortedChoices.map(c => c.choice_id),
          ans: correctChoiceIndex >= 0 ? correctChoiceIndex : 0,
          raw_choices: sortedChoices
        };
      });

    return json(res, 200, {
      bundle: {
        id: qSet.question_set_id,
        title: qSet.title,
        description: qSet.description,
        strand_id: qSet.strand_id,
        strand_code: qSet.learning_strands?.code,
        strand_name: qSet.learning_strands?.name,
        ver: qSet.version,
        downloaded_at: new Date().toISOString(),
        questions: formattedQuestions
      }
    });
  } catch (err) {
    return json(res, 500, { error: err.message });
  }
}

