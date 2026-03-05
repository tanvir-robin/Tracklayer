import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { useEffect } from 'react';
import { AuthProvider } from './hooks/useAuth';
import ProtectedRoute from './components/ProtectedRoute';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Assets from './pages/Assets';
import AssetDetail from './pages/AssetDetail';
import PublicAnalytics from './pages/PublicAnalytics';
import Contact from './pages/Contact';

function GA4RouteTracker() {
  const location = useLocation();
  useEffect(() => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
    });
  }, [location]);
  return null;
}

export default function App() {
  return (
    <HelmetProvider>
    <AuthProvider>
      <BrowserRouter>
        <GA4RouteTracker />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          {/* Public analytics page — no auth required */}
          <Route path="/public/:tracking_id" element={<PublicAnalytics />} />
          <Route
            path="/dashboard"
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
          />
          <Route
            path="/assets"
            element={<ProtectedRoute><Assets /></ProtectedRoute>}
          />
          <Route
            path="/assets/:id"
            element={<ProtectedRoute><AssetDetail /></ProtectedRoute>}
          />
          <Route
            path="/contact"
            element={<ProtectedRoute><Contact /></ProtectedRoute>}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </HelmetProvider>
  );
}
