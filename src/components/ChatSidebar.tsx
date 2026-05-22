import { MessageSquare, Send, X, Bot, User, Trash2, ArrowRightLeft, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import { TagSession } from '../types';
import React, { useState, useRef, useEffect } from 'react';
import { Markdown } from './Markdown';

interface ChatSidebarProps {
  session: TagSession;
  isOpen: boolean;
  onToggleOpen: () => void;
  onSendMessage: (text: string) => void;
  onClearHistory: () => void;
}

export const ChatSidebar = ({
  session,
  isOpen,
  onToggleOpen,
  onSendMessage,
  onClearHistory,
}: ChatSidebarProps) => {
  const [inputText, setInputText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Auto scroll logic of messages list
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [session.chatHistory, session.isProcessing, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || session.isProcessing) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  // Floating trigger bubble shown when the sidebar is packed (hidden)
  if (!isOpen) {
    return (
      <button
        onClick={onToggleOpen}
        id="btn-floating-chat-trigger"
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-zinc-950 text-white shadow-xl hover:bg-zinc-800 hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer ease-out duration-200 z-40 animate-pulse border border-zinc-700"
        title={`Review dialogues for: ${session.name}`}
      >
        <div className="relative">
          <MessageSquare size={24} />
          {session.chatHistory.length > 0 && (
            <div className="absolute -top-1 -right-1.5 w-4 h-4 bg-lime-500 rounded-full border-2 border-zinc-950 flex items-center justify-center">
              <span className="text-[8px] font-mono font-bold text-zinc-950">{session.chatHistory.length}</span>
            </div>
          )}
        </div>
      </button>
    );
  }

  return (
    <div
      id="chat-explorer-sidebar"
      className="w-96 h-screen border-l border-zinc-200 bg-white shadow-2xl flex flex-col justify-between relative z-30 select-none animate-slide-left shrink-0"
    >
      {/* Sidebar Header */}
      <div className="h-16 px-5 border-b border-zinc-200/80 flex items-center justify-between bg-[#fafafa]">
        <div className="flex items-center gap-2">
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${session.themeColor}15`, border: `1px solid ${session.themeColor}` }}
          >
            <Bot size={11} style={{ color: session.themeColor }} />
          </div>
          <div className="flex flex-col">
            <h3 className="font-sans font-bold text-xs uppercase tracking-wider text-zinc-800">
              AI Study Companion
            </h3>
            <span className="text-[9px] font-mono text-zinc-400 mt-0.5 uppercase leading-none">
              ACTIVE TAG: {session.name}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {session.chatHistory.length > 0 && (
            <button
              onClick={onClearHistory}
              className="p-1.5 rounded border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 cursor-pointer transition-colors"
              title="Reset Chat Session"
            >
              <RotateCcw size={12} />
            </button>
          )}

          <button
            onClick={onToggleOpen}
            className="p-1.5 rounded border border-zinc-200 bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 cursor-pointer transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      </div>

      {/* Messages Panel Workspace */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-zinc-50/20 select-text">
        {session.chatHistory.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 mt-12 select-none">
            <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-400 border border-zinc-200">
              <Bot size={22} />
            </div>
            <div className="space-y-1">
              <h4 className="text-zinc-800 font-sans font-bold text-xs">
                Contextual AI Ready
              </h4>
              <p className="text-[11px] text-zinc-400 max-w-[240px] mx-auto leading-relaxed">
                Draw shapes on the PDF text or diagrams to map materials to the <span className="font-bold">"{session.name}"</span> tag, then submit questions.
              </p>
            </div>

            {session.regions.length > 0 && (
              <div className="bg-lime-500/10 border border-lime-400/50 p-2.5 rounded text-left mt-4 text-[10px] text-lime-800 max-w-[240px] flex items-start gap-2 select-text font-mono">
                <Sparkles size={12} className="shrink-0 mt-0.5 text-lime-600" />
                <span>
                  <strong className="block text-[11px] font-sans font-extrabold uppercase">Regions Captured!</strong>
                  You have compiled {session.regions.length} distinct bounding regions. Ask your question below to process them.
                </span>
              </div>
            )}
          </div>
        ) : (
          session.chatHistory.map((msg) => {
            const isStudent = msg.sender === 'student';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[85%] select-text leading-relaxed select-text ${
                  isStudent ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                {/* Profile Circle Icon */}
                <div
                  className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center border text-[9px] font-mono font-bold ${
                    isStudent
                      ? 'bg-zinc-900 border-zinc-800 text-white'
                      : 'bg-white border-zinc-200 text-zinc-700'
                  }`}
                >
                  {isStudent ? <User size={11} /> : <Bot size={11} style={{ color: session.themeColor }} />}
                </div>

                {/* Bubble */}
                <div className="flex flex-col gap-1 select-text">
                  <div
                    className={`rounded-lg p-3 text-xs leading-relaxed border shadow-xs ${
                      isStudent
                        ? 'bg-zinc-900 text-zinc-100 border-zinc-800 rounded-tr-none'
                        : 'bg-white text-zinc-800 border-zinc-200 rounded-tl-none font-sans'
                    }`}
                  >
                    {isStudent ? (
                      <p className="whitespace-pre-wrap font-sans select-text">{msg.text}</p>
                    ) : (
                      <div className="prose select-text">
                        <Markdown content={msg.text} />
                      </div>
                    )}
                  </div>
                  <span className="text-[9px] text-zinc-400 font-mono tracking-tight self-end mt-0.5 block select-none">
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Dynamic Thinking/Crop generation animations */}
        {session.isProcessing && (
          <div className="flex gap-3 max-w-[85%] animate-pulse mr-auto select-none">
            <div
              className={`w-6 h-6 rounded-full border border-zinc-200 bg-white flex items-center justify-center text-[9px]`}
            >
              <Loader2 size={11} className="animate-spin" style={{ color: session.themeColor }} />
            </div>
            <div className="flex flex-col gap-1.5">
              <div className="rounded-lg p-3 text-xs border bg-white text-zinc-500 border-zinc-200 rounded-tl-none font-mono flex items-center gap-2">
                <Loader2 size={12} className="animate-spin text-zinc-500 shrink-0" />
                <span>Consolidating snippets & running query...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Input Submit form */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-zinc-200/80 bg-[#fafafa]">
        <div className="flex flex-col gap-1.5 text-[10px] font-mono text-zinc-400 px-1 mb-2">
          {session.regions.length > 0 ? (
            <div className="flex items-center justify-between">
              <span>ATTACHED: {session.regions.length} PINPOINT REGIONS</span>
              <span className="text-zinc-600 font-bold uppercase">
                MODE: {session.selectionMode === 'text' ? '📐 Text Extract' : '🖼️ Canvas Crop'}
              </span>
            </div>
          ) : (
            <span className="text-zinc-500 font-bold">⚠️ NO REGIONS SELECTED ON DOCUMENT</span>
          )}
        </div>

        <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded p-1 shadow-xs focus-within:border-zinc-500 transition-colors">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={session.isProcessing}
            placeholder={
              session.regions.length === 0
                ? 'Please select text/image area first...'
                : 'Ask AI analyzer a study question...'
            }
            className="flex-1 bg-transparent px-2.5 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-hidden disabled:opacity-55"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || session.isProcessing || session.regions.length === 0}
            className="w-8 h-8 rounded bg-zinc-950 text-white flex items-center justify-center hover:bg-zinc-800 disabled:bg-zinc-100 disabled:text-zinc-400 cursor-pointer disabled:cursor-not-allowed transition-colors"
          >
            <Send size={12} />
          </button>
        </div>
      </form>
    </div>
  );
};
