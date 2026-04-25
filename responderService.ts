import { User, Hotel, Alert } from "./models.ts";
import { Server } from "socket.io";

export function getDispatchScore(responder: any, alert: any, hotel: any) {
  // Simplified distance calc for demo
  const lat1 = responder.lat || 0;
  const lng1 = responder.lng || 0;
  const lat2 = hotel.lat || 0;
  const lng2 = hotel.lng || 0;
  
  const km = Math.sqrt(Math.pow(lat2 - lat1, 2) + Math.pow(lng2 - lng1, 2)) * 111;
  const dist = (1 / (km + 0.1)) * 40;
  const typeMatch = responder.responderType === alert.type ? 30 : 10;
  const avail = 20;
  const reliability = (responder.reliabilityScore || 0.8) * 10;
  
  return Math.round(dist + typeMatch + avail + reliability);
}

export function startGpsSimulation(responderId: string, hotel: any, io: Server) {
  let pos = { lat: hotel.lat + 0.022, lng: hotel.lng + 0.018 };
  let steps = 0;
  
  const interval = setInterval(async () => {
    // Move 18% closer each tick
    pos.lat += (hotel.lat - pos.lat) * 0.18;
    pos.lng += (hotel.lng - pos.lng) * 0.18;
    steps++;
    
    io.to(`hotel-${hotel.hotelCode}`).emit("location_update", {
      responderId,
      lat: pos.lat,
      lng: pos.lng,
      eta: Math.max(0, 10 - steps) + " min"
    });
    
    // Update DB
    await User.findByIdAndUpdate(responderId, { lat: pos.lat, lng: pos.lng });

    if (steps >= 12) {
      clearInterval(interval);
      io.to(`hotel-${hotel.hotelCode}`).emit("alert_on_scene", { responderId });
      await Alert.findOneAndUpdate({ responderId: responderId, status: 'accepted' }, { status: 'on_scene' });
    }
  }, 2500);
}
