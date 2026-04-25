import React, { useState } from 'react';
import { 
  TransformWrapper, 
  TransformComponent, 
  useControls 
} from 'react-zoom-pan-pinch';
import { 
  Search, 
  Plus, 
  Minus, 
  RotateCcw, 
  Maximize, 
  MapPin, 
  Shield,
  Layers,
  ChevronDown,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Alert {
  _id: string;
  floor: number;
  room: string;
  type: string;
  severity: string;
  status: string;
}

interface Responder {
  _id: string;
  name: string;
  responderType: string;
  lat?: number;
  lng?: number;
  eta?: string;
}

interface TacticalMapProps {
  alerts: Alert[];
  responders: Responder[];
  onClose: () => void;
}

const MapControls = () => {
  const { zoomIn, zoomOut, resetTransform } = useControls();

  return (
    <div className="absolute bottom-10 right-10 z-50 flex flex-col gap-2">
      <button 
        onClick={() => zoomIn()}
        className="w-12 h-12 bg-bg-card border border-border-default rounded-xl flex items-center justify-center text-text-primary hover:bg-bg-elevated transition-colors shadow-2xl"
      >
        <Plus size={20} />
      </button>
      <button 
        onClick={() => zoomOut()}
        className="w-12 h-12 bg-bg-card border border-border-default rounded-xl flex items-center justify-center text-text-primary hover:bg-bg-elevated transition-colors shadow-2xl"
      >
        <Minus size={20} />
      </button>
      <button 
        onClick={() => resetTransform()}
        className="w-12 h-12 bg-bg-card border border-border-default rounded-xl flex items-center justify-center text-text-primary hover:bg-bg-elevated transition-colors shadow-2xl"
      >
        <RotateCcw size={20} />
      </button>
    </div>
  );
};

export default function TacticalMap({ alerts, responders, onClose }: TacticalMapProps) {
  const [selectedFloor, setSelectedFloor] = useState(6);
  const [activeLayers, setActiveLayers] = useState(['alerts', 'responders', 'occupancy']);

  const floorAlerts = alerts.filter(a => a.floor === selectedFloor && a.status !== 'resolved');

  // Map lat/lng responder simulation to SVG coordinate space
  // This is a simplified projection for the prototype demonstration
  const getResponderPos = (r: Responder) => {
    if (!r.lat || !r.lng) return null;
    
    // Demo logic: map lat/lng simulation range to map space
    // Standard simulation in responderService.ts moves from ~+0.02 to 0.0
    // We treat "0.0" as the hotel center (500, 375)
    
    // We'll need access to hotel coords to do real math, 
    // but for demo we can assume the simulation is relative
    // In our seed, hotel is at 12.9716, 77.5946
    const hotelLat = 12.9716;
    const hotelLng = 77.5946;

    const latDiff = r.lat - hotelLat;
    const lngDiff = r.lng - hotelLng;

    // Scale: 0.02 diff = 300 units
    const x = 500 + (lngDiff / 0.02 * 400); 
    const y = 375 - (latDiff / 0.02 * 300);

    return { x, y };
  };

  return (
    <div className="fixed inset-0 z-[200] bg-bg-base flex flex-col overflow-hidden">
      {/* Tactical Header */}
      <header className="h-20 bg-bg-card border-b border-border-default flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-6">
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-bg-elevated flex items-center justify-center text-text-secondary hover:text-text-primary transition-colors"
          >
            <Maximize size={20} className="rotate-45" />
          </button>
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight text-text-primary">Tactical Floor Intelligence</h2>
            <p className="text-[10px] font-black text-text-tertiary uppercase tracking-[0.2em]">Live Situational Awareness • Floor Level {selectedFloor}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-bg-elevated p-1 rounded-xl border border-border-default">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(f => (
              <button 
                key={f}
                onClick={() => setSelectedFloor(f)}
                className={`w-10 h-10 rounded-lg text-xs font-black transition-all ${
                  selectedFloor === f ? 'bg-accent-purple text-white shadow-lg' : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                F{f}
              </button>
            ))}
          </div>
          <div className="h-10 w-px bg-border-default mx-2" />
          <button className="flex items-center gap-2 px-4 py-2 bg-status-critical text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-status-critical/20">
            <MapPin size={16} /> Deploy Unit
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Control Bar */}
        <aside className="w-80 border-r border-border-default bg-bg-card p-6 overflow-y-auto space-y-8">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-text-tertiary flex items-center gap-2">
              <Layers size={14} /> Active Data Layers
            </h3>
            <div className="space-y-2">
              {[
                { id: 'alerts', label: 'Active Alerts', color: 'bg-status-critical' },
                { id: 'responders', label: 'Unit Locations', color: 'bg-accent-orange' },
                { id: 'occupancy', label: 'Room Occupancy', color: 'bg-accent-blue' },
                { id: 'hazards', label: 'Infrastructure Hazards', color: 'bg-status-high' }
              ].map(layer => (
                <button 
                  key={layer.id}
                  onClick={() => setActiveLayers(prev => prev.includes(layer.id) ? prev.filter(l => l !== layer.id) : [...prev, layer.id])}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                    activeLayers.includes(layer.id) ? 'bg-bg-elevated border-border-default' : 'bg-transparent border-transparent opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${layer.color}`} />
                    <span className="text-[11px] font-black uppercase text-text-primary tracking-tight">{layer.label}</span>
                  </div>
                  <div className={`w-8 h-4 rounded-full relative transition-colors ${activeLayers.includes(layer.id) ? 'bg-accent-purple' : 'bg-text-tertiary'}`}>
                    <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${activeLayers.includes(layer.id) ? 'left-4.5' : 'left-0.5'}`} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-6 border-t border-border-default space-y-4">
             <h3 className="text-xs font-black uppercase tracking-widest text-text-tertiary">Incident Summary</h3>
             {floorAlerts.length === 0 ? (
               <div className="p-4 bg-bg-elevated/50 rounded-2xl border border-border-default text-center">
                 <p className="text-[10px] text-text-tertiary font-bold">No active floor incidents</p>
               </div>
             ) : (
               floorAlerts.map(alert => (
                 <div key={alert._id} className="p-4 bg-status-critical/5 border border-status-critical/20 rounded-2xl space-y-2">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black uppercase text-status-critical">Room {alert.room}</span>
                       <span className="text-[9px] font-mono text-text-tertiary uppercase">Critical</span>
                    </div>
                    <p className="text-[11px] text-text-secondary font-bold leading-tight">{alert.type} protocol activated</p>
                 </div>
               ))
             )}
          </div>

          <div className="bg-accent-blue/5 p-4 rounded-2xl border border-accent-blue/20">
             <div className="flex items-center gap-2 mb-2">
               <Info size={14} className="text-accent-blue" />
               <span className="text-[10px] font-black uppercase text-accent-blue">Map Intelligence</span>
             </div>
             <p className="text-[10px] text-text-tertiary leading-relaxed">
               Pinch to zoom, drag to pan. Blue dots represent occupied rooms. Red pulses indicate active emergency markers.
             </p>
          </div>
        </aside>

        {/* Map Viewport */}
        <div className="flex-1 bg-bg-base relative overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#161D2E 2px, transparent 2px)', backgroundSize: '40px 40px' }} />
          
          <TransformWrapper
            initialScale={1}
            initialPositionX={0}
            initialPositionY={0}
            centerOnInit
          >
            {({ zoomIn, zoomOut, resetTransform, ...rest }) => (
              <>
                <MapControls />
                <TransformComponent wrapperClass="!w-full !h-full cursor-grab active:cursor-grabbing" contentClass="!w-full !h-full flex items-center justify-center">
                  <div className="relative w-[1000px] h-[750px] bg-bg-card rounded-[3rem] border border-border-default overflow-hidden shadow-2xl">
                    {/* Tactical Blueprint Image (SVG Implementation) */}
                    <svg viewBox="0 0 1000 750" className="absolute inset-0 w-full h-full opacity-40 pointer-events-none">
                      <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-white/5" />
                      </pattern>
                      <rect width="100%" height="100%" fill="url(#grid)" />
                      
                      {/* Outer Walls */}
                      <rect x="50" y="50" width="900" height="650" fill="none" stroke="currentColor" strokeWidth="4" className="text-accent-purple/30" rx="40" />
                      
                      {/* Corridors */}
                      <rect x="200" y="50" width="100" height="650" fill="currentColor" className="text-white/5" />
                      <rect x="700" y="50" width="100" height="650" fill="currentColor" className="text-white/5" />
                      <rect x="50" y="350" width="900" height="50" fill="currentColor" className="text-white/5" />

                      {/* Rooms */}
                      {Array.from({ length: 12 }).map((_, i) => {
                        const x = (i % 4) * 225 + 75;
                        const y = Math.floor(i / 4) * 225 + 75;
                        return (
                          <g key={i}>
                            <rect x={x} y={y} width="150" height="150" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/10" rx="10" />
                            <text x={x + 75} y={y + 85} textAnchor="middle" className="fill-text-tertiary text-[12px] font-mono uppercase">Zone {i + 1}</text>
                          </g>
                        );
                      })}
                    </svg>

                    {/* Scan line effect */}
                    <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-accent-purple/20 to-transparent animate-scan z-0 pointer-events-none" />

                    {/* Floor Label Overlay */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[240px] font-black text-white/[0.03] tracking-tighter pointer-events-none select-none">
                      LVL 0{selectedFloor}
                    </div>

                    {/* Responder Unit Markers (Vehicle effect) */}
                    {activeLayers.includes('responders') && responders.map(res => {
                      const pos = getResponderPos(res);
                      if (!pos) return null;

                      return (
                        <motion.div 
                          key={res._id}
                          layout
                          transition={{ type: "spring", stiffness: 50, damping: 20 }}
                          className="absolute w-12 h-12 flex flex-col items-center justify-center -translate-x-1/2 -translate-y-1/2 z-40"
                          style={{ left: pos.x, top: pos.y }}
                        >
                           <div className="absolute inset-0 bg-accent-orange rounded-full blur-xl opacity-30"></div>
                           <div className="relative w-10 h-10 bg-accent-orange rounded-2xl border-2 border-bg-base shadow-xl flex items-center justify-center text-white">
                              <Shield size={18} className="fill-white/10" />
                           </div>
                           <div className="absolute -bottom-6 bg-accent-orange text-white px-2 py-0.5 rounded text-[8px] font-black tracking-widest whitespace-nowrap shadow-lg border border-white/10 uppercase">
                              {res.name.split(' ')[0]} {res.eta ? `• ${res.eta}` : ''}
                           </div>
                        </motion.div>
                      );
                    })}

                    {/* Active Alert Markers */}
                    {floorAlerts.map(alert => {
                      const x = (parseInt(alert.room) % 4) * 225 + 150;
                      const y = Math.floor(parseInt(alert.room) % 12 / 4) * 225 + 150;
                      return (
                        <motion.div 
                          key={alert._id}
                          initial={{ scale: 0 }}
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 2 }}
                          className="absolute w-16 h-16 flex items-center justify-center -translate-x-1/2 -translate-y-1/2"
                          style={{ left: x, top: y }}
                        >
                           <div className="absolute inset-0 bg-status-critical rounded-full blur-2xl opacity-40"></div>
                           <div className="relative w-12 h-12 bg-status-critical rounded-full border-4 border-bg-base shadow-2xl flex items-center justify-center text-white">
                              <AlertCircle size={20} className="fill-white/10" />
                           </div>
                           {/* Room Label */}
                           <div className="absolute -bottom-8 bg-status-critical text-white px-3 py-1 rounded-lg text-[9px] font-black tracking-widest whitespace-nowrap shadow-xl border border-white/20 uppercase">
                              Target: {alert.room}
                           </div>
                        </motion.div>
                      );
                    })}

                    {/* Occupancy Layer (Simplified for visual demo) */}
                    {activeLayers.includes('occupancy') && (
                      <div className="absolute inset-0 p-12 pointer-events-none">
                         <div className="grid grid-cols-8 gap-4 h-full">
                            {Array.from({ length: 32 }).map((_, i) => (
                              <div key={i} className={`h-8 rounded-md border border-white/5 flex items-center justify-center ${i % 3 === 0 ? 'bg-accent-blue/20' : 'bg-transparent opacity-20'}`}>
                                 {i % 3 === 0 && <div className="w-1.5 h-1.5 bg-accent-blue rounded-full" />}
                              </div>
                            ))}
                         </div>
                      </div>
                    )}
                  </div>
                </TransformComponent>
              </>
            )}
          </TransformWrapper>
        </div>
      </div>
    </div>
  );
}

function AlertCircle({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}
