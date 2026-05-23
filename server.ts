import crypto from 'crypto';
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = 3000;

// Enable JSON body parsed payload handling with matching limit settings
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

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

// Vercel serverless handler
export default function handler(req: any, res: any) {
  return app(req, res);
}

// Local development: start Express server directly
if (!process.env.VERCEL) {
  initServer().catch((err) => {
    console.error('Fatal initialization error in Furian server boot:', err);
  });
}

async function initServer() {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Furian - Education server successfully active at http://0.0.0.0:${PORT}`);
  });
}
