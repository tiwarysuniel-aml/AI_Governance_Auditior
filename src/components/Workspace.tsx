import React, { useState } from 'react';
import { Play, Trash2, ShieldAlert, CheckCircle, AlertTriangle, Terminal, Cpu, Check, ArrowDownToLine, User, Lock, Key, Shield } from 'lucide-react';
import { executePrompt } from '../services/aiProviders';
import type { ProviderSettings } from '../services/aiProviders';
import { analyzeGovernance } from '../services/governanceEngine';
import type { GovernanceReport } from '../services/governanceEngine';
import { PRELOADED_PROMPTS, MOCK_HISTORY_LOGS } from '../services/mockData';
import type { AuditLog } from '../services/mockData';
import { exportAuditReportPDF } from '../services/pdfGenerator';

interface WorkspaceProps {
  settings: ProviderSettings;
  onNewLogAdded: (log: AuditLog) => void;
}

export const Workspace: React.FC<WorkspaceProps> = ({ settings, onNewLogAdded }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [report, setReport] = useState<GovernanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [activeProvider, setActiveProvider] = useState<'gemini' | 'ollama' | 'demo' | null>(null);
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [failoverAlert, setFailoverAlert] = useState<string | null>(null);
  
  // Tab control: 'analysis' | 'response'
  const [activeRightTab, setActiveRightTab] = useState<'analysis' | 'response'>('analysis');

  const [checkedTasks, setCheckedTasks] = useState<Record<string, boolean>>({});

  const handleToggleTask = (task: string) => {
    setCheckedTasks(prev => ({
      ...prev,
      [task]: !prev[task]
    }));
  };

  const extractActionItems = (text: string): { category: string; task: string }[] => {
    if (!text) return [];
    const lines = text.split('\n');
    const items: { category: string; task: string }[] = [];
    let currentCategory = 'Suggested Action';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Detect headers/categories
      if (
        line.includes('Recommended Next Actions') ||
        line.includes('Immediate Actions Required') ||
        line.includes('Immediate Remediation Steps') ||
        line.includes('Suggested Next Steps') ||
        line.includes('🚨') ||
        line.includes('⚕️') ||
        line.includes('🔐') ||
        line.includes('📋')
      ) {
        // clean up category name
        currentCategory = line
          .replace(/[⚕️🔐📋🚨⚠️🚫💼👥]/g, '')
          .replace(/[:—]/g, '')
          .trim();
        if (!currentCategory) currentCategory = 'Next Steps';
        continue;
      }

      // Match numbered list: 1. ... or bullet: • ... or - ...
      const match = line.match(/^(?:\d+\.|\*|-|•)\s*(.+)$/);
      if (match) {
        const task = match[1].trim();
        // Avoid adding short/meaningless things
        if (task.length > 5) {
          items.push({ category: currentCategory, task });
        }
      }
    }
    return items;
  };

  const actionItems = extractActionItems(response);

  // Auto-execute: load prompt AND run governance test immediately
  const handleSelectAndRun = async (text: string) => {
    setPrompt(text);
    setResponse('');
    setReport(null);
    setFailoverAlert(null);

    setLoading(true);
    try {
      const res = await executePrompt(text, settings);
      setResponse(res.text);
      setActiveProvider(res.providerUsed);
      setActiveModel(res.modelUsed);

      if (res.failoverTriggered) {
        setFailoverAlert(
          `${settings.primaryProvider.toUpperCase()} failed. Routed to fallback: ${settings.fallbackProvider.toUpperCase()}.`
        );
      }

      const govReport = analyzeGovernance(text, res.text);
      setReport(govReport);

      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: govReport.timestamp,
        provider: res.providerUsed,
        model: res.modelUsed,
        prompt: text,
        response: res.text,
        score: govReport.score,
        riskLevel: govReport.riskLevel,
        detectedRisks: govReport.detectedRisks
      };
      const existingLogs = JSON.parse(localStorage.getItem('ai_gov_audit_logs') || '[]');
      localStorage.setItem('ai_gov_audit_logs', JSON.stringify([newLog, ...existingLogs]));
      onNewLogAdded(newLog);
    } catch (err: any) {
      console.error(err);
      setResponse(`Execution Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadLogIntoWorkspace = (log: AuditLog) => {
    setPrompt(log.prompt);
    setResponse(log.response);
    const govReport = analyzeGovernance(log.prompt, log.response);
    setReport(govReport);
    setActiveProvider(log.provider as any);
    setActiveModel(log.model);
    setFailoverAlert(null);
  };

  const handleSelectDemoPrompt = (text: string) => {
    // Now delegates to handleSelectAndRun for auto-execution
    handleSelectAndRun(text);
  };

  const handleClear = () => {
    setPrompt('');
    setResponse('');
    setReport(null);
    setFailoverAlert(null);
  };

  const handleExecute = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setResponse('');
    setReport(null);
    setFailoverAlert(null);

    try {
      const res = await executePrompt(prompt, settings);
      setResponse(res.text);
      setActiveProvider(res.providerUsed);
      setActiveModel(res.modelUsed);

      if (res.failoverTriggered) {
        setFailoverAlert(
          `${settings.primaryProvider.toUpperCase()} failed. Routed to fallback: ${settings.fallbackProvider.toUpperCase()}.`
        );
      }

      const govReport = analyzeGovernance(prompt, res.text);
      setReport(govReport);

      const newLog: AuditLog = {
        id: `log-${Date.now()}`,
        timestamp: govReport.timestamp,
        provider: res.providerUsed,
        model: res.modelUsed,
        prompt: prompt,
        response: res.text,
        score: govReport.score,
        riskLevel: govReport.riskLevel,
        detectedRisks: govReport.detectedRisks
      };

      // Add to local storage
      const existingLogs = JSON.parse(localStorage.getItem('ai_gov_audit_logs') || '[]');
      localStorage.setItem('ai_gov_audit_logs', JSON.stringify([newLog, ...existingLogs]));
      
      onNewLogAdded(newLog);

    } catch (err: any) {
      console.error(err);
      setResponse(`Execution Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    if (confirm('Are you sure you want to clear session logs?')) {
      localStorage.setItem('ai_gov_audit_logs', JSON.stringify(MOCK_HISTORY_LOGS));
      onNewLogAdded({
        id: 'dummy',
        timestamp: '',
        provider: '',
        model: '',
        prompt: '',
        response: '',
        score: 0,
        riskLevel: 'Low',
        detectedRisks: []
      }); // trigger state reload
      setTimeout(() => {
        window.location.reload();
      }, 200);
    }
  };

  // Helper to retrieve current logs list
  const getSessionLogs = (): AuditLog[] => {
    const raw = localStorage.getItem('ai_gov_audit_logs');
    return raw ? JSON.parse(raw) : [];
  };

  const logsList = getSessionLogs().slice(0, 3); // show top 3 logs

  // Categorize risks for visual cards
  const hasRiskInCategory = (cat: string): { flagged: boolean; evidence?: string; rec?: string } => {
    if (!report) return { flagged: false };
    const matches = report.detectedRisks.filter(r => r.category.toLowerCase() === cat.toLowerCase());
    if (matches.length > 0) {
      return {
        flagged: true,
        evidence: matches.map(m => m.evidence).join(', '),
        rec: matches[0].recommendation
      };
    }
    return { flagged: false };
  };

  const getCategoryStatus = (catKey: string) => {
    if (!report) return { flagged: false, risks: [] };
    
    let risks = report.detectedRisks;
    if (catKey === 'PII') {
      risks = report.detectedRisks.filter(r => r.category === 'PII');
    } else if (catKey === 'Sensitive Info') {
      risks = report.detectedRisks.filter(r => r.category === 'Sensitive Info');
    } else if (catKey === 'Prompt Injection') {
      risks = report.detectedRisks.filter(r => r.category === 'Prompt Injection');
    } else {
      // Aggregate Compliance, Privacy, Security, Toxicity
      risks = report.detectedRisks.filter(r => 
        ['Compliance', 'Privacy', 'Security', 'Toxicity'].includes(r.category)
      );
    }
    
    return {
      flagged: risks.length > 0,
      risks
    };
  };

  const handleExportPDF = () => {
    if (!report) return;
    exportAuditReportPDF(
      prompt,
      response,
      activeProvider || 'demo',
      activeModel || settings.geminiModel,
      report
    );
  };

  // Get PII redacted values for list
  const getPiiRedactions = (): string[] => {
    if (!report) return [];
    return report.detectedRisks
      .filter(r => r.category === 'PII')
      .map(r => r.evidence);
  };

  const piiRedactedValues = getPiiRedactions();

  // Custom descriptions and icons to match screenshots
  const scanCategories = [
    {
      id: 'pii',
      title: 'PII Exposure Risk',
      catKey: 'PII',
      icon: User,
      desc: 'No personal identification information detected in prompt or response records.',
      remedyPrefix: 'Remedy: Mask or remove names, phone numbers, and IDs before processing.'
    },
    {
      id: 'credentials',
      title: 'Sensitive Credentials',
      catKey: 'Sensitive Info',
      icon: Key,
      desc: 'No matching patterns found for sensitive credentials. Rule policies are verified secure.',
      remedyPrefix: 'Remedy: Remove or encrypt credentials and internal tokens before transmitting.'
    },
    {
      id: 'injection',
      title: 'Prompt Injection Override',
      catKey: 'Prompt Injection',
      icon: Terminal,
      desc: 'No matching patterns found for prompt injection. Role policies are verified secure.',
      remedyPrefix: 'Remedy: Filter user prompts for instructions containing bypass commands.'
    },
    {
      id: 'compliance',
      title: 'Regulatory Compliance',
      catKey: 'Compliance',
      icon: Shield,
      desc: 'No matching patterns found for regulatory compliance. Role policies are verified secure.',
      remedyPrefix: 'Remedy: Apply localized GDPR right-to-be-forgotten or HIPAA logging standards.'
    }
  ];

  return (
    <div className="px-8 py-6">
      {/* Failover Toast Notification */}
      {failoverAlert && (
        <div className="mb-6 p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-200 flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
          <span className="text-sm font-semibold">{failoverAlert}</span>
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Hand Column: Workspace Controls */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Audited Input Box */}
          <div className="bg-[#0b101f] border border-[#1b233a] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Audited Workspace Input
              </span>
              <span className="text-[10px] text-slate-500 font-bold">
                {prompt.length} characters
              </span>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type or paste prompt text here to verify security shield compliance..."
              rows={8}
              className="w-full bg-[#070b16] border border-[#161c2e] rounded-xl p-4 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60 resize-none transition-colors"
            />

            {/* Run Actions Row */}
            <div className="flex items-center justify-center space-x-3 mt-4">
              <button
                onClick={handleExecute}
                disabled={loading || !prompt.trim()}
                className="flex-1 max-w-[320px] flex items-center justify-center space-x-2 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-[#151c2e] disabled:text-slate-600 rounded-lg text-xs font-bold text-white transition-all duration-200 shadow-md shadow-indigo-600/15"
              >
                {loading ? (
                  <>
                    <div className="h-3 w-3 rounded-full border border-indigo-200 border-t-transparent animate-spin mr-1.5" />
                    <span>Auditing Security...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-3 w-3 fill-current mr-1" />
                    <span>Run Governance Test</span>
                  </>
                )}
              </button>

              <button
                onClick={handleClear}
                disabled={loading || !prompt}
                className="p-3 bg-slate-900/30 hover:bg-[#151c2e] border border-[#161c2e] hover:border-slate-800 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
                title="Clear Prompt"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Dataset preset buttons */}
          <div className="bg-[#0b101f] border border-[#1b233a] rounded-xl p-5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-4">
              Preloaded Compliance Demo Datasets
            </span>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Safe Prompt', subtitle: 'Expected: Governance Score 100', id: 'p1' },
                { label: 'PII Detection', subtitle: 'Expected: PII Risk Flags', id: 'p2' },
                { label: 'Prompt Injection', subtitle: 'Expected: Injection warnings', id: 'p3' },
                { label: 'API Key Leakage', subtitle: 'Expected: Sensitive data detected', id: 'p4' },
                { label: 'GDPR Risk', subtitle: 'Expected: GDPR Privacy risk', id: 'p5' },
                { label: 'Healthcare Compliance', subtitle: 'Expected: Medical Privacy risk', id: 'p6' },
              ].map(preset => {
                const target = PRELOADED_PROMPTS.find(p => p.id === preset.id);
                const isActive = target && prompt === target.prompt;
                return (
                  <button
                    key={preset.id}
                    disabled={loading}
                    onClick={() => target && handleSelectAndRun(target.prompt)}
                    className={`p-3 text-left border rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed ${
                      isActive
                        ? 'border-indigo-600 bg-indigo-600/10 text-white'
                        : 'border-[#161c2e] bg-[#070b16] hover:bg-slate-900/40 text-slate-400 hover:text-slate-200 hover:border-indigo-500/30'
                    }`}
                  >
                    <span className="text-xs font-bold block">{preset.label}</span>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      {isActive && loading ? '⏳ Scanning...' : preset.subtitle}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Session history records */}
          <div className="bg-[#0b101f] border border-[#1b233a] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Session History
              </span>
              <button
                onClick={handleClearHistory}
                className="text-[10px] text-slate-500 hover:text-rose-400 font-bold transition-colors"
              >
                Clear History
              </button>
            </div>

            <div className="space-y-2">
              {logsList.length === 0 ? (
                <span className="text-xs text-slate-600 block py-2">No history records loaded.</span>
              ) : (
                logsList.map(log => {
                  const dateStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  return (
                    <button
                      key={log.id}
                      onClick={() => loadLogIntoWorkspace(log)}
                      className="w-full text-left p-3 border border-[#161c2e] bg-[#070b16] hover:bg-slate-900/30 hover:border-slate-800 rounded-xl flex items-center justify-between space-x-3 transition-colors"
                    >
                      <span className="text-[11px] text-slate-400 truncate flex-1 font-mono">
                        {log.prompt}
                      </span>
                      <span className="text-[10px] text-slate-600 whitespace-nowrap">
                        {dateStr !== 'Invalid Date' ? dateStr : 'just now'}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </div>

        </div>

        {/* Right Hand Column: Analysis View & AI Response */}
        <div className="lg:col-span-6">
          <div className="bg-[#0b101f] border border-[#1b233a] rounded-xl overflow-hidden min-h-[500px] flex flex-col">
            
            {/* Header Tabs */}
            <div className="bg-[#070b16] border-b border-[#161c2e] px-5 py-2.5 flex items-center justify-between">
              <div className="flex space-x-4">
                <button
                  onClick={() => setActiveRightTab('analysis')}
                  className={`text-xs font-bold pb-1 pt-1.5 transition-all relative ${
                    activeRightTab === 'analysis'
                      ? 'text-white border-b-2 border-indigo-600'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Governance Analysis
                </button>
                <button
                  onClick={() => setActiveRightTab('response')}
                  className={`text-xs font-bold pb-1 pt-1.5 transition-all relative ${
                    activeRightTab === 'response'
                      ? 'text-white border-b-2 border-indigo-600'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  AI Response Output
                </button>
              </div>

              {/* Model Tag */}
              {activeModel && (
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                  {(activeProvider || 'demo').toUpperCase()}: {activeModel}
                </span>
              )}
            </div>

            {/* Content Switcher */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              
              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                  <div className="h-10 w-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
                  <h4 className="text-xs font-bold text-slate-300">Evaluating Compliance Boundaries</h4>
                  <p className="text-[10px] text-slate-600 mt-1 max-w-xs">Scanning buffers for PII leaks, credential leaks, and system overrides...</p>
                </div>

              ) : activeRightTab === 'analysis' ? (
                
                // --- GOVERNANCE ANALYSIS TAB ---
                <div className="space-y-4 flex-1">
                  {!report ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                      <Cpu className="h-8 w-8 text-slate-600 mb-3" />
                      <h4 className="text-xs font-bold text-slate-300">Awaiting Scan Execution</h4>
                      <p className="text-[10px] text-slate-600 mt-1 max-w-xs">Run a Governance Test on the left to review vulnerability findings.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      
                      {/* Wagon Wheel Score Card (Executive Governance Audit) */}
                      <div className="bg-[#070b16] border border-[#161c2e] rounded-xl p-5 flex flex-col md:flex-row items-center md:items-stretch gap-6">
                        {/* Radial Progress Ring (Wagon Wheel) — viewBox required for correct SVG coordinate rendering */}
                        <div className="flex flex-col items-center justify-center shrink-0">
                          <div className="relative h-28 w-28 flex items-center justify-center">
                            <svg
                              viewBox="0 0 112 112"
                              width="112"
                              height="112"
                              className="transform -rotate-90"
                            >
                              {/* Track Circle */}
                              <circle
                                cx="56"
                                cy="56"
                                r="46"
                                stroke="#1e2640"
                                strokeWidth="9"
                                fill="transparent"
                              />
                              {/* Value Circle — circumference = 2π×46 ≈ 289 */}
                              <circle
                                cx="56"
                                cy="56"
                                r="46"
                                stroke={
                                  report.score === 100
                                    ? '#10b981'
                                    : report.score >= 70
                                    ? '#f59e0b'
                                    : report.score >= 35
                                    ? '#ef4444'
                                    : '#dc2626'
                                }
                                strokeWidth="9"
                                fill="transparent"
                                strokeDasharray="289"
                                strokeDashoffset={
                                  // Always show at least 5% arc so ring is never invisible
                                  289 - (289 * Math.max(5, Math.min(100, report.score))) / 100
                                }
                                strokeLinecap="round"
                                style={{ transition: 'stroke-dashoffset 0.6s ease-out, stroke 0.4s ease' }}
                              />
                            </svg>
                            {/* Score label — absolute centered over SVG */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                              <span className="text-2xl font-black text-white leading-none">{report.score}</span>
                              <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">SCORE</span>
                            </div>
                          </div>
                        </div>

                        {/* Summary Info */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <h3 className="text-sm font-bold text-white leading-none">Executive Governance Audit</h3>
                              <span className={`px-2 py-0.5 rounded-full text-[8.5px] font-extrabold uppercase ${
                                report.score === 100
                                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                                  : report.score >= 70
                                  ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                                  : 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                              }`}>
                                {report.riskLevel} Risk Profile
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                              Governance review completed with {report.detectedRisks.length} {report.detectedRisks.length === 1 ? 'finding' : 'findings'} across {Object.values(report.categories).filter(c => c.count > 0).length} risk categories. Review recommendations below to optimize compliance and harden API boundaries.
                            </p>
                          </div>

                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 pt-4 border-t border-[#161c2e]">
                            <div className="flex items-center space-x-4">
                              <div className="text-[10px]">
                                <span className="text-slate-500 font-semibold block uppercase">Findings</span>
                                <span className={`text-[11px] font-extrabold block mt-0.5 ${report.detectedRisks.length > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                                  {report.detectedRisks.length} issues flagged
                                </span>
                              </div>
                              <div className="h-6 w-px bg-[#161c2e]" />
                              <div className="text-[10px]">
                                <span className="text-slate-500 font-semibold block uppercase">Security Integrity</span>
                                <span className="text-[11px] font-extrabold text-slate-300 block mt-0.5">
                                  {report.score === 100 ? 'Highest' : report.score >= 70 ? 'Standard' : 'Compromised'}
                                </span>
                              </div>
                            </div>

                            <button
                              onClick={handleExportPDF}
                              disabled={!report}
                              title={!report ? 'Run a governance scan first to enable export' : 'Download audit report as PDF'}
                              className="flex items-center justify-center space-x-1.5 px-3 py-1.5 bg-[#0b101f] hover:bg-indigo-900/30 disabled:opacity-40 disabled:cursor-not-allowed border border-[#161c2e] hover:border-indigo-500/40 text-xs font-bold text-slate-300 hover:text-indigo-300 rounded-lg transition-all duration-200"
                            >
                              <ArrowDownToLine className="h-3.5 w-3.5" />
                              <span>Export Report PDF</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* 2x2 Grid of Scan category cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {scanCategories.map(category => {
                          const status = getCategoryStatus(category.catKey);
                          const Icon = category.icon;
                          
                          return (
                            <div key={category.id} className="p-4 bg-[#070b16] border border-[#161c2e] rounded-xl flex flex-col justify-between">
                              <div>
                                <div className="flex items-center justify-between mb-3 border-b border-[#161c2e] pb-2">
                                  <div className="flex items-center space-x-2 text-indigo-400">
                                    <Icon className="h-3.5 w-3.5" />
                                    <span className="text-[11px] font-bold text-white">
                                      {category.title}
                                    </span>
                                  </div>
                                  
                                  {status.flagged ? (
                                    <span className="px-2 py-0.5 border border-rose-500/20 bg-rose-500/10 text-rose-400 text-[8px] font-extrabold rounded-md uppercase">
                                      RISK FLAGGED
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 text-[8px] font-extrabold rounded-md uppercase">
                                      SECURE
                                    </span>
                                  )}
                                </div>

                                {status.flagged ? (
                                  <div className="space-y-3">
                                    {status.risks.map((risk) => (
                                      <div key={risk.id} className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[11px] font-bold text-slate-200">
                                            {risk.name}
                                          </span>
                                          <span className={`px-1.5 py-0.5 border text-[7.5px] font-extrabold rounded uppercase ${
                                            risk.severity === 'Critical' ? 'border-violet-500/20 bg-violet-500/10 text-violet-400' :
                                            risk.severity === 'High' ? 'border-rose-500/20 bg-rose-500/10 text-rose-400' :
                                            risk.severity === 'Medium' ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' :
                                            'border-blue-500/20 bg-blue-500/10 text-blue-400'
                                          }`}>
                                            {risk.severity}
                                          </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 leading-relaxed">
                                          {risk.recommendation}
                                        </p>
                                        <div className="p-2 text-[9px] font-mono text-slate-400 bg-slate-950/40 rounded border border-[#161c2e] uppercase break-all">
                                          <span className="font-extrabold text-slate-500">Matched Content:</span> {risk.evidence}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <p className="text-[10px] text-slate-500 leading-relaxed">
                                    {category.desc}
                                  </p>
                                )}
                              </div>

                              {/* Remedy text block */}
                              {!status.flagged && (
                                <div className="mt-3 p-2 rounded text-[9px] bg-slate-900/30 border border-slate-900/50 text-slate-500 leading-relaxed">
                                  {category.remedyPrefix}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                  {response ? (
                    <div className="flex-1 flex flex-col justify-between space-y-4">
                      <div className="bg-[#070b16] border border-[#161c2e] p-4 rounded-xl font-mono text-[11px] text-slate-300 leading-relaxed whitespace-pre-wrap flex-1 max-h-[360px] overflow-y-auto">
                        {response}
                      </div>

                      {/* Interactive Next Actions Checklist */}
                      {actionItems.length > 0 && (
                        <div className="bg-[#0c1224] border border-indigo-500/20 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3 border-b border-indigo-500/10 pb-2">
                            <div className="flex items-center space-x-2 text-indigo-400">
                              <CheckCircle className="h-4 w-4" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Suggested Actions & Remediation Plan</span>
                            </div>
                            <span className="text-[9px] text-slate-500 font-bold">
                              {actionItems.filter(item => checkedTasks[item.task]).length} of {actionItems.length} complete
                            </span>
                          </div>
                          
                          <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                            {actionItems.map((item, idx) => {
                              const isChecked = !!checkedTasks[item.task];
                              return (
                                <div 
                                  key={idx} 
                                  onClick={() => handleToggleTask(item.task)}
                                  className={`flex items-start space-x-2.5 p-2 rounded-lg border transition-all duration-200 cursor-pointer ${
                                    isChecked 
                                      ? 'bg-slate-900/20 border-[#1b233a] opacity-60' 
                                      : 'bg-[#070b16] border-[#161c2e] hover:border-indigo-500/30'
                                  }`}
                                >
                                  <div className={`mt-0.5 h-3.5 w-3.5 rounded border flex items-center justify-center shrink-0 transition-colors ${
                                    isChecked 
                                      ? 'bg-indigo-600 border-indigo-600 text-white' 
                                      : 'border-[#1b233a] bg-slate-950'
                                  }`}>
                                    {isChecked && <Check className="h-2.5 w-2.5" />}
                                  </div>
                                  <div className="flex-1">
                                    <span className="text-[8px] font-extrabold text-indigo-400/80 uppercase tracking-wider block mb-0.5">
                                      {item.category}
                                    </span>
                                    <p className={`text-[10.5px] leading-relaxed ${isChecked ? 'line-through text-slate-500' : 'text-slate-300'}`}>
                                      {item.task}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Summary stats badge details */}
                      {report && (
                        <div className="bg-[#070b16] border border-[#161c2e] rounded-xl p-3.5 flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className={`h-11 w-11 rounded-lg border font-extrabold flex flex-col items-center justify-center text-[15px] ${
                              report.score === 100 
                                ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' 
                                : report.score >= 70
                                  ? 'border-amber-500/20 bg-amber-500/10 text-amber-400'
                                  : 'border-rose-500/20 bg-rose-500/10 text-rose-400'
                            }`}>
                              <span>{report.score}</span>
                            </div>
                            <div>
                              <span className="text-[10px] font-bold text-white block uppercase">
                                Compliance Evaluation Score
                              </span>
                              <span className="text-[9px] text-slate-500 block mt-0.5">
                                Risk Matrix Assessment: {report.riskLevel}
                              </span>
                            </div>
                          </div>
                          
                          {report.score === 100 ? (
                            <span className="text-[10px] font-bold text-emerald-400 flex items-center space-x-1">
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span>Shield Verified</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-rose-400 flex items-center space-x-1">
                              <ShieldAlert className="h-3.5 w-3.5" />
                              <span>Policy Shield Advisory</span>
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
                      <Terminal className="h-8 w-8 text-slate-600 mb-3" />
                      <h4 className="text-xs font-bold text-slate-300">Awaiting AI Execution</h4>
                      <p className="text-[10px] text-slate-600 mt-1 max-w-xs">Run a Governance Test on the left to see model output.</p>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
export default Workspace;
