import React from 'react';
import { Sparkles, Feather, Settings } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSettings }) => {
  return (
    <header className="border-b border-slate-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <Feather className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">ProText Polisher</h1>
            <p className="text-xs text-slate-500 font-medium hidden sm:block">AI-Powered Dictation to Prose</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:flex items-center space-x-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full">
            <Sparkles className="h-4 w-4" />
            <span className="font-semibold">Powered by Gemini</span>
          </div>
          <button 
            onClick={onOpenSettings}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
            title="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};