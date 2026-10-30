"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ChatSession, ColorMode, ThemeId } from "../types";

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onCloseMobile: () => void;
  chats: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onDeleteChat: (id: string) => void;
  onRenameChat: (id: string, newTitle: string) => void;
  onClearAllChats: () => void;
  theme: ThemeId;
  mode: ColorMode;
}

function groupChatsByDate(chats: ChatSession[], todayStart: number | null) {
  if (todayStart === null) return { "Recent Conversations": chats };
  const groups: { [key: string]: ChatSession[] } = { Today: [], Yesterday: [], "Previous 7 Days": [], Older: [] };
  const yesterdayStart = todayStart - 86400000;
  const lastWeekStart = todayStart - 86400000 * 7;

  chats.forEach((chat) => {
    const time = new Date(chat.updatedAt || chat.createdAt).getTime();
    if (time >= todayStart) groups["Today"].push(chat);
    else if (time >= yesterdayStart) groups["Yesterday"].push(chat);
    else if (time >= lastWeekStart) groups["Previous 7 Days"].push(chat);
    else groups["Older"].push(chat);
  });
  return groups;
}

export default function ChatSidebar({
  isOpen, onToggle, onCloseMobile, chats, activeChatId, onSelectChat, onNewChat, onDeleteChat, onRenameChat, onClearAllChats,
}: ChatSidebarProps) {

  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [todayStart, setTodayStart] = useState<number | null>(null);

  useEffect(() => {
    const now = new Date();
    setTodayStart(new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime());
  }, []);

  const filteredChats = useMemo(() => {
    // ONLY filter by title if a search query exists. Do not hide empty chats.
    if (!searchQuery.trim()) return chats;
    const query = searchQuery.toLowerCase();
    return chats.filter((c) => c.title.toLowerCase().includes(query));
  }, [chats, searchQuery]);

  const groupedChats = useMemo(() => groupChatsByDate(filteredChats, todayStart), [filteredChats, todayStart]);

  const handleStartRename = (e: React.MouseEvent, chat: ChatSession) => { e.stopPropagation(); setEditingId(chat.id); setEditTitle(chat.title); };
  const handleSaveRename = (e: React.FormEvent | React.MouseEvent, id: string) => { e.stopPropagation(); if (editTitle.trim()) onRenameChat(id, editTitle.trim()); setEditingId(null); };

  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (deletingId === id) { onDeleteChat(id); setDeletingId(null); }
    else { setDeletingId(id); setTimeout(() => setDeletingId((curr) => (curr === id ? null : curr)), 4000); }
  };

  return (
    <>
      {isOpen && (<div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden transition-opacity" onClick={onCloseMobile} />)}

      <aside className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col w-72 md:w-80 shrink-0 border-r transition-all duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full md:-ml-80"}`} style={{ backgroundColor: "var(--app-surface)", borderColor: "var(--app-border)", color: "var(--app-text)" }}>

        <div className="flex items-center justify-between p-4 border-b flex-none" style={{ borderColor: "var(--app-border)" }}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl shadow-xs" style={{ background: "var(--theme-gradient)", color: "var(--theme-contrast-text)" }}>
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight block leading-tight">AI Workspace</span>
              <span className="text-[10px] font-medium flex items-center gap-1.5" style={{ color: "var(--app-text-muted)" }}>Session Active</span>
            </div>
          </div>
          <button type="button" onClick={onToggle} aria-label="Collapse sidebar" title="Collapse sidebar" className="flex h-8 w-8 items-center justify-center rounded-lg border transition hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-primary)] cursor-pointer" style={{ borderColor: "var(--app-border)", color: "var(--app-text-muted)", backgroundColor: "var(--app-surface-subtle)" }}>
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" /></svg>
          </button>
        </div>

        <div className="p-3 flex-none">
          <button type="button" onClick={() => { onNewChat(); onCloseMobile(); }} className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-semibold shadow-xs transition cursor-pointer hover:opacity-95" style={{ background: "var(--theme-gradient)", color: "var(--theme-contrast-text)", borderColor: "transparent" }}>
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" /></svg>
              <span>New Conversation</span>
            </div>
          </button>
        </div>

        {chats.length > 2 && (
          <div className="px-3 pb-2 flex-none">
            <div className="relative flex items-center rounded-lg border px-2.5 py-1.5 text-xs" style={{ backgroundColor: "var(--app-surface-subtle)", borderColor: "var(--app-border)" }}>
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search chats..." className="w-full bg-transparent outline-none text-xs placeholder:text-[var(--app-text-dim)]" style={{ color: "var(--app-text)" }} />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4">
          {chats.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-2">
              <p className="text-xs font-medium" style={{ color: "var(--app-text)" }}>No saved chats yet</p>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8 text-xs" style={{ color: "var(--app-text-muted)" }}>No conversations found.</div>
          ) : (
            Object.entries(groupedChats).map(([groupTitle, groupItems]) => {
              if (groupItems.length === 0) return null;
              return (
                <div key={groupTitle} className="space-y-1">
                  <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--app-text-dim)" }}>{groupTitle}</div>
                  {groupItems.map((chat) => {
                    const isActive = chat.id === activeChatId;
                    const isEditing = editingId === chat.id;
                    const isConfirmingDelete = deletingId === chat.id;

                    return (
                      <div key={chat.id} onClick={() => { if (!isEditing) { onSelectChat(chat.id); onCloseMobile(); } }} className={`group relative flex items-center justify-between rounded-xl px-3 py-2 text-xs transition cursor-pointer ${isActive ? "font-semibold" : "hover:opacity-90"}`} style={{ backgroundColor: isActive ? "var(--theme-primary-soft)" : "transparent", color: isActive ? "var(--theme-primary)" : "var(--app-text)", border: isActive ? "1px solid var(--theme-primary-border)" : "1px solid transparent" }}>

                        {isEditing ? (
                          <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                            <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") handleSaveRename(e, chat.id); if (e.key === "Escape") setEditingId(null); }} autoFocus className="w-full bg-[var(--app-surface-subtle)] border border-[var(--app-border)] rounded px-2 py-1 text-xs outline-none" />
                            <button type="button" onClick={(e) => handleSaveRename(e, chat.id)} className="px-2 py-1 rounded bg-[var(--theme-primary)] text-[var(--theme-contrast-text)] text-xs font-bold">✓</button>
                          </div>
                        ) : (
                          <>
                            <span className="truncate text-xs pr-2">{chat.title}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button type="button" onClick={(e) => handleStartRename(e, chat)} className="p-1 rounded hover:bg-black/10 transition"><svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg></button>
                              <button type="button" onClick={(e) => handleDeleteClick(e, chat.id)} className={`p-1 rounded transition ${isConfirmingDelete ? "bg-rose-500 text-white" : "hover:bg-rose-500/20 text-rose-500"}`}>{isConfirmingDelete ? <span className="text-[10px] px-1 font-bold">Del?</span> : <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}</button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        <div className="p-3 border-t flex-none space-y-2" style={{ borderColor: "var(--app-border)", backgroundColor: "var(--app-surface-subtle)" }}>
          <a
            href="https://asad7coder.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-2.5 rounded-xl border px-2.5 py-2 transition hover:-translate-y-px hover:shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--theme-primary)]"
            style={{
              background: "var(--theme-gradient-subtle)",
              borderColor: "var(--theme-primary-border)",
            }}
          >
            <span
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
              style={{ background: "var(--theme-gradient)", color: "var(--theme-contrast-text)" }}
              aria-hidden="true"
            >
              <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-[10px] font-medium" style={{ color: "var(--app-text-muted)" }}>Designed by</span>
              <span className="block truncate text-xs font-bold" style={{ color: "var(--theme-primary)" }}>Asad7Coder</span>
            </span>
            <svg className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--app-text-muted)" }} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5h5m0 0v5m0-5L10 14" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14v4a1 1 0 01-1 1H6a1 1 0 01-1-1V6a1 1 0 011-1h4" />
            </svg>
          </a>
          {chats.length > 0 && (
            <div className="pt-0.5">
              {confirmClearAll ? (
                <div className="flex items-center gap-1.5 p-1.5 rounded-xl border" style={{ backgroundColor: "rgba(244, 63, 94, 0.1)", borderColor: "rgba(244, 63, 94, 0.3)" }}>
                  <span className="text-[11px] font-medium text-rose-400 flex-1">Delete all?</span>
                  <button type="button" onClick={() => { onClearAllChats(); setConfirmClearAll(false); }} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-600 text-white">Yes</button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmClearAll(true)} className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-rose-500 hover:bg-rose-500/10 rounded-xl transition cursor-pointer">Clear All History</button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
