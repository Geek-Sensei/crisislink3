import { useState, useEffect } from 'react';
import { useAuth } from '../authContext';
import socket from '../socket';
import axios from 'axios';
import { motion } from 'motion/react';
import { Shield, AlertCircle, Zap, MessageSquare, Map, Info, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateSafetyBriefing } from '../services/geminiService';

export default function GuestHome() {
  const { user } = useAuth();
  const [raising, setRaising] = useState(false);
  const [type, setType] = useState<'fire' | 'medical' | 'security' | 'general' | null>(null);
  const [description, setDescription] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const init = async () => {
      if (user?.hotelId?.hotelCode) {
        socket.emit('join_hotel', { 
          hotelCode: user.hotelId.hotelCode, 
          userId: user._id, 
          floor: user.floor 
        });
      }

      // Generate safety briefing if missing
      if (user && !user.safetyBriefing) {
        const briefing = await generateSafetyBriefing({
          name: user.name,
          floor: user.floor,
          room: user.room,
          hotelName: user.hotelId?.name || "the hotel"
        });
        await axios.patch(`/api/users/${user._id}`, { safetyBriefing: briefing });
        // Note: authContext might need refresh to show the new briefing immediately
        // For simplicity in prototype, we just update the text in UI if needed or let it be for next load
      }
    };
    
    init();

    socket.on('alert_created', (alert) => {
      if (alert.raisedBy === user._id) {
        navigate(`/guest/track/${alert._id}`);
      }
    });

    socket.on('broadcast_alert', ({ message, severity }) => {
      alert(`[BROADCAST - ${severity.toUpperCase()}] ${message}`);
    });

    return () => {
      socket.off('alert_created');
      socket.off('broadcast_alert');
    };
  }, [user]);

  const handleRaise = async () => {
    if (!type || !user) return;
    try {
      const severity = (type === 'fire' || type === 'medical') ? 'critical' : 'high';
      const hotelId = user.hotelId?._id || user.hotelId;
      
      if (!hotelId || hotelId === 'undefined') {
        alert("Hotel information is missing. Please try again in 5 seconds.");
        return;
      }

      await axios.post('/api/alerts/raise', {
        type, 
        severity,
        floor: user.floor || 1,
        room: user.room || 'N/A',
        description,
        raisedBy: user._id,
        raisedByRole: 'guest',
        hotelId
      });
    } catch (err) {
      alert("Error raising alert");
    }
  };

  return (
    <div className="pb-24 pt-6 px-6 max-w-lg mx-auto bg-bg-base min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Howdy, {user?.name.split(' ')[0]}</h1>
          <p className="text-text-secondary text-sm font-medium">Room {user?.room} • Floor {user?.floor}</p>
        </div>
        <div className="w-10 h-10 bg-bg-card rounded-xl flex items-center justify-center border border-border-default shadow-lg shadow-black/20">
          <User className="text-text-secondary" size={20} />
        </div>
      </div>

      {/* Safety Briefing - Bento Style */}
      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bento-card p-6 mb-8 relative border-accent-blue/20"
      >
        <div className="flex items-start gap-4 relative z-10">
          <div className="p-3 bg-accent-blue/10 rounded-2xl shrink-0">
            <Info className="text-accent-blue" size={24} />
          </div>
          <div>
            <h3 className="font-black text-sm uppercase tracking-widest text-text-primary mb-2">Safety Directive</h3>
            <p className="text-sm text-text-secondary leading-relaxed font-semibold">
              {user?.safetyBriefing || "Your safety is monitored 24/7. In case of localized incidents, activate the emergency button."}
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-accent-blue/5 rounded-full -mr-16 -mt-16 blur-2xl opacity-50"></div>
      </motion.div>

      {/* Panic Button Section */}
      {!raising ? (
        <div className="flex flex-col items-center justify-center py-6">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{ 
              boxShadow: ["0 0 0px #EF4444", "0 0 50px #EF444433", "0 0 0px #EF4444"] 
            }}
            transition={{ repeat: Infinity, duration: 3 }}
            onClick={() => setRaising(true)}
            className="w-52 h-52 bg-status-critical rounded-full flex flex-col items-center justify-center text-white shadow-2xl relative border-8 border-bg-base overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent"></div>
            <Zap size={64} className="mb-2 relative z-10 fill-current" />
            <span className="font-black text-2xl relative z-10 tracking-tighter">ALARM</span>
          </motion.button>
          <p className="mt-8 text-text-tertiary font-black text-[10px] tracking-[0.4em] uppercase">Emergency Response Interface</p>
        </div>
      ) : (
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bento-card p-6 border-status-critical/30 shadow-2xl shadow-status-critical/10"
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-sm font-black uppercase tracking-[0.2em] text-text-tertiary">Select Emergency</h2>
            <button onClick={() => setRaising(false)} className="text-text-tertiary hover:text-text-primary font-black text-xs uppercase underline underline-offset-4">Cancel</button>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-8">
            {(['fire', 'medical', 'security', 'general'] as const).map(t => (
              <button 
                key={t}
                onClick={() => setType(t)}
                className={`py-6 rounded-2xl flex flex-col items-center gap-3 border-2 transition-all duration-300 ${
                  type === t ? 'border-accent-purple bg-accent-purple/10 scale-[1.02]' : 'border-border-default bg-bg-elevated/50 hover:bg-bg-elevated'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-bg-base border border-border-default shadow-inner`}>
                  {t === 'fire' ? '🔥' : t === 'medical' ? '🚑' : t === 'security' ? '👮' : '⚠️'}
                </div>
                <span className="capitalize font-black text-xs tracking-wide">{t}</span>
              </button>
            ))}
          </div>

          <div className="relative mb-8">
             <textarea 
               placeholder="Briefly describe the emergency..."
               className="w-full bg-bg-elevated/50 border border-border-default rounded-2xl p-5 text-sm text-text-primary min-h-[120px] outline-none focus:ring-2 focus:ring-accent-purple transition-all italic"
               value={description}
               onChange={e => setDescription(e.target.value)}
             />
             <div className="absolute top-4 right-4 opacity-20"><AlertCircle size={20} /></div>
          </div>

          <button 
            disabled={!type}
            onClick={handleRaise}
            className={`w-full py-5 rounded-2xl font-black text-sm tracking-widest uppercase text-white transition-all transform active:scale-95 ${
              type ? 'bg-status-critical hover:brightness-110 shadow-xl shadow-status-critical/20' : 'bg-text-tertiary/20 text-text-tertiary cursor-not-allowed'
            }`}
          >
            ACTIVATE PROTOCOL
          </button>
        </motion.div>
      )}

      {/* Auxiliary Bento Action */}
      <div className="mt-8">
        <button className="w-full p-6 bento-card flex items-center gap-5 text-left hover:border-accent-purple/30 transition-colors group">
          <div className="p-4 bg-accent-purple/10 rounded-2xl group-hover:scale-110 transition-transform">
            <MessageSquare className="text-accent-purple" size={28} />
          </div>
          <div>
            <h4 className="font-black text-text-primary tracking-tight">In-Quarters Support</h4>
            <p className="text-xs text-text-tertiary font-bold">Assistance for non-critical requests</p>
          </div>
        </button>
      </div>

      {/* Dynamic Nav - Bento Styled */}
      <div className="fixed bottom-6 left-6 right-6 h-20 bg-bg-card/80 backdrop-blur-2xl rounded-[32px] border border-border-default flex items-center justify-around px-8 shadow-2xl">
        {[
          { icon: Zap, label: 'Alerts', active: true },
          { icon: Map, label: 'Map' },
          { icon: Shield, label: 'Safe' },
          { icon: User, label: 'Account' }
        ].map((item, i) => (
          <button key={i} className={`p-2 flex flex-col items-center gap-1.5 transition-all ${
            item.active ? 'text-accent-purple scale-110' : 'text-text-tertiary hover:text-text-secondary'
          }`}>
            <item.icon size={22} className={item.active ? 'fill-current' : ''} />
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
