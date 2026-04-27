import { NavLink } from 'react-router-dom';
import { Zap, Map, Shield, User } from 'lucide-react';
import { motion } from 'motion/react';

export default function MobileNav() {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-6 pb-6 pt-2 bg-gradient-to-t from-bg-base via-bg-base/90 to-transparent pointer-events-none">
      <div className="max-w-md mx-auto bg-bg-card/80 backdrop-blur-2xl border border-white/5 rounded-[2.5rem] p-2 flex items-center justify-around shadow-2xl pointer-events-auto">
        <NavLink 
          to="/responder/home"
          className={({ isActive }) => `flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${isActive ? 'bg-status-critical/10 text-status-critical' : 'text-text-tertiary'}`}
        >
          {({ isActive }) => (
            <>
              <Zap size={20} className={isActive ? 'fill-current' : ''} />
              <span className="text-[8px] font-black uppercase tracking-widest">Alerts</span>
              {isActive && <motion.div layoutId="nav-dot" className="w-1 h-1 bg-status-critical rounded-full mt-0.5" />}
            </>
          )}
        </NavLink>

        <NavLink 
          to="/responder/map"
          className={({ isActive }) => `flex flex-col items-center gap-1 p-3 rounded-2xl transition-all ${isActive ? 'bg-accent-blue/10 text-accent-blue' : 'text-text-tertiary'}`}
        >
          {({ isActive }) => (
            <>
              <Map size={20} className={isActive ? 'fill-current' : ''} />
              <span className="text-[8px] font-black uppercase tracking-widest">Tactical</span>
              {isActive && <motion.div layoutId="nav-dot" className="w-1 h-1 bg-accent-blue rounded-full mt-0.5" />}
            </>
          )}
        </NavLink>

        <div className="flex flex-col items-center gap-1 p-3 rounded-2xl text-text-tertiary opacity-40">
          <Shield size={20} />
          <span className="text-[8px] font-black uppercase tracking-widest">Safe</span>
        </div>

        <div className="flex flex-col items-center gap-1 p-3 rounded-2xl text-text-tertiary opacity-40">
          <User size={20} />
          <span className="text-[8px] font-black uppercase tracking-widest">Account</span>
        </div>
      </div>
    </div>
  );
}
