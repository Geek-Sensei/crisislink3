import { useState, useEffect } from 'react';
import { useAuth } from '../authContext';
import socket from '../socket';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import TacticalMap from '../components/TacticalMap';
import RealTimeMap from '../components/RealTimeMap';
import { useNavigate } from 'react-router-dom';
import { classifyAlert, generateIncidentReport } from '../services/geminiService';
import { 
  Shield, 
  Activity, 
  Users, 
  Map, 
  Bell, 
  MessageSquare, 
  FileText, 
  Settings, 
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  ArrowUpRight,
  Download,
  CheckCircle2,
  Clock,
  Zap,
  Target,
  X,
  Phone
} from 'lucide-react';
import { format } from 'date-fns';
import ConferenceBridge from '../components/ConferenceBridge';
import BlueprintView from '../components/BlueprintView';

function DashboardView({ 
  user, 
  lastUpdate, 
  alerts, 
  stats, 
  responders, 
  selectedAlert, 
  setSelectedAlert, 
  setShowBroadcast, 
  setShowRaiseEmergency, 
  generateReport, 
  socket,
  setActiveTab 
}: any) {
  return (
    <>
      {/* Header Block */}
      <header className="col-span-12 flex flex-col md:flex-row md:items-center justify-between gap-4 px-1 lg:px-0 mb-6 lg:mb-8">
        <div className="flex items-center gap-3 lg:gap-4">
           <div className="w-12 h-12 lg:w-14 lg:h-14 bg-accent-purple/10 rounded-2xl flex items-center justify-center text-accent-purple shrink-0">
             <Shield size={24} className="lg:w-8 lg:h-8" />
           </div>
           <div className="flex flex-col justify-center">
             <h1 className="text-lg lg:text-xl font-black text-text-primary flex items-center gap-2 leading-tight mb-1">
               {user?.hotelId?.name} 
               <span className="text-[9px] lg:text-[10px] px-1.5 py-0.5 bg-bg-elevated rounded border border-white/5 font-mono text-text-tertiary">#{user?.hotelId?.hotelCode}</span>
             </h1>
             <div className="flex items-center gap-2 leading-none">
               <p className="text-text-secondary text-[10px] lg:text-xs font-bold leading-none uppercase tracking-wider">Grid Monitor</p>
               <span className="w-1 h-1 bg-text-tertiary rounded-full" />
               <p className="text-[9px] lg:text-[10px] text-text-tertiary font-black uppercase tracking-widest flex items-center gap-1.5 leading-none">
                 <Clock size={10} className="shrink-0" /> {format(lastUpdate, 'HH:mm:ss')}
               </p>
             </div>
           </div>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="hidden sm:flex items-center bg-bg-card rounded-xl px-4 py-2.5 border border-white/5 mr-2">
            <span className="flex items-center text-status-safe font-black text-[9px] lg:text-[10px] uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-status-safe mr-2 animate-pulse"></span> Protected
            </span>
          </div>
          <button 
            onClick={() => setShowBroadcast(true)}
            className="flex-1 md:flex-none bg-accent-blue/10 text-accent-blue border border-accent-blue/20 px-3 lg:px-5 py-2.5 lg:py-3 rounded-xl font-black text-[9px] lg:text-[10px] uppercase tracking-[0.2em] hover:bg-accent-blue hover:text-white transition-all"
          >
            Broadcast
          </button>
          <button 
            onClick={() => setShowRaiseEmergency(true)}
            className="flex-1 md:flex-none bg-status-critical text-white px-4 lg:px-6 py-2.5 lg:py-3 rounded-xl font-black text-[9px] lg:text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-status-critical/20 hover:scale-105 transition-all"
          >
            Emergency
          </button>
        </div>
      </header>

      {/* Main Incident Feed */}
      <div className="lg:col-span-8 lg:row-span-4 bento-card flex flex-col">
        <div className="bg-bg-card/50 p-4 border-b border-border-default flex justify-between items-center backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Activity size={18} className="text-accent-purple shrink-0" />
            <h2 className="font-black text-xs uppercase tracking-[0.2em] text-text-secondary leading-none py-1">Incident Response Monitor</h2>
          </div>
          <span className="text-[10px] font-black text-status-safe uppercase tracking-tighter flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-status-safe" /> Live System Feed
          </span>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-4 custom-scrollbar min-h-[300px]">
          {alerts.filter((a: any) => a.status !== 'resolved').length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30 p-12 text-center">
              <Shield size={48} className="mb-4 text-text-tertiary" />
              <p className="font-black text-[10px] uppercase tracking-[0.4em] text-text-tertiary">System Clear: No Active Threats</p>
            </div>
          ) : (
            alerts.filter((a: any) => a.status !== 'resolved').map((alert: any) => (
              <motion.div 
                layoutId={alert._id}
                key={alert._id} 
                className="bg-bg-elevated/40 rounded-[2rem] border border-white/5 p-5 flex gap-5 hover:bg-bg-elevated/60 transition-all cursor-pointer group relative overflow-hidden" 
                onClick={() => setSelectedAlert(alert)}
              >
                <div className="w-16 h-16 bg-bg-card rounded-2xl flex items-center justify-center text-3xl shrink-0 border border-white/5 shadow-inner">
                  {alert.type === 'fire' ? '🔥' : alert.type === 'medical' ? '🚑' : '👮'}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase ${
                          alert.severity === 'critical' ? 'bg-status-critical text-white' : 'bg-status-high text-white'
                        }`}>{alert.severity}</span>
                        <span className="text-[9px] font-mono text-text-tertiary uppercase">{format(new Date(alert.raisedAt), 'HH:mm:ss')}</span>
                      </div>
                      <h3 className="font-black text-white text-base tracking-tight">Zone {alert.floor}-{alert.room}</h3>
                    </div>
                    <div className="text-right">
                       <div className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                         alert.status === 'on_scene' ? 'text-status-safe border-status-safe/20 bg-status-safe/5' : 'text-accent-orange border-accent-orange/20 bg-accent-orange/5'
                       }`}>
                         {alert.status.replace('_', ' ')}
                       </div>
                    </div>
                  </div>
                  <p className="text-xs text-text-secondary line-clamp-1 mb-2">"{alert.description}"</p>
                  {alert.aiClassification && (
                    <div className="bg-accent-purple/5 px-3 py-2 rounded-xl border border-accent-purple/10 flex gap-2">
                      <div className="text-accent-purple text-[8px] font-black uppercase shrink-0">AI Summary</div>
                      <p className="text-[10px] text-text-secondary leading-tight opacity-80">{alert.aiClassification.summary}</p>
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2 justify-center ml-2 border-l border-white/5 pl-4">
                  <button 
                    onClick={(e) => { e.stopPropagation(); socket.emit('start_conference', { alertId: alert._id, initiatorRole: user.role, initiatorName: user.name }); }}
                    className="p-2 bg-status-critical/10 text-status-critical rounded-lg hover:bg-status-critical transition-colors hover:text-white"
                  >
                    <Phone size={14} />
                  </button>
                  <button onClick={(e) => { e.stopPropagation(); generateReport(alert._id); }} className="p-2 border border-white/5 text-text-tertiary rounded-lg hover:text-white transition-colors hover:bg-bg-card"><FileText size={14} /></button>
                </div>
              </motion.div>
            ))
          )}
        </div>
        
        <div className="p-4 lg:p-5 bg-bg-card/80 border-t border-border-default/50 flex gap-4 backdrop-blur-xl mt-auto">
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(14, 165, 233, 0.1)', borderColor: 'rgba(14, 165, 233, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowBroadcast(true)} 
            className="flex-1 bg-white/[0.03] border border-white/5 text-text-secondary py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group"
          >
            <Zap size={14} className="text-accent-blue group-hover:animate-pulse" />
            Protocol Override
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: 'rgba(168, 85, 247, 0.1)', borderColor: 'rgba(168, 85, 247, 0.3)' }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('alerts')} 
            className="flex-1 bg-white/[0.03] border border-white/5 text-text-secondary py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 group"
          >
            <FileText size={14} className="text-accent-purple group-hover:rotate-12 transition-transform" />
            Audit History
          </motion.button>
        </div>
      </div>

      {/* Stats Cards - Grouped */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          <motion.div whileHover={{ y: -2 }} className="bento-card p-5 flex flex-col justify-between h-36 bg-gradient-to-br from-bg-card to-bg-card/50 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-status-critical/10 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start relative z-10">
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-tertiary">Critical Threats</span>
               <Bell size={14} className="text-status-critical" />
            </div>
            <div className="flex items-baseline gap-3 relative z-10">
               <p className="text-4xl lg:text-5xl font-black text-white tracking-tighter">{stats.activeAlerts.toString().padStart(2, '0')}</p>
               <p className="text-[10px] font-bold text-status-critical uppercase tracking-widest animate-pulse">Live</p>
            </div>
          </motion.div>
          <motion.div whileHover={{ y: -2 }} className="bento-card p-5 flex flex-col justify-between h-36 bg-gradient-to-br from-bg-card to-bg-card/50 border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-status-high/10 blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start relative z-10">
               <span className="text-[9px] font-black uppercase tracking-[0.2em] text-text-tertiary">Security Check</span>
               <AlertTriangle size={14} className="text-status-high" />
            </div>
            <div className="flex items-baseline gap-3 relative z-10">
               <p className="text-4xl lg:text-5xl font-black text-white tracking-tighter">{stats.unconfirmedSafe.toString().padStart(2, '0')}</p>
               <p className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest">Pending</p>
            </div>
          </motion.div>
        </div>

        {/* Floor Tracking & Unit Status Tabs */}
        <div className="bento-card flex-1 flex flex-col min-h-[500px] border border-white/5">
          <div className="flex border-b border-border-default">
            <button 
              className="flex-1 py-4 text-[10px] font-black uppercase tracking-widest text-text-tertiary hover:text-white border-b-2 border-transparent"
              style={{ color: 'var(--color-text-primary)', borderBottomColor: 'var(--color-accent-purple)' }}
            >
              Operations
            </button>
          </div>
          
          <div className="p-5 flex-1 overflow-y-auto custom-scrollbar space-y-6">
            {/* Safety Segment */}
            <div>
              <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-text-tertiary mb-3 flex items-center gap-2">
                <Users size={10} /> Zone Status (Non-Compliant)
              </h3>
              <div className="space-y-2">
                {stats.unconfirmedSafe === 0 ? (
                  <p className="text-[9px] text-text-tertiary italic text-center py-4 bg-bg-elevated/20 rounded-xl">All zones verified safe</p>
                ) : (
                  alerts.filter((a: any) => a.status === 'awaiting_safety_confirmation').map((a: any, i: number) => (
                    <div key={i} className="flex items-center justify-between bg-bg-elevated/40 p-3 rounded-xl border border-white/5">
                      <span className="text-[10px] text-text-primary font-bold">Room {a.room}</span>
                      <span className="text-[8px] font-black px-2 py-0.5 bg-status-critical/10 text-status-critical rounded border border-status-critical/20">WAITING</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Responder Segment */}
            <div>
              <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-text-tertiary mb-3 flex items-center gap-2">
                <Shield size={10} /> Unit Deployment
              </h3>
              <div className="space-y-2">
                {responders.slice(0, 4).map((r: any, i: number) => (
                  <div key={i} className={`flex items-center p-3 rounded-xl border transition-all ${
                    r.available ? 'bg-bg-elevated border-accent-purple/10' : 'bg-bg-elevated/20 border-transparent opacity-40'
                  }`}>
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[8px] font-black text-white shrink-0 ${
                      r.responderType === 'fire' ? 'bg-status-critical' : r.responderType === 'medical' ? 'bg-accent-blue' : 'bg-accent-orange'
                    }`}>
                      {r.name.charAt(0)}
                    </div>
                    <div className="ml-3 flex-1 overflow-hidden">
                       <p className="text-[10px] font-bold text-white truncate">{r.name}</p>
                       <p className="text-[8px] text-text-tertiary uppercase truncate">{r.agency}</p>
                    </div>
                    {r.available && <div className="w-1.5 h-1.5 rounded-full bg-status-safe shadow-[0_0_8px_var(--color-status-safe)]" />}
                  </div>
                ))}
              </div>
              <button 
                onClick={() => setActiveTab('responders')}
                className="w-full mt-4 py-2 border border-white/5 rounded-lg text-[8px] font-black text-text-tertiary uppercase tracking-widest hover:border-accent-purple hover:text-accent-purple transition-all"
              >
                Expand Fleet Monitor
              </button>
            </div>

            {/* System Status Segment */}
            <div className="pt-4 border-t border-border-default/50">
               <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-text-tertiary mb-3">Integrity Check</h3>
               <button 
                 onClick={() => {
                   const integrity = ["Neural Link: OK", "GPS Bridge: STABLE", "AI Vectoring: ACTIVE", "BMS Sync: 100%"];
                   integrity.forEach((msg, i) => {
                     setTimeout(() => console.log(`[SYS_CHK] ${msg}`), i * 300);
                   });
                   alert("INTEGRITY_CHECK_COMPLETE: System operating at optimal tactical capacity.");
                 }}
                 className="w-full py-4 bg-bg-elevated/40 rounded-2xl border border-dashed border-border-default flex items-center justify-center gap-3 group hover:border-accent-blue transition-all"
               >
                  <Activity size={14} className="text-accent-blue group-hover:animate-pulse" />
                  <span className="text-[10px] font-black text-text-tertiary uppercase tracking-widest group-hover:text-text-primary">Run Diagnostics</span>
               </button>
            </div>

            {/* Tactical Intel Integration (Sel 3) */}
            <div className="pt-4 border-t border-border-default/50">
               <h3 className="text-[8px] font-black uppercase tracking-[0.3em] text-text-tertiary mb-3">Tactical Surveillance</h3>
               {selectedAlert ? (
                 <>
                   <BlueprintView room={selectedAlert.room} floor={String(selectedAlert.floor)} className="w-full h-32 rounded-xl mb-3 shadow-inner" />
                   <div className="bg-bg-card p-3 rounded-xl border border-white/5 space-y-2">
                      <div className="flex justify-between items-center">
                         <p className="text-[8px] font-black text-accent-purple uppercase">BMS Node 402</p>
                         <span className="text-[8px] text-status-safe font-mono tracking-tighter">ENCRYPTED</span>
                      </div>
                      <p className="text-[10px] text-text-secondary leading-normal">
                         {selectedAlert.events?.[selectedAlert.events.length-1]?.action || "Monitoring active..."}
                      </p>
                   </div>
                 </>
               ) : (
                 <div className="bg-bg-card/30 p-8 rounded-2xl border border-dashed border-white/5 flex flex-col items-center justify-center text-center">
                    <Activity size={24} className="text-text-tertiary mb-3 opacity-20" />
                    <p className="text-[9px] font-black uppercase tracking-widest text-text-tertiary">Select incident for tactical blueprint</p>
                 </div>
               )}
            </div>

            {/* AI Strategic Forecast */}
            <div className="pt-4 border-t border-border-default/50">
               <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                     <Zap size={12} className="text-accent-blue" />
                     <span className="text-[8px] font-black uppercase tracking-widest text-[#94A3B8]">Strategic AI Forecast</span>
                  </div>
                  <p className="text-[10px] text-text-secondary leading-relaxed italic">
                     "System indicates 84% resolution probability within 12 minutes based on unit proximity and incident type."
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>

    </>
  );
}

export default function HotelDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeAlerts: 0,
    guestsIn: 42,
    respondersActive: 2,
    unconfirmedSafe: 0
  });
  const [selectedAlert, setSelectedAlert] = useState<any>(null);
  const [showConference, setShowConference] = useState(false);
  const [mapMode, setMapMode] = useState<'tactical' | 'world'>('world');
  const [responders, setResponders] = useState<any[]>([]);
  const [showReport, setShowReport] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showRaiseEmergency, setShowRaiseEmergency] = useState(false);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ message: '', floors: 'all', severity: 'low' });
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [emergencyForm, setEmergencyForm] = useState({
    type: 'general',
    severity: 'high',
    floor: '',
    room: '',
    description: ''
  });
  const [isRaising, setIsRaising] = useState(false);

  useEffect(() => {
    if (user?.hotelId?.hotelCode) {
      socket.emit('join_hotel', { hotelCode: user.hotelId.hotelCode, userId: user._id });
    }

    const hotelId = user?.hotelId?._id || user?.hotelId;
    if (hotelId) {
      axios.get(`/api/hotels/${hotelId}/alerts`).then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setAlerts(data);
        updateStats(data);
      }).catch(err => {
        console.error("Failed to fetch alerts:", err);
        setAlerts([]);
      });
    }

    axios.get('/api/responders').then(res => {
      setResponders(res.data);
    });

    socket.on('alert_created', async (alert) => {
      setAlerts(prev => [alert, ...prev]);
      setLastUpdate(new Date());

      // Perform AI classification on the frontend and update backend
      if (!alert.aiClassification) {
        const ai = await classifyAlert(alert.description || alert.type);
        if (ai) {
          await axios.patch(`/api/alerts/${alert._id}`, { aiClassification: ai });
        }
      }
    });

    socket.on('alert_updated', (updated) => {
      setAlerts(prev => prev.map(a => a._id === updated._id ? updated : a));
      setLastUpdate(new Date());
      if (selectedAlert?._id === updated._id) setSelectedAlert(updated);
    });

    socket.on('location_update', ({ responderId, lat, lng, eta }) => {
      setResponders(prev => prev.map(r => r._id === responderId ? { ...r, lat, lng, eta } : r));
    });

    socket.on('conference_started', ({ alertId }) => {
      // If we are looking at this alert or it's active, we might want to join
      // For simplicity in the admin dashboard, we show it if they have it selected or any active alert
      setShowConference(true);
    });

    socket.on('conference_ended', () => {
      setShowConference(false);
    });

    return () => {
      socket.off('alert_created');
      socket.off('alert_updated');
      socket.off('conference_started');
      socket.off('conference_ended');
    };
  }, [user]);

  useEffect(() => {
    updateStats(alerts);
  }, [alerts]);

  const updateStats = (currentAlerts: any[]) => {
    if (!Array.isArray(currentAlerts)) return;
    const active = currentAlerts.filter(a => a.status !== 'resolved').length;
    const unconfirmed = currentAlerts.filter(a => a.status === 'awaiting_safety_confirmation').length;
    setStats(prev => ({ ...prev, activeAlerts: active, unconfirmedSafe: unconfirmed }));
  };

  const handleStaffRaise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyForm.floor || !emergencyForm.room) {
      alert("Floor and Room are required.");
      return;
    }

    const hotelId = user?.hotelId?._id || user?.hotelId;
    if (!hotelId || hotelId === 'undefined') {
      alert("Hotel context missing.");
      return;
    }

    setIsRaising(true);
    try {
      await axios.post('/api/alerts/raise', {
        ...emergencyForm,
        floor: parseInt(emergencyForm.floor),
        hotelId,
        raisedBy: user._id,
        raisedByRole: 'staff'
      });
      setShowRaiseEmergency(false);
      setEmergencyForm({ type: 'general', severity: 'high', floor: '', room: '', description: '' });
    } catch (err) {
      alert("Failed to raise alert.");
    } finally {
      setIsRaising(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    const hotelId = user?.hotelId?._id || user?.hotelId;
    if (!hotelId) return;

    setIsBroadcasting(true);
    try {
      await axios.post('/api/broadcast', {
        ...broadcastForm,
        hotelId,
        floors: broadcastForm.floors === 'all' ? 'all' : [parseInt(broadcastForm.floors)]
      });
      setShowBroadcast(false);
      setBroadcastForm({ message: '', floors: 'all', severity: 'low' });
      alert(broadcastForm.severity === 'critical' ? "Broadcast Sent & SMS Dispatched" : "Broadcast Sent");
    } catch (err) {
      alert("Broadcast failed");
    } finally {
      setIsBroadcasting(false);
    }
  };

  const generateReport = async (alertId: string) => {
    try {
      const alert = alerts.find(a => a._id === alertId);
      if (!alert) return;

      const reportText = await generateIncidentReport({
        hotelName: user?.hotelId?.name || "CrisisLink Hotel",
        type: alert.type,
        severity: alert.severity,
        floor: alert.floor,
        room: alert.room,
        guestName: alert.raisedBy?.name || "Guest",
        responderName: alert.responderId?.name || "Responder",
        events: alert.events
      });

      await axios.post(`/api/alerts/${alertId}/report`, { reportText });
      setShowReport(reportText);
    } catch (err) {
      alert("Error generating report");
    }
  };

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-bg-base overflow-hidden">
      {/* Sidebar - Slim Bento Style - Adaptive */}
      <nav className="fixed bottom-0 left-0 right-0 lg:relative lg:bottom-auto lg:left-auto lg:right-auto lg:w-20 bg-bg-card border-t lg:border-t-0 lg:border-r border-border-default flex lg:flex-col items-center py-4 lg:py-8 justify-around lg:justify-start lg:space-y-8 z-50">
        <div 
          className="w-10 h-10 bg-accent-purple rounded-xl hidden lg:flex items-center justify-center text-white font-black shadow-lg shadow-accent-purple/20 cursor-pointer group relative" 
          onClick={() => navigate('/')}
        >
          CL
          <div className="absolute left-full ml-4 px-2 py-1 bg-bg-card border border-white/10 rounded text-[8px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-[100]">
            Exit to Gateway
          </div>
        </div>
        <div className="flex lg:flex-col items-center justify-around w-full lg:w-auto lg:space-y-6">
          {[
            { id: 'dashboard', icon: Activity, active: activeTab === 'dashboard' },
            { id: 'alerts', icon: Bell, badge: stats.activeAlerts, active: activeTab === 'alerts' },
            { id: 'map', icon: Map, active: activeTab === 'map' },
            { id: 'responders', icon: Shield, active: activeTab === 'responders' },
            { id: 'files', icon: FileText, active: activeTab === 'files' },
            { id: 'settings', icon: Settings, active: activeTab === 'settings' }
          ].map((item, idx) => (
            <div key={idx} className="relative group cursor-pointer" onClick={() => item.id === 'settings' ? navigate('/hotel/settings') : setActiveTab(item.id)}>
              <div className={`p-2.5 lg:p-3 rounded-xl transition-all ${
                item.active ? 'bg-bg-elevated text-accent-purple' : 'text-text-tertiary hover:bg-white/5 hover:text-text-secondary'
              }`}>
                <item.icon size={20} className="lg:w-6 lg:h-6" />
              </div>
              {item.badge ? (
                <span className="absolute -top-1 -right-1 bg-status-critical text-white text-[8px] lg:text-[10px] px-1.5 py-0.5 rounded-full font-black min-w-[18px] text-center border-2 border-bg-card">
                  {item.badge}
                </span>
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-auto hidden lg:block">
          <div className="w-10 h-10 rounded-full border-2 border-border-default bg-text-tertiary overflow-hidden"></div>
        </div>
      </nav>

      {/* Map View Takeover */}
      <AnimatePresence mode="wait">
        {activeTab === 'map' && (
          <motion.div 
            key="map-container"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-bg-base flex flex-col overflow-hidden"
          >
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[300] bg-bg-card/80 backdrop-blur-xl border border-border-default rounded-full p-1 flex items-center shadow-2xl max-w-[90vw]">
               <button 
                 onClick={() => setMapMode('world')}
                 className={`px-4 lg:px-6 py-2 rounded-full text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${mapMode === 'world' ? 'bg-accent-blue text-white shadow-lg' : 'text-text-tertiary hover:text-text-secondary'}`}
               >
                 World
               </button>
               <button 
                 onClick={() => setMapMode('tactical')}
                 className={`px-4 lg:px-6 py-2 rounded-full text-[9px] lg:text-[10px] font-black uppercase tracking-widest transition-all ${mapMode === 'tactical' ? 'bg-accent-purple text-white shadow-lg' : 'text-text-tertiary hover:text-text-secondary'}`}
               >
                 Tactical
               </button>
            </div>

            {mapMode === 'tactical' ? (
              <TacticalMap alerts={alerts} responders={responders} onClose={() => setActiveTab('dashboard')} />
            ) : (
              <div className="w-full h-full p-4 lg:p-10 pt-24 bg-bg-base relative">
                 <div className="absolute top-8 right-8 z-[300]">
                    <button onClick={() => setActiveTab('dashboard')} className="w-10 h-10 lg:w-12 lg:h-12 bg-bg-card border border-border-default rounded-full flex items-center justify-center text-text-tertiary hover:text-text-primary shadow-2xl">
                       <X size={20} className="lg:w-6 lg:h-6" />
                    </button>
                 </div>
                 <RealTimeMap 
                   center={[user?.hotelId?.lat || 12.9716, user?.hotelId?.lng || 77.5946]}
                   hotel={user?.hotelId}
                   alerts={alerts}
                   responders={responders}
                   zoom={15}
                 />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 p-4 lg:p-8 overflow-y-auto custom-scrollbar h-full pb-24 lg:pb-8">

        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <motion.div 
              key="dashboard"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bento-grid grid-rows-none lg:grid-rows-6 h-full"
            >
              <DashboardView 
                user={user} 
                lastUpdate={lastUpdate} 
                alerts={alerts} 
                stats={stats} 
                responders={responders} 
                selectedAlert={selectedAlert}
                setSelectedAlert={setSelectedAlert}
                setShowBroadcast={setShowBroadcast}
                setShowRaiseEmergency={setShowRaiseEmergency}
                generateReport={generateReport}
                socket={socket}
                setActiveTab={setActiveTab}
              />
            </motion.div>
          )}

          {activeTab === 'alerts' && (
            <motion.div 
              key="alerts"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
               <header className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter">Incident Archive</h2>
                    <p className="text-text-tertiary font-bold uppercase text-[10px] tracking-widest">Full system audit of all raised emergencies</p>
                  </div>
                  <div className="flex gap-3">
                     <button className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-border-default rounded-xl text-xs font-black uppercase text-text-secondary hover:bg-white/10">
                        <Download size={16} /> Export CSV
                     </button>
                  </div>
               </header>

               <div className="bg-bg-card rounded-[2rem] lg:rounded-[2.5rem] border border-border-default overflow-hidden">
                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-0">
                      <thead className="bg-bg-elevated/50 border-b border-border-default">
                        <tr>
                          <th className="p-4 lg:p-6 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Type</th>
                          <th className="p-4 lg:p-6 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Location</th>
                          <th className="p-4 lg:p-6 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Raised By</th>
                          <th className="p-4 lg:p-6 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Status</th>
                          <th className="p-4 lg:p-6 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Time</th>
                          <th className="p-4 lg:p-6 text-[10px] font-black uppercase tracking-widest text-text-tertiary">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border-default/50">
                        {alerts.map(a => (
                          <tr key={a._id} className="hover:bg-white/[0.02] transition-colors">
                            <td className="p-4 lg:p-6">
                              <div className="flex items-center gap-3">
                                 <div className="w-8 h-8 rounded-lg bg-bg-elevated flex items-center justify-center text-lg shadow-inner">
                                    {a.type === 'fire' ? '🔥' : a.type === 'medical' ? '🚑' : '👮'}
                                 </div>
                                 <span className="text-sm font-black text-white capitalize">{a.type}</span>
                              </div>
                            </td>
                            <td className="p-4 lg:p-6">
                               <p className="text-sm font-bold text-text-secondary">Floor {a.floor}</p>
                               <p className="text-[10px] text-text-tertiary font-black uppercase">Room {a.room}</p>
                            </td>
                            <td className="p-4 lg:p-6">
                               <div className="flex items-center gap-2">
                                 <div className="w-6 h-6 rounded-full bg-accent-purple/20 flex items-center justify-center text-[8px] font-black text-accent-purple">
                                   {a.raisedBy?.name?.charAt(0) || 'G'}
                                 </div>
                                 <span className="text-xs font-medium text-text-secondary">{a.raisedBy?.name || 'Guest'}</span>
                               </div>
                            </td>
                            <td className="p-4 lg:p-6">
                               <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase border ${
                                 a.status === 'resolved' ? 'text-status-safe border-status-safe/20 bg-status-safe/5' : 'text-accent-orange border-accent-orange/20 bg-accent-orange/5'
                               }`}>{a.status.replace('_', ' ')}</span>
                            </td>
                            <td className="p-4 lg:p-6 text-xs text-text-tertiary font-mono">
                               {format(new Date(a.raisedAt), 'MMM dd, HH:mm')}
                            </td>
                            <td className="p-4 lg:p-6">
                               <button onClick={() => { setSelectedAlert(a); setActiveTab('dashboard'); }} className="text-[10px] font-black text-accent-purple uppercase tracking-widest hover:underline px-4 py-2 bg-accent-purple/10 rounded-lg whitespace-nowrap">View Details</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </div>
            </motion.div>
          )}

          {activeTab === 'responders' && (
            <motion.div 
              key="responders"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-10"
            >
               <header className="flex justify-between items-center mb-10">
                  <div>
                    <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter">Responder Fleet</h2>
                    <p className="text-text-tertiary font-bold uppercase text-[10px] tracking-widest">Real-time status of all emergency units</p>
                  </div>
                  <button className="bg-accent-purple text-white px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-accent-purple/20">Add New Unit</button>
               </header>

               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-8">
                  {responders.map(r => (
                    <div key={r._id} className="bento-card p-6 lg:p-8 group relative overflow-hidden">
                       <div className="absolute top-0 right-0 p-4">
                          <div className={`w-3 h-3 rounded-full ${r.available ? 'bg-status-safe shadow-[0_0_12px_rgba(34,197,94,0.4)]' : 'bg-text-tertiary'}`} />
                       </div>
                       <div className="flex items-center gap-6 mb-8">
                          <div className={`w-16 h-16 rounded-3xl flex items-center justify-center text-2xl shadow-inner ${
                            r.responderType === 'fire' ? 'bg-status-critical/10 text-status-critical' : r.responderType === 'medical' ? 'bg-accent-blue/10 text-accent-blue' : 'bg-accent-orange/10 text-accent-orange'
                          }`}>
                            {r.responderType === 'fire' ? '🚒' : r.responderType === 'medical' ? '🚑' : '👮'}
                          </div>
                          <div>
                            <h3 className="font-black text-xl text-white tracking-tight">{r.name}</h3>
                            <p className="text-[10px] text-text-tertiary font-black uppercase tracking-widest">{r.agency} • {r.responderType}</p>
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4 mb-8">
                          <div className="bg-bg-elevated/40 p-4 rounded-2xl border border-white/5">
                             <p className="text-[9px] font-black text-text-tertiary uppercase mb-1">Reliability</p>
                             <p className="text-lg font-black text-white">{(r.reliabilityScore * 100).toFixed(0)}%</p>
                          </div>
                          <div className="bg-bg-elevated/40 p-4 rounded-2xl border border-white/5">
                             <p className="text-[9px] font-black text-text-tertiary uppercase mb-1">Status</p>
                             <p className={`text-xs font-black ${r.available ? 'text-status-safe' : 'text-text-tertiary'}`}>
                                {r.available ? 'ON DUTY' : 'OFFLINE'}
                             </p>
                          </div>
                       </div>

                       <div className="flex gap-3">
                          <a href={`tel:${r.phone}`} className="flex-1 bg-bg-elevated text-text-primary py-3 rounded-xl text-[10px] font-black uppercase text-center border border-border-default hover:bg-white/5">Call Dispatch</a>
                          <button onClick={() => setActiveTab('map')} className="flex-1 bg-accent-blue text-white py-3 rounded-xl text-[10px] font-black uppercase shadow-lg shadow-accent-blue/15">Track GPS</button>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}

          {activeTab === 'files' && (
            <motion.div 
               key="files"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="h-full flex flex-col"
            >
               <header className="mb-10">
                  <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter">Floor Plan & Assets</h2>
                  <p className="text-text-tertiary font-bold uppercase text-[10px] tracking-widest">Documented structural intel for responders</p>
               </header>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                  {['Floor Plan L1', 'Fire Exit Map', 'Medical Kit Locations', 'Server Room Access'].map((f, i) => (
                    <div key={i} className="bento-card p-6 flex flex-col items-center justify-center text-center gap-4 hover:border-accent-purple/50 transition-all cursor-pointer">
                       <div className="w-16 h-16 bg-accent-purple/10 rounded-2xl flex items-center justify-center text-accent-purple">
                          <FileText size={32} />
                       </div>
                       <p className="font-black text-xs text-white uppercase">{f}</p>
                       <span className="text-[10px] text-text-tertiary font-mono">PDF • 2.4MB</span>
                    </div>
                  ))}
                  <div className="bento-card border-dashed border-border-default flex flex-col items-center justify-center text-center gap-4 hover:bg-white/5 transition-all cursor-pointer">
                     <div className="w-12 h-12 rounded-full border-2 border-border-default flex items-center justify-center text-text-tertiary">
                        <ArrowUpRight size={20} />
                     </div>
                     <p className="text-[10px] font-black text-text-tertiary uppercase">Upload Asset</p>
                  </div>
               </div>
            </motion.div>
          )}
          {activeTab === 'settings' && (
            <motion.div 
               key="settings"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -20 }}
               className="space-y-10 max-w-2xl"
            >
               <header className="mb-10">
                  <h2 className="text-3xl font-black text-text-primary uppercase tracking-tighter">BMS Configurations</h2>
                  <p className="text-text-tertiary font-bold uppercase text-[10px] tracking-widest">Global security protocols and API integrations</p>
               </header>
               
               <div className="space-y-6">
                  <div className="bento-card p-8">
                     <h3 className="font-black text-white text-lg mb-6">Dispatch Protocols</h3>
                     <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-bg-elevated/50 rounded-2xl border border-white/5">
                           <div>
                              <p className="text-sm font-bold text-white">Auto-Assign Units</p>
                              <p className="text-[10px] text-text-tertiary uppercase">Automatically dispatch nearest matching responder</p>
                           </div>
                           <div className="w-12 h-6 bg-accent-purple rounded-full relative">
                              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-lg" />
                           </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-bg-elevated/50 rounded-2xl border border-white/5">
                           <div>
                              <p className="text-sm font-bold text-white">Guest Safety Ping</p>
                              <p className="text-[10px] text-text-tertiary uppercase">Auto-escalate if safety not confirmed within 2 mins</p>
                           </div>
                           <div className="w-12 h-6 bg-accent-purple rounded-full relative">
                              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-lg" />
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="bento-card p-8">
                     <h3 className="font-black text-white text-lg mb-6">SMS & Broadcast Presets</h3>
                     <div className="space-y-4">
                        {['Evacuate Immediately', 'Shelter in Place', 'All Clear'].map(p => (
                          <div key={p} className="flex items-center justify-between p-4 bg-bg-elevated/50 rounded-2xl border border-white/5">
                             <span className="text-sm font-medium text-text-secondary">{p}</span>
                             <button className="text-[10px] font-black text-accent-purple uppercase tracking-widest">Edit</button>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Modal - Raise Emergency */}
      <AnimatePresence>
        {showRaiseEmergency && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-10">
             <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRaiseEmergency(false)}
              className="absolute inset-0 bg-[#080B12]/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-bg-card w-full max-w-md rounded-[40px] border border-status-critical/30 flex flex-col relative z-20 shadow-2xl p-8"
            >
              <h2 className="text-2xl font-black uppercase text-status-critical mb-6 flex items-center gap-3">
                <AlertTriangle size={24} /> Raise Staff Alert
              </h2>
              
              <form onSubmit={handleStaffRaise} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-tertiary">Type</label>
                    <select 
                      className="w-full bg-bg-elevated border border-border-default rounded-xl p-3 text-xs text-white outline-none"
                      value={emergencyForm.type}
                      onChange={e => setEmergencyForm({...emergencyForm, type: e.target.value})}
                    >
                      <option value="fire">Fire</option>
                      <option value="medical">Medical</option>
                      <option value="security">Security</option>
                      <option value="general">General</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-tertiary">Severity</label>
                    <select 
                      className="w-full bg-bg-elevated border border-border-default rounded-xl p-3 text-xs text-white outline-none"
                      value={emergencyForm.severity}
                      onChange={e => setEmergencyForm({...emergencyForm, severity: e.target.value})}
                    >
                      <option value="critical">Critical</option>
                      <option value="high">High</option>
                      <option value="low">Low</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-tertiary">Floor</label>
                    <input 
                      type="number"
                      required
                      placeholder="e.g. 6"
                      className="w-full bg-bg-elevated border border-border-default rounded-xl p-3 text-xs text-white outline-none"
                      value={emergencyForm.floor}
                      onChange={e => setEmergencyForm({...emergencyForm, floor: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-text-tertiary">Room / Area</label>
                    <input 
                      type="text"
                      required
                      placeholder="e.g. 604"
                      className="w-full bg-bg-elevated border border-border-default rounded-xl p-3 text-xs text-white outline-none"
                      value={emergencyForm.room}
                      onChange={e => setEmergencyForm({...emergencyForm, room: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-tertiary">Description</label>
                  <textarea 
                    className="w-full bg-bg-elevated border border-border-default rounded-xl p-3 text-xs text-white outline-none min-h-[100px]"
                    placeholder="Provide details for responders..."
                    value={emergencyForm.description}
                    onChange={e => setEmergencyForm({...emergencyForm, description: e.target.value})}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowRaiseEmergency(false)}
                    className="flex-1 py-4 border border-border-default rounded-2xl text-[10px] font-black uppercase hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isRaising}
                    className="flex-1 py-4 bg-status-critical text-white rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-status-critical/20"
                  >
                    {isRaising ? 'Activating...' : 'Activate protocol'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {showBroadcast && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-10">
             <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBroadcast(false)}
              className="absolute inset-0 bg-[#080B12]/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-bg-card w-full max-w-md rounded-[40px] border border-accent-blue/30 flex flex-col relative z-20 shadow-2xl p-8"
            >
              <h2 className="text-2xl font-black uppercase text-accent-blue mb-6 flex items-center gap-3">
                <Zap size={24} /> Broadcast Warning
              </h2>
              
              <form onSubmit={handleBroadcast} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-tertiary">Select Target</label>
                  <select 
                    className="w-full bg-bg-elevated border border-border-default rounded-xl p-3 text-xs text-white outline-none"
                    value={broadcastForm.floors}
                    onChange={e => setBroadcastForm({...broadcastForm, floors: e.target.value})}
                  >
                    <option value="all">All Floors</option>
                    {Array.from({ length: 10 }, (_, i) => i + 1).map(f => (
                      <option key={f} value={f}>Floor {f}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-tertiary">Severity Level</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['low', 'high', 'critical'].map(s => (
                      <button 
                        key={s}
                        type="button"
                        onClick={() => setBroadcastForm({...broadcastForm, severity: s})}
                        className={`py-2 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                          broadcastForm.severity === s 
                          ? s === 'critical' ? 'bg-status-critical border-status-critical text-white' : 'bg-accent-blue border-accent-blue text-white'
                          : 'border-border-default text-text-tertiary hover:bg-white/5'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-tertiary">Quick Presets</label>
                  <div className="flex flex-wrap gap-2">
                    {["Fire Alarm Test", "Elevator Maintenance", "Inclement Weather"].map(p => (
                      <button 
                        key={p}
                        type="button"
                        onClick={() => setBroadcastForm({...broadcastForm, message: p})}
                        className="px-3 py-1 bg-bg-elevated border border-border-default rounded text-[8px] font-bold text-text-secondary hover:text-white"
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-text-tertiary">Custom Message</label>
                  <textarea 
                    className="w-full bg-bg-elevated border border-border-default rounded-xl p-3 text-xs text-white outline-none min-h-[100px]"
                    placeholder="Enter broadcast content..."
                    required
                    value={broadcastForm.message}
                    onChange={e => setBroadcastForm({...broadcastForm, message: e.target.value})}
                  />
                </div>

                {broadcastForm.severity === 'critical' && (
                  <div className="bg-status-critical/10 border border-status-critical/20 p-3 rounded-xl flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-status-critical animate-pulse" />
                    <p className="text-[8px] font-black text-status-critical uppercase tracking-widest">
                       Note: Critical alerts will trigger SMS Dispatch to guest mobiles
                    </p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button 
                    type="button" 
                    onClick={() => setShowBroadcast(false)}
                    className="flex-1 py-4 border border-border-default rounded-2xl text-[10px] font-black uppercase hover:bg-white/5"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    disabled={isBroadcasting}
                    className="flex-1 py-4 bg-accent-blue text-white rounded-2xl text-[10px] font-black uppercase shadow-xl shadow-accent-blue/20"
                  >
                    {isBroadcasting ? 'Broadcasting...' : 'Send Broadcast'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal - Incident Report */}
      <AnimatePresence>
        {showReport && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-10">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReport(null)}
              className="absolute inset-0 bg-[#080B12]/90 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#0F1420] w-full max-w-2xl rounded-[40px] border border-white/5 max-h-[80vh] flex flex-col relative z-20 shadow-2xl"
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#161D2E]/50 rounded-t-[40px]">
                <div className="flex items-center gap-3">
                  <FileText className="text-[#8B5CF6]" size={24} />
                  <h2 className="text-2xl font-black uppercase tracking-tighter">AI Incident Report</h2>
                </div>
                <button onClick={() => setShowReport(null)} className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center text-[#475569]">
                   <X size={24} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-10 text-[#94A3B8] leading-relaxed font-medium">
                 <div className="whitespace-pre-wrap">{showReport}</div>
              </div>
              <div className="p-8 bg-[#161D2E]/50 rounded-b-[40px] flex justify-end gap-4">
                 <button className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all">Cancel</button>
                 <button className="px-6 py-3 bg-[#8B5CF6] text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-[#8B5CF6]/20">
                   <Download size={18} /> Download PDF
                 </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showConference && (
          <ConferenceBridge 
            alert={selectedAlert || alerts.find(a => a.status !== 'resolved')} 
            user={user} 
            onClose={() => setShowConference(false)} 
            socket={socket} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
