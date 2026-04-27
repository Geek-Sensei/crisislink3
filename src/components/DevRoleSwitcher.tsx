import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Hotel, User, Settings2, X, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function DevRoleSwitcher() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const roles = [
    { name: 'Guest Portal', path: '/', icon: User, color: 'bg-accent-blue' },
    { name: 'Hotel Ops', path: '/hotel/login', icon: Hotel, color: 'bg-accent-purple' },
    { name: 'Responder', path: '/responder/login', icon: Shield, color: 'bg-status-critical' },
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-bg-card/90 backdrop-blur-2xl border border-white/10 p-2 rounded-[2rem] shadow-2xl w-64 overflow-hidden"
          >
            <div className="p-4 border-b border-white/5 mb-2">
               <h3 className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Switch Context</h3>
            </div>
            
            <div className="space-y-1">
              {roles.map((role) => {
                const isActive = location.pathname.startsWith(role.path) && (role.path !== '/' || location.pathname === '/');
                return (
                  <button
                    key={role.path}
                    onClick={() => {
                      navigate(role.path);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group ${
                      isActive ? 'bg-white/10' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-10 h-10 ${role.color} rounded-xl flex items-center justify-center text-white shadow-lg`}>
                      <role.icon size={20} />
                    </div>
                    <div className="flex-1 text-left">
                       <p className={`text-xs font-black uppercase tracking-tight ${isActive ? 'text-white' : 'text-text-secondary'}`}>
                         {role.name}
                       </p>
                       {isActive && <p className="text-[8px] font-bold text-text-tertiary uppercase tracking-widest">Active System</p>}
                    </div>
                    <ChevronRight size={16} className={`text-text-tertiary group-hover:translate-x-1 transition-transform ${isActive ? 'opacity-0' : ''}`} />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all border-2 border-white/10 ${
          isOpen ? 'bg-white text-bg-base rotate-90 scale-90' : 'bg-bg-card text-white hover:scale-110 active:scale-95'
        }`}
      >
        {isOpen ? <X size={24} /> : <Settings2 size={24} />}
        {!isOpen && (
           <div className="absolute -top-1 -right-1 w-3 h-3 bg-accent-blue rounded-full border-2 border-bg-base animate-pulse" />
        )}
      </button>
    </div>
  );
}
