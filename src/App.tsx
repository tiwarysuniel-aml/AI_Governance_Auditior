import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { PageHeader } from './components/PageHeader';
import { Workspace } from './components/Workspace';
import { Dashboard } from './components/Dashboard';
import { Comparison } from './components/Comparison';
import { AuditLogs } from './components/AuditLogs';
import { Checklist } from './components/Checklist';
import { Settings } from './components/Settings';
import { DEFAULT_SETTINGS, testGemini, testOllama } from './services/aiProviders';
import type { ProviderSettings } from './services/aiProviders';
import { initializeLocalStorageLogs } from './services/mockData';
import type { AuditLog } from './services/mockData';

function App() {
  const [currentTab, setCurrentTab] = useState('workspace');
  const [settings, setSettings] = useState<ProviderSettings>(DEFAULT_SETTINGS);
  const [logs, setLogs] = useState<AuditLog[]>([]);

  // Provider Connection Statuses
  const [geminiStatus, setGeminiStatus] = useState('Disconnected');
  const [ollamaStatus, setOllamaStatus] = useState('Disconnected');

  // Load Settings and Logs on mount
  useEffect(() => {
    // 1. Initialize logs
    initializeLocalStorageLogs();

    // 2. Load logs (clearing mock logs if present to start fresh)
    const savedLogs = localStorage.getItem('ai_gov_audit_logs');
    if (savedLogs) {
      const parsed = JSON.parse(savedLogs);
      const containsMock = parsed.some((log: any) => log.id && log.id.startsWith('hist-'));
      if (containsMock) {
        localStorage.setItem('ai_gov_audit_logs', JSON.stringify([]));
        setLogs([]);
      } else {
        setLogs(parsed);
      }
    }

    // 3. Load settings
    const savedSettings = localStorage.getItem('ai_gov_provider_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      checkConnections(parsed);
    } else {
      localStorage.setItem('ai_gov_provider_settings', JSON.stringify(DEFAULT_SETTINGS));
      checkConnections(DEFAULT_SETTINGS);
    }
  }, []);

  // Connection check helper
  const checkConnections = async (cfg: ProviderSettings) => {
    if (cfg.geminiKey) {
      testGemini(cfg.geminiKey, cfg.geminiModel).then(setGeminiStatus).catch(() => setGeminiStatus('Disconnected'));
    }
    testOllama(cfg.ollamaUrl).then(setOllamaStatus).catch(() => setOllamaStatus('Disconnected'));
  };

  // Re-check connections when settings change
  useEffect(() => {
    if (settings) {
      checkConnections(settings);
    }
  }, [settings.geminiKey, settings.geminiModel, settings.ollamaUrl, settings.ollamaModel]);

  // Callbacks
  const handleNewLogAdded = (newLog: AuditLog) => {
    setLogs(prev => [newLog, ...prev]);
  };

  const handleLogDeleted = (id: string) => {
    setLogs(prev => prev.filter(l => l.id !== id));
  };

  const handleLogsCleared = () => {
    const freshLogs = localStorage.getItem('ai_gov_audit_logs');
    if (freshLogs) {
      setLogs(JSON.parse(freshLogs));
    }
  };

  // Render view depending on active tab
  const renderView = () => {
    switch (currentTab) {
      case 'workspace':
        return <Workspace settings={settings} onNewLogAdded={handleNewLogAdded} />;
      case 'dashboard':
        return <Dashboard logs={logs} />;
      case 'comparison':
        return <Comparison settings={settings} onNewLogAdded={handleNewLogAdded} />;
      case 'logs':
        return <AuditLogs logs={logs} onLogDeleted={handleLogDeleted} />;
      case 'checklist':
        return <Checklist />;
      case 'settings':
        return (
          <Settings
            settings={settings}
            setSettings={setSettings}
            geminiStatus={geminiStatus}
            setGeminiStatus={setGeminiStatus}
            ollamaStatus={ollamaStatus}
            setOllamaStatus={setOllamaStatus}
            onLogsCleared={handleLogsCleared}
          />
        );
      default:
        return <Workspace settings={settings} onNewLogAdded={handleNewLogAdded} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex text-slate-200">
      {/* Persistent Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        logs={logs}
      />

      {/* Main Right Side Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Dynamic Page Header */}
        <PageHeader
          currentTab={currentTab}
          settings={settings}
          geminiStatus={geminiStatus}
          ollamaStatus={ollamaStatus}
        />

        {/* Viewport Area */}
        <main className="flex-1 overflow-y-auto bg-[#080c14]">
          {renderView()}
        </main>
      </div>
    </div>
  );
}

export default App;
