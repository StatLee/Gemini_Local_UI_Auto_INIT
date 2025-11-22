import React from 'react';
import { AppConfig, GPUProfile } from '../types';
import { Settings, HardDrive, CloudLightning, Zap, BrainCircuit } from 'lucide-react';

interface ConfigPanelProps {
  config: AppConfig;
  setConfig: React.Dispatch<React.SetStateAction<AppConfig>>;
}

export const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, setConfig }) => {
  const handleFeatureToggle = (key: keyof AppConfig['features']) => {
    setConfig(prev => ({
      ...prev,
      features: {
        ...prev.features,
        [key]: !prev.features[key]
      }
    }));
  };

  return (
    <div className="space-y-8">
      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <HardDrive className="text-blue-500" size={20} />
          Hardware & Model Config
        </h2>
        <div className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-slate-400 mb-2 block">Target GPU Environment</span>
            <select
              value={config.gpuProfile}
              onChange={(e) => setConfig({ ...config, gpuProfile: e.target.value as GPUProfile })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600/50 transition-all"
            >
              {Object.values(GPUProfile).map((profile) => (
                <option key={profile} value={profile}>{profile}</option>
              ))}
            </select>
            {config.gpuProfile === GPUProfile.MID && (
              <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                <CheckIcon /> Optimized for RTX 4060 Ti (8GB/16GB)
              </p>
            )}
          </label>
          
          <div>
            <span className="text-sm font-medium text-slate-400 mb-2 block">Core LLM Provider</span>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setConfig({ ...config, llmProvider: 'gemini' })}
                className={`px-4 py-3 rounded-lg border text-left transition-all ${
                  config.llmProvider === 'gemini'
                    ? 'bg-blue-600/10 border-blue-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <div className="font-semibold text-sm mb-1">Gemini (Cloud)</div>
                <div className="text-xs opacity-70">High Speed, No VRAM. Supports Deep Thinking & Imagen 3.</div>
              </button>
              <button
                onClick={() => setConfig({ ...config, llmProvider: 'ollama' })}
                className={`px-4 py-3 rounded-lg border text-left transition-all ${
                  config.llmProvider === 'ollama'
                    ? 'bg-blue-600/10 border-blue-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                }`}
              >
                <div className="font-semibold text-sm mb-1">Ollama (Local)</div>
                <div className="text-xs opacity-70">Requires 8GB+ VRAM. Good for privacy, slower for reasoning.</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="text-amber-500" size={20} />
          Module Selection
        </h2>
        <div className="grid grid-cols-1 gap-3">
          {[
            { id: 'deepThinking', label: 'Deep Thinking', desc: 'Enable Gemini 2.0 Flash Thinking Exp logic' },
            { id: 'documentUpload', label: 'Local RAG Pipeline', desc: 'Upload PDF/TXT docs (Uses Cloud Embeddings)' },
            { id: 'textToImage', label: 'Imagen 3 Generation', desc: 'Text-to-Image support via Google GenAI SDK' },
            { id: 'imageToVideo', label: 'Veo Video Studio', desc: 'Image-to-Video generation (Preview)' },
            { id: 'webSearch', label: 'Live Web Search', desc: 'DuckDuckGo integration for current events' },
          ].map((feature) => (
            <label
              key={feature.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-slate-800 bg-slate-950/50 hover:bg-slate-900/50 cursor-pointer transition-colors"
            >
              <input
                type="checkbox"
                checked={config.features[feature.id as keyof AppConfig['features']]}
                onChange={() => handleFeatureToggle(feature.id as keyof AppConfig['features'])}
                className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-600 focus:ring-offset-slate-900"
              />
              <div>
                <div className="text-sm font-medium text-slate-200">{feature.label}</div>
                <div className="text-xs text-slate-500">{feature.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};

const CheckIcon = () => (
  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);