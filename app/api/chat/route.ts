import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const FOLLOWUP_MARKER = "[[FUP]]";
const FOLLOWUP_REGEX = /\[\[FUP\]\]\s*(\[[\s\S]*?\])\s*$/;

const SYSTEM_PROMPT = `You are a helpful, knowledgeable AI assistant embedded in a chat application.

# Response Guidelines

## Structure
- Begin with a direct answer or a 1-2 sentence summary. Never start with filler like "Great question!" or "Sure!".
- For answers longer than ~150 words, use Markdown "##" headings to split into clear sections (e.g. "## Overview", "## How it works", "## Example").
- Keep paragraphs short: 2-4 sentences maximum. Never write walls of text.
- For 3+ parallel items, use bullet points.
- For sequential steps, use numbered lists.
- For comparisons across 2+ items and 2+ attributes, ALWAYS use a Markdown table with clear headers.
- Nested lists must be indented with 2-4 spaces under their parent item.
- Separate major sections with a blank line, not with "---" unless it truly helps readability.

## Formatting
- Use **bold** for key terms, takeaways, and UI labels.
- Use *italic* sparingly, for subtle emphasis only.
- Use \`inline code\` for function names, file paths, variables, commands, and literals.
- Wrap ALL code in fenced blocks with the correct language tag: \`\`\`tsx, \`\`\`python, \`\`\`bash, \`\`\`json, etc.
- Never put fenced code blocks inside table cells. Put the code below the table with a short "Example:" label instead.
- Inside table cells, use "<br>" for line breaks. Never use "<br>" in prose.

## Code
- Provide complete, runnable code, not fragments with "...".
- Put the file path in a comment on the first line: // app/page.tsx
- Add brief inline comments only for non-obvious logic.
- After code, explain in 1-2 sentences what it does, then list any gotchas as bullets.

## Tone
- Be direct, technical, and precise.
- Match the user's technical level based on their question.
- Never pad with "I hope this helps!" or "Let me know if you have more questions!" — the follow-up suggestions handle that.

## Length
- Match length to complexity. A simple "What is X?" gets 2-3 sentences. "Explain X in depth" gets a full structured answer.
- When in doubt, prefer shorter and offer to go deeper.

# Interactive Tools

## Follow-up Suggestions
After every normal text response, append exactly this on a NEW line at the very end. Never inside code, never inside a table, never inside a heading:

[[FUP]] ["first question", "second question", "third question"]

The three questions must be specific, useful, and directly tied to the answer you just gave. Never mention, quote, or repeat them anywhere else in your response.

## Multiple Choice Questions
When asking a question to narrow down options or gather preferences, output a specially formatted block at the very end of your message. Do not write the options as normal text. Use this exact format:

[[MCQ]] {"question": "Your question here?", "options": ["Option A", "Option B", "Option C"]}

Rules for MCQ:
- Only use 2 to 4 options.
- Do not include a "Continue" button in the options, the UI handles that.
- If you use both tools, you MUST put the [[FUP]] block BEFORE the [[MCQ]] block. Never put an [[MCQ]] block and [[FUP]] block on the same line.`; 

function sse(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function parseSuggestions(suffix: string): string[] {
  const match = suffix.match(FOLLOWUP_REGEX);
  if (!match) return [];
  try {
    const items = JSON.parse(match[1]);
    if (!Array.isArray(items)) return [];
    return items
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 3);
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  let selectedModel = "";

  try {
    const groqKey = process.env.GROQ_API_KEY?.trim();
    const openaiKey = process.env.OPENAI_API_KEY?.trim();
    const useGroq = Boolean(groqKey && groqKey !== "your_groq_api_key_here");
    const useOpenAI = Boolean(openaiKey && openaiKey !== "your_openai_api_key_here");

    if (!useGroq && !useOpenAI) {
      return NextResponse.json(
        { error: "No AI provider key is configured. Add GROQ_API_KEY or OPENAI_API_KEY to .env.local." },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 100) {
      return NextResponse.json({ error: "Invalid chat request." }, { status: 400 });
    }

    const messages: ChatMessage[] = [];
    for (const message of body.messages) {
      if (
        !message ||
        typeof message.content !== "string" ||
        message.content.length > 20_000 ||
        !["user", "assistant"].includes(message.role)
      ) {
        return NextResponse.json(
          { error: "Each message needs a valid role and text content." },
          { status: 400 }
        );
      }
      messages.push({ role: message.role, content: message.content.trim() });
    }

    const latestMessage = messages.at(-1);
    if (!latestMessage?.content || latestMessage.role !== "user") {
      return NextResponse.json(
        { error: "The latest message must be a non-empty user message." },
        { status: 400 }
      );
    }

    const client = new OpenAI({
      apiKey: useGroq ? groqKey! : openaiKey!,
      baseURL: useGroq ? "https://api.groq.com/openai/v1" : undefined,
    });
    selectedModel = useGroq
      ? process.env.GROQ_MODEL || "openai/gpt-oss-20b"
      : process.env.OPENAI_MODEL || "gpt-4o-mini";

    const stream = await client.chat.completions.create(
      {
        model: selectedModel,
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.6,
        max_tokens: 4096,
        stream: true,
      },
      { signal: request.signal }
    );

    const encoder = new TextEncoder();
    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let pending = "";
        let suffix = "";
        let foundSuffix = false;
        const bufferMargin = FOLLOWUP_MARKER.length + 8;

        const emitDelta = (text: string) => {
          if (!text) return;
          try {
            controller.enqueue(encoder.encode(sse({ type: "delta", text })));
          } catch { /* controller may already be closed */ }
        };

        try {
          for await (const chunk of stream) {
            if (request.signal.aborted) break;
            const text = chunk.choices[0]?.delta?.content;
            if (!text) continue;

            if (foundSuffix) {
              suffix += text;
              continue;
            }

            pending += text;
            const markerAt = pending.indexOf(FOLLOWUP_MARKER);
            if (markerAt >= 0) {
              emitDelta(pending.slice(0, markerAt).replace(/\n+$/, ""));
              suffix = pending.slice(markerAt);
              pending = "";
              foundSuffix = true;
              continue;
            }

            const safeLength = Math.max(0, pending.length - bufferMargin);
            if (safeLength > 0) {
              emitDelta(pending.slice(0, safeLength));
              pending = pending.slice(safeLength);
            }
          }

          if (!request.signal.aborted) {
            emitDelta(pending);
            const suggestions = parseSuggestions(suffix);
            try {
              controller.enqueue(encoder.encode(sse({ type: "suggestions", suggestions })));
              controller.enqueue(encoder.encode(sse({ type: "done" })));
            } catch { /* ignore */ }
          }
        } catch (error: any) {
          if (error?.name === "AbortError" || request.signal.aborted) {
            // Client disconnected — silently close
          } else {
            console.error("Streaming chat error:", error);
            try {
              controller.enqueue(
                encoder.encode(
                  sse({
                    type: "error",
                    error: "The response could not be completed. Please try again.",
                  })
                )
              );
            } catch { /* ignore */ }
          }
        } finally {
          try { controller.close(); } catch { /* ignore */ }
        }
      },
    });

    return new Response(responseStream, {
      headers: new Headers({
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-Accel-Buffering": "no",
        Connection: "keep-alive",
      }),
    });
  } catch (error: any) {
    if (error?.name === "AbortError") {
      return new Response(null, { status: 499 });
    }
    console.error("Chat API route error:", error, { selectedModel });
    const message =
      error?.status === 429
        ? "Rate limit reached. Please wait a moment and try again."
        : "Unable to start this chat. Check your connection and setup.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}