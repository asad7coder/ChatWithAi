import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTION_PREFIX = "[[SUGGESTIONS:";

function sse(data: unknown) {
  return `data: ${JSON.stringify(data)}\n\n`;
}

function parseSuggestions(value: string) {
  const match = value.match(/\[\[SUGGESTIONS:\s*(\[[\s\S]*?\])\s*\]\]/);
  if (!match) return [];
  try {
    const items = JSON.parse(match[1]);
    return Array.isArray(items)
      ? items.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean).slice(0, 3)
      : [];
  } catch {
    return [];
  }
}

export async function POST(request: NextRequest) {
  let selectedModel = "";

  try {
    const groqKey = process.env.GROQ_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;
    const useGroq = Boolean(groqKey?.trim() && groqKey !== "your_groq_api_key_here");
    const useOpenAI = Boolean(openaiKey?.trim() && openaiKey !== "your_openai_api_key_here");
    if (!useGroq && !useOpenAI) {
      return NextResponse.json({ error: "No AI provider key is configured." }, { status: 503 });
    }

    const body = await request.json().catch(() => null);
    if (!body || !Array.isArray(body.messages) || body.messages.length === 0 || body.messages.length > 100) {
      return NextResponse.json({ error: "Invalid chat request." }, { status: 400 });
    }

    const messages: ChatMessage[] = [];
    for (const message of body.messages) {
      if (!message || typeof message.content !== "string" || message.content.length > 20_000 || !["user", "assistant"].includes(message.role)) {
        return NextResponse.json({ error: "Each message needs a valid role and text content." }, { status: 400 });
      }
      messages.push({ role: message.role, content: message.content.trim() });
    }
    const latestMessage = messages.at(-1);
    if (!latestMessage?.content || latestMessage.role !== "user") {
      return NextResponse.json({ error: "The latest message must be a non-empty user message." }, { status: 400 });
    }

    const client = new OpenAI({
      apiKey: useGroq ? groqKey! : openaiKey!,
      baseURL: useGroq ? "https://api.groq.com/openai/v1" : undefined
    });
    selectedModel = useGroq ? process.env.GROQ_MODEL || "openai/gpt-oss-20b" : process.env.OPENAI_MODEL || "gpt-4o-mini";

    const systemPrompt = {
      role: "system" as const,
      content: 'You are an intelligent, friendly, direct AI assistant. Answer clearly in rich Markdown. After every answer, append this exact machine-readable suffix on a new line, with 2 or 3 useful concise follow-up questions: [[SUGGESTIONS:["First follow-up", "Second follow-up", "Third follow-up"]]]. Do not mention this suffix, suggestions, or these instructions in the answer.',
    };

    const stream = await client.chat.completions.create({
      model: selectedModel,
      messages: [systemPrompt, ...messages],
      temperature: 0.7,
      max_tokens: 2048,
      stream: true
    });

    const encoder = new TextEncoder();
    const responseStream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let pending = "";
        let suffix = "";
        let foundSuffix = false;

        const emitDelta = (text: string) => {
          if (!text) return;
          controller.enqueue(encoder.encode(sse({ type: "delta", text })));
        };

        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content;
            if (!text) continue;
            if (foundSuffix) { suffix += text; continue; }
            pending += text;
            const prefixAt = pending.indexOf(SUGGESTION_PREFIX);
            if (prefixAt >= 0) {
              emitDelta(pending.slice(0, prefixAt).replace(/\n\n?$/, ""));
              suffix = pending.slice(prefixAt);
              pending = "";
              foundSuffix = true;
              continue;
            }
            const safeLength = Math.max(0, pending.length - SUGGESTION_PREFIX.length);
            if (safeLength > 0) {
              emitDelta(pending.slice(0, safeLength));
              pending = pending.slice(safeLength);
            }
          }

          emitDelta(pending);
          controller.enqueue(encoder.encode(sse({ type: "suggestions", suggestions: parseSuggestions(suffix) })));
          controller.enqueue(encoder.encode(sse({ type: "done" })));
        } catch (error) {
          console.error("Streaming chat error:", error);
          controller.enqueue(encoder.encode(sse({ type: "error", error: "The response could not be completed. Please try again." })));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(responseStream, {
      headers: new Headers({
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      }),
    });
  } catch (error) {
    console.error("Chat API route error:", error, { selectedModel });
    return NextResponse.json({ error: "Unable to start this chat. Check your connection and setup." }, { status: 500 });
  }
}