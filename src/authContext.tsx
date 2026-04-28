import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';

interface AuthContextType {
  user: any;
  token: string | null;
  sessions: { [role: string]: { user: any; token: string } };
  login: (token: string, user: any) => void;
  updateUser: (newUser: any) => void;
  logout: (all?: boolean) => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const [sessions, setSessions] = useState<{ [role: string]: { user: any; token: string } }>(() => {
    const saved = localStorage.getItem('crisis_link_sessions');
    return saved ? JSON.parse(saved) : {};
  });
  const [loading, setLoading] = useState(true);

  // Determine current active user based on URL role or last active
  const activeRole = useMemo(() => {
    const path = location.pathname;
    if (path.includes('/hotel')) return 'hotel_staff';
    if (path.includes('/responder')) return 'responder';
    if (path.includes('/guest')) return 'guest';
    return Object.keys(sessions)[0]; // Fallback to first available session
  }, [location.pathname, sessions]);

  const currentSession = useMemo(() => {
    // Priority 1: Exact match for the role in the current URL
    if (activeRole && sessions[activeRole]) return sessions[activeRole];
    
    // Priority 2: In demo mode, hotel_staff can view any portal
    if (sessions['hotel_staff']) return sessions['hotel_staff'];
    
    // Priority 3: Fallback to any active session if we are on a neutral page
    const firstRole = Object.keys(sessions)[0];
    return firstRole ? sessions[firstRole] : null;
  }, [activeRole, sessions]);

  const user = currentSession?.user || null;
  const token = currentSession?.token || null;

  useEffect(() => {
    // Sync storage
    localStorage.setItem('crisis_link_sessions', JSON.stringify(sessions));
    
    // Set axios header for current active session
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common['Authorization'];
    }
    
    setLoading(false);
  }, [sessions, token]);

  const login = (newToken: string, newUser: any) => {
    const role = newUser.role;
    setSessions(prev => ({
      ...prev,
      [role]: { token: newToken, user: newUser }
    }));
  };

  const updateUser = (newUser: any) => {
    const role = newUser.role;
    setSessions(prev => {
      if (!prev[role]) return prev;
      return {
        ...prev,
        [role]: { ...prev[role], user: newUser }
      };
    });
  };

  const logout = (all = true) => {
    if (all) {
      setSessions({});
      localStorage.removeItem('crisis_link_sessions');
    } else if (activeRole) {
      setSessions(prev => {
        const next = { ...prev };
        delete next[activeRole];
        return next;
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, sessions, login, updateUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
