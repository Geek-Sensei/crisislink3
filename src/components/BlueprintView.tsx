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

  // Tactical Logic: Dynamically calculate escape route based on room location
  let pathD = "M 405 250 L 165 250"; 
  let exitStair = "Use Exit Stairwell B";
  let tacticalZone = "Sector North-Alpha";

  const roomIndex = northRooms.indexOf(room);
  const southIndex = southRooms.indexOf(room);
  const eastIndex = eastRooms.indexOf(room);

  if (roomIndex !== -1) {
    pathD = `M ${175 + roomIndex * 70 + 30} 195 L ${175 + roomIndex * 70 + 30} 250 L 165 250`;
    tacticalZone = "Sector North-Alpha";
  } else if (southIndex !== -1) {
    pathD = `M ${175 + southIndex * 70 + 30} 305 L ${175 + southIndex * 70 + 30} 250 L 165 250`;
    tacticalZone = "Sector South-Bravo";
  } else if (eastIndex !== -1) {
    pathD = `M 655 ${135 + eastIndex * 40 + 15} L 655 250 L 725 250`;
    exitStair = "Use Exit Stairwell A";
    tacticalZone = "Sector East-Delta";
  }

  return (
    <div className={`bg-[#0A0F1A] rounded-[2.5rem] border border-white/5 overflow-hidden relative ${className}`}>
      {/* Technical CAD Grid */}
      <div className="absolute inset-0 opacity-[0.15]" 
           style={{ 
             backgroundImage: `
               linear-gradient(rgba(71, 85, 105, 0.5) 1px, transparent 1px),
               linear-gradient(90deg, rgba(71, 85, 105, 0.5) 1px, transparent 1px)
             `,
             backgroundSize: '20px 20px' 
           }} 
      />

      <div className="relative p-8 flex flex-col h-full">
        <div className="flex items-start justify-between mb-8">
          <div className="space-y-1">
            <div className="px-3 py-1 rounded-md border border-[#0EA5E9]/30 bg-[#0EA5E9]/5 inline-block">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#0EA5E9]">Tactical Interior Layout</span>
            </div>
            <p className="text-white font-black text-xl tracking-tighter uppercase italic">Level {floorNum} Floor Plan</p>
          </div>
          <div className="text-right">
             <p className="text-[10px] font-black uppercase text-[#475569] tracking-widest leading-none">Drawing Ref</p>
             <p className="text-sm font-bold text-white/40 font-mono">CAD-H{floorNum}-REV3</p>
          </div>
        </div>

        <div className="flex-1 min-h-0 flex items-center justify-center">
          <svg viewBox="0 0 800 450" className="w-full h-full drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <defs>
              <pattern id="wallPattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
                <line x1="0" y1="10" x2="10" y2="0" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
              </pattern>
            </defs>

            {/* EXTERIOR ENVELOPE (Thick Structural Walls) */}
            <path 
              d="M 100 80 L 600 80 L 600 120 L 750 120 L 750 380 L 600 380 L 600 420 L 100 420 Z" 
              fill="rgba(15, 20, 32, 0.9)" 
              stroke="rgba(255,255,255,0.15)" 
              strokeWidth="4" 
            />
            
            {/* CORRIDOR BOUNDARIES */}
            <rect x="150" y="220" width="550" height="60" fill="rgba(255,255,255,0.02)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />

            {/* NORTH WING ROOMS */}
            {northRooms.map((r, i) => (
              <g key={r} transform={`translate(${140 + i * 75}, 80)`}>
                {/* Room Enclosure */}
                <rect 
                  width="70" height="140" fill={isAffected(r) ? 'rgba(239, 68, 68, 0.1)' : 'transparent'} 
                  stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" 
                />
                {/* Interior Partition (Bathroom Block) */}
                <rect x="5" y="5" width="25" height="35" rx="2" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" />
                {/* Door Swing Indicator */}
                <path d="M 30 140 Q 30 125 45 125" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="1" strokeDasharray="2 2" />
                <rect x="30" y="138" width="15" height="2" fill="rgba(0,0,0,0.5)" />
                
                {isAffected(r) && (
                  <motion.rect
                    width="70" height="140" stroke="#EF4444" strokeWidth="2" fill="none"
                    initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
                <text x="35" y="70" textAnchor="middle" fontSize="10" fontWeight="900" fill={isAffected(r) ? "#EF4444" : "white"} fillOpacity={isAffected(r) ? 1 : 0.4}>{r}</text>
              </g>
            ))}

            {/* SOUTH WING ROOMS */}
            {southRooms.map((r, i) => (
              <g key={r} transform={`translate(${140 + i * 75}, 280)`}>
                <rect 
                  width="70" height="140" fill={isAffected(r) ? 'rgba(239, 68, 68, 0.1)' : 'transparent'} 
                  stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" 
                />
                <rect x="5" y="100" width="25" height="35" rx="2" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.05)" />
                <text x="35" y="70" textAnchor="middle" fontSize="10" fontWeight="900" fill={isAffected(r) ? "#EF4444" : "white"} fillOpacity={isAffected(r) ? 1 : 0.4}>{r}</text>
              </g>
            ))}

            {/* EAST WING CLUSTER */}
            <g transform="translate(620, 120)">
              <rect width="130" height="260" fill="transparent" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
              {eastRooms.slice(0, 3).map((r, i) => (
                <g key={r} transform={`translate(0, ${i * 86})`}>
                   <rect width="130" height="86" stroke="rgba(255,255,255,0.1)" fill={isAffected(r) ? 'rgba(239, 68, 68, 0.1)' : 'transparent'} />
                   <text x="65" y="43" textAnchor="middle" fontSize="10" fontWeight="900" fill="white" fillOpacity={0.4}>{r}</text>
                </g>
              ))}
            </g>

            {/* CORES & ESCAPE STAIRWELLS */}
            {/* Stairwell A */}
            <g transform="translate(710, 220)">
              <rect width="35" height="60" fill="#0EA5E9" fillOpacity="0.1" stroke="#0EA5E9" strokeWidth="2" />
              <path d="M 5 10 L 30 10 M 5 20 L 30 20 M 5 30 L 30 30" stroke="#0EA5E9" strokeWidth="1" />
              <text x="17.5" y="50" textAnchor="middle" fontSize="7" fontWeight="black" fill="#0EA5E9">EXT STAIR A</text>
            </g>

            {/* Stairwell B */}
            <g transform="translate(105, 220)">
              <rect width="35" height="60" fill="#22C55E" fillOpacity="0.1" stroke="#22C55E" strokeWidth="2" />
              <path d="M 5 50 L 30 50 M 5 40 L 30 40 M 5 30 L 30 30" stroke="#22C55E" strokeWidth="1" />
              <text x="17.5" y="20" textAnchor="middle" fontSize="7" fontWeight="black" fill="#22C55E">EXT STAIR B</text>
            </g>

            {/* LIFT CORE */}
            <g transform="translate(350, 225)">
               <rect width="100" height="50" rx="4" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" />
               <line x1="50" y1="0" x2="50" y2="50" stroke="rgba(255,255,255,0.2)" />
               <path d="M 20 20 L 30 25 L 20 30 L 20 20 Z" fill="rgba(255,255,255,0.2)" />
               <path d="M 80 20 L 70 25 L 80 30 L 80 20 Z" fill="rgba(255,255,255,0.2)" />
               <text x="50" y="15" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#475569">SERVICE CORE / VERTICAL TRANSPORT</text>
            </g>

            {/* TACTICAL OVERLAY: Responder Path */}
            <motion.path
              d={pathD} fill="none" stroke="#3B82F6" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
            <motion.path
              d={pathD} fill="none" stroke="#60A5FA" strokeWidth="2" strokeDasharray="12 8"
              initial={{ strokeDashoffset: 0 }} animate={{ strokeDashoffset: -40 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />

            {/* Target Marker (Google Maps Style Pin) */}
            <g transform={`translate(${pathD.split(' ')[1]}, ${pathD.split(' ')[2]})`}>
               <motion.circle 
                 r="12" fill="#EF4444" fillOpacity="0.2"
                 animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }}
                 transition={{ repeat: Infinity, duration: 2 }}
               />
               <circle r="4" fill="#EF4444" stroke="white" strokeWidth="1.5" />
            </g>

            {/* Start Marker (Google Maps Style Dot) */}
            <g transform={`translate(${pathD.split(' ').slice(-2)[0]}, ${pathD.split(' ').slice(-1)[0]})`}>
               <circle r="6" fill="#3B82F6" stroke="white" strokeWidth="2" shadow-lg="true" />
            </g>

            {/* Compass & North Arrow */}
            <g transform="translate(50, 50)">
               <circle r="20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
               <path d="M 0 -15 L 5 0 L 0 5 L -5 0 Z" fill="#EF4444" />
               <text y="-25" textAnchor="middle" fontSize="8" fontWeight="black" fill="#EF4444" fontStyle="italic">N</text>
            </g>

            {/* Scale Bar */}
            <g transform="translate(650, 420)">
               <line x1="0" y1="0" x2="50" y2="0" stroke="white" strokeWidth="1" />
               <line x1="0" y1="-3" x2="0" y2="3" stroke="white" strokeWidth="1" />
               <line x1="25" y1="-2" x2="25" y2="2" stroke="white" strokeWidth="1" />
               <line x1="50" y1="-3" x2="50" y2="3" stroke="white" strokeWidth="1" />
               <text x="25" y="12" textAnchor="middle" fontSize="7" fontWeight="black" fill="#475569">5m BAR SCALE</text>
            </g>
          </svg>
        </div>

        {/* Footer Metrics */}
        <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6 mt-4">
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
              <div>
                 <p className="text-[8px] font-black uppercase text-[#475569] tracking-widest">Target Exit</p>
                 <p className="text-xs font-bold text-white uppercase">{exitStair.split(' ').slice(2).join(' ')}</p>
              </div>
           </div>
           <div className="flex items-center gap-3 border-x border-white/5 px-4">
              <div className="w-1.5 h-1.5 rounded-full bg-[#EF4444] animate-pulse" />
              <div>
                 <p className="text-[8px] font-black uppercase text-[#475569] tracking-widest">Active Incident</p>
                 <p className="text-xs font-bold text-white uppercase">{tacticalZone}</p>
              </div>
           </div>
           <div className="flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9]" />
              <div>
                 <p className="text-[8px] font-black uppercase text-[#475569] tracking-widest">Floor Spec</p>
                 <p className="text-xs font-bold text-white uppercase">{floorNum}.0-WING-MOD</p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
