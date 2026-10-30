"use client";

import React, { useState, useRef, useEffect } from "react";
import { Highlight, themes } from "prism-react-renderer";
import MCQWidget from "./MCQWidget";
import katex from "katex";

interface MarkdownRendererProps {
  content: string;
  onSendMessage?: (text: string) => void;
}

/* ─────────────────────────── Helpers ─────────────────────────── */

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function extractFence(text: string): { lang: string; code: string } | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith("```") || !trimmed.endsWith("```") || trimmed.length <= 6) return null;
  const inner = trimmed.slice(3, -3);
  const actualNL = inner.indexOf("\n");
  const literalNL = inner.indexOf("\\n");
  let firstBreak = -1;
  let breakLen = 0;
  if (actualNL >= 0 && (literalNL < 0 || actualNL < literalNL)) {
    firstBreak = actualNL;
    breakLen = 1;
  } else if (literalNL >= 0) {
    firstBreak = literalNL;
    breakLen = 2;
  }
  const lang = firstBreak >= 0 ? inner.slice(0, firstBreak).trim() : "";
  const rawCode = firstBreak >= 0 ? inner.slice(firstBreak + breakLen) : inner;
  return { lang, code: rawCode.replace(/\\n/g, "\n").trim() };
}

function normalizeLanguage(lang: string): string {
  const l = lang.toLowerCase().trim();
  if (l === "js" || l === "jsx") return "jsx";
  if (l === "ts" || l === "tsx") return "tsx";
  if (l === "sh" || l === "shell") return "bash";
  if (l === "py") return "python";
  return l || "text";
}

/* ─────────────────────────── Dynamic Theme ─────────────────────────── */

function useCodeTheme() {
  const [isDark, setIsDark] = useState(true);
  useEffect(() => {
    setIsDark(document.documentElement.getAttribute("data-mode") === "dark");
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute("data-mode") === "dark");
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["data-mode"] });
    return () => observer.disconnect();
  }, []);
  return isDark ? themes.oneDark : themes.oneLight;
}

/* ─────────────────────────── Math Renderer ─────────────────────────── */

function MathSpan({ math, displayMode = false }: { math: string; displayMode?: boolean }) {
  const html = React.useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode,
        throwOnError: false,
        output: "html",
      });
    } catch (e) {
      return math;
    }
  }, [math, displayMode]);

  return (
    <span
      className={displayMode ? "block my-2 overflow-x-auto overflow-y-hidden py-1" : "inline-block mx-0.5"}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

/* ─────────────────────────── Inline Formatting ─────────────────────────── */

function renderInlineSingle(text: string, keyPrefix = ""): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  
  // Added Math blocks \( ... \) and $ ... $ to the regex
  const regex =
    /(\\\([\s\S]*?\\\)|\$[^\$]+\$|`[^`]+`|\*\*[^*]+\*\*|~~[^~]+~~|\*[^*]+\*|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s<>)]+)/g;
  
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) tokens.push(text.substring(lastIndex, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${match.index}`;

    if (token.startsWith("\\(") && token.endsWith("\\)")) {
      tokens.push(<MathSpan key={`math-${key}`} math={token.slice(2, -2)} />);
    } else if (token.startsWith("$") && token.endsWith("$")) {
      tokens.push(<MathSpan key={`math-${key}`} math={token.slice(1, -1)} />);
    } else if (token.startsWith("`") && token.endsWith("`")) {
      tokens.push(
        <code
          key={`code-${key}`}
          className="rounded px-1.5 py-0.5 text-[0.85em] font-mono font-medium border break-all"
          style={{
            backgroundColor: "var(--app-surface-subtle)",
            borderColor: "var(--app-border)",
            color: "var(--theme-primary)",
          }}
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**") && token.endsWith("**")) {
      tokens.push(
        <strong key={`bold-${key}`} className="font-semibold" style={{ color: "var(--app-text)" }}>
          {renderInlineSingle(token.slice(2, -2), key)}
        </strong>
      );
    } else if (token.startsWith("~~") && token.endsWith("~~")) {
      tokens.push(
        <del key={`del-${key}`} style={{ color: "var(--app-text-muted)" }}>
          {renderInlineSingle(token.slice(2, -2), key)}
        </del>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      tokens.push(
        <em key={`italic-${key}`} className="italic" style={{ color: "var(--app-text-muted)" }}>
          {renderInlineSingle(token.slice(1, -1), key)}
        </em>
      );
    } else if (token.startsWith("[")) {
      const lm = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (lm) {
        tokens.push(
          <a
            key={`link-${key}`}
            href={lm[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 transition hover:opacity-80"
            style={{ color: "var(--theme-primary)" }}
          >
            {lm[1]}
          </a>
        );
      }
    } else if (token.startsWith("http")) {
      tokens.push(
        <a
          key={`autolink-${key}`}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 break-all transition hover:opacity-80"
          style={{ color: "var(--theme-primary)" }}
        >
          {token}
        </a>
      );
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) tokens.push(text.substring(lastIndex));
  return tokens.length > 0 ? tokens : [text];
}

function renderInlineFormatting(text: string, keyPrefix = ""): React.ReactNode[] {
  const parts = text.split(/<br\s*\/?>/gi);
  if (parts.length > 1) {
    return parts.flatMap((part, i) => [
      ...renderInlineSingle(part, `${keyPrefix}-br${i}-`),
      ...(i < parts.length - 1 ? [<br key={`${keyPrefix}-brk${i}`} />] : []),
    ]);
  }
  return renderInlineSingle(text, keyPrefix);
}

/* ─────────────────────────── Code Block ─────────────────────────── */

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);
  const codeTheme = useCodeTheme();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const extMap: Record<string, string> = {
      jsx: "jsx", tsx: "tsx", javascript: "js", typescript: "ts",
      python: "py", bash: "sh", html: "html", css: "css", json: "json"
    };
    const ext = extMap[normalizeLanguage(language)] || "txt";
    a.download = `snippet.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="my-3 overflow-hidden rounded-xl border text-xs shadow-xs" style={{ borderColor: "var(--app-border)" }}>
      <div className="flex items-center justify-between border-b px-4 py-2" style={{ backgroundColor: "var(--app-code-header-bg)", borderColor: "var(--app-border)" }}>
        <span className="font-mono text-[11px] font-semibold tracking-wide" style={{ color: "var(--app-text-muted)" }}>
          {language || "text"}
        </span>
        <div className="flex items-center gap-4">
          <button type="button" onClick={handleCopy} className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium transition hover:opacity-70" style={{ color: "var(--app-text-muted)" }}>
            {copied ? <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg> : <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>}
            {copied ? "Copied!" : "Copy"}
          </button>
          <button type="button" onClick={handleDownload} className="flex items-center gap-1.5 cursor-pointer text-[11px] font-medium transition hover:opacity-70" style={{ color: "var(--app-text-muted)" }}>
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
            Download
          </button>
        </div>
      </div>
      <Highlight theme={codeTheme} code={code.trim()} language={normalizeLanguage(language)}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={`${className} overflow-x-auto p-4 font-mono leading-relaxed`} style={{ ...style, margin: 0 }}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (<span key={key} {...getTokenProps({ token })} />))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  );
}

/* ─────────────────────────── Table Cell ─────────────────────────── */

function renderTableCell(cell: string): React.ReactNode {
  let text = decodeEntities(cell).trim();
  const fence = extractFence(text);
  if (fence) return <CodeBlock code={fence.code} language={fence.lang} />;

  text = text.replace(/\\n/g, "<br>");

  if (text.includes("<br>") && /^\s*[•\-*]\s/.test(text)) {
    const parts = text.split(/<br\s*\/?>/gi);
    if (parts.every((p) => /^\s*[•\-*]\s/.test(p.trim()))) {
      return (
        <ul className="my-0.5 space-y-1 list-none">
          {parts.map((p, i) => (
            <li key={i} className="flex items-start gap-1.5">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "var(--theme-primary)" }} />
              <span>{renderInlineFormatting(p.replace(/^\s*[•\-*]\s/, ""))}</span>
            </li>
          ))}
        </ul>
      );
    }
  }
  return <>{renderInlineFormatting(text)}</>;
}

/* ─────────────────────────── Table Parsing & Rendering ─────────────────────────── */

function parseTableRow(row: string): string[] {
  const cells: string[] = [];
  let current = "";
  let i = 0;
  let trimmed = row.trim();
  if (trimmed.startsWith("|")) trimmed = trimmed.slice(1);
  if (trimmed.endsWith("|")) trimmed = trimmed.slice(0, -1);
  while (i < trimmed.length) {
    if (trimmed[i] === "\\" && trimmed[i + 1] === "|") { current += "|"; i += 2; }
    else if (trimmed[i] === "|") { cells.push(current.trim()); current = ""; i++; }
    else { current += trimmed[i]; i++; }
  }
  if (current || cells.length > 0) cells.push(current.trim());
  return cells;
}

function isTableRow(line: string): boolean {
  return /^\s*\|.*\|\s*$/.test(line);
}

function isTableSeparator(line: string): boolean {
  return /^\s*\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)+\|?\s*$/.test(line);
}

function parseAlignment(sep: string): ("left" | "center" | "right")[] {
  return parseTableRow(sep).map((cell) => {
    const left = cell.startsWith(":");
    const right = cell.endsWith(":");
    if (left && right) return "center";
    if (right) return "right";
    return "left";
  });
}

function MarkdownTable({ header, aligns, rows }: { header: string[]; aligns: ("left" | "center" | "right")[]; rows: string[][] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => setHasOverflow(el.scrollWidth > el.clientWidth + 2);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, [header, rows]);

  const alignClass = (a: "left" | "center" | "right") =>
    a === "center" ? "text-center" : a === "right" ? "text-right" : "text-left";

  return (
    <div className="relative my-3">
      <div ref={scrollRef} className="overflow-x-auto rounded-xl border shadow-xs" style={{ backgroundColor: "var(--app-surface)", borderColor: "var(--app-border)" }}>
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="border-b" style={{ backgroundColor: "var(--app-surface-subtle)", borderColor: "var(--app-border)", color: "var(--app-text)" }}>
              {header.map((cell, idx) => (
                <th key={idx} className={`px-3.5 py-2.5 font-semibold align-top ${alignClass(aligns[idx] || "left")}`}>
                  {renderTableCell(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "var(--app-border)", color: "var(--app-text-muted)" }}>
            {rows.map((row, rIdx) => (
              <tr key={rIdx} className="transition-colors" style={{ backgroundColor: rIdx % 2 === 1 ? "var(--app-surface-subtle)" : "transparent" }}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className={`px-3.5 py-2 leading-relaxed align-top ${alignClass(aligns[cIdx] || "left")}`}>
                    {renderTableCell(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {hasOverflow && <div className="pointer-events-none absolute inset-y-0 right-0 w-6 rounded-r-xl" style={{ background: "linear-gradient(to right, transparent, var(--app-surface))" }} />}
    </div>
  );
}

/* ─────────────────────────── Lists ─────────────────────────── */

interface ListItem {
  type: "ul" | "ol"; indent: number; content: string; number?: number; task?: boolean; checked?: boolean; children: ListItem[];
}

function parseListMarker(line: string): Omit<ListItem, "children"> | null {
  const bullet = line.match(/^(\s*)[-*+]\s+(.*)$/);
  if (bullet) return { type: "ul", indent: bullet[1].length, content: bullet[2] };
  const num = line.match(/^(\s*)(\d+)[.)]\s+(.*)$/);
  if (num) return { type: "ol", indent: num[1].length, content: num[3], number: parseInt(num[2], 10) };
  return null;
}

function buildListTree(items: Omit<ListItem, "children">[]): ListItem[] {
  const roots: ListItem[] = [];
  const stack: ListItem[] = [];
  for (const item of items) {
    const node: ListItem = { ...item, children: [] };
    while (stack.length > 0 && stack[stack.length - 1].indent >= node.indent) stack.pop();
    if (stack.length === 0) roots.push(node);
    else stack[stack.length - 1].children.push(node);
    stack.push(node);
  }
  return roots;
}

function renderList(items: ListItem[], depth = 0): React.ReactNode {
  if (items.length === 0) return null;
  const isOrdered = items[0].type === "ol";
  const Tag = isOrdered ? "ol" : "ul";

  return (
    <Tag className={depth === 0 ? "my-2 space-y-1.5 list-none pl-0" : "mt-1 space-y-1 list-none pl-0"}>
      {items.map((item, idx) => (
        <li key={idx} className="flex items-start gap-2 leading-relaxed" style={{ color: "var(--app-text-muted)" }}>
          {item.task ? (
            <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]" style={{ borderColor: "var(--app-border)", backgroundColor: item.checked ? "var(--theme-primary)" : "transparent", color: item.checked ? "var(--theme-contrast-text)" : "transparent" }}>
              {item.checked ? "✓" : ""}
            </span>
          ) : isOrdered ? (
            <span className="shrink-0 font-semibold text-xs mt-0.5 min-w-[1.5rem]" style={{ color: "var(--theme-primary)" }}>{item.number ?? idx + 1}.</span>
          ) : (
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "var(--theme-primary)", opacity: depth === 0 ? 1 : 0.6 }} />
          )}
          <div className="min-w-0 flex-1">
            <span className={item.task && item.checked ? "line-through opacity-70" : ""}>{renderInlineFormatting(item.content)}</span>
            {item.children.length > 0 && renderList(item.children, depth + 1)}
          </div>
        </li>
      ))}
    </Tag>
  );
}

/* ─────────────────────────── Main Component ─────────────────────────── */

export default function MarkdownRenderer({ content, onSendMessage }: MarkdownRendererProps) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    /* Block Math \[ ... \] or $$ ... $$ */
    if (line.trim().startsWith("\\[") || line.trim().startsWith("$$")) {
      const isDollar = line.trim().startsWith("$$");
      const openLen = isDollar ? 2 : 2;
      const closeStr = isDollar ? "$$" : "\\]";
      
      let mathContent = line.trim().slice(openLen).trim();
      // Check if it's a single line block
      if (mathContent.endsWith(closeStr)) {
        elements.push(
          <MathSpan 
            key={`blockmath-${i}`} 
            math={mathContent.slice(0, -closeStr.length).trim()} 
            displayMode={true} 
          />
        );
        i++; 
        continue;
      }
      
      // Multi-line block
      i++;
      while (i < lines.length && !lines[i].trim().endsWith(closeStr)) {
        mathContent += "\n" + lines[i];
        i++;
      }
      if (i < lines.length) {
        mathContent += "\n" + lines[i].trim().slice(0, -closeStr.length);
        i++;
      }
      
      elements.push(<MathSpan key={`blockmath-${i}`} math={mathContent.trim()} displayMode={true} />);
      continue;
    }

    /* Code block */
    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++;
      elements.push(<CodeBlock key={`code-block-${elements.length}`} code={codeLines.join("\n")} language={language} />);
      continue;
    }

    /* MCQ Widget */
    if (line.includes("[[MCQ]]")) {
      const mcqIndex = line.indexOf("[[MCQ]]");
      const beforeText = line.slice(0, mcqIndex).trim();
      const jsonText = line.slice(mcqIndex + 7).trim();
      
      if (beforeText) {
        elements.push(
          <p key={`p-${i}`} className="my-1 leading-relaxed text-pretty" style={{ color: "var(--app-text)" }}>
            {renderInlineFormatting(beforeText)}
          </p>
        );
      }
      try {
        const jsonMatch = jsonText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const mcqData = JSON.parse(jsonMatch[0]);
          if (mcqData.question && Array.isArray(mcqData.options) && onSendMessage) {
            elements.push(<MCQWidget key={`mcq-${i}`} data={mcqData} onSendMessage={onSendMessage} />);
          }
        }
      } catch (e) {
        elements.push(<p key={`p-${i}`} className="my-1 leading-relaxed" style={{ color: "var(--app-text-muted)" }}>{renderInlineFormatting(line)}</p>);
      }
      i++;
      continue;
    }

    /* Table */
    if (isTableRow(line)) {
      const tableLines: string[] = [];
      while (i < lines.length && isTableRow(lines[i])) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 2 && isTableSeparator(tableLines[1])) {
        const header = parseTableRow(tableLines[0]);
        const aligns = parseAlignment(tableLines[1]);
        const rows = tableLines.slice(2).map(parseTableRow);
        elements.push(<MarkdownTable key={`table-${elements.length}`} header={header} aligns={aligns} rows={rows} />);
        continue;
      }
      for (const tl of tableLines) {
        elements.push(<p key={`p-${elements.length}`} className="my-1 leading-relaxed" style={{ color: "var(--app-text)" }}>{renderInlineFormatting(tl)}</p>);
      }
      continue;
    }

    /* Headings */
    if (line.startsWith("#### ")) {
      elements.push(<h4 key={`h4-${i}`} className="mt-4 mb-1.5 text-sm font-bold tracking-tight" style={{ color: "var(--app-text)" }}>{renderInlineFormatting(line.slice(5))}</h4>);
      i++; continue;
    }
    if (line.startsWith("### ")) {
      elements.push(<h3 key={`h3-${i}`} className="mt-4 mb-2 text-sm sm:text-base font-bold tracking-tight" style={{ color: "var(--app-text)" }}>{renderInlineFormatting(line.slice(4))}</h3>);
      i++; continue;
    }
    if (line.startsWith("## ")) {
      elements.push(<h2 key={`h2-${i}`} className="mt-5 mb-2 pb-1 text-base sm:text-lg font-bold tracking-tight border-b" style={{ color: "var(--app-text)", borderColor: "var(--app-border)" }}>{renderInlineFormatting(line.slice(3))}</h2>);
      i++; continue;
    }
    if (line.startsWith("# ")) {
      elements.push(<h1 key={`h1-${i}`} className="mt-2 mb-3 text-lg sm:text-xl font-extrabold tracking-tight border-l-4 pl-3" style={{ color: "var(--app-text)", borderColor: "var(--theme-primary)" }}>{renderInlineFormatting(line.slice(2))}</h1>);
      i++; continue;
    }

    /* Blockquote */
    if (line.trim().startsWith("> ")) {
      const quoteLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("> ")) {
        quoteLines.push(lines[i].trim().slice(2));
        i++;
      }
      elements.push(
        <blockquote key={`quote-${elements.length}`} className="my-2 border-l-4 pl-3 py-1 italic rounded-r-md" style={{ borderColor: "var(--theme-primary)", color: "var(--app-text-muted)", backgroundColor: "var(--app-surface-subtle)" }}>
          {renderInlineFormatting(quoteLines.join(" "))}
        </blockquote>
      );
      continue;
    }

    /* Horizontal rule */
    if (line.trim() === "---" || line.trim() === "***" || line.trim() === "___") {
      elements.push(<hr key={`hr-${i}`} className="my-4" style={{ borderColor: "var(--app-border)" }} />);
      i++; continue;
    }

    /* Lists */
    const first = parseListMarker(line);
    if (first) {
      const collected: Omit<ListItem, "children">[] = [];
      while (i < lines.length) {
        const marker = parseListMarker(lines[i]);
        if (marker) {
          const taskMatch = marker.content.match(/^\[([ xX])\]\s+(.*)$/);
          if (taskMatch) {
            collected.push({ ...marker, content: taskMatch[2], task: true, checked: taskMatch[1].toLowerCase() === "x" });
          } else {
            collected.push(marker);
          }
          i++;
        } else if (lines[i].trim() === "" && i + 1 < lines.length && parseListMarker(lines[i + 1])) {
          i++;
        } else break;
      }
      const tree = buildListTree(collected);
      elements.push(<React.Fragment key={`list-${elements.length}`}>{renderList(tree)}</React.Fragment>);
      continue;
    }

    /* Paragraph / blank */
    if (!line.trim()) {
      elements.push(<div key={`blank-${i}`} className="h-1.5" />);
    } else {
      elements.push(
        <p key={`p-${i}`} className="my-1 leading-relaxed text-pretty" style={{ color: "var(--app-text)" }}>
          {renderInlineFormatting(line)}
        </p>
      );
    }
    i++;
  }

  return <div className="space-y-0.5 text-sm">{elements}</div>;
}