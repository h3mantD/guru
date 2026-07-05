# Guru

Guru is a Vue + Express learning chat app that lets learners talk to two creator-inspired teaching modes:

- Practical Guru, inspired by Hitesh
- Builder Guru, inspired by Piyush Garg

The app is an educational simulation. It does not claim to be, represent, or speak on behalf of the real creators.

## Submission Links

- Live website: add deployed URL here
- Public GitHub repository: add repository URL here

## What It Does

- Provides a responsive chat UI for desktop and mobile.
- Switches between Practical Guru and Builder Guru.
- Uses real creator avatars stored in `src/assets/`.
- Supports answer depth controls: Short, Normal, and Deep.
- Adds quick follow-up actions for simpler explanations, examples, code, and quizzes.
- Keeps OpenAI and YouTube API keys on the Express server.
- Serves the built Vue app from Express after running the build.
- Suggests relevant YouTube videos from the selected creator's channels after reading the full chat context.
- Verifies that a requested YouTube video belongs to the selected creator channel before showing metadata.

## Tech Stack

- Vue 3 and Vite
- Express 5
- OpenAI Responses API
- YouTube Data API v3
- DOMPurify and Marked for safe markdown rendering
- Manrope and JetBrains Mono via `@fontsource`
- Lucide Vue icons
- Vitest for the local ignored test suite

## Personas

| App Mode | Creator Inspiration | Channel Coverage |
| --- | --- | --- |
| Practical Guru | Hitesh | `@HiteshCodeLab`, `@chaiaurcode` |
| Builder Guru | Piyush Garg | `@piyushgargdev` |

Persona prompts are defined on the server in `server/personas.js`. The frontend display names are defined in `src/branding.js`.

## Persona Data Preparation

The persona behavior was prepared from public creator material: official websites, public YouTube teaching content, and public social posts. The notes were converted into compact prompt profiles that describe tone, teaching flow, language style, topic focus, and safety boundaries.

Each profile includes:

- Source notes
- Tone tags
- Teaching-style guidance
- Vocabulary and speech-style hints
- Boundaries to keep the app as a learning simulation

The app stores these profiles in `server/personas.js` and sends only the selected profile with the recent chat history when generating a reply.

## Requirements

- Node.js 20 or newer
- npm
- OpenAI API key
- YouTube Data API key for video features

## Environment

Copy the example file and add real keys:

```bash
cp .env.example .env
```

```env
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4.1-mini
YT_API_KEY=your_youtube_data_api_key_here
PORT=3000
```

`OPENAI_API_KEY` and `YT_API_KEY` are read only by the Express server. They are never exposed to browser code.

## Install

```bash
npm install
```

## Run Locally

Start the backend:

```bash
npm run server
```

Start the Vite dev server in another terminal:

```bash
npm run dev
```

Open the Vite URL shown in the terminal, usually:

```text
http://localhost:5173
```

Vite proxies `/api/*` requests to `http://localhost:3000`.

## Build And Run

Build the frontend:

```bash
npm run build
```

Start the Express server:

```bash
npm start
```

After `dist/` exists, Express serves both the Vue app and the API from:

```text
http://localhost:3000
```

## API Endpoints

```http
GET /api/health
```

Returns a basic health check.

```http
GET /api/personas
```

Returns the supported persona list.

```http
POST /api/chat
Content-Type: application/json

{
  "personaId": "hitesh",
  "answerDepth": "normal",
  "messages": [
    { "role": "user", "content": "Explain Redis caching simply" }
  ]
}
```

Generates a persona-style teaching response through the OpenAI Responses API.

```http
POST /api/youtube/recommendations
Content-Type: application/json

{
  "personaId": "piyush",
  "messages": [
    { "role": "user", "content": "How do I scale WebSockets with Redis?" }
  ]
}
```

Builds a key context from the chat, extracts technical keywords, searches the selected creator's configured channel or channels, fetches video details, cross-checks relevance, and returns only videos that match the conversation.

```http
POST /api/youtube/video-details
Content-Type: application/json

{
  "personaId": "hitesh",
  "videoUrl": "https://www.youtube.com/watch?v=VIDEO_ID"
}
```

Verifies that the video belongs to one of the selected persona's configured channels and returns YouTube metadata. The YouTube Data API does not provide the full spoken transcript, so the app does not pretend to perform transcript-level review unless the user provides transcript text separately.

## Project Structure

```text
server/
  app.js             Express app, API routes, built app serving
  chatService.js     OpenAI Responses API integration
  context.js         Message cleanup and recent-context trimming
  index.js           Server entry point
  openaiClient.js    OpenAI client creation
  personas.js        Persona prompts and source notes
  tools.js           Prompt helper functions
  youtubeService.js  YouTube lookup, recommendation, and verification logic

src/
  App.vue                  Main application shell
  api/chatApi.js           Browser API client
  assets/                  Creator avatar images
  branding.js              Guru app names and subtitles
  chatActions.js           Welcome messages, quick actions, video intent helpers
  components/              Chat input, chat window, persona selector, brand icon
  utils/                   Markdown rendering and scroll helpers
  styles.css               Responsive UI styling

docs/
  context-management.md
  prompt-strategy.md
  sample-conversations.md
```

## Documentation

- Persona data preparation: summarized in this README.
- [Prompt strategy](docs/prompt-strategy.md): explains the roleplay prompt layers, style boundaries, answer-depth handling, and YouTube tool prompting.
- [Context management](docs/context-management.md): explains recent-message trimming for chat and keyword context extraction for video recommendations.
- [Sample conversations](docs/sample-conversations.md): demonstrates Practical Guru and Builder Guru conversations.

## Testing And Verification

Run the available local test suite:

```bash
npm test
```

The `local-tests/` directory is intentionally gitignored for this submission workflow. When it is present locally, `npm test` runs the Vitest suite. If the ignored directory is not present in a clean checkout, the test command exits successfully because there are no submitted tests to run.

Build verification:

```bash
npm run build
```

The UI has also been checked manually with Playwright at desktop and mobile widths, including the chat composer, persona controls, quick-action toolbar, and mobile video resource tray.

## Submission Checklist

- App name is Guru across the browser UI and server startup message.
- User-facing personas are Practical Guru and Builder Guru.
- There are no framework-starter references in the UI.
- API secrets stay server-side.
- Built app is served by Express.
- Mobile layout includes a closable video resources tray.
- Suggested videos are based on full chat context and relevance checks.
- YouTube video review verifies creator channel ownership before showing metadata.

## Limitations

- The app uses public teaching-style signals and prompt guidance; it is not an official creator product.
- YouTube recommendation quality depends on the YouTube Data API search results and available metadata.
- Video detail review is metadata-based unless the user supplies transcript or lesson text.
- The OpenAI model can be changed with `OPENAI_MODEL`.
