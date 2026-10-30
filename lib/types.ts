// types.ts

export type ColorMode = "dark" | "light" | "system";

export type ThemeId =
    | "emerald"
    | "sky"
    | "violet"
    | "rose"
    | "amber"
    | "slate"
    | "teal"
    | "indigo";

export interface ThemeOption {
    id: ThemeId;
    name: string;
    swatch: string;
}

export const AVAILABLE_THEMES: ThemeOption[] = [
    { id: "emerald", name: "Emerald", swatch: "#10b981" },
    { id: "sky", name: "Sky", swatch: "#0ea5e9" },
    { id: "violet", name: "Violet", swatch: "#8b5cf6" },
    { id: "rose", name: "Rose", swatch: "#f43f5e" },
    { id: "amber", name: "Amber", swatch: "#f59e0b" },
    { id: "slate", name: "Slate", swatch: "#64748b" },
    { id: "teal", name: "Teal", swatch: "#14b8a6" },
    { id: "indigo", name: "Indigo", swatch: "#6366f1" },
];

export const DEFAULT_THEME: ThemeId = "emerald";
export const DEFAULT_MODE: ColorMode = "dark";

export interface Message {
    id: string;
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: string;
    suggestions?: string[];
    isStreaming?: boolean;
}

export interface ChatSession {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messages: Message[];
}