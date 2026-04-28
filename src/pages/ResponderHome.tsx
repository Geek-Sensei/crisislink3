import { useState, useEffect } from 'react';
import { useAuth } from '../authContext';
import socket from '../socket';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Shield, 
  Map, 
  CheckCircle2, 
  X, 
  Navigation, 
  MessageSquare,
  Power,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  User,
  MapPin,
  Target,
  Signal,
  Activity
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import MobileNav from '../components/MobileNav';
import BlueprintView from '../components/BlueprintView';

export default function ResponderHome() {
  const { user, logout, updateUser } = useAuth();
  const [available, setAvailable] = useState(user?.available || false);
  const [activeAlert, setActiveAlert] = useState<any>(null); // For the takeover overlay
  const [allActiveAlerts, setAllActiveAlerts] = useState<any[]>([]);
  const [filter, setFilter] = useState('matches');
  const [showProfile, setShowProfile] = useState(false);
  const [location, setLocation] = useState({ lat: user?.lat || 12.9716, lng: user?.lng || 77.5946 });
  const navigate = useNavigate();

  const fetchActiveAlerts = async () => {
    try {
      const res = await axios.get('/api/alerts/active');
      setAllActiveAlerts(res.data);
    } catch (err) {
      console.error("Failed to fetch alerts", err);
    }
  };

  useEffect(() => {
    fetchActiveAlerts();

    if (user?._id) {
      socket.emit('join_responder', { responderId: user._id });
    }

    socket.on('alert_created', (alert) => {
      // Show takeover for matching dispatches if available
      if (available && alert.status === 'open' && (alert.type === user.responderType || alert.type === 'general')) {
        setActiveAlert(alert);
      }
      fetchActiveAlerts();
    });

    socket.on('alert_updated', (updated) => {
      // If this responder was just assigned this alert by hotel staff
      const assignedToMe = (updated.responderId?._id === user._id || updated.responderId === user._id);
      if (assignedToMe && updated.status === 'accepted') {
        // Only show takeover if not already viewing or navigation hasn't happened
        setActiveAlert(updated);
      }
      fetchActiveAlerts();
    });

    socket.on('alert_reopened', (data) => {
      alert(`⚠️ ESCALATION: Safety not confirmed in Room ${data.room}. Floor ${data.floor}.`);
    });

    return () => {
      socket.off('alert_created');
      socket.off('alert_reopened');
    };
  }, [user]);

  const toggleAvailability = async () => {
    try {
      const next = !available;
      const { data } = await axios.patch(`/api/users/${user._id}`, { available: next });
      setAvailable(data.available);
      updateUser(data);
      socket.emit('mark_available', { responderId: user._id, available: data.available });
    } catch (err) {
      console.error("Failed to update availability", err);
    }
  };

  const updateLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        const { latitude, longitude } = position.coords;
        setLocation({ lat: latitude, lng: longitude });
        socket.emit('location_update', { 
          responderId: user._id, 
          lat: latitude, 
          lng: longitude 
        });
      });
    } else {
      // Mock update if geolocation not available
      const nextLat = location.lat + (Math.random() - 0.5) * 0.01;
      const nextLng = location.lng + (Math.random() - 0.5) * 0.01;
      setLocation({ lat: nextLat, lng: nextLng });
      socket.emit('location_update', { 
        responderId: user._id, 
        lat: nextLat, 
        lng: nextLng 
      });
    }
  };

  const handleAccept = async (alertId: string) => {
    try {
      await axios.patch(`/api/alerts/${alertId}/accept`, { responderId: user._id });
      setActiveAlert(null);
      navigate(`/responder/alert/${alertId}`);
    } catch (err) {
      alert("Alert could not be accepted.");
    }
  };

  const handleDecline = () => {
    setActiveAlert(null);
  };

  return (
    <div className="min-h-screen bg-bg-base p-6 max-w-lg mx-auto pb-32">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowProfile(true)}
            className="w-14 h-14 bg-bg-card rounded-2xl flex items-center justify-center text-text-tertiary border border-border-default hover:text-text-primary transition-colors group relative"
          >
            <User size={28} />
            <div className="absolute top-full mt-2 left-0 px-2 py-1 bg-bg-card border border-white/10 rounded text-[7px] font-black uppercase opacity-0 group-hover:opacity-100 whitespace-nowrap z-50">Profile</div>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-accent-orange/10 rounded-2xl flex items-center justify-center text-accent-orange border border-accent-orange/20 shadow-lg shrink-0">
              <Shield size={28} />
            </div>
            <div className="flex flex-col justify-center">
              <h1 className="text-xl font-black text-text-primary tracking-tight leading-none mb-1">{user?.name}</h1>
              <p className="text-[10px] text-text-tertiary font-black uppercase tracking-[0.2em] leading-none">{user?.agency}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/')}
            className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-text-tertiary hover:text-white transition-colors"
          >
            Exit
          </button>
          <button 
            onClick={toggleAvailability}
            className={`w-14 h-7 rounded-full transition-all relative border border-border-default ${available ? 'bg-status-safe' : 'bg-bg-card'}`}
          >
            <motion.div 
              animate={{ x: available ? 28 : 0 }}
              className="absolute top-0.5 left-0.5 w-5.5 h-5.5 bg-white rounded-full shadow-lg"
            />
          </button>
        </div>
      </div>

      {/* Status Bento Grid */}
      <div className="bento-card bg-bg-card p-6 mb-8 grid grid-cols-5 gap-4 items-center">
         <div className="text-center col-span-1">
            <p className="text-[8px] font-black uppercase text-text-tertiary tracking-widest mb-2">Duty</p>
            <div className={`flex flex-col items-center gap-1 font-black text-[10px] uppercase ${available ? 'text-status-safe' : 'text-status-critical'}`}>
               <div className={`w-1.5 h-1.5 rounded-full ${available ? 'bg-status-safe shadow-[0_0_8px_var(--color-status-safe)]' : 'bg-status-critical'}`} />
               {available ? 'On' : 'Off'}
            </div>
         </div>
         <div className="w-px h-8 bg-border-default mx-auto" />
         <div className="text-center col-span-1">
            <p className="text-[8px] font-black uppercase text-text-tertiary tracking-widest mb-2">Trust</p>
            <p className="text-xs font-black text-text-primary">{(user?.reliabilityScore * 100).toFixed(0)}%</p>
         </div>
         <div className="w-px h-8 bg-border-default mx-auto" />
         <div className="text-center col-span-1">
            <p className="text-[8px] font-black uppercase text-text-tertiary tracking-widest mb-2">GPS</p>
            <p className="text-[9px] font-mono text-text-primary leading-none">
              {location?.lat ? `${location.lat.toFixed(4)}, ${location.lng?.toFixed(4)}` : 'No Signal'}
            </p>
         </div>
      </div>

      {/* Coverage Zones - Horizontal Bento */}
      <div className="bento-card p-4 mb-8">
         <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-text-tertiary mb-3 px-2">Assigned Sectors</h3>
         <div className="flex flex-wrap gap-2">
            {user?.coverageZones?.map((z: string) => (
               <span key={z} className="px-4 py-2 bg-bg-elevated rounded-xl text-[10px] font-black text-text-secondary border border-border-default shadow-sm">
                  {z}
               </span>
            ))}
         </div>
      </div>

      {/* Dashboard Grid Shortcuts */}
      <div className="grid grid-cols-2 gap-6 mb-8">
         <button 
           onClick={() => navigate('/responder/map')}
           className="bento-card bg-bg-elevated/40 p-6 flex flex-col gap-4 group hover:border-accent-blue/50 transition-all text-left"
         >
            <div className="w-12 h-12 bg-accent-blue/10 rounded-2xl flex items-center justify-center text-accent-blue group-hover:scale-110 transition-transform shadow-inner">
               <Map size={24} />
            </div>
            <span className="font-black text-sm text-text-primary tracking-tight">Deployment Map</span>
         </button>
         <button 
           onClick={() => alert("Detailed agency-wide analytics are restricted. View your personal tactical performance below.")}
           className="bento-card bg-bg-elevated/40 p-6 flex flex-col gap-4 group hover:border-accent-orange/50 transition-all text-left"
         >
            <div className="w-12 h-12 bg-accent-orange/10 rounded-2xl flex items-center justify-center text-accent-orange group-hover:scale-110 transition-transform shadow-inner">
               <TrendingUp size={24} />
            </div>
            <span className="font-black text-sm text-text-primary tracking-tight">Performance Metrics</span>
         </button>
      </div>

      {/* Tactical Hub - Replaces decorative bars with a more relevant 'System Pulse' */}
      <div className="bento-card bg-bg-card p-6 mb-8 overflow-hidden relative border-accent-blue/10">
         <div className="flex justify-between items-start mb-6">
            <div>
               <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Strategic Resource Pulse</h3>
               <p className="text-xl font-black text-text-primary">Zone B-4 <span className="text-[10px] text-accent-blue font-mono ml-2">HEARTBEAT_READY</span></p>
            </div>
            <div className="w-10 h-10 bg-accent-blue/10 rounded-xl flex items-center justify-center text-accent-blue">
               <Activity size={20} className="animate-pulse" />
            </div>
         </div>
         
         <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-bg-elevated/40 p-4 rounded-2xl border border-white/5">
               <p className="text-[8px] font-black text-text-tertiary uppercase tracking-widest mb-1">Response Latency</p>
               <p className="text-lg font-black text-white">142ms</p>
            </div>
            <div className="bg-bg-elevated/40 p-4 rounded-2xl border border-white/5">
               <p className="text-[8px] font-black text-text-tertiary uppercase tracking-widest mb-1">Secure Uptime</p>
               <p className="text-lg font-black text-status-safe">99.9%</p>
            </div>
         </div>

         <div className="p-4 bg-status-safe/5 border border-status-safe/20 rounded-2xl flex items-center gap-4">
            <div className="flex gap-1">
               {[1, 2, 3, 4].map(i => (
                 <motion.div 
                   key={i}
                   animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                   transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                   className="w-1 h-1 bg-status-safe rounded-full"
                 />
               ))}
            </div>
            <p className="text-[9px] font-black text-status-safe uppercase tracking-widest">Neural Link Synchronized: All Sectors Clear</p>
         </div>
      </div>

      {/* Active Missions */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Mission Briefing</h3>
      </div>

      <div className="space-y-4 mb-8">
         {allActiveAlerts.filter(a => (a.status === 'accepted' || a.status === 'on_scene') && a.responderId?._id === user._id).map(alert => (
           <div 
             key={alert._id} 
             className="bento-card border-accent-blue bg-accent-blue/5 p-5 flex flex-col gap-4 shadow-lg shadow-accent-blue/5"
           >
              <div className="flex items-center gap-5 cursor-pointer" onClick={() => navigate(`/responder/alert/${alert._id}`)}>
                <div className="w-12 h-12 bg-accent-blue/10 rounded-2xl flex items-center justify-center text-accent-blue border border-accent-blue/20">
                   <Shield size={20} className="animate-pulse" />
                </div>
                <div className="flex-1">
                   <h4 className="text-sm font-black text-text-primary capitalize">{alert.hotelId?.name || 'Hotel'} • {alert.type}</h4>
                   <p className="text-[10px] text-text-tertiary font-bold tracking-tight mt-0.5 uppercase">Floor {alert.floor} • Room {alert.room}</p>
                   <div className="mt-2 flex items-center gap-2">
                     <span className={`w-2 h-2 rounded-full ${alert.status === 'on_scene' ? 'bg-status-safe' : 'bg-accent-orange'} animate-ping`} />
                     <span className={`text-[8px] font-black uppercase ${alert.status === 'on_scene' ? 'text-status-safe' : 'text-accent-orange'}`}>
                        {alert.status.replace('_', ' ')}
                     </span>
                   </div>
                </div>
                <ChevronRight size={20} className="text-text-tertiary" />
              </div>
              
              <div className="flex gap-2 pt-2 border-t border-border-default/50">
                 {alert.status === 'accepted' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); axios.patch(`/api/alerts/${alert._id}/on-scene`).then(() => fetchActiveAlerts()); }}
                      className="flex-1 py-3 bg-text-primary text-bg-base text-[10px] font-black uppercase tracking-widest rounded-xl"
                    >
                       Mark On Scene
                    </button>
                 )}
                 {alert.status === 'on_scene' && (
                    <button 
                      onClick={(e) => { e.stopPropagation(); axios.patch(`/api/alerts/${alert._id}/resolve`).then(() => fetchActiveAlerts()); }}
                      className="flex-1 py-3 bg-status-safe text-white text-[10px] font-black uppercase tracking-widest rounded-xl"
                    >
                       Resolve Mission
                    </button>
                 )}
                 <button 
                   onClick={(e) => { e.stopPropagation(); navigate(`/responder/alert/${alert._id}`); }}
                   className="flex-1 py-3 bg-bg-elevated text-text-secondary text-[10px] font-black uppercase tracking-widest rounded-xl border border-border-default"
                 >
                    Details
                 </button>
              </div>
           </div>
         ))}
         {allActiveAlerts.filter(a => (a.status === 'accepted' || a.status === 'on_scene') && a.responderId?._id === user._id).length === 0 && (
           <div className="p-8 text-center bg-bg-elevated/20 rounded-[2rem] border border-dashed border-border-default">
             <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">No active deployments</p>
           </div>
         )}
      </div>

      {/* Available Dispatches */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-tertiary">Tactical Feed</h3>
        <div className="flex bg-bg-elevated rounded-lg p-1">
           {['matches', 'all'].map(t => (
             <button 
               key={t}
               onClick={() => setFilter(t)}
               className={`px-3 py-1.5 text-[8px] font-black uppercase rounded-md transition-all ${filter === t ? 'bg-bg-card text-white shadow-sm' : 'text-text-tertiary'}`}
             >
               {t}
             </button>
           ))}
        </div>
      </div>

      <div className="space-y-4">
         {allActiveAlerts
           .filter(a => a.status === 'open')
           .filter(a => filter === 'all' || (a.type === user.responderType || a.type === 'general'))
           .map(alert => (
           <div key={alert._id} className="bento-card bg-bg-elevated/40 p-5 flex flex-col gap-4 border-status-critical/30 relative overflow-hidden">
              {alert.type !== user.responderType && alert.type !== 'general' && (
                <div className="absolute top-0 right-0 pt-1 pr-3">
                   <div className="bg-accent-orange/10 text-accent-orange text-[7px] font-black px-2 py-0.5 rounded-bl-lg uppercase">Mismatched Intel</div>
                </div>
              )}
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 bg-status-critical/10 rounded-2xl flex items-center justify-center text-status-critical border border-status-critical/20">
                   <AlertCircle size={20} />
                </div>
                <div className="flex-1">
                   <h4 className="text-sm font-black text-text-primary capitalize">{alert.hotelId?.name || 'Hotel'} • {alert.type}</h4>
                   <p className="text-[10px] text-text-tertiary font-bold tracking-tight mt-0.5 uppercase">Floor {alert.floor} • Room {alert.room}</p>
                </div>
                <button 
                  onClick={() => handleAccept(alert._id)}
                  className="px-4 py-3 bg-status-critical text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg shadow-status-critical/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Accept
                </button>
              </div>
              <div className="text-[9px] text-text-tertiary font-medium bg-bg-base/50 p-2 rounded-lg italic">
                "{alert.description || 'No description available'}"
              </div>
           </div>
         ))}
         {allActiveAlerts.filter(a => a.status === 'open').length === 0 && (
           <div className="p-8 text-center bg-bg-elevated/10 rounded-[2rem] border border-border-default">
             <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">Scanning local frequencies...</p>
           </div>
         )}
      </div>

      {/* Critical Alert Takeover - Ultra High Priority UI */}
      <AnimatePresence>
        {activeAlert && (
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: 100 }}
            className={`fixed inset-0 z-[1000] p-10 flex flex-col items-center justify-center text-center ${
              activeAlert.type === 'fire' ? 'bg-status-critical' : 
              activeAlert.type === 'medical' ? 'bg-accent-blue' : 'bg-accent-orange'
            }`}
          >
             <div className="absolute inset-0 bg-black/20 mix-blend-overlay"></div>
             
             <motion.div 
               animate={{ scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] }}
               transition={{ repeat: Infinity, duration: 2 }}
               className="mb-10 relative"
             >
               <div className="absolute inset-0 blur-3xl bg-white/30 rounded-full"></div>
               <AlertCircle size={100} className="text-white relative z-10" />
             </motion.div>

             <h2 className="text-5xl font-black text-white uppercase mb-4 tracking-tighter leading-none relative z-10">
               MISSION ACTIVATED
             </h2>
             <p className="text-white/70 font-black text-sm uppercase tracking-[0.4em] mb-12 relative z-10">{activeAlert.type} Protocol</p>
             
             <div className="bento-card border-white/20 bg-black/30 backdrop-blur-3xl p-8 w-full max-w-sm mb-12 text-left space-y-6 relative z-10 shadow-3xl">
                <div>
                  <p className="text-[10px] font-black uppercase text-white/50 tracking-widest mb-2">Tactical Blueprint</p>
                  <BlueprintView room={activeAlert.room} floor={String(activeAlert.floor)} className="w-full h-40 mb-4 rounded-xl" />
                  <p className="text-2xl font-black text-white tracking-tight leading-none uppercase">Hotel Grand Chennai</p>
                  <p className="text-md font-bold text-white/80 mt-1 uppercase tracking-tighter">LEVEL {activeAlert.floor} • SUITE {activeAlert.room}</p>
                </div>
                {activeAlert.aiClassification?.responderBriefing && (
                  <div className="pt-6 border-t border-white/10">
                     <p className="text-[10px] font-black uppercase text-white/50 tracking-widest mb-3 uppercase">AI Intelligence Vector</p>
                     <p className="text-sm font-semibold text-white/90 leading-relaxed italic">"{activeAlert.aiClassification.responderBriefing}"</p>
                  </div>
                )}
             </div>

             <div className="w-full max-w-sm space-y-4 relative z-10">
               <button 
                 onClick={() => handleAccept(activeAlert._id)}
                 className="w-full py-6 bg-white text-bg-base font-black text-lg tracking-[0.2em] rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.4)] hover:scale-[1.03] active:scale-95 transition-all"
               >
                 ACCEPT DISPATCH
               </button>
               <button 
                 onClick={() => setActiveAlert(null)}
                 className="w-full py-4 bg-transparent border-2 border-white/30 text-white/70 font-black text-xs tracking-widest rounded-3xl uppercase hover:bg-white/5"
               >
                 Decline Command
               </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Profile Modal */}
      <AnimatePresence>
        {showProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center p-4"
          >
            <motion.div 
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="bg-bg-card w-full max-w-sm rounded-[2.5rem] border border-border-default overflow-hidden shadow-2xl"
            >
              <div className="p-8 space-y-8">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-text-primary uppercase tracking-tight">Responder Profile</h2>
                  <button onClick={() => setShowProfile(false)} className="w-10 h-10 bg-bg-elevated rounded-xl flex items-center justify-center text-text-tertiary">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-5 p-4 bg-bg-elevated rounded-3xl border border-border-default">
                    <div className="w-16 h-16 bg-accent-purple/10 rounded-2xl flex items-center justify-center text-accent-purple">
                      <User size={32} />
                    </div>
                    <div>
                      <p className="text-lg font-black text-text-primary">{user?.name}</p>
                      <p className="text-xs text-text-tertiary font-bold">{user?.agency} • {user?.responderType?.toUpperCase()}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-5 bg-bg-elevated rounded-3xl border border-border-default">
                      <p className="text-[10px] font-black uppercase text-text-tertiary tracking-widest mb-2">Reliability</p>
                      <div className="flex items-end gap-2">
                        <span className="text-2xl font-black text-text-primary">{(user?.reliabilityScore * 100).toFixed(0)}</span>
                        <span className="text-[10px] font-bold text-text-tertiary mb-1.5">%</span>
                      </div>
                    </div>
                    <div className="p-5 bg-bg-elevated rounded-3xl border border-border-default">
                      <p className="text-[10px] font-black uppercase text-text-tertiary tracking-widest mb-2">Deployments</p>
                      <span className="text-2xl font-black text-text-primary">{user?.totalResponses || 0}</span>
                    </div>
                  </div>

                  <div className="p-5 bg-bg-elevated rounded-3xl border border-border-default space-y-4">
                    <div className="flex justify-between items-center">
                      <p className="text-[10px] font-black uppercase text-text-tertiary tracking-widest">Live Telemetry</p>
                      <div className={`flex items-center gap-1 text-[10px] font-black ${available ? 'text-status-safe' : 'text-text-tertiary'}`}>
                        <Signal size={12} /> {available ? 'CONNECTED' : 'DISCONNECTED'}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-text-primary font-mono text-xs">
                          <Target size={14} className="text-accent-orange" /> {location.lat.toFixed(6)}
                        </div>
                        <div className="flex items-center gap-2 text-text-primary font-mono text-xs">
                          <Target size={14} className="text-accent-orange" /> {location.lng.toFixed(6)}
                        </div>
                      </div>
                      <button 
                        onClick={updateLocation}
                        className="p-4 bg-accent-orange/10 text-accent-orange rounded-2xl border border-accent-orange/20 hover:bg-accent-orange/20 transition-all"
                      >
                        <Navigation size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={() => setShowProfile(false)}
                  className="w-full py-5 bg-text-primary text-bg-base font-black text-sm tracking-[0.2em] uppercase rounded-3xl"
                >
                  Close Profile
                </button>
                <button 
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                  className="w-full py-4 mt-2 bg-white/5 text-text-tertiary font-black text-[10px] uppercase tracking-widest rounded-2xl border border-white/5 hover:bg-status-critical/10 hover:text-status-critical transition-all"
                >
                  Log Out of Fleet
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <MobileNav />
    </div>
  );
}
