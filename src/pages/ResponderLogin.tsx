import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../authContext';
import { Shield, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ResponderLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (user && user.role === 'responder') {
      setIsRedirecting(true);
      navigate('/responder/home', { replace: true });
    }
  }, [user, navigate]);

  if (isRedirecting) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/responder/home');
    } catch (err: any) {
      setError(err.response?.data?.error || "Invalid badge credentials.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <button 
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 flex items-center gap-2 text-[#475569] hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
      >
        <ArrowLeft size={16} /> Back to Home
      </button>
      
      <div className="mb-12 flex items-center gap-2">
        <Shield className="text-[#F97316]" size={32} />
        <span className="text-2xl font-black tracking-tighter text-white">CrisisLink <span className="text-[#F97316] text-sm">Responder</span></span>
      </div>
      
      <motion.form 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-[#0F1420] p-8 rounded-3xl shadow-xl border border-white/5"
      >
        <h2 className="text-xl font-bold mb-6">Responder Login</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#475569] uppercase font-bold tracking-widest block mb-1">Badge ID / Email</label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]" size={20} />
              <input 
                required
                type="email"
                placeholder="rajan@chn-fire.gov.in"
                className="w-full bg-[#161D2E] border-none rounded-xl p-4 pl-12 text-white focus:ring-2 focus:ring-[#F97316] outline-none"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-[#475569] uppercase font-bold tracking-widest block mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]" size={20} />
              <input 
                required
                type="password"
                placeholder="••••••••"
                className="w-full bg-[#161D2E] border-none rounded-xl p-4 pl-12 text-white focus:ring-2 focus:ring-[#F97316] outline-none"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>
          
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  height: 'auto', 
                  scale: 1,
                  x: [0, -4, 4, -4, 4, 0] 
                }}
                transition={{ 
                  duration: 0.4,
                  x: { type: "spring", stiffness: 300, damping: 10 }
                }}
                exit={{ opacity: 0, height: 0, scale: 0.9 }}
                className="bg-status-critical/15 border-2 border-status-critical/30 p-4 rounded-xl text-status-critical text-[11px] font-black uppercase tracking-[0.1em] text-center shadow-[0_0_20px_rgba(239,68,68,0.1)] flex items-center justify-center gap-2"
              >
                <AlertCircle size={14} className="animate-pulse" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={isSubmitting}
            id="responder-login-button"
            className="tactical-btn glow-orange w-full py-4 bg-[#F97316] text-white font-black uppercase tracking-widest rounded-2xl hover:bg-[#EA580C] active:scale-[0.98] shadow-lg mt-4 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Login to Unit'
            )}
          </motion.button>
        </div>
      </motion.form>

      <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/5 max-w-md w-full">
        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-4">Prototype Credentials</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-text-secondary">Badge ID:</span>
            <code className="text-[#F97316] font-mono">rajan@chn-fire.gov.in</code>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-text-secondary">Pass:</span>
            <code className="text-[#F97316] font-mono">demo2024</code>
          </div>
        </div>
      </div>
    </div>
  );
}
