import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ShieldCheck, AlertTriangle, AlertCircle, HelpCircle, Activity } from 'lucide-react';
import type { AuditLog } from '../services/mockData';
import type { RiskCategory, SeverityLevel } from '../services/governanceEngine';

interface DashboardProps {
  logs: AuditLog[];
}

export const Dashboard: React.FC<DashboardProps> = ({ logs }) => {
  if (logs.length === 0) {
    return (
      <div className="p-8">
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/20 min-h-[400px]">
          <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-5">
            <Activity className="h-7 w-7 text-indigo-400" />
          </div>
          <h3 className="text-sm font-bold text-slate-200">No Governance Data Yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mt-2 leading-relaxed">
            Your dashboard is waiting for data. Run a scan in the <span className="text-indigo-400 font-semibold">Workspace</span> or use <span className="text-indigo-400 font-semibold">Comparison Mode</span> to populate metrics and visualization charts.
          </p>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 w-full max-w-lg">
            <div className="p-3 bg-[#0b101f] border border-[#1b233a] rounded-xl text-left">
              <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Step 1</div>
              <div className="text-[11px] font-semibold text-slate-300">Open Workspace</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Select a preset prompt</div>
            </div>
            <div className="p-3 bg-[#0b101f] border border-[#1b233a] rounded-xl text-left">
              <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Step 2</div>
              <div className="text-[11px] font-semibold text-slate-300">Run Governance Test</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Execute the audit scan</div>
            </div>
            <div className="p-3 bg-[#0b101f] border border-[#1b233a] rounded-xl text-left">
              <div className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Step 3</div>
              <div className="text-[11px] font-semibold text-slate-300">View Dashboard</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Charts populate here</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 1. Calculate Aggregates
  const totalAudits = logs.length;
  const avgScore = Math.round(logs.reduce((acc, log) => acc + log.score, 0) / totalAudits);
  
  // Calculate average risk level
  let overallRiskLevel: 'Low' | 'Medium' | 'High' | 'Critical' = 'Low';
  if (avgScore === 100) overallRiskLevel = 'Low';
  else if (avgScore >= 70) overallRiskLevel = 'Medium';
  else if (avgScore >= 35) overallRiskLevel = 'High';
  else overallRiskLevel = 'Critical';

  // Count risks by severity
  let lowCount = 0;
  let mediumCount = 0;
  let highCount = 0;
  let criticalCount = 0;

  // Track categories
  const categoryCounts: Record<RiskCategory, number> = {
    'PII': 0,
    'Sensitive Info': 0,
    'Prompt Injection': 0,
    'Privacy': 0,
    'Compliance': 0,
    'Security': 0,
    'Toxicity': 0
  };

  // Detailed PII findings
  const piiCounts = {
    'Emails': 0,
    'Phones': 0,
    'Aadhaar': 0,
    'PAN': 0,
    'Passports': 0,
    'Emp IDs': 0
  };

  // Detailed Compliance findings
  const complianceCounts = {
    'GDPR': 0,
    'HIPAA/Health': 0,
    'Retention Policy': 0
  };

  logs.forEach(log => {
    log.detectedRisks.forEach(risk => {
      // Update Category
      if (categoryCounts[risk.category] !== undefined) {
        categoryCounts[risk.category] += 1;
      }

      // Update Severity
      if (risk.severity === 'Critical') criticalCount++;
      else if (risk.severity === 'High') highCount++;
      else if (risk.severity === 'Medium') mediumCount++;
      else lowCount++;

      // Update PII Breakdown
      const nameLower = risk.name.toLowerCase();
      if (nameLower.includes('email')) piiCounts['Emails']++;
      else if (nameLower.includes('phone')) piiCounts['Phones']++;
      else if (nameLower.includes('aadhaar')) piiCounts['Aadhaar']++;
      else if (nameLower.includes('pan')) piiCounts['PAN']++;
      else if (nameLower.includes('passport')) piiCounts['Passports']++;
      else if (nameLower.includes('employee')) piiCounts['Emp IDs']++;

      // Update Compliance Breakdown
      if (nameLower.includes('gdpr')) complianceCounts['GDPR']++;
      else if (nameLower.includes('health') || nameLower.includes('medical')) complianceCounts['HIPAA/Health']++;
      else if (nameLower.includes('retention')) complianceCounts['Retention Policy']++;
    });
  });

  // Convert categories to Recharts list
  const riskCategoriesData = Object.entries(categoryCounts).map(([name, value]) => ({
    name,
    value
  }));

  // Convert PII to Recharts list
  const piiBreakdownData = Object.entries(piiCounts).map(([name, value]) => ({
    name,
    value
  }));

  // Convert Compliance to Recharts list
  const complianceBreakdownData = Object.entries(complianceCounts).map(([name, value]) => ({
    name,
    value
  }));

  // Chronological Score Trend (oldest to newest)
  const trendData = [...logs]
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    .map(log => ({
      date: new Date(log.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
      score: log.score
    }));



  // Recommendations extracted from recent audits
  const activeRecommendations = Array.from(
    new Set(
      logs
        .flatMap(log => log.detectedRisks)
        .map(risk => ({ category: risk.category, text: risk.recommendation }))
    )
  ).slice(0, 4);

  // Color matching for dashboard
  const getRiskLevelColor = (level: string) => {
    if (level === 'Low') return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
    if (level === 'Medium') return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
    if (level === 'High') return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
    return 'text-violet-400 border-violet-500/30 bg-violet-500/10';
  };

  // Heatmap mapping: Category x Severity matrix
  // Cells contain the number of incidents. We will draw a CSS Grid matrix.
  const categoriesList: RiskCategory[] = ['PII', 'Sensitive Info', 'Prompt Injection', 'Privacy', 'Compliance', 'Security', 'Toxicity'];
  const severitiesList: SeverityLevel[] = ['Low', 'Medium', 'High', 'Critical'];

  const getHeatmapMatrixValue = (cat: RiskCategory, sev: SeverityLevel): number => {
    let count = 0;
    logs.forEach(log => {
      log.detectedRisks.forEach(risk => {
        if (risk.category === cat && risk.severity === sev) {
          count++;
        }
      });
    });
    return count;
  };

  const getHeatmapBg = (count: number, sev: SeverityLevel) => {
    if (count === 0) return 'bg-slate-900/30 text-slate-700 border-slate-950';
    switch (sev) {
      case 'Critical': return 'bg-violet-950/75 text-violet-300 border-violet-700/50 font-bold';
      case 'High': return 'bg-rose-950/75 text-rose-300 border-rose-700/50 font-bold';
      case 'Medium': return 'bg-amber-950/75 text-amber-300 border-amber-700/50 font-bold';
      default: return 'bg-emerald-950/75 text-emerald-300 border-emerald-700/50 font-bold';
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      
      {/* Top statistics Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        
        {/* Score box */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Governance Pulse</div>
            <span className="flex items-center space-x-1.5">
              <span className={`h-2.5 w-2.5 rounded-full ${
                overallRiskLevel === 'Low'
                  ? 'bg-emerald-500 animate-pulse'
                  : overallRiskLevel === 'Medium'
                    ? 'bg-amber-500 animate-pulse'
                    : 'bg-rose-500 animate-pulse'
              }`} />
              <span className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider">Heartbeat</span>
            </span>
          </div>
          <div className="flex items-center space-x-3 mt-2">
            <span className="text-4xl font-extrabold text-white">{avgScore}</span>
            <div className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${getRiskLevelColor(overallRiskLevel)}`}>
              {overallRiskLevel} Risk
            </div>
          </div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center space-x-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>Aggregate score from {totalAudits} audits</span>
          </div>
        </div>

        {/* Total audits run */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Audits Performed</div>
          <div className="text-4xl font-extrabold text-white mt-2">{totalAudits}</div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center space-x-1">
            <Activity className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
            <span>Interactive workspace submissions</span>
          </div>
        </div>

        {/* High / Critical risks found */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Critical/High Risks</div>
          <div className="text-4xl font-extrabold text-rose-500 mt-2">{criticalCount + highCount}</div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center space-x-1">
            <AlertCircle className="h-3.5 w-3.5 text-rose-500" />
            <span>Threats requiring immediate shielding</span>
          </div>
        </div>

        {/* Medium/Low risks found */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Medium/Low Risks</div>
          <div className="text-4xl font-extrabold text-amber-500 mt-2">{mediumCount + lowCount}</div>
          <div className="text-[10px] text-slate-500 mt-2 flex items-center space-x-1">
            <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
            <span>Items recommended for scrubbing</span>
          </div>
        </div>

      </div>

      {/* Main Row: Score Trend and Risk Categories distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Line graph: Governance score trend */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
          <h2 className="text-sm font-bold text-slate-200 tracking-wide uppercase mb-6">Governance Score Trend</h2>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  labelStyle={{ color: '#94a3b8', fontWeight: 'bold', fontSize: '11px' }}
                  itemStyle={{ color: '#a5b4fc', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="score" stroke="#6366f1" strokeWidth={3} dot={{ fill: '#6366f1', r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar chart: risk category distribution */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40 flex flex-col justify-between">
          <h2 className="text-sm font-bold text-slate-200 tracking-wide uppercase mb-4">Risk Distribution by Category</h2>
          <div className="h-[230px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskCategoriesData} layout="vertical" margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={9} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={9} width={80} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="value" fill="#6366f1" radius={[0, 6, 6, 0]}>
                  {riskCategoriesData.map((_, index) => {
                    const colorList = ['#F59E0B', '#EF4444', '#7C3AED', '#3B82F6', '#10B981', '#6366f1', '#EC4899'];
                    return <Cell key={`cell-${index}`} fill={colorList[index % colorList.length]} />;
                  })}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="text-[10px] text-slate-500 text-center mt-2 border-t border-slate-800/80 pt-2">
            Counts reflect total flags raised across historical submissions.
          </div>
        </div>

      </div>

      {/* Breakdown Row: PII breakdown, Compliance findings, Recommendations, and Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-8">
        
        {/* Detailed PII and Compliance Breakdown (Left) */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* PII Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
            <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase mb-4">PII Finding Classifications</h3>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={piiBreakdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#f59e0b', fontSize: '10px' }}
                  />
                  <Bar dataKey="value" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Compliance Card */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
            <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase mb-4">Regulatory Compliance Flags</h3>
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={complianceBreakdownData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={9} />
                  <YAxis stroke="#64748b" fontSize={9} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                    itemStyle={{ color: '#10b981', fontSize: '10px' }}
                  />
                  <Bar dataKey="value" fill="#10B981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

        {/* Severity Heatmap (Right) */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40 flex flex-col">
          <h3 className="text-xs font-bold text-slate-300 tracking-wider uppercase mb-4">Compliance Risk Heatmap</h3>
          
          <div className="flex-1 flex flex-col justify-between">
            {/* Grid */}
            <div className="grid grid-cols-5 gap-1.5 text-center text-[10px]">
              {/* Row 0 Header */}
              <div className="text-[9px] text-slate-500 font-bold self-center">Category</div>
              {severitiesList.map(sev => (
                <div key={sev} className="text-[9px] text-slate-400 font-semibold truncate uppercase">{sev}</div>
              ))}

              {/* Matrix Rows */}
              {categoriesList.map(cat => (
                <React.Fragment key={cat}>
                  <div className="text-left text-slate-300 truncate self-center font-medium pr-1">{cat}</div>
                  {severitiesList.map(sev => {
                    const count = getHeatmapMatrixValue(cat, sev);
                    return (
                      <div
                        key={`${cat}-${sev}`}
                        className={`py-2 border rounded-md transition-all ${getHeatmapBg(count, sev)}`}
                        title={`${cat} - ${sev}: ${count} flags`}
                      >
                        {count}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>
            
            <div className="flex items-center justify-between text-[9px] text-slate-500 mt-4 border-t border-slate-800/80 pt-2">
              <span className="flex items-center space-x-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 mr-1" /> Low
              </span>
              <span className="flex items-center space-x-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500 mr-1" /> Med
              </span>
              <span className="flex items-center space-x-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500 mr-1" /> High
              </span>
              <span className="flex items-center space-x-1">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-600 mr-1" /> Critical
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Row: Active Remediation Recommendations */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 bg-slate-900/40">
        <h2 className="text-sm font-bold text-slate-200 tracking-wide uppercase mb-4">Enterprise Shielding Guidelines</h2>
        
        {activeRecommendations.length === 0 ? (
          <div className="text-xs text-slate-500 py-2">
            No active risks flagged. Workspace inputs comply with secure design standards.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeRecommendations.map((rec, i) => (
              <div key={i} className="p-3 bg-slate-950/60 border border-slate-900 rounded-xl flex items-start space-x-3 text-xs leading-relaxed">
                <span className="h-5 w-5 bg-indigo-500/10 border border-indigo-500/30 rounded-lg text-indigo-400 font-bold flex items-center justify-center shrink-0">
                  {i + 1}
                </span>
                <div>
                  <div className="text-slate-300 font-bold uppercase text-[10px] tracking-wider mb-0.5">{rec.category} Guidance</div>
                  <p className="text-slate-400">{rec.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
export default Dashboard;
