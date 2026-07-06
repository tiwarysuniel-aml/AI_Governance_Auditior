import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertCircle, Save } from 'lucide-react';
import { testGemini, testOllama, fetchOllamaModels } from '../services/aiProviders';
import type { ProviderSettings } from '../services/aiProviders';

interface SettingsProps {
  settings: ProviderSettings;
  setSettings: React.Dispatch<React.SetStateAction<ProviderSettings>>;
  geminiStatus: string;
  setGeminiStatus: (status: string) => void;
  ollamaStatus: string;
  setOllamaStatus: (status: string) => void;
  onLogsCleared: () => void;
}

export const Settings: React.FC<SettingsProps> = ({
  settings,
  setSettings,
  geminiStatus,
  setGeminiStatus,
  ollamaStatus,
  setOllamaStatus,
}) => {
  const [localSettings, setLocalSettings] = useState<ProviderSettings>({ ...settings });
  const [ollamaModels, setOllamaModels] = useState<string[]>(['llama3:latest', 'llama3.1:latest', 'mistral:latest', 'phi3:latest']);
  const [testingGemini, setTestingGemini] = useState(false);
  const [testingOllama, setTestingOllama] = useState(false);
  const [loadingOllamaModels, setLoadingOllamaModels] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setLocalSettings({ ...settings });
  }, [settings]);

  const handleSave = () => {
    setSettings(localSettings);
    localStorage.setItem('ai_gov_provider_settings', JSON.stringify(localSettings));
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleTestGemini = async () => {
    setTestingGemini(true);
    setGeminiStatus('Testing...');
    try {
      const res = await testGemini(localSettings.geminiKey, localSettings.geminiModel);
      setGeminiStatus(res);
    } catch {
      setGeminiStatus('Disconnected');
    } finally {
      setTestingGemini(false);
    }
  };

  const handleTestOllama = async () => {
    setTestingOllama(true);
    setOllamaStatus('Testing...');
    try {
      const res = await testOllama(localSettings.ollamaUrl);
      setOllamaStatus(res);
    } catch {
      setOllamaStatus('Disconnected');
    } finally {
      setTestingOllama(false);
    }
  };

  const handleLoadOllamaModels = async () => {
    setLoadingOllamaModels(true);
    try {
      const models = await fetchOllamaModels(localSettings.ollamaUrl);
      if (models.length > 0) {
        setOllamaModels(models);
        setLocalSettings(prev => ({ ...prev, ollamaModel: models[0] }));
        alert(`Successfully scanned ${models.length} models from Ollama!`);
      } else {
        alert('Could not find active models. Make sure Ollama is running.');
      }
    } catch {
      alert('Error fetching Ollama models. Check your localhost server connection.');
    } finally {
      setLoadingOllamaModels(false);
    }
  };

  const isGeminiConnected = settings.demoMode || geminiStatus === 'Connected';
  const isOllamaConnected = !settings.demoMode && ollamaStatus === 'Connected';

  return (
    <div className="px-8 py-6 max-w-5xl mx-auto">
      
      {/* System Configurations Title Bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 border-b border-[#161c2e] pb-5">
        <div>
          <h3 className="text-[14px] font-bold text-white uppercase tracking-wider">System Configurations</h3>
          <p className="text-[11px] text-slate-500 mt-1">Integrate core models, establish routing rules, and set failover fallback bounds.</p>
        </div>

        <button
          onClick={handleSave}
          className="flex items-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all shadow-md shadow-indigo-600/10 self-start md:self-auto"
        >
          <Save className="h-4 w-4" />
          <span>Save Configurations</span>
        </button>
      </div>

      {saveSuccess && (
        <div className="mb-6 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 text-xs font-semibold">
          ✓ Configurations stored successfully in client storage.
        </div>
      )}

      {/* Main Configurations Cards */}
      <div className="space-y-6">
        
        {/* Gemini & Ollama side-by-side grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: Google Gemini */}
          <div className="bg-[#0b101f] border border-[#1b233a] rounded-xl p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#161c2e] pb-2">
                <div>
                  <h4 className="text-xs font-extrabold text-white">Google Gemini</h4>
                  <span className="text-[9.5px] text-slate-500 font-bold block mt-0.5">Cloud model provider</span>
                </div>
                <span className={`px-2.5 py-0.5 border text-[9px] font-bold rounded ${
                  isGeminiConnected
                    ? 'border-emerald-500/20 bg-emerald-500/15 text-emerald-400'
                    : 'border-slate-800 bg-slate-900/30 text-slate-500'
                }`}>
                  {isGeminiConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* API Key field */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">API Key</label>
                <input
                  type="password"
                  value={localSettings.geminiKey}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, geminiKey: e.target.value }))}
                  placeholder="••••••••••••••••••••••••••••••••••••"
                  className="w-full bg-[#070b16] border border-[#161c2e] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/60"
                />
              </div>

              {/* Model selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Model Selection</label>
                <select
                  value={localSettings.geminiModel}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, geminiModel: e.target.value }))}
                  className="w-full bg-[#070b16] border border-[#161c2e] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
                >
                  <option value="gemini-2.5-flash">gemini-2.5-flash (Fast & lightweight)</option>
                  <option value="gemini-2.5-pro">gemini-2.5-pro (High intelligence)</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash (Low cost)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (Legacy reasoning)</option>
                </select>
              </div>
            </div>

            {/* Test Connection Button */}
            <button
              onClick={handleTestGemini}
              disabled={testingGemini}
              className="w-full mt-6 py-2.5 bg-[#141b2e] hover:bg-[#1a233b] disabled:bg-slate-900 border border-[#1b253f] text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
            >
              {testingGemini ? 'Testing Connection...' : 'Test Connection'}
            </button>
          </div>

          {/* Card 2: Ollama */}
          <div className="bg-[#0b101f] border border-[#1b233a] rounded-xl p-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#161c2e] pb-2">
                <div>
                  <h4 className="text-xs font-extrabold text-white">Ollama</h4>
                  <span className="text-[9.5px] text-slate-500 font-bold block mt-0.5">Local model server</span>
                </div>
                <span className={`px-2.5 py-0.5 border text-[9px] font-bold rounded ${
                  isOllamaConnected
                    ? 'border-emerald-500/20 bg-emerald-500/15 text-emerald-400'
                    : 'border-rose-500/20 bg-rose-500/15 text-rose-400'
                }`}>
                  {isOllamaConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* Base URL */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Base URL</label>
                <input
                  type="text"
                  value={localSettings.ollamaUrl}
                  onChange={(e) => setLocalSettings(prev => ({ ...prev, ollamaUrl: e.target.value }))}
                  placeholder="http://localhost:11434"
                  className="w-full bg-[#070b16] border border-[#161c2e] rounded-lg px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-indigo-500/60"
                />
              </div>

              {/* Model selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Active Model</label>
                <div className="flex space-x-2">
                  <select
                    value={localSettings.ollamaModel}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, ollamaModel: e.target.value }))}
                    className="flex-1 bg-[#070b16] border border-[#161c2e] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
                  >
                    {ollamaModels.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  
                  <button
                    onClick={handleLoadOllamaModels}
                    disabled={loadingOllamaModels}
                    className="px-3.5 bg-[#141b2e] border border-[#1b253f] hover:bg-[#1a233b] text-slate-300 rounded-lg text-xs font-semibold flex items-center justify-center space-x-1 transition-colors"
                    title="Scan for local models"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${loadingOllamaModels ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">Scan Models</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Test Connection Button */}
            <button
              onClick={handleTestOllama}
              disabled={testingOllama}
              className="w-full mt-6 py-2.5 bg-[#141b2e] hover:bg-[#1a233b] disabled:bg-slate-900 border border-[#1b253f] text-slate-300 hover:text-white rounded-lg text-xs font-semibold transition-colors"
            >
              {testingOllama ? 'Testing Connection...' : 'Test Connection'}
            </button>
          </div>

        </div>

        {/* Row 2: Failover & Routing Schema */}
        <div className="bg-[#0b101f] border border-[#1b233a] rounded-xl p-5">
          <div className="flex items-center justify-between border-b border-[#161c2e] pb-2 mb-4">
            <div>
              <h4 className="text-xs font-extrabold text-white">Failover & Routing Schema</h4>
              <span className="text-[9.5px] text-slate-500 font-bold block mt-0.5">Configure resilience pipelines for high availability</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end mb-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Primary Routing Provider</label>
              <select
                value={localSettings.primaryProvider}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, primaryProvider: e.target.value as 'gemini' | 'ollama' }))}
                className="w-full bg-[#070b16] border border-[#161c2e] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
              >
                <option value="gemini">Google Gemini</option>
                <option value="ollama">Ollama (Local)</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Fallback Routing Provider</label>
              <select
                value={localSettings.fallbackProvider}
                onChange={(e) => setLocalSettings(prev => ({ ...prev, fallbackProvider: e.target.value as 'gemini' | 'ollama' }))}
                className="w-full bg-[#070b16] border border-[#161c2e] rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/60"
              >
                <option value="gemini">Google Gemini</option>
                <option value="ollama">Ollama (Local)</option>
              </select>
            </div>

            {/* Toggle switch for Enable Failover */}
            <div className="flex flex-col justify-end">
              <div className="flex items-center justify-between bg-[#070b16] border border-[#161c2e] rounded-lg h-9 px-4">
                <span className="text-xs text-slate-400 font-semibold">Enable Failover</span>
                
                {/* Purple styled custom checkbox/switch */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localSettings.failoverEnabled}
                    onChange={(e) => setLocalSettings(prev => ({ ...prev, failoverEnabled: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-900 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 peer-checked:after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600 border border-[#161c2e]"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Understading failover textbox */}
          <div className="p-3.5 bg-[#070b16] border border-[#161c2e] rounded-xl flex items-start space-x-2 text-[10px] text-slate-500 leading-relaxed">
            <AlertCircle className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-400 block mb-0.5">Understanding Failover Logic:</span>
              <span>
                When a workspace query is executed, the client routes the prompt to the <span className="text-slate-300 font-semibold">Primary Provider</span>. If the request fails or times out, the system automatically redirects the query to the <span className="text-slate-300 font-semibold">Fallback Provider</span> and displays a header banner warning.
              </span>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
export default Settings;
