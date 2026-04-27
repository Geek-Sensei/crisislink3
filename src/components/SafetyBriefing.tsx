import { motion } from 'motion/react';
import { Shield, MapPin, Zap, Info } from 'lucide-react';
import { useState, useEffect } from 'react';
import { generateSafetyBriefing } from '../services/geminiService';

interface SafetyBriefingProps {
  alert: any;
}

export default function SafetyBriefing({ alert }: SafetyBriefingProps) {
  const [briefing, setBriefing] = useState<string>('Analyzing floor layout for safest extraction...');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBriefing = async () => {
      try {
        const text = await generateSafetyBriefing({
          floor: alert.floor,
          hotelName: alert.hotelId?.name || 'Hotel'
        });
        setBriefing(text);
      } catch (err) {
        setBriefing('Stay calm. Find the nearest stairwell with a green exit sign. Do not use elevators.');
      } finally {
        setLoading(false);
      }
    };
    fetchBriefing();
  }, [alert]);

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bento-card bg-accent-blue/10 border-accent-blue/30 p-6 shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10">
         <Shield size={64} className="text-accent-blue" />
      </div>
      
      <div className="flex items-center gap-3 mb-4">
        <div className="w-8 h-8 bg-accent-blue/20 rounded-lg flex items-center justify-center text-accent-blue">
           <Zap size={18} />
        </div>
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-accent-blue">AI Safety Intel</h3>
      </div>

      <div className="space-y-4">
         <p className={`text-xs font-bold leading-relaxed text-text-primary ${loading ? 'animate-pulse' : ''}`}>
           {briefing}
         </p>
         
         <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-bg-base/50 rounded-xl border border-white/5">
               <div className="flex items-center gap-2 mb-1">
                  <MapPin size={12} className="text-status-safe" />
                  <span className="text-[8px] font-black uppercase text-text-tertiary">Safe Zone</span>
               </div>
               <p className="text-[10px] font-black text-text-primary uppercase">Main Lawn</p>
            </div>
            <div className="p-3 bg-bg-base/50 rounded-xl border border-white/5">
               <div className="flex items-center gap-2 mb-1">
                  <Info size={12} className="text-accent-orange" />
                  <span className="text-[8px] font-black uppercase text-text-tertiary">Exit Path</span>
               </div>
               <p className="text-[10px] font-black text-text-primary uppercase">Stairwell B</p>
            </div>
         </div>
      </div>
    </motion.div>
  );
}
