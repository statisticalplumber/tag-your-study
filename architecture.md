# Tag Your Study — Architecture Mindmap

## Project Overview
PDF study annotation tool with AI-powered chat companion. Users highlight text/regions on PDF pages, organize them into tagged sessions, and ask questions via Gemini or local LLM.

---

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Express.js (Node)
- **Database**: SQLite (`study.db`)
- **AI**: Google Gemini API (cloud) / OpenAI-compatible local server (LM Studio)
- **PDF**: pdf.js for rendering and text extraction
- **Styling**: Tailwind CSS

---

## Directory Structure

```
tag-your-study/
├── server.ts                  # Express backend server
├── index.html                 # HTML entry point
├── metadata.json              # Project metadata
├── package.json               # NPM dependencies
├── tsconfig.json              # TypeScript config
├── vite.config.ts             # Vite build config
├── .env.example               # Environment template
├── study.db                   # SQLite database (runtime)
│
├── src/
│   ├── App.tsx                # Main app component & state orchestrator
│   ├── main.tsx               # React entry point
│   ├── index.css              # Global styles
│   ├── types.ts               # All TypeScript interfaces
│   │
│   ├── components/
│   │   ├── CanvasWorkspace.tsx    # PDF viewer + region selection canvas
│   │   ├── ChatSidebar.tsx        # AI chat panel per tag session
│   │   ├── Markdown.tsx           # Client-side markdown renderer
│   │   ├── NavigationSidebar.tsx  # Left nav + provider settings
│   │   └── TagExplorer.tsx        # Tag manager + history sidebar
│   │
│   ├── data/
│   │   └── sampleTextbook.ts      # Mock textbook for offline demo
│   │
│   ├── hooks/
│   │   └── usePdfJs.ts            # pdf.js loader hook
│   │
│   └── utils/
│       └── pdfHelpers.ts          # Canvas crop, text extract, image stitch
```

---

## Component Tree

```
App (state hub)
├── NavigationSidebar      ← Module nav + AI provider config
├── TagExplorer            ← Tag sessions + history CRUD
│   ├── History list (load/delete/save)
│   └── Session tabs (create/reset/select)
├── CanvasWorkspace        ← PDF render + region select + zoom
│   ├── PDF page display
│   ├── Bounding box overlay
│   └── Region manager
└── ChatSidebar            ← AI chat per active tag
    ├── Message list
    ├── Input + send
    └── Markdown renderer
```

---

## Data Flow

```
User selects region on PDF
        │
        ▼
CanvasWorkspace extracts text/image crop
        │
        ▼
Region added to active TagSession.regions[]
        │
        ▼
User sends chat message
        │
        ├──→ Provider = "gemini" → POST /api/gemini/chat → Gemini API
        │
        └──→ Provider = "local"  → POST {localBaseUrl}/chat/completions
```

---

## API Endpoints (server.ts)

| Method | Endpoint            | Description                          |
|--------|---------------------|--------------------------------------|
| POST   | /api/gemini/chat    | Proxy to Gemini multimodal API       |
| GET    | /api/history        | List all saved study sessions        |
| GET    | /api/history/:id    | Get full session detail              |
| POST   | /api/history        | Save/replace a study session         |
| DELETE | /api/history/:id    | Delete a study session               |

---

## Database Schema (SQLite)

```sql
CREATE TABLE study_history (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  pdf_filename    TEXT,
  pdf_base64      TEXT,
  current_page    INTEGER DEFAULT 1,
  sessions_json   TEXT,     -- JSON array of TagSession objects
  created_at      TEXT
);
```

---

## Core Types (types.ts)

| Type              | Purpose                                    |
|-------------------|--------------------------------------------|
| `Rectangle`       | Bounding box coords (x, y, w, h in %)      |
| `SelectedRegion`  | A user-selected PDF region + text/image    |
| `TagSession`      | A tagged group of regions + chat history   |
| `ChatMessage`     | Single chat turn (sender, text, timestamp) |
| `ProviderSettings`| AI provider config (gemini/local)          |
| `HistoryItem`     | Saved session metadata from DB             |

---

## Key Utilities (pdfHelpers.ts)

- `cropCanvasFromPercentage()` — Crop image from canvas by % coords
- `extractPdfTextInRect()` — Extract text within a bounding box
- `combineCropsIntoSingleImage()` — Stitch multiple region crops into one image for AI

---

## Configuration

| Env Var          | Purpose                      |
|------------------|------------------------------|
| `GEMINI_API_KEY` | Google Gemini API key        |
| `NODE_ENV`       | Development vs production    |

Local LLM config set via UI (NavigationSidebar) — base URL + model name.

---

## Default Sessions (pre-loaded in App.tsx)

1. **Core Concepts** (`concept-tag`) — text mode
2. **Formula & Proofs** (`formula-tag`) — text mode
3. **Diagrams & Visuals** (`diagram-tag`) — image mode
4. **Doubts & Questions** (`doubts-tag`) — text mode
