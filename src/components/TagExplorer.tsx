import { Plus, RotateCcw, MessageSquare, Trash2, Tag, Layers, BookOpen, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { TagSession, HistoryItem } from '../types';
import React, { useState } from 'react';

interface TagExplorerProps {
  sessions: TagSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onResetSession: (id: string) => void;
  onCreateSession: (name: string, colorClass: string, themeColor: string) => void;
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

export const TagExplorer = ({
  sessions,
  activeSessionId,
  onSelectSession,
  onResetSession,
  onCreateSession,
  historyList,
  activeHistoryId,
  onSelectHistory,
  onDeleteHistory,
  onSaveCurrentSession,
  onRefreshHistory,
  pdfFile,
}: TagExplorerProps) => {
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'tags' | 'history'>('tags');
  const [newTagName, setNewTagName] = useState('');
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const [saveSnapshotName, setSaveSnapshotName] = useState('');
  const [saveFeedback, setSaveFeedback] = useState('');

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim()) return;
    const preset = COLOR_PRESETS[selectedColorIdx];
    onCreateSession(newTagName.trim(), preset.class, preset.hex);
    setNewTagName('');
    setIsCreating(false);
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

  // Collapsed strip shown when panel is toggled off
  if (!isPanelOpen) {
    return (
      <div className="w-10 h-screen bg-white border-r border-zinc-200/80 flex flex-col items-center py-3 gap-4 z-20 shrink-0">
        <button
          onClick={() => setIsPanelOpen(true)}
          title="Open Desk Explorer"
          className="w-7 h-7 rounded border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 flex items-center justify-center text-zinc-600 hover:text-zinc-900 cursor-pointer transition-colors shrink-0"
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
              Furian Study Desk Explorer
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
                  setSaveFeedback('Refreshing desk...');
                  await onRefreshHistory();
                  setTimeout(() => setSaveFeedback(''), 1500);
                }}
                className="w-7 h-7 rounded border border-zinc-200 bg-white hover:bg-zinc-50 flex items-center justify-center text-zinc-600 hover:text-zinc-900 cursor-pointer transition-colors"
                title="Sync & Reload Desk Snapshots"
              >
                <RotateCcw size={13} />
              </button>
            )}
            {/* Collapse panel button */}
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
        <div className="flex border-b border-zinc-220 shrink-0">
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

        {/* Tags Tab */}
        {activeTab === 'tags' && (
          <div className="flex flex-col flex-1 overflow-y-auto min-h-0">
            {/* Create tag form */}
            {isCreating && (
              <form onSubmit={handleCreate} className="p-4 bg-zinc-50 border-b border-zinc-200 animate-slide-down shrink-0">
                <div className="flex flex-col gap-3">
                  <label className="text-[10px] font-mono text-zinc-400 font-bold uppercase">
                    New Study Tag Name
                  </label>
                  <input
                    type="text"
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    placeholder="e.g. Mitochondria Membrane, Part A"
                    maxLength={30}
                    className="w-full bg-white border border-zinc-200 p-2 text-xs rounded focus:outline-hidden focus:border-zinc-500 font-sans"
                    autoFocus
                  />
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase">
                      Aesthetic Color Tone
                    </span>
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
                          {selectedColorIdx === idx && (
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsCreating(false)}
                      className="bg-transparent hover:bg-zinc-100 text-zinc-500 px-3 py-1.5 rounded text-[10px] font-semibold cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-zinc-900 hover:bg-zinc-800 text-white px-3 py-1.5 rounded text-[10px] font-semibold cursor-pointer"
                    >
                      Add Tag
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Tag accordion list */}
            <div className="flex flex-col divide-y divide-zinc-100 overflow-y-auto">
              {sessions.map((sess) => {
                const isActive = sess.id === activeSessionId;
                const isExpanded = expandedIds.has(sess.id);
                const regionCount = sess.regions.length;
                const lastMessage = sess.chatHistory[sess.chatHistory.length - 1];

                return (
                  <div
                    key={sess.id}
                    className={`flex flex-col transition-all duration-150 relative ${
                      isActive ? 'border-l-[3.5px]' : 'border-l-[3.5px] border-l-transparent'
                    }`}
                    style={{ borderLeftColor: isActive ? sess.themeColor : 'transparent' }}
                  >
                    {/* Accordion header — always visible */}
                    <div
                      className={`px-4 py-3 flex items-center justify-between gap-2 cursor-pointer transition-colors ${
                        isActive ? 'bg-zinc-50/70' : 'bg-white hover:bg-zinc-50/40'
                      }`}
                      onClick={() => {
                        onSelectSession(sess.id);
                        toggleExpand(sess.id);
                      }}
                    >
                      <div className={`border rounded-sm px-2 py-0.5 text-[10px] font-mono font-bold leading-normal flex items-center gap-1.5 min-w-0 truncate ${sess.color}`}>
                        <Tag size={8} style={{ color: sess.themeColor }} className="shrink-0" />
                        <span className="truncate">{sess.name}</span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-mono">
                          {regionCount}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onResetSession(sess.id);
                          }}
                          title="Reset Tag Regions & Chats"
                          className="p-1 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 cursor-pointer shrink-0"
                        >
                          <RotateCcw size={10} />
                        </button>
                        <ChevronDown
                          size={12}
                          className={`text-zinc-400 transition-transform duration-200 shrink-0 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                      </div>
                    </div>

                    {/* Accordion body — shown when expanded */}
                    {isExpanded && (
                      <div className="px-4 pb-3 flex flex-col gap-2 bg-zinc-50/50 border-t border-zinc-100">
                        {/* Region mini list */}
                        {regionCount > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {sess.regions.map((reg, rIdx) => (
                              <span
                                key={reg.id}
                                className="text-[9px] font-mono text-zinc-500 bg-white border border-zinc-200/60 px-1 py-0.5 rounded flex items-center gap-1"
                                title={`Selection Region ${rIdx + 1} on Page ${reg.pageNumber}`}
                              >
                                <Layers size={8} />
                                P.{reg.pageNumber}: #{rIdx + 1}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-zinc-400 italic mt-2">
                            No regions drawn yet.
                          </p>
                        )}

                        {/* Last chat snippet */}
                        <div className="border-t border-dotted border-zinc-200 pt-2 select-text">
                          {sess.chatHistory.length > 0 ? (
                            <div className="flex flex-col gap-1 text-[11px]">
                              <div className="flex items-center gap-1 text-zinc-400 font-mono text-[9px]">
                                <MessageSquare size={10} />
                                <span>RECENT DIALOGUE:</span>
                              </div>
                              <div className="text-zinc-500 line-clamp-2 italic leading-tight pl-2 border-l border-zinc-200">
                                "{lastMessage?.text}"
                              </div>
                            </div>
                          ) : (
                            <span className="text-[10px] text-zinc-400 italic">
                              No active dialogues yet.
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="flex flex-col flex-1 overflow-y-auto min-h-0 divide-y divide-zinc-100">
            {/* Save snapshot block */}
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
                  className="flex-1 bg-white border border-zinc-200 px-2 py-1.5 text-xs rounded font-sans focus:outline-hidden focus:border-zinc-500"
                />
                <button
                  onClick={handleSaveSnapshot}
                  className="bg-zinc-950 hover:bg-zinc-850 text-white text-[10px] uppercase font-bold py-1.5 px-3 rounded transition-colors cursor-pointer"
                >
                  Save
                </button>
              </div>
              {saveFeedback && (
                <p className="text-[9px] font-mono text-emerald-600 mt-1.5">{saveFeedback}</p>
              )}
              <p className="text-[9px] text-zinc-400 mt-2 italic font-mono leading-tight">
                Includes active tag categories, selection coordinates, current page number, and chat logs.
              </p>
            </div>

            {/* History list */}
            {historyList.length === 0 ? (
              <div className="p-8 text-center text-zinc-400 font-sans text-xs flex-1 flex flex-col justify-center">
                <BookOpen size={40} className="mx-auto text-zinc-300 mb-3" />
                <p className="font-semibold uppercase tracking-wider text-[10px] font-mono mb-1 text-zinc-600">
                  Database Empty
                </p>
                <p className="text-[11px] text-zinc-400 leading-normal">
                  Save your active study dashboard state above to log interaction history.
                </p>
              </div>
            ) : (
              <div className="flex flex-col divide-y divide-zinc-100 overflow-y-auto flex-1">
                {historyList.map((item) => {
                  const isActive = item.id === activeHistoryId;
                  const dateStr = item.created_at
                    ? new Date(item.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                      })
                    : 'Unknown Time';

                  return (
                    <div
                      key={item.id}
                      onClick={() => onSelectHistory(item.id)}
                      className={`p-4 transition-all duration-150 cursor-pointer flex flex-col justify-between group relative border-l-4 ${
                        isActive
                          ? 'bg-zinc-50 border-zinc-900 font-medium'
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
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteHistory(item.id);
                          }}
                          className="w-6 h-6 rounded hover:bg-rose-50 text-zinc-400 hover:text-rose-600 flex items-center justify-center transition-colors shrink-0 cursor-pointer md:opacity-0 group-hover:opacity-100"
                          title="Purge Study interactions"
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

      {/* Footer stats */}
      <div className="p-4 bg-[#fafafa] border-t border-zinc-100 flex items-center justify-between text-[10px] font-mono text-zinc-400 shrink-0">
        <span>TOTAL SESSIONS: {sessions.length}</span>
        <span>FURIAN HYPERCUBE</span>
      </div>
    </div>
  );
};
