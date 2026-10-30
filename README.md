# ⚡ ChatWithAI

> A fast, stateless AI chat application built with Next.js 16, React 19, and TypeScript. It supports streaming responses from Groq or OpenAI and features a polished, ChatGPT-style interface with advanced markdown rendering, voice input, and zero database overhead.

**[🚀 Live Demo](https://chat-a7c.vercel.app)**

## ✨ Features

- **💬 Stateless Architecture:** No database or authentication layer. Chats live in React memory and reset on refresh; appearance settings are saved in your browser.
- **⚡ Real-time Streaming:** Responses stream from the server using Server-Sent Events (SSE).
- **🎙️ Voice-to-Text Input:** Speak your prompts using the native Web Speech API with real-time transcription.
- **🧮 LaTeX Math Rendering:** Formatted inline and block equations using KaTeX.
- **💻 Syntax Highlighting:** Prism.js integration with “Copy” and “Download” buttons for code blocks.
- **🧭 ChatGPT-Style Minimap:** A right-side navigation tracker to jump between your past questions.
- **📝 Interactive AI Widgets:** AI can generate multiple-choice questions (MCQs) with clickable options.
- **🎨 Beautiful UI/UX:** Multi-chat sidebar, dark/light/system modes, and multiple accent themes.
- **🔒 Secure:** API keys are kept on the server side.

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router)
- **UI Library:** React 19
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4
- **AI Providers:** Groq (default) / OpenAI
- **Advanced Rendering:** KaTeX (math), Prism React Renderer (code), and custom SSE streaming.

## 🚀 Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

Create a `.env.local` file in the project root.

**Using Groq (Fast & Free):**

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b
```

**Using OpenAI:**

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

### 3. Run the App

```bash
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000/)** in your browser.

### 4. Production Build

```bash
npm run build
npm run start
```

## 📁 Project Structure

```text
.
├── app/
│   ├── api/chat/route.ts        # Server-side AI streaming endpoint
│   ├── components/
│   │   ├── ChatSidebar.tsx      # Multi-chat navigation
│   │   ├── MarkdownRenderer.tsx # KaTeX, Prism, tables, and MCQs
│   │   ├── MCQWidget.tsx        # Interactive AI question widgets
│   │   └── SettingsModal.tsx    # Theme customization
│   ├── globals.css              # Tailwind & CSS variables
│   ├── layout.tsx               # Root layout
│   ├── page.tsx                 # Main chat logic & minimap
│   └── types.ts                 # TypeScript interfaces
├── lib/
│   └── types.ts                 # Shared application types
├── .env.local                   # Secret API keys (ignored by Git)
├── package.json                 # Dependencies & scripts
└── next.config.ts               # Next.js configuration
```

## 🧠 How it Works

1. **The Backend (`route.ts`):** Reads your API key securely, calls Groq or OpenAI, and streams the response via SSE.
2. **The Chat Interface (`page.tsx`):** Manages chat state in React, handles the SSE stream, auto-scrolling, voice recognition, and the right-side minimap.
3. **The Renderer (`MarkdownRenderer.tsx`):** Renders markdown, math with KaTeX, code with Prism, tables, and interactive MCQ widgets.

## ⚠️ Security & Deployment

This project keeps API keys server-side. However, for public deployments:

- Add authentication or a password screen.
- Implement rate limiting (e.g., via Vercel Edge Middleware) to prevent API credit abuse.

## ☁️ Deploy on Vercel

1. Push to GitHub.
2. Import to Vercel.
3. Add your `GROQ_API_KEY` to Environment Variables.
4. Deploy!

## 📄 License

MIT License. Built with ❤️ by [Asad7Coder](https://github.com/asad7coder).
