import React from 'react';
import { Shield, Settings, Sliders, History, LayoutDashboard, Terminal, CheckSquare } from 'lucide-react';
import type { ProviderSettings } from '../services/aiProviders';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  settings: ProviderSettings;
  setSettings: React.Dispatch<React.SetStateAction<ProviderSettings>>;
  geminiStatus: string;
  ollamaStatus: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  settings,
  setSettings,
  geminiStatus,
  ollamaStatus
}) => {
  const toggleDemoMode = () => {
    setSettings(prev => ({
      ...prev,
      demoMode: !prev.demoMode
    }));
  };

  const navItems = [
    { id: 'workspace', label: 'Workspace', icon: Terminal },
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'comparison', label: 'Comparison', icon: Sliders },
    { id: 'logs', label: 'Audit Logs', icon: History },
    { id: 'checklist', label: 'Checklist', icon: CheckSquare },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <header className="w-full border-b border-slate-800 bg-[#0F172A]/70 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/20">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-400 bg-clip-text text-transparent">
                AI Governance & Risk Auditor
              </span>
              <div className="text-[10px] text-indigo-400 font-semibold tracking-widest uppercase">Enterprise Shield</div>
            </div>
          </div>

          {/* Settings / Mode indicators */}
          <div className="hidden lg:flex items-center space-x-4">
            {/* Active Provider Panel */}
            <div className="glass-panel px-3 py-1.5 rounded-lg flex items-center space-x-2 text-xs border border-slate-800">
              <span className="text-slate-400">Active AI:</span>
              <span className="font-semibold text-indigo-400 uppercase">
                {settings.demoMode ? 'Demo / Simulator' : settings.currentProvider}
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-slate-400 text-[11px] truncate max-w-[120px]">
                {settings.demoMode ? 'Simulated Model' : (settings.currentProvider === 'gemini' ? settings.geminiModel : settings.ollamaModel)}
              </span>
            </div>

            {/* Connection Status badges */}
            {!settings.demoMode && (
              <div className="flex items-center space-x-2 text-[10px]">
                <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
                  <span className="text-slate-400">Gemini:</span>
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    geminiStatus === 'Connected' ? 'bg-emerald-500 status-glow-green' : 'bg-rose-500'
                  }`} />
                </div>
                <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700">
                  <span className="text-slate-400">Ollama:</span>
                  <span className={`h-1.5 w-1.5 rounded-full ${
                    ollamaStatus === 'Connected' ? 'bg-emerald-500 status-glow-green' : 'bg-rose-500'
                  }`} />
                </div>
              </div>
            )}

            {/* Demo Mode Toggle */}
            <button
              onClick={toggleDemoMode}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-300 ${
                settings.demoMode
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-sm shadow-amber-500/5 glow-indigo'
                  : 'bg-slate-800/50 text-slate-400 border-slate-700/80 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <div className={`h-2 w-2 rounded-full ${settings.demoMode ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>{settings.demoMode ? 'Demo Mode Active' : 'Enable Demo Mode'}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 pb-1 overflow-x-auto scrollbar-none">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`flex items-center space-x-2 px-4 py-2 border-b-2 text-sm font-medium transition-all ${
                  isActive
                    ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
export default Header;
