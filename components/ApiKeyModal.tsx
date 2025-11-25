import React, { useState, useEffect } from 'react';
import { Key, ExternalLink, X, Eye, EyeOff } from 'lucide-react';
import { Button } from './Button';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (key: string) => void;
  currentKey: string;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, onSave, currentKey }) => {
  const [key, setKey] = useState(currentKey);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    setKey(currentKey);
  }, [currentKey, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(key);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2 text-slate-800">
            <Key className="h-5 w-5 text-indigo-600" />
            <h3 className="font-semibold text-lg">API Configuration</h3>
          </div>
          {currentKey && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Google Gemini API Key</label>
            <div className="relative">
              <input
                type={showKey ? "text" : "password"}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-3 pr-10 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-mono text-sm"
                required
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-slate-500">
              Your API key is stored locally in your browser and never sent to our servers.
            </p>
          </div>

          <div className="bg-indigo-50 rounded-lg p-3 text-sm text-indigo-800 flex items-start space-x-3">
             <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
             <div>
               <p className="font-medium">Need an API Key?</p>
               <a 
                 href="https://aistudio.google.com/app/apikey" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-indigo-600 underline hover:text-indigo-800"
               >
                 Get one for free at Google AI Studio
               </a>
             </div>
          </div>

          <div className="pt-2">
            <Button type="submit" className="w-full" disabled={!key.trim()}>
              Save API Key
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};