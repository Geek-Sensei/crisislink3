import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../authContext';
import { 
  Shield, 
  Map as MapIcon, 
  Upload, 
  Trash2, 
  ChevronLeft, 
  Save, 
  Layout, 
  AlertCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function HotelSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Local state for floor plans
  const [floorPlans, setFloorPlans] = useState<Array<{ floor: number; imagePath: string }>>([]);

  useEffect(() => {
    const fetchHotel = async () => {
      const hotelId = user?.hotelId?._id || user?.hotelId;
      if (!hotelId) return;
      try {
        const res = await axios.get(`/api/hotels/${hotelId}`);
        setHotel(res.data);
        setFloorPlans(res.data.floorPlans || []);
      } catch (err) {
        setError('Failed to load hotel settings');
      } finally {
        setLoading(false);
      }
    };
    fetchHotel();
  }, [user]);

  const handleUpload = (floor: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In a real app we'd upload to S3/Cloudinary. 
    // For this prototype, we'll use a local object URL or a base64 string.
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setFloorPlans(prev => {
        const filtered = prev.filter(p => p.floor !== floor);
        return [...filtered, { floor, imagePath: base64 }].sort((a,b) => a.floor - b.floor);
      });
    };
    reader.readAsDataURL(file);
  };

  const removePlan = (floor: number) => {
    setFloorPlans(prev => prev.filter(p => p.floor !== floor));
  };

  const saveSettings = async () => {
    const hotelId = user?.hotelId?._id || user?.hotelId;
    if (!hotelId) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      await axios.patch(`/api/hotels/${hotelId}/floor-plans`, { floorPlans });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center text-white">Loading Settings...</div>;

  return (
    <div className="max-w-4xl mx-auto p-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate('/hotel/dashboard')}
          className="w-10 h-10 bg-bg-elevated rounded-xl flex items-center justify-center text-text-tertiary hover:text-text-primary border border-border-default transition-all"
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-black text-text-primary tracking-tight">Hotel Settings</h1>
          <p className="text-xs text-text-tertiary font-bold uppercase tracking-widest">Configuration & Floor Plans</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Management Sidebar */}
        <div className="space-y-4">
          <div className="p-6 bg-bg-card rounded-[2rem] border border-border-default shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-accent-purple/10 rounded-xl flex items-center justify-center text-accent-purple">
                <Shield size={20} />
              </div>
              <h3 className="font-black text-text-primary text-sm uppercase">Info</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Hotel Name</p>
                <p className="text-sm font-bold text-text-primary">{hotel?.name}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Code</p>
                <code className="text-sm font-mono text-accent-purple bg-accent-purple/5 px-2 py-1 rounded">
                  {hotel?.hotelCode}
                </code>
              </div>
              <div>
                <p className="text-[10px] font-black text-text-tertiary uppercase tracking-widest mb-1">Floors</p>
                <p className="text-sm font-bold text-text-primary">{hotel?.totalFloors}</p>
              </div>
            </div>
          </div>

          <button 
            onClick={saveSettings}
            disabled={saving}
            className="w-full py-5 bg-text-primary text-bg-base font-black text-sm tracking-[0.2em] uppercase rounded-3xl flex items-center justify-center gap-2 hover:bg-white transition-all disabled:opacity-50"
          >
            {saving ? <div className="w-5 h-5 border-2 border-bg-base border-t-transparent rounded-full animate-spin" /> : <Save size={20} />}
            {saving ? 'Saving...' : 'Save Changes'}
          </button>

          <AnimatePresence>
            {success && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-status-safe/10 border border-status-safe/20 text-status-safe rounded-2xl text-center text-xs font-black uppercase tracking-widest"
              >
                Settings saved successfully
              </motion.div>
            )}
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-status-critical/10 border border-status-critical/20 text-status-critical rounded-2xl text-center text-xs font-black uppercase tracking-widest"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Floor Plan Management */}
        <div className="md:col-span-2 space-y-6">
          <div className="p-8 bg-bg-card rounded-[2.5rem] border border-border-default shadow-xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-accent-orange/10 rounded-2xl flex items-center justify-center text-accent-orange">
                  <MapIcon size={24} />
                </div>
                <div>
                  <h3 className="font-black text-text-primary text-lg tracking-tight leading-tight">Tactical Floor Plans</h3>
                  <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">SVG/Blueprint Overlay Assets</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              {Array.from({ length: hotel?.totalFloors || 0 }).map((_, i) => {
                const floor = i + 1;
                const existing = floorPlans.find(p => p.floor === floor);

                return (
                  <div key={floor} className="group relative flex items-center gap-6 p-6 bg-bg-elevated rounded-[2rem] border border-border-default hover:border-accent-purple/30 transition-all overflow-hidden">
                    <div className="w-16 h-16 bg-bg-base/50 rounded-2xl flex flex-col items-center justify-center border border-white/5 font-black">
                      <span className="text-[10px] text-text-tertiary uppercase tracking-tighter">LVL</span>
                      <span className="text-xl text-text-primary leading-none">0{floor}</span>
                    </div>

                    <div className="flex-1">
                      {existing ? (
                        <div className="flex items-center gap-4">
                          <div className="w-20 h-10 bg-bg-card rounded-lg overflow-hidden border border-white/5 flex items-center justify-center text-[10px] font-mono text-text-tertiary opacity-60">
                            {existing.imagePath.substring(0, 20)}...
                          </div>
                          <p className="text-xs font-bold text-text-primary uppercase tracking-widest truncate max-w-[150px]">
                            Blueprint Active
                          </p>
                        </div>
                      ) : (
                        <p className="text-xs font-bold text-text-tertiary uppercase tracking-widest italic">
                          No overlay tactical data
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {existing && (
                        <button 
                          onClick={() => removePlan(floor)}
                          className="w-10 h-10 text-status-critical hover:bg-status-critical/10 rounded-xl flex items-center justify-center transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                      
                      <label className="cursor-pointer">
                        <input 
                          type="file" 
                          className="hidden" 
                          accept="image/*"
                          onChange={(e) => handleUpload(floor, e)} 
                        />
                        <div className="px-5 py-3 bg-accent-purple/10 text-accent-purple hover:bg-accent-purple/20 border border-accent-purple/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2">
                          <Upload size={14} />
                          {existing ? 'Update' : 'Upload'}
                        </div>
                      </label>
                    </div>

                    {/* Active highlight */}
                    <AnimatePresence>
                      {existing && (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="absolute right-0 top-0 bottom-0 w-1 bg-accent-purple/50 shadow-[0_0_15px_rgba(139,92,246,0.5)]" 
                        />
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 p-6 bg-accent-blue/5 border border-accent-blue/20 rounded-2xl flex gap-4">
              <AlertCircle className="text-accent-blue shrink-0" size={20} />
              <div className="space-y-1">
                <p className="text-[10px] font-black text-accent-blue uppercase tracking-widest">Tactical Asset Guideline</p>
                <p className="text-xs leading-relaxed text-text-secondary">
                  For optimal tactical display, upload architectural SVGs or high-contrast PNGs with transparent backgrounds. 
                  These will be used as dynamic overlays in the responder and dashboard tactical maps.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
