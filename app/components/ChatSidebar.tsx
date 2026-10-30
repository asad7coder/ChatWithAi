"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ChatSession, ColorMode, ThemeId } from "../types";

interface ChatSidebarProps {
  isOpen: boolean;
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
  isOpen, onCloseMobile, chats, activeChatId, onSelectChat, onNewChat, onDeleteChat, onRenameChat, onClearAllChats,
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
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity" 
          onClick={onCloseMobile} 
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col w-[260px] md:w-[280px] shrink-0 border-r transition-all duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full md:-ml-[280px]"
        }`} 
        style={{ backgroundColor: "var(--app-surface)", borderColor: "var(--app-border)", color: "var(--app-text)" }}
      >
        {/* Header (No double toggle button) */}
        <div className="flex items-center justify-between p-4 flex-none">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg shadow-sm" style={{ background: "var(--theme-gradient)", color: "var(--theme-contrast-text)" }}>
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight block leading-tight">AI Workspace</span>
            </div>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="px-3 pb-3 flex-none">
          <button 
            type="button" 
            onClick={() => { onNewChat(); onCloseMobile(); }} 
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition hover:opacity-80 active:scale-[0.98] cursor-pointer" 
            style={{ backgroundColor: "var(--app-surface-subtle)", borderColor: "var(--app-border)", color: "var(--app-text)" }}
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span>New Chat</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="px-3 pb-2 flex-none">
          <div className="relative flex items-center rounded-xl border px-3 py-2 text-xs transition focus-within:ring-1 focus-within:ring-[var(--theme-primary)]" style={{ backgroundColor: "var(--app-surface)", borderColor: "var(--app-border)" }}>
            <svg className="h-3.5 w-3.5 mr-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
              placeholder="Search chats..." 
              className="w-full bg-transparent outline-none text-[13px] placeholder:text-[var(--app-text-dim)]" 
              style={{ color: "var(--app-text)" }} 
            />
          </div>
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {chats.length === 0 ? (
            <div className="text-center py-10 px-4">
              <p className="text-[13px] font-medium" style={{ color: "var(--app-text-muted)" }}>No conversations yet</p>
            </div>
          ) : filteredChats.length === 0 ? (
            <div className="text-center py-8 text-[13px]" style={{ color: "var(--app-text-muted)" }}>No chats found.</div>
          ) : (
            Object.entries(groupedChats).map(([groupTitle, groupItems]) => {
              if (groupItems.length === 0) return null;
              return (
                <div key={groupTitle} className="space-y-1">
                  <div className="px-2 py-1 text-[11px] font-semibold tracking-wider uppercase" style={{ color: "var(--app-text-dim)" }}>{groupTitle}</div>
                  {groupItems.map((chat) => {
                    const isActive = chat.id === activeChatId;
                    const isEditing = editingId === chat.id;
                    const isConfirmingDelete = deletingId === chat.id;

                    return (
                      <div 
                        key={chat.id} 
                        onClick={() => { if (!isEditing) { onSelectChat(chat.id); onCloseMobile(); } }} 
                        className={`group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-[13px] transition cursor-pointer ${
                          isActive ? "font-medium" : "hover:bg-black/5 dark:hover:bg-white/5"
                        }`} 
                        style={{ 
                          backgroundColor: isActive ? "var(--app-surface-subtle)" : "transparent", 
                          color: isActive ? "var(--app-text)" : "var(--app-text-muted)" 
                        }}
                      >
                        {isEditing ? (
                          <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
                            <input 
                              type="text" 
                              value={editTitle} 
                              onChange={(e) => setEditTitle(e.target.value)} 
                              onKeyDown={(e) => { if (e.key === "Enter") handleSaveRename(e, chat.id); if (e.key === "Escape") setEditingId(null); }} 
                              autoFocus 
                              className="w-full bg-[var(--app-surface)] border border-[var(--app-border)] rounded px-2 py-1 text-xs outline-none" 
                            />
                            <button type="button" onClick={(e) => handleSaveRename(e, chat.id)} className="px-2 py-1 rounded bg-[var(--theme-primary)] text-[var(--theme-contrast-text)] text-[10px] font-bold">✓</button>
                          </div>
                        ) : (
                          <>
                            <span className="truncate pr-2">{chat.title}</span>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                              <button type="button" onClick={(e) => handleStartRename(e, chat)} className="p-1 rounded transition hover:bg-[var(--app-surface)]" style={{ color: "var(--app-text-muted)" }}>
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button type="button" onClick={(e) => handleDeleteClick(e, chat.id)} className={`p-1 rounded transition ${isConfirmingDelete ? "bg-rose-500 text-white" : "hover:text-rose-500 hover:bg-[var(--app-surface)]"}`}>
                                {isConfirmingDelete ? <span className="text-[10px] px-1 font-bold">Del?</span> : <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>}
                              </button>
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

        {/* Bottom Footer - Profile & Clear */}
        <div className="p-3 border-t flex-none space-y-3" style={{ borderColor: "var(--app-border)" }}>
          
          {/* Profile Card */}
          <a
            href="https://asad7coder.vercel.app/"
            target="_blank"
            rel="noreferrer"
            className="group flex items-center gap-3 rounded-xl p-2 transition hover:bg-[var(--app-surface-subtle)]"
          >
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg shadow-sm"
              style={{ background: "var(--theme-gradient)", color: "var(--theme-contrast-text)" }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block text-[11px] font-medium" style={{ color: "var(--app-text-muted)" }}>Designed by</span>
              <span className="block truncate text-[13px] font-semibold" style={{ color: "var(--app-text)" }}>Asad7Coder</span>
            </span>
            <svg className="h-3.5 w-3.5 shrink-0 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: "var(--app-text-muted)" }}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5h5m0 0v5m0-5L10 14" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 14v4a1 1 0 01-1 1H6a1 1 0 01-1-1V6a1 1 0 011-1h4" />
            </svg>
          </a>

          {/* Clear All History */}
          {chats.length > 0 && (
            <div>
              {confirmClearAll ? (
                <div className="flex items-center gap-1.5 p-1.5 rounded-lg border" style={{ backgroundColor: "rgba(244, 63, 94, 0.1)", borderColor: "rgba(244, 63, 94, 0.3)" }}>
                  <span className="text-[11px] font-medium text-rose-500 flex-1 pl-1">Delete all?</span>
                  <button type="button" onClick={() => { onClearAllChats(); setConfirmClearAll(false); }} className="px-2 py-1 rounded-md text-[10px] font-bold bg-rose-600 text-white hover:bg-rose-700">Yes</button>
                  <button type="button" onClick={() => setConfirmClearAll(false)} className="px-2 py-1 rounded-md text-[10px] font-medium bg-transparent text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800">No</button>
                </div>
              ) : (
                <button type="button" onClick={() => setConfirmClearAll(true)} className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] font-medium text-rose-500 hover:bg-rose-500/10 rounded-lg transition cursor-pointer">
                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  Clear history
                </button>
              )}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}