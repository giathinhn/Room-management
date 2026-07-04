import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';

// Pages
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import RoomsPage from './pages/RoomsPage';
import RoomDetailPage from './pages/RoomDetailPage';
import RoomSearchPage from './pages/RoomSearchPage';
import BookingsPage from './pages/BookingsPage';
import BookingCreatePage from './pages/BookingCreatePage';
import BookingDetailPage from './pages/BookingDetailPage';
import NotFoundPage from './pages/NotFoundPage';
import CalendarPage from './pages/CalendarPage';
import NotificationsPage from './pages/NotificationsPage';
import TemplatesPage from './pages/TemplatesPage';
import UsersPage from './pages/UsersPage';
import FloorMapPage from './pages/FloorMapPage';
import QuickBookPage from './pages/QuickBookPage';
import RoomQRPrintPage from './pages/RoomQRPrintPage';
import SettingsPage from './pages/SettingsPage';

import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* ── Public routes ─────────────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* ── Protected routes (all authenticated users) ────────── */}
          <Route element={<ProtectedRoute />}>
            <Route path="/rooms/:id/quick-book" element={<QuickBookPage />} />
            <Route path="/rooms/:id/qr"         element={<RoomQRPrintPage />} />

            <Route element={<AppLayout />}>
              <Route path="/dashboard"          element={<DashboardPage />} />
              <Route path="/profile"            element={<ProfilePage />} />
              <Route path="/rooms"              element={<RoomsPage />} />
              <Route path="/rooms/search"       element={<RoomSearchPage />} />
              <Route path="/rooms/:id"          element={<RoomDetailPage />} />
              <Route path="/bookings"           element={<BookingsPage />} />
              <Route path="/bookings/new"       element={<BookingCreatePage />} />
              <Route path="/bookings/:id"       element={<BookingDetailPage />} />
              <Route path="/calendar"           element={<CalendarPage />} />
              <Route path="/notifications"      element={<NotificationsPage />} />
              <Route path="/templates"          element={<TemplatesPage />} />
              <Route path="/floor-map"          element={<FloorMapPage />} />
              <Route path="/settings"           element={<SettingsPage />} />
            </Route>
          </Route>

          {/* ── Protected routes (admin only) ────────────────────── */}
          <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
            <Route element={<AppLayout />}>
              <Route path="/admin/users" element={<UsersPage />} />
            </Route>
          </Route>

          {/* ── Default redirects ─────────────────────────────────── */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        {/* Global toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1e1e35',
              color: '#f1f5f9',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '10px',
              fontSize: '14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            },
            success: {
              iconTheme: { primary: '#22c55e', secondary: '#fff' },
            },
            error: {
              iconTheme: { primary: '#ef4444', secondary: '#fff' },
            },
          }}
        />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
