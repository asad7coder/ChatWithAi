Here is the complete, single file. You can click "Copy" in the top right corner of the code block below and paste it directly into your `README.md` file on GitHub.

```markdown
# ⚡ AI Chatbot (Stateless)

> A fast, responsive, and completely stateless AI chat application. Built with Next.js 16, React 19, and Tailwind CSS, powered by Groq or OpenAI.

[![Next.js](https://img.shields.io/badge/Next.js-16.4.3-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.3.0-blue?style=for-the-badge&logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.0-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)

---

## ✨ Features

- **💬 Stateless Architecture:** No database, no logins. Chats are stored purely in React memory and vanish on refresh.
- **⚡ Real-time Streaming:** Responses appear word-by-word using Server-Sent Events (SSE).
- **📁 Multi-Chat Sidebar:** Create, rename, and switch between multiple conversations in the same session.
- **🎨 Beautiful UI/UX:** Includes a theme switcher (Dark/Light mode and multiple accent colors).
- **🤖 Smart Formatting:** Custom Markdown renderer for code blocks, lists, and bold text.
- **🔒 Secure:** API keys are kept safely on the server side.
- **💡 AI Suggestions:** Automatically generates follow-up questions after every reply.

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following installed:
- [Node.js](https://nodejs.org/en/) (v18 or higher)
- An API Key from either **Groq** (recommended for speed/free tier) or **OpenAI**.

---

## 🚀 Getting Started

### 1. Install Dependencies
Open your terminal in the project folder and run:
```bash
npm install
```

### 2. Set Up Environment Variables
Create a `.env.local` file in the root of your project. 

**To use Groq (Fast & Free):**
```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b
```

**To use OpenAI (Alternative):**
```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

> [!IMPORTANT]  
> Never commit your `.env.local` file to GitHub. It is already protected by `.gitignore` by default. If your keys leak, bots will steal them.

### 3. Run the App
Start the development server:
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to start chatting!

### 4. Build for Production
To test the production build locally, run:
```bash
npm run build
npm run start
```

---

## 📁 Project Structure

```text
.
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts        # Backend: Streams AI responses (Secure)
│   ├── components/
│   │   ├── ChatSidebar.tsx     # UI: Sidebar for managing chat sessions
│   │   ├── SettingsModal.tsx   # UI: Theme & color mode toggles
│   │   └── MarkdownRenderer.tsx# UI: Formats AI markdown output
│   ├── globals.css             # Tailwind CSS & global variables
│   ├── layout.tsx              # Root layout (HTML/Body wrapper)
│   ├── page.tsx                # The Brain: Manages state & API calls
│   └── types.ts                # TypeScript interfaces
├── .env.local                  # Your secret API keys (Ignored by Git)
├── package.json                # Dependencies & scripts
└── next.config.ts              # Next.js configuration
```

### 🧠 How it Works

1. **`app/page.tsx` (The Brain):** Manages the entire UI and stores chats using React `useState`. When you send a message, it instantly updates the screen and sends the data to the backend.
2. **`app/api/chat/route.ts` (The Backend):** Receives the message, securely reads your API key from `.env.local`, talks to Groq/OpenAI, and streams the text back to the frontend.
3. **`app/components/MarkdownRenderer.tsx` (The Formatter):** Takes the raw text from the AI and converts it into beautiful, safe HTML (preventing XSS attacks).

---

## ⚠️ Security & Deployment

> [!WARNING]  
> **Public API Cost:** This project has no authentication or rate limiting. If you deploy this publicly and share the link, anyone can use your AI API key and you could be charged money. 

If you plan to deploy this on **Vercel** for public use, we highly recommend adding a simple password screen or using Vercel's built-in rate limiting to prevent abuse.

---

## ☁️ Deploy on Vercel

The easiest way to deploy this Next.js app is to use Vercel:

1. Push your code to a GitHub repository.
2. Go to [Vercel](https://vercel.com/new) and import your repository.
3. Add your `GROQ_API_KEY` (or `OPENAI_API_KEY`) to the **Environment Variables** section in Vercel.
4. Click **Deploy**.
```