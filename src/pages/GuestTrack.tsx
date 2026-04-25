import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket from '../socket';
import { useAuth } from '../authContext';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Navigation, MessageSquare, MapPin, X, CheckCircle2, AlertTriangle, Send, Zap, Phone } from 'lucide-react';
import { formatRelative } from 'date-fns';
import ConferenceBridge from '../components/ConferenceBridge';

export default function GuestTrack() {
  const { alertId } = useParams();
  const { user } = useAuth();
  const [alert, setAlert] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showConference, setShowConference] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; eta?: string } | null>(null);
  const msgEndRef = useRef<HTMLDivElement>(null);

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
    });

    socket.on('broadcast_alert', ({ message, severity }) => {
      alert(`[BROADCAST - ${severity.toUpperCase()}] ${message}`);
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
    } catch (err) {
      alert("Error confirming safety");
    }
  };

  if (!alert) return null;

  return (
    <div className="h-screen flex flex-col relative overflow-hidden">
      {/* Map Placeholder/Leaflet for real app - using visual placeholder for demo speed */}
      <div className="flex-1 bg-[#161D2E] relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          {/* Simulated grid lines */}
          <div className="w-full h-full border border-white/5 grid grid-cols-12 grid-rows-12">
            {Array.from({ length: 144 }).map((_, i) => <div key={i} className="border-t border-l border-white/5"></div>)}
          </div>
        </div>
        
        {/* Animated Pins */}
        <div className="absolute inset-0 flex items-center justify-center">
            {/* Hotel Pin */}
            <div className="relative">
              <MapPin className="text-red-500 fill-red-500/20" size={32} />
              <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#0F1420] px-3 py-1 rounded-full border border-white/5 text-[10px] font-bold uppercase tracking-widest">Hotel</div>
            </div>
            
            {/* Responder Pin */}
            <AnimatePresence>
              {alert.responderId && (
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ 
                    scale: 1,
                    x: location ? (location.lng - alert.hotelId?.lng) * 5000 : 80,
                    y: location ? (location.lat - alert.hotelId?.lat) * 5000 : -80
                  }}
                  className="absolute"
                >
                  <div className="relative">
                    <Navigation className="text-[#0EA5E9] fill-[#0EA5E9]/20" size={32} />
                    <motion.div 
                      animate={{ scale: [1, 2], opacity: [0.5, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute inset-0 bg-[#0EA5E9]/20 rounded-full"
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-[#0F1420] px-3 py-1 rounded-full border border-white/5 text-[10px] font-bold uppercase tracking-widest">Responder</div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
        </div>

        {/* Top Floating Status */}
        <div className="absolute top-6 left-6 right-6 flex items-center justify-between">
          <div className="bg-[#0F1420]/80 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/5">
             <div className="flex items-center gap-2 mb-1">
               <div className={`w-2 h-2 rounded-full ${alert.status === 'resolved' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`}></div>
               <span className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Live Alert</span>
             </div>
             <p className="text-sm font-bold text-white capitalize">{alert.type} Emergency</p>
          </div>
          <div className="flex flex-col gap-2">
            {location?.eta && (
              <div className="bg-[#0EA5E9] px-4 py-3 rounded-2xl shadow-lg shadow-[#0EA5E9]/20 text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Arriving In</p>
                <p className="text-lg font-black text-white">{location.eta}</p>
              </div>
            )}
            <div className="flex gap-2">
              <button 
                onClick={() => socket.emit('start_conference', { alertId: alert._id, initiatorRole: user.role, initiatorName: user.name })}
                className="bg-[#161D2E] border border-white/5 px-4 py-3 rounded-2xl shadow-lg flex items-center justify-end gap-2 group hover:bg-status-critical transition-all"
              >
                <Phone size={14} className="text-status-critical group-hover:text-white" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">3-Way Call</span>
              </button>
              {alert.hotelId?.phone && (
                <a 
                  href={`tel:${alert.hotelId.phone}`}
                  className="bg-[#161D2E] border border-white/5 px-4 py-3 rounded-2xl shadow-lg flex items-center justify-end gap-2 group hover:bg-[#0EA5E9] transition-all"
                >
                  <Zap size={14} className="text-[#0EA5E9] group-hover:text-white" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Call Staff</span>
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info Bottom Panel */}
      <motion.div 
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        className="bg-[#0F1420] rounded-t-[32px] p-6 pb-12 shadow-2xl border-t border-white/5"
      >
        <div className="w-12 h-1.5 bg-[#161D2E] rounded-full mx-auto mb-6"></div>
        
        <div className="space-y-6">
          {/* Status Tracker */}
          <div className="flex justify-between items-center px-2">
            {['open', 'accepted', 'on_scene', 'resolved'].map((s, idx, arr) => (
              <div key={s} className="flex flex-col items-center gap-2 relative">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  alert.status === s || (arr.indexOf(alert.status) > idx) ? 'border-[#0EA5E9] bg-[#0EA5E9]/10 text-[#0EA5E9]' : 'border-[#161D2E] text-[#475569]'
                }`}>
                  {arr.indexOf(alert.status) > idx ? <CheckCircle2 size={20} /> : idx + 1}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${
                   alert.status === s || (arr.indexOf(alert.status) > idx) ? 'text-white' : 'text-[#475569]'
                }`}>{s.replace('_', ' ')}</span>
                {idx < arr.length - 1 && (
                  <div className="absolute left-[100%] top-5 w-full h-[2px] bg-[#161D2E] -z-10 -ml-5"></div>
                )}
              </div>
            ))}
          </div>

          {/* AI Action Card */}
          <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex gap-4">
             <div className="p-2 bg-amber-500/20 rounded-lg h-fit">
               <AlertTriangle className="text-amber-500" size={20} />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Recommended Action</p>
               <p className="text-sm font-bold text-white leading-tight">
                 {alert.aiClassification?.guestAction || "Stay calm and wait for further instructions."}
               </p>
             </div>
          </div>

          {/* Responder Card */}
          {alert.responderId ? (
            <div className="flex items-center gap-4 bg-[#161D2E] p-4 rounded-2xl border border-white/5">
              <div className="w-12 h-12 bg-[#0EA5E9]/20 rounded-full flex items-center justify-center text-[#0EA5E9]">
                <Shield size={24} />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-white leading-none mb-1">{(alert.responderId as any).name}</h4>
                <div className="flex items-center gap-2">
                  <p className="text-xs text-[#94A3B8]">{(alert.responderId as any).agency}</p>
                  <span className="w-1 h-1 bg-[#475569] rounded-full"></span>
                  <a href={`tel:${(alert.responderId as any).phone}`} className="text-xs font-bold text-[#0EA5E9] hover:underline">
                    {(alert.responderId as any).phone}
                  </a>
                </div>
              </div>
              <button 
                onClick={() => setShowChat(true)}
                className="w-12 h-12 bg-[#0EA5E9] rounded-xl flex items-center justify-center text-white"
              >
                <MessageSquare size={24} />
              </button>
            </div>
          ) : (
             <div className="flex items-center justify-center p-6 bg-[#161D2E] rounded-2xl border border-dashed border-white/10">
               <p className="text-xs text-[#475569] font-bold uppercase tracking-widest animate-pulse">Waiting for Dispatch...</p>
             </div>
          )}
        </div>
      </motion.div>

      {/* Chat Overlay */}
      <AnimatePresence>
        {showChat && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="absolute inset-0 bg-[#080B12] z-50 flex flex-col pt-12"
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

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
               {messages.map(m => (
                 <div key={m._id} className={`flex flex-col ${m.senderId === user._id ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[80%] p-4 rounded-2xl ${
                      m.senderId === user._id ? 'bg-[#0EA5E9] text-white rounded-tr-none' : 'bg-[#161D2E] text-white rounded-tl-none'
                    }`}>
                      <p className="text-sm">{m.formattedText || m.rawText}</p>
                    </div>
                    <span className="text-[10px] text-[#475569] mt-1 px-1">
                      {formatRelative(new Date(m.timestamp), new Date())}
                    </span>
                 </div>
               ))}
               <div ref={msgEndRef} />
            </div>

            <div className="p-6 bg-[#0F1420] border-t border-white/5">
              <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
                {["I'm safe for now", "Smoke in my room", "I need help moving"].map(q => (
                  <button 
                    key={q} 
                    onClick={() => { setNewMsg(q); }}
                    className="whitespace-nowrap px-4 py-2 bg-[#161D2E] text-[10px] font-black uppercase tracking-widest text-[#94A3B8] rounded-full border border-white/5"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <input 
                  type="text" 
                  placeholder="Type a message..."
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

      {/* Safety Modal */}
      <AnimatePresence>
        {alert.status === 'awaiting_safety_confirmation' && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-[#080B12]/95 z-[100] p-8 flex flex-col items-center justify-center text-center"
          >
             <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mb-8">
                <CheckCircle2 className="text-green-500" size={48} />
             </div>
             <h2 className="text-3xl font-black text-white mb-4">Are you safe?</h2>
             <p className="text-[#94A3B8] mb-12 max-w-xs">
                The situation is marked as stable. Please confirm your status for our response team.
             </p>
             
             <div className="w-full space-y-4">
                <button 
                  onClick={() => confirmSafe(true)}
                  className="w-full py-5 bg-green-500 text-white font-black text-lg rounded-3xl shadow-xl shadow-green-500/20"
                >
                  I AM SAFE
                </button>
                <button 
                  onClick={() => confirmSafe(false)}
                  className="w-full py-5 bg-[#161D2E] text-red-500 font-black text-lg rounded-3xl border border-white/5"
                >
                  I STILL NEED HELP
                </button>
             </div>

             <div className="mt-12 w-full max-w-[200px]">
                <div className="text-[10px] font-black uppercase text-[#475569] mb-2 tracking-widest underline">Auto-Escalating in 60s</div>
                <div className="h-1 bg-[#161D2E] rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: '100%' }}
                    animate={{ width: 0 }}
                    transition={{ duration: 60, ease: 'linear' }}
                    className="h-full bg-[#0EA5E9]"
                  ></motion.div>
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
