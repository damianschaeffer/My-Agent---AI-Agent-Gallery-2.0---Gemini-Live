import React, { useState } from 'react';
import { AGENTS } from './constants';
import { Agent, View } from './types';
import { AgentGallery } from './components/AgentGallery';
import { Session } from './components/Session';
import { ArrowLeft, Sparkles } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<View>(View.GALLERY);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const handleSelectAgent = (agent: Agent) => {
    setSelectedAgent(agent);
    setView(View.SESSION);
  };

  const handleBack = () => {
    setView(View.GALLERY);
    setSelectedAgent(null);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white overflow-x-hidden selection:bg-purple-500/30">
      
      {/* Background Ambient Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-purple-900/20 rounded-full blur-[120px]"></div>
        <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-blue-900/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[10%] left-[20%] w-[30%] h-[30%] bg-pink-900/10 rounded-full blur-[100px]"></div>
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0a0a0c]/80 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => view === View.SESSION && handleBack()}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-900/30">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-serif text-xl tracking-tight">Velvet Voices</h1>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Live AI Agents</p>
            </div>
          </div>
          
          {view === View.SESSION && selectedAgent && (
             <button 
               onClick={handleBack}
               className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors text-sm font-medium"
             >
               <ArrowLeft className="w-4 h-4" />
               Back to Gallery
             </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-28 min-h-screen">
        
        {view === View.GALLERY && (
          <div className="max-w-7xl mx-auto animate-in fade-in duration-700">
            <div className="px-6 mb-10 text-center">
               <h2 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-6 bg-gradient-to-b from-white to-gray-500 bg-clip-text text-transparent">
                 Find your perfect conversationalist.
               </h2>
               <p className="text-lg text-gray-400 max-w-2xl mx-auto">
                 Explore 25 unique, intelligent personas powered by Gemini Live. Experience the future of voice interactions with real-time context awareness.
               </p>
            </div>
            <AgentGallery agents={AGENTS} onSelect={handleSelectAgent} />
          </div>
        )}

        {view === View.SESSION && selectedAgent && (
          <Session agent={selectedAgent} onBack={handleBack} />
        )}
      </main>
    </div>
  );
}