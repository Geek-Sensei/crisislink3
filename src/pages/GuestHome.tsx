import { useState, useEffect } from 'react';
import { useAuth } from '../authContext';
import socket from '../socket';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  AlertCircle, 
  Zap, 
  MessageSquare, 
  Map as MapIcon, 
  Info, 
  User,
  LogOut,
  Hotel,
  MapPin,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { generateSafetyBriefing } from '../services/geminiService';
import RealTimeMap from '../components/RealTimeMap';

type NavTab = 'alerts' | 'map' | 'safe' | 'account';

export default function GuestHome() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('alerts');
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

      if (user && !user.safetyBriefing) {
        const briefing = await generateSafetyBriefing({
          name: user.name,
          floor: user.floor,
          room: user.room,
          hotelName: user.hotelId?.name || "the hotel"
        });
        await axios.patch(`/api/users/${user._id}`, { safetyBriefing: briefing });
      }
    };
    
    init();

    socket.on('alert_created', (alert) => {
      if (alert.raisedBy === user._id) {
        navigate(`/guest/track/${alert._id}`);
      }
    });

    socket.on('broadcast_alert', ({ message, severity }) => {
      window.alert(`[BROADCAST - ${severity.toUpperCase()}] ${message}`);
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
        window.alert("Hotel information is missing. Please refresh.");
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
      window.alert("Error raising alert");
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  return (
    <div className="h-screen flex flex-col bg-[#080B12] text-white overflow-hidden items-center">
      
      {/* Content Area */}
      <div className="flex-1 w-full max-w-md relative overflow-hidden pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'alerts' && (
            <motion.div 
               key="alerts"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95 }}
               className="h-full flex flex-col p-6 pt-12 overflow-y-auto custom-scrollbar"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-black text-white tracking-tighter">Hi, {user.name.split(' ')[0]}</h1>
                  <p className="text-[#94A3B8] text-xs font-black uppercase tracking-widest mt-1">Room {user.room} • Floor {user.floor}</p>
                </div>
                <div className="w-12 h-12 bg-[#161D2E] rounded-2xl flex items-center justify-center border border-white/5 shadow-2xl">
                  <User className="text-accent-purple" size={24} />
                </div>
              </div>

              {/* Safety Briefing */}
              <div className="bg-[#161D2E]/50 p-6 rounded-[2.5rem] border border-white/5 relative mb-12 overflow-hidden shadow-xl">
                 <div className="flex items-start gap-4 relative z-10">
                    <div className="p-3 bg-[#0EA5E9]/10 rounded-2xl shrink-0">
                       <Info className="text-[#0EA5E9]" size={24} />
                    </div>
                    <div>
                       <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-[#94A3B8] mb-2">Personal Directive</h3>
                       <p className="text-sm text-white/90 leading-relaxed font-semibold">
                          {user.safetyBriefing || "System active. Select 'Alarm' to activate priority response protocols."}
                       </p>
                    </div>
                 </div>
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#0EA5E9]/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
              </div>

              {/* Panic System */}
              {!raising ? (
                <div className="flex-1 flex flex-col items-center justify-center -mt-10">
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{ 
                      boxShadow: ["0 0 0px #EF4444", "0 0 40px #EF444433", "0 0 0px #EF4444"] 
                    }}
                    transition={{ repeat: Infinity, duration: 3 }}
                    onClick={() => setRaising(true)}
                    className="w-56 h-56 bg-status-critical rounded-full flex flex-col items-center justify-center text-white shadow-2xl relative border-[12px] border-[#080B12] group overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-tr from-black/30 to-transparent"></div>
                    <Zap size={72} className="mb-2 relative z-10 fill-current" />
                    <span className="font-black text-3xl relative z-10 tracking-tighter">ALARM</span>
                  </motion.button>
                  <p className="mt-10 text-[#475569] font-black text-[10px] tracking-[0.5em] uppercase">Emergency Response Interface</p>
                </div>
              ) : (
                <div className="bg-[#161D2E] p-8 rounded-[3rem] border border-white/5 shadow-2xl">
                   <div className="flex justify-between items-center mb-8">
                      <h2 className="text-xs font-black uppercase tracking-[0.3em] text-[#94A3B8]">Type of incident</h2>
                      <button onClick={() => setRaising(false)} className="text-status-critical font-black text-[10px] uppercase underline decoration-2 underline-offset-4">Cancel</button>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4 mb-8">
                     {(['fire', 'medical', 'security', 'general'] as const).map(t => (
                       <button 
                         key={t}
                         onClick={() => setType(t)}
                         className={`py-6 rounded-3xl flex flex-col items-center gap-3 border-2 transition-all duration-300 ${
                           type === t ? 'border-accent-purple bg-accent-purple/10 scale-[1.02]' : 'border-white/5 bg-[#0F1420]/50 hover:bg-[#0F1420]'
                         }`}
                       >
                         <div className="text-2xl">{t === 'fire' ? '🔥' : t === 'medical' ? '🚑' : t === 'security' ? '👮' : '⚠️'}</div>
                         <span className="capitalize font-black text-xs text-white">{t}</span>
                       </button>
                     ))}
                   </div>

                   <textarea 
                     placeholder="Situational notes..."
                     className="w-full bg-[#0F1420] border border-white/5 rounded-3xl p-6 text-sm text-white min-h-[120px] outline-none focus:ring-2 focus:ring-accent-purple mb-8 italic"
                     value={description}
                     onChange={e => setDescription(e.target.value)}
                   />

                   <button 
                     disabled={!type}
                     onClick={handleRaise}
                     className={`w-full py-6 rounded-3xl font-black text-sm tracking-widest uppercase text-white transition-all ${
                       type ? 'bg-status-critical hover:brightness-110 shadow-2xl shadow-status-critical/30' : 'bg-[#475569]/20 text-[#475569] cursor-not-allowed'
                     }`}
                   >
                     ACTIVATE PROTOCOL
                   </button>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'map' && (
            <motion.div 
               key="map"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="h-full relative"
            >
               <RealTimeMap 
                  center={[user.hotelId?.lat || 12.9716, user.hotelId?.lng || 77.5946]}
                  hotel={user.hotelId}
                  alerts={[]}
                  responders={[]}
                  zoom={16}
               />
               <div className="absolute top-12 left-6 right-6">
                  <div className="bg-[#0F1420]/90 backdrop-blur-xl p-6 rounded-3xl border border-white/5 shadow-2xl">
                     <h3 className="text-xl font-black mb-1">{user.hotelId?.name}</h3>
                     <p className="text-[10px] text-[#94A3B8] font-black uppercase tracking-widest">Hotel Grounds • Situational View</p>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'safe' && (
            <motion.div 
               key="safe"
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 1.1 }}
               className="h-full flex flex-col items-center justify-center p-8 text-center"
            >
               <div className="w-24 h-24 bg-status-safe/10 rounded-[2rem] flex items-center justify-center mb-8 border border-status-safe/20 shadow-[0_0_40px_rgba(34,197,94,0.1)]">
                  <CheckCircle2 size={48} className="text-status-safe" />
               </div>
               <h2 className="text-4xl font-black mb-4 tracking-tighter uppercase">Status: Monitored</h2>
               <p className="text-[#94A3B8] text-sm font-medium max-w-xs leading-relaxed">
                  Your safety is being tracked by the BMS grid. No active threats have been reported on Floor {user.floor}.
               </p>
               <div className="mt-12 p-6 bg-[#161D2E] rounded-[2.5rem] border border-white/5 w-full max-w-sm">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#475569] mb-4">Response Threshold</p>
                  <p className="text-xs text-white/90">Average responder ETA for your zone is <span className="font-black text-[#0EA5E9]">4m 12s</span>.</p>
               </div>
            </motion.div>
          )}

          {activeTab === 'account' && (
            <motion.div 
               key="account"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="h-full flex flex-col p-8 pt-16"
            >
               <div className="flex items-center gap-6 mb-12">
                  <div className="w-20 h-20 bg-accent-purple/20 rounded-[2rem] flex items-center justify-center text-accent-purple text-2xl font-black">
                     {user.name.charAt(0)}
                  </div>
                  <div>
                     <h2 className="text-3xl font-black text-white capitalize">{user.name}</h2>
                     <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Floor {user.floor} • Room {user.room}</p>
                  </div>
               </div>

               <div className="space-y-4 flex-1">
                  <div className="bg-[#161D2E] p-6 rounded-3xl border border-white/5 flex items-center justify-between shadow-lg">
                     <div>
                        <p className="text-[10px] font-black uppercase text-[#475569] mb-1">Hotel Registry</p>
                        <p className="font-bold">{user.hotelId?.name}</p>
                     </div>
                     <Hotel size={24} className="text-accent-purple opacity-50" />
                  </div>
                  <div className="bg-[#161D2E] p-6 rounded-3xl border border-white/5 flex items-center justify-between shadow-lg">
                     <div>
                        <p className="text-[10px] font-black uppercase text-[#475569] mb-1">Location Code</p>
                        <p className="font-mono text-xl font-black">#{user.hotelId?.hotelCode}</p>
                     </div>
                     <MapPin size={24} className="text-[#0EA5E9] opacity-50" />
                  </div>
               </div>

               <button 
                  onClick={handleLogout}
                  className="w-full py-5 bg-white/5 text-[#94A3B8] font-black text-xs uppercase tracking-widest rounded-2xl border border-white/5 flex items-center justify-center gap-2 hover:bg-white/10"
               >
                  <LogOut size={16} /> Sign Out of BMS
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Persistent Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-4 bg-gradient-to-t from-[#080B12] via-[#080B12]/95 to-transparent pointer-events-none">
        <div className="max-w-md mx-auto bg-[#161D2E]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-3 flex items-center justify-around shadow-2xl pointer-events-auto">
          <button 
            onClick={() => setActiveTab('alerts')}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === 'alerts' ? 'bg-status-critical/10 text-status-critical' : 'text-[#475569]'}`}
          >
            <Zap size={22} className={activeTab === 'alerts' ? 'fill-current' : ''} />
            <span className="text-[8px] font-black uppercase tracking-widest">Alarm</span>
            {activeTab === 'alerts' && <motion.div layoutId="nav-dot-home" className="w-1.5 h-1.5 bg-status-critical rounded-full mt-1 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />}
          </button>

          <button 
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === 'map' ? 'bg-[#0EA5E9]/10 text-[#0EA5E9]' : 'text-[#475569]'}`}
          >
            <MapIcon size={22} className={activeTab === 'map' ? 'fill-current' : ''} />
            <span className="text-[8px] font-black uppercase tracking-widest">Map</span>
            {activeTab === 'map' && <motion.div layoutId="nav-dot-home" className="w-1.5 h-1.5 bg-white rounded-full mt-1 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />}
          </button>

          <button 
            onClick={() => setActiveTab('safe')}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === 'safe' ? 'bg-status-safe/10 text-status-safe' : 'text-[#475569]'}`}
          >
            <Shield size={22} className={activeTab === 'safe' ? 'fill-current' : ''} />
            <span className="text-[8px] font-black uppercase tracking-widest">Safe</span>
            {activeTab === 'safe' && <motion.div layoutId="nav-dot-home" className="w-1.5 h-1.5 bg-status-safe rounded-full mt-1 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />}
          </button>

          <button 
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === 'account' ? 'bg-accent-purple/10 text-accent-purple' : 'text-[#475569]'}`}
          >
            <User size={22} className={activeTab === 'account' ? 'fill-current' : ''} />
            <span className="text-[8px] font-black uppercase tracking-widest">Account</span>
            {activeTab === 'account' && <motion.div layoutId="nav-dot-home" className="w-1.5 h-1.5 bg-accent-purple rounded-full mt-1 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />}
          </button>
        </div>
      </div>
    </div>
  );
}
