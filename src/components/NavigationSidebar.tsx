import { GraduationCap, Map, Layers, Settings, ChevronLeft, ChevronRight, Lock, Cpu, Shield, User, LogOut, Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';
import { ProviderSettings, UserRole } from '../types';

interface NavigationSidebarProps {
  currentModuleId: string;
  providerSettings: ProviderSettings;
  onChangeProviderSettings: (settings: ProviderSettings) => void;
  userRole: UserRole | null;
  onLogout: () => void;
}

const GEMINI_MODELS = [
  { id: 'gemini-2.0-flash', label: 'Gemini 2.0 Flash' },
  { id: 'gemini-2.0-flash-lite', label: 'Gemini 2.0 Flash Lite' },
  { id: 'gemini-2.5-flash-preview-05-20', label: 'Gemini 2.5 Flash Preview' },
  { id: 'gemini-2.5-pro-preview-05-06', label: 'Gemini 2.5 Pro Preview' },
  { id: 'gemini-1.5-flash', label: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-pro', label: 'Gemini 1.5 Pro' },
];

export const NavigationSidebar = ({
  currentModuleId,
  providerSettings,
  onChangeProviderSettings,
  userRole,
  onLogout,
}: NavigationSidebarProps) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  const subModules = [
    {
      id: 'precision-pdf',
      title: 'Precision PDF Companion',
      description: 'Surgical selected crops & smart text analyzer with AI session tagging.',
      icon: Layers,
      isUnlocked: true,
    },
    {
      id: 'concept-mapper',
      title: 'Concept Wireframer',
      description: 'Dynamic schema nodes auto-grouped from syllabus materials.',
      icon: Map,
      isUnlocked: false,
    },
    {
      id: 'quiz-engine',
      title: 'Vectored MCQ Generator',
      description: 'Custom exam cards tailored strictly to Doubt Regions.',
      icon: GraduationCap,
      isUnlocked: false,
    },
  ];

  const isAdmin = userRole === 'admin';

  const activeModelLabel =
    providerSettings.provider === 'local'
      ? providerSettings.localModel
      : isAdmin
      ? 'gemini-3.5-flash'
      : (GEMINI_MODELS.find((m) => m.id === providerSettings.userGeminiModel)?.label ?? providerSettings.userGeminiModel);

  return (
    <div
      className={`h-screen bg-[#fafafa] border-r border-zinc-200/80 flex flex-col justify-between transition-all duration-300 relative select-none z-30 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Structural Logo Grid */}
      <div className="flex flex-col">
        <div className="h-16 flex items-center px-4 border-b border-zinc-200/80 justify-between">
          {!isCollapsed ? (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded bg-zinc-900 flex items-center justify-center border border-zinc-700">
                <span className="text-white font-mono font-bold text-sm tracking-widest">F</span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-900 font-sans font-bold text-sm tracking-tight leading-none">
                  FURIAN
                </span>
                <span className="text-xs text-zinc-500 font-mono tracking-wide mt-1">
                  EDUCATION
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto w-8 h-8 rounded bg-zinc-900 flex items-center justify-center border border-zinc-700">
              <span className="text-white font-mono font-bold text-sm">F</span>
            </div>
          )}

          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="absolute -right-3 top-5 w-6 h-6 rounded-full border border-zinc-200 bg-white shadow-xs flex items-center justify-center text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 cursor-pointer z-4s transition-transform"
          >
            {isCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
          </button>
        </div>

        {/* Modular Sub-Apps list */}
        <div className="p-3 flex flex-col gap-2 mt-4">
          <div className="px-2 mb-2">
            {!isCollapsed ? (
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono font-bold block">
                Workspace Modules
              </span>
            ) : (
              <div className="w-full border-t border-zinc-200 my-1" />
            )}
          </div>

          {subModules.map((mod) => {
            const Icon = mod.icon;
            const isActive = mod.id === currentModuleId;

            return (
              <div
                key={mod.id}
                title={mod.isUnlocked ? mod.title : `${mod.title} (Future Expansion)`}
                className={`flex flex-col rounded p-2.5 transition-all text-left ${
                  isActive
                    ? 'bg-white border border-zinc-900/10 shadow-xs ring-1 ring-zinc-900/[0.02]'
                    : 'border border-transparent hover:bg-zinc-100/60'
                } ${!mod.isUnlocked ? 'opacity-55 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded flex items-center justify-center ${
                      isActive ? 'bg-zinc-900 text-white' : 'bg-zinc-200/50 text-zinc-600'
                    }`}
                  >
                    <Icon size={16} />
                  </div>

                  {!isCollapsed && (
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 justify-between">
                        <span
                          className={`font-sans text-xs font-semibold truncate ${
                            isActive ? 'text-zinc-900' : 'text-zinc-700'
                          }`}
                        >
                          {mod.title}
                        </span>
                        {!mod.isUnlocked && <Lock size={10} className="text-zinc-400 shrink-0" />}
                      </div>
                      <span className="text-[10px] text-zinc-500 line-clamp-1 mt-0.5 leading-tight block">
                        {mod.description}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Model Provision Settings Block */}
      <div className="border-t border-zinc-200/80 bg-zinc-50/50">
        {!isCollapsed ? (
          <div className="p-3 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-mono font-bold block">
                AI ENGINE
              </span>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="text-xs text-zinc-500 hover:text-zinc-950 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                id="toggle-engine-settings-btn"
                title="Configure LLM Endpoint"
              >
                <Settings size={12} className={showSettings ? 'animate-spin' : ''} />
                <span>{showSettings ? 'Close' : 'Setup'}</span>
              </button>
            </div>

            {/* Quick status display */}
            <div className="flex items-center justify-between bg-white border border-zinc-200/60 rounded px-2.5 py-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <div className={`p-1 rounded shrink-0 ${
                  providerSettings.provider === 'local' ? 'bg-cyan-50 text-cyan-600' : 'bg-zinc-100 text-zinc-800'
                }`}>
                  <Cpu size={12} />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[11px] font-semibold text-zinc-800 truncate leading-tight">
                    {providerSettings.provider === 'local' ? 'Local Llama/LM Studio' : 'Gemini AI (Cloud)'}
                  </span>
                  <span className="text-[9px] text-zinc-500 font-mono truncate leading-none mt-0.5">
                    {activeModelLabel}
                  </span>
                </div>
              </div>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                providerSettings.provider === 'local' ? 'bg-cyan-500 animate-pulse' : 'bg-emerald-500 animate-pulse'
              }`} />
            </div>

            {showSettings && (
              <div className="flex flex-col gap-2.5 mt-0.5 text-left bg-white border border-zinc-200 rounded p-2.5 shadow-sm">
                {/* Provider toggle */}
                <div className="grid grid-cols-2 gap-0.5 bg-zinc-100 p-0.5 rounded border border-zinc-200/60">
                  <button
                    onClick={() => onChangeProviderSettings({ ...providerSettings, provider: 'gemini' })}
                    className={`py-1 text-[9px] font-mono font-bold rounded text-center transition-all cursor-pointer ${
                      providerSettings.provider === 'gemini'
                        ? 'bg-white text-zinc-900 shadow-xs border border-zinc-300/40'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    GEMINI
                  </button>
                  <button
                    onClick={() => onChangeProviderSettings({ ...providerSettings, provider: 'local' })}
                    className={`py-1 text-[9px] font-mono font-bold rounded text-center transition-all cursor-pointer ${
                      providerSettings.provider === 'local'
                        ? 'bg-cyan-500 text-white shadow-xs'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                  >
                    LOCAL
                  </button>
                </div>

                {/* User role Gemini settings */}
                {providerSettings.provider === 'gemini' && !isAdmin && (
                  <div className="flex flex-col gap-2">
                    {/* API Key input */}
                    <div>
                      <label className="text-[8px] font-mono text-zinc-400 uppercase tracking-wider block mb-0.5">
                        Your Gemini API Key
                      </label>
                      <div className="relative">
                        <input
                          type={showApiKey ? 'text' : 'password'}
                          value={providerSettings.userGeminiApiKey}
                          onChange={(e) => onChangeProviderSettings({
                            ...providerSettings,
                            userGeminiApiKey: e.target.value,
                          })}
                          placeholder="AIza..."
                          className="w-full text-[10px] px-1.5 pr-6 py-0.5 bg-zinc-50 border border-zinc-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900/30 rounded font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey((v) => !v)}
                          className="absolute right-1 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
                        >
                          {showApiKey ? <EyeOff size={10} /> : <Eye size={10} />}
                        </button>
                      </div>
                    </div>

                    {/* Model selector */}
                    <div>
                      <label className="text-[8px] font-mono text-zinc-400 uppercase tracking-wider block mb-0.5">
                        Gemini Model
                      </label>
                      <select
                        value={providerSettings.userGeminiModel}
                        onChange={(e) => onChangeProviderSettings({
                          ...providerSettings,
                          userGeminiModel: e.target.value,
                        })}
                        className="w-full text-[10px] px-1.5 py-0.5 bg-zinc-50 border border-zinc-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-zinc-900/30 rounded font-mono cursor-pointer"
                      >
                        {GEMINI_MODELS.map((m) => (
                          <option key={m.id} value={m.id}>{m.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="p-1.5 bg-zinc-50 text-[9px] text-zinc-600 leading-normal rounded border border-zinc-100">
                      Your key is sent to the server per-request only — it is never stored server-side.
                    </div>
                  </div>
                )}

                {/* Admin Gemini: no key needed */}
                {providerSettings.provider === 'gemini' && isAdmin && (
                  <div className="p-1.5 bg-amber-50 text-[9px] text-amber-700 leading-normal rounded border border-amber-100 flex items-center gap-1.5">
                    <Shield size={10} className="shrink-0" />
                    Admin uses the server-configured API key.
                  </div>
                )}

                {/* Local provider settings */}
                {providerSettings.provider === 'local' && (
                  <div className="flex flex-col gap-2">
                    <div>
                      <span className="text-[8px] font-mono text-zinc-400 block mb-1 uppercase tracking-wider">Presets</span>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => onChangeProviderSettings({
                            ...providerSettings,
                            provider: 'local',
                            localBaseUrl: 'http://localhost:1234/v1',
                            localModel: 'lmstudio',
                          })}
                          className="px-1.5 py-0.5 text-[8px] font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded text-center transition-all cursor-pointer"
                        >
                          LM Studio (1234)
                        </button>
                        <button
                          type="button"
                          onClick={() => onChangeProviderSettings({
                            ...providerSettings,
                            provider: 'local',
                            localBaseUrl: 'http://localhost:8080/v1',
                            localModel: 'local-model',
                          })}
                          className="px-1.5 py-0.5 text-[8px] font-semibold text-zinc-700 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded text-center transition-all cursor-pointer"
                        >
                          llama.cpp (8080)
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="text-[8px] font-mono text-zinc-400 uppercase tracking-wider block mb-0.5">
                        Base URL
                      </label>
                      <input
                        type="text"
                        value={providerSettings.localBaseUrl}
                        onChange={(e) => onChangeProviderSettings({
                          ...providerSettings,
                          localBaseUrl: e.target.value,
                        })}
                        placeholder="http://localhost:1234/v1"
                        className="w-full text-[10px] px-1.5 py-0.5 bg-zinc-50 border border-zinc-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded font-mono"
                        id="local-base-url-input"
                      />
                    </div>

                    <div>
                      <label className="text-[8px] font-mono text-zinc-400 uppercase tracking-wider block mb-0.5">
                        Model / Alias
                      </label>
                      <input
                        type="text"
                        value={providerSettings.localModel}
                        onChange={(e) => onChangeProviderSettings({
                          ...providerSettings,
                          localModel: e.target.value,
                        })}
                        placeholder="lmstudio"
                        className="w-full text-[10px] px-1.5 py-0.5 bg-zinc-50 border border-zinc-200 focus:bg-white focus:outline-none focus:ring-1 focus:ring-cyan-500 rounded font-mono"
                        id="local-model-input"
                      />
                    </div>

                    <div className="p-1.5 bg-cyan-50/50 text-[9px] text-cyan-800 leading-normal rounded border border-cyan-100/40">
                      Bypasses sandbox routing restrictions by querying your local endpoint directly from the browser context.
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2 items-center py-2.5">
            <button
              onClick={() => {
                setIsCollapsed(false);
                setShowSettings(true);
              }}
              className={`p-1.5 rounded-md hover:bg-zinc-100 transition-colors relative cursor-pointer ${
                providerSettings.provider === 'local' ? 'text-cyan-600 bg-cyan-50/60' : 'text-zinc-600'
              }`}
              title="Configure AI Engine Integration"
            >
              <Cpu size={14} />
              <span className={`absolute bottom-0.5 right-0.5 w-1.5 h-1.5 rounded-full ${
                providerSettings.provider === 'local' ? 'bg-cyan-500 anim-pulse' : 'bg-transparent'
              }`} />
            </button>
          </div>
        )}
      </div>

      {/* Footer: Active user + logout */}
      <div className="p-3 border-t border-zinc-200/80">
        {!isCollapsed ? (
          <div className="flex flex-col gap-1 px-1">
            <div className="flex items-center justify-between text-[10px] font-mono text-zinc-400">
              <span>ACTIVE USER</span>
              <div className="flex items-center gap-1">
                {isAdmin ? (
                  <Shield size={9} className="text-amber-500" />
                ) : (
                  <User size={9} className="text-zinc-500" />
                )}
                <span className={`uppercase font-bold ${isAdmin ? 'text-amber-600' : 'text-zinc-600'}`}>
                  {userRole ?? 'GUEST'}
                </span>
              </div>
            </div>
            <div className="text-[10px] font-mono text-zinc-500 mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>GMUNK Light theme loaded</span>
            </div>
            <button
              onClick={onLogout}
              className="mt-1.5 w-full flex items-center justify-center gap-1.5 py-1 text-[9px] font-mono font-semibold text-zinc-500 hover:text-rose-600 hover:bg-rose-50 border border-zinc-200 hover:border-rose-200 rounded transition-all cursor-pointer"
            >
              <LogOut size={10} />
              SIGN OUT
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <button
              onClick={onLogout}
              className="p-1 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded transition-all cursor-pointer"
              title="Sign out"
            >
              <LogOut size={12} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
