/**
 * Sanitizes and converts AI-generated Markdown text into safe HTML fragments for the Study Assistant chat UI.
 */
// Helper to parse and render formatted markdown in chat and reviewer notes
export function formatMarkdown(raw) {
  if (!raw || typeof raw !== "string") return "";

  // 1. Basic HTML sanitization to prevent XSS
  let text = raw
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // Re-enable safe formatting tags if present
  text = text.replace(/&lt;u&gt;(.*?)&lt;\/u&gt;/gi, "<u>$1</u>");
  text = text.replace(/&lt;b&gt;(.*?)&lt;\/b&gt;/gi, "<strong>$1</strong>");
  text = text.replace(/&lt;i&gt;(.*?)&lt;\/i&gt;/gi, "<em>$1</em>");

  // 2. Headings (### Title, ## Title, # Title)
  text = text.replace(/^### (.*$)/gim, '<div style="font-weight:700;font-size:15px;margin:8px 0 4px 0;color:var(--pr);">$1</div>');
  text = text.replace(/^## (.*$)/gim, '<div style="font-weight:700;font-size:16px;margin:10px 0 4px 0;color:var(--pr);">$1</div>');
  text = text.replace(/^# (.*$)/gim, '<div style="font-weight:800;font-size:17px;margin:12px 0 6px 0;color:var(--pr);">$1</div>');

  // 3. Bold: **text**
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // 4. Underline: __text__
  text = text.replace(/__(.+?)__/g, "<u>$1</u>");

  // 5. Italic: *text* or _text_ (when not a bullet point)
  text = text.replace(/(^|[^\*])\*([^\*\n]+?)\*([^\*]|$)/g, "$1<em>$2</em>$3");
  text = text.replace(/(^|[^_])_([^_\n]+?)_([^_]|$)/g, "$1<em>$2</em>$3");

  // 6. Inline code / highlights: `code`
  text = text.replace(/`([^`\n]+?)`/g, '<code style="background:rgba(0,0,0,0.1);padding:2px 5px;border-radius:4px;font-family:monospace;font-size:12px;">$1</code>');

  // 7. Parse lists (unordered and ordered) and paragraphs
  const lines = text.split("\n");
  let inUl = false;
  let inOl = false;
  const out = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Check for unordered bullet (* or -)
    const bulletMatch = trimmed.match(/^[\*\-•]\s+(.*)$/);
    if (bulletMatch) {
      if (!inUl) {
        if (inOl) { out.push("</ol>"); inOl = false; }
        out.push('<ul class="chat-list" style="margin:6px 0;padding-left:22px;display:flex;flex-direction:column;gap:4px;">');
        inUl = true;
      }
      out.push(`<li>${bulletMatch[1]}</li>`);
      continue;
    }

    // Check for ordered list (1. 2.)
    const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      if (!inOl) {
        if (inUl) { out.push("</ul>"); inUl = false; }
        out.push('<ol class="chat-list" style="margin:6px 0;padding-left:22px;display:flex;flex-direction:column;gap:4px;">');
        inOl = true;
      }
      out.push(`<li>${numMatch[2]}</li>`);
      continue;
    }

    // Close any open lists when hitting a non-list item
    if (trimmed === "") {
      // Check if subsequent non-empty line continues the same list
      let continuesList = false;
      for (let j = i + 1; j < lines.length; j++) {
        const nextTrim = lines[j].trim();
        if (!nextTrim) continue;
        if (inUl && nextTrim.match(/^[\*\-•]\s+/)) continuesList = true;
        if (inOl && nextTrim.match(/^\d+\.\s+/)) continuesList = true;
        break;
      }
      if (continuesList) continue;

      if (inUl) { out.push("</ul>"); inUl = false; }
      if (inOl) { out.push("</ol>"); inOl = false; }
      out.push('<div style="height:6px;"></div>');
      continue;
    }

    if (inUl) { out.push("</ul>"); inUl = false; }
    if (inOl) { out.push("</ol>"); inOl = false; }
    out.push(`<div style="margin:3px 0;line-height:1.55;">${trimmed}</div>`);
  }

  if (inUl) out.push("</ul>");
  if (inOl) out.push("</ol>");

  return out.join("");
}
