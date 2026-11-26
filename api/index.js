/**
 * Unified Vercel Serverless Function entry router consolidating all `/api/*` endpoints
 * into a single deployed function (avoiding the Vercel Hobby plan's 12-function limit)
 * while preserving modular handlers under `api/_routes/`.
 */
import { json } from "./_lib/supabase.js";
import healthHandler from "./_routes/health.js";
import progressHandler from "./_routes/progress.js";
import strandsHandler from "./_routes/strands/index.js";
import strandTopicsHandler from "./_routes/strands/topics.js";
import questionSetsHandler from "./_routes/question-sets/index.js";
import questionSetDownloadHandler from "./_routes/question-sets/download.js";
import quizAttemptsHandler from "./_routes/quiz-attempts/index.js";
import quizAttemptsSyncHandler from "./_routes/quiz-attempts/sync.js";
import aiChatHandler from "./_routes/ai/chat.js";
import aiGenerateQuestionsHandler from "./_routes/ai/generate-questions.js";
import adminAccountsHandler from "./_routes/admin/accounts/index.js";
import adminAccountStatusHandler from "./_routes/admin/accounts/status.js";
import adminQuestionSetsHandler from "./_routes/admin/question-sets/index.js";
import adminQuestionSetPublishHandler from "./_routes/admin/question-sets/publish.js";
import adminQuestionsHandler from "./_routes/admin/questions/index.js";
import adminQuestionReviewHandler from "./_routes/admin/questions/review.js";
import adminReportsHandler from "./_routes/admin/reports/index.js";

const STATIC_ROUTES = {
  "health": healthHandler,
  "progress": progressHandler,
  "strands": strandsHandler,
  "question-sets": questionSetsHandler,
  "quiz-attempts": quizAttemptsHandler,
  "quiz-attempts/sync": quizAttemptsSyncHandler,
  "ai/chat": aiChatHandler,
  "ai/generate-questions": aiGenerateQuestionsHandler,
  "admin/accounts": adminAccountsHandler,
  "admin/question-sets": adminQuestionSetsHandler,
  "admin/questions": adminQuestionsHandler,
  "admin/reports": adminReportsHandler
};

/** Resolves the API route sub-path and dynamic `:id` query parameters across both Vercel rewrites and local Vite dev. */
function resolveRoute(req) {
  const urlObj = new URL(req.url || "/", `http://${req.headers?.host || "localhost"}`);
  const queryParams = Object.fromEntries(urlObj.searchParams.entries());

  const rawRoute = req.query?.__route ?? queryParams.__route;
  delete queryParams.__route;

  let routePath = Array.isArray(rawRoute) ? rawRoute.join("/") : (rawRoute || "");
  if (!routePath) {
    routePath = urlObj.pathname.replace(/^\/api\/?/, "");
  }
  routePath = decodeURIComponent(String(routePath)).replace(/^\/+|\/+$/g, "");

  req.query = { ...(req.query || {}), ...queryParams };
  delete req.query.__route;

  if (STATIC_ROUTES[routePath]) {
    return STATIC_ROUTES[routePath];
  }

  const parts = routePath.split("/");
  if (parts.length === 3 && parts[0] === "strands" && parts[2] === "topics") {
    req.query.id = parts[1];
    return strandTopicsHandler;
  }
  if (parts.length === 3 && parts[0] === "question-sets" && parts[2] === "download") {
    req.query.id = parts[1];
    return questionSetDownloadHandler;
  }
  if (parts.length === 3 && parts[0] === "admin" && parts[1] === "questions") {
    req.query.id = parts[2];
    return adminQuestionReviewHandler;
  }
  if (parts.length === 4 && parts[0] === "admin" && parts[1] === "question-sets" && parts[3] === "publish") {
    req.query.id = parts[2];
    return adminQuestionSetPublishHandler;
  }
  if (parts.length === 4 && parts[0] === "admin" && parts[1] === "accounts" && parts[3] === "status") {
    req.query.id = parts[2];
    return adminAccountStatusHandler;
  }

  return null;
}

/** Main Vercel Serverless Function handler dispatching incoming `/api/*` requests to modular route handlers. */
export default async function handler(req, res) {
  try {
    const targetHandler = resolveRoute(req);
    if (!targetHandler) {
      return json(res, 404, { error: `API route not found: ${req.url}` });
    }
    return await targetHandler(req, res);
  } catch (err) {
    console.error("API Router Error:", err);
    if (!res.headersSent) {
      return json(res, 500, { error: err.message || "Internal server error" });
    }
  }
}
