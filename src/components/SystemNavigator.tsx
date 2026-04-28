import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Hotel, User, LayoutGrid, X, ChevronRight, Home, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../authContext';

export default function SystemNavigator() {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, sessions, logout } = useAuth();

  const portals = [
    { name: 'Gateway Home', path: '/', icon: Home, color: 'bg-white/10' },
    { name: 'Guest Portal', path: '/guest/home', loginPath: '/guest/checkin', icon: User, color: 'bg-accent-blue', role: 'guest' },
    { name: 'Hotel Command', path: '/hotel/dashboard', loginPath: '/hotel/login', icon: Hotel, color: 'bg-accent-purple', role: 'hotel_staff' },
    { name: 'Responder Hub', path: '/responder/home', loginPath: '/responder/login', icon: Shield, color: 'bg-status-critical', role: 'responder' },
  ];

  const handleLogout = () => {
    logout(true); // Terminate all sessions
    setIsOpen(false);
    navigate('/');
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-[#0F172A]/95 backdrop-blur-2xl border border-white/10 p-2 rounded-[2.5rem] shadow-2xl w-64 sm:w-72 overflow-hidden"
          >
            <div className="p-5 border-b border-white/5 mb-2 flex items-center justify-between">
               <div>
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">System Access</h3>
                  <p className="text-xs font-bold text-white">Crisis Management Bridge</p>
               </div>
               {Object.keys(sessions).length > 0 && (
                 <div className="px-2 py-1 bg-white/5 rounded-md border border-white/5">
                   <p className="text-[8px] font-black uppercase text-accent-blue tracking-tighter">{Object.keys(sessions).length} ACTIVE</p>
                 </div>
               )}
            </div>
            
            <div className="space-y-1 p-1">
              {portals.map((portal) => {
                const isActive = location.pathname.startsWith(portal.path) && (portal.path !== '/' || location.pathname === '/');
                const hasSession = portal.role ? !!sessions[portal.role] : false;
                // Hotel staff can access anything in demo mode
                const canDirectAccess = hasSession || (user?.role === 'hotel_staff' && portal.role);
                const path = canDirectAccess ? portal.path : (portal.loginPath || portal.path);

                return (
                  <button
                    key={portal.path}
                    onClick={() => {
                      navigate(path);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all group ${
                      isActive ? 'bg-white/10 shadow-inner' : 'hover:bg-white/5'
                    }`}
                  >
                    <div className={`w-10 h-10 ${portal.color} rounded-xl flex items-center justify-center text-white shadow-lg transition-transform group-hover:scale-110`}>
                      <portal.icon size={20} />
                    </div>
                    <div className="flex-1 text-left">
                       <p className={`text-xs font-black uppercase tracking-tight ${isActive ? 'text-white' : 'text-text-secondary'}`}>
                         {portal.name}
                       </p>
                       {isActive && <div className="flex items-center gap-1.5 mt-0.5">
                         <div className="w-1 h-1 bg-accent-blue rounded-full animate-pulse" />
                         <p className="text-[8px] font-bold text-text-tertiary uppercase tracking-widest">Live Session</p>
                       </div>}
                    </div>
                    {!isActive && <ChevronRight size={14} className="text-text-tertiary opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />}
                  </button>
                );
              })}
            </div>

            {user && (
              <div className="p-2 pt-1">
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl transition-all hover:bg-status-critical/10 text-status-critical group"
                >
                  <div className="w-10 h-10 bg-status-critical/10 rounded-xl flex items-center justify-center">
                    <LogOut size={20} />
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-black uppercase tracking-tight">Terminate Session</p>
                    <p className="text-[8px] font-bold opacity-60 uppercase tracking-widest mt-0.5">Secure Log Out</p>
                  </div>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-all border-2 border-white/10 group ${
          isOpen ? 'bg-white text-[#080B12] rotate-90 scale-90' : 'bg-[#0F172A] text-white hover:scale-110 active:scale-95'
        }`}
      >
        {isOpen ? <X size={24} /> : <LayoutGrid size={24} className="group-hover:rotate-12 transition-transform" />}
        {!isOpen && (
           <div className="absolute top-0 right-0 w-4 h-4 bg-accent-blue rounded-full border-4 border-[#080B12] animate-pulse" />
        )}
      </button>
    </div>
  );
}
