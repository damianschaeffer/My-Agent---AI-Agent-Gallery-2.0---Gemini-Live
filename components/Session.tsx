import React, { useState, useCallback, useEffect } from 'react';
import { Agent, ContextField, Message } from '../types';
import { useLiveApi } from '../hooks/use-live-api';
import { Visualizer } from './Visualizer';
import { ContextPanel } from './ContextPanel';
import { Transcript } from './Transcript';
import { Mic, Power, Loader2 } from 'lucide-react';

interface SessionProps {
  agent: Agent;
  onBack: () => void;
}

export const Session: React.FC<SessionProps> = ({ agent, onBack }) => {
  const [contextFields, setContextFields] = useState<ContextField[]>(
    agent.initialContextKeys.map(key => ({
      key,
      label: key,
      value: null,
      isVerified: false
    }))
  );
  const [messages, setMessages] = useState<Message[]>([]);

  const handleContextUpdate = useCallback((key: string, value: string) => {
    setContextFields(prev => prev.map(f => 
      f.key === key ? { ...f, value, isVerified: true } : f
    ));
  }, []);

  const handleTranscript = useCallback((text: string, role: 'user' | 'model', isFinal: boolean) => {
    setMessages(prev => {
      const lastMsg = prev[prev.length - 1];
      
      // If it's a new turn or the roles don't match, create a new message
      if (!lastMsg || lastMsg.role !== role || (lastMsg.role === role && isFinal && lastMsg.text !== text && text === '')) {
         // If text is empty and it's just a turn completion signal, ignore adding a new bubble
         if (text === '') return prev;
         
         return [...prev, {
           id: Date.now().toString(),
           role,
           text,
           timestamp: new Date()
         }];
      }
      
      // Otherwise append/update the last message
      const updated = [...prev];
      updated[updated.length - 1] = {
        ...lastMsg,
        text: lastMsg.text + text
      };
      return updated;
    });
  }, []);

  const { isConnected, isLoading, error, volume, connect, disconnect } = useLiveApi({
    agent,
    onContextUpdate: handleContextUpdate,
    onTranscript: handleTranscript,
    onDisconnect: useCallback(() => {
       // Handle disconnection
    }, [])
  });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        disconnect();
      }
    };
  }, [isConnected, disconnect]);

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 pb-12 flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
            
      {/* Left Side: Agent Visuals */}
      <div className="w-full lg:w-1/2 flex flex-col items-center pt-10 space-y-8">
        
        <div className="relative group">
           <div className={`absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full blur-3xl opacity-20 transition-opacity duration-1000 ${isConnected ? 'opacity-40 animate-pulse-slow' : 'opacity-20'}`}></div>
           <div className="relative w-64 h-64 md:w-80 md:h-80 rounded-full p-1 bg-gradient-to-b from-white/10 to-transparent">
             <img 
               src={agent.imageUrl} 
               className="w-full h-full object-cover rounded-full border-4 border-[#0a0a0c] shadow-2xl grayscale-[0.2]"
               alt={agent.name}
             />
             {isConnected && (
               <div className="absolute bottom-4 right-8 bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full flex items-center gap-2 animate-in zoom-in">
                 <span className="w-2 h-2 bg-black rounded-full animate-bounce"></span>
                 LIVE
               </div>
             )}
           </div>
        </div>

        <div className="text-center space-y-2 max-w-lg">
          <h2 className="font-serif text-4xl md:text-5xl">{agent.name}</h2>
          <p className="text-xl text-purple-300 font-light">{agent.role}</p>
          <p className="text-gray-400 text-sm leading-relaxed pt-2">{agent.description}</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-6 w-full max-w-sm">
          <Visualizer isActive={isConnected} volume={volume} />
          
          <div className="flex gap-4">
            {!isConnected ? (
              <button 
                onClick={connect}
                disabled={isLoading}
                className={`flex items-center gap-3 px-8 py-4 rounded-full font-bold text-lg transition-all shadow-[0_0_30px_rgba(255,255,255,0.3)] ${
                  isLoading 
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed opacity-80' 
                    : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:scale-105 hover:shadow-[0_0_40px_rgba(168,85,247,0.5)] border border-white/20'
                }`}
              >
                {isLoading ? (
                   <>
                     <Loader2 className="w-5 h-5 animate-spin" />
                     Connecting...
                   </>
                ) : (
                   <>
                     <Mic className="w-5 h-5" />
                     Start Conversation
                   </>
                )}
              </button>
            ) : (
              <button 
                onClick={disconnect}
                className="flex items-center gap-3 px-8 py-4 rounded-full bg-red-500/10 text-red-400 border border-red-500/50 font-bold text-lg hover:bg-red-500/20 transition-colors shadow-lg shadow-red-900/20"
              >
                <Power className="w-5 h-5" />
                End Session
              </button>
            )}
          </div>
          
          {error && (
            <div className="text-red-400 text-sm bg-red-900/20 px-4 py-2 rounded-lg border border-red-900/50 text-center animate-in slide-in-from-top-2">
              {error}
            </div>
          )}
        </div>

      </div>

      {/* Right Side: Context & Transcript */}
      <div className="w-full lg:w-1/2 flex flex-col gap-6 pt-10">
         <ContextPanel fields={contextFields} />
         <Transcript messages={messages} />
      </div>
    </div>
  );
};