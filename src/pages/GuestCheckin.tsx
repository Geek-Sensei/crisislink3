import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../authContext';
import { Shield, ArrowRight, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function GuestCheckin() {
  const [searchParams] = useSearchParams();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    room: '',
    hotelCode: searchParams.get('code') || ''
  });
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (user && user.role === 'guest') {
      setIsRedirecting(true);
      navigate('/guest/home', { replace: true });
    }
  }, [user, navigate]);

  if (isRedirecting) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/auth/guest-checkin', formData);
      login(res.data.token, res.data.user);
      setStep(2);
    } catch (err) {
      alert("Invalid hotel code or check-in error.");
    }
  };

  if (step === 2) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-[#0F1420] p-8 rounded-3xl w-full max-w-md shadow-xl border border-white/5"
        >
          <div className="w-16 h-16 bg-[#0EA5E9]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="text-[#0EA5E9]" size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-4">Stay Safe with CrisisLink</h1>
          <p className="text-[#94A3B8] mb-8">
            Enable notifications to receive instant emergency alerts and evacuation instructions during your stay.
          </p>
          <button 
            onClick={() => navigate('/guest/home')}
            className="w-full py-4 bg-[#0EA5E9] text-white font-bold rounded-2xl hover:bg-[#0EA5E9]/90 transition-colors mb-4 flex items-center justify-center gap-2"
          >
            Enable Notifications <ArrowRight size={20} />
          </button>
          <button 
            onClick={() => navigate('/guest/home')}
            className="text-[#475569] hover:text-[#94A3B8] transition-colors"
          >
            Skip for now
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6">
      <button 
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 flex items-center gap-2 text-[#475569] hover:text-white transition-colors text-xs font-black uppercase tracking-widest"
      >
        <ArrowLeft size={16} /> Back to Home
      </button>
      
      <div className="mb-12 flex items-center gap-2">
        <Shield className="text-[#0EA5E9]" size={32} />
        <span className="text-2xl font-black tracking-tighter text-white">CrisisLink</span>
      </div>
      
      <motion.form 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-[#0F1420] p-8 rounded-3xl shadow-xl border border-white/5"
      >
        <h2 className="text-xl font-bold mb-6">Guest Check-In</h2>
        
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#475569] uppercase font-bold tracking-widest block mb-2">Full Name</label>
            <input 
              required
              type="text"
              placeholder="Priya Sharma"
              className="w-full bg-[#161D2E] border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-[#0EA5E9] outline-none"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div>
            <label className="text-xs text-[#475569] uppercase font-bold tracking-widest block mb-2">Phone Number</label>
            <input 
              required
              type="tel"
              placeholder="+91 98765 43210"
              className="w-full bg-[#161D2E] border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-[#0EA5E9] outline-none"
              value={formData.phone}
              onChange={e => setFormData({...formData, phone: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#475569] uppercase font-bold tracking-widest block mb-2">Room Number</label>
              <input 
                required
                type="text"
                placeholder="604"
                className="w-full bg-[#161D2E] border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-[#0EA5E9] outline-none"
                value={formData.room}
                onChange={e => setFormData({...formData, room: e.target.value})}
              />
            </div>
            <div>
              <label className="text-xs text-[#475569] uppercase font-bold tracking-widest block mb-2">Hotel Code</label>
              <input 
                required
                type="text"
                placeholder="GRAND1"
                className="w-full bg-[#161D2E] border-none rounded-xl p-4 text-white focus:ring-2 focus:ring-[#0EA5E9] outline-none uppercase"
                value={formData.hotelCode}
                onChange={e => setFormData({...formData, hotelCode: e.target.value})}
              />
            </div>
          </div>
          
          {formData.room && (
            <p className="text-xs text-[#0EA5E9] font-medium bg-[#0EA5E9]/10 p-2 rounded-lg inline-block">
              Floor {parseInt(formData.room.substring(0, formData.room.length - 2)) || 1} auto-detected
            </p>
          )}

          <button 
            type="submit"
            className="w-full py-4 bg-[#0EA5E9] text-white font-bold rounded-2xl hover:bg-[#0EA5E9]/90 transition-colors mt-4"
          >
            Check In
          </button>
        </div>
      </motion.form>

      <div className="mt-8 p-6 bg-white/5 rounded-2xl border border-white/5 max-w-md w-full">
        <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-4">Prototype Credentials</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="text-text-secondary">Hotel Code:</span>
            <code className="text-[#0EA5E9] font-mono">GRAND1</code>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-text-secondary">Testing:</span>
            <span className="text-text-tertiary">Any name/room works</span>
          </div>
        </div>
      </div>
    </div>
  );
}
