import React, { useState, useMemo } from 'react';
import { Agent } from '../types';
import { Mic, Play, Search, Sparkles, Filter } from 'lucide-react';

interface AgentGalleryProps {
  agents: Agent[];
  onSelect: (agent: Agent) => void;
}

export const AgentGallery: React.FC<AgentGalleryProps> = ({ agents, onSelect }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(agents.map(a => a.category));
    return ['All', ...Array.from(cats).sort()];
  }, [agents]);

  // Filter agents
  const filteredAgents = useMemo(() => {
    return agents.filter(agent => {
      const matchesSearch = 
        agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
        agent.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'All' || agent.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [agents, searchQuery, selectedCategory]);

  return (
    <div className="pb-24">
      {/* Search and Filter Section */}
      <div className="sticky top-20 z-40 bg-[#0a0a0c]/95 backdrop-blur-xl border-b border-white/5 py-6 mb-8 px-6 transition-all duration-300">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Search Input */}
          <div className="relative max-w-2xl mx-auto group">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50"></div>
            <div className="relative bg-white/5 border border-white/10 rounded-2xl flex items-center p-4 focus-within:bg-white/10 focus-within:border-purple-500/50 transition-all duration-300 shadow-xl">
              <Search className="w-5 h-5 text-gray-400 mr-3" />
              <input 
                type="text" 
                placeholder="Search by name, role, or industry..." 
                className="bg-transparent border-none outline-none text-white w-full placeholder-gray-500 text-lg"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="text-xs text-gray-500 hover:text-white uppercase font-bold tracking-wider">
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar justify-start md:justify-center">
            <Filter className="w-4 h-4 text-purple-400 mr-2 flex-shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 border ${
                  selectedCategory === cat
                    ? 'bg-purple-600 border-purple-500 text-white shadow-[0_0_15px_rgba(147,51,234,0.4)]'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:border-white/20 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between mb-6 text-gray-400 text-sm">
          <span>Showing {filteredAgents.length} agents</span>
          <span className="flex items-center gap-1"><Sparkles className="w-3 h-3 text-yellow-500" /> AI Powered</span>
        </div>

        {filteredAgents.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl font-serif mb-2">No agents found.</p>
            <p>Try adjusting your search or category filter.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAgents.map((agent) => (
              <div 
                key={agent.id}
                onClick={() => onSelect(agent)}
                className="group relative bg-gray-900/40 hover:bg-gray-800/60 border border-white/5 hover:border-purple-500/30 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-900/20"
              >
                {/* Image Area */}
                <div className="relative h-80 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent z-10"></div>
                  <img 
                    src={agent.imageUrl} 
                    alt={agent.name}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 grayscale-[0.5] group-hover:grayscale-0"
                  />
                  
                  <div className="absolute bottom-4 left-4 right-4 z-20">
                     <div className="flex items-center justify-between mb-1">
                       <h3 className="text-2xl font-serif text-white">{agent.name}</h3>
                       <span className="text-[10px] bg-black/50 backdrop-blur-md px-2 py-1 rounded border border-white/10 text-gray-300 uppercase tracking-wider">
                         {agent.category}
                       </span>
                     </div>
                     <p className="text-sm text-purple-300 font-medium tracking-wide truncate">{agent.role}</p>
                  </div>
                </div>

                {/* Info Area */}
                <div className="p-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {agent.traits.slice(0, 3).map((trait, i) => (
                      <span key={i} className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full bg-white/5 text-gray-400 border border-white/5">
                        {trait}
                      </span>
                    ))}
                  </div>
                  
                  <p className="text-sm text-gray-400 line-clamp-2 mb-4 min-h-[40px]">
                    {agent.description}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                     <div className="flex items-center gap-2 text-xs text-gray-500">
                       <Mic className="w-3 h-3" />
                       Voice: {agent.voiceName}
                     </div>
                     <button className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-purple-500 transition-colors">
                       <Play className="w-4 h-4 text-white fill-current" />
                     </button>
                  </div>
                </div>
                
                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 border-2 border-purple-500/0 group-hover:border-purple-500/50 rounded-2xl transition-all duration-300 pointer-events-none"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};