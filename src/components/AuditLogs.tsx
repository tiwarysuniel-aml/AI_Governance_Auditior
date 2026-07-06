import React, { useState } from 'react';
import { Search, Eye, FileDown, Trash2, Calendar, ShieldCheck, X } from 'lucide-react';
import type { AuditLog } from '../services/mockData';
import { exportAuditReportPDF } from '../services/pdfGenerator';
import { analyzeGovernance } from '../services/governanceEngine';

interface AuditLogsProps {
  logs: AuditLog[];
  onLogDeleted: (id: string) => void;
}

export const AuditLogs: React.FC<AuditLogsProps> = ({ logs, onLogDeleted }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [providerFilter, setProviderFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  
  // Modal state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent modal opening
    if (confirm('Are you sure you want to delete this log entry?')) {
      const existing = JSON.parse(localStorage.getItem('ai_gov_audit_logs') || '[]');
      const updated = existing.filter((l: AuditLog) => l.id !== id);
      localStorage.setItem('ai_gov_audit_logs', JSON.stringify(updated));
      onLogDeleted(id);
    }
  };

  const handleExport = (log: AuditLog, e: React.MouseEvent) => {
    e.stopPropagation();
    const report = analyzeGovernance(log.prompt, log.response);
    exportAuditReportPDF(log.prompt, log.response, log.provider, log.model, report);
  };

  // Filter & Sort Logic
  const filteredLogs = logs
    .filter(log => {
      const matchesSearch = 
        log.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.response.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.model.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesProvider = 
        providerFilter === 'all' || 
        log.provider.toLowerCase() === providerFilter.toLowerCase();
      
      const matchesRisk = 
        riskFilter === 'all' || 
        log.riskLevel.toLowerCase() === riskFilter.toLowerCase();

      return matchesSearch && matchesProvider && matchesRisk;
    })
    .sort((a, b) => {
      if (sortBy === 'newest') return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      if (sortBy === 'oldest') return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      if (sortBy === 'score-high') return b.score - a.score;
      if (sortBy === 'score-low') return a.score - b.score;
      return 0;
    });

  const getScoreColor = (score: number) => {
    if (score === 100) return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
    if (score >= 70) return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Critical': return 'text-violet-400 border-violet-500/20 bg-violet-500/10';
      case 'High': return 'text-rose-400 border-rose-500/20 bg-rose-500/10';
      case 'Medium': return 'text-amber-400 border-amber-500/20 bg-amber-500/10';
      default: return 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10';
    }
  };

  return (
    <div className="px-8 py-6 max-w-6xl mx-auto">
      
      <div className="flex items-center justify-between mb-6">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Audit Records Registry
        </span>
        <span className="text-[10.5px] bg-[#0b101f] text-slate-400 px-3 py-1.5 rounded-lg border border-[#1b233a] font-semibold">
          Total Logs: {filteredLogs.length}
        </span>
      </div>

      {/* Filter and Search controls bar */}
      <div className="bg-[#0b101f] border border-[#1b233a] rounded-xl p-4 mb-6 flex flex-col md:flex-row md:items-center gap-4">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search prompt query, output, or model details..."
            className="w-full bg-[#070b16] border border-[#161c2e] rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60 placeholder:text-slate-650"
          />
        </div>

        {/* Filters Grid */}
        <div className="grid grid-cols-3 gap-3 md:w-auto shrink-0">
          <select
            value={providerFilter}
            onChange={(e) => setProviderFilter(e.target.value)}
            className="bg-[#070b16] border border-[#161c2e] rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/60"
          >
            <option value="all">All AI Providers</option>
            <option value="gemini">Gemini</option>
            <option value="ollama">Ollama</option>
            <option value="demo">Demo Mode</option>
          </select>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-[#070b16] border border-[#161c2e] rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/60"
          >
            <option value="all">All Risk Levels</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
            <option value="critical">Critical Risk</option>
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-[#070b16] border border-[#161c2e] rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500/60"
          >
            <option value="newest">Newest Audit</option>
            <option value="oldest">Oldest Audit</option>
            <option value="score-high">Highest Score</option>
            <option value="score-low">Lowest Score</option>
          </select>
        </div>
      </div>

      {/* Database logs list */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[#161c2e] rounded-xl bg-slate-950/10 text-slate-500 text-xs">
          No records match the active search and filter constraints.
        </div>
      ) : (
        <div className="bg-[#0b101f] rounded-xl border border-[#1b233a] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[11px] text-left">
              <thead>
                <tr className="bg-[#070b16] text-slate-400 font-bold border-b border-[#1b233a]">
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Provider / Model</th>
                  <th className="p-4">Prompt Preview</th>
                  <th className="p-4 text-center">Score</th>
                  <th className="p-4 text-center">Risk Level</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#161c2e] bg-[#070b16]/10">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-900/10 cursor-pointer transition-colors"
                  >
                    <td className="p-4 text-slate-400 whitespace-nowrap">
                      <div className="flex items-center space-x-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{new Date(log.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</span>
                      </div>
                    </td>
                    
                    <td className="p-4 font-semibold text-slate-200 uppercase whitespace-nowrap">
                      <div className="text-[11px]">{log.provider}</div>
                      <div className="text-[9.5px] text-slate-500 font-normal lowercase mt-0.5">{log.model}</div>
                    </td>

                    <td className="p-4 text-slate-400 max-w-[280px] truncate">
                      {log.prompt}
                    </td>

                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded border font-extrabold ${getScoreColor(log.score)}`}>
                        {log.score}
                      </span>
                    </td>

                    <td className="p-4 text-center whitespace-nowrap">
                      <span className="text-[10px] font-extrabold uppercase text-slate-300">
                        {log.riskLevel}
                      </span>
                    </td>

                    <td className="p-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => setSelectedLog(log)}
                          title="View Details"
                          className="p-1.5 rounded bg-[#141b2e] border border-[#1b253f] hover:bg-[#1a233b] text-slate-350 hover:text-white transition-colors"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleExport(log, e)}
                          title="Export Report PDF"
                          className="p-1.5 rounded bg-[#141b2e] border border-[#1b253f] hover:bg-[#1a233b] text-slate-350 hover:text-white transition-colors"
                        >
                          <FileDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(log.id, e)}
                          title="Delete Log"
                          className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/25 text-rose-450 border border-rose-500/20 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Details overlay Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#0b101f] border border-[#1b233a] w-full max-w-3xl rounded-xl max-h-[85vh] overflow-hidden flex flex-col justify-between shadow-2xl">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-[#161c2e] bg-[#070b16]/60 backdrop-blur-md">
              <div>
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center space-x-2">
                  <ShieldCheck className="h-4.5 w-4.5 text-indigo-400" />
                  <span>Audit Transaction: #{selectedLog.id.slice(0, 8)}</span>
                </h3>
                <span className="text-[10px] text-slate-500 mt-1 block">
                  Executed: {new Date(selectedLog.timestamp).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg bg-[#141b2e] border border-[#1b253f] hover:bg-[#1a233b] text-slate-400 hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              
              {/* Score breakdown */}
              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-[#070b16] border border-[#161c2e] rounded-lg flex flex-col justify-center items-center text-center">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Score</span>
                  <span className={`text-xl font-extrabold mt-1.5 ${getScoreColor(selectedLog.score)}`}>
                    {selectedLog.score}
                  </span>
                </div>

                <div className="p-3 bg-[#070b16] border border-[#161c2e] rounded-lg flex flex-col justify-center items-center text-center">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Risk Level</span>
                  <span className="text-[10px] font-bold text-slate-350 mt-2.5 uppercase">
                    {selectedLog.riskLevel} Risk
                  </span>
                </div>

                <div className="p-3 bg-[#070b16] border border-[#161c2e] rounded-lg flex flex-col justify-center items-center text-center">
                  <span className="text-[8px] font-bold text-slate-500 uppercase tracking-widest">Model</span>
                  <span className="text-[9.5px] font-bold text-indigo-400 mt-2.5 truncate max-w-full uppercase">
                    {selectedLog.provider} ({selectedLog.model.slice(0, 12)})
                  </span>
                </div>
              </div>

              {/* Prompt Block */}
              <div>
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Prompt Buffer</h4>
                <div className="bg-[#070b16] border border-[#161c2e] p-4 rounded-lg font-mono text-[10.5px] text-slate-300 leading-normal max-h-[100px] overflow-y-auto whitespace-pre-wrap">
                  {selectedLog.prompt}
                </div>
              </div>

              {/* Response Block */}
              <div>
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Response Buffer</h4>
                <div className="bg-[#070b16] border border-[#161c2e] p-4 rounded-lg font-mono text-[10.5px] text-slate-300 leading-normal max-h-[120px] overflow-y-auto whitespace-pre-wrap">
                  {selectedLog.response}
                </div>
              </div>

              {/* Vulnerabilities flagged */}
              <div>
                <h4 className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-3">Vulnerability Scan Findings</h4>
                
                {selectedLog.detectedRisks.length === 0 ? (
                  <div className="p-4 text-center text-emerald-450 text-xs bg-emerald-500/5 border border-emerald-500/15 rounded-lg font-semibold">
                    ✓ Clean audit. No compliance policy risks flagged in this transaction.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedLog.detectedRisks.map((risk) => (
                      <div key={risk.id} className="p-3.5 bg-[#070b16] border border-[#161c2e] rounded-lg flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-white">{risk.name}</span>
                          <span className={`text-[8.5px] px-2 py-0.5 rounded font-extrabold border ${getSeverityColor(risk.severity)}`}>
                            {risk.severity}
                          </span>
                        </div>

                        <div className="text-[10px] text-slate-400 leading-relaxed">
                          Evidence Match: <code className="bg-[#0b101f] px-1.5 py-0.5 rounded text-rose-450 font-mono text-[9.5px]">{risk.evidence}</code>
                        </div>

                        <div className="text-[10px] text-indigo-400 flex items-start space-x-1 pt-1.5 border-t border-[#1b233a]">
                          <span className="font-bold shrink-0">Remediation:</span>
                          <span className="text-slate-400 italic">{risk.recommendation}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#161c2e] bg-[#070b16]/60 flex items-center justify-end">
              <button
                onClick={(e) => handleExport(selectedLog, e)}
                className="flex items-center space-x-1.5 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/10"
              >
                <FileDown className="h-4 w-4" />
                <span>Download Report PDF</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
export default AuditLogs;
