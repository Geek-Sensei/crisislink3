import React from 'react';
import { motion } from 'motion/react';

interface BlueprintViewProps {
  room: string;
  floor: string;
  className?: string;
}

export default function BlueprintView({ room, floor, className = '' }: BlueprintViewProps) {
  // Generate rooms based on floor
  const floorNum = parseInt(floor) || 1;
  const northRooms = Array.from({ length: 6 }, (_, i) => `${floorNum}0${i + 1}`);
  const southRooms = Array.from({ length: 6 }, (_, i) => `${floorNum}0${i + 7}`);
  const eastRooms = Array.from({ length: 6 }, (_, i) => `${floorNum}1${i + 3}`);

  const isAffected = (r: string) => r === room;

  // Calculate endpoint for escape route based on room
  // This is a simplified logic: if room is in North/South/East, different path
  let pathD = "M 405 195 L 405 250 L 165 250"; // Default
  let exitStair = "Use Exit Stairwell B";

  if (room.startsWith(`${floorNum}1`)) {
    pathD = "M 655 260 L 725 260";
    exitStair = "Use Exit Stairwell A";
  } else if (parseInt(room) % 2 === 0) {
    pathD = "M 405 195 L 405 250 L 165 250";
    exitStair = "Use Exit Stairwell B";
  } else {
    pathD = "M 405 305 L 405 250 L 725 250";
    exitStair = "Use Exit Stairwell A";
  }

  // Find position of affected room to draw a line to it
  const roomIndex = northRooms.indexOf(room);
  const southIndex = southRooms.indexOf(room);
  const eastIndex = eastRooms.indexOf(room);

  if (roomIndex !== -1) {
    pathD = `M ${175 + roomIndex * 70 + 30} 195 L ${175 + roomIndex * 70 + 30} 250 L 165 250`;
  } else if (southIndex !== -1) {
    pathD = `M ${175 + southIndex * 70 + 30} 305 L ${175 + southIndex * 70 + 30} 250 L 165 250`;
  } else if (eastIndex !== -1) {
    pathD = `M 655 ${135 + eastIndex * 40 + 15} L 655 250 L 725 250`;
    exitStair = "Use Exit Stairwell A";
  }

  return (
    <div className={`bg-[#0F1420] rounded-[2.5rem] border border-white/5 overflow-hidden relative ${className}`}>
      {/* Technical Grid Background */}
      <div className="absolute inset-0 opacity-20" 
           style={{ 
             backgroundImage: 'radial-gradient(#475569 1px, transparent 1px), linear-gradient(to right, #475569 1px, transparent 1px), linear-gradient(to bottom, #475569 1px, transparent 1px)',
             backgroundSize: '4px 4px, 40px 40px, 40px 40px' 
           }} 
      />

      <div className="relative p-8 flex flex-col items-center">
        <div className="self-start mb-12">
          <div className="px-4 py-1.5 rounded-full border border-white/20 bg-black/20 inline-block">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70">Blueprint View</span>
          </div>
        </div>

        <svg viewBox="0 0 800 500" className="w-full h-auto drop-shadow-2xl">
          {/* Main Corridor Container */}
          <rect x="150" y="100" width="450" height="300" rx="30" fill="rgba(22, 29, 46, 0.6)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          
          {/* North Wing Rooms */}
          {northRooms.map((r, i) => (
            <React.Fragment key={r}>
              <rect 
                x={175 + i * 70} y={125} width="60" height="70" rx="12" 
                fill={isAffected(r) ? 'rgba(14, 165, 233, 0.1)' : 'rgba(15, 20, 32, 0.8)'}
                stroke={isAffected(r) ? '#0EA5E9' : 'rgba(255,255,255,0.1)'}
                strokeWidth={isAffected(r) ? '2' : '1'}
                strokeDasharray={isAffected(r) ? '4 4' : '0'}
              />
              <text x={185 + i * 70} y={145} fontSize="10" fontWeight="900" fill="white" className="uppercase tracking-tighter">{r}</text>
              <text x={185 + i * 70} y={158} fontSize="7" fontWeight="bold" fill="#475569" className="uppercase tracking-tighter">North wing</text>
            </React.Fragment>
          ))}

          {/* South Wing Rooms */}
          {southRooms.map((r, i) => (
            <React.Fragment key={r}>
              <rect 
                x={175 + i * 70} y={305} width="60" height="70" rx="12" 
                fill={isAffected(r) ? 'rgba(14, 165, 233, 0.1)' : 'rgba(15, 20, 32, 0.8)'}
                stroke={isAffected(r) ? '#0EA5E9' : 'rgba(255,255,255,0.1)'}
                strokeWidth={isAffected(r) ? '2' : '1'}
              />
              <text x={185 + i * 70} y={325} fontSize="10" fontWeight="900" fill="white" className="uppercase tracking-tighter">{r}</text>
              <text x={185 + i * 70} y={338} fontSize="7" fontWeight="bold" fill="#475569" className="uppercase tracking-tighter">South wing</text>
            </React.Fragment>
          ))}

          {/* East Wing Cluster */}
          <rect x="610" y="125" width="90" height="250" rx="25" fill="rgba(22, 29, 46, 0.4)" stroke="rgba(255,255,255,0.1)" />
          {eastRooms.map((r, i) => (
             <React.Fragment key={r}>
                <rect 
                  x="620" y={135 + i * 40} width="70" height="30" rx="8" 
                  fill={isAffected(r) ? 'rgba(14, 165, 233, 0.1)' : 'rgba(15, 20, 32, 0.8)'}
                  stroke={isAffected(r) ? '#0EA5E9' : 'rgba(255,255,255,0.1)'}
                  strokeWidth={isAffected(r) ? '2' : '1'}
                />
                <text x="630" y={148 + i * 40} fontSize="8" fontWeight="900" fill="white" className="uppercase tracking-tighter">{r}</text>
                <text x="630" y={157 + i * 40} fontSize="5" fontWeight="bold" fill="#475569" className="uppercase tracking-tighter">East wing</text>
             </React.Fragment>
          ))}

          {/* Stairwells & Cores */}
          <rect x="130" y="225" width="35" height="80" rx="15" fill="rgba(34, 197, 94, 0.1)" stroke="#22C55E" strokeWidth="1" />
          <text x="135" y="255" fontSize="8" fontWeight="900" fill="white">Stair B</text>
          <text x="137" y="265" fontSize="5" fontWeight="bold" fill="#22C55E">Exit core</text>

          <rect x="710" y="225" width="35" height="80" rx="15" fill="rgba(14, 165, 233, 0.1)" stroke="#0EA5E9" strokeWidth="1" />
          <text x="715" y="255" fontSize="8" fontWeight="900" fill="white">Stair A</text>
          <text x="717" y="265" fontSize="5" fontWeight="bold" fill="#0EA5E9">Exit core</text>

          <rect x="375" y="225" width="60" height="80" rx="15" fill="rgba(15, 20, 32, 1)" stroke="rgba(255,255,255,0.1)" />
          <text x="382" y="255" fontSize="8" fontWeight="900" fill="white">Lift Core</text>
          <text x="383" y="265" fontSize="5" fontWeight="bold" fill="#475569">Vertical core</text>

          {/* Escape Route Path */}
          <motion.path
            d={pathD}
            fill="transparent"
            stroke="#0EA5E9"
            strokeWidth="3"
            strokeDasharray="8 8"
            initial={{ pathLength: 0 }}
            animate={{ 
              pathLength: 1,
              strokeDashoffset: [0, -32]
            }}
            transition={{ 
              pathLength: { duration: 1.5, ease: "easeOut" },
              strokeDashoffset: { repeat: Infinity, duration: 1, ease: "linear" }
            }}
          />

          {/* Assembly Legend */}
          <circle cx="120" cy="450" r="12" fill="rgba(34, 197, 94, 0.1)" stroke="#22C55E" />
          <text x="140" y="454" fontSize="10" fontWeight="900" fill="white">Assembly</text>
        </svg>

        <div className="w-full mt-12 grid grid-cols-2 gap-6">
           <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-6 h-6 bg-[#0EA5E9]/20 rounded flex items-center justify-center text-[#0EA5E9]">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Escape Route</p>
              </div>
              <p className="text-sm font-bold text-white">{exitStair}</p>
           </div>
           <div className="bg-white/5 p-6 rounded-3xl border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                 <div className="w-6 h-6 bg-status-critical/20 rounded flex items-center justify-center text-status-critical">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0zM12 9v4M12 17h.01"/></svg>
                 </div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#94A3B8]">Affected Room</p>
              </div>
              <p className="text-sm font-bold text-white">Room {room}</p>
           </div>
        </div>
      </div>
    </div>
  );
}
