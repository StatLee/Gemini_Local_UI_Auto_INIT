import React, { useState } from 'react';
import { GeneratedScript } from '../types';
import { Copy, Download, Check, FileCode, FileTerminal } from 'lucide-react';

interface ScriptPreviewProps {
  scripts: GeneratedScript[];
}

export const ScriptPreview: React.FC<ScriptPreviewProps> = ({ scripts }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(scripts[activeTab].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (script: GeneratedScript) => {
    const blob = new Blob([script.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = script.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAll = () => {
    scripts.forEach(script => handleDownload(script));
  };

  return (
    <div className="bg-slate-900 rounded-xl border border-slate-800 overflow-hidden flex flex-col h-[600px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-950">
        <div className="flex gap-2 overflow-x-auto">
          {scripts.map((script, idx) => (
            <button
              key={script.filename}
              onClick={() => setActiveTab(idx)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all ${
                activeTab === idx
                  ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {script.language === 'python' ? <FileCode size={14} /> : <FileTerminal size={14} />}
              {script.filename}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
           <button
            onClick={handleDownloadAll}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
          >
            <Download size={14} />
            Download Bundle
          </button>
        </div>
      </div>

      <div className="relative flex-1 bg-[#0d1117] overflow-hidden flex flex-col">
         <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            onClick={handleCopy}
            className="p-2 rounded-md bg-slate-800/50 hover:bg-slate-700 text-slate-400 transition-colors backdrop-blur-sm border border-slate-700/50"
            title="Copy Content"
          >
            {copied ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
          </button>
          <button
            onClick={() => handleDownload(scripts[activeTab])}
            className="p-2 rounded-md bg-slate-800/50 hover:bg-slate-700 text-slate-400 transition-colors backdrop-blur-sm border border-slate-700/50"
            title="Download File"
          >
            <Download size={16} />
          </button>
        </div>
        
        <div className="p-4 border-b border-slate-800 bg-slate-900/50">
            <p className="text-sm text-slate-400 font-mono">{scripts[activeTab].description}</p>
        </div>

        <div className="flex-1 overflow-auto p-6 custom-scrollbar">
          <pre className="font-mono text-sm leading-relaxed">
            <code className="language-python text-slate-300">
              {scripts[activeTab].content}
            </code>
          </pre>
        </div>
      </div>
    </div>
  );
};