import React from 'react';
import type { ProviderSettings } from '../services/aiProviders';

interface PageHeaderProps {
  currentTab: string;
  settings: ProviderSettings;
  geminiStatus: string;
  ollamaStatus: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  currentTab,
  settings,
  geminiStatus,
  ollamaStatus
}) => {
  // Map tab IDs to titles & descriptions matching the screenshots
  const headerContent: Record<string, { title: string; desc: string }> = {
    workspace: {
      title: 'Risk Audit Workspace',
      desc: 'Submit prompts, run governance scans, and inspect AI output for security and compliance risks.',
    },
    dashboard: {
      title: 'Governance Dashboard',
      desc: 'Visualize aggregate risk metrics, score trends, and compliance heatmaps across all audit sessions.',
    },
    comparison: {
      title: 'Model Comparison Studio',
      desc: 'Benchmark Gemini and Ollama side-by-side with the same prompt and compare governance scores.',
    },
    logs: {
      title: 'Audit History Database',
      desc: 'Browse, inspect, filter and export all prompt testing logs and compliance vulnerability records.',
    },
    checklist: {
      title: 'Compliance Checklist Generator',
      desc: 'Review and update governance controls, track compliance status, and download audit-ready reports.',
    },
    settings: {
      title: 'Provider Integrations & Setup',
      desc: 'Configure API keys, model selection, failover routing, and system-level governance preferences.',
    },
  };

  const { title, desc } = headerContent[currentTab] || headerContent.workspace;

  // Resolve dynamic names
  const primaryName = settings.primaryProvider.toUpperCase();
  const primaryModel = (settings.primaryProvider === 'gemini' ? settings.geminiModel : settings.ollamaModel).toUpperCase();

  const fallbackName = settings.fallbackProvider.toUpperCase();
  const fallbackModel = (settings.fallbackProvider === 'gemini' ? settings.geminiModel : settings.ollamaModel).toUpperCase();

  const isGeminiConnected = settings.demoMode || geminiStatus === 'Connected';
  const isOllamaConnected = !settings.demoMode && ollamaStatus === 'Connected';

  return (
    <header className="w-full bg-[#080c14] border-b border-[#161c2e] px-8 py-5 flex items-center justify-between shrink-0">
      {/* Title & Desc */}
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">{title}</h2>
        <p className="text-[11px] text-slate-500 mt-1">{desc}</p>
      </div>

      {/* Connection & Routing Statuses */}
      <div className="flex items-center space-x-3">
        {/* Primary provider badge */}
        <div className="bg-[#0b101f] border border-[#1b233a] rounded-lg px-3 py-1 text-left min-w-[120px]">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Primary</span>
          <span className="text-[10px] font-extrabold text-indigo-300 block mt-0.5">
            {primaryName} ({primaryModel})
          </span>
        </div>

        {/* Fallback provider badge */}
        <div className="bg-[#0b101f] border border-[#1b233a] rounded-lg px-3 py-1 text-left min-w-[120px]">
          <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest block">Fallback</span>
          <span className="text-[10px] font-extrabold text-slate-400 block mt-0.5">
            {fallbackName} ({fallbackModel})
          </span>
        </div>

        {/* Gemini Active status bulb */}
        <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold ${
          isGeminiConnected
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
            : 'border-slate-800 bg-slate-900/30 text-slate-500'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isGeminiConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          <span>Gemini {isGeminiConnected ? 'Active' : 'Off'}</span>
        </div>

        {/* Ollama Active status bulb */}
        <div className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border text-[10px] font-bold ${
          isOllamaConnected
            ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
            : 'border-slate-800 bg-slate-900/30 text-slate-500'
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${isOllamaConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
          <span>Ollama {isOllamaConnected ? 'Active' : 'Off'}</span>
        </div>
      </div>
    </header>
  );
};
export default PageHeader;
