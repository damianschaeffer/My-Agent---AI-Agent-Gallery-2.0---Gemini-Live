import React from 'react';
import { ContextField } from '../types';
import { CheckCircle } from 'lucide-react';

interface ContextPanelProps {
  fields: ContextField[];
}

export const ContextPanel: React.FC<ContextPanelProps> = ({ fields }) => {
  return (
    <div className="glass-panel rounded-2xl p-6 w-full max-w-md mx-auto shadow-2xl border-t border-white/10">
      <h3 className="text-xs font-bold uppercase tracking-widest text-purple-300 mb-4 flex items-center gap-2">
        <span className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></span>
        Live Context Memory
      </h3>
      
      <div className="space-y-3">
        {fields.map((field) => (
          <div 
            key={field.key} 
            className={`relative group transition-all duration-500 ${field.value ? 'translate-x-0 opacity-100' : 'opacity-60'}`}
          >
            <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-0 transition-all duration-300 group-hover:h-full bg-gradient-to-b from-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 rounded-full"></div>
            
            <div className={`p-3 rounded-xl border transition-all duration-300 ${
              field.value 
                ? 'bg-white/10 border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.15)]' 
                : 'bg-white/5 border-white/5 border-dashed'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  {field.label}
                </span>
                {field.value && (
                  <CheckCircle className="w-4 h-4 text-emerald-400 animate-in zoom-in duration-300" />
                )}
              </div>
              <div className={`font-serif text-lg leading-tight ${field.value ? 'text-white' : 'text-gray-600 italic'}`}>
                {field.value || "Pending..."}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-4 border-t border-white/5 flex justify-between items-center text-xs text-gray-500">
        <span>Secure Data Capture</span>
        <span className="font-mono">AES-256</span>
      </div>
    </div>
  );
};
