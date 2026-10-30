"use client";

import React, { useState, useRef, useEffect } from "react";
import MarkdownRenderer from "./components/MarkdownRenderer";
import ChatSidebar from "./components/ChatSidebar";
import SettingsModal from "./components/SettingsModal";
import { ChatSession, ColorMode, Message, ThemeId, AVAILABLE_THEMES } from "./types";

const LOCAL_STORAGE_THEME_KEY = "ai_chat_theme_v2";
const LOCAL_STORAGE_MODE_KEY = "ai_chat_mode_v2";

const STARTER_PROMPTS = [
  { title: "Explain a concept", prompt: "Explain how large language models work in simple terms.", icon: "idea" },
  { title: "Code review & debug", prompt: "What are the key differences between React useEffect and useLayoutEffect?", icon: "code" },
  { title: "Brainstorm ideas", prompt: "Suggest 3 creative project ideas to practice building AI web applications.", icon: "spark" },
  { title: "Productivity", prompt: "Give me a quick 5-step checklist for building a production-ready Next.js app.", icon: "checklist" },
] as const;

function StarterPromptIcon({ name }: { name: (typeof STARTER_PROMPTS)[number]["icon"] }) {
  const paths = {
    idea: <><path strokeLinecap="round" strokeLinejoin="round" d="M9 18h6m-5 3h4m-7.5-8.5a5.5 5.5 0 1111 0c0 1.77-.8 3.36-2.06 4.4-.64.53-.94 1.32-.94 2.1H9.5c0-.78-.3-1.57-.94-2.1A5.68 5.68 0 016.5 12.5z" /></>,
    code: <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-3 3 3 3m8-6l3 3-3 3m-2-10l-4 14" />,
    spark: <path strokeLinecap="round" strokeLinejoin="round" d="M13 2L3 14h7l-1 8 10-12h-7l1-8z" />,
    checklist: <><path strokeLinecap="round" strokeLinejoin="round" d="M9 6h10M9 12h10M9 18h10" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h.01M4 12h.01M4 18h.01" /></>,
  };

  return <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden="true">{paths[name]}</svg>;
}

export default function ChatPage() {
  const [theme, setTheme] = useState<ThemeId>("emerald");
  const [mode, setMode] = useState<ColorMode>("dark");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // THE ONLY SOURCE OF TRUTH
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  // Derived state (always up to date)
  const activeChat = chats.find((c) => c.id === activeChatId);
  const messages = activeChat ? activeChat.messages : [];

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteHeader, setConfirmDeleteHeader] = useState(false);
  const [exportToast, setExportToast] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messageSequenceRef = useRef(0);

  // Theme persistence
  useEffect(() => {
    const savedTheme = localStorage.getItem(LOCAL_STORAGE_THEME_KEY) as ThemeId | null;
    if (savedTheme && AVAILABLE_THEMES.some((t) => t.id === savedTheme)) setTheme(savedTheme);
    const savedMode = localStorage.getItem(LOCAL_STORAGE_MODE_KEY) as ColorMode | null;
    if (savedMode && ["dark", "light", "system"].includes(savedMode)) setMode(savedMode);
  }, []);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_THEME_KEY, theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_MODE_KEY, mode);
    const resolveMode = () => mode === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : mode;
    document.documentElement.setAttribute("data-mode", resolveMode());
    if (mode === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => document.documentElement.setAttribute("data-mode", mq.matches ? "dark" : "light");
      mq.addEventListener("change", handleChange);
      return () => mq.removeEventListener("change", handleChange);
    }
  }, [mode]);

  // Sidebar Actions
  const handleSelectChat = (chatId: string) => {
    if (chatId === activeChatId) return;
    setActiveChatId(chatId);
    setErrorMessage(null);
    setConfirmDeleteHeader(false);
    textareaRef.current?.focus();
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setInput("");
    setErrorMessage(null);
    setConfirmDeleteHeader(false);
    textareaRef.current?.focus();
  };

  const handleDeleteChat = (chatId: string) => {
    const remaining = chats.filter((c) => c.id !== chatId);
    setChats(remaining);
    if (activeChatId === chatId) {
      setConfirmDeleteHeader(false);
      if (remaining.length > 0) handleSelectChat(remaining[0].id);
      else setActiveChatId(null);
    }
  };

  const handleRenameChat = (chatId: string, newTitle: string) => {
    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c)));
  };

  const handleClearAllChats = () => {
    setChats([]);
    setActiveChatId(null);
  };

  const handleDeleteMessage = (messageId: string) => {
    if (!activeChatId) return;
    setChats((curr) =>
      curr.map((c) => (c.id === activeChatId ? { ...c, messages: c.messages.filter((m) => m.id !== messageId) } : c))
    );
  };

  const scrollToBottom = (smooth = true) => messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });

  useEffect(() => { scrollToBottom(true); }, [messages, isLoading]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.metaKey || e.ctrlKey;
      if (meta && e.key.toLowerCase() === "n") { e.preventDefault(); handleNewChat(); }
      else if (meta && e.key.toLowerCase() === "b") { e.preventDefault(); setIsSidebarOpen((p) => !p); }
      else if (meta && e.key === ",") { e.preventDefault(); setIsSettingsOpen((p) => !p); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const handleCopy = async (id: string, text: string) => {
    try { await navigator.clipboard.writeText(text); setCopiedId(id); setTimeout(() => setCopiedId(null), 2000); } catch { setCopiedId(null); }
  };

  const sendMessage = async (contentToSend?: string) => {
    const rawContent = contentToSend !== undefined ? contentToSend : input;
    const content = rawContent.trim();
    if (!content || isLoading) return;

    setErrorMessage(null);
    let currentChatId = activeChatId;
    const smartTitle = content.length > 36 ? `${content.slice(0, 36)}...` : content;

    messageSequenceRef.current += 1;
    const userMessage: Message = { id: `user-${Date.now()}`, role: "user", content, timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) };
    messageSequenceRef.current += 1;
    const assistantMessageId = `assistant-${Date.now()}-${messageSequenceRef.current}`;
    const assistantMessage: Message = { id: assistantMessageId, role: "assistant", content: "", timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), isStreaming: true };

    const newUiMessages = [...messages, userMessage, assistantMessage];

    // 1. Instantly update the UI and Sidebar before the API call
    if (!currentChatId) {
      currentChatId = `chat-${Date.now()}`;
      const newChat: ChatSession = { id: currentChatId, title: smartTitle, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), messages: newUiMessages };
      setChats((prev) => [newChat, ...prev]);
      setActiveChatId(currentChatId);
    } else {
      setChats((prev) => prev.map((c) => c.id === currentChatId ? { ...c, updatedAt: new Date().toISOString(), messages: newUiMessages } : c));
    }

    setInput("");
    setIsLoading(true);
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    try {
      const payload = newUiMessages.slice(0, -1).map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payload }),
      });

      if (!res.ok) throw new Error(`Server responded with status ${res.status}`);
      if (!res.body) throw new Error("The server did not return a response stream.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamError: string | null = null;
      let finalReply = "";
      let finalSuggestions: string[] = [];

      // 2. Update ONLY the specific chat in the array while streaming
      const updateAssistantInChat = (update: Partial<Message>) => {
        setChats((prevChats) =>
          prevChats.map((chat) => {
            if (chat.id === currentChatId) {
              return { ...chat, messages: chat.messages.map((msg) => (msg.id === assistantMessageId ? { ...msg, ...update } : msg)) };
            }
            return chat;
          })
        );
      };

      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          const line = event.split("\n").find((item) => item.startsWith("data: "));
          if (!line) continue;
          const data = JSON.parse(line.slice(6)) as { type: string; text?: string; suggestions?: string[]; error?: string };

          if (data.type === "delta" && data.text) {
            finalReply += data.text;
            setChats((prevChats) =>
              prevChats.map((chat) => {
                if (chat.id === currentChatId) {
                  return { ...chat, messages: chat.messages.map((msg) => msg.id === assistantMessageId ? { ...msg, content: msg.content + data.text } : msg) };
                }
                return chat;
              })
            );
          }
          if (data.type === "suggestions" && data.suggestions) {
            finalSuggestions = data.suggestions;
            updateAssistantInChat({ suggestions: data.suggestions });
          }
          if (data.type === "error") {
            streamError = data.error || "The response stream was interrupted.";
          }
        }
        if (done) break;
      }

      updateAssistantInChat({ isStreaming: false, content: finalReply });
      if (streamError) throw new Error(streamError);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(msg);
      setChats((prevChats) =>
        prevChats.map((chat) => {
          if (chat.id === currentChatId) {
            return { ...chat, messages: chat.messages.map((m) => m.id === assistantMessageId ? { ...m, content: m.content || "I couldn't complete that response.", isStreaming: false } : m) };
          }
          return chat;
        })
      );
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const currentChatTitle = activeChat?.title || "New conversation";

  return (
    <div className="flex h-screen w-screen overflow-hidden font-sans transition-colors duration-200" style={{ backgroundColor: "var(--app-bg)", color: "var(--app-text)" }}>
      <ChatSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen((p) => !p)}
        onCloseMobile={() => setIsSidebarOpen(false)}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onDeleteChat={handleDeleteChat}
        onRenameChat={handleRenameChat}
        onClearAllChats={handleClearAllChats}
        theme={theme}
        mode={mode}
      />

      <div className="flex flex-1 flex-col h-full min-w-0 overflow-hidden relative">
        <header className="flex-none flex items-center justify-between border-b px-4 py-3 sm:px-6 backdrop-blur-md z-10 transition-colors" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
          <div className="flex items-center gap-3 min-w-0">
            <button type="button" onClick={() => setIsSidebarOpen((p) => !p)} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition hover:opacity-80 cursor-pointer" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface-subtle)", color: "var(--app-text)" }} title={isSidebarOpen ? "Hide Sidebar (⌘B)" : "Show Sidebar (⌘B)"}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h7" /></svg>
            </button>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-semibold truncate" style={{ color: "var(--app-text)" }}>{currentChatTitle}</h1>
              </div>
              <p className="text-[11px] truncate" style={{ color: "var(--app-text-muted)" }}>Session Only • Refreshing will clear chats</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={handleNewChat} className="flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold shadow-xs transition hover:opacity-90 cursor-pointer active:scale-95" style={{ backgroundColor: "var(--theme-primary-soft)", borderColor: "var(--theme-primary-border)", color: "var(--theme-primary)" }} title="Start a new conversation (⌘N)">
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              <span className="hidden sm:inline">New Chat</span>
            </button>
            <button type="button" onClick={() => setIsSettingsOpen(true)} className="flex h-9 w-9 items-center justify-center rounded-xl border transition hover:opacity-80 cursor-pointer" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface-subtle)", color: "var(--app-text)" }} title="Open Settings & Themes">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
          <div className="mx-auto max-w-3xl space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center pt-8 sm:pt-14 text-center">
                <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl shadow-xl transition-transform hover:scale-105" style={{ background: "var(--theme-gradient)", color: "var(--theme-contrast-text)" }}>
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight" style={{ color: "var(--app-text)" }}>How can I help you today?</h2>
                <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2 text-left">
                  {STARTER_PROMPTS.map((item, idx) => (
                    <button key={idx} type="button" onClick={() => sendMessage(item.prompt)} className="group flex flex-col justify-between rounded-2xl border p-4 transition-all duration-200 hover:shadow-lg cursor-pointer" style={{ backgroundColor: "var(--app-surface)", borderColor: "var(--app-border)" }}>
                      <div className="flex items-center gap-2.5"><span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ backgroundColor: "var(--theme-primary-soft)", color: "var(--theme-primary)" }}><StarterPromptIcon name={item.icon} /></span><span className="text-xs font-semibold" style={{ color: "var(--app-text)" }}>{item.title}</span></div>
                      <p className="mt-2 text-xs line-clamp-2 leading-relaxed" style={{ color: "var(--app-text-muted)" }}>{item.prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((message) => {
              const isUser = message.role === "user";
              return (
                <div key={message.id} className={`flex gap-3 sm:gap-4 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
                  <div className="flex h-8 w-8 shrink-0 select-none items-center justify-center rounded-xl text-xs font-semibold shadow-xs" style={{ background: isUser ? "var(--theme-gradient)" : "var(--app-surface-subtle)", color: isUser ? "var(--theme-contrast-text)" : "var(--theme-primary)", border: isUser ? "none" : "1px solid var(--app-border)" }}>
                    {isUser ? (<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>) : (<svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 01-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" /></svg>)}
                  </div>

                  <div className={`group relative flex flex-col max-w-[92%] sm:max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
                    <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-all ${isUser ? "rounded-tr-xs" : "rounded-tl-xs border"}`} style={{ background: isUser ? "var(--theme-gradient)" : "var(--app-ai-bubble-bg)", color: isUser ? "var(--theme-contrast-text)" : "var(--app-text)", borderColor: isUser ? "transparent" : "var(--app-ai-bubble-border)" }}>
                      <div className="break-words">
                        {isUser ? (
                          <div className="whitespace-pre-wrap">{message.content}</div>
                        ) : !message.content && message.isStreaming ? (
                          <div className="flex items-center gap-2" style={{ color: "var(--app-text-muted)" }}>
                            <span>Thinking</span>
                          </div>
                        ) : (
                          <>
                            <MarkdownRenderer content={message.content} />
                            {message.isStreaming && (<span className="ml-0.5 inline-block animate-pulse font-bold" style={{ color: "var(--theme-primary)" }}>▌</span>)}
                          </>
                        )}
                      </div>
                    </div>

                    <div className="mt-1 flex items-center gap-2 px-1 text-[11px]" style={{ color: "var(--app-text-dim)" }}>
                      <span>{message.timestamp}</span>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {message.content && (<button type="button" onClick={() => handleCopy(message.id, message.content)} className="cursor-pointer font-medium hover:opacity-100">{copiedId === message.id ? "✓ Copied" : "Copy"}</button>)}
                        <button type="button" onClick={() => handleDeleteMessage(message.id)} className="cursor-pointer hover:opacity-80 text-rose-500 font-bold">✕</button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            <div ref={messagesEndRef} />
          </div>
        </main>

        <footer className="flex-none border-t px-4 py-3 sm:px-6 backdrop-blur-md transition-colors" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface)" }}>
          <div className="mx-auto max-w-3xl">
            <form onSubmit={(e) => { e.preventDefault(); sendMessage(); }} className="relative flex items-end gap-2 rounded-2xl border px-3 py-2 shadow-sm transition-all focus-within:ring-1" style={{ backgroundColor: "var(--app-input-bg)", borderColor: "var(--app-input-border)" }}>
              <textarea ref={textareaRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} placeholder="Ask anything..." rows={1} disabled={isLoading} className="max-h-40 min-h-[24px] w-full resize-none bg-transparent py-1 text-sm outline-none disabled:opacity-50 placeholder:text-[var(--app-text-dim)]" style={{ color: "var(--app-text)" }} />
              <button type="submit" disabled={isLoading || !input.trim()} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition cursor-pointer active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 shadow-xs" style={{ background: "var(--theme-gradient)", color: "var(--theme-contrast-text)" }}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.25}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
              </button>
            </form>
          </div>
        </footer>
      </div>

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        mode={mode}
        setMode={setMode}
      />
    </div>
  );
}
