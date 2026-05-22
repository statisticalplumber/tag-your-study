import { useState, useEffect, useCallback } from 'react';
import { NavigationSidebar } from './components/NavigationSidebar';
import { TagExplorer } from './components/TagExplorer';
import { CanvasWorkspace } from './components/CanvasWorkspace';
import { ChatSidebar } from './components/ChatSidebar';
import { LoginPage } from './components/LoginPage';
import { TagSession, ChatMessage, ProviderSettings, HistoryItem, AuthState, UserRole } from './types';
import { combineCropsIntoSingleImage } from './utils/pdfHelpers';
import { usePdfJs } from './hooks/usePdfJs';

// Helper to convert in-browser File objects to Base64 strings for SQLite persistence
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1] || result;
      resolve(base64Data);
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

// Pre-initialize standard classroom study tags to provide an outstanding immediate playground out of the box
const DEFAULT_SESSIONS: TagSession[] = [
  {
    id: 'concept-tag',
    name: '🧠 Core Concepts',
    color: 'border-cyan-500 bg-cyan-500/10 text-cyan-800',
    themeColor: '#06b6d4',
    regions: [],
    chatHistory: [],
    selectionMode: 'text',
    isProcessing: false,
    isDefault: true,
    notes: '',
  },
  {
    id: 'formula-tag',
    name: '📐 Formula & Proofs',
    color: 'border-emerald-500 bg-emerald-500/10 text-emerald-800',
    themeColor: '#10b981',
    regions: [],
    chatHistory: [],
    selectionMode: 'text',
    isProcessing: false,
    isDefault: true,
    notes: '',
  },
  {
    id: 'diagram-tag',
    name: '📊 Diagrams & Visuals',
    color: 'border-amber-500 bg-amber-500/10 text-amber-800',
    themeColor: '#f59e0b',
    regions: [],
    chatHistory: [],
    selectionMode: 'image',
    isProcessing: false,
    isDefault: true,
    notes: '',
  },
  {
    id: 'doubts-tag',
    name: '❓ Doubts & Questions',
    color: 'border-rose-500 bg-rose-500/10 text-rose-800',
    themeColor: '#f43f5e',
    regions: [],
    chatHistory: [],
    selectionMode: 'text',
    isProcessing: false,
    isDefault: true,
    notes: '',
  },
];

const DEFAULT_PROVIDER_SETTINGS: ProviderSettings = {
  provider: 'gemini',
  localBaseUrl: 'http://localhost:1234/v1',
  localModel: 'lmstudio',
  userGeminiApiKey: '',
  userGeminiModel: 'gemini-2.0-flash',
};

function loadProviderSettings(): ProviderSettings {
  try {
    const saved = localStorage.getItem('furian_provider');
    if (saved) return { ...DEFAULT_PROVIDER_SETTINGS, ...JSON.parse(saved) };
  } catch {}
  return DEFAULT_PROVIDER_SETTINGS;
}

function loadAuthState(): AuthState {
  try {
    const saved = localStorage.getItem('furian_auth');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.token && parsed.role) {
        return { isAuthenticated: true, role: parsed.role, token: parsed.token };
      }
    }
  } catch {}
  return { isAuthenticated: false, role: null, token: null };
}

export default function App() {
  const [authState, setAuthState] = useState<AuthState>(loadAuthState);
  const [sessions, setSessions] = useState<TagSession[]>(DEFAULT_SESSIONS);
  const [activeSessionId, setActiveSessionId] = useState<string>('concept-tag');
  const [isChatOpen, setIsChatOpen] = useState<boolean>(false);
  const [currentModuleId, setCurrentModuleId] = useState<string>('precision-pdf');
  const [providerSettings, setProviderSettings] = useState<ProviderSettings>(loadProviderSettings);

  // Lifted Workspace Document States
  const [pdfFile, setPdfFile] = useState<File | { name: string; base64: string } | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // SQLite interaction history state
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [activeHistoryId, setActiveHistoryId] = useState<string | null>(null);

  // Trigger loading script core for PDF page renders
  const { isReady: pdfjsReady } = usePdfJs();

  // Persist provider settings to localStorage
  useEffect(() => {
    localStorage.setItem('furian_provider', JSON.stringify(providerSettings));
  }, [providerSettings]);

  // --- Auth handlers ---

  const handleLogin = (token: string, role: UserRole) => {
    const state: AuthState = { isAuthenticated: true, role, token };
    setAuthState(state);
    localStorage.setItem('furian_auth', JSON.stringify({ token, role }));
  };

  const handleLogout = useCallback(() => {
    setAuthState({ isAuthenticated: false, role: null, token: null });
    localStorage.removeItem('furian_auth');
  }, []);

  // Authenticated fetch helper — auto-attaches bearer token and handles session expiry
  const apiFetch = useCallback(async (url: string, options: RequestInit = {}): Promise<Response> => {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string> || {}),
    };
    if (options.body && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    if (authState.token) {
      headers['Authorization'] = `Bearer ${authState.token}`;
    }
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401) {
      handleLogout();
      throw new Error('Session expired. Please log in again.');
    }
    return response;
  }, [authState.token, handleLogout]);

  // Load and refresh list of saved histories from SQLite database
  const fetchHistory = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/history?_t=${Date.now()}`);
      if (res.ok) {
        const data = await res.json();
        setHistoryList(data);
      }
    } catch (err) {
      console.error('Failed to parse history list:', err);
    }
  }, [apiFetch]);

  useEffect(() => {
    if (authState.isAuthenticated) {
      fetchHistory();
    }
  }, [authState.isAuthenticated, fetchHistory]);

  // Save current PDF layout, active tags, selection coords, and companion dialogues to SQLite base
  const handleSaveSession = async (customName: string) => {
    try {
      let pdfBase64: string | null = null;
      let pdfFilename: string | null = null;

      if (pdfFile) {
        pdfFilename = pdfFile.name;
        if (pdfFile instanceof File) {
          pdfBase64 = await fileToBase64(pdfFile);
        } else if ('base64' in pdfFile) {
          pdfBase64 = pdfFile.base64;
        }
      }

      const payload = {
        name: customName,
        pdf_filename: pdfFilename,
        pdf_base64: pdfBase64,
        current_page: currentPage,
        sessions: sessions,
      };

      const res = await apiFetch('/api/history', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Save endpoint returned connection rejection.');
      }

      await fetchHistory();
    } catch (err) {
      console.error('Database preservation failed:', err);
    }
  };

  // Restore previous classroom milestone layout
  const handleLoadHistory = async (id: string) => {
    try {
      const res = await apiFetch(`/api/history/${id}?_t=${Date.now()}`);
      if (!res.ok) throw new Error('Failed to retrieve matching history details.');
      const data = await res.json();

      if (data.pdf_base64) {
        setPdfFile({
          name: data.pdf_filename || 'restored_lecture.pdf',
          base64: data.pdf_base64,
        });
      } else {
        setPdfFile(null);
      }

      setCurrentPage(data.current_page || 1);

      if (data.sessions_json) {
        const parsedTags = JSON.parse(data.sessions_json);
        setSessions(parsedTags);
        if (parsedTags.length > 0) {
          setActiveSessionId(parsedTags[0].id);
        }
      }

      setActiveHistoryId(data.id);
    } catch (err) {
      console.error('State extraction failure:', err);
    }
  };

  // Purge standard milestone
  const handleDeleteHistory = async (id: string) => {
    try {
      const res = await apiFetch(`/api/history/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (activeHistoryId === id) {
          setActiveHistoryId(null);
        }
        await fetchHistory();
      }
    } catch (err) {
      console.error('Milestone deletion failure:', err);
    }
  };

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  // Update session generic state
  const updateActiveSession = (updater: (s: TagSession) => TagSession) => {
    setSessions((oldSessions) =>
      oldSessions.map((s) => (s.id === activeSessionId ? updater(s) : s))
    );
  };

  // Select a different tag and open context session
  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
    setIsChatOpen(true);
  };

  // Reset a tag's active bounding boxes & dialogues
  const handleResetSession = (id: string) => {
    setSessions((oldSessions) =>
      oldSessions.map((s) => {
        if (s.id === id) {
          return { ...s, regions: [], chatHistory: [], isProcessing: false };
        }
        return s;
      })
    );
  };

  // Update quick notes for a tag (persisted via sessions_json on next save)
  const handleUpdateTagNotes = (sessionId: string, notes: string) => {
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, notes } : s)));
  };

  // Create customized study tags at runtime
  const handleCreateSession = (name: string, colorClass: string, themeHex: string) => {
    const cleanId = `custom-tag-${Date.now()}`;
    const newSession: TagSession = {
      id: cleanId,
      name: `🏷️ ${name}`,
      color: `border-[1.5px] ${colorClass}`,
      themeColor: themeHex,
      regions: [],
      chatHistory: [],
      selectionMode: 'text',
      isProcessing: false,
    };
    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(cleanId);
    setIsChatOpen(true);
  };

  // Dispatch a question to the server-side proxy or local OpenAI compatible engine
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || activeSession.isProcessing) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'student',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    updateActiveSession((old) => ({
      ...old,
      chatHistory: [...old.chatHistory, userMessage],
      isProcessing: true,
    }));

    try {
      const extractedTextBuffer = activeSession.regions
        .filter((r) => r.text && r.text.trim() !== '')
        .map(
          (r, idx) => `--- SELECTION snip_0${idx + 1} (Page ${r.pageNumber}) ---\n${r.text}`
        )
        .join('\n\n');

      let compositeB64 = '';
      const selectedImages = activeSession.regions
        .map((r) => r.image)
        .filter((img): img is string => !!img);

      if (activeSession.selectionMode === 'image' && selectedImages.length > 0) {
        compositeB64 = await combineCropsIntoSingleImage(selectedImages);
      }

      let responseText = '';

      if (providerSettings.provider === 'local') {
        const systemInstruction = `You are a helpful education chatbot specializing in analyzing segments of PDF study materials.
You are given specific selections from a PDF file that the student has pinpointed.
You are to answer questions based on the provided material with extreme accuracy, explaining concepts clearly.
If the material is a scanned image, you will see a merged cropped image of the selected regions in raw base64 context.
If the material is text, you will see the extracted text from the selected regions.
Provide rich high-quality Markdown responses with clean formatting.`;

        const messages: any[] = [{ role: 'system', content: systemInstruction }];

        activeSession.chatHistory.forEach((msg) => {
          messages.push({
            role: msg.sender === 'student' ? 'user' : 'assistant',
            content: msg.text,
          });
        });

        let currentPromptContent: any = text.trim();
        if (extractedTextBuffer) {
          currentPromptContent += `\n\n[STUDY MATERIAL REGIONS COVERED]:\n${extractedTextBuffer}`;
        }

        if (compositeB64) {
          messages.push({
            role: 'user',
            content: [
              { type: 'text', text: currentPromptContent },
              { type: 'image_url', image_url: { url: compositeB64 } }
            ]
          });
        } else {
          messages.push({ role: 'user', content: currentPromptContent });
        }

        const localRes = await fetch(`${providerSettings.localBaseUrl}/chat/completions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: providerSettings.localModel || 'lmstudio',
            messages,
            temperature: 0.25,
          }),
        });

        if (!localRes.ok) {
          const textError = await localRes.text();
          throw new Error(`Failed to request local model server. Ensure your local server (LM Studio/Llama.cpp) is running at ${providerSettings.localBaseUrl} with active model and CORS enabled.\nDetail: ${textError.slice(0, 200)}`);
        }

        const responseData = await localRes.json();
        responseText = responseData.choices?.[0]?.message?.content || 'Empty response returned from local model.';
      } else {
        const chatHistoryProxySchema = activeSession.chatHistory.map((m) => ({
          role: m.sender === 'student' ? 'user' : 'model',
          text: m.text,
        }));

        const payload: Record<string, any> = {
          prompt: text.trim(),
          extractedText: extractedTextBuffer || undefined,
          image: compositeB64 || undefined,
          history: chatHistoryProxySchema,
        };

        // User role: attach their own API key and selected model
        if (authState.role === 'user') {
          payload.userApiKey = providerSettings.userGeminiApiKey;
          payload.userModel = providerSettings.userGeminiModel;
        }

        const res = await apiFetch('/api/gemini/chat', {
          method: 'POST',
          body: JSON.stringify(payload),
        });

        const responseData = await res.json();

        if (!res.ok) {
          throw new Error(responseData.error || 'Server-side processing limit exceeded.');
        }

        responseText = responseData.text || 'Dialogue returned empty response context.';
      }

      const modelMessage: ChatMessage = {
        id: `msg-${Date.now()}-model`,
        sender: 'gemini',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      updateActiveSession((old) => ({
        ...old,
        chatHistory: [...old.chatHistory, modelMessage],
        isProcessing: false,
      }));
    } catch (err: any) {
      console.error('Study Companion execution failed: ', err);

      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-error`,
        sender: 'gemini',
        text: `⚠️ **STUDY ASSISTANT ERROR**\n\n${err.message || 'We could not securely dispatch this prompt. Please review your active configuration.'}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      updateActiveSession((old) => ({
        ...old,
        chatHistory: [...old.chatHistory, errorMessage],
        isProcessing: false,
      }));
    }
  };

  const handleClearHistory = () => {
    updateActiveSession((old) => ({ ...old, chatHistory: [] }));
  };

  // Show login page if not authenticated
  if (!authState.isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div id="furian-root-layout" className="w-screen h-screen flex bg-zinc-100 overflow-hidden select-none font-sans">
      {/* 1. Sleek Far Left Module Sidebar Navigation */}
      <NavigationSidebar
        currentModuleId={currentModuleId}
        providerSettings={providerSettings}
        onChangeProviderSettings={setProviderSettings}
        userRole={authState.role}
        onLogout={handleLogout}
      />

      {/* 2. Left Double Column: Tagging & Session manager paired with SQLite interaction logs */}
      <TagExplorer
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onResetSession={handleResetSession}
        onCreateSession={handleCreateSession}
        onUpdateTagNotes={handleUpdateTagNotes}
        historyList={historyList}
        activeHistoryId={activeHistoryId}
        onSelectHistory={handleLoadHistory}
        onDeleteHistory={handleDeleteHistory}
        onSaveCurrentSession={handleSaveSession}
        onRefreshHistory={fetchHistory}
        pdfFile={pdfFile}
      />

      {/* 3. Primary Center Column: PDF Canvas drawing workspace with synchronized document bindings */}
      <CanvasWorkspace
        sessions={sessions}
        activeSession={activeSession}
        onUpdateActiveSession={updateActiveSession}
        pdfjsReady={pdfjsReady}
        onSelectTagId={setActiveSessionId}
        pdfFile={pdfFile}
        onPdfFileChange={setPdfFile}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
      />

      {/* 4. Collapsible Right: Study Companion dialogue sidebar */}
      <ChatSidebar
        session={activeSession}
        isOpen={isChatOpen}
        onToggleOpen={() => setIsChatOpen(!isChatOpen)}
        onSendMessage={handleSendMessage}
        onClearHistory={handleClearHistory}
      />
    </div>
  );
}
