"use client";

import React, { useState } from "react";

interface MarkdownRendererProps {
  content: string;
}

// Helper to render inline formatting: bold, italic, inline code
function renderInlineFormatting(text: string): React.ReactNode[] {
  // Pattern matches inline code `code`, bold **text**, and italic *text*
  const tokens: React.ReactNode[] = [];
  const regex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push(text.substring(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith("`") && token.endsWith("`")) {
      tokens.push(
        <code
          key={`code-${match.index}`}
          className="rounded px-1.5 py-0.5 text-xs font-mono font-medium border"
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
        <strong
          key={`bold-${match.index}`}
          className="font-semibold"
          style={{ color: "var(--app-text)" }}
        >
          {renderInlineFormatting(token.slice(2, -2))}
        </strong>
      );
    } else if (token.startsWith("*") && token.endsWith("*")) {
      tokens.push(
        <em
          key={`italic-${match.index}`}
          className="italic"
          style={{ color: "var(--app-text-muted)" }}
        >
          {renderInlineFormatting(token.slice(1, -1))}
        </em>
      );
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push(text.substring(lastIndex));
  }

  return tokens.length > 0 ? tokens : [text];
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div
      className="my-3 overflow-hidden rounded-xl border text-xs"
      style={{
        backgroundColor: "var(--app-code-bg)",
        borderColor: "var(--app-border)",
      }}
    >
      <div
        className="flex items-center justify-between border-b px-4 py-2"
        style={{
          backgroundColor: "var(--app-code-header-bg)",
          borderColor: "var(--app-border)",
        }}
      >
        <span
          className="font-mono text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--theme-primary)" }}
        >
          {language || "code"}
        </span>
        <button
          type="button"
          onClick={handleCopy}
          className="cursor-pointer text-[11px] transition font-medium"
          style={{ color: "var(--app-text-muted)" }}
        >
          {copied ? "✓ Copied!" : "Copy code"}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 font-mono leading-relaxed" style={{ color: "var(--app-code-text)" }}>
        <code>{code}</code>
      </pre>
    </div>
  );
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  const lines = content.split("\n");
  const elements: React.ReactNode[] = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // 1. Code Block
    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith("```")) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // Skip closing ```
      elements.push(
        <CodeBlock
          key={`code-block-${elements.length}`}
          code={codeLines.join("\n")}
          language={language}
        />
      );
      continue;
    }

    // 2. Markdown Table Detection (| ... |)
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      const tableLines: string[] = [];
      while (i < lines.length && lines[i].trim().startsWith("|") && lines[i].trim().endsWith("|")) {
        tableLines.push(lines[i].trim());
        i++;
      }

      if (tableLines.length >= 2) {
        const headerCells = tableLines[0]
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());

        const bodyRows = tableLines
          .slice(2) // Skip header and separator row (|---|---|)
          .map((row) =>
            row
              .split("|")
              .slice(1, -1)
              .map((c) => c.trim())
          );

        elements.push(
          <div
            key={`table-${elements.length}`}
            className="my-3 overflow-x-auto rounded-xl border shadow-xs"
            style={{
              backgroundColor: "var(--app-surface)",
              borderColor: "var(--app-border)",
            }}
          >
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr
                  className="border-b"
                  style={{
                    backgroundColor: "var(--app-surface-subtle)",
                    borderColor: "var(--app-border)",
                    color: "var(--app-text)",
                  }}
                >
                  {headerCells.map((cell, idx) => (
                    <th key={idx} className="px-3.5 py-2.5 font-semibold whitespace-nowrap">
                      {renderInlineFormatting(cell)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody
                className="divide-y"
                style={{
                  borderColor: "var(--app-border)",
                  color: "var(--app-text-muted)",
                }}
              >
                {bodyRows.map((row, rIdx) => (
                  <tr
                    key={rIdx}
                    className="transition-colors"
                    style={{
                      backgroundColor: rIdx % 2 === 1 ? "var(--app-surface-subtle)" : "transparent",
                    }}
                  >
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2 leading-relaxed">
                        {renderInlineFormatting(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 3. Headings
    if (line.startsWith("### ")) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="mt-4 mb-2 text-sm sm:text-base font-bold tracking-tight"
          style={{ color: "var(--app-text)" }}
        >
          {renderInlineFormatting(line.slice(4))}
        </h3>
      );
      i++;
      continue;
    }
    if (line.startsWith("## ")) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="mt-5 mb-2 text-base sm:text-lg font-bold tracking-tight"
          style={{ color: "var(--app-text)" }}
        >
          {renderInlineFormatting(line.slice(3))}
        </h2>
      );
      i++;
      continue;
    }
    if (line.startsWith("# ")) {
      elements.push(
        <h1
          key={`h1-${i}`}
          className="mt-6 mb-2.5 text-lg sm:text-xl font-extrabold tracking-tight"
          style={{ color: "var(--app-text)" }}
        >
          {renderInlineFormatting(line.slice(2))}
        </h1>
      );
      i++;
      continue;
    }

    // 4. Horizontal Rule
    if (line.trim() === "---" || line.trim() === "***") {
      elements.push(
        <hr
          key={`hr-${i}`}
          className="my-4"
          style={{ borderColor: "var(--app-border)" }}
        />
      );
      i++;
      continue;
    }

    // 5. Bullet List Item
    if (/^\s*[-*]\s+/.test(line)) {
      const indent = line.search(/\S/);
      const text = line.replace(/^\s*[-*]\s+/, "");
      elements.push(
        <li
          key={`bullet-${i}`}
          style={{
            marginLeft: `${indent * 8}px`,
            color: "var(--app-text-muted)",
          }}
          className="my-1 flex items-start gap-2 leading-relaxed"
        >
          <span
            className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
            style={{ backgroundColor: "var(--theme-primary)" }}
          />
          <span>{renderInlineFormatting(text)}</span>
        </li>
      );
      i++;
      continue;
    }

    // 6. Numbered List Item
    const numMatch = line.match(/^\s*(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <li
          key={`num-${i}`}
          className="my-1 flex items-start gap-2 leading-relaxed"
          style={{ color: "var(--app-text-muted)" }}
        >
          <span
            className="shrink-0 font-semibold text-xs mt-0.5"
            style={{ color: "var(--theme-primary)" }}
          >
            {numMatch[1]}.
          </span>
          <span>{renderInlineFormatting(numMatch[2])}</span>
        </li>
      );
      i++;
      continue;
    }

    // 7. Regular paragraph / empty line
    if (!line.trim()) {
      elements.push(<div key={`blank-${i}`} className="h-2" />);
    } else {
      elements.push(
        <p
          key={`p-${i}`}
          className="my-1 leading-relaxed"
          style={{ color: "var(--app-text)" }}
        >
          {renderInlineFormatting(line)}
        </p>
      );
    }

    i++;
  }

  return <div className="space-y-0.5 text-sm">{elements}</div>;
}
