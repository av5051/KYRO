/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Building2, 
  Rocket, 
  Factory, 
  FileText, 
  CheckSquare, 
  Compass, 
  Zap, 
  User, 
  LogOut, 
  Send,
  Download,
  MapPin,
  ChevronRight,
  AlertCircle,
  FileSearch,
  PenTool,
  Globe,
  Loader2,
  FileDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GoogleGenAI } from "@google/genai";
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import Markdown from 'react-markdown';

// --- Types ---
type EntityType = 'NGO' | 'Startup' | 'MSME' | null;
type TabType = 'Opportunities' | 'Parse' | 'Checklist' | 'Filling';

interface KyroProfile {
  state: string;
  sector: string;
  turnover: string | null;
  business_age: number | null;
  ownership: string | null;
}

interface ChecklistItem {
  id: string;
  task: string;
  status: 'pending' | 'completed';
  category: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
}

// --- Constants ---
const INITIAL_PROFILE: KyroProfile = {
  state: "National",
  sector: "General",
  turnover: null,
  business_age: null,
  ownership: null
};

const INITIAL_CHECKLIST: ChecklistItem[] = [
  { 
    id: "base_1", 
    task: "Register on Udyam Portal", 
    status: "pending", 
    category: "Legal" 
  },
  { 
    id: "base_2", 
    task: "Open Business Bank Account", 
    status: "pending", 
    category: "Financial" 
  }
];

// --- AI Initialization ---
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
const modelName = "gemini-3-flash-preview";

// --- Components ---

export default function App() {
  const [selectedEntity, setSelectedEntity] = useState<EntityType>(null);
  const [activeTab, setActiveTab] = useState<TabType>('Opportunities');
  const [profile, setProfile] = useState<KyroProfile>(INITIAL_PROFILE);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(INITIAL_CHECKLIST);

  // Persistence: Load from localStorage
  useEffect(() => {
    const savedProfile = localStorage.getItem('kyro_profile');
    if (savedProfile) {
      try {
        setProfile(JSON.parse(savedProfile));
      } catch (e) {
        console.error("Failed to parse saved profile", e);
      }
    }

    const savedChecklist = localStorage.getItem('kyro_checklist');
    if (savedChecklist) {
      try {
        setChecklist(JSON.parse(savedChecklist));
      } catch (e) {
        console.error("Failed to parse saved checklist", e);
      }
    }
  }, []);

  // Save to localStorage when state changes
  useEffect(() => {
    localStorage.setItem('kyro_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('kyro_checklist', JSON.stringify(checklist));
  }, [checklist]);

  const handleLogout = () => {
    setSelectedEntity(null);
    setActiveTab('Opportunities');
    setProfile(INITIAL_PROFILE);
    setChecklist(INITIAL_CHECKLIST);
    localStorage.removeItem('kyro_profile');
    localStorage.removeItem('kyro_checklist');
  };

  return (
    <div className="min-h-screen font-sans selection:bg-emerald-500/30 selection:text-white bg-[#020204] text-slate-200 overflow-hidden relative">
        {/* Antigravity Background Elements */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-emerald-500/[0.03] rounded-full blur-[100px] animate-float-slow" />
          <div className="absolute bottom-[10%] right-[5%] w-96 h-96 bg-emerald-500/[0.03] rounded-full blur-[120px] animate-float-delayed" />
          <div className="absolute top-[40%] right-[15%] w-48 h-48 bg-emerald-400/[0.03] rounded-full blur-[80px] animate-float" />
        
        {/* Floating Particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * 100 + "%", 
              y: Math.random() * 100 + "%",
              opacity: Math.random() * 0.3
            }}
            animate={{ 
              y: [null, (Math.random() - 0.5) * 50 + "px"],
              opacity: [null, Math.random() * 0.5, Math.random() * 0.3]
            }}
            transition={{
              duration: 5 + Math.random() * 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
          />
        ))}
      </div>

      <div className="fixed inset-0 dot-pattern opacity-10 pointer-events-none" />
      
      <AnimatePresence mode="wait">
        {!selectedEntity ? (
          <LandingPage key="landing" onSelect={(entity) => {
            setSelectedEntity(entity);
            setActiveTab('Opportunities');
          }} />
        ) : (
          <Dashboard 
            key="dashboard"
            entity={selectedEntity}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            profile={profile}
            setProfile={setProfile}
            checklist={checklist}
            setChecklist={setChecklist}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Screen 1: Landing Page ---
interface LandingPageProps {
  onSelect: (e: EntityType) => void;
  key?: string;
}

function LandingPage({ onSelect }: LandingPageProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -20 }}
      className="relative z-10 flex flex-col items-center justify-center h-screen px-4 font-sans overflow-hidden"
    >
      <motion.div 
        initial={{ y: 30, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-6 mb-16 relative"
      >
        <div className="absolute -top-20 -left-20 w-40 h-40 bg-emerald-500/10 blur-[80px] rounded-full" />
        <div className="flex items-center gap-6">
          <h1 className="text-8xl font-black tracking-[0.15em] text-white drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] pl-[0.15em]">KYRO</h1>
          <motion.div 
            animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.1, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center glow-emerald border border-emerald-500/30"
          >
            <Sparkles className="w-8 h-8 text-emerald-400" />
          </motion.div>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-emerald-400/80 text-[9px] font-black tracking-[0.2em] uppercase">Sovereign Protocol v1.2</p>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl w-full px-8">
        <IdentityCard 
          icon={<Building2 className="w-8 h-8" />} 
          title="NGO / Trust" 
          description="Searching for impactful grants and non-profit support."
          onClick={() => onSelect('NGO')}
          delay={0.4}
          color="emerald"
        />
        <IdentityCard 
          icon={<Rocket className="w-8 h-8" />} 
          title="Startup / DPIIT" 
          description="Early stage growth and seed funding for innovators."
          onClick={() => onSelect('Startup')}
          delay={0.5}
          color="emerald"
        />
        <IdentityCard 
          icon={<Factory className="w-8 h-8" />} 
          title="MSME / Corp" 
          description="Industrial scaling and operational efficiency grants."
          onClick={() => onSelect('MSME')}
          delay={0.6}
          color="emerald"
        />
      </div>
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="mt-16 flex flex-col items-center gap-4 text-[10px] text-white/20 font-bold uppercase tracking-[0.3em]"
      >
        <div className="flex items-center gap-3">
          <span>Don't Panic</span>
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/30 animate-pulse" />
          <span>v1.2.0-Alpha</span>
        </div>
        <div className="text-[8px] opacity-40">System Status: Nominal</div>
      </motion.div>
    </motion.div>
  );
}

interface IdentityCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  delay: number;
  color?: 'emerald';
}

function IdentityCard({ icon, title, description, onClick, delay, color = 'emerald' }: IdentityCardProps) {
  const colorMap = {
    emerald: 'text-emerald-400 bg-emerald-400/5 group-hover:bg-emerald-400/10 border-emerald-500/0 hover:border-emerald-500/20',
  };

  return (
    <motion.button
      initial={{ y: 20, opacity: 0, scale: 0.95 }}
      animate={{ y: 0, opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -12, transition: { duration: 0.4 } }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="glass-bulge p-10 rounded-[3rem] flex flex-col items-center text-center group cursor-pointer transition-all duration-500 border border-white/5 hover:border-emerald-500/40 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />
      <div className={`mb-8 p-6 rounded-[1.5rem] transition-all duration-700 ${colorMap[color].split(' ').slice(0, 3).join(' ')} group-hover:scale-110 group-hover:rotate-6 shadow-2xl`}>
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 tracking-tight text-white/90 group-hover:text-white transition-colors">{title}</h3>
      <p className="text-white/40 text-[10px] leading-relaxed max-w-[200px] font-medium uppercase tracking-wider">{description}</p>
      
      <div className="mt-6 flex items-center gap-2 text-emerald-400/40 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all">
        <span className="text-[9px] font-bold uppercase tracking-widest">Register Entity</span>
        <ChevronRight size={12} />
      </div>
    </motion.button>
  );
}

// --- Screen 2: Dashboard ---
interface DashboardProps {
  entity: EntityType;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  profile: KyroProfile;
  setProfile: React.Dispatch<React.SetStateAction<KyroProfile>>;
  checklist: ChecklistItem[];
  setChecklist: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
  onLogout: () => void;
  key?: string;
}

function Dashboard({ entity, activeTab, setActiveTab, profile, setProfile, checklist, setChecklist, onLogout }: DashboardProps) {
  return (
    <div className="flex flex-col h-screen relative z-10 transition-all duration-300">
      {/* Top Bar */}
      <header className="h-28 border-b border-white/5 glass px-12 flex items-center justify-between shrink-0 bg-black/10">
        <div className="flex items-center gap-6">
          <motion.div 
            whileHover={{ rotate: 180, scale: 1.1 }}
            className="w-12 h-12 rounded-[1.25rem] bg-emerald-500/20 flex items-center justify-center glow-emerald border border-emerald-500/30"
          >
            <Sparkles size={24} className="text-emerald-400" />
          </motion.div>
          <div className="flex flex-col">
            <span className="font-black text-2xl tracking-tighter text-white">KYRO</span>
            <span className="text-[9px] text-emerald-400 font-black uppercase tracking-[0.3em]">Neural Protocol</span>
          </div>
        </div>

        <nav className="flex items-center gap-3 p-2.5 rounded-full border border-white/10 glass-bulge shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
          <NavPill active={activeTab === 'Opportunities'} onClick={() => setActiveTab('Opportunities')} icon={<Compass size={16} />} label="Opportunities" />
          <NavPill active={activeTab === 'Checklist'} onClick={() => setActiveTab('Checklist')} icon={<CheckSquare size={16} />} label="Roadmap" />
          <NavPill active={activeTab === 'Parse'} onClick={() => setActiveTab('Parse')} icon={<FileSearch size={16} />} label="Grammar" />
          <NavPill active={activeTab === 'Filling'} onClick={() => setActiveTab('Filling')} icon={<PenTool size={16} />} label="Filing" />
        </nav>

        <div className="flex items-center gap-6">
          <div className="flex flex-col items-end hidden sm:flex">
             <span className="text-[9px] text-white/30 font-black uppercase tracking-widest">Access Tier</span>
             <span className="text-xs font-bold text-emerald-400">{entity} Sovereign</span>
          </div>
          <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 hover:border-emerald-500/30 transition-all group overflow-hidden">
            <User size={18} className="text-white/40 group-hover:text-emerald-400 transition-colors" />
          </div>
          <button 
            onClick={onLogout} 
            className="p-3 rounded-2xl border border-white/5 hover:bg-red-500/10 hover:border-red-500/20 text-red-400/40 hover:text-red-400 transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'Opportunities' && <OpportunitiesTab key="opp" entity={entity} profile={profile} setProfile={setProfile} checklist={checklist} setChecklist={setChecklist} />}
          {activeTab === 'Checklist' && <ChecklistTab key="check" profile={profile} checklist={checklist} setChecklist={setChecklist} />}
          {activeTab === 'Parse' && <ParseTab key="parse" />}
          {activeTab === 'Filling' && <FillingTab key="filling" />}
        </AnimatePresence>
      </main>
    </div>
  );
}

interface NavPillProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}

function NavPill({ active, onClick, icon, label }: NavPillProps) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-semibold transition-all duration-500
        ${active ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'text-white/30 border border-transparent hover:text-white/60 hover:bg-white/5'}
      `}
    >
      {React.cloneElement(icon as React.ReactElement, { size: 14 } as any)}
      <span>{label}</span>
    </button>
  );
}

interface OpportunitiesTabProps {
  entity: EntityType;
  profile: KyroProfile;
  setProfile: React.Dispatch<React.SetStateAction<KyroProfile>>;
  checklist: ChecklistItem[];
  setChecklist: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
  key?: string;
}

function OpportunitiesTab({ entity, profile, setProfile, checklist, setChecklist }: OpportunitiesTabProps) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Don't Panic. ${entity} identity confirmed. I've scanned the local quadrant for funding opportunities. To refine our hyperspace route, what are your current resource coordinates (traction, team, patents)?`
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      // RAG Phase: Fetch Context from PostgreSQL
      let dbContext = "";
      try {
        const dbRes = await fetch("/api/search-opportunities", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            query: input,
            entityType: entity,
            state: profile.state,
            sector: profile.sector
          })
        });
        if (dbRes.ok) {
          const dbData = await dbRes.json();
          dbContext = dbData.context || "";
        }
      } catch (err) {
        console.error("Failed to fetch RAG context:", err);
      }

      // Build a concise prompt based on user reference
      const prompt = `
        You are Kyro, a professional MSME funding consultant. 
        
        STRICT BREVITY RULES:
        1. Direct answers only. No conversational greetings (e.g., skip "Hello" or "I hope this helps").
        2. Maximum 3-4 sentences total.
        3. Use bullet points for eligibility or steps.
        4. Ask for exactly ONE missing detail if profile is incomplete.
        5. Use Markdown formatting for clarity.
        6. Append hidden tags for system updates: [[UPDATE: {"field": "value"}]] or [[ADD_TASK: {"task": "...", "category": "..."}]].

        --- USER PROFILE ---
        ${JSON.stringify(profile)}

        --- DATABASE CONTEXT ---
        ${dbContext || "Search for relevant Indian schemes based on entity type."}

        USER QUESTION: ${input}
      `;

      const responseContent = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature: 0.2, // Low temperature for accuracy and brevity
        }
      });

      let text = responseContent.text || "I apologize, I'm having trouble processing that request.";
      
      // Metadata Handshake Logic (Phase 4 of Spec)
      const updateRegex = /\[\[UPDATE: (.*?)\]\]/g;
      const addTaskRegex = /\[\[ADD_TASK: (.*?)\]\]/g;
      let match;
      const updates: any = {};
      const newTasks: ChecklistItem[] = [];
      
      while ((match = updateRegex.exec(text)) !== null) {
        try {
          const updateData = JSON.parse(match[1]);
          Object.assign(updates, updateData);
        } catch (e) {
          console.error("Metadata update parsing failed", e);
        }
      }

      while ((match = addTaskRegex.exec(text)) !== null) {
        try {
          const taskData = JSON.parse(match[1]);
          newTasks.push({
            id: Date.now().toString() + Math.random(),
            task: taskData.task,
            category: taskData.category || 'General',
            status: 'pending'
          });
        } catch (e) {
          console.error("Add task parsing failed", e);
        }
      }

      if (Object.keys(updates).length > 0) {
        setProfile((prev: any) => ({ ...prev, ...updates }));
      }

      if (newTasks.length > 0) {
        setChecklist((prev: any) => [...prev, ...newTasks]);
        // Add a subtle system message about the task
        setMessages(prev => [...prev, {
          id: `sys_${Date.now()}`,
          role: 'assistant',
          content: `📜 Map updated: ${newTasks.length} new actionable milestone(s) added to your checklist.`
        }]);
      }

      // Clean all tags from the UI-visible message
      text = text.replace(updateRegex, '').replace(addTaskRegex, '').trim();

      if (text) {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: text,
          sources: ["https://msme.gov.in", "https://startupindia.gov.in"]
        }]);
      }
    } catch (e) {
      console.error("AI Inquiry failed", e);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm temporarily experiencing connectivity issues with the RAG engine. Please try again in a moment."
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="h-full flex relative gap-8 p-10 overflow-hidden">
      {/* Left Chat Area - Bulged Out Container */}
      <div className="flex-1 flex flex-col h-full items-center">
        <motion.div 
          initial={{ y: 30, opacity: 0, scale: 0.98 }}
          animate={{ 
            y: [0, -5, 0],
            opacity: 1, 
            scale: 1 
          }}
          transition={{ 
            y: {
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            },
            opacity: { duration: 0.8 },
            scale: { duration: 0.8 }
          }}
          className="w-full max-w-5xl h-full flex flex-col glass-bulge rounded-[3.5rem] shadow-[0_60px_120px_-30px_rgba(0,0,0,0.8)] border-white/10 relative overflow-hidden"
        >
          {/* Internal Header for Chatbot */}
          <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 flex items-center justify-center glow-emerald">
                <Sparkles size={16} className="text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-white/90">Kyro Sovereign Interface</h3>
                <p className="text-[10px] text-emerald-400/50 uppercase tracking-widest font-bold">L3 Neural Guide • Active</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">Quantum Link Secured</span>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 w-full overflow-y-auto px-8 py-10 space-y-8 scroll-smooth scrollbar-hide">
            {messages.map((m, idx) => (
              <motion.div
                initial={{ y: 15, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{ delay: idx === messages.length - 1 ? 0 : 0.1, duration: 0.5 }}
                key={m.id}
                className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div 
                  className={`
                    max-w-[85%] text-sm leading-relaxed relative p-6 rounded-[2rem]
                    ${m.role === 'user' 
                      ? 'text-white font-medium bg-gradient-to-br from-emerald-500/20 to-emerald-800/10 rounded-tr-none border border-emerald-500/30 shadow-lg' 
                      : 'text-white/90 bg-white/[0.03] rounded-tl-none border border-white/10 shadow-2xl backdrop-blur-md'}
                  `}
                >
                  {m.role === 'assistant' && idx === 0 && (
                     <div className="mb-3 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                       Initialization Successful
                     </div>
                  )}
                  <div className="markdown-container prose prose-invert prose-sm max-w-none">
                    <Markdown>{m.content}</Markdown>
                  </div>
                </div>
                {m.sources && m.role === 'assistant' && (
                  <div className="mt-4 flex flex-wrap gap-2 px-2">
                    {m.sources.map((s, idx) => (
                      <a 
                        key={idx} 
                        href={s} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[9px] glass px-3 py-1.5 rounded-xl bg-white/[0.02] text-white/40 hover:text-emerald-400 hover:border-emerald-500/30 transition-all flex items-center gap-1.5 font-bold uppercase tracking-wider"
                      >
                        <Globe size={10} />
                        {new URL(s).hostname}
                      </a>
                    ))}
                  </div>
                )}
              </motion.div>
            ))}
            {isTyping && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-start"
              >
                 <div className="text-[10px] font-bold text-emerald-400/40 uppercase tracking-widest flex items-center gap-3 bg-emerald-500/5 px-4 py-2 rounded-full border border-emerald-500/10">
                   <div className="flex gap-1">
                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1 h-1 bg-emerald-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1 h-1 bg-emerald-400 rounded-full" />
                      <motion.div animate={{ opacity: [0.2, 1, 0.2] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1 h-1 bg-emerald-400 rounded-full" />
                   </div>
                   Synthesizing grant documents
                 </div>
              </motion.div>
            )}
          </div>
  
          {/* Floating Input Bar within Bulged Container */}
          <div className="w-full px-8 pb-8 pt-4 bg-gradient-to-t from-black/20 to-transparent">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-emerald-400/10 rounded-3xl blur-xl opacity-0 group-focus-within:opacity-100 transition duration-1000"></div>
              <div className="glass rounded-[1.5rem] border border-white/10 p-2 flex items-center gap-2 transition-all duration-500 shadow-2xl relative bg-white/[0.02] focus-within:bg-white/[0.04] focus-within:border-emerald-500/30">
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask the Guide about your next grant..."
                  className="flex-1 bg-transparent border-none focus:ring-0 text-sm px-4 py-3 placeholder:text-white/20 text-white outline-none"
                />
                <button 
                  onClick={handleSend}
                  className="p-3.5 rounded-2xl bg-emerald-600 text-white hover:bg-emerald-500 transition-all duration-300 disabled:opacity-20 glow-emerald flex items-center justify-center"
                  disabled={!input.trim()}
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Profile Sidebar - Integrated look */}
      <motion.div 
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="w-80 glass rounded-[3rem] border border-white/5 hidden lg:flex flex-col p-10 overflow-y-auto shadow-2xl"
      >
        <h3 className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-400 mb-10 flex items-center gap-3">
          <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Zap size={10} className="text-emerald-400" />
          </div>
          Registry Context
        </h3>
        <div className="space-y-10">
          <ProfileField label="Identity Class" value={entity || ''} />
          <ProfileField label="Sovereign State" value={profile.state} />
          <ProfileField label="Economic Sector" value={profile.sector} />
          <ProfileField label="Fiscal Turnover" value={profile.turnover || 'Incomplete'} />
          <ProfileField label="Entity Age" value={profile.business_age ? `${profile.business_age} Years` : 'Incomplete'} />
        </div>
        <div className="mt-auto pt-10">
          <div className="p-6 rounded-[2rem] bg-emerald-500/[0.03] border border-emerald-500/10 backdrop-blur-sm">
            <p className="text-[10px] text-emerald-400/40 leading-relaxed font-bold italic uppercase tracking-wider">
              "Ingenuity is the key to unlocking the sovereign vault."
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[10px] text-white/20 font-medium uppercase tracking-wider">{label}</span>
      <span className={`text-xs font-semibold tracking-tight ${value === 'Incomplete' ? 'text-white/10 italic' : 'text-white/60'}`}>
        {value}
      </span>
    </div>
  );
}

// --- Tab B: Checklist (The Offline Roadmap) ---
interface ChecklistTabProps {
  profile: KyroProfile;
  checklist: ChecklistItem[];
  setChecklist: React.Dispatch<React.SetStateAction<ChecklistItem[]>>;
  key?: string;
}

function ChecklistTab({ profile, checklist, setChecklist }: ChecklistTabProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const toggleTask = (id: string) => {
    setChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, status: item.status === 'pending' ? 'completed' : 'pending' } : item
    ));
  };

  const generateRoadmap = async () => {
    setIsGenerating(true);
    setStatusMessage(null);
    
    try {
      // Simulation of /checklist endpoint
      const prompt = `Generate a structured roadmap for a ${profile.sector} entity in ${profile.state} with a turnover of ${profile.turnover || 'unknown'}. 
      Return response in JSON format: { "status": "ready" | "locked", "message": "string", "tasks": [{ "task": "string", "category": "string" }] }`;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt
      });

      const text = response.text || "";
      // Extract JSON if AI wrapped it in markdown
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        if (data.status === 'locked') {
          setStatusMessage({ type: 'error', text: data.message });
        } else {
          const newTasks = data.tasks.map((t: any, i: number) => ({
            id: `gen_${Date.now()}_${i}`,
            task: t.task,
            category: t.category,
            status: 'pending'
          }));
          setChecklist(prev => [...prev, ...newTasks]);
          setStatusMessage({ type: 'success', text: "Hyperspace roadmap generated and appended to your checklist." });
        }
      } else {
        throw new Error("Invalid roadmap format");
      }
    } catch (e) {
      console.error("Roadmap generation failed", e);
      setStatusMessage({ type: 'error', text: "Failed to connect to the Roadmap Engine. Please complete more profile fields." });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto px-6 py-10 flex flex-col items-center">
      <div className="w-full max-w-2xl">
        <div className="flex items-center justify-between mb-10">
          <div>
            <h2 className="text-xl font-bold tracking-tight mb-1 text-white">Sovereign Roadmap</h2>
            <p className="text-xs text-white/30">Actionable milestones for your entity's grant journey.</p>
          </div>
          <button 
            onClick={generateRoadmap}
            disabled={isGenerating}
            className="glass flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-emerald-400 hover:border-emerald-500/30 transition-all disabled:opacity-30"
          >
            {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            Generate Full Roadmap
          </button>
        </div>

        {statusMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl mb-8 border ${statusMessage.type === 'error' ? 'bg-red-500/5 border-red-500/20 text-red-400' : 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'} text-xs font-medium`}
          >
            {statusMessage.text}
          </motion.div>
        )}

        <div className="glass border-l-2 border-l-white/20 p-4 mb-10 rounded-r-xl">
           <h2 className="text-[11px] font-medium flex items-center gap-2 text-white/60">
             <AlertCircle size={14} className="text-white/40" />
             Checklist is synced to your Entity Context Profile.
           </h2>
        </div>

        <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-white/10">
          {checklist.map((item, idx) => (
            <Step 
              key={item.id}
              number={idx + 1} 
              title={item.task} 
              desc={`Category: ${item.category}`}
              completed={item.status === 'completed'}
              onToggle={() => toggleTask(item.id)}
            />
          ))}
          {checklist.length === 0 && (
            <div className="py-20 text-center">
              <p className="text-white/20 text-sm italic">The Guide is currently blank. Start a chat or generate a roadmap.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface StepProps {
  number: number;
  title: string;
  desc: string;
  completed?: boolean;
  onToggle?: () => void;
  action?: React.ReactNode;
  key?: string;
}

function Step({ number, title, desc, completed, onToggle, action }: StepProps) {
  return (
    <motion.div 
      initial={{ x: -20, opacity: 0 }}
      whileInView={{ x: 0, opacity: 1 }}
      viewport={{ once: true }}
      className={`relative pl-16 transition-all duration-500 ${completed ? 'opacity-40 grayscale-[0.5]' : 'opacity-100'}`}
    >
      <button 
        onClick={onToggle}
        className={`absolute left-0 top-1.5 w-9 h-9 rounded-2xl font-black text-xs flex items-center justify-center border shadow-2xl transition-all duration-500 z-10 ${
          completed 
          ? 'bg-emerald-500 text-black border-emerald-400' 
          : 'bg-[#1e1e20] text-emerald-400 border-emerald-500/30 glow-emerald'
        }`}
      >
        {completed ? '✓' : number}
      </button>
      <div 
        className={`glass-bulge p-8 rounded-[2.5rem] border transition-all duration-500 group cursor-pointer relative overflow-hidden ${
          completed ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-white/5 hover:border-emerald-500/20 shadow-2xl hover:shadow-emerald-500/5'
        }`}
        onClick={onToggle}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />
        <h3 className={`font-black text-base mb-2 transition-colors tracking-tight ${completed ? 'text-emerald-400 line-through' : 'text-white/90 group-hover:text-white'}`}>
          {title}
        </h3>
        <p className="text-[11px] text-white/30 mb-4 leading-relaxed font-bold uppercase tracking-widest">{desc}</p>
        <div onClick={(e) => e.stopPropagation()}>
          {action}
        </div>
      </div>
    </motion.div>
  );
}

// --- Tab C: Parse (The Rejection Killer) ---
function ParseTab() {
  const [draft, setDraft] = useState(`PROJECT DESCRIPTION:
We are developing a high-scale React/Node.js mobile app that disrupts the local vegetable market via AI disruption and peer-to-peer cloud scaling. Our ROI is projected at 400% in 3 months.`);
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [riskLevel, setRiskLevel] = useState<'High' | 'Medium' | 'Low'>('High');

  const handleRewrite = async () => {
    setIsAnalyzing(true);
    try {
      const prompt = `
        You are a Senior Government Bureaucrat and Policy Specialist for the Ministry of MSME in India.
        Your task is to rewrite a draft grant application to ensure it uses "Gov-Speak" (Bureaucratic terminology) and adopts a highly formal, professional, and sustainability-focused tone.

        Rules for conversion:
        1. Replace "Disrupt" with "Optimize", "Standardize", or "Formalize".
        2. Replace "App" or "Product" with "Digital Infrastructure", "Service Delivery Interface", or "Technological Solution".
        3. Replace "AI" with "Algorithmic Intelligence" or "Automated Analytics".
        4. Focus on "Digital Public Infrastructure", "Employment Generation", and "Supply Chain Resilience".
        5. The tone should be humble yet formal, seeking assistance for shared national goals.
        6. Remove all silicon valley jargon (Scaling, Disruption, P2P, Disruptive).
        7. Change ROI-focused language to "Socio-economic impact and resource optimization".

        Current Draft:
        "${draft}"

        Output only the rewritten version. Start with "PROPOSAL FOR TECHNOLOGICAL INTEGRATION:".
      `;

      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });

      if (response.text) {
        setDraft(response.text.trim());
        setRiskLevel('Low');
      }
    } catch (e) {
      console.error("AI Rewrite failed", e);
      // Fallback simple rewrite if API fails
      let rewritten = draft;
      const fallbackMap: Record<string, string> = {
        "disrupt": "optimize",
        "app": "digital platform",
        "startup": "emerging unit"
      };
      Object.entries(fallbackMap).forEach(([key, val]) => {
        const regex = new RegExp(key, 'gi');
        rewritten = rewritten.replace(regex, val);
      });
      setDraft(rewritten);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Simple risk heuristic for UI feedback
  useEffect(() => {
    const buzzwords = ['disrupt', 'startup', 'roi', 'money', 'crypto', 'peer-to-peer'];
    const count = buzzwords.filter(w => draft.toLowerCase().includes(w)).length;
    if (count > 2) setRiskLevel('High');
    else if (count > 0) setRiskLevel('Medium');
    else setRiskLevel('Low');
  }, [draft]);

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: Document Viewer */}
      <div className="flex-1 border-r border-white/10 flex flex-col p-6 overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Input Application Draft</h3>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-white/40 italic">Paste text to analyze</span>
            <span className={`text-[10px] ${riskLevel === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' : riskLevel === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'} px-2 py-0.5 rounded border`}>
              {riskLevel} Risk Detected
            </span>
          </div>
        </div>
        <textarea 
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Paste your draft here..."
          className="flex-1 bg-white/3 rounded-xl border border-white/5 p-6 text-sm text-white/80 font-mono placeholder:text-white/50 focus:outline-none resize-none leading-relaxed transition-all"
        />
      </div>

      {/* Right: Fixes Panel */}
      <div className="w-[450px] flex flex-col p-6 space-y-6 overflow-y-auto">
        <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">KYRO Analysis</h3>
        
        {riskLevel !== 'Low' ? (
          <>
            <FixCard 
              type="error"
              title="Vogon Jargon Detected"
              issue="Silicon Valley terminology detected. Using 'Disruption' in a grant application is like reading poetry to a bureaucrat—dangerous and likely to cause a rejection."
              fix="The Engine will re-structure the entire document into Ministry-approved, life-affirming 'Gov-Speak'."
            />

            <FixCard 
              type="warning"
              title="Bureaucratic Probability Low"
              issue="Your current draft lacks 'Digital Public Infrastructure' alignment. The probability of survival in the DIC ecosystem is currently 2^276,709 to 1 against."
              fix="Translate those commercial goals into social impact metrics to improve the odds."
            />
          </>
        ) : (
          <div className="p-8 glass rounded-2xl border-emerald-500/20 border flex flex-col items-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
              <CheckSquare className="text-emerald-400" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-emerald-400">Mostly Harmless (Mostly)</h4>
              <p className="text-[10px] text-white/40 mt-1">Tone and structure are within official compliance limits. Don't Panic.</p>
            </div>
          </div>
        )}

        <div className="flex-1" />
        
        <button 
          onClick={handleRewrite}
          disabled={isAnalyzing || (riskLevel === 'Low' && draft.length > 50)}
          className="w-full py-4 glass glass-hover rounded-xl text-sm font-semibold flex items-center justify-center gap-2 text-white disabled:opacity-30 disabled:cursor-not-allowed group transition-all"
        >
          {isAnalyzing ? (
            <Loader2 size={16} className="animate-spin text-emerald-400" />
          ) : (
            <Zap size={16} className="group-hover:scale-110 transition-transform text-emerald-400" />
          )}
          {isAnalyzing ? 'Deep Bureaucratic Rewrite...' : 'Deep Rewrite to "Gov-Speak"'}
        </button>
      </div>
    </div>
  );
}

interface FixCardProps {
  type: 'error' | 'warning';
  title: string;
  issue: string;
  fix: string;
}

function FixCard({ type, title, issue, fix }: FixCardProps) {
  const color = type === 'error' ? 'text-red-400' : 'text-amber-400';
  const bgColor = type === 'error' ? 'bg-red-500/5' : 'bg-amber-500/5';
  const borderColor = type === 'error' ? 'border-red-500/10' : 'border-amber-500/10';

  return (
    <motion.div 
      initial={{ x: 10, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      className={`p-6 rounded-3xl border ${bgColor} ${borderColor} space-y-4`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${bgColor} border ${borderColor}`}>
            <AlertCircle size={14} className={color} />
          </div>
          <span className={`text-xs font-bold tracking-tight ${color}`}>{title}</span>
        </div>
        <div className="w-1.5 h-1.5 rounded-full bg-white/10 animate-pulse" />
      </div>
      <p className="text-xs text-white/70 leading-relaxed">{issue}</p>
      <div className="pt-4 border-t border-white/5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">Strategic Correction</span>
        <p className="text-[11px] italic text-white/50 mt-2 leading-relaxed">{fix}</p>
      </div>
    </motion.div>
  );
}

// --- Tab D: Filling & Liaison ---
function FillingTab() {
  const [desc, setDesc] = useState('We are building a new factory for processing nuts.');
  const [title, setTitle] = useState('Rural Agro-Processing Hub');
  const [turnover, setTurnover] = useState('');
  const [udyamId, setUdyamId] = useState('');
  const [isDownloading, setIsDownloading] = useState(false);

  const translateToGov = async () => {
    try {
      const prompt = `Rewrite this project description for a formal Indian Government MSME grant application. Use "Gov-Speak". Tone: Formal, Bureaucratic, Professional.
      
      Original: "${desc}"
      
      Output only the rewritten version.`;
      
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt
      });
      
      if (response.text) {
        setDesc(response.text.trim());
      }
    } catch (e) {
      console.error("Filling translation failed", e);
    }
  };

  const downloadDocument = async () => {
    const element = document.getElementById('representation-letter');
    if (!element) return;
    
    setIsDownloading(true);
    try {
      // Use a custom configuration to avoid oklab/oklch parsing issues in html2canvas
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const el = clonedDoc.getElementById('representation-letter');
          if (el) {
            // Aggressively strip any modern color functions that html2canvas can't parse
            const allElements = el.getElementsByTagName('*');
            
            // Fix the container itself
            el.style.color = '#000000';
            el.style.backgroundColor = '#ffffff';
            el.style.borderColor = '#e5e7eb';

            for (let i = 0; i < allElements.length; i++) {
              const item = allElements[i] as HTMLElement;
              const style = window.getComputedStyle(item);
              
              // Check and replace colors if they use modern formats
              if (style.color.includes('okl') || style.color.includes('var')) {
                item.style.setProperty('color', '#111827', 'important');
              }
              if (style.backgroundColor.includes('okl') || style.backgroundColor.includes('var')) {
                // If it's a transparent or white background, keep it clean
                if (style.backgroundColor.includes('0, 0, 0, 0') || style.backgroundColor === 'transparent') {
                  item.style.setProperty('background-color', 'transparent', 'important');
                } else {
                  item.style.setProperty('background-color', '#ffffff', 'important');
                }
              }
              if (style.borderColor.includes('okl') || style.borderColor.includes('var')) {
                item.style.setProperty('border-color', '#e5e7eb', 'important');
              }

              // Remove any backdrop-filter or complex effects that might break the parser
              item.style.backdropFilter = 'none';
              (item.style as any).webkitBackdropFilter = 'none';
            }
          }
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Sovereign_Application_${title.replace(/\s+/g, '_') || 'Draft'}.pdf`);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      alert('Failed to generate document. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: Form */}
      <div className="w-[500px] border-r border-white/10 flex flex-col p-8 overflow-y-auto space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-white/40">Government Grant Form</h3>
          <button 
            onClick={downloadDocument}
            disabled={isDownloading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all glow-emerald"
          >
            {isDownloading ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
            {isDownloading ? 'Generating...' : 'Download PDF'}
          </button>
        </div>
        
        <div className="space-y-4">
          <FormInput 
            label="Project Title" 
            placeholder="e.g. Rural Solar implementation" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <FormInput 
            label="Estimated Turnover (FY 2025)" 
            placeholder="INR Cr" 
            value={turnover}
            onChange={(e) => setTurnover(e.target.value)}
          />
          <FormInput 
            label="Udyam Registration ID" 
            placeholder="UDYAM-XX-00-0000000" 
            value={udyamId}
            onChange={(e) => setUdyamId(e.target.value)}
          />
          
          <div className="flex flex-col gap-2 relative">
            <label className="text-[10px] font-bold uppercase text-white/40">Implementation Description</label>
            <textarea 
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="e.g. Detailed business roadmap and impact..."
              className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm h-64 transition-all font-medium outline-none placeholder:text-white/50"
            />
            <button 
              onClick={translateToGov}
              className="absolute bottom-2 right-2 flex items-center gap-2 text-[10px] bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-all font-semibold"
            >
              <Zap size={12} />
              Translate to Gov-Speak
            </button>
          </div>
        </div>
      </div>

      {/* Right: Letter Preview */}
      <div className="flex-1 bg-[#f0f0f0] flex flex-col items-center p-12 overflow-y-auto overflow-x-hidden">
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-[800px] min-h-[1131px] bg-white shadow-[0_0_50px_rgba(0,0,0,0.15)] p-20 text-black relative flex flex-col"
          style={{ color: '#000000', backgroundColor: '#ffffff' }}
          id="representation-letter"
        >
          <div className="flex justify-between items-start mb-12">
            <div className="text-xs font-serif leading-tight">
              Date: {new Date().toLocaleDateString('en-IN')}<br />
              Place: New Delhi
            </div>
            <div className="text-xs font-serif text-right leading-tight">
              {udyamId && <div className="font-bold">Udyam No: {udyamId}</div>}
              {turnover && <div>Ref Turnover: ₹{turnover} Cr</div>}
            </div>
          </div>

          <div className="mb-12 font-serif">
            <p className="font-bold text-sm">To,<br />The General Manager,<br />District Industries Centre (DIC),<br />Government of India.</p>
          </div>

          <div className="mb-8 font-serif font-bold text-sm underline text-center uppercase">
            Subject: Representation regarding grant disbursement for project "{title || 'Unnamed Project'}" under the MSME cluster development scheme.
          </div>

          <div className="flex-1 font-serif text-sm leading-relaxed text-justify space-y-4">
            <p>Respected Sir/Madam,</p>
            <p>
              I am writing to you on behalf of our entity regarding the formal proposal for the grant assistance. 
              Our project, titled "{title || '[Project Title]'}", aims to enhance public infrastructure 
              through the {desc} 
              within the identified sector roadmap.
            </p>
            <p>
              As per the guidelines under Annexure IV, we have enclosed all relevant documentation 
              including the CIBIL reports and the Notary Affidavit. 
            </p>
            <p>
              We request your kind consideration for a physical inspection of our facility 
              to expedite the first-tranche release.
            </p>
          </div>

          <div className="mt-12 font-serif text-sm">
            Yours faithfully,<br />
            <div className="h-12 w-32 border-b border-black mb-1" />
            <p className="font-bold uppercase">(Authorized Signatory)</p>
          </div>
          
          {/* Print Overlay Controls */}
          <div className="absolute top-4 right-4 print:hidden flex gap-2">
            <button 
              onClick={downloadDocument}
              disabled={isDownloading}
              className="p-2 hover:bg-black/5 rounded transition-colors text-black/40 hover:text-black"
              title="Download PDF"
            >
              {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function FormInput({ label, placeholder, value, onChange }: { label: string; placeholder: string; value?: string; onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-[10px] font-bold uppercase text-white/40 tracking-wider">{label}</label>
      <input 
        type="text" 
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm transition-all font-medium placeholder:text-white/50 focus:outline-none"
      />
    </div>
  );
}
