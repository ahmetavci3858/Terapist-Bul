import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import ProfileSetup from './pages/ProfileSetup';
import RequestDetails from './pages/RequestDetails';
import AuthPage from './pages/AuthPage';
import RegisterSeeker from './pages/RegisterSeeker';
import RegisterProvider from './pages/RegisterProvider';
import VerificationPending from './pages/VerificationPending';
import AdminDashboard from './pages/AdminDashboard';

import Profile from './pages/Profile';
import EditProfile from './pages/EditProfile';
import Providers from './pages/Providers';
import CreateRequest from './pages/CreateRequest';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, profile } = useAuth();

    if (loading) return <div className="flex items-center justify-center h-screen">Yükleniyor...</div>;
    if (!user) return <Navigate to="/auth" />;
    
    // If profile is still loading or null, wait a bit before redirecting to profile-setup
    // This handles the race condition during registration
    if (!profile || profile.setupComplete === false) {
      if (window.location.pathname === '/dashboard') {
        return <div className="flex items-center justify-center h-screen">Profil yükleniyor...</div>;
      }
      if (window.location.pathname !== '/profile-setup') {
        return <Navigate to="/profile-setup" />;
      }
    }
    
    if (profile?.status === 'pending' && 
        window.location.pathname !== '/verification-pending' && 
        window.location.pathname !== '/' &&
        window.location.pathname !== '/dashboard' &&
        window.location.pathname !== '/profile' &&
        !window.location.pathname.startsWith('/request/')) {
      return <Navigate to="/verification-pending" />;
    }
  
    return <>{children}</>;
  };

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-stone-50 text-stone-900 font-sans">
          <Navbar />
          <main className="container mx-auto px-4 py-8">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/register/seeker" element={<RegisterSeeker />} />
              <Route path="/register/provider" element={<RegisterProvider />} />
              <Route path="/providers" element={<Providers />} />
              <Route path="/create-request" element={<ProtectedRoute><CreateRequest /></ProtectedRoute>} />
              <Route path="/verification-pending" element={<VerificationPending />} />
              <Route path="/profile-setup" element={<ProtectedRoute><ProfileSetup /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />
              <Route path="/request/:id" element={<ProtectedRoute><RequestDetails /></ProtectedRoute>} />
              <Route path="/profile/:uid" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
