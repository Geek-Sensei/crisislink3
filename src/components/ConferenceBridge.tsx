import { motion, AnimatePresence } from 'motion/react';
import { Phone, PhoneOff, Mic, MicOff, Users, Shield, User, Camera, VideoOff } from 'lucide-react';
import { useState, useEffect } from 'react';

interface ConferenceBridgeProps {
  alert: any;
  user: any;
  onClose: () => void;
  socket: any;
}

export default function ConferenceBridge({ alert, user, onClose, socket }: ConferenceBridgeProps) {
  const [activeMembers, setActiveMembers] = useState<string[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideo, setIsVideo] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    // Simulate connection
    const members = ['Guest', 'Hotel Admin'];
    if (alert.responderId) members.push('Responder');
    setActiveMembers(members);

    const interval = setInterval(() => {
      setTimer(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [alert]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    socket.emit('end_conference', { alertId: alert._id });
    onClose();
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[1000] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6"
    >
      {/* Encryption Header */}
      <div className="absolute top-12 flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full border border-white/10">
        <Shield size={12} className="text-status-safe" />
        <span className="text-[10px] font-black uppercase text-white/60 tracking-widest">Tactical Bridge Sealed • AES-256</span>
      </div>

      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Participant 1: Guest */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className={`w-32 h-32 rounded-[2rem] bg-accent-blue/10 border-2 border-accent-blue/30 flex items-center justify-center text-4xl shadow-2xl relative overflow-hidden`}>
               <User className="text-accent-blue" size={48} />
               {isVideo && <div className="absolute inset-0 bg-gray-800 animate-pulse" />}
               <div className="absolute bottom-2 right-2 bg-status-safe w-4 h-4 rounded-full border-4 border-black" />
            </div>
            <div className="absolute -top-3 -right-3 p-2 bg-black/50 rounded-full border border-white/10">
               <Mic size={14} className="text-white" />
            </div>
          </div>
          <div className="text-center">
            <h4 className="text-white font-black uppercase tracking-widest text-xs">Guest Unit</h4>
            <p className="text-status-safe text-[9px] font-bold uppercase mt-1">On Line</p>
          </div>
        </div>

        {/* Participant 2: Responder */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
             <motion.div 
               animate={{ scale: [1, 1.05, 1] }}
               transition={{ repeat: Infinity, duration: 2 }}
               className="w-40 h-40 rounded-[2.5rem] bg-status-critical/10 border-4 border-status-critical/40 flex items-center justify-center shadow-[0_0_50px_rgba(239,68,68,0.2)]"
             >
                <Shield className="text-status-critical" size={64} />
                <div className="absolute inset-0 border-4 border-status-critical/20 rounded-[2.5rem] animate-ping" style={{ animationDuration: '3s' }} />
             </motion.div>
             <div className="absolute -top-3 -right-3 p-2 bg-black/50 rounded-full border border-white/10">
               <Mic size={14} className="text-white" />
            </div>
          </div>
          <div className="text-center">
            <h4 className="text-white font-black uppercase tracking-widest text-xs">Responder Base</h4>
            <p className="text-status-critical text-[9px] font-bold uppercase mt-1 animate-pulse">Speaking...</p>
          </div>
        </div>

        {/* Participant 3: Hotel Front Desk */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-32 h-32 rounded-[2rem] bg-accent-purple/10 border-2 border-accent-purple/30 flex items-center justify-center text-accent-purple">
               <Users size={48} />
               <div className="absolute bottom-2 right-2 bg-status-safe w-4 h-4 rounded-full border-4 border-black" />
            </div>
            <div className="absolute -top-3 -right-3 p-2 bg-black/50 rounded-full border border-white/10">
               <MicOff size={14} className="text-text-tertiary" />
            </div>
          </div>
          <div className="text-center">
            <h4 className="text-white font-black uppercase tracking-widest text-xs">Hotel Command</h4>
            <p className="text-text-tertiary text-[9px] font-bold uppercase mt-1">Listening Only</p>
          </div>
        </div>
      </div>

      <div className="mt-20 flex flex-col items-center gap-12">
        <div className="text-center">
            <p className="text-white/40 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Duration</p>
            <p className="text-4xl font-black text-white font-mono">{formatTime(timer)}</p>
        </div>

        <div className="flex items-center gap-8">
           <button 
             onClick={() => setIsMuted(!isMuted)}
             className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${isMuted ? 'bg-white/10 border-white/20 text-white' : 'bg-white/5 border-white/5 text-white/40'}`}
           >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
           </button>

           <button 
             onClick={handleEndCall}
             className="w-20 h-20 bg-status-critical rounded-full flex items-center justify-center text-white shadow-2xl shadow-status-critical/30 hover:scale-110 active:scale-95 transition-all"
           >
              <PhoneOff size={32} />
           </button>

           <button 
             onClick={() => setIsVideo(!isVideo)}
             className={`w-16 h-16 rounded-full flex items-center justify-center border-2 transition-all ${isVideo ? 'bg-accent-blue border-accent-blue text-white' : 'bg-white/5 border-white/5 text-white/40'}`}
           >
              {isVideo ? <Camera size={24} /> : <VideoOff size={24} />}
           </button>
        </div>
      </div>

      {/* Connection Quality Footer */}
      <div className="absolute bottom-12 flex items-center gap-4">
         <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className={`w-1 h-3 rounded-full ${i < 4 ? 'bg-status-safe' : 'bg-white/10'}`} />
            ))}
         </div>
         <span className="text-[10px] font-black uppercase text-white/40 tracking-widest">Signal Integrity: 98%</span>
      </div>
    </motion.div>
  );
}
