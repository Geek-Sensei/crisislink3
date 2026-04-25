import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../authContext';
import { Shield, Lock, Mail } from 'lucide-react';
import { motion } from 'motion/react';

export default function HotelLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/login', { email, password });
      login(res.data.token, res.data.user);
      navigate('/hotel/dashboard');
    } catch (err) {
      alert("Invalid credentials.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="mb-12 flex items-center gap-2">
        <Shield className="text-[#8B5CF6]" size={32} />
        <span className="text-2xl font-black tracking-tighter text-white">CrisisLink <span className="text-[#8B5CF6] text-sm">Staff</span></span>
      </div>
      
      <motion.form 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-[#0F1420] p-8 rounded-3xl shadow-xl border border-white/5"
      >
        <h2 className="text-xl font-bold mb-6">Staff Login</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#475569] uppercase font-bold tracking-widest block mb-1">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]" size={20} />
              <input 
                required
                type="email"
                placeholder="duty@hotelgrand.com"
                className="w-full bg-[#161D2E] border-none rounded-xl p-4 pl-12 text-white focus:ring-2 focus:ring-[#8B5CF6] outline-none"
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
                className="w-full bg-[#161D2E] border-none rounded-xl p-4 pl-12 text-white focus:ring-2 focus:ring-[#8B5CF6] outline-none"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button 
            type="submit"
            className="tactical-btn glow-purple w-full py-4 bg-[#8B5CF6] text-white font-black uppercase tracking-widest rounded-2xl hover:bg-[#7C3AED] active:scale-[0.98] shadow-lg mt-4 cursor-pointer"
          >
            Access Dashboard
          </button>
        </div>
      </motion.form>
      
      <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/5 max-w-md w-full">
        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-4">Prototype Credentials</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-text-secondary">Email:</span>
            <code className="text-[#8B5CF6] font-mono">duty@hotelgrand.com</code>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-text-secondary">Pass:</span>
            <code className="text-[#8B5CF6] font-mono">demo2024</code>
          </div>
        </div>
      </div>

      <p className="mt-8 text-[#475569] text-sm">
        New hotel? <span onClick={() => navigate('/hotel/register')} className="text-[#8B5CF6] font-bold cursor-pointer">Register Portal</span>
      </p>
    </div>
  );
}
