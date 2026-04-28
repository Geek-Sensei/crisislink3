import React from 'react';
import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Building2, 
  MapPin, 
  Zap, 
  ChevronRight, 
  Activity,
  Globe,
  Radio,
  Navigation
} from 'lucide-react';

import { useAuth } from '../authContext';

const PortalCard = ({ 
  title, 
  description, 
  icon: Icon, 
  link, 
  loginLink,
  color, 
  features 
}: { 
  title: string, 
  description: string, 
  icon: any, 
  link: string, 
  loginLink: string,
  color: string,
  features: string[]
}) => {
  const navigate = useNavigate();
  const { sessions } = useAuth();
  
  // Determine if we should go directly to home or login page
  const role = link.includes('hotel') ? 'hotel_staff' : link.includes('responder') ? 'responder' : 'guest';
  const target = sessions[role] ? link : loginLink;

  return (
    <motion.div 
      whileHover={{ y: -8, scale: 1.02 }}
      onClick={() => navigate(target)}
      className="group relative bg-[#0F172A] border border-white/5 rounded-[2.5rem] p-8 overflow-hidden flex flex-col h-full shadow-2xl transition-all duration-500 hover:border-white/10 cursor-pointer"
    >
      {/* Background Glow */}
      <div className={`absolute -top-24 -right-24 w-64 h-64 blur-[100px] opacity-10 group-hover:opacity-20 transition-opacity`} style={{ backgroundColor: color }} />
      
      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-xl relative z-10`} style={{ backgroundColor: `${color}15`, color }}>
        <Icon size={32} />
      </div>

      <div className="relative z-10 flex-1">
        <h3 className="text-2xl font-black text-white mb-3 tracking-tight group-hover:translate-x-1 transition-transform">{title}</h3>
        <p className="text-[#94A3B8] text-sm leading-relaxed mb-6 font-medium">
          {description}
        </p>

        <div className="space-y-3 mb-8">
          {features.map((f, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-[11px] font-black uppercase tracking-widest text-white/40">{f}</span>
            </div>
          ))}
        </div>
      </div>

      <button 
        onClick={(e) => { e.stopPropagation(); navigate(target); }}
        className="relative z-10 w-full py-4 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
        style={{ backgroundColor: color, color: '#000' }}
      >
        Access Portal <ChevronRight size={14} strokeWidth={3} />
      </button>
    </motion.div>
  );
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080B12] text-[#F1F5F9] relative overflow-hidden selection:bg-[#0EA5E9] selection:text-white">
      {/* Tactical Background Grid */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
      
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-6 pt-16 md:pt-32 pb-16 relative z-10">
        <header className="flex items-center justify-between mb-16 md:mb-32">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-[#0EA5E9] rounded-xl flex items-center justify-center shadow-lg shadow-[#0EA5E9]/20 transform -rotate-3 transition-transform hover:rotate-0 cursor-pointer">
                <Shield className="text-black" size={24} strokeWidth={2.5} />
             </div>
             <span className="text-xl font-black tracking-tighter uppercase italic text-white">Crisis Link</span>
          </div>
          <div className="hidden lg:flex items-center gap-8">
            <a href="#" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#94A3B8] hover:text-[#0EA5E9] transition-colors">Documentation</a>
            <a href="#" className="text-[10px] font-black uppercase tracking-[0.2em] text-[#94A3B8] hover:text-[#0EA5E9] transition-colors">System Status</a>
            <div className="px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-[9px] font-black uppercase tracking-widest text-[#0EA5E9] flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-[#0EA5E9] animate-pulse" />
              v4.0.2 Stable
            </div>
          </div>
          <div className="lg:hidden">
            <button className="text-[#94A3B8] p-2">
              <Activity size={24} />
            </button>
          </div>
        </header>

        <div className="flex flex-col gap-12 mb-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center md:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#0EA5E9]/10 rounded-full border border-[#0EA5E9]/20 mb-8 mx-auto md:mx-0">
               <Radio size={14} className="text-[#0EA5E9] animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#0EA5E9]">Live Tactical Deployment Active</span>
            </div>
            
            <h1 className="text-[12vw] md:text-[100px] font-black text-white leading-[0.85] tracking-tighter mb-8 uppercase italic transition-all">
              Empowering <br />
              <span className="text-transparent" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.3)' }}>Response </span> <br className="md:hidden" />
              Intelligence
            </h1>
            
            <div className="grid md:grid-cols-2 gap-12 items-start">
              <p className="text-lg md:text-xl text-[#94A3B8] leading-relaxed font-medium">
                The ultimate tactical bridge between hotel operations, emergency responders, and guest safety. Real-time evacuation, indoor navigation, and unified communication.
              </p>
              
              <div className="flex flex-wrap gap-8 md:justify-end">
                 <div>
                    <p className="text-3xl md:text-4xl font-black text-white leading-none mb-1 tracking-tighter">0.4s</p>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#475569]">Signal Latency</p>
                 </div>
                 <div className="h-10 w-[1px] bg-white/5 hidden md:block" />
                 <div>
                    <p className="text-3xl md:text-4xl font-black text-white leading-none mb-1 tracking-tighter">99.9%</p>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#475569]">Uptime SLA</p>
                 </div>
                 <div className="h-10 w-[1px] bg-white/5 hidden md:block" />
                 <div>
                    <p className="text-3xl md:text-4xl font-black text-white leading-none mb-1 tracking-tighter">ISO</p>
                    <p className="text-[8px] font-black uppercase tracking-[0.2em] text-[#475569]">CertifiedSec</p>
                 </div>
              </div>
            </div>
          </motion.div>

          <div className="flex flex-col md:flex-row gap-6 mt-8">
            <button 
              onClick={() => document.getElementById('portals')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-10 py-5 bg-[#0EA5E9] text-black font-black text-xs uppercase tracking-[0.3em] rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#0EA5E9]/20"
            >
              Initialize System
            </button>
            <button 
              onClick={() => alert("The tactical walkthrough demo is currently being processed by the BMS training unit.")}
              className="px-10 py-5 bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-[0.3em] rounded-2xl hover:bg-white/10 transition-all cursor-pointer"
            >
              Watch Demo
            </button>
          </div>
        </div>

        {/* Global Radar View */}
        <div className="relative mb-32 overflow-hidden rounded-[3rem] border border-white/5 bg-[#0F172A] aspect-[21/9]">
           <div className="absolute inset-0 opacity-20" 
                style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, #fff 1px, transparent 0)', backgroundSize: '24px 24px' }} />
           
           <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[120%] h-[120%] border border-white/5 rounded-full flex items-center justify-center animate-[pulse_6s_infinite]">
                 <div className="w-[60%] h-[60%] border border-white/5 rounded-full flex items-center justify-center">
                    <div className="w-12 h-12 bg-[#0EA5E9] rounded-full blur-[40px] opacity-20" />
                 </div>
              </div>
           </div>

           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
              <Globe className="text-[#0EA5E9] w-24 h-24 mb-4 mx-auto animate-pulse opacity-50" strokeWidth={1} />
              <p className="text-[10px] font-black uppercase tracking-[0.8em] text-white/20 whitespace-nowrap">Tactical Neural Network Online</p>
           </div>
        </div>

        {/* Portals Section */}
        <div id="portals" className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-24">
          <PortalCard 
            title="Hotel Admin"
            description="Complete control over building safety. Sync with BMS, issue mass evacuations, and monitor guest status in real-time."
            icon={Building2}
            link="/hotel/dashboard"
            loginLink="/hotel/login"
            color="#A855F7"
            features={["BMS Aggregation", "Evacuation Maps", "Guest Manifest"]}
          />
          <PortalCard 
            title="Responder"
            description="Tactical intelligence for field operators. GPS-guided indoor navigation, room blueprints, and multi-agency bridge."
            icon={Radio}
            link="/responder/home"
            loginLink="/responder/login"
            color="#22C55E"
            features={["Tactical Navigation", "Blueprints", "Comms Bridge"]}
          />
          <PortalCard 
            title="Guest Hub"
            description="Personal safety companion. Instant emergency alerts, digital safety briefings, and responder tracking."
            icon={Navigation}
            link="/guest/home"
            loginLink="/guest/checkin"
            color="#0EA5E9"
            features={["Mobile Check-in", "Alert Center", "Route Guide"]}
          />
        </div>

        {/* Footer */}
        <footer className="border-t border-white/5 pt-12 pb-12 flex flex-col md:flex-row items-center justify-between gap-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#475569]">© 2026 Crisis Link Technologies. All rights reserved.</p>
          <div className="flex gap-8">
             <a href="#" className="text-[10px] font-black uppercase tracking-widest text-[#475569] hover:text-white transition-colors">Privacy Protocol</a>
             <a href="#" className="text-[10px] font-black uppercase tracking-widest text-[#475569] hover:text-white transition-colors">Security Audit</a>
             <a href="#" className="text-[10px] font-black uppercase tracking-widest text-[#475569] hover:text-white transition-colors">Integrations</a>
          </div>
        </footer>
      </div>
    </div>
  );
}
