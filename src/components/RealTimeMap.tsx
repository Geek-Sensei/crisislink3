import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { Shield, MapPin, Navigation, AlertCircle } from 'lucide-react';
import { renderToString } from 'react-dom/server';
import { motion } from 'motion/react';

// Fix for default marker icons in Leaflet
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface RealTimeMapProps {
  center: [number, number];
  zoom?: number;
  alerts?: any[];
  responders?: any[];
  hotel?: any;
  routingTo?: [number, number] | null;
  onMarkerClick?: (id: string, type: 'alert' | 'responder') => void;
  selectedFloor?: number | null;
}

const createCustomIcon = (IconComponent: any, color: string) => {
  const html = renderToString(
    <div style={{ color }}>
      <IconComponent size={32} fill={color} fillOpacity={0.2} />
    </div>
  );
  return L.divIcon({
    html,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
  });
};

const hotelIcon = createCustomIcon(MapPin, '#EF4444');
const responderIcon = createCustomIcon(Shield, '#0EA5E9');
const alertIcon = createCustomIcon(Navigation, '#F59E0B');

function ChangeView({ center, zoom, responders, hotel, alerts }: { center: [number, number], zoom: number, responders: any[], hotel: any, alerts: any[] }) {
  const map = useMap();
  
  useEffect(() => {
    const points: L.LatLngExpression[] = [];
    
    // Add hotel location
    if (hotel?.lat && hotel?.lng) points.push([hotel.lat, hotel.lng]);
    
    // Add alert locations
    alerts.forEach(a => {
      const loc = a.hotelId || hotel;
      if (loc?.lat && loc?.lng) points.push([loc.lat, loc.lng]);
    });

    // Add responder locations
    responders.forEach(r => {
      if (r.lat && r.lng) points.push([r.lat, r.lng]);
    });

    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.setView(center, zoom);
    }
  }, [center, zoom, map, responders, hotel, alerts]);
  
  return null;
}

export default function RealTimeMap({ 
  center, 
  zoom = 13, 
  alerts = [], 
  responders = [], 
  hotel, 
  routingTo, 
  onMarkerClick,
  selectedFloor
}: RealTimeMapProps) {
  const currentFloorPlan = hotel?.floorPlans?.find((fp: any) => fp.floor === selectedFloor);

  if (selectedFloor && currentFloorPlan) {
    return (
      <div className="w-full h-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative bg-[#080B12] p-4 flex flex-col">
        <div className="flex items-center justify-between mb-4 px-4 pt-2">
           <div>
              <h2 className="text-sm font-black text-white uppercase tracking-widest">Floor {selectedFloor} Tactical Overlay</h2>
              <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest leading-none mt-1">Indoor Monitoring Active</p>
           </div>
           <div className="flex gap-4">
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-status-critical rounded-full animate-pulse" />
                 <span className="text-[9px] font-black text-white/50 uppercase">Incidents</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 bg-accent-blue rounded-full" />
                 <span className="text-[9px] font-black text-white/50 uppercase">Responders</span>
              </div>
           </div>
        </div>
        
        <div className="flex-1 relative bg-black/40 rounded-2xl border border-white/5 flex items-center justify-center overflow-hidden">
           {/* If it's a base64 or image path, we show it */}
           <div className="absolute inset-0 flex items-center justify-center p-8">
              <img 
                src={currentFloorPlan.imagePath} 
                alt={`Floor ${selectedFloor}`} 
                className="max-w-full max-h-full object-contain opacity-80"
                referrerPolicy="no-referrer"
              />
           </div>

           {/* Interactive Markers Layer (Mock Positions for Demo) */}
           <div className="absolute inset-0 pointer-events-none">
              {alerts.filter(a => a.floor === selectedFloor).map(a => (
                 <motion.div
                   key={a._id}
                   initial={{ scale: 0, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   style={{ 
                     position: 'absolute', 
                     left: `${20 + (parseInt(a.room.slice(-2)) * 5)}%`, 
                     top: `${a.room.startsWith(String(selectedFloor) + '0') ? '30%' : '70%'}`,
                     transform: 'translate(-50%, -50%)' 
                   }}
                   className="pointer-events-auto cursor-pointer"
                   onClick={() => onMarkerClick?.(a._id, 'alert')}
                 >
                    <div className="relative">
                       <div className="absolute inset-0 bg-status-critical blur-xl opacity-40 rounded-full animate-pulse" />
                       <div className="relative w-8 h-8 bg-status-critical rounded-xl flex items-center justify-center text-white shadow-2xl border border-white/20">
                          <AlertCircle size={16} />
                       </div>
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-card border border-border-default px-2 py-1 rounded-md shadow-xl whitespace-nowrap">
                          <p className="text-[8px] font-black uppercase text-text-primary">R-{a.room}</p>
                       </div>
                    </div>
                 </motion.div>
              ))}

              {responders.map(r => (
                 <motion.div
                   key={r._id}
                   initial={{ scale: 0, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   style={{ 
                     position: 'absolute', 
                     left: `${50 + (Math.random() * 20 - 10)}%`, 
                     top: '50%',
                     transform: 'translate(-50%, -50%)' 
                   }}
                   className="pointer-events-auto cursor-pointer"
                   onClick={() => onMarkerClick?.(r._id, 'responder')}
                 >
                    <div className="relative">
                       <div className="absolute inset-0 bg-accent-blue blur-xl opacity-40 rounded-full" />
                       <div className="relative w-8 h-8 bg-accent-blue rounded-xl flex items-center justify-center text-black shadow-2xl border border-white/20">
                          <Shield size={16} />
                       </div>
                       <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-bg-card border border-border-default px-2 py-1 rounded-md shadow-xl whitespace-nowrap">
                          <p className="text-[8px] font-black uppercase text-text-primary">{r.name}</p>
                       </div>
                    </div>
                 </motion.div>
              ))}
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-3xl overflow-hidden border border-white/10 shadow-2xl relative z-0">
      <MapContainer 
        center={center} 
        zoom={zoom} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%', background: '#080B12' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        <ChangeView center={center} zoom={zoom} responders={responders} hotel={hotel} alerts={alerts} />

        {routingTo && responders.length > 0 && responders[0].lat && (
           <>
             {/* Glow effect for path */}
             <Polyline 
               positions={[[responders[0].lat, responders[0].lng], routingTo] as L.LatLngExpression[]} 
               color="#38BDF8" 
               weight={8} 
               opacity={0.3}
             />
             {/* Main tactical path */}
             <Polyline 
               positions={[[responders[0].lat, responders[0].lng], routingTo] as L.LatLngExpression[]} 
               color="#0EA5E9" 
               weight={4} 
               opacity={0.9}
               dashArray="1, 8"
               lineCap="round"
             />
           </>
        )}

        {hotel && hotel.lat && hotel.lng && (
          <Marker position={[hotel.lat, hotel.lng] as L.LatLngExpression} icon={hotelIcon}>
            <Popup>
              <div className="p-2 font-sans">
                <h3 className="font-black uppercase text-xs text-status-critical">{hotel.name}</h3>
                <p className="text-[10px] text-gray-500">Security Command Center</p>
              </div>
            </Popup>
          </Marker>
        )}

        {alerts.map((alert) => {
          const loc = alert.hotelId || hotel;
          return alert.status !== 'resolved' && loc && loc.lat && loc.lng && (
            <Marker 
              key={alert._id} 
              position={[loc.lat, loc.lng] as L.LatLngExpression} 
              icon={alertIcon}
              eventHandlers={{
                click: () => onMarkerClick?.(alert._id, 'alert')
              }}
            >
              <Popup>
                <div className="p-2 font-sans">
                  <h3 className="font-black uppercase text-xs text-status-high">{alert.type} Alert</h3>
                  <p className="text-[10px] text-gray-500">Floor {alert.floor}, Room {alert.room}</p>
                </div>
              </Popup>
            </Marker>
          );
        })}

        {responders.map((res) => (
          res.lat && res.lng && (
            <Marker 
              key={res._id} 
              position={[res.lat, res.lng] as L.LatLngExpression} 
              icon={responderIcon}
              eventHandlers={{
                click: () => onMarkerClick?.(res._id, 'responder')
              }}
            >
              <Popup>
                <div className="p-2 font-sans">
                  <h3 className="font-black uppercase text-xs text-accent-blue">{res.name}</h3>
                  <p className="text-[10px] text-gray-500">{res.responderType} Unit • {res.eta || 'En Route'}</p>
                </div>
              </Popup>
            </Marker>
          )
        ))}
      </MapContainer>
    </div>
  );
}
