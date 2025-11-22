import React from 'react';
import { Cpu, Terminal, Layers } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-lg shadow-blue-500/20">
            <Cpu className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">NeuroDeploy</h1>
            <p className="text-xs text-slate-400 font-mono">LangChain Environment Generator</p>
          </div>
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-slate-400">
          <div className="flex items-center gap-2 hover:text-blue-400 transition-colors cursor-pointer">
            <Terminal size={16} />
            <span>Script Gen</span>
          </div>
          <div className="flex items-center gap-2 hover:text-blue-400 transition-colors cursor-pointer">
            <Layers size={16} />
            <span>Architecture</span>
          </div>
          <div className="px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-xs font-mono text-emerald-400">
            v2.5.0-RC
          </div>
        </div>
      </div>
    </header>
  );
};