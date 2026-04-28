import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket from '../socket';
import { useAuth } from '../authContext';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Navigation, 
  MessageSquare, 
  MapPin, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Send, 
  Zap, 
  Phone,
  User,
  Map as MapIcon,
  LogOut,
  Hotel
} from 'lucide-react';
import { formatRelative } from 'date-fns';
import ConferenceBridge from '../components/ConferenceBridge';
import SafetyBriefing from '../components/SafetyBriefing';
import RealTimeMap from '../components/RealTimeMap';
import BlueprintView from '../components/BlueprintView';

type NavTab = 'alerts' | 'map' | 'safe' | 'account';

export default function GuestTrack() {
  const { alertId } = useParams();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<NavTab>('alerts');
  const [alert, setAlert] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showConference, setShowConference] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; eta?: string } | null>(null);
  const [broadcasts, setBroadcasts] = useState<{message: string, severity: string, time: Date, id: string}[]>([]);
  const msgEndRef = useRef<HTMLDivElement>(null);

  const dismissBroadcast = (id: string) => {
    setBroadcasts(prev => prev.filter(b => b.id !== id));
  };

  useEffect(() => {
    axios.get(`/api/alerts/${alertId}`).then(res => setAlert(res.data));
    axios.get(`/api/messages?alertId=${alertId}`).then(res => setMessages(res.data));

    socket.emit('join_alert_room', { alertId });
    
    socket.on('alert_updated', (updated) => {
      if (updated._id === alertId) setAlert(updated);
    });

    socket.on('location_update', (data) => {
      setLocation({ lat: data.lat, lng: data.lng, eta: data.eta });
    });

    socket.on('new_message', (msg) => {
      setMessages(prev => [...prev, msg]);
    });

    socket.on('safety_ping', () => {
      setAlert((prev: any) => ({ ...prev, status: 'awaiting_safety_confirmation' }));
      setActiveTab('safe'); // Auto-switch to safety tab
    });

    socket.on('broadcast_alert', ({ message, severity }) => {
      setBroadcasts(prev => [{
        message, 
        severity, 
        time: new Date(),
        id: Math.random().toString(36).substring(7)
      }, ...prev]);
    });

    socket.on('conference_started', () => {
      setShowConference(true);
    });

    socket.on('conference_ended', () => {
      setShowConference(false);
    });

    return () => {
      socket.off('alert_updated');
      socket.off('location_update');
      socket.off('new_message');
      socket.off('safety_ping');
      socket.off('broadcast_alert');
      socket.off('conference_started');
      socket.off('conference_ended');
    };
  }, [alertId]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showChat]);

  const sendChat = () => {
    if (!newMsg.trim()) return;
    socket.emit('send_message', {
      alertId,
      text: newMsg,
      senderId: user._id,
      senderRole: user.role,
      senderName: user.name
    });
    setNewMsg('');
  };

  const confirmSafe = async (safe: boolean) => {
    try {
      await axios.patch(`/api/alerts/${alertId}/confirm-safe`, { userId: user._id, safe });
      if (safe) {
        setAlert((prev: any) => ({ ...prev, status: 'resolved' }));
      }
      setActiveTab('alerts'); // Switch back after confirmation
    } catch (err) {
      console.error("Error confirming safety", err);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!alert) return null;

  return (
    <div className="h-screen flex flex-col bg-[#080B12] text-white overflow-hidden">
      
      {/* Dynamic Content Views */}
      <div className="flex-1 relative overflow-hidden pb-24">
        <AnimatePresence mode="wait">
          {activeTab === 'map' && (
            <motion.div 
              key="map-view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0"
            >
              <RealTimeMap 
                center={[alert.hotelId?.lat || 12.9716, alert.hotelId?.lng || 77.5946]}
                hotel={alert.hotelId}
                alerts={[alert]}
                responders={alert.responderId ? [{ _id: (alert.responderId as any)._id, name: (alert.responderId as any).name || 'Responder', responderType: (alert.responderId as any).responderType, lat: location?.lat, lng: location?.lng, eta: location?.eta }] : []}
                zoom={16}
                routingTo={location?.lat ? [alert.hotelId?.lat, alert.hotelId?.lng] : null}
              />
              <div className="absolute top-6 left-6 right-6 pointer-events-none space-y-4">
                 <div className="bg-[#0F1420]/90 backdrop-blur-xl p-4 rounded-2xl border border-white/5 inline-flex items-center gap-4 pointer-events-auto shadow-2xl">
                    <div className="w-8 h-8 rounded-full bg-[#0EA5E9]/20 flex items-center justify-center text-[#0EA5E9] animate-pulse">
                       <Navigation size={18} />
                    </div>
                    <div>
                       <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8] mb-0.5">Live responder feed</p>
                       <p className="text-xs font-bold text-white">Zone A responder navigation</p>
                    </div>
                 </div>
              </div>
              
              {location?.eta && (
                <div className="absolute top-6 right-6 pointer-events-none">
                   <div className="bg-[#0F1420]/90 backdrop-blur-xl w-20 h-20 rounded-2xl border border-white/5 flex flex-col items-center justify-center pointer-events-auto shadow-2xl">
                      <p className="text-xl font-black text-white">{location.eta.split(' ')[0]}</p>
                      <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">ETA</p>
                   </div>
                </div>
              )}

              <div className="absolute bottom-32 left-6 right-6 pointer-events-none flex gap-3">
                 <div className="bg-[#0F1420]/90 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/5 pointer-events-auto">
                    <p className="text-[8px] font-black uppercase tracking-widest text-[#475569] mb-1">Route</p>
                    <p className="text-xs font-bold text-white">Queued</p>
                 </div>
                 <div className="bg-[#0F1420]/90 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/5 pointer-events-auto">
                    <p className="text-[8px] font-black uppercase tracking-widest text-[#475569] mb-1">Status</p>
                    <p className="text-xs font-bold text-white tracking-widest uppercase">{alert.status}</p>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'alerts' && (
            <motion.div 
              key="alerts-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="h-full flex flex-col pt-12 p-6 overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between mb-8">
                 <div>
                    <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Incident Details</h2>
                    <p className="text-xs text-[#94A3B8] font-bold uppercase tracking-widest flex items-center gap-2">
                       <Zap size={14} className="text-status-critical" /> Live Emergency Tracking
                    </p>
                 </div>
                 <div className="w-12 h-12 bg-[#161D2E] rounded-2xl flex items-center justify-center text-lg shadow-inner">
                    {alert.type === 'fire' ? '🔥' : alert.type === 'medical' ? '🚑' : '👮'}
                 </div>
              </div>

              <div className="space-y-6 flex-1">
                {/* Broadcasts */}
                <AnimatePresence>
                  {broadcasts.length > 0 && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex flex-col gap-4"
                    >
                      {broadcasts.map(b => (
                         <motion.div 
                           key={b.id}
                           initial={{ x: -20, opacity: 0 }}
                           animate={{ x: 0, opacity: 1 }}
                           className={`p-6 rounded-[2rem] border relative overflow-hidden shadow-xl ${
                             b.severity === 'critical' ? 'bg-status-critical/10 border-status-critical/30' : 
                             b.severity === 'high' ? 'bg-status-high/10 border-status-high/30' : 
                             'bg-accent-blue/10 border-accent-blue/30'
                           }`}
                         >
                            <div className="flex items-start gap-4 relative z-10">
                               <div className={`p-3 rounded-2xl shrink-0 ${
                                 b.severity === 'critical' ? 'bg-status-critical text-white' : 
                                 b.severity === 'high' ? 'bg-status-high text-[#080B12]' : 
                                 'bg-accent-blue text-white'
                               }`}>
                                  <AlertCircle size={24} />
                               </div>
                               <div>
                                  <h3 className={`font-black text-[10px] uppercase tracking-[0.2em] mb-2 ${
                                    b.severity === 'critical' ? 'text-status-critical' : 
                                    b.severity === 'high' ? 'text-status-high' : 
                                    'text-accent-blue'
                                  }`}>Hotel Broadcast</h3>
                                  <p className="text-sm text-white/90 leading-relaxed font-bold">
                                     {b.message}
                                  </p>
                                  <p className="text-[10px] text-white/50 mt-3 font-mono">
                                    {b.time.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </p>
                               </div>
                               <button
                                 onClick={() => dismissBroadcast(b.id)}
                                 className="absolute top-4 right-4 text-white/30 hover:text-white transition-colors"
                               >
                                  <X size={16} />
                               </button>
                            </div>
                         </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Status Bar */}
                <div className="bg-[#161D2E]/50 p-6 rounded-[2rem] border border-white/5">
                  <div className="flex justify-between items-center mb-6">
                    {['open', 'accepted', 'on_scene', 'resolved'].map((s, idx, arr) => (
                      <div key={s} className="flex flex-col items-center gap-2 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all z-10 ${
                          alert.status === s || (arr.indexOf(alert.status) > idx) ? 'border-[#0EA5E9] bg-[#0EA5E9]/10 text-[#0EA5E9]' : 'border-[#161D2E] text-[#475569] bg-[#0F1420]'
                        }`}>
                          {arr.indexOf(alert.status) > idx ? <CheckCircle2 size={16} /> : <span className="text-[10px] font-black">{idx + 1}</span>}
                        </div>
                        {idx < arr.length - 1 && (
                          <div className={`absolute left-[100%] top-4 w-full h-[2px] -ml-4 -z-0 ${
                             (arr.indexOf(alert.status) > idx) ? 'bg-[#0EA5E9]' : 'bg-[#161D2E]'
                          }`}></div>
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="text-center">
                     <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#94A3B8] mb-1">Current Phase</p>
                     <p className="text-lg font-black text-white capitalize tracking-tight">{alert.status.replace('_', ' ')}</p>
                  </div>
                </div>

                <BlueprintView room={alert.room} floor={String(alert.floor)} />

                <SafetyBriefing alert={alert} />

                {alert.responderId && (
                  <div className="bg-[#161D2E] p-5 rounded-3xl border border-white/5 flex items-center gap-4">
                     <div className="w-12 h-12 bg-[#0EA5E9]/20 rounded-2xl flex items-center justify-center text-[#0EA5E9]">
                        <Shield size={24} />
                     </div>
                     <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Assigned Responder</p>
                        <h4 className="font-bold text-white">{(alert.responderId as any).name}</h4>
                     </div>
                     <button 
                        onClick={() => setShowChat(true)}
                        className="w-12 h-12 bg-[#0EA5E9] rounded-2xl flex items-center justify-center text-white shadow-lg shadow-[#0EA5E9]/20"
                     >
                        <MessageSquare size={20} />
                     </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 pb-8">
                   <button 
                      onClick={() => socket.emit('start_conference', { alertId: alert._id, initiatorRole: user.role, initiatorName: user.name })}
                      className="p-5 bg-[#161D2E] rounded-3xl border border-white/5 flex flex-col gap-3 hover:bg-status-critical/10 transition-colors"
                   >
                      <Phone size={20} className="text-status-critical" />
                      <div className="text-left">
                         <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Tactical Bridge</p>
                         <p className="font-bold text-sm">Join Call</p>
                      </div>
                   </button>
                   {alert.hotelId?.phone && (
                     <a 
                        href={`tel:${alert.hotelId.phone}`}
                        className="p-5 bg-[#161D2E] rounded-3xl border border-white/5 flex flex-col gap-3 hover:bg-[#0EA5E9]/10 transition-colors"
                     >
                        <Hotel size={20} className="text-[#0EA5E9]" />
                        <div className="text-left">
                           <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Lobby Desk</p>
                           <p className="font-bold text-sm">Call Staff</p>
                        </div>
                     </a>
                   )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'safe' && (
            <motion.div 
               key="safe-view"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 1.05 }}
               className="h-full flex flex-col items-center justify-center p-8 text-center"
            >
               <div className="w-24 h-24 bg-status-safe/10 rounded-full flex items-center justify-center mb-10 border border-status-safe/20 shadow-[0_0_40px_rgba(34,197,94,0.1)]">
                  <Shield size={48} className="text-status-safe" />
               </div>
               <h2 className="text-4xl font-black text-white mb-4 tracking-tighter uppercase">Are you safe?</h2>
               <p className="text-[#94A3B8] mb-12 max-w-xs text-sm leading-relaxed font-medium">
                  Confirming your safety helps our team prioritize guests who may still be in immediate danger.
               </p>
               
               <div className="w-full space-y-4 max-w-sm">
                  <button 
                    onClick={() => confirmSafe(true)}
                    className="w-full py-6 bg-status-safe text-white font-black text-lg rounded-[2rem] shadow-2xl shadow-status-safe/30 active:scale-95 transition-transform"
                  >
                    I AM SAFE
                  </button>
                  <button 
                    onClick={() => confirmSafe(false)}
                    className="w-full py-6 bg-[#161D2E] text-status-critical font-black text-lg rounded-[2rem] border border-white/5 active:scale-95 transition-transform"
                  >
                    I NEED HELP
                  </button>
               </div>

               {alert.status === 'awaiting_safety_confirmation' && (
                  <div className="mt-16 w-full max-w-[240px]">
                     <div className="text-[10px] font-black uppercase text-[#475569] mb-3 tracking-widest underline decoration-status-critical/30 underline-offset-4">Automatic Escalation Pending</div>
                     <div className="h-1.5 bg-[#161D2E] rounded-full overflow-hidden">
                        <motion.div 
                           initial={{ width: '100%' }}
                           animate={{ width: 0 }}
                           transition={{ duration: 60, ease: 'linear' }}
                           className="h-full bg-status-critical shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                        ></motion.div>
                     </div>
                  </div>
               )}
            </motion.div>
          )}

          {activeTab === 'account' && (
            <motion.div 
               key="account-view"
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="h-full flex flex-col pt-16 p-8"
            >
               <div className="flex items-center gap-6 mb-12">
                  <div className="w-20 h-20 bg-accent-purple/20 rounded-[2rem] flex items-center justify-center text-accent-purple text-2xl font-black">
                     {user.name?.charAt(0) || 'G'}
                  </div>
                  <div>
                     <h2 className="text-3xl font-black text-white capitalize">{user.name}</h2>
                     <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Guest Profile • Verified</p>
                  </div>
               </div>

               <div className="space-y-4 flex-1">
                  <div className="bg-[#161D2E] p-6 rounded-3xl border border-white/5">
                     <p className="text-[10px] font-black uppercase tracking-widest text-[#475569] mb-4">Hotel Assignment</p>
                     <div className="flex items-center justify-between">
                        <div>
                           <p className="font-bold text-white">{alert.hotelId?.name}</p>
                           <p className="text-xs text-[#94A3B8]">Floor {user.floor} • Room {user.room}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-2xl font-mono font-black text-accent-purple">#{alert.hotelId?.hotelCode}</p>
                        </div>
                     </div>
                  </div>

                  <div className="bg-[#161D2E] p-6 rounded-3xl border border-white/5">
                     <p className="text-[10px] font-black uppercase tracking-widest text-[#475569] mb-4">Registered Contact</p>
                     <p className="font-medium text-white mb-1">{user.phone}</p>
                     <p className="text-[10px] text-accent-purple font-black">Used for Emergency SMS Broadcasts</p>
                  </div>
               </div>

               <button 
                  onClick={handleLogout}
                  className="w-full py-5 bg-white/5 text-[#94A3B8] font-black text-xs uppercase tracking-widest rounded-2xl border border-white/5 flex items-center justify-center gap-2 hover:bg-white/10"
               >
                  <LogOut size={16} /> Exit Emergency Mode
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Persistent Chat Trigger (only if assigned) */}
      <AnimatePresence>
        {alert.responderId && !showChat && activeTab !== 'account' && (
           <motion.button
              initial={{ scale: 0, rotate: -45 }}
              animate={{ scale: 1, rotate: 0 }}
              onClick={() => setShowChat(true)}
              className="fixed bottom-32 right-6 w-14 h-14 bg-[#0EA5E9] rounded-2xl shadow-2xl shadow-[#0EA5E9]/40 flex items-center justify-center text-white z-40 border border-white/10"
           >
              <MessageSquare size={24} />
           </motion.button>
        )}
      </AnimatePresence>

      {/* Custom Bottom Nav */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-8 pt-4 bg-gradient-to-t from-[#080B12] via-[#080B12]/95 to-transparent pointer-events-none">
        <div className="max-w-md mx-auto bg-[#161D2E]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-3 flex items-center justify-around shadow-2xl pointer-events-auto">
          <button 
            onClick={() => setActiveTab('alerts')}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === 'alerts' ? 'bg-status-critical/10 text-status-critical' : 'text-[#475569]'}`}
          >
            <Zap size={22} className={activeTab === 'alerts' ? 'fill-current' : ''} />
            <span className="text-[8px] font-black uppercase tracking-widest">Alert</span>
            {activeTab === 'alerts' && <motion.div layoutId="nav-dot" className="w-1.5 h-1.5 bg-status-critical rounded-full mt-1 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />}
          </button>

          <button 
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === 'map' ? 'bg-[#0EA5E9]/10 text-[#0EA5E9]' : 'text-[#475569]'}`}
          >
            <MapIcon size={22} className={activeTab === 'map' ? 'fill-current' : ''} />
            <span className="text-[8px] font-black uppercase tracking-widest">Tactical</span>
            {activeTab === 'map' && <motion.div layoutId="nav-dot" className="w-1.5 h-1.5 bg-white rounded-full mt-1 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />}
          </button>

          <button 
            onClick={() => setActiveTab('safe')}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === 'safe' ? 'bg-status-safe/10 text-status-safe' : 'text-[#475569]'}`}
          >
            <Shield size={22} className={activeTab === 'safe' ? 'fill-current' : ''} />
            <span className="text-[8px] font-black uppercase tracking-widest">Safe</span>
            {activeTab === 'safe' && <motion.div layoutId="nav-dot" className="w-1.5 h-1.5 bg-status-safe rounded-full mt-1 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />}
          </button>

          <button 
            onClick={() => setActiveTab('account')}
            className={`flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${activeTab === 'account' ? 'bg-accent-purple/10 text-accent-purple' : 'text-[#475569]'}`}
          >
            <User size={22} className={activeTab === 'account' ? 'fill-current' : ''} />
            <span className="text-[8px] font-black uppercase tracking-widest">Account</span>
            {activeTab === 'account' && <motion.div layoutId="nav-dot" className="w-1.5 h-1.5 bg-accent-purple rounded-full mt-1 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />}
          </button>
        </div>
      </div>

      {/* Chat Overlay */}
      <AnimatePresence>
        {showChat && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute inset-0 bg-[#080B12] z-[60] flex flex-col pt-12"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0EA5E9]/20 rounded-full flex items-center justify-center text-[#0EA5E9]">
                  <Shield size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-white leading-none mb-1">Emergency Chat</h3>
                  <p className="text-xs text-[#94A3B8]">Connected to {(alert.responderId as any)?.name}</p>
                </div>
              </div>
              <button onClick={() => setShowChat(false)} className="w-10 h-10 bg-[#161D2E] rounded-full flex items-center justify-center border border-white/5">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
               {messages.map(m => (
                 <div key={m._id} className={`flex flex-col ${m.senderId === user._id ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl ${
                      m.senderId === user._id ? 'bg-[#0EA5E9] text-white rounded-tr-none' : 'bg-[#161D2E] text-white rounded-tl-none'
                    }`}>
                      <p className="text-sm">{m.formattedText || m.rawText}</p>
                    </div>
                    <span className="text-[10px] text-[#475569] mt-1 px-1 font-bold">
                      {formatRelative(new Date(m.timestamp), new Date())}
                    </span>
                 </div>
               ))}
               <div ref={msgEndRef} />
            </div>

            <div className="p-6 bg-[#0F1420] border-t border-white/5 pb-12">
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
                {["I'm safe for now", "Smoke in my room", "I need help moving", "Door is blocked"].map(q => (
                  <button 
                    key={q} 
                    onClick={() => { setNewMsg(q); }}
                    className="whitespace-nowrap px-4 py-2 bg-[#161D2E] text-[10px] font-black uppercase tracking-widest text-white/50 rounded-full border border-white/5"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="Tactical update..."
                  className="flex-1 bg-[#161D2E] border-none rounded-xl px-4 text-white outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                  value={newMsg}
                  onChange={e => setNewMsg(e.target.value)}
                  onKeyPress={e => e.key === 'Enter' && sendChat()}
                />
                <button 
                  onClick={sendChat}
                  className="w-12 h-12 bg-[#0EA5E9] rounded-xl flex items-center justify-center text-white"
                >
                  <Send size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConference && (
          <ConferenceBridge 
            alert={alert} 
            user={user} 
            onClose={() => setShowConference(false)} 
            socket={socket} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
