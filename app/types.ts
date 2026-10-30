export type MessageRole = "user" | "assistant";

export interface Message {
  id: string;
  role: MessageRole;
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

export type ThemeId =
  | "emerald"
  | "violet"
  | "amber"
  | "crimson"
  | "cyan"
  | "lime"
  | "indigo"
  | "slate"
  | "orchid"
  | "orange";

export type ColorMode = "dark" | "light" | "system";

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  primaryColor: string;
  accentColor: string;
}

export const AVAILABLE_THEMES: ThemeConfig[] = [
  {
    id: "emerald",
    name: "Emerald Aurora",
    description: "Lush botanical greens & mint highlights",
    primaryColor: "#10b981",
    accentColor: "#059669",
  },
  {
    id: "violet",
    name: "Violet Nebula",
    description: "Deep mystic purple & neon amethyst",
    primaryColor: "#8b5cf6",
    accentColor: "#7c3aed",
  },
  {
    id: "amber",
    name: "Sunset Amber",
    description: "Warm golden glow & copper tones",
    primaryColor: "#f59e0b",
    accentColor: "#d97706",
  },
  {
    id: "crimson",
    name: "Ruby Crimson",
    description: "Passionate ruby red & vibrant rose",
    primaryColor: "#f43f5e",
    accentColor: "#e11d48",
  },
  {
    id: "cyan",
    name: "Oceanic Cyan",
    description: "Crisp tropical teal & electric azure",
    primaryColor: "#06b6d4",
    accentColor: "#0891b2",
  },
  {
    id: "lime",
    name: "Cyber Lime",
    description: "Futuristic high-energy neon citrus",
    primaryColor: "#84cc16",
    accentColor: "#65a30d",
  },
  {
    id: "indigo",
    name: "Midnight Sapphire",
    description: "Deep oceanic royal indigo & sapphire",
    primaryColor: "#6366f1",
    accentColor: "#4f46e5",
  },
  {
    id: "slate",
    name: "Monochrome Obsidian",
    description: "Ultra-sleek neutral graphite & silver",
    primaryColor: "#71717a",
    accentColor: "#52525b",
  },
  {
    id: "orchid",
    name: "Blush Orchid",
    description: "Vibrant fuchsia, magenta & orchid",
    primaryColor: "#d946ef",
    accentColor: "#c026d3",
  },
  {
    id: "orange",
    name: "Solar Flame",
    description: "Radiant tangerine & solar fire",
    primaryColor: "#f97316",
    accentColor: "#ea580c",
  },
];
