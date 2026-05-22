import {
  Plus, RotateCcw, Trash2, Tag, Layers, BookOpen,
  ChevronLeft, ChevronRight, ChevronDown, MessageSquare, FileText, StickyNote,
} from 'lucide-react';
import { TagSession, HistoryItem } from '../types';
import React, { useState } from 'react';

interface TagExplorerProps {
  sessions: TagSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onResetSession: (id: string) => void;
  onCreateSession: (name: string, colorClass: string, themeColor: string) => void;
  onUpdateTagNotes: (sessionId: string, notes: string) => void;
  historyList: HistoryItem[];
  activeHistoryId: string | null;
  onSelectHistory: (id: string) => void;
  onDeleteHistory: (id: string) => void;
  onSaveCurrentSession: (name: string) => Promise<void>;
  onRefreshHistory: () => Promise<void>;
  pdfFile: File | { name: string; base64: string } | null;
}

const COLOR_PRESETS = [
  { name: 'Cyan Spark', class: 'border-[#06b6d4] bg-[#ecfeff] text-[#083344]', hex: '#06b6d4' },
  { name: 'Neon Lime', class: 'border-[#84cc16] bg-[#f7fee7] text-[#1a2e05]', hex: '#84cc16' },
  { name: 'Amber Glow', class: 'border-[#f59e0b] bg-[#fefbeb] text-[#451a03]', hex: '#f59e0b' },
  { name: 'Rose Quartz', class: 'border-[#f43f5e] bg-[#fff1f2] text-[#4c0519]', hex: '#f43f5e' },
  { name: 'Iris Violet', class: 'border-[#8b5cf6] bg-[#f5f3ff] text-[#2e1065]', hex: '#8b5cf6' },
];

interface TagRowProps {
  sess: TagSession;
  isActive: boolean;
  isExpanded: boolean;
  notesDraft: Record<string, string>;
  onToggleExpand: (id: string) => void;
  onSelect: (id: string) => void;
  onReset: (id: string) => void;
  onNotesChange: (id: string, val: string) => void;
  onNotesSave: (id: string) => void;
}

const TagRow = ({
  sess, isActive, isExpanded, notesDraft,
  onToggleExpand, onSelect, onReset, onNotesChange, onNotesSave,
}: TagRowProps) => {
  const regionCount = sess.regions.length;
  const chatCount = sess.chatHistory.length;
  const currentNote = notesDraft[sess.id] ?? sess.notes ?? '';

  return (
    <div
      className={`flex flex-col transition-all duration-150 border-l-[3px] ${
        isActive ? '' : 'border-l-transparent'
      }`}
      style={{ borderLeftColor: isActive ? sess.themeColor : 'transparent' }}
    >
      {/* Row header */}
      <div
        className={`px-3 py-2.5 flex items-center gap-2 cursor-pointer transition-colors ${
          isActive ? 'bg-zinc-50' : 'bg-white hover:bg-zinc-50/60'
        }`}
        onClick={() => {
          onSelect(sess.id);
          onToggleExpand(sess.id);
        }}
      >
        {/* Tag badge */}
        <div
          className={`flex-1 min-w-0 border rounded-sm px-2 py-0.5 text-[10px] font-mono font-bold flex items-center gap-1.5 truncate ${sess.color}`}
        >
          <Tag size={8} style={{ color: sess.themeColor }} className="shrink-0" />
          <span className="truncate">{sess.name}</span>
        </div>

        {/* Region count badge */}
        <span className="text-[9px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-mono shrink-0">
          {regionCount}
        </span>

        {/* Reset */}
        <button
          onClick={(e) => { e.stopPropagation(); onReset(sess.id); }}
          title="Reset regions & chats"
          className="p-1 rounded text-zinc-300 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer shrink-0 transition-colors"
        >
          <RotateCcw size={10} />
        </button>

        <ChevronDown
          size={12}
          className={`text-zinc-400 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Expanded body */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-1 flex flex-col gap-2.5 bg-zinc-50/60 border-t border-zinc-100">

          {/* Regions */}
          <div>
            <p className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider mb-1.5">
              Pinned Regions
            </p>
            {regionCount > 0 ? (
              <div className="flex flex-wrap gap-1">
                {sess.regions.map((reg, rIdx) => (
                  <span
                    key={reg.id}
                    className="text-[9px] font-mono text-zinc-500 bg-white border border-zinc-200 px-1.5 py-0.5 rounded flex items-center gap-1"
                    title={`Page ${reg.pageNumber} — ${reg.selectionMode === 'image' ? 'Image crop' : 'Text selection'}`}
                  >
                    <Layers size={7} />
                    P.{reg.pageNumber}#{rIdx + 1}
                    <span
                      className={`ml-0.5 text-[7px] font-bold ${reg.selectionMode === 'image' ? 'text-amber-600' : 'text-sky-600'}`}
                    >
                      {reg.selectionMode === 'image' ? 'IMG' : 'TXT'}
                    </span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[9px] text-zinc-400 italic">No regions drawn yet.</p>
            )}
          </div>

          {/* Chat message count — only shown if messages exist */}
          {chatCount > 0 && (
            <div className="flex items-center gap-1.5 text-[9px] font-mono text-zinc-500 bg-white border border-zinc-200 rounded px-2 py-1 w-fit">
              <MessageSquare size={9} className="text-zinc-400" />
              <span>{chatCount} message{chatCount !== 1 ? 's' : ''} in companion</span>
            </div>
          )}

          {/* Quick Notes */}
          <div>
            <div className="flex items-center gap-1 mb-1.5">
              <StickyNote size={9} className="text-zinc-400" />
              <p className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-wider">
                Quick Notes
              </p>
            </div>
            <textarea
              value={currentNote}
              onChange={(e) => onNotesChange(sess.id, e.target.value)}
              onBlur={() => onNotesSave(sess.id)}
              placeholder="Add quick notes for this tag…"
              rows={2}
              className="w-full bg-white border border-zinc-200 rounded px-2 py-1.5 text-[10px] font-sans text-zinc-700 placeholder-zinc-300 focus:outline-none focus:border-zinc-400 resize-none leading-snug"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export const TagExplorer = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onResetSession,
  onCreateSession,
  onUpdateTagNotes,
  historyList,
  activeHistoryId,
  onSelectHistory,
  onDeleteHistory,
  onSaveCurrentSession,
  onRefreshHistory,
}: TagExplorerProps) => {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'tags' | 'history'>('tags');
  const [newTagName, setNewTagName] = useState('');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [isCreating, setIsCreating] = useState(false);

  // Which individual tag rows are expanded
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  // Whether each group header is open
  const [defaultGroupOpen, setDefaultGroupOpen] = useState(true);
  const [customGroupOpen, setCustomGroupOpen] = useState(true);

  // Local draft for notes (saves to parent on blur)
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  const [saveSnapshotName, setSaveSnapshotName] = useState('');
  const [saveFeedback, setSaveFeedback] = useState('');

  const defaultSessions = sessions.filter((s) => s.isDefault);
  const customSessions = sessions.filter((s) => !s.isDefault);

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleNotesChange = (id: string, val: string) => {
    setNotesDraft((prev) => ({ ...prev, [id]: val }));
  };

  const handleNotesSave = (id: string) => {
    const val = notesDraft[id];
    if (val !== undefined) {
      onUpdateTagNotes(id, val);
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    const preset = COLOR_PRESETS[selectedColorIdx];
    onCreateSession(newTagName.trim(), preset.class, preset.hex);
    setNewTagName('');
    setIsCreating(false);
    setCustomGroupOpen(true);
  };

  const handleSaveSnapshot = async (e: React.MouseEvent) => {
    e.preventDefault();
    const cleanName = saveSnapshotName.trim();
    if (!cleanName) return;
    await onSaveCurrentSession(cleanName);
    setSaveSnapshotName('');
    setSaveFeedback('Milestone registered!');
    setTimeout(() => setSaveFeedback(''), 3000);
  };

  // Collapsed strip
  if (!isPanelOpen) {
    return (
      <div className="w-10 h-screen bg-white border-r border-zinc-200/80 flex flex-col items-center py-3 gap-4 z-20 shrink-0">
        <button
          onClick={() => setIsPanelOpen(true)}
          title="Open Desk Explorer"
          className="w-7 h-7 rounded border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-600 hover:text-zinc-900 cursor-pointer transition-colors"
        >
          <ChevronRight size={14} />
        </button>
        <span
          className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest select-none mt-2"
          style={{ writingMode: 'vertical-rl', textOrientation: 'mixed' }}
        >
          Desk Explorer
        </span>
      </div>
    );
  }

  return (
    <div className="w-80 h-screen bg-white border-r border-zinc-200/80 flex flex-col justify-between select-none z-20 shrink-0">
      <div className="flex flex-col flex-1 min-h-0">

        {/* Header */}
        <div className="h-16 px-5 border-b border-zinc-200/80 flex items-center justify-between bg-[#fafafa] shrink-0">
          <div className="flex items-center gap-2">
            <Tag size={16} className="text-zinc-600" />
            <h2 className="font-sans font-bold text-xs uppercase tracking-wider text-zinc-800">
              Desk Explorer
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            {activeTab === 'tags' && (
              <button
                onClick={() => setIsCreating(!isCreating)}
                className="w-7 h-7 rounded border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center text-zinc-600 hover:text-zinc-900 cursor-pointer transition-colors"
                title="Create Custom Study Tag"
              >
                <Plus size={14} />
              </button>
            )}
            {activeTab === 'history' && (
              <button
                onClick={async () => {
                  setSaveFeedback('Refreshing…');
                  await onRefreshHistory();
                  setTimeout(() => setSaveFeedback(''), 1500);
                }}
                className="w-7 h-7 rounded border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center text-zinc-600 hover:text-zinc-900 cursor-pointer transition-colors"
                title="Sync & Reload Desk Snapshots"
              >
                <RotateCcw size={13} />
              </button>
            )}
            <button
              onClick={() => setIsPanelOpen(false)}
              title="Hide Desk Explorer"
              className="w-7 h-7 rounded border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center text-zinc-500 hover:text-zinc-900 cursor-pointer transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 shrink-0">
          <button
            onClick={() => setActiveTab('tags')}
            className={`flex-1 py-3 text-[10px] font-bold font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'tags'
                ? 'border-zinc-900 text-zinc-900 bg-zinc-50/50'
                : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            🏷️ Study Tags
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-[10px] font-bold font-mono uppercase tracking-wider border-b-2 transition-all cursor-pointer relative ${
              activeTab === 'history'
                ? 'border-zinc-900 text-zinc-900 bg-zinc-50/50'
                : 'border-transparent text-zinc-400 hover:text-zinc-700'
            }`}
          >
            📂 Desk History
            {historyList.length > 0 && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-zinc-900 text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-mono">
                {historyList.length}
              </span>
            )}
          </button>
        </div>

        {/* ── Tags Tab ── */}
        {activeTab === 'tags' && (
          <div className="flex flex-col flex-1 overflow-y-auto min-h-0">

            {/* Create custom tag form */}
            {isCreating && (
              <form onSubmit={handleCreate} className="p-4 bg-zinc-50 border-b border-zinc-200 shrink-0">
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-mono text-zinc-400 font-bold uppercase">
                    New Custom Tag Name
                  </label>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="e.g. Mitochondria Membrane"
                    maxLength={30}
                    className="w-full bg-white border border-zinc-200 p-2 text-xs rounded focus:outline-none focus:border-zinc-500 font-sans"
                    autoFocus
                  />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">Color</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      {COLOR_PRESETS.map((p, idx) => (
                        <button
                          key={p.name}
                          type="button"
                          onClick={() => setSelectedColorIdx(idx)}
                          className="w-5 h-5 rounded-full border flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                          style={{ backgroundColor: p.hex, borderColor: selectedColorIdx === idx ? '#18181b' : 'transparent' }}
                          title={p.name}
                        >
                          {selectedColorIdx === idx && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-1">
                    <button type="button" onClick={() => setIsCreating(false)} className="bg-transparent hover:bg-zinc-100 text-zinc-500 px-3 py-1.5 rounded text-[10px] font-semibold cursor-pointer">
                      Cancel
                    </button>
                    <button type="submit" className="bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded text-[10px] font-semibold cursor-pointer">
                      Add Tag
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ── Default Tags Group ── */}
            <div className="flex flex-col">
              {/* Group header */}
              <button
                onClick={() => setDefaultGroupOpen((v) => !v)}
                className="flex items-center justify-between px-4 py-2 bg-zinc-50 hover:bg-zinc-100 border-b border-zinc-200 cursor-pointer transition-colors group"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                    Default Tags
                  </span>
                  <span className="text-[8px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded font-mono font-bold">
                    {defaultSessions.length}
                  </span>
                </div>
                <ChevronDown
                  size={12}
                  className={`text-zinc-400 transition-transform duration-200 ${defaultGroupOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Default tag rows */}
              {defaultGroupOpen && (
                <div className="divide-y divide-zinc-100 border-b border-zinc-200">
                  {defaultSessions.map((sess) => (
                    <TagRow
                      key={sess.id}
                      sess={sess}
                      isActive={sess.id === activeSessionId}
                      isExpanded={expandedIds.has(sess.id)}
                      notesDraft={notesDraft}
                      onToggleExpand={toggleExpand}
                      onSelect={onSelectSession}
                      onReset={onResetSession}
                      onNotesChange={handleNotesChange}
                      onNotesSave={handleNotesSave}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Custom Tags Group — only if any exist ── */}
            {customSessions.length > 0 && (
              <div className="flex flex-col">
                <button
                  onClick={() => setCustomGroupOpen((v) => !v)}
                  className="flex items-center justify-between px-4 py-2 bg-zinc-50 hover:bg-zinc-100 border-b border-zinc-200 cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-wider">
                      Custom Tags
                    </span>
                    <span className="text-[8px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded font-mono font-bold">
                      {customSessions.length}
                    </span>
                  </div>
                  <ChevronDown
                    size={12}
                    className={`text-zinc-400 transition-transform duration-200 ${customGroupOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {customGroupOpen && (
                  <div className="divide-y divide-zinc-100 border-b border-zinc-200">
                    {customSessions.map((sess) => (
                      <TagRow
                        key={sess.id}
                        sess={sess}
                        isActive={sess.id === activeSessionId}
                        isExpanded={expandedIds.has(sess.id)}
                        notesDraft={notesDraft}
                        onToggleExpand={toggleExpand}
                        onSelect={onSelectSession}
                        onReset={onResetSession}
                        onNotesChange={handleNotesChange}
                        onNotesSave={handleNotesSave}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── History Tab ── */}
        {activeTab === 'history' && (
          <div className="flex flex-col flex-1 overflow-y-auto min-h-0">
            {/* Save snapshot */}
            <div className="p-4 bg-zinc-50/70 border-b border-zinc-100 shrink-0">
              <h3 className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider mb-2">
                Save Current Desk Snapshot
              </h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Snapshot name, e.g. Biology Study A"
                  value={saveSnapshotName}
                  onChange={(e) => setSaveSnapshotName(e.target.value)}
                  className="flex-1 bg-white border border-zinc-200 px-2 py-1.5 text-xs rounded font-sans focus:outline-none focus:border-zinc-500"
                />
                <button
                  onClick={handleSaveSnapshot}
                  className="bg-zinc-950 hover:bg-zinc-800 text-white text-[10px] uppercase font-bold py-1.5 px-3 rounded transition-colors cursor-pointer"
                >
                  Save
                </button>
              </div>
              {saveFeedback && (
                <p className="text-[9px] font-mono text-emerald-600 mt-1.5">{saveFeedback}</p>
              )}
              <p className="text-[9px] text-zinc-400 mt-2 italic font-mono leading-tight">
                Includes tags, regions, notes, page number, and chat logs.
              </p>
            </div>

            {historyList.length === 0 ? (
              <div className="p-8 text-center flex-1 flex flex-col justify-center">
                <BookOpen size={40} className="mx-auto text-zinc-300 mb-3" />
                <p className="font-semibold uppercase tracking-wider text-[10px] font-mono mb-1 text-zinc-600">
                  Database Empty
                </p>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Save your active desk state above to log history.
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-zinc-100 overflow-y-auto flex-1">
                {historyList.map((item) => {
                  const isActive = item.id === activeHistoryId;
                  const dateStr = item.created_at
                    ? new Date(item.created_at).toLocaleString([], {
                        month: 'short', day: 'numeric',
                        hour: 'numeric', minute: '2-digit',
                      })
                    : 'Unknown Time';

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectHistory(item.id)}
                      className={`p-4 cursor-pointer flex flex-col justify-between group relative border-l-4 transition-all ${
                        isActive
                          ? 'bg-zinc-50 border-zinc-900'
                          : 'bg-white hover:bg-zinc-50/40 border-transparent'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-3">
                        <div className="flex-1 min-w-0 pr-4">
                          <h4 className="text-xs font-bold text-zinc-800 truncate" title={item.name}>
                            {item.name}
                          </h4>
                          <span className="text-[9px] font-mono text-zinc-400 mt-0.5 block truncate">
                            {item.pdf_filename ? `📄 ${item.pdf_filename}` : '🏫 SIMULATED CLASSROOM TEXTBOOK'}
                          </span>
                          <span className="text-[9px] font-mono text-zinc-500 bg-zinc-100/80 px-1.5 py-0.5 rounded mt-1 inline-block">
                            Page {item.current_page}
                          </span>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); onDeleteHistory(item.id); }}
                          className="w-6 h-6 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600 flex items-center justify-center transition-colors shrink-0 cursor-pointer md:opacity-0 group-hover:opacity-100"
                          title="Delete snapshot"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <div className="flex justify-between items-center mt-3 text-[9px] text-zinc-400 font-mono">
                        <span>{dateStr}</span>
                        {isActive && (
                          <span className="text-emerald-700 font-bold text-[8px] tracking-wider uppercase border border-emerald-300 bg-emerald-50 px-1 rounded-sm">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-[#fafafa] border-t border-zinc-100 flex items-center justify-between text-[10px] font-mono text-zinc-400 shrink-0">
        <span>SESSIONS: {sessions.length}</span>
        <span>FURIAN HYPERCUBE</span>
      </div>
    </div>
  );
};
