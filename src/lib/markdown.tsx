import { useMemo } from "react";
import { cn } from "./utils";

const AMP = "&" + "amp;";
const LT = "&" + "lt;";
const GT = "&" + "gt;";
const QUOT = "&" + "quot;";

function escapeHtml(s: string) {
  return s
    .replace(/&/g, AMP)
    .replace(/</g, LT)
    .replace(/>/g, GT)
    .replace(/"/g, QUOT);
}

function inline(md: string) {
  let s = escapeHtml(md);
  s = s.replace(/`([^`]+)`/g, '<code class="md-code">$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  s = s.replace(/(^|[^\w])\*([^*]+)\*/g, "$1<em>$2</em>");
  s = s.replace(
    /\[([^\]]+)]\((https?:[^)]+)\)/g,
    '<a href="$2" target="_blank" rel="noreferrer" class="md-link">$1</a>',
  );
  return s;
}

export function Markdown({ text, className }: { text: string; className?: string }) {
  const html = useMemo(() => {
    const lines = text.replace(/\r\n/g, "\n").split("\n");
    const out: string[] = [];
    let i = 0;
    let inList: "ul" | "ol" | null = null;

    const closeList = () => {
      if (inList) {
        out.push(inList === "ul" ? "</ul>" : "</ol>");
        inList = null;
      }
    };

    while (i < lines.length) {
      const line = lines[i] ?? "";
      if (line.startsWith("```")) {
        closeList();
        const lang = escapeHtml(line.slice(3).trim());
        const buf: string[] = [];
        i += 1;
        while (i < lines.length && !lines[i]?.startsWith("```")) {
          buf.push(lines[i] ?? "");
          i += 1;
        }
        out.push(
          `<pre class="md-pre"><div class="md-pre-bar">${lang || "code"}</div><code>${escapeHtml(buf.join("\n"))}</code></pre>`,
        );
        i += 1;
        continue;
      }
      if (/^#{1,3} /.test(line)) {
        closeList();
        const level = line.match(/^#+/)?.[0].length ?? 1;
        out.push(`<h${level} class="md-h${level}">${inline(line.replace(/^#{1,3} /, ""))}</h${level}>`);
        i += 1;
        continue;
      }
      if (/^[-*] /.test(line)) {
        if (inList !== "ul") {
          closeList();
          out.push('<ul class="md-ul">');
          inList = "ul";
        }
        out.push(`<li>${inline(line.replace(/^[-*] /, ""))}</li>`);
        i += 1;
        continue;
      }
      if (/^\d+\. /.test(line)) {
        if (inList !== "ol") {
          closeList();
          out.push('<ol class="md-ol">');
          inList = "ol";
        }
        out.push(`<li>${inline(line.replace(/^\d+\. /, ""))}</li>`);
        i += 1;
        continue;
      }
      if (/^> /.test(line)) {
        closeList();
        out.push(`<blockquote class="md-quote">${inline(line.slice(2))}</blockquote>`);
        i += 1;
        continue;
      }
      if (/^---+$/.test(line.trim())) {
        closeList();
        out.push("<hr class=\"md-hr\" />");
        i += 1;
        continue;
      }
      if (!line.trim()) {
        closeList();
        i += 1;
        continue;
      }
      closeList();
      out.push(`<p class="md-p">${inline(line)}</p>`);
      i += 1;
    }
    closeList();
    return out.join("");
  }, [text]);

  return (
    <div
      className={cn("md-body text-[15px] leading-relaxed text-foreground", className)}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
