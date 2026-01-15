
import React, { useState, useEffect, useRef } from 'react';
import { Screen, Project, ChatMessage, Task, ProjectFile } from './types';
import { NAV_ITEMS, MOCK_PROJECTS, MOCK_TASKS } from './constants';
import { PrimaryButton, SectionCard, Badge, LoadingDots } from './components/UI';
import { geminiService } from './services/geminiService';
import { githubService } from './services/githubService';
import { ragService } from './services/ragService';
import { auth, loginWithGoogle, loginAsGuest, logoutUser, onAuthStateChanged } from './services/firebase';
import { 
  createUserProfile, 
  createProject, 
  listenToUserProjects, 
  saveChatMessageToDB, 
  getChatHistoryFromDB 
} from './services/dbService';

declare const mermaid: any;
declare const window: any;

// --- Components ---

const Toast: React.FC<{ message: string; onHide: () => void }> = ({ message, onHide }) => {
  useEffect(() => {
    const t = setTimeout(onHide, 5000);
    return () => clearTimeout(t);
  }, [onHide]);
  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-zinc-800 text-white px-4 py-2 rounded-full text-xs font-medium border border-zinc-700 shadow-2xl z-[100] animate-in slide-in-from-bottom-2 max-w-[90vw] text-center">
      {message}
    </div>
  );
};

const SetupHelper: React.FC<{ error: string }> = ({ error }) => {
  const isIndexError = error.toLowerCase().includes("index");
  const isBuilding = error.toLowerCase().includes("building");
  const indexUrl = error.match(/https:\/\/console\.firebase\.google\.com[^\s]+/)?.[0];
  
  const rules = `rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /projects/{projectId} {
      allow read, write: if request.auth != null && (resource == null || resource.data.userId == request.auth.uid || request.resource.data.userId == request.auth.uid);
    }
    match /chat_messages/{messageId} {
      allow read, write: if request.auth != null && (resource == null || resource.data.userId == request.auth.uid || request.resource.data.userId == request.auth.uid);
    }
  }
}`;

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="max-w-md w-full bg-zinc-900 border border-amber-500/30 rounded-3xl p-8 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-16 h-16 bg-amber-500/10 rounded-full flex items-center justify-center text-3xl border border-amber-500/20">
            {isBuilding ? '⏳' : isIndexError ? '⚡' : '🛡️'}
          </div>
          <h2 className="text-xl font-bold">
            {isBuilding ? 'Index is Building' : isIndexError ? 'Database Index Required' : 'Firestore Setup Required'}
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            {isBuilding 
              ? 'Firestore is currently building the required index. This usually takes 3-5 minutes.'
              : isIndexError 
                ? 'To sort and filter projects, Firestore needs a composite index.'
                : 'Your Firestore Database is currently blocking requests. You must deploy security rules to allow access.'}
          </p>
        </div>
        
        {isIndexError ? (
          <div className="space-y-4">
             <div className="bg-zinc-950 p-4 rounded-xl space-y-3 border border-zinc-800">
              <div className="flex items-center gap-2 text-amber-500 text-[10px] font-bold uppercase tracking-widest">
                <span>{isBuilding ? 'Status' : 'The Fix'}</span>
              </div>
              <p className="text-[10px] text-zinc-500 leading-relaxed">
                {isBuilding 
                  ? 'The index creation was successfully triggered. Please wait a few moments and try reloading.'
                  : 'Click the button below to open the Firebase Console. It will automatically populate the required fields. Just click "Create Index" and wait 2-3 minutes.'}
              </p>
            </div>
            {indexUrl && (
              <PrimaryButton className="w-full" onClick={() => window.open(indexUrl, '_blank')}>
                {isBuilding ? "Check Progress in Console" : "🚀 Open Index Creator"}
              </PrimaryButton>
            )}
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-amber-500 text-[10px] font-bold uppercase tracking-widest">
                <span>Security Rules</span>
                <button 
                  onClick={() => navigator.clipboard.writeText(rules)}
                  className="bg-zinc-800 px-2 py-1 rounded border border-zinc-700 hover:bg-zinc-700 active:scale-95 transition-all"
                >
                  Copy Rules
                </button>
              </div>
              <pre className="bg-zinc-950 p-4 rounded-xl text-[10px] text-zinc-400 font-mono overflow-x-auto border border-zinc-800 leading-tight">
                {rules}
              </pre>
            </div>

            <div className="bg-zinc-950 p-4 rounded-xl space-y-3 border border-zinc-800">
              <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-bold uppercase tracking-widest">
                <span>Steps</span>
              </div>
              <ol className="text-[10px] text-zinc-500 space-y-2 list-decimal pl-4">
                <li>Go to <b>Firestore Database</b> > <b>Rules</b></li>
                <li>Paste code and click <b>Publish</b></li>
                <li>Wait 60 seconds</li>
              </ol>
            </div>
          </>
        )}

        <PrimaryButton variant="primary" className="w-full py-4 flex items-center justify-center gap-2" onClick={() => window.location.reload()}>
          {isBuilding && <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>}
          🔄 Reload App
        </PrimaryButton>
        
        <div className="text-[9px] text-zinc-600 font-mono text-center opacity-50 break-all">
          Raw Error: {error.substring(0, 150)}...
        </div>
      </div>
    </div>
  );
};

const SplashScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 1200);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="h-screen flex flex-col items-center justify-center bg-zinc-950 animate-pulse">
      <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-xl shadow-indigo-500/20">🎓</div>
      <h1 className="text-2xl font-bold tracking-tight">CodeSensei</h1>
      <p className="text-zinc-500 text-sm mt-2">Understand code. Faster.</p>
    </div>
  );
};

const Onboarding: React.FC<{ onSkip: () => void }> = ({ onSkip }) => {
  const [step, setStep] = useState(0);
  const steps = [
    { title: "Understand Complex Logic", desc: "CodeSensei breaks down large projects into digestible modules.", icon: "🧠" },
    { title: "Learn by Doing", desc: "Get step-by-step guidance for adding features or fixing bugs.", icon: "🛠️" },
    { title: "AI Architect", desc: "Visualize and query your architecture with high-precision AI.", icon: "🏗️" }
  ];
  return (
    <div className="h-screen p-8 flex flex-col bg-zinc-950">
      <div className="flex justify-end">
        <button onClick={onSkip} className="text-zinc-500 hover:text-zinc-100 transition-colors">Skip</button>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <div className="text-6xl mb-8">{steps[step].icon}</div>
        <h2 className="text-2xl font-bold mb-4">{steps[step].title}</h2>
        <p className="text-zinc-400 max-w-xs">{steps[step].desc}</p>
      </div>
      <div className="flex flex-col gap-4">
        <div className="flex justify-center gap-2 mb-4">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-8 bg-indigo-500' : 'w-1.5 bg-zinc-800'}`}></div>
          ))}
        </div>
        <PrimaryButton onClick={() => step < steps.length - 1 ? setStep(s => s + 1) : onSkip()}>
          {step === steps.length - 1 ? "Get Started" : "Next"}
        </PrimaryButton>
      </div>
    </div>
  );
};

const AuthScreen: React.FC<{ onAuth: (type: 'google' | 'guest') => void; error?: string | null }> = ({ onAuth, error }) => {
  const [loading, setLoading] = useState(false);

  const handleAction = async (type: 'google' | 'guest') => {
    setLoading(true);
    try {
      await onAuth(type);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const isConfigError = error?.toLowerCase().includes("enable") || error?.toLowerCase().includes("authorized") || error?.toLowerCase().includes("domain");

  return (
    <div className="h-screen p-8 flex flex-col justify-center bg-zinc-950">
      <div className="mb-12">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-2xl mb-4 shadow-lg shadow-indigo-500/20">🎓</div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome to CodeSensei</h2>
        <p className="text-zinc-500 mt-1">Ready to deep dive into your codebase?</p>
      </div>

      {isConfigError && (
        <div className="mb-8 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-3 animate-in fade-in zoom-in-95">
          <div className="flex items-center gap-2 text-amber-500">
            <span className="text-xl">⚠️</span>
            <span className="text-xs font-bold uppercase tracking-widest">Firebase Config Issue</span>
          </div>
          <p className="text-xs text-amber-200/80 leading-relaxed">
            {error}
          </p>
          <div className="text-[10px] text-amber-500/60 font-mono space-y-1">
            <p>1. Open Firebase Console</p>
            <p>2. Go to Build > Authentication</p>
            <p>3. Settings > Authorized Domains (Add this domain)</p>
            <p>4. Sign-in Method > Enable "Anonymous" & "Google"</p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <PrimaryButton variant="outline" className="w-full py-4 bg-zinc-900/50" onClick={() => handleAction('google')} disabled={loading}>
          <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
          {loading ? <LoadingDots /> : "Continue with Google"}
        </PrimaryButton>
        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-zinc-800"></div>
          <span className="flex-shrink mx-4 text-zinc-600 text-[10px] font-bold uppercase tracking-widest">OR</span>
          <div className="flex-grow border-t border-zinc-800"></div>
        </div>
        <PrimaryButton variant="secondary" className="w-full py-4" onClick={() => handleAction('guest')} disabled={loading}>
          👤 {loading ? <LoadingDots /> : "Try Guest Mode"}
        </PrimaryButton>
        <p className="text-[10px] text-zinc-500 text-center px-4 leading-relaxed italic opacity-60">Guest data is stored in the cloud but tied to this browser session.</p>
      </div>
      
      <p className="text-[10px] text-zinc-600 text-center mt-12 px-8 leading-relaxed">By continuing, you acknowledge that CodeSensei processes your code for learning purposes via Gemini API.</p>
    </div>
  );
};

const UploadModal: React.FC<{ 
  onClose: () => void; 
  onLocalUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onGithubUpload: (url: string, token?: string) => void;
  isAnalyzing: boolean;
}> = ({ onClose, onLocalUpload, onGithubUpload, isAnalyzing }) => {
  const [activeTab, setActiveTab] = useState<'local' | 'github'>('local');
  const [githubUrl, setGithubUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGithubSubmit = () => {
    if (!githubUrl.trim()) return;
    onGithubUpload(githubUrl, githubToken);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-end sm:items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in slide-in-from-bottom-8">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold">New Project</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white">✕</button>
          </div>

          <div className="flex bg-zinc-950 p-1 rounded-xl mb-6">
            <button 
              onClick={() => setActiveTab('local')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'local' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}
            >
              📁 Local Files
            </button>
            <button 
              onClick={() => setActiveTab('github')}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${activeTab === 'github' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}
            >
              🐙 GitHub Repo
            </button>
          </div>

          {activeTab === 'local' ? (
            <div className="space-y-4">
              <div 
                onClick={() => !isAnalyzing && fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-800 rounded-2xl py-12 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500/50 hover:bg-indigo-500/5 transition-all group"
              >
                <input type="file" ref={fileInputRef} onChange={onLocalUpload} className="hidden" />
                {isAnalyzing ? (
                  <LoadingDots />
                ) : (
                  <>
                    <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">📄</span>
                    <span className="text-xs font-medium text-zinc-400">Select ZIP or Folder</span>
                  </>
                )}
              </div>
              <p className="text-[10px] text-zinc-500 text-center">Max 50MB. All files stay local until you chat.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest pl-1">Repository URL</label>
                <input 
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  placeholder="https://github.com/facebook/react"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <button 
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest pl-1 flex items-center gap-1 hover:text-indigo-400"
                >
                  {showAdvanced ? '▾' : '▸'} Advanced (Bypass Rate Limits)
                </button>
                {showAdvanced && (
                  <div className="space-y-2 animate-in slide-in-from-top-2">
                    <input 
                      type="password"
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="Optional: GitHub Personal Access Token"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all"
                    />
                    <p className="text-[9px] text-zinc-500 px-1 leading-relaxed">
                      GitHub limits anonymous requests. Use a token to fetch larger projects or bypass 403 errors.
                    </p>
                  </div>
                )}
              </div>

              <PrimaryButton 
                onClick={handleGithubSubmit} 
                className="w-full mt-2" 
                disabled={isAnalyzing || !githubUrl.trim()}
              >
                {isAnalyzing ? <LoadingDots /> : "Analyze Repository"}
              </PrimaryButton>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{ 
  user: any; 
  projects: Project[]; 
  onSelectProject: (p: Project) => void;
  onNavigate: (s: Screen) => void;
  openUpload: () => void;
}> = ({ user, projects, onSelectProject, onNavigate, openUpload }) => {
  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div onClick={() => onNavigate(Screen.Profile)} className="cursor-pointer">
          <h1 className="text-2xl font-bold tracking-tight">Hi, {user.displayName?.split(' ')[0] || 'Explorer'} 👋</h1>
          <p className="text-zinc-500 text-sm">{projects.length} active projects</p>
        </div>
        <div onClick={() => onNavigate(Screen.Profile)} className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-sm font-bold cursor-pointer hover:border-indigo-500 transition-colors shadow-lg overflow-hidden">
          {user.photoURL ? (
            <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
          ) : (
            user.displayName?.charAt(0) || '👤'
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <SectionCard onClick={openUpload} className="border-indigo-500/20 bg-indigo-500/5 flex flex-col items-center justify-center text-center p-6 gap-2 group transition-all">
          <span className="text-2xl group-hover:scale-110 transition-transform">📦</span>
          <span className="text-xs font-semibold text-indigo-400">New Project</span>
        </SectionCard>
        <SectionCard className="border-zinc-800 bg-zinc-900/50 flex flex-col items-center justify-center text-center p-6 gap-2" onClick={() => projects.length > 0 && onSelectProject(projects[0])}>
          <span className="text-2xl">⚡</span>
          <span className="text-xs font-semibold text-zinc-400">Resume Last</span>
        </SectionCard>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Recent Projects</h2>
          <button onClick={() => onNavigate(Screen.Projects)} className="text-indigo-400 text-xs hover:underline">See all</button>
        </div>
        <div className="space-y-3">
          {projects.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-zinc-800 rounded-2xl">
              <p className="text-zinc-600 text-sm italic">No projects yet. Click "New Project".</p>
            </div>
          )}
          {projects.slice(0, 4).map(project => (
            <SectionCard key={project.id} onClick={() => onSelectProject(project)} className="flex items-center gap-4 hover:bg-zinc-800/80">
              <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center text-xl font-bold text-indigo-400">
                {project.sourceType === 'github' ? '🐙' : project.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-sm truncate">{project.name}</h3>
                  {project.sourceType === 'github' && (
                    <span className="text-[8px] bg-zinc-950 px-1.5 py-0.5 rounded border border-zinc-800 text-zinc-500 font-bold uppercase">Repo</span>
                  )}
                </div>
                <p className="text-xs text-zinc-500 truncate">{project.lastAnalyzed}</p>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-mono text-indigo-400">{project.progress}%</div>
                <div className="w-12 h-1 bg-zinc-800 rounded-full overflow-hidden mt-1">
                  <div className="h-full bg-indigo-500" style={{ width: `${project.progress}%` }}></div>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      </div>
    </div>
  );
};

const Diagram: React.FC<{ project: Project; onBack: () => void; onExport: () => void }> = ({ project, onBack, onExport }) => {
  const [activeView, setActiveView] = useState<'mermaid' | 'ai'>('mermaid');
  const [diagram, setDiagram] = useState<string>('graph TD\nLoading[Loading Architecture...]');
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [imageSize, setImageSize] = useState<'1K' | '2K' | '4K'>('1K');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [hasValidKey, setHasValidKey] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const checkKey = async () => {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasValidKey(selected);
    };
    checkKey();
  }, []);

  useEffect(() => {
    const fetchDiagram = async () => {
      const d = await geminiService.generateArchitectureDiagram(project.description);
      setDiagram(d);
    };
    if (activeView === 'mermaid') fetchDiagram();
  }, [project, activeView]);

  useEffect(() => {
    if (activeView === 'mermaid' && diagram && containerRef.current) {
      mermaid.initialize({ startOnLoad: true, theme: 'dark', securityLevel: 'loose' });
      mermaid.contentLoaded();
    }
  }, [diagram, activeView]);

  const handleOpenKeySelector = async () => {
    await window.aistudio.openSelectKey();
    setHasValidKey(true); 
  };

  const handleGenerateAIImage = async () => {
    if (!hasValidKey) {
      await handleOpenKeySelector();
    }
    
    setIsGeneratingImage(true);
    setAiImageUrl(null);
    try {
      const url = await geminiService.generateArchitectureImage(project.description, imageSize);
      if (url) {
        setAiImageUrl(url);
      } else {
        throw new Error("No image generated");
      }
    } catch (e: any) {
      console.error(e);
      if (e.message?.includes('PERMISSION_DENIED') || e.message?.includes('entity was not found')) {
        setHasValidKey(false);
      }
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <div className="p-6 space-y-6 animate-in slide-in-from-right-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-zinc-500 text-xl hover:text-white transition-colors">←</button>
        <h1 className="text-xl font-bold">Architecture Map</h1>
      </div>

      <div className="flex bg-zinc-950 p-1 rounded-xl">
        <button 
          onClick={() => setActiveView('mermaid')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${activeView === 'mermaid' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}
        >
          📊 Interactive
        </button>
        <button 
          onClick={() => setActiveView('ai')}
          className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${activeView === 'ai' ? 'bg-zinc-800 text-white shadow' : 'text-zinc-500'}`}
        >
          ✨ AI Visualizer
        </button>
      </div>

      {activeView === 'mermaid' ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 overflow-auto relative min-h-[400px] flex flex-col items-center justify-center no-scrollbar">
           <div ref={containerRef} className="mermaid transition-transform duration-200" style={{ transform: `scale(${zoom})` }}>
             {diagram}
           </div>
           <div className="absolute bottom-4 right-4 flex gap-2">
             <button onClick={() => setZoom(z => Math.min(z + 0.2, 3))} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 hover:bg-zinc-700 shadow-xl">+</button>
             <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.4))} className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 hover:bg-zinc-700 shadow-xl">-</button>
           </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 min-h-[400px] flex flex-col items-center justify-center relative overflow-hidden group">
            {!hasValidKey && !aiImageUrl && !isGeneratingImage ? (
              <div className="text-center p-8 space-y-4">
                <div className="text-4xl">🔐</div>
                <p className="text-sm font-semibold">API Key Required</p>
                <p className="text-xs text-zinc-500 max-w-[240px] mx-auto">
                  Nano Banana Pro requires a paid project API key.
                </p>
                <PrimaryButton onClick={handleOpenKeySelector}>
                  Select Paid API Key
                </PrimaryButton>
              </div>
            ) : isGeneratingImage ? (
              <div className="flex flex-col items-center gap-4">
                <LoadingDots />
                <p className="text-xs text-zinc-500 font-medium animate-pulse">Rendering...</p>
              </div>
            ) : aiImageUrl ? (
              <img src={aiImageUrl} alt="AI Architecture" className="w-full h-auto rounded-lg shadow-2xl transition-transform duration-500 group-hover:scale-[1.02]" />
            ) : (
              <div className="text-center p-8 space-y-4">
                <div className="text-4xl">🎨</div>
                <p className="text-xs text-zinc-500 max-w-[200px]">Generate a visual map.</p>
                <PrimaryButton onClick={handleGenerateAIImage}>
                  Visualize System
                </PrimaryButton>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.Splash);
  const [isAuth, setIsAuth] = useState<boolean>(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [taskStatus, setTaskStatus] = useState<Record<string, boolean>>({});
  const [user, setUser] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [chatInitialPrompt, setChatInitialPrompt] = useState<string | undefined>(undefined);

  // Sync state to local storage for task status (UI only)
  useEffect(() => {
    const saved = localStorage.getItem('cs_tasks');
    if (saved) setTaskStatus(JSON.parse(saved));
  }, []);
  
  useEffect(() => localStorage.setItem('cs_tasks', JSON.stringify(taskStatus)), [taskStatus]);

  // Firebase Auth & Data Listeners
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setIsAuth(true);
        setAuthError(null);
        
        // Ensure Firestore profile exists
        const profileResult = await createUserProfile(firebaseUser.uid, {
          displayName: firebaseUser.displayName,
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
        });

        if (!profileResult.success && (profileResult.error?.toLowerCase().includes("permission") || profileResult.error?.toLowerCase().includes("index"))) {
          setConfigError(profileResult.error);
        }

        // Real-time listener for projects
        const unsubscribeProjects = listenToUserProjects(
          firebaseUser.uid, 
          (data) => setProjects(data),
          (error) => {
            if (error.message.toLowerCase().includes("permission") || error.message.toLowerCase().includes("index")) {
              setConfigError(error.message);
            }
          }
        );

        if ([Screen.Auth, Screen.Onboarding, Screen.Splash].includes(currentScreen)) {
          setCurrentScreen(Screen.Dashboard);
        }
        
        return () => unsubscribeProjects();
      } else {
        setUser(null);
        setIsAuth(false);
        if (![Screen.Onboarding, Screen.Splash].includes(currentScreen)) {
          setCurrentScreen(Screen.Auth);
        }
      }
    });
    return () => unsubscribeAuth();
  }, [currentScreen]);

  const showToast = (msg: string) => setToast(msg);

  const handleAuth = async (type: 'google' | 'guest') => {
    setAuthError(null);
    try {
      if (type === 'google') await loginWithGoogle();
      else await loginAsGuest();
    } catch (error: any) {
      console.error("Auth Error:", error);
      setAuthError(error.message);
      showToast(error.message);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentScreen(Screen.Auth);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsAnalyzing(true);
    try {
      const projectId = await createProject(user.uid, {
        name: file.name.split('.')[0],
        stack: ["Local", "Analyzing..."],
        lastAnalyzed: "Just now",
        progress: 0,
        description: `Local project: ${file.name}`,
        sourceType: 'local'
      });
      
      ragService.indexProject(projectId, [{
        path: 'README.md',
        content: `# ${file.name}\nLocal index.`,
        size: 100
      }]);

      setIsAnalyzing(false);
      setIsUploadModalOpen(false);
      showToast("Local project created and synced to cloud.");
    } catch (e: any) {
      if (e.message.toLowerCase().includes("permission") || e.message.toLowerCase().includes("index")) {
        setConfigError(e.message);
      }
      showToast("Failed to create project.");
      setIsAnalyzing(false);
    }
  };

  const handleGithubUpload = async (url: string, token?: string) => {
    const parsed = githubService.validateGitHubUrl(url);
    if (!parsed || !user) {
      showToast("Invalid GitHub URL format.");
      return;
    }

    setIsAnalyzing(true);
    try {
      // Stage 1: Meta
      showToast("Fetching repository metadata...");
      const metadata = await githubService.fetchRepoMetadata(parsed.owner, parsed.repo, token);
      if (!metadata) throw new Error("GitHub metadata fetch failed.");

      // Stage 2: Files
      showToast("Reading project files...");
      const projectFiles = await githubService.fetchFullProjectContent(parsed.owner, parsed.repo, metadata.defaultBranch, token);
      if (!projectFiles || projectFiles.length === 0) throw new Error("Repository appears to be empty or inaccessible.");

      // Stage 3: Database Save
      showToast("Syncing to cloud...");
      const projectId = await createProject(user.uid, {
        name: metadata.name,
        stack: ["Auto-Detecting Stack..."],
        lastAnalyzed: "Just now",
        progress: 10,
        description: metadata.description || `GitHub Repository: ${metadata.owner}/${metadata.name}`,
        sourceType: 'github',
        githubData: {
          url: url,
          owner: metadata.owner,
          repoName: metadata.name,
          branch: metadata.defaultBranch,
          stars: metadata.stars,
          lastCommitHash: metadata.lastCommitHash,
          lastUpdated: new Date(metadata.updatedAt).toLocaleDateString(),
          isPrivate: false
        }
      });

      // Stage 4: Indexing (RAG)
      ragService.indexProject(projectId, projectFiles);

      setIsAnalyzing(false);
      setIsUploadModalOpen(false);
      showToast("Repository successfully indexed and synced.");
    } catch (e: any) {
      console.error("Github Integration Error:", e);
      // Handle Firestore errors separately
      if (e.message.toLowerCase().includes("permission") || e.message.toLowerCase().includes("index")) {
        setConfigError(e.message);
      } else {
        showToast(e.message);
      }
      setIsAnalyzing(false);
    }
  };

  const renderScreen = () => {
    if (!isAuth && ![Screen.Splash, Screen.Onboarding, Screen.Auth].includes(currentScreen)) {
       return <AuthScreen onAuth={handleAuth} error={authError} />;
    }

    switch (currentScreen) {
      case Screen.Splash: return <SplashScreen onComplete={() => setCurrentScreen(isAuth ? Screen.Dashboard : Screen.Onboarding)} />;
      case Screen.Onboarding: return <Onboarding onSkip={() => setCurrentScreen(Screen.Auth)} />;
      case Screen.Auth: return <AuthScreen onAuth={handleAuth} error={authError} />;
      case Screen.Dashboard: return (
        <>
          <Dashboard projects={projects} user={user} openUpload={() => setIsUploadModalOpen(true)} onNavigate={setCurrentScreen} onSelectProject={(p) => { setSelectedProject(p); setCurrentScreen(Screen.ProjectDetail); }} />
          {isUploadModalOpen && (
            <UploadModal 
              onClose={() => setIsUploadModalOpen(false)} 
              isAnalyzing={isAnalyzing} 
              onLocalUpload={handleFileUpload} 
              onGithubUpload={handleGithubUpload} 
            />
          )}
        </>
      );
      case Screen.ProjectDetail: return selectedProject ? (
        <ProjectDetail project={selectedProject} onNavigate={setCurrentScreen} onReanalyze={() => showToast("Deep re-scan scheduled.")} onSync={() => showToast("Syncing with GitHub...")} />
      ) : null;
      case Screen.Chat: return (
        <div className="h-screen flex flex-col p-4 bg-zinc-950 overflow-hidden">
          <div className="flex items-center justify-between mb-4 px-2">
            <button onClick={() => setCurrentScreen(selectedProject ? Screen.ProjectDetail : Screen.Dashboard)} className="text-zinc-500 text-sm hover:text-white transition-colors">← Exit</button>
            <div className="text-center">
              <h2 className="text-xs font-bold text-zinc-600 uppercase tracking-widest">Sensei Chat</h2>
              <p className="text-[10px] text-zinc-500 truncate max-w-[150px]">{selectedProject?.name || 'Global'}</p>
            </div>
            <div className="w-8"></div>
          </div>
          <div className="flex-1 overflow-hidden">
             <Chat 
                initialPrompt={chatInitialPrompt} 
                projectId={selectedProject?.id || ''} 
                userId={user?.uid || ''}
                projectDescription={selectedProject?.description || 'General developer assistance.'} 
                onBack={() => {}} 
                onError={(err) => (err.toLowerCase().includes("permission") || err.toLowerCase().includes("index")) && setConfigError(err)}
             />
          </div>
        </div>
      );
      case Screen.Profile: return <Profile user={user} onLogout={handleLogout} onNavigate={setCurrentScreen} />;
      case Screen.Diagram: return selectedProject ? <Diagram project={selectedProject} onBack={() => setCurrentScreen(Screen.ProjectDetail)} onExport={() => showToast("Exporting...")} /> : null;
      default: return <div className="p-8 text-center text-zinc-500">Coming soon...</div>;
    }
  };

  const showNav = ![Screen.Splash, Screen.Onboarding, Screen.Auth].includes(currentScreen);

  return (
    <div className="max-w-md mx-auto min-h-screen bg-zinc-950 flex flex-col relative border-x border-zinc-900 shadow-2xl overflow-x-hidden">
      <main className="flex-1 pb-24 overflow-y-auto no-scrollbar">
        {renderScreen()}
      </main>
      
      {configError && <SetupHelper error={configError} />}
      {toast && <Toast message={toast} onHide={() => setToast(null)} />}
      
      {showNav && (
        <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-800 flex justify-around p-3 z-50">
          {NAV_ITEMS.map(item => {
            const isHomeActive = item.id === Screen.Dashboard && [Screen.Dashboard, Screen.ProjectDetail, Screen.Diagram].includes(currentScreen);
            const isActive = currentScreen === item.id || isHomeActive;
            
            return (
              <button key={item.id} onClick={() => { setChatInitialPrompt(undefined); setCurrentScreen(item.id); }} className={`flex flex-col items-center gap-1 transition-all px-4 py-1 rounded-lg ${isActive ? 'text-indigo-400' : 'text-zinc-600 hover:text-zinc-400'}`}>
                <span className="text-xl">{item.icon}</span>
                <span className="text-[10px] font-bold tracking-wide uppercase">{item.label}</span>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}

// --- Internal Reusable Components ---

function ProjectDetail({ project, onNavigate, onReanalyze, onSync }: { project: Project; onNavigate: (s: Screen) => void; onReanalyze: () => void; onSync: () => void }) {
  const indexedFilesCount = ragService.getProjectFileCount(project.id);
  
  return (
    <div className="p-6 space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <button onClick={() => onNavigate(Screen.Dashboard)} className="text-zinc-500 text-xl hover:text-white transition-colors">←</button>
        <h1 className="text-xl font-bold truncate flex-1">{project.name}</h1>
        <Badge color="bg-indigo-600/20 text-indigo-400 border border-indigo-500/20">{project.progress}%</Badge>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SectionCard onClick={() => onNavigate(Screen.Diagram)} className="flex flex-col items-center justify-center p-4 gap-2 hover:border-indigo-500/50">
          <span className="text-2xl">🗺️</span>
          <span className="text-xs font-semibold text-zinc-400">Architecture</span>
        </SectionCard>
        <SectionCard onClick={() => onNavigate(Screen.LearnByTask)} className="flex flex-col items-center justify-center p-4 gap-2 hover:border-indigo-500/50">
          <span className="text-2xl">🎯</span>
          <span className="text-xs font-semibold text-zinc-400">Task Mode</span>
        </SectionCard>
      </div>

      <SectionCard title="Source Control & RAG">
        <div className="flex justify-between items-start mb-4">
          <div className="flex flex-col gap-1">
             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Knowledge Base</span>
             <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${indexedFilesCount > 0 ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-yellow-500'}`}></div>
                <span className="text-xs font-bold text-zinc-200">{indexedFilesCount > 0 ? `${indexedFilesCount} Files Indexed` : 'Not Indexed'}</span>
             </div>
          </div>
          <div className="text-right">
             <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Type</span>
             <p className="text-xs text-zinc-200 capitalize font-semibold">{project.sourceType}</p>
          </div>
        </div>
      </SectionCard>

      <div className="flex flex-col gap-3 pt-4">
        <PrimaryButton onClick={() => onNavigate(Screen.Chat)}>
          Ask CodeSensei anything
        </PrimaryButton>
        <PrimaryButton variant="outline" onClick={onReanalyze}>
          {project.sourceType === 'github' ? 'Deep Re-Scan' : 'Re-scan Local'}
        </PrimaryButton>
      </div>
    </div>
  );
}

function Chat({ initialPrompt, projectId, userId, projectDescription, onError }: { initialPrompt?: string; projectId: string; userId: string; projectDescription: string; onBack: () => void; onError?: (err: string) => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load History
  useEffect(() => {
    const loadHistory = async () => {
      if (!projectId) return;
      try {
        const history = await getChatHistoryFromDB(projectId);
        if (history.length > 0) setMessages(history);
        else setMessages([{ id: '1', role: 'assistant', content: "Hi! I'm CodeSensei. Ask me anything about your indexed code!", timestamp: new Date() }]);
      } catch (e: any) {
        if ((e.message.toLowerCase().includes("permission") || e.message.toLowerCase().includes("index")) && onError) onError(e.message);
      }
    };
    loadHistory();
  }, [projectId]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isTyping]);

  const handleSend = async (val?: string) => {
    const text = val || input;
    if (!text.trim()) return;
    
    const userMsg: Partial<ChatMessage> = { role: 'user', content: text, timestamp: new Date() };
    setMessages(prev => [...prev, { id: Date.now().toString(), ...userMsg } as ChatMessage]);
    setInput('');
    setIsTyping(true);

    try {
      // Save User message
      await saveChatMessageToDB(projectId, userId, userMsg);
      
      // RAG Call
      const responseText = await geminiService.askCodeSensei(text, projectId, projectDescription);
      
      const aiMsg: Partial<ChatMessage> = { role: 'assistant', content: responseText, timestamp: new Date() };
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), ...aiMsg } as ChatMessage]);
      setIsTyping(false);

      // Save AI message
      await saveChatMessageToDB(projectId, userId, aiMsg);
    } catch (e: any) {
      if ((e.message.toLowerCase().includes("permission") || e.message.toLowerCase().includes("index")) && onError) onError(e.message);
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (initialPrompt) handleSend(initialPrompt);
  }, [initialPrompt]);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar">
        {messages.map(m => (
          <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${m.role === 'user' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-zinc-900 border border-zinc-800 text-zinc-200 shadow-xl shadow-black/20'}`}>
              <pre className="whitespace-pre-wrap font-sans text-xs md:text-sm">{m.content}</pre>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-4 flex flex-col gap-2">
               <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest animate-pulse">Reading codebase...</span>
               <LoadingDots />
            </div>
          </div>
        )}
      </div>
      <div className="mt-4 flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Ask about the code..." className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 transition-all shadow-inner" />
        <button onClick={() => handleSend()} disabled={!input.trim() || isTyping} className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-indigo-500/20 disabled:opacity-50 hover:bg-indigo-700 active:scale-95 transition-all">🚀</button>
      </div>
    </div>
  );
}

function Profile({ user, onLogout, onNavigate }: { user: any; onLogout: () => void; onNavigate: (s: Screen) => void }) {
  if (!user) return null;

  return (
    <div className="p-6 space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-4xl shadow-2xl border-4 border-zinc-900 font-bold overflow-hidden">
          {user.photoURL ? (
            <img src={user.photoURL} alt="User" className="w-full h-full object-cover" />
          ) : (
            user.displayName?.charAt(0) || '👤'
          )}
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold">{user.displayName || (user.isAnonymous ? 'Guest' : 'Developer')}</h1>
          <p className="text-zinc-500 text-sm">{user.email || 'guest@codesensei.ai'}</p>
        </div>
      </div>
      <div className="space-y-3">
        <button onClick={onLogout} className="w-full flex justify-between items-center p-4 bg-zinc-900 rounded-2xl border border-zinc-800 text-sm font-medium text-red-400 hover:bg-red-400/5 transition-all">
           <div className="flex items-center gap-3">
            <span className="text-lg">🚪</span>
            <span>Sign Out</span>
          </div>
        </button>
      </div>
    </div>
  );
}
