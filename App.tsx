import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ConfigPanel } from './components/ConfigPanel';
import { ScriptPreview } from './components/ScriptPreview';
import { Assistant } from './components/Assistant';
import { AppConfig, GeneratedScript } from './types';
import { 
  DEFAULT_CONFIG, 
  INSTALL_SCRIPT_TEMPLATE, 
  RUN_SCRIPT_TEMPLATE, 
  PYTHON_APP_TEMPLATE, 
  REQUIREMENTS_TEMPLATE,
  ROLLBACK_SCRIPT_TEMPLATE,
  BAT_INSTALL_TEMPLATE,
  BAT_RUN_TEMPLATE,
  BAT_ROLLBACK_TEMPLATE
} from './constants';

const App: React.FC = () => {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  // Generate scripts based on current config
  const scripts: GeneratedScript[] = useMemo(() => {
    return [
      {
        filename: 'setup.bat',
        content: BAT_INSTALL_TEMPLATE,
        language: 'text',
        description: 'WINDOWS INSTALLER: Double-click this to install. It automatically bypasses execution policy restrictions.'
      },
      {
        filename: 'start.bat',
        content: BAT_RUN_TEMPLATE,
        language: 'text',
        description: 'APP LAUNCHER: Double-click this to run the app.'
      },
      {
        filename: 'rollback.bat',
        content: BAT_ROLLBACK_TEMPLATE,
        language: 'text',
        description: 'UNINSTALLER: Double-click to safely delete the current environment and start fresh.'
      },
      {
        filename: 'install_langchain.ps1',
        content: INSTALL_SCRIPT_TEMPLATE(config),
        language: 'powershell',
        description: 'Underlying PowerShell installer logic.'
      },
      {
        filename: 'run_app.ps1',
        content: RUN_SCRIPT_TEMPLATE,
        language: 'powershell',
        description: 'Underlying PowerShell launcher logic.'
      },
      {
        filename: 'rollback.ps1',
        content: ROLLBACK_SCRIPT_TEMPLATE,
        language: 'powershell',
        description: 'Cleanup script. Safely removes the virtual environment and temporary files.'
      },
      {
        filename: 'app.py',
        content: PYTHON_APP_TEMPLATE(config),
        language: 'python',
        description: 'The main application. Includes RAG, Chat, and Media Generation logic.'
      },
      {
        filename: 'requirements.txt',
        content: REQUIREMENTS_TEMPLATE,
        language: 'text',
        description: 'Python dependencies: LangChain, Streamlit, Google GenAI, FAISS, etc.'
      }
    ];
  }, [config]);

  // Create a context string for the AI assistant
  const contextString = `
    User Config:
    GPU: ${config.gpuProfile} (4060 Ti Optimized)
    LLM Provider: ${config.llmProvider}
    Features: ${Object.keys(config.features).filter(k => config.features[k as keyof typeof config.features]).join(', ')}
    
    System Logic:
    The system uses 'gemini-2.0-flash-thinking-exp' for deep reasoning.
    RAG is handled via FAISS (CPU) + Google Embeddings to save VRAM.
    Media generation uses 'google-genai' SDK for Imagen 3 and Veo.
  `;

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 font-sans selection:bg-blue-500/30">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Config */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 rounded-xl p-6 border border-blue-800/30">
              <h2 className="text-xl font-bold text-white mb-2">Welcome, Engineer.</h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                Configure your local LangChain suite below. This tool generates production-ready scripts optimized for your RTX 4060 Ti, leveraging Cloud APIs to keep local VRAM free for rendering.
              </p>
            </div>
            <ConfigPanel config={config} setConfig={setConfig} />
            
            <div className="p-4 rounded-lg border border-emerald-900/50 bg-emerald-950/10 text-emerald-400 text-xs leading-relaxed">
              <strong>Optimization Active:</strong> 
              <br/>
              - LLM & Embeddings offloaded to Gemini Cloud (Save ~6GB VRAM).
              <br/>
              - Vector Store runs on CPU (FAISS).
              <br/>
              - RTX 4060 Ti is free for local display/gaming while AI runs.
            </div>
          </div>

          {/* Right Column: Preview */}
          <div className="lg:col-span-8">
             <ScriptPreview scripts={scripts} />
             
             <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <StepCard 
                  step="01" 
                  title="Download Bundle" 
                  desc="Click the green download button to save all files (including .bat helpers)." 
                />
                <StepCard 
                  step="02" 
                  title="Clean Install" 
                  desc="Run 'rollback.bat' to clean old files, then 'setup.bat' to reinstall." 
                />
                <StepCard 
                  step="03" 
                  title="Start App" 
                  desc="Double-click 'start.bat' to launch the interface." 
                />
             </div>
          </div>
        </div>
      </main>

      <Assistant context={contextString} />
    </div>
  );
};

const StepCard: React.FC<{ step: string; title: string; desc: string }> = ({ step, title, desc }) => (
  <div className="bg-slate-900/50 border border-slate-800 p-4 rounded-lg">
    <div className="text-blue-500 font-mono text-xs mb-2">STEP {step}</div>
    <div className="font-semibold text-white mb-1">{title}</div>
    <div className="text-xs text-slate-400">{desc}</div>
  </div>
);

export default App;