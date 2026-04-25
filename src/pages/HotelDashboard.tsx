import { useState, useEffect } from 'react';
import { useAuth } from '../authContext';
import socket from '../socket';
import axios from 'axios';
import { motion, AnimatePresence } from 'motion/react';
import TacticalMap from '../components/TacticalMap';
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
    <div className="flex h-screen bg-bg-base">
      {/* Sidebar - Slim Bento Style */}
      <nav className="w-20 bg-bg-card border-r border-border-default flex flex-col items-center py-8 space-y-8">
        <div className="w-10 h-10 bg-accent-purple rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-accent-purple/20 cursor-pointer" onClick={() => setActiveTab('dashboard')}>CL</div>
        <div className="flex flex-col space-y-6">
          {[
            { id: 'dashboard', icon: Activity, active: activeTab === 'dashboard' },
            { id: 'alerts', icon: Bell, badge: stats.activeAlerts, active: activeTab === 'alerts' },
            { id: 'map', icon: Map, active: activeTab === 'map' },
            { id: 'responders', icon: Shield, active: activeTab === 'responders' },
            { id: 'files', icon: FileText, active: activeTab === 'files' },
            { id: 'settings', icon: Settings, active: activeTab === 'settings' }
          ].map((item, idx) => (
            <div key={idx} className="relative group cursor-pointer" onClick={() => item.id === 'settings' ? navigate('/hotel/settings') : setActiveTab(item.id)}>
              <div className={`p-3 rounded-xl transition-all ${
                item.active ? 'bg-bg-elevated text-accent-purple' : 'text-text-tertiary hover:bg-white/5 hover:text-text-secondary'
              }`}>
                <item.icon size={24} />
              </div>
              {item.badge ? (
                <span className="absolute -top-1 -right-1 bg-status-critical text-white text-[10px] px-1.5 py-0.5 rounded-full font-black min-w-[18px] text-center border-2 border-bg-card">
                  {item.badge}
                </span>
              ) : null}
            </div>
          ))}
        </div>
        <div className="mt-auto">
          <div className="w-10 h-10 rounded-full border-2 border-border-default bg-text-tertiary overflow-hidden"></div>
        </div>
      </nav>

      {/* Map View Takeover */}
      <AnimatePresence>
        {activeTab === 'map' && (
          <TacticalMap alerts={alerts} responders={responders} onClose={() => setActiveTab('dashboard')} />
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <main className="flex-1 p-8 overflow-y-auto bento-grid grid-rows-6 h-full">
        {/* Header Block */}
        <header className="col-span-12 row-span-1 flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
             <div className="w-px h-12 bg-border-default md:block hidden" />
             <div>
               <h1 className="text-2xl font-black text-text-primary">
                 {user?.hotelId?.name} <span className="text-accent-purple text-sm ml-2 px-2 py-0.5 bg-accent-purple/10 rounded font-mono">#{user?.hotelId?.hotelCode}</span>
               </h1>
               <div className="flex items-center gap-2">
                 <p className="text-text-secondary text-sm font-medium">BMS Operations Dashboard</p>
                 <span className="w-1 h-1 bg-text-tertiary rounded-full" />
                 <p className="text-[10px] text-text-tertiary font-black uppercase tracking-widest flex items-center gap-1">
                   <Clock size={10} /> Last Sync: {format(lastUpdate, 'HH:mm:ss')}
                 </p>
               </div>
             </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-bg-elevated rounded-full px-4 py-2 border border-text-tertiary/20">
              <span className="text-[10px] uppercase tracking-widest text-text-secondary mr-2 font-black">System Status:</span>
              <span className="flex items-center text-status-safe font-black text-[10px] uppercase animate-pulse">
                <span className="w-2 h-2 rounded-full bg-status-safe mr-2 shadow-[0_0_8px_var(--color-status-safe)]"></span> Monitoring
              </span>
            </div>
            <button 
              onClick={() => setShowBroadcast(true)}
              className="bg-accent-blue text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-accent-blue/20 flex items-center gap-2 hover:scale-[1.02] transition-transform"
            >
              <Zap size={18} />
              BROADCAST
            </button>
            <button 
              onClick={() => setShowRaiseEmergency(true)}
              className="bg-status-critical text-white px-6 py-2.5 rounded-xl font-black shadow-lg shadow-status-critical/20 flex items-center gap-2 hover:scale-[1.02] transition-transform"
            >
              <AlertTriangle size={18} />
              RAISE EMERGENCY
            </button>
          </div>
        </header>

        {/* Action/Metric Bento Blocks */}
        <div className="col-span-8 row-span-3 bento-card flex flex-col">
          <div className="bg-bg-card p-4 border-b border-border-default flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Target size={18} className="text-accent-purple" />
              <h2 className="font-black text-xs uppercase tracking-widest text-text-secondary">Incident Response Monitor</h2>
            </div>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-status-safe" />
               <span className="text-[10px] font-black text-text-tertiary uppercase">Feed Active</span>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {alerts.filter(a => a.status !== 'resolved').length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 p-12 text-center">
                <Shield size={64} className="mb-6 text-text-tertiary" />
                <p className="font-black text-xs uppercase tracking-[0.4em] text-text-tertiary">Grid monitoring: No active threats</p>
                <div className="mt-4 flex gap-2">
                   {Array.from({ length: 3 }).map((_, i) => <div key={i} className="w-1 h-1 bg-text-tertiary rounded-full animate-pulse" style={{ animationDelay: `${i * 200}ms` }} />)}
                </div>
              </div>
            ) : (
              alerts.filter(a => a.status !== 'resolved').map(alert => (
                <motion.div 
                  layoutId={alert._id}
                  key={alert._id} 
                  className="bg-bg-elevated/40 rounded-3xl border border-white/5 p-6 flex gap-6 hover:bg-bg-elevated/60 transition-all cursor-pointer group" 
                  onClick={() => setSelectedAlert(alert)}
                >
                  <div className="w-20 h-20 bg-bg-card rounded-2xl flex items-center justify-center text-4xl shrink-0 border border-white/5 shadow-inner relative">
                    {alert.type === 'fire' ? '🔥' : alert.type === 'medical' ? '🚑' : '👮'}
                    {alert.severity === 'critical' && (
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-status-critical rounded-full flex items-center justify-center text-white text-[10px] animate-bounce">!</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded uppercase ${
                            alert.severity === 'critical' ? 'bg-status-critical text-white' : 'bg-status-high text-white'
                          }`}>{alert.severity}</span>
                          <span className="text-[10px] font-mono text-text-tertiary uppercase tracking-widest">{format(new Date(alert.raisedAt), 'HH:mm:ss')}</span>
                        </div>
                        <h3 className="font-black text-white text-lg tracking-tight">Floor {alert.floor}, Room {alert.room}</h3>
                      </div>
                      <div className="text-right">
                         <div className={`text-[10px] font-black uppercase px-3 py-1 rounded-full border mb-1 ${
                           alert.status === 'on_scene' ? 'text-status-safe border-status-safe/20 bg-status-safe/5' : 'text-accent-orange border-accent-orange/20 bg-accent-orange/5'
                         }`}>
                           {alert.status.replace('_', ' ')}
                         </div>
                         {alert.smsConfirmationCount > 0 && (
                           <div className="mt-1 flex items-center justify-end gap-1 text-accent-blue font-black text-[9px] uppercase tracking-tighter">
                             <Zap size={10} className="fill-current" /> {alert.smsConfirmationCount} SMS Broadcasted
                           </div>
                         )}
                         <p className="text-[9px] text-text-tertiary font-bold uppercase">{alert.responderId ? 'Unit Active' : 'Dispatch Pending'}</p>
                      </div>
                    </div>
                    <div className="bg-bg-card/50 p-4 rounded-2xl border border-white/5 text-xs italic text-text-secondary mb-4 leading-relaxed">
                      "{alert.description}"
                    </div>
                    {alert.aiClassification && (
                      <div className="bg-accent-purple/5 p-4 rounded-2xl border border-accent-purple/10 flex gap-4">
                        <div className="bg-accent-purple text-white w-6 h-6 rounded-lg text-[10px] flex items-center justify-center font-black shrink-0 shadow-lg shadow-accent-purple/30">AI</div>
                        <p className="text-[11px] text-text-secondary leading-normal font-medium">{alert.aiClassification.summary}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 justify-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); socket.emit('start_conference', { alertId: alert._id, initiatorRole: user.role, initiatorName: user.name }); }}
                      className="p-3 bg-bg-card text-status-critical rounded-xl hover:bg-status-critical/10 transition-colors border border-status-critical/20"
                      title="Tactical 3-Way Bridge"
                    >
                      <Phone size={18} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); generateReport(alert._id); }} className="p-3 bg-bg-card text-text-secondary rounded-xl hover:text-accent-purple transition-colors border border-border-default"><FileText size={18} /></button>
                    <button className="p-3 bg-bg-card text-text-secondary rounded-xl hover:text-accent-blue transition-colors border border-border-default"><Settings size={18} /></button>
                  </div>
                </motion.div>
              ))
            )}
          </div>
          
          <div className="p-4 bg-bg-elevated border-t border-border-default flex space-x-3">
            <button className="flex-1 bg-accent-purple text-white py-2.5 rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-accent-purple/20 transition-all hover:brightness-110">Broadcast Protocol</button>
            <button className="flex-1 border border-border-default text-text-primary py-2.5 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-white/5">Emergency Chat</button>
          </div>
        </div>

        {/* Sidebar Stats Bento Grid */}
        <div className="col-span-4 row-span-1 bento-card p-4 flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1">Active Alerts</p>
            <p className="text-3xl font-black text-status-critical leading-none">{stats.activeAlerts.toString().padStart(2, '0')}</p>
          </div>
          <div className="w-12 h-12 bg-status-critical/10 rounded-xl flex items-center justify-center text-status-critical">
            <Bell size={24} />
          </div>
        </div>

        <div className="col-span-4 row-span-1 bento-card p-4 flex items-center justify-between">
          <div>
            <p className="text-text-secondary text-[10px] font-black uppercase tracking-widest mb-1">Unconfirmed Safe</p>
            <p className="text-3xl font-black text-status-high leading-none">{stats.unconfirmedSafe.toString().padStart(2, '0')}</p>
          </div>
          <div className="w-12 h-12 bg-status-high/10 rounded-xl flex items-center justify-center text-status-high">
            <AlertTriangle size={24} />
          </div>
        </div>

        <div className="col-span-4 row-span-3 bento-card p-6 flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-text-tertiary mb-6 border-b border-border-default pb-3">Floor Safety Tracking</h3>
          <div className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            {stats.unconfirmedSafe === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                 <CheckCircle2 size={32} className="mb-2 text-status-safe" />
                 <p className="text-[10px] font-bold uppercase tracking-widest">All zones clear</p>
              </div>
            ) : (
              alerts.filter(a => a.status === 'awaiting_safety_confirmation').map((a, i) => (
                <div key={i} className="flex items-center justify-between bg-bg-elevated/50 p-2 rounded-xl">
                  <span className="text-xs text-text-secondary font-bold">Room {a.room}</span>
                  <span className="text-[10px] font-black px-2 py-1 bg-status-critical/10 text-status-critical rounded uppercase animate-pulse">Unconfirmed</span>
                </div>
              ))
            )}
          </div>
          <div className="mt-6 pt-4 border-t border-border-default">
            <div className="flex justify-between text-[10px] font-black uppercase mb-2">
              <span className="text-text-tertiary">Safe Ratio</span>
              <span className="text-status-safe">100%</span>
            </div>
            <div className="w-full bg-bg-elevated h-2 rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `100%` }}
                className="bg-status-safe h-full"
              />
            </div>
          </div>
        </div>

        <div className="col-span-4 row-span-2 bento-card p-5 flex flex-col">
          <div className="flex justify-between items-center mb-5">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-tertiary">Unit Dispatch</h3>
            <span className="text-[10px] bg-status-safe/10 text-status-safe px-2 py-0.5 rounded font-black">Active: {responders.filter(r => r.available).length}</span>
          </div>
          <div className="space-y-3 overflow-y-auto custom-scrollbar flex-1">
             {responders.map((r, i) => (
               <div key={i} className={`flex items-center p-3 rounded-xl border transition-all ${
                 r.available ? 'bg-bg-elevated border-accent-purple/10' : 'bg-bg-elevated/40 border-transparent opacity-60'
               }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white shrink-0 ${
                    r.responderType === 'fire' ? 'bg-status-critical' : r.responderType === 'medical' ? 'bg-accent-blue' : 'bg-accent-orange'
                  }`}>
                    {r.responderType?.substring(0, 2).toUpperCase() || 'UN'}
                  </div>
                  <div className="ml-3 flex-1">
                     <p className="text-xs font-black text-white">{r.name}</p>
                     <p className="text-[8px] text-text-tertiary font-bold uppercase tracking-tighter mb-1">
                       {r.agency} • Score: {(r.reliabilityScore * 100).toFixed(0)}%
                       {r.eta && <span className="text-accent-orange ml-2 animate-pulse font-black">Approaching: {r.eta}</span>}
                     </p>
                     <a href={`tel:${r.phone}`} className="text-[8px] font-black text-accent-purple uppercase tracking-widest hover:underline">
                        Call Dispatch: {r.phone}
                     </a>
                  </div>
                  <div className={`text-[9px] font-black px-2 py-1 rounded-md ${
                    r.available ? 'text-status-safe border border-status-safe/20' : 'text-text-tertiary border border-border-default'
                  }`}>
                    {r.available ? 'ONLINE' : 'OFFLINE'}
                  </div>
               </div>
             ))}
          </div>
        </div>

        {/* Timeline Bento */}
        <div className="col-span-4 row-span-2 bento-card p-5 flex flex-col">
          <h3 className="text-xs font-black uppercase tracking-widest text-text-tertiary mb-5">Incident Feed</h3>
          <div className="space-y-4 flex-1 overflow-y-auto custom-scrollbar pr-2">
            {selectedAlert ? selectedAlert.events.map((e: any, idx: number) => (
              <div key={idx} className="flex gap-4">
                <div className="w-0.5 bg-bg-elevated relative shrink-0">
                  <div className="absolute top-0 -left-[3px] w-2 h-2 rounded-full bg-accent-purple shadow-[0_0_8px_var(--color-accent-purple)]"></div>
                </div>
                <div className="text-[10px]">
                  <p className="text-text-primary font-black uppercase mb-0.5">{format(new Date(e.time), 'HH:mm')} — {e.action}</p>
                  <p className="text-text-tertiary font-bold">{e.actor}</p>
                </div>
              </div>
            )) : (
              <p className="text-[10px] text-text-tertiary italic text-center py-4">Select an incident to view timeline</p>
            )}
          </div>
        </div>
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
