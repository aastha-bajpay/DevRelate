/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  MessageSquare, 
  Users, 
  Settings, 
  Github, 
  LayoutDashboard,
  Zap,
  CheckCircle2,
  Clock,
  TrendingUp,
  Search,
  Plus,
  Globe,
  Share2,
  ExternalLink,
  ShieldCheck,
  GitPullRequest
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DashboardData, Question, Platform, ApifyMention } from './types';
import { generateDevRelResponse } from './services/zyndService';
import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [activeTab, setActiveTab] = useState<'overview' | 'feed' | 'contributors' | 'proactive'>('overview');
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(d => {
        setData(d);
        setLoading(false);
      });
  }, []);

  const simulateIncoming = async () => {
    setSimulating(true);
    const platforms: Platform[] = ['discord', 'github', 'stackoverflow', 'reddit'];
    const users = ['dev_pro_99', 'code_junkie', 'bug_finder', 'newbie_coder'];
    const questions = [
      "How do I setup the rate limits in the config file?",
      "Is there a React component for the login modal?",
      "I found a bug in the latest SDK version 2.1.0",
      "Documentation link for OAuth flows is broken."
    ];

    const idx = Math.floor(Math.random() * questions.length);
    const payload = {
      platform: platforms[Math.floor(Math.random() * platforms.length)],
      user: users[Math.floor(Math.random() * users.length)],
      content: questions[idx]
    };

    const res = await fetch('/api/simulate-event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (res.ok) {
      const newEvent = await res.json();
      
      // Auto-respond using Zynd AI
      const aiResponse = await generateDevRelResponse(newEvent.content);
      
      setData(prev => {
        if (!prev) return prev;
        const updatedQuestions = [
           { ...newEvent, status: 'auto-resolved' as const, ai_response: aiResponse },
           ...prev.questions
        ];
        return { 
          ...prev, 
          questions: updatedQuestions,
          stats: {
            ...prev.stats,
            resolvedLast24h: prev.stats.resolvedLast24h + 1
          }
        };
      });
    }
    setSimulating(false);
  };

  const draftPullRequest = async (id: string) => {
    const res = await fetch('/api/draft-pr', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });

    if (res.ok) {
      setData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          questions: prev.questions.map(q => q.id === id ? { ...q, pr_drafted: true } : q)
        };
      });
    }
  };

  if (loading || !data) return <div className="h-screen w-screen flex items-center justify-center font-mono text-zinc-500 bg-[#E4E3E0]">INITIALIZING_DEVRELATE_NODE...</div>;

  return (
    <div className="flex h-screen bg-[#E4E3E0] text-[#141414] font-sans selection:bg-[#141414] selection:text-[#E4E3E0]">
      {/* Sidebar */}
      <aside className="w-72 border-r border-[#141414] flex flex-col">
        <div className="p-6 border-b border-[#141414] flex items-center gap-3">
          <div className="w-8 h-8 bg-[#141414] flex items-center justify-center">
            <Zap className="w-5 h-5 text-[#E4E3E0]" />
          </div>
          <h1 className="font-serif italic text-xl tracking-tight">DevRelate</h1>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <SidebarItem 
            icon={<LayoutDashboard size={18} />} 
            label="Overview" 
            active={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
          />
          <SidebarItem 
            icon={<MessageSquare size={18} />} 
            label="Community Feed" 
            active={activeTab === 'feed'} 
            onClick={() => setActiveTab('feed')} 
          />
          <SidebarItem 
            icon={<Globe size={18} />} 
            label="Proactive Mentions" 
            active={activeTab === 'proactive'} 
            onClick={() => setActiveTab('proactive')} 
          />
          <SidebarItem 
            icon={<Users size={18} />} 
            label="Contributors" 
            active={activeTab === 'contributors'} 
            onClick={() => setActiveTab('contributors')} 
          />
          <SidebarItem 
            icon={<Settings size={18} />} 
            label="Settings" 
            onClick={() => {}} 
          />
        </nav>

        {/* Superplane Infrastructure Status */}
        <div className="p-4 mx-4 mb-4 border border-[#141414] bg-[#DCDAD7] space-y-3">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest opacity-60">
            <span>Infrastructure</span>
            <div className="flex items-center gap-1 text-green-700">
              <div className="w-1 h-1 rounded-full bg-green-700 animate-pulse" />
              {data.infrastructure.provider}
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[9px] font-mono">
              <span>Discord Gateway</span>
              <span className={data.infrastructure.webhooks.discord ? "text-green-700" : "text-red-700"}>ACTIVE</span>
            </div>
            <div className="flex items-center justify-between text-[9px] font-mono">
              <span>GitHub Webhooks</span>
              <span className={data.infrastructure.webhooks.github ? "text-green-700" : "text-red-700"}>ACTIVE</span>
            </div>
          </div>
          <div className="pt-2 border-t border-[#141414]/20">
            <div className="flex items-center gap-2 text-[9px] font-mono uppercase text-[#141414]">
              <ShieldCheck size={10} className="text-blue-600" />
              Zynd AI Core: Healthy
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-[#141414]">
           <button 
            disabled={simulating}
            onClick={simulateIncoming}
            className="w-full flex items-center justify-center gap-2 border border-[#141414] py-3 font-mono text-xs uppercase tracking-widest hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors disabled:opacity-50"
           >
            <Plus size={14} />
            {simulating ? 'Zynd AI reasoning...' : 'Simulate Event'}
           </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto flex flex-col">
        {/* Header */}
        <header className="h-20 border-b border-[#141414] px-8 flex items-center justify-between sticky top-0 bg-[#E4E3E0]/80 backdrop-blur-sm z-10 font-mono">
          <h2 className="font-serif italic text-2xl lowercase">{activeTab}</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={16} />
              <input 
                type="text" 
                placeholder="search telemetry..." 
                className="bg-transparent border border-[#141414] pl-10 pr-4 py-2 font-mono text-xs focus:ring-0 focus:outline-none w-64"
              />
            </div>
            <div className="flex items-center gap-3 border border-[#141414] px-3 py-2">
              <span className="text-[10px] uppercase tracking-tighter opacity-50">Copilot Build:</span>
              <span className="text-xs font-bold">STABLE-v2.1</span>
            </div>
          </div>
        </header>

        <div className="p-8 space-y-12">
          <ErrorBoundary>
            {activeTab === 'overview' && (
            <AnimatePresence mode="wait">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-12"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-4 gap-px bg-[#141414] border border-[#141414]">
                  <StatCard label="Live Concerns" value={data.stats.openQuestions} icon={<Clock className="text-orange-600" size={16} />} />
                  <StatCard label="Auto-Resolved (24h)" value={data.stats.resolvedLast24h} icon={<CheckCircle2 className="text-green-700" size={16} />} />
                  <StatCard label="Zynd Response Lag" value={data.stats.avgResponseTime} icon={<Zap size={16} />} />
                  <StatCard label="Global Sentiment" value={data.stats.sentiment} icon={<TrendingUp className="text-blue-600" size={16} />} />
                </div>

                {/* Main Dashboard Section */}
                <div className="grid grid-cols-3 gap-12">
                  <div className="col-span-2 space-y-6">
                    <h3 className="font-serif italic text-xl">Omnichannel Pulse</h3>
                    <div className="border border-[#141414] divide-y divide-[#141414]">
                      {data.questions.slice(0, 5).map(q => (
                        <QuestionRow key={q.id} question={q} />
                      ))}
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif italic text-xl">Top Nurtured Users</h3>
                      <button className="text-[10px] uppercase font-mono border-b border-[#141414]">View All</button>
                    </div>
                    <div className="border border-[#141414] divide-y divide-[#141414]">
                      {data.contributors.map(c => (
                        <div key={c.name} className="p-4 flex items-center justify-between hover:bg-[#141414] hover:text-[#E4E3E0] group transition-colors cursor-default">
                          <span className="font-mono text-sm lowercase">{c.name}</span>
                          <span className="font-mono text-xs opacity-50 group-hover:opacity-100">{c.points} pts</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          )}

          {activeTab === 'feed' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
               <div className="border border-[#141414] divide-y divide-[#141414]">
                {data.questions.map(q => (
                  <div key={q.id} className="p-8 space-y-4 hover:bg-zinc-100 transition-colors border-b border-[#141414]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <PlatformIcon platform={q.platform} />
                        <span className="font-mono text-xs font-bold uppercase tracking-widest">{q.user}</span>
                        <span className="font-mono text-[10px] opacity-40">{new Date(q.timestamp).toLocaleString()}</span>
                      </div>
                      <StatusBadge status={q.status} />
                    </div>
                    <p className="text-xl leading-relaxed max-w-3xl font-medium tracking-tight">{q.content}</p>
                    {q.ai_response && (
                      <motion.div 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="mt-6 p-6 bg-[#141414] text-[#E4E3E0] font-mono text-xs leading-loose border-l-8 border-orange-500 shadow-2xl"
                      >
                        <div className="flex items-center justify-between mb-4">
                           <div className="flex items-center gap-2 text-orange-400 font-bold uppercase tracking-[0.2em] text-[10px]">
                            <Zap size={10} />
                            Zynd AI Agent Reasoning Output
                          </div>
                          <span className="text-[10px] opacity-40">SUPERPLANE_NODE_US_EAST</span>
                        </div>
                        <div className="max-w-2xl whitespace-pre-wrap opacity-90">
                          {q.ai_response}
                        </div>
                        {q.platform === 'github' && q.status === 'auto-resolved' && (
                          <div className="mt-6 pt-6 border-t border-[#E4E3E0]/10">
                            {q.pr_drafted ? (
                              <div className="flex items-center gap-2 text-green-400 font-mono text-[10px] uppercase tracking-widest bg-green-400/10 w-fit px-3 py-1">
                                <GitPullRequest size={12} />
                                Pull Request Drafted
                              </div>
                            ) : (
                              <button 
                                onClick={() => draftPullRequest(q.id)}
                                className="flex items-center gap-2 bg-[#E4E3E0] text-[#141414] px-4 py-2 font-mono text-[10px] uppercase tracking-widest hover:bg-orange-500 hover:text-[#E4E3E0] transition-colors"
                              >
                                <GitPullRequest size={12} />
                                Draft Pull Request
                              </button>
                            )}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'proactive' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 border border-[#141414] p-6 bg-blue-50/30">
                <div className="w-12 h-12 bg-[#141414] flex items-center justify-center text-blue-400">
                  <Share2 size={24} />
                </div>
                <div>
                  <h3 className="font-serif italic text-lg tracking-tight">Apify Proactive Scraping Enabled</h3>
                  <p className="font-mono text-xs opacity-60">Scraping Reddit and StackOverflow every 15 minutes for project mentions.</p>
                </div>
              </div>

               <div className="grid grid-cols-1 gap-6">
                {data.scrapedMentions.map(m => (
                  <div key={m.id} className="border border-[#141414] p-6 hover:bg-[#141414] hover:text-[#E4E3E0] transition-all group">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
                        {m.source === 'reddit' ? <MessageSquare size={14} className="text-orange-500" /> : <Globe size={14} className="text-blue-500" />}
                        {m.source} Mention
                      </div>
                      <div className="flex items-center gap-4">
                         <span className={`px-2 py-0.5 font-mono text-[9px] uppercase border ${
                            m.sentiment === 'positive' ? 'border-green-600 text-green-600' : 'border-zinc-500 text-zinc-500'
                         }`}>
                           {m.sentiment}
                         </span>
                         <a href={m.url} target="_blank" className="opacity-40 group-hover:opacity-100"><ExternalLink size={14} /></a>
                      </div>
                    </div>
                    <p className="text-lg font-serif italic italic text-[#141414] group-hover:text-[#E4E3E0] transition-colors">"{m.content}"</p>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          {activeTab === 'contributors' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 divide-y divide-[#141414] border border-[#141414]">
                {data.contributors.map((c, index) => (
                  <div key={c.name} className="p-8 flex items-center justify-between hover:bg-[#141414] hover:text-[#E4E3E0] transition-colors group">
                    <div className="flex items-center gap-6">
                      <span className="font-mono text-4xl opacity-10 group-hover:opacity-30">0{index + 1}</span>
                      <div className="space-y-1">
                        <h3 className="font-serif italic text-2xl lowercase">{c.name}</h3>
                        <p className="font-mono text-[10px] uppercase tracking-widest opacity-50">{c.interactions} meaningful interactions</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className="font-mono text-xl font-bold tracking-tighter">{c.points.toLocaleString()}</span>
                       <span className="font-mono text-[9px] uppercase tracking-widest opacity-40">loyalty points</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
          </ErrorBoundary>
        </div>
      </main>
    </div>
  );
}

function SidebarItem({ icon, label, active = false, onClick }: { icon: any, label: string, active?: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-mono transition-all duration-200 ${
        active 
          ? 'bg-[#141414] text-[#E4E3E0]' 
          : 'hover:bg-zinc-200 text-zinc-600 border border-transparent'
      }`}
    >
      {icon}
      <span className="lowercase">{label}</span>
      {active && <motion.div layoutId="nav-pill" className="ml-auto w-1 h-4 bg-orange-500" />}
    </button>
  );
}

function StatCard({ label, value, icon }: { label: string, value: string | number, icon: any }) {
  return (
    <div className="bg-[#E4E3E0] p-6 space-y-4 flex flex-col justify-between h-36">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest opacity-60">{label}</span>
        {icon}
      </div>
      <span className="font-mono text-4xl tracking-tighter font-bold">{value}</span>
    </div>
  );
}

const QuestionRow: React.FC<{ question: Question }> = ({ question }) => {
  return (
    <div className="p-4 flex items-center justify-between hover:bg-[#141414] hover:text-[#E4E3E0] group transition-colors cursor-pointer border-b border-[#141414] last:border-0 h-16">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <PlatformIcon platform={question.platform} />
        <div className="flex flex-col min-w-0">
          <span className="font-mono text-[10px] uppercase opacity-50 group-hover:opacity-80 ">{question.user}</span>
          <p className="text-sm truncate pr-8 font-medium">{question.content}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-mono text-[9px] opacity-40 group-hover:opacity-60">{new Date(question.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
        <StatusBadge status={question.status} condensed />
      </div>
    </div>
  );
}

function PlatformIcon({ platform }: { platform: Platform }) {
  switch (platform) {
    case 'discord': return <div className="w-5 h-5 flex items-center justify-center text-indigo-500"><MessageSquare size={16} /></div>;
    case 'github': return <div className="w-5 h-5 flex items-center justify-center text-zinc-800 group-hover:text-[#E4E3E0]"><Github size={16} /></div>;
    case 'reddit': return <div className="w-5 h-5 flex items-center justify-center text-orange-500"><Share2 size={16} /></div>;
    default: return <div className="w-5 h-5 flex items-center justify-center text-zinc-500"><Zap size={16} /></div>;
  }
}

function StatusBadge({ status, condensed = false }: { status: Question['status'], condensed?: boolean }) {
  const baseClasses = "font-mono text-[9px] uppercase tracking-widest px-2 py-1 border";
  switch (status) {
    case 'pending': 
      return <span className={`${baseClasses} border-[#141414] text-[#141414] group-hover:border-[#E4E3E0] group-hover:text-[#E4E3E0]`}>{condensed ? '•••' : 'pending'}</span>;
    case 'auto-resolved': 
      return <span className={`${baseClasses} border-green-700 bg-green-50 text-green-700`}>{condensed ? '✓' : 'resolved'}</span>;
    case 'human-review': 
      return <span className={`${baseClasses} border-orange-600 bg-orange-50 text-orange-600`}>{condensed ? '!' : 'Review'}</span>;
    default: return null;
  }
}
