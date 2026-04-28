import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './authContext';
import GuestCheckin from './pages/GuestCheckin';
import LandingPage from './pages/LandingPage';
import GuestHome from './pages/GuestHome';
import GuestTrack from './pages/GuestTrack';
import HotelLogin from './pages/HotelLogin';
import HotelRegister from './pages/HotelRegister';
import HotelDashboard from './pages/HotelDashboard';
import HotelSettings from './pages/HotelSettings';
import ResponderLogin from './pages/ResponderLogin';
import ResponderHome from './pages/ResponderHome';
import ResponderAlert from './pages/ResponderAlert';
import ResponderMap from './pages/ResponderMap';
import SystemNavigator from './components/SystemNavigator';

function ProtectedRoute({ children, role }: { children: React.ReactNode, role: string }) {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="h-screen bg-[#080B12] flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-accent-blue border-t-transparent rounded-full animate-spin" />
    </div>
  );
  
  if (!user) {
    if (role === 'guest') return <Navigate to="/guest/checkin" />;
    if (role === 'hotel_staff') return <Navigate to="/hotel/login" />;
    if (role === 'responder') return <Navigate to="/responder/login" />;
    return <Navigate to="/" />;
  }

  // DEMO MODE: Hotel staff and responders can cross-view everything for evaluation.
  // Guests are restricted unless they are also staff.
  const isAuthorized = user.role === role || user.role === 'hotel_staff';

  if (!isAuthorized) {
    // Correct redirection based on their actual role if they try to access unauthorized area
    if (user.role === 'guest') return <Navigate to="/guest/home" />;
    if (user.role === 'responder') return <Navigate to="/responder/home" />;
    if (user.role === 'hotel_staff') return <Navigate to="/hotel/dashboard" />;
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <div className="min-h-screen bg-[#080B12] text-[#F1F5F9] transition-colors duration-300">
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Guest Routes */}
            <Route path="/guest/checkin" element={<GuestCheckin />} />
            <Route path="/guest/home" element={
              <ProtectedRoute role="guest">
                <GuestHome />
              </ProtectedRoute>
            } />
            <Route path="/guest/track/:alertId" element={
              <ProtectedRoute role="guest">
                <GuestTrack />
              </ProtectedRoute>
            } />

            {/* Hotel Routes */}
            <Route path="/hotel/login" element={<HotelLogin />} />
            <Route path="/hotel/register" element={<HotelRegister />} />
            <Route path="/hotel/dashboard" element={
              <ProtectedRoute role="hotel_staff">
                <HotelDashboard />
              </ProtectedRoute>
            } />
            <Route path="/hotel/settings" element={
              <ProtectedRoute role="hotel_staff">
                <HotelSettings />
              </ProtectedRoute>
            } />

            {/* Responder Routes */}
            <Route path="/responder/login" element={<ResponderLogin />} />
            <Route path="/responder/home" element={
              <ProtectedRoute role="responder">
                <ResponderHome />
              </ProtectedRoute>
            } />
            <Route path="/responder/map" element={
              <ProtectedRoute role="responder">
                <ResponderMap />
              </ProtectedRoute>
            } />
            <Route path="/responder/alert/:alertId" element={
              <ProtectedRoute role="responder">
                <ResponderAlert />
              </ProtectedRoute>
            } />

            <Route path="/" element={<LandingPage />} />
          </Routes>
          <SystemNavigator />
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}
