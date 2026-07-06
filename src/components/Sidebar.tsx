import React from 'react';
import { Shield, Terminal, ArrowLeftRight, History, CheckSquare, Settings, BarChart2 } from 'lucide-react';
import type { AuditLog } from '../services/mockData';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  logs: AuditLog[];
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, logs }) => {
  // Calculate dynamic stats from logs
  const totalAudits = logs.length;
  const avgScore = totalAudits > 0 
    ? Math.round(logs.reduce((acc, log) => acc + log.score, 0) / totalAudits) 
    : 0;
  
  // High risk sessions are those with score < 70
  const highRiskSessions = logs.filter(log => log.score < 70).length;

  const navItems = [
    { id: 'workspace', label: 'Workspace', desc: 'Analyze prompt risks', icon: Terminal },
    { id: 'dashboard', label: 'Dashboard', desc: 'Risk & metrics overview', icon: BarChart2 },
    { id: 'comparison', label: 'Comparison Mode', desc: 'Evaluate two models', icon: ArrowLeftRight },
    { id: 'logs', label: 'Audit Logs', desc: 'Local audit trail', icon: History },
    { id: 'checklist', label: 'Checklist Generator', desc: 'Governance audit checklist', icon: CheckSquare },
    { id: 'settings', label: 'Settings', desc: 'API keys & configurations', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#080c15] border-r border-[#161c2e] flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div className="flex flex-col flex-1 py-6">
        {/* Brand/Logo Header */}
        <div className="px-6 mb-8 flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600/90 text-white shadow-lg shadow-indigo-500/20">
            <Shield className="h-5.5 w-5.5" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-white tracking-wide leading-none">
              Governance Studio
            </h1>
            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block mt-1">
              ENTERPRISE RISK v1.0
            </span>
          </div>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 text-left ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10'
                    : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                }`}
              >
                <Icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <div>
                  <span className="text-xs font-semibold block leading-none">
                    {item.label}
                  </span>
                  <span className={`text-[10px] block mt-0.5 leading-none ${isActive ? 'text-indigo-200' : 'text-slate-500'}`}>
                    {item.desc}
                  </span>
                </div>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Footer: Governance Pulse Panel */}
      <div className="p-4 border-t border-[#161c2e]">
        <div className="p-4 bg-[#0a0f1d] border border-[#1b233a]/80 rounded-xl">
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 animate-pulse" />
              <span>Governance Pulse</span>
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Audited</span>
              <span className="text-lg font-bold text-white mt-0.5 block">{totalAudits}</span>
            </div>
            <div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Avg Score</span>
              <span className="text-lg font-bold text-amber-400 mt-0.5 block">{avgScore}</span>
            </div>
          </div>

          {/* High risk alert badge */}
          <div className="bg-rose-950/30 border border-rose-900/40 rounded-lg py-1.5 px-2 text-center">
            <span className="text-[9px] font-extrabold text-rose-400 uppercase tracking-wider block">
              High Risk Sessions: {highRiskSessions}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
