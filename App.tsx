import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { Button } from './components/Button';
import { polishTextWithGemini, transcribeAudioWithGemini } from './services/geminiService';
import { ProcessingStatus } from './types';
import { 
  Wand2, 
  Copy, 
  RotateCcw, 
  Eraser, 
  CheckCheck,
  ArrowRight,
  AlertCircle,
  FileText,
  Sparkles,
  Mic,
  Square,
  Loader2,
  ChevronDown,
  Info,
  X,
  Key
} from 'lucide-react';

// Attempt to get environment key (works in AI Studio / local env if configured)
const ENV_API_KEY = process.env.API_KEY || '';

const App: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [status, setStatus] = useState<ProcessingStatus>(ProcessingStatus.IDLE);
  const [errorMessage, setErrorMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  
  // API Key & Settings State
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [tempApiKey, setTempApiKey] = useState('');

  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Ref for auto-scrolling to output on mobile
  const outputRef = useRef<HTMLDivElement>(null);

  // Initialize API Key from storage or env
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini_api_key');
    if (storedKey) {
      setApiKey(storedKey);
      setTempApiKey(storedKey);
    } else if (ENV_API_KEY) {
      setApiKey(ENV_API_KEY);
      setTempApiKey(ENV_API_KEY);
    } else {
      // If no key found, prompt user to enter one
      setShowSettings(true);
    }
  }, []);

  const handleSaveSettings = () => {
    if (tempApiKey.trim()) {
      setApiKey(tempApiKey.trim());
      localStorage.setItem('gemini_api_key', tempApiKey.trim());
      setShowSettings(false);
      setErrorMessage(''); // Clear any previous auth errors
    }
  };

  const handlePolish = useCallback(async () => {
    if (!inputText.trim()) return;
    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    setStatus(ProcessingStatus.PROCESSING);
    setErrorMessage('');
    setCopied(false);

    try {
      const polished = await polishTextWithGemini(inputText, selectedModel, apiKey);
      setOutputText(polished);
      setStatus(ProcessingStatus.SUCCESS);
      
      // On mobile, scroll to output
      if (window.innerWidth < 768) {
        setTimeout(() => {
          outputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    } catch (error: any) {
      setStatus(ProcessingStatus.ERROR);
      setErrorMessage(error.message || "An unexpected error occurred.");
      // If error is related to auth (400/403 often implies key issues), prompt settings
      if (error.message?.includes('API key') || error.message?.includes('403')) {
        setShowSettings(true);
      }
    }
  }, [inputText, selectedModel, apiKey]);

  const handleClear = useCallback(() => {
    setInputText('');
    setOutputText('');
    setStatus(ProcessingStatus.IDLE);
    setErrorMessage('');
    setCopied(false);
  }, []);

  const handleCopy = useCallback(() => {
    if (!outputText) return;
    navigator.clipboard.writeText(outputText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [outputText]);

  const startRecording = useCallback(async () => {
    if (!apiKey) {
      setShowSettings(true);
      return;
    }

    try {
      setErrorMessage('');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        setIsTranscribing(true);
        setIsRecording(false);
        
        try {
          const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
          const reader = new FileReader();
          
          reader.onloadend = async () => {
            const base64Audio = (reader.result as string).split(',')[1];
            try {
              const transcript = await transcribeAudioWithGemini(base64Audio, audioBlob.type, apiKey);
              setInputText(prev => {
                const spacer = prev && !prev.endsWith(' ') && !prev.endsWith('\n') ? ' ' : '';
                return prev + spacer + transcript;
              });
            } catch (error: any) {
              setErrorMessage(error.message || "Failed to transcribe audio.");
            } finally {
              setIsTranscribing(false);
            }
          };
          
          reader.readAsDataURL(audioBlob);
        } catch (e) {
          setIsTranscribing(false);
          setErrorMessage("Error processing audio.");
        } finally {
          // Stop all tracks to release microphone
          stream.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error(e);
      setErrorMessage("Microphone access denied or not available.");
    }
  }, [apiKey]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const toggleRecording = useCallback(() => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  }, [isRecording, startRecording, stopRecording]);

  // Basic word count approximation
  const inputWordCount = inputText.trim() ? inputText.trim().split(/\s+/).length : 0;
  const outputWordCount = outputText.trim() ? outputText.trim().split(/\s+/).length : 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative">
      <Header onOpenSettings={() => setShowSettings(true)} />

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 relative animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setShowSettings(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-2">
                <div className="bg-indigo-100 p-2 rounded-lg">
                  <Key className="h-5 w-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">API Setup</h2>
              </div>
              <p className="text-slate-600 text-sm">
                To use ProText Polisher, you need to provide your own Google Gemini API Key. Your key is stored locally in your browser and never sent to our servers.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Gemini API Key
                </label>
                <input
                  type="password"
                  value={tempApiKey}
                  onChange={(e) => setTempApiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                />
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
                <p className="flex items-start">
                  <Info className="h-4 w-4 mr-1.5 flex-shrink-0 mt-0.5" />
                  <span>
                    Don't have a key? Get one for free at{' '}
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline font-medium hover:text-blue-800"
                    >
                      Google AI Studio
                    </a>.
                  </span>
                </p>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button 
                  variant="secondary" 
                  className="w-full"
                  onClick={() => setShowSettings(false)}
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  className="w-full"
                  onClick={handleSaveSettings}
                  disabled={!tempApiKey.trim()}
                >
                  Save API Key
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Intro / Instructions */}
        <div className="mb-8 text-center sm:text-left">
          <h2 className="text-3xl font-bold text-slate-900 mb-2">Transform Spoken Thoughts into Professional Prose</h2>
          <p className="text-slate-600 max-w-2xl">
            Record your voice or paste your raw speech-to-text transcripts below. Our AI editor will remove filler words, correct grammar, and improve flow while strictly preserving your original meaning.
          </p>
        </div>

        {/* Editor Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 h-[calc(100vh-280px)] min-h-[500px]">
          
          {/* Input Panel */}
          <div className="flex flex-col h-full bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden ring-1 ring-slate-900/5 transition-shadow hover:shadow-xl duration-300">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-700">
                <FileText className="h-4 w-4" />
                <span className="font-semibold text-sm">Original Transcript</span>
              </div>
              <div className="flex items-center space-x-2">
                 <span className="text-xs text-slate-400 font-mono mr-2">{inputWordCount} words</span>
                 
                 {/* Microphone / Record Button */}
                 <button 
                   onClick={toggleRecording}
                   disabled={isTranscribing}
                   className={`p-1.5 rounded-md transition-all duration-200 flex items-center justify-center
                     ${isRecording 
                       ? 'bg-red-50 text-red-600 ring-1 ring-red-200' 
                       : 'hover:bg-slate-200 text-slate-500 hover:text-indigo-600'
                     }
                     ${isTranscribing ? 'opacity-50 cursor-not-allowed' : ''}
                   `}
                   title={isRecording ? "Stop Recording" : "Start Recording"}
                 >
                   {isTranscribing ? (
                     <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                   ) : isRecording ? (
                     <Square className="h-4 w-4 animate-pulse fill-current" />
                   ) : (
                     <Mic className="h-4 w-4" />
                   )}
                 </button>

                {inputText && (
                  <button 
                    onClick={handleClear}
                    disabled={isRecording || isTranscribing}
                    className="p-1.5 hover:bg-slate-200 rounded-md text-slate-500 hover:text-red-600 transition-colors"
                    title="Clear text"
                  >
                    <Eraser className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <textarea
              className="flex-grow w-full p-4 resize-none focus:outline-none text-slate-800 text-lg leading-relaxed placeholder:text-slate-300"
              placeholder={isRecording ? "Listening..." : "Record your voice or paste your text here..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              spellCheck={false}
              disabled={isRecording}
            />
            
            {/* Action Bar */}
            <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between">
              
              {/* Model Selector */}
              <div className="relative w-full sm:w-auto">
                <div className="relative">
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={status === ProcessingStatus.PROCESSING || isRecording}
                    className="appearance-none w-full sm:w-64 bg-slate-50 border border-slate-200 text-slate-700 py-2.5 pl-3 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer hover:bg-slate-100 transition-colors"
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Fast)</option>
                    <option value="gemini-3-pro-preview">Gemini 3.0 Pro (High Quality)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none">
                    <ChevronDown className="h-4 w-4 text-slate-500" />
                  </div>
                </div>
                
                {/* Info Tooltip (visual aid) */}
                <div className="absolute -top-3 right-0 -mr-2 hidden sm:block">
                  <div className="group relative">
                    <Info className="h-3 w-3 text-slate-300 hover:text-indigo-400 cursor-help" />
                    <div className="hidden group-hover:block absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-56 p-2 bg-slate-800 text-slate-100 text-xs rounded shadow-lg z-20 pointer-events-none">
                      Flash is faster. Pro offers deeper reasoning for complex transcripts but may take longer.
                    </div>
                  </div>
                </div>
              </div>

               <Button 
                onClick={handlePolish}
                disabled={!inputText.trim() || status === ProcessingStatus.PROCESSING || isRecording || isTranscribing}
                isLoading={status === ProcessingStatus.PROCESSING}
                icon={<Wand2 className="h-4 w-4" />}
                className="w-full sm:w-auto"
              >
                {status === ProcessingStatus.PROCESSING ? 'Polishing...' : 'Polish Text'}
              </Button>
            </div>
          </div>

          {/* Arrow Indicator (Desktop only) */}
          <div className="hidden lg:flex flex-col items-center justify-center -mx-4 z-10 pointer-events-none opacity-50">
             <ArrowRight className="h-8 w-8 text-slate-300" />
          </div>

          {/* Output Panel */}
          <div ref={outputRef} className="flex flex-col h-full bg-slate-800/5 rounded-xl border border-slate-200/60 overflow-hidden relative">
             {/* Background Pattern */}
             <div className="absolute inset-0 opacity-[0.03] pointer-events-none" 
                 style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '24px 24px' }}>
             </div>

            <div className="px-4 py-3 bg-white/50 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between z-10">
              <div className="flex items-center space-x-2 text-indigo-900">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <span className="font-semibold text-sm">Polished Output</span>
              </div>
               <div className="flex items-center space-x-2">
                 {status === ProcessingStatus.SUCCESS && (
                    <span className="text-xs text-slate-500 font-mono mr-2">{outputWordCount} words</span>
                 )}
                 <Button 
                    variant="secondary" 
                    size="sm"
                    className="!py-1 !px-2 text-xs h-8"
                    onClick={handleCopy}
                    disabled={!outputText}
                    title="Copy to clipboard"
                  >
                    {copied ? <CheckCheck className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </Button>
               </div>
            </div>

            <div className="flex-grow relative z-0">
              {status === ProcessingStatus.ERROR || errorMessage ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-200">
                  <div className="bg-red-50 p-3 rounded-full mb-3">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <h3 className="text-slate-900 font-medium">Processing Error</h3>
                  <p className="text-slate-500 text-sm mt-1">{errorMessage}</p>
                  <Button variant="ghost" onClick={handlePolish} className="mt-4 text-red-600 hover:text-red-700 hover:bg-red-50">
                    <RotateCcw className="h-4 w-4 mr-2" /> Try Again
                  </Button>
                </div>
              ) : outputText ? (
                <div className="h-full w-full overflow-auto p-6 bg-white">
                  <p className="text-slate-800 text-lg leading-loose whitespace-pre-wrap font-serif">
                    {outputText}
                  </p>
                </div>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                  <div className="bg-slate-100 p-4 rounded-full mb-4">
                    <Wand2 className="h-8 w-8 text-slate-300" />
                  </div>
                  <p className="font-medium">Ready to polish</p>
                  <p className="text-sm mt-1 max-w-xs">Record or enter your transcript on the left and click "Polish Text".</p>
                </div>
              )}
            </div>
            
            {status === ProcessingStatus.SUCCESS && (
                <div className="p-3 bg-green-50/50 border-t border-green-100 text-green-800 text-xs flex justify-center items-center z-10">
                    <CheckCheck className="h-3 w-3 mr-1.5" /> 
                    Successfully refined with {selectedModel === 'gemini-3-pro-preview' ? 'Gemini 3.0 Pro' : 'Gemini 2.5 Flash'}
                </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;