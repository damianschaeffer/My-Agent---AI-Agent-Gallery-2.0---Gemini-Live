import React, { useEffect, useRef } from 'react';
import { Message } from '../types';
import { User, Bot } from 'lucide-react';

interface TranscriptProps {
  messages: Message[];
}

export const Transcript: React.FC<TranscriptProps> = ({ messages }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) return null;

  return (
    <div className="glass-panel rounded-2xl p-6 w-full h-[300px] flex flex-col shadow-2xl border-t border-white/10 mt-6">
      <h3 className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
        Live Transcript
      </h3>
      
      <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
              msg.role === 'user' ? 'bg-white/10' : 'bg-purple-500/20'
            }`}>
              {msg.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>
            
            <div className={`p-3 rounded-2xl text-sm leading-relaxed max-w-[80%] ${
              msg.role === 'user' 
                ? 'bg-white/10 text-gray-200 rounded-tr-none' 
                : 'bg-purple-500/10 text-purple-100 rounded-tl-none border border-purple-500/10'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};