/**
 * Rich text in a CV is a tiny subset of HTML: <b>, <i>, <u> and <br>.
 * Anything pasted or typed is cleaned down to that before it is stored.
 */

const ALLOWED: Record<string, string> = { B: "b", STRONG: "b", I: "i", EM: "i", U: "u", BR: "br" };

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** clean HTML from a contenteditable down to b, i, u and br */
export function sanitize(html: string): string {
  if (typeof document === "undefined") return html;
  const box = document.createElement("template");
  box.innerHTML = html;
  const walk = (n: Node): string => {
    if (n.nodeType === Node.TEXT_NODE) return escapeHtml(n.textContent ?? "");
    if (n.nodeType !== Node.ELEMENT_NODE) return "";
    const el = n as HTMLElement;
    if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "TEMPLATE", "NOSCRIPT"].includes(el.tagName)) return "";
    const inner = Array.from(el.childNodes).map(walk).join("");
    const tag = ALLOWED[el.tagName];
    if (tag === "br") return "<br>";
    if (tag) return inner ? `<${tag}>${inner}</${tag}>` : "";
    /* a styled span from execCommand */
    const fw = el.style?.fontWeight;
    if (fw === "bold" || Number(fw) >= 600) return `<b>${inner}</b>`;
    if (el.style?.fontStyle === "italic") return `<i>${inner}</i>`;
    if (el.tagName === "DIV" || el.tagName === "P") return (inner ? "<br>" + inner : "");
    return inner;
  };
  return Array.from(box.content.childNodes).map(walk).join("")
    .replace(/^(<br>)+/, "")
    .replace(/(<br>)+$/, "")
    .replace(/&nbsp;| /g, " ");
}

/** plain text, for checks, file names and word counts */
export function toText(html: string): string {
  return html.replace(/<br\s*\/?>/gi, " ").replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&nbsp;/g, " ");
}

/** the first version stored **bold** in plain text */
export function fromMarkdown(s: string): string {
  return escapeHtml(s).replace(/\*\*([^*]+)\*\*/g, "<b>$1</b>");
}
