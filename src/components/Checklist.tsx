import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, XCircle, FileDown } from 'lucide-react';
import { exportChecklistPDF } from '../services/pdfGenerator';

interface ChecklistItem {
  id: string;
  title: string;
  desc: string;
  subText: string;
  status: 'pass' | 'warn' | 'fail';
}

export const Checklist: React.FC = () => {
  const [items, setItems] = useState<ChecklistItem[]>([
    {
      id: '1',
      title: 'PII Protected',
      desc: 'Ensure all user prompts and model responses are sanitized of personally identifiable information (emails, names, phone numbers, government IDs) prior to external logs saving.',
      subText: 'DLP filters are active on workspace submission pipelines.',
      status: 'pass'
    },
    {
      id: '2',
      title: 'Audit Logs Enabled',
      desc: 'System transactions must be audited, logging timestamps, provider specifications, exact models used, safety indices, and security warnings.',
      subText: 'Local storage audit logging is configured and operational.',
      status: 'pass'
    },
    {
      id: '3',
      title: 'Prompt Injection Checked',
      desc: 'Validate prompts for injection overrides, ignore directives, and jailbreak patterns. Ensure prompt templates have structured role boundaries.',
      subText: 'Deterministic regex matches are actively blocking override requests.',
      status: 'pass'
    },
    {
      id: '4',
      title: 'Human Review Required',
      desc: 'Establish standard human-in-the-loop validation triggers for prompts or responses containing medium or high risk classifications.',
      subText: 'Triggering alerts for scores lower than 70. Human validation pipeline requires refinement.',
      status: 'warn'
    },
    {
      id: '5',
      title: 'Compliance Verified',
      desc: 'Audit log metadata complies with statutory policies. Check data subjects for EU compliance checks and healthcare registry safety.',
      subText: 'Audited metadata registers verify zero persistent compliance leaks.',
      status: 'pass'
    }
  ]);

  const handleToggleStatus = (id: string, newStatus: 'pass' | 'warn' | 'fail') => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, status: newStatus } : item
    ));
  };

  const handleDownloadPDF = () => {
    const pdfData = items.map(item => ({
      text: `${item.title}: ${item.desc} (${item.subText})`,
      completed: item.status === 'pass'
    }));
    exportChecklistPDF(pdfData);
  };

  // Calculations for dynamic header info
  const passCount = items.filter(i => i.status === 'pass').length;
  const totalCount = items.length;
  const completionPercentage = Math.round((passCount / totalCount) * 100);

  return (
    <div className="px-8 py-6 max-w-5xl mx-auto">
      
      {/* Dynamic Progress Panel */}
      <div className="bg-[#0b101f] border border-[#1b233a] rounded-xl p-5 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
            Compliance Score Card
          </span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-2xl font-extrabold text-white">{completionPercentage}% Passed</span>
            <span className="text-[10.5px] text-slate-500 font-bold">({passCount} of {totalCount} items secure)</span>
          </div>
        </div>

        <div className="flex items-center space-x-4 flex-1 max-w-md md:justify-end">
          <div className="flex-1 bg-[#070b16] h-2 rounded-full overflow-hidden border border-[#161c2e] max-w-[200px]">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/10"
          >
            <FileDown className="h-3.5 w-3.5" />
            <span>Download Report</span>
          </button>
        </div>
      </div>

      {/* Checklist items list */}
      <div className="space-y-4">
        {items.map(item => (
          <div 
            key={item.id}
            className="bg-[#0b101f] border border-[#1b233a] rounded-xl p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-6 hover:border-slate-800 transition-colors duration-200"
          >
            {/* Left side text items */}
            <div className="flex-1 space-y-3">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center space-x-2">
                  <span className={`h-2 w-2 rounded-full ${
                    item.status === 'pass' 
                      ? 'bg-emerald-500' 
                      : item.status === 'warn' 
                        ? 'bg-amber-500' 
                        : 'bg-rose-500'
                  }`} />
                  <span>{item.title}</span>
                </h3>
                <p className="text-[10.5px] text-slate-400 mt-1.5 leading-relaxed">
                  {item.desc}
                </p>
              </div>

              {/* Nested technical status box */}
              <div className="bg-[#070b16] border border-[#161c2e] rounded-lg p-3 font-mono text-[10.5px] text-slate-500 leading-normal">
                {item.subText}
              </div>
            </div>

            {/* Right side Pill Status Selector */}
            <div className="flex items-center space-x-2 shrink-0 self-center md:self-start">
              {/* Pass button */}
              <button
                onClick={() => handleToggleStatus(item.id, 'pass')}
                className={`flex items-center space-x-1 px-4 py-2 rounded-lg border text-[10px] font-extrabold transition-all duration-200 ${
                  item.status === 'pass'
                    ? 'border-emerald-500/20 bg-emerald-500/15 text-emerald-400'
                    : 'border-[#161c2e] bg-[#070b16] text-slate-500 hover:text-slate-300'
                }`}
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>Pass</span>
              </button>

              {/* Warn button */}
              <button
                onClick={() => handleToggleStatus(item.id, 'warn')}
                className={`flex items-center space-x-1 px-4 py-2 rounded-lg border text-[10px] font-extrabold transition-all duration-200 ${
                  item.status === 'warn'
                    ? 'border-amber-500/20 bg-amber-500/15 text-amber-400'
                    : 'border-[#161c2e] bg-[#070b16] text-slate-500 hover:text-slate-300'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Warn</span>
              </button>

              {/* Fail button */}
              <button
                onClick={() => handleToggleStatus(item.id, 'fail')}
                className={`flex items-center space-x-1 px-4 py-2 rounded-lg border text-[10px] font-extrabold transition-all duration-200 ${
                  item.status === 'fail'
                    ? 'border-rose-500/20 bg-rose-500/15 text-rose-400'
                    : 'border-[#161c2e] bg-[#070b16] text-slate-500 hover:text-slate-300'
                }`}
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Fail</span>
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
export default Checklist;
