import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Shield, Mail, Lock, Building, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function HotelRegister() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [address, setAddress] = useState('');
  const [success, setSuccess] = useState<{ hotelCode: string } | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/hotels/register', { name, email, password, address });
      setSuccess(res.data.hotel);
    } catch (err: any) {
      alert(err.response?.data?.error || "Registration failed.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <div className="mb-12 flex items-center gap-2">
        <Shield className="text-[#8B5CF6]" size={32} />
        <span className="text-2xl font-black tracking-tighter text-white">CrisisLink <span className="text-[#8B5CF6] text-sm">Portal</span></span>
      </div>
      
      <AnimatePresence mode="wait">
        {!success ? (
          <motion.form 
            key="form"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            onSubmit={handleSubmit}
            className="w-full max-w-md bg-[#0F1420] p-8 rounded-3xl shadow-xl border border-white/5"
          >
            <h2 className="text-xl font-bold mb-6">Hotel Registration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-[#475569] uppercase font-bold tracking-widest block mb-1">Hotel Name</label>
                <div className="relative">
                  <Building className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]" size={20} />
                  <input 
                    required
                    type="text"
                    placeholder="Hotel Grand Bangalore"
                    className="w-full bg-[#161D2E] border-none rounded-xl p-4 pl-12 text-white focus:ring-2 focus:ring-[#8B5CF6] outline-none"
                    value={name}
                    onChange={e => setName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#475569] uppercase font-bold tracking-widest block mb-1">Official Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]" size={20} />
                  <input 
                    required
                    type="email"
                    placeholder="admin@hotelgrand.com"
                    className="w-full bg-[#161D2E] border-none rounded-xl p-4 pl-12 text-white focus:ring-2 focus:ring-[#8B5CF6] outline-none"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-[#475569] uppercase font-bold tracking-widest block mb-1">Address</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#475569]" size={20} />
                  <input 
                    required
                    type="text"
                    placeholder="123 MG Road, Bangalore"
                    className="w-full bg-[#161D2E] border-none rounded-xl p-4 pl-12 text-white focus:ring-2 focus:ring-[#8B5CF6] outline-none"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
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
                className="w-full py-4 bg-[#8B5CF6] text-white font-bold rounded-2xl hover:bg-[#8B5CF6]/90 transition-colors mt-4"
              >
                Register Hotel
              </button>
            </div>
          </motion.form>
        ) : (
          <motion.div 
            key="success"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md bg-[#0F1420] p-10 rounded-3xl shadow-xl border border-[#8B5CF6]/30 text-center"
          >
            <div className="w-20 h-20 bg-[#8B5CF6]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="text-[#8B5CF6]" size={40} />
            </div>
            <h2 className="text-2xl font-black mb-2">Registration Successful!</h2>
            <p className="text-[#475569] mb-8">Your unique hotel code is:</p>
            
            <div className="bg-[#161D2E] p-6 rounded-2xl border border-[#8B5CF6]/20 mb-8">
              <span className="text-4xl font-black tracking-widest text-[#8B5CF6]">{success.hotelCode}</span>
            </div>
            
            <p className="text-sm text-[#475569] mb-8">Share this code with your guests for easy check-in during emergencies.</p>
            
            <button 
              onClick={() => navigate('/hotel/login')}
              className="w-full py-4 bg-white text-black font-bold rounded-2xl hover:bg-white/90 transition-colors"
            >
              Go to Staff Login
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      
      <p className="mt-8 text-[#475569] text-sm">
        Already registered? <span onClick={() => navigate('/hotel/login')} className="text-[#8B5CF6] font-bold cursor-pointer">Staff Login</span>
      </p>
    </div>
  );
}
