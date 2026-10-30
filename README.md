Here is the complete, single file. You can click "Copy" in the top right corner of the code block below and paste it directly into your `README.md` file on GitHub.

```markdown
# ChatWithAI

A modern, stateless AI chat application built with Next.js, React, and TypeScript. It supports streaming responses from Groq or OpenAI and provides a polished interface for multi-chat conversations, markdown rendering, and theme customization.

## Overview

ChatWithAI is designed for fast conversational experiences without a backend database. Chat history is kept in local client state for the current session, which makes it simple to run locally and easy to adapt for prototype or internal tools.

## Features

- Stateless chat flow with no database or authentication layer
- Real-time streaming responses from AI providers
- Multi-chat sidebar with create, rename, and delete actions
- Theme and appearance customization
- Markdown-based message rendering for cleaner AI output
- Follow-up suggestion generation after each response
- Secure server-side API key handling

## Tech Stack

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- OpenAI SDK
- Groq-compatible OpenAI API

## Prerequisites

Before starting, make sure you have:

- Node.js 18 or later
- npm or another package manager
- A valid API key from either Groq or OpenAI

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Create a `.env.local` file in the project root and add one of the following provider configurations.

#### Groq

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b
```

#### OpenAI

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

> Important: never commit your `.env.local` file to version control. Keep API keys private and secure.

### 3. Run the app locally

```bash
npm run dev
```

Then open http://localhost:3000 in your browser.

### 4. Production build

```bash
npm run build
npm run start
```

## Project Structure

```text
.
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts          # AI server route with streaming support
│   ├── components/
│   │   ├── ChatSidebar.tsx       # Chat session navigation and management
│   │   ├── MarkdownRenderer.tsx  # Markdown formatting for assistant responses
│   │   ├── SettingsModal.tsx     # Theme and interface settings
│   │   └── page.tsx              # Main chat interface logic
│   ├── globals.css               # Global styling and theme variables
│   ├── layout.tsx                # App root layout
│   ├── page.tsx                  # Primary page component
│   └── types.ts                  # Shared UI and chat types
├── lib/
│   └── types.ts                  # App-level type definitions
├── public/
├── .env.local                    # Local environment variables (do not commit)
├── eslint.config.mjs             # ESLint configuration
├── next.config.ts                # Next.js configuration
├── package.json                  # Scripts and dependencies
├── tsconfig.json                 # TypeScript configuration
├── README.md                     # Project documentation
└── PROJECT_LEARNING_GUIDE.md     # Additional project notes
```

## Runtime Behavior

The application follows a simple request flow:

1. The user enters a prompt in the chat interface.
2. The frontend sends the message to the `/api/chat` endpoint.
3. The API route validates the request and chooses the active provider.
4. The selected model streams a response back to the client.
5. The frontend updates the chat UI in real time and renders markdown output cleanly.

## Security Notes

This project is intended for local development or controlled internal deployment. If you expose it publicly, be aware that:

- There is no user authentication
- There is no built-in rate limiting
- API usage may incur provider costs

For public deployment, consider adding authentication, rate limiting, or a private hosting setup before sharing the app externally.

## Deployment

The project is ready to deploy on platforms such as Vercel.

1. Push the repository to GitHub.
2. Import the project into Vercel.
3. Add your environment variables in the Vercel dashboard.
4. Deploy the application.

## License

This project is currently unlicensed unless otherwise specified. If you are publishing or sharing it publicly, consider adding a license file to define usage terms.

## Contributing

Contributions are welcome. To improve the project:

1. Fork the repository.
2. Create a feature branch.
3. Make your changes.
4. Run validation and submit a pull request.

```