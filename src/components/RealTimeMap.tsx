import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { Shield, MapPin, Navigation } from 'lucide-react';
import { renderToString } from 'react-dom/server';

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

export default function RealTimeMap({ center, zoom = 13, alerts = [], responders = [], hotel, routingTo, onMarkerClick }: RealTimeMapProps) {
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
           <Polyline 
             positions={[[responders[0].lat, responders[0].lng], routingTo] as L.LatLngExpression[]} 
             color="#0EA5E9" 
             weight={4} 
             opacity={0.6}
             dashArray="8, 12"
           />
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
