import { useState, useEffect } from 'react';
import { useAuth } from '../authContext';
import axios from 'axios';
import { motion } from 'motion/react';
import { Shield, ChevronLeft, AlertCircle, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import RealTimeMap from '../components/RealTimeMap';
import MobileNav from '../components/MobileNav';

export default function ResponderMap() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [responders, setResponders] = useState<any[]>([]);
  const [selectedAlertId, setSelectedAlertId] = useState<string | null>(null);
  const [selectedResponderId, setSelectedResponderId] = useState<string | null>(null);
  const [showAlerts, setShowAlerts] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [alertsRes, respondersRes] = await Promise.all([
          axios.get('/api/alerts/active'),
          axios.get('/api/responders')
        ]);
        setAlerts(alertsRes.data);
        setResponders(respondersRes.data);
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  const selectedAlert = alerts.find(a => a._id === selectedAlertId);
  const selectedResponder = responders.find(r => r._id === selectedResponderId);

  return (
    <div className="h-screen flex flex-col bg-bg-base overflow-hidden pb-20">
      <header className="p-4 bg-bg-card border-b border-border-default flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/responder/home')} className="w-10 h-10 flex items-center justify-center text-text-tertiary">
            <ChevronLeft size={24} />
          </button>
          <div>
            <h1 className="text-sm font-black text-text-primary uppercase tracking-widest">Situational Map</h1>
            <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest leading-none mt-0.5">Tactical Awareness View</p>
          </div>
        </div>
        <div className="w-10 h-10 bg-accent-orange/10 rounded-xl flex items-center justify-center text-accent-orange border border-accent-orange/20">
          <Shield size={20} />
        </div>
      </header>

      <div className="flex-1 relative">
        <RealTimeMap 
          center={[user?.lat || 12.9716, user?.lng || 77.5946]}
          hotel={null} 
          alerts={showAlerts ? alerts : []}
          responders={responders}
          zoom={13}
          routingTo={selectedAlert?.hotelId ? [selectedAlert.hotelId.lat, selectedAlert.hotelId.lng] : null}
          onMarkerClick={(id, type) => {
            if (type === 'alert') setSelectedAlertId(id);
            if (type === 'responder') setSelectedResponderId(id);
          }}
        />

        {/* Legend Overlay */}
        <div className="absolute top-6 right-6 z-[400] flex flex-col gap-2">
           <button 
             onClick={() => setShowAlerts(!showAlerts)}
             className={`bg-bg-card/80 backdrop-blur-md p-3 rounded-2xl border shadow-xl flex items-center gap-3 transition-colors ${showAlerts ? 'border-status-critical' : 'border-border-default opacity-50'}`}
           >
              <div className={`w-3 h-3 rounded-full ${showAlerts ? 'bg-status-critical animate-pulse' : 'bg-text-tertiary'}`} />
              <span className="text-[10px] font-black uppercase text-white tracking-widest">
                {showAlerts ? 'Showing Incidents' : 'Incidents Hidden'}
              </span>
           </button>
           <div className="bg-bg-card/80 backdrop-blur-md p-3 rounded-2xl border border-border-default shadow-xl flex items-center gap-3">
              <div className="w-3 h-3 bg-accent-blue rounded-full" />
              <span className="text-[10px] font-black uppercase text-white tracking-widest">Unit Position</span>
           </div>
        </div>

        {/* Bottom Panel (Alerts/Responders) */}
        <div className="absolute bottom-10 left-6 right-6 z-[400] overflow-x-auto pb-4 scrollbar-none flex gap-4">
           {selectedResponder && (
             <motion.div 
               initial={{ y: 20, opacity: 0 }}
               animate={{ y: 0, opacity: 1 }}
               className="bg-bg-card border-accent-blue border p-4 rounded-2xl shrink-0 w-64 shadow-2xl relative"
             >
                <button 
                  onClick={() => setSelectedResponderId(null)}
                  className="absolute top-2 right-2 text-text-tertiary"
                >
                  <MapPin size={14} />
                </button>
                <div className="flex items-center gap-3 mb-2">
                   <div className="w-8 h-8 bg-accent-blue/10 rounded-lg flex items-center justify-center text-accent-blue">
                      <Shield size={18} />
                   </div>
                   <h4 className="text-xs font-black text-text-primary capitalize">{selectedResponder.name}</h4>
                </div>
                <p className="text-[10px] text-text-tertiary font-bold mb-1 uppercase tracking-tight">{selectedResponder.responderType} Unit</p>
                <div className="flex items-center justify-between">
                   <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">
                     {selectedResponder.status || 'Active'} • {selectedResponder.lat?.toFixed(4)}, {selectedResponder.lng?.toFixed(4)}
                   </span>
                </div>
             </motion.div>
           )}

           {alerts.filter(a => a.status === 'open' && showAlerts).map(alert => (
              <motion.div 
                key={alert._id}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedAlertId(alert._id === selectedAlertId ? null : alert._id)}
                className={`bg-bg-card border p-4 rounded-2xl shrink-0 w-64 shadow-2xl cursor-pointer transition-all ${alert._id === selectedAlertId ? 'border-accent-blue ring-2 ring-accent-blue/20' : 'border-status-critical/30 hover:border-status-critical'}`}
              >
                 <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-status-critical/10 rounded-lg flex items-center justify-center text-status-critical">
                       <AlertCircle size={18} />
                    </div>
                    <h4 className="text-xs font-black text-text-primary capitalize">{alert.type} Emergency</h4>
                 </div>
                 <p className="text-[10px] text-text-tertiary font-bold mb-1 uppercase tracking-tight">{alert.hotelId?.name}</p>
                 <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Floor {alert.floor} • R{alert.room}</span>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/responder/alert/${alert._id}`);
                      }}
                      className="text-[9px] font-black text-status-critical uppercase tracking-widest underline"
                    >
                      Respond
                    </button>
                 </div>
              </motion.div>
           ))}
           {alerts.filter(a => a.status === 'open').length === 0 && (
              <div className="bg-bg-card/80 backdrop-blur-md p-4 rounded-2xl border border-border-default text-center w-full">
                 <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest">No unassigned dispatches in sector</p>
              </div>
           )}
        </div>
      </div>
      <MobileNav />
    </div>
  );
}
