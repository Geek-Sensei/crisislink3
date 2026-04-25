import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import socket from '../socket';
import { useAuth } from '../authContext';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Navigation, MessageSquare, MapPin, X, CheckCircle2, Send, Zap, ChevronUp, FileText, AlertCircle, Phone } from 'lucide-react';
import { formatRelative } from 'date-fns';
import { formatResponderMessage } from '../services/geminiService';
import ConferenceBridge from '../components/ConferenceBridge';

export default function ResponderAlert() {
  const { alertId } = useParams();
  const { user } = useAuth();
  const [alert, setAlert] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMsg, setNewMsg] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [showConference, setShowConference] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number; eta?: string } | null>(null);
  const navigate = useNavigate();
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

    socket.on('alert_on_scene', () => {
      setAlert((prev: any) => ({ ...prev, status: 'on_scene' }));
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
      socket.off('alert_on_scene');
      socket.off('conference_started');
      socket.off('conference_ended');
    };
  }, [alertId]);

  useEffect(() => {
    msgEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, showChat]);

  const sendChat = async () => {
    if (!newMsg.trim()) return;
    
    let formattedText = newMsg;
    if (user.role === 'responder') {
      formattedText = await formatResponderMessage(alert.type, newMsg);
    }

    socket.emit('send_message', {
      alertId,
      text: newMsg,
      formattedText,
      senderId: user._id,
      senderRole: user.role,
      senderName: user.name
    });
    setNewMsg('');
  };

  const markOnScene = async () => {
    await axios.patch(`/api/alerts/${alertId}/on-scene`);
    setAlert((prev: any) => ({ ...prev, status: 'on_scene' }));
  };

  const resolveAlert = async () => {
    await axios.patch(`/api/alerts/${alertId}/resolve`);
    setAlert((prev: any) => ({ ...prev, status: 'awaiting_safety_confirmation' }));
    navigate('/responder/home');
  };

  if (!alert) return null;

  return (
    <div className="h-screen flex flex-col bg-bg-base overflow-hidden font-sans">
      {/* Map Area - Tactical Bento style */}
      <div className="flex-1 bg-bg-base relative overflow-hidden">
         <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#161D2E 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
         
         {/* Alert Header Overlay */}
         <div className="absolute top-6 left-6 right-6 z-10 flex gap-4">
            <div className="bg-bg-card/80 backdrop-blur-xl p-5 rounded-[2.5rem] border border-border-default flex-1 flex items-center gap-5 shadow-2xl">
               <div className="w-14 h-14 bg-status-critical/10 rounded-2xl flex items-center justify-center text-status-critical border border-status-critical/20">
                  <AlertCircle size={32} />
               </div>
               <div>
                  <h3 className="font-black text-text-primary text-xl tracking-tight leading-none uppercase">{alert.type} Incident</h3>
                  <p className="text-[10px] font-black text-text-tertiary mt-1.5 uppercase tracking-[0.2em]">FLOOR {alert.floor} • ROOM {alert.room}</p>
               </div>
            </div>
            <div className="flex flex-col gap-2">
               {alert.raisedBy && (
                  <div className="bg-bg-card/80 backdrop-blur-xl p-3 rounded-2xl border border-border-default flex items-center gap-3 shadow-xl">
                     <div className="w-8 h-8 bg-accent-blue/10 rounded-lg flex items-center justify-center text-accent-blue font-black text-[10px]">
                        {alert.raisedBy.name?.charAt(0)}
                     </div>
                     <div className="flex-1">
                        <p className="text-[10px] font-black text-text-primary leading-none">{alert.raisedBy.name}</p>
                        <a href={`tel:${alert.raisedBy.phone}`} className="text-[9px] font-bold text-accent-blue hover:underline">
                           {alert.raisedBy.phone}
                        </a>
                     </div>
                  </div>
               )}
               {alert.hotelId && (
                  <div className="bg-bg-card/80 backdrop-blur-xl p-3 rounded-2xl border border-border-default flex items-center gap-3 shadow-xl">
                     <div className="w-8 h-8 bg-accent-purple/10 rounded-lg flex items-center justify-center text-accent-purple font-black text-[10px]">
                        H
                     </div>
                     <div className="flex-1">
                        <p className="text-[10px] font-black text-text-primary leading-none">Hotel Front Desk</p>
                        <a href={`tel:${alert.hotelId.phone}`} className="text-[9px] font-bold text-accent-purple hover:underline">
                           {alert.hotelId.phone}
                        </a>
                     </div>
                  </div>
               )}
            </div>
            {location?.eta && (
               <div className="bg-accent-orange w-24 h-24 rounded-[2.5rem] flex flex-col items-center justify-center shadow-2xl shadow-accent-orange/30 border-4 border-bg-base">
                  <p className="text-[9px] font-black text-white/70 uppercase">ETA</p>
                  <p className="text-3xl font-black text-white tracking-tighter leading-none">{location.eta}</p>
               </div>
            )}
            {!location?.eta && alert.status === 'accepted' && (
               <div className="bg-bg-card/80 backdrop-blur-xl px-5 py-2 rounded-full border border-border-default flex items-center gap-2">
                  <div className="w-2 h-2 bg-accent-orange rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase text-accent-orange tracking-widest">Tactical Broadcast Active</span>
               </div>
            )}
         </div>

         {/* Tactical Markers */}
         <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative">
               <div className="absolute inset-0 bg-status-critical rounded-full blur-2xl opacity-20 animate-pulse"></div>
               <MapPin className="text-status-critical fill-status-critical/20 filter drop-shadow-[0_0_15px_rgba(239,68,68,0.5)]" size={48} />
            </div>
         </div>

         {/* Support Intel Overlay */}
         <div className="absolute bottom-6 left-6 right-6 z-10 flex flex-col gap-3">
            <div className="bg-bg-card/80 backdrop-blur-xl p-4 rounded-3xl border border-border-default flex items-center gap-4 shadow-xl">
               <div className="w-10 h-10 bg-status-critical/10 rounded-xl flex items-center justify-center text-status-critical shrink-0">
                  <AlertCircle size={20} />
               </div>
               <div>
                  <p className="text-[8px] font-black text-text-tertiary uppercase tracking-widest leading-none mb-1">Guest Statement</p>
                  <p className="text-xs text-white font-bold leading-tight line-clamp-2">
                     {alert.description || "No verbal description provided by guest."}
                  </p>
               </div>
            </div>
            <div className="bg-bg-card/80 backdrop-blur-xl p-4 rounded-3xl border border-border-default flex items-center gap-4 shadow-xl">
               <div className="w-10 h-10 bg-accent-purple/10 rounded-xl flex items-center justify-center text-accent-purple shrink-0">
                  <Shield size={20} />
               </div>
               <div>
                  <p className="text-[8px] font-black text-text-tertiary uppercase tracking-widest leading-none mb-1">Tactical Briefing (AI)</p>
                  <p className="text-xs text-text-secondary font-bold leading-tight line-clamp-2">
                     {alert.aiClassification?.responderBriefing || "Standard protocol: Clear floor immediately. Use North stairwell."}
                  </p>
               </div>
            </div>
         </div>
      </div>

      {/* Control Panel - Bento Style bottom sheet */}
      <motion.div 
        initial={{ y: 200 }}
        animate={{ y: 0 }}
        className="bg-bg-card rounded-t-[3rem] p-10 border-t border-border-default shadow-[0_-30px_60px_rgba(0,0,0,0.6)] relative z-20"
      >
         <div className="w-16 h-1.5 bg-bg-elevated rounded-full mx-auto mb-10"></div>

         <div className="max-w-xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
               <div className="flex items-center gap-5">
                  <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${
                    alert.status === 'on_scene' 
                    ? 'bg-status-safe/10 text-status-safe border-status-safe/20' 
                    : 'bg-accent-orange/10 text-accent-orange border-accent-orange/20 animate-pulse'
                  }`}>
                    {alert.status.replace('_', ' ')}
                  </div>
                  <div>
                     <p className="text-xs text-text-primary font-black tracking-tight leading-none uppercase">Tactical Status</p>
                     <p className="text-[10px] text-text-tertiary font-bold mt-1">Responder Unit: Dispatch confirmed</p>
                  </div>
               </div>
               <div className="w-12 h-12 bg-bg-elevated rounded-2xl flex items-center justify-center text-text-secondary border border-border-default">
                  <Zap size={22} className="fill-current" />
               </div>
            </div>

            {/* Quick Actions Bento Grid */}
            <div className="grid grid-cols-3 gap-5">
               <button 
                 onClick={() => setShowChat(true)}
                 className="bento-card bg-bg-elevated/40 border-border-default py-6 flex flex-col items-center gap-3 hover:border-accent-blue/30 group transition-all"
               >
                  <div className="p-3 bg-accent-blue/10 rounded-2xl group-hover:scale-110 transition-transform">
                     <MessageSquare className="text-accent-blue" size={24} />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-text-tertiary group-hover:text-text-primary">Chat Intel</span>
               </button>
               <button 
                 onClick={() => socket.emit('start_conference', { alertId: alert._id, initiatorRole: user.role, initiatorName: user.name })}
                 className="bento-card bg-bg-elevated/40 border-border-default py-6 flex flex-col items-center gap-3 hover:border-status-critical/30 group transition-all"
               >
                  <div className="p-3 bg-status-critical/10 rounded-2xl group-hover:scale-110 transition-transform">
                     <Phone className="text-status-critical" size={24} />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-text-tertiary group-hover:text-text-primary">Tactical Bridge</span>
               </button>
               <button className="bento-card bg-bg-elevated/40 border-border-default py-6 flex flex-col items-center gap-3 hover:border-accent-purple/30 group transition-all">
                  <div className="p-3 bg-accent-purple/10 rounded-2xl group-hover:scale-110 transition-transform">
                     <FileText className="text-accent-purple" size={24} />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-text-tertiary group-hover:text-text-primary">Zone Intel</span>
               </button>
            </div>

            {/* Primary Action */}
            <div className="pt-2">
               {alert.status === 'accepted' ? (
                 <button 
                   onClick={markOnScene}
                   className="w-full py-6 bg-text-primary text-bg-base font-black text-sm tracking-[0.2em] uppercase rounded-[2rem] shadow-2xl flex items-center justify-center gap-4 transform active:scale-95 transition-all hover:brightness-110"
                 >
                   <MapPin size={24} /> MARK ON SCENE
                 </button>
               ) : alert.status === 'on_scene' ? (
                 <button 
                   onClick={resolveAlert}
                   className="w-full py-6 bg-status-safe text-white font-black text-sm tracking-[0.2em] uppercase rounded-[2rem] shadow-2xl shadow-status-safe/20 transform active:scale-95 transition-all hover:brightness-110"
                 >
                   <CheckCircle2 size={24} /> RESOLVE INCIDENT
                 </button>
               ) : null}
            </div>
         </div>
      </motion.div>

      {/* Chat Bottom Bar */}
      <AnimatePresence>
        {showChat && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            className="fixed inset-0 bg-[#080B12] z-[200] flex flex-col pt-12"
          >
             {/* Header */}
             <div className="flex items-center justify-between p-6 border-b border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#F97316]/20 rounded-full flex items-center justify-center text-[#F97316]">
                    <Shield size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white leading-none mb-1">Guest Communication</h3>
                    <p className="text-xs text-[#94A3B8]">Emergency Chat: Room {alert.room}</p>
                  </div>
                </div>
                <button onClick={() => setShowChat(false)} className="w-10 h-10 bg-[#161D2E] rounded-full flex items-center justify-center border border-white/5 text-[#475569]">
                  <X size={20} />
                </button>
              </div>

              {/* Msg List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                 {messages.map(m => (
                   <div key={m._id} className={`flex flex-col ${m.senderId === user._id ? 'items-end' : 'items-start'}`}>
                      <div className={`max-w-[80%] p-4 rounded-2xl ${
                        m.senderId === user._id ? 'bg-[#F97316] text-white rounded-tr-none' : 'bg-[#161D2E] text-white rounded-tl-none'
                      }`}>
                        <p className="text-sm font-medium">{m.rawText}</p>
                        {m.senderId === user._id && (
                           <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-1">
                             <CheckCircle2 size={10} className="text-white/60" />
                             <span className="text-[8px] font-bold uppercase text-white/60">Delivered as clear message</span>
                           </div>
                        )}
                      </div>
                      <span className="text-[10px] text-[#475569] mt-1 px-1">
                        {formatRelative(new Date(m.timestamp), new Date())}
                      </span>
                   </div>
                 ))}
                 <div ref={msgEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-6 bg-[#0F1420] border-t border-white/5 pb-12">
                <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-none">
                  {["I am on your floor", "Coming to your room now", "Wait outside"].map(q => (
                    <button 
                      key={q} 
                      onClick={() => setNewMsg(q)}
                      className="whitespace-nowrap px-4 py-2 bg-[#161D2E] text-[10px] font-black uppercase tracking-widest text-[#94A3B8] rounded-xl border border-white/5"
                    >
                      {q}
                    </button>
                  ))}
                </div>
                <div className="flex gap-3">
                  <input 
                    type="text" 
                    placeholder="Message the guest..."
                    className="flex-1 bg-[#161D2E] border-none rounded-xl px-5 py-4 text-white outline-none focus:ring-2 focus:ring-[#F97316]"
                    value={newMsg}
                    onChange={e => setNewMsg(e.target.value)}
                    onKeyPress={e => e.key === 'Enter' && sendChat()}
                  />
                  <button 
                    onClick={sendChat}
                    className="w-14 h-14 bg-[#F97316] rounded-xl flex items-center justify-center text-white shadow-xl shadow-[#F97316]/20"
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
