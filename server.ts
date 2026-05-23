import crypto from 'crypto';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON body parsed payload handling with matching limit settings
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize SQLite Database
const dbPath = path.join(process.cwd(), 'study.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ SQLite connection failed:', err);
  } else {
    console.log('📂 SQLite database active at:', dbPath);
    db.run(`
      CREATE TABLE IF NOT EXISTS study_history (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        pdf_filename TEXT,
        pdf_base64 TEXT,
        current_page INTEGER DEFAULT 1,
        sessions_json TEXT,
        created_at TEXT
      )
    `, (tableErr) => {
      if (tableErr) {
        console.error('❌ Error creating study_history table:', tableErr);
      } else {
        console.log('✅ SQLite tables configured successfully.');
      }
    });
  }
});

// Lazy initialize Gemini API client (admin key from env)
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;

if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
  });
}

// --- Auth helpers ---

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
const USER_PASSWORD = process.env.USER_PASSWORD || '';
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me-in-production';

function generateToken(role: string): string {
  const payload = Buffer.from(JSON.stringify({ role, exp: Date.now() + 86400000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

function verifyToken(token: string): { role: string } | null {
  try {
    const dot = token.lastIndexOf('.');
    if (dot === -1) return null;
    const payload = token.slice(0, dot);
    const sig = token.slice(dot + 1);
    const expected = crypto.createHmac('sha256', JWT_SECRET).update(payload).digest('hex');
    if (sig !== expected) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.exp < Date.now()) return null;
    return { role: data.role };
  } catch {
    return null;
  }
}

interface AuthRequest extends express.Request {
  user?: { role: string };
}

function requireAuth(req: AuthRequest, res: express.Response, next: express.NextFunction) {
  const auth = req.headers.authorization as string | undefined;
  if (!auth?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required.' });
  }
  const user = verifyToken(auth.slice(7));
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session. Please log in again.' });
  }
  req.user = user;
  next();
}

// POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { password, role } = req.body;

  if (!password || !role) {
    return res.status(400).json({ error: 'Role and password are required.' });
  }

  if (role === 'admin' && ADMIN_PASSWORD && password === ADMIN_PASSWORD) {
    return res.json({ token: generateToken('admin'), role: 'admin' });
  }
  if (role === 'user' && USER_PASSWORD && password === USER_PASSWORD) {
    return res.json({ token: generateToken('user'), role: 'user' });
  }

  return res.status(401).json({ error: 'Invalid credentials.' });
});

// REST Endpoint: Gemini Multimodal Chat Proxy
app.post('/api/gemini/chat', requireAuth, async (req: AuthRequest, res) => {
  try {
    const { prompt, extractedText, image, history, userApiKey, userModel } = req.body;
    const { role } = req.user!;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required.' });
    }

    let geminiInstance: GoogleGenAI | null = null;
    let modelName = 'gemini-3.5-flash';

    if (role === 'user') {
      if (!userApiKey || userApiKey.trim() === '') {
        return res.status(400).json({
          error: 'Your Gemini API key is not set. Please add it under AI Engine settings.',
        });
      }
      geminiInstance = new GoogleGenAI({
        apiKey: userApiKey.trim(),
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
      });
      modelName = userModel?.trim() || 'gemini-2.0-flash';
    } else {
      // Admin: use server-side env key
      const currentApiKey = process.env.GEMINI_API_KEY || apiKey;
      if (!ai && currentApiKey && currentApiKey !== 'MY_GEMINI_API_KEY') {
        ai = new GoogleGenAI({
          apiKey: currentApiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });
      }
      geminiInstance = ai;
    }

    if (!geminiInstance) {
      return res.status(503).json({
        error: 'Gemini API Key is not configured. Please supply a valid GEMINI_API_KEY under Settings > Secrets to continue.',
      });
    }

    const systemInstruction = `You are a helpful education chatbot specializing in analyzing segments of PDF study materials.
You are given specific selections from a PDF file that the student has pinpointed.
You are to answer questions based on the provided material with extreme accuracy, explaining concepts clearly.
If the material is a scanned image, you will see a merged cropped image of the selected regions.
If the material is text, you will see the extracted text from the selected regions.
Provide rich, high-quality Markdown responses with clean formatting, bullet points, study guides, and highlight math or scientific formulas nicely using bolding or inline blocks. Keep explanations structural, visual, and highly student-centric.`;

    const contents: any[] = [];

    if (history && Array.isArray(history) && history.length > 0) {
      for (const turn of history) {
        contents.push({
          role: turn.role === 'user' ? 'user' : 'model',
          parts: [{ text: turn.text }],
        });
      }
    }

    const currentParts: any[] = [];

    if (extractedText) {
      currentParts.push({
        text: `[SYSTEM CONTEXT - EXTRACTED TEXT FROM PDF SEPARATE REGIONS]:\n${extractedText}`,
      });
    }

    if (image) {
      const match = image.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        const mimeType = match[1];
        const data = match[2];
        currentParts.push({ inlineData: { mimeType, data } });
        currentParts.push({
          text: `[SYSTEM CONTEXT - ATTACHED VISUAL CRIPPLED REGIONS]: The image item attached above represents the merged horizontal snapshot of the student's selected regions, stitched together for logical visual continuity. Refer to it directly when discussing graphs, diagrams, and formulas.`,
        });
      }
    }

    currentParts.push({ text: prompt });

    contents.push({ role: 'user', parts: currentParts });

    const response = await geminiInstance.models.generateContent({
      model: modelName,
      contents,
      config: {
        systemInstruction,
        temperature: 0.25,
      },
    });

    return res.json({ text: response.text });
  } catch (error: any) {
    console.error('Gemini API Error in proxy server:', error);
    return res.status(500).json({
      error: error.message || 'An unexpected error occurred during AI processing.',
    });
  }
});

// GET /api/history - Retrieve all saved textbook interactions (metadata list without binary PDF blobs)
app.get('/api/history', requireAuth, (req, res) => {
  db.all(
    'SELECT id, name, pdf_filename, current_page, created_at FROM study_history ORDER BY created_at DESC',
    [],
    (err, rows) => {
      if (err) {
        console.error('SQLite read error:', err);
        return res.status(500).json({ error: 'Failed to query student study histories.' });
      }
      res.json(rows);
    }
  );
});

// GET /api/history/:id - Retrieve complete history session with full annotations, regions, and pdf binary
app.get('/api/history/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  db.get('SELECT * FROM study_history WHERE id = ?', [id], (err, row) => {
    if (err) {
      console.error('SQLite read item error:', err);
      return res.status(500).json({ error: 'Failed to load study history payload.' });
    }
    if (!row) {
      return res.status(404).json({ error: 'Selected classroom history state not found.' });
    }
    res.json(row);
  });
});

// POST /api/history - Insert or complete replace a study record inside SQLite
app.post('/api/history', requireAuth, (req, res) => {
  const { id, name, pdf_filename, pdf_base64, current_page, sessions } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Please supply a real nickname or name for the study history entry.' });
  }

  const cleanId = id || `hist-${Date.now()}`;
  const sessionsJson = JSON.stringify(sessions || []);
  const createdAt = new Date().toISOString();

  db.run(
    `INSERT OR REPLACE INTO study_history (id, name, pdf_filename, pdf_base64, current_page, sessions_json, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [cleanId, name.trim(), pdf_filename || null, pdf_base64 || null, current_page || 1, sessionsJson, createdAt],
    function (err) {
      if (err) {
        console.error('SQLite insert error:', err);
        return res.status(500).json({ error: 'Could not write study history record to SQLite database.' });
      }
      res.json({ success: true, id: cleanId });
    }
  );
});

// DELETE /api/history/:id - Safely purge interaction state
app.delete('/api/history/:id', requireAuth, (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM study_history WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('SQLite delete error:', err);
      return res.status(500).json({ error: 'Could not purge study interaction.' });
    }
    res.json({ success: true, affectedRows: this.changes });
  });
});

// Vercel serverless handler
export default app;

// Local development: start Express server directly
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  initServer().catch((err) => {
    console.error('Fatal initialization error in Furian server boot:', err);
  });
}

async function initServer() {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Furian - Education server successfully active at http://0.0.0.0:${PORT}`);
  });
}
