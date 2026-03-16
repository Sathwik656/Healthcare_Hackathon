import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import './i18n/config';

// Layout
import Layout from './components/Layout/Layout';

// Landing Page
import Landing from './pages/Landing/Landing';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';

// Patient Pages
import PatientDashboard from './pages/Patient/Dashboard';
import Doctors from './pages/Patient/Doctors';
import BookAppointment from './pages/Patient/BookAppointment';
import MyAppointments from './pages/Patient/MyAppointments';
import PatientProfile from './pages/Patient/Profile';

// Doctor Pages
import DoctorDashboard from './pages/Doctor/Dashboard';
import DoctorRequests from './pages/Doctor/Requests';
import DoctorProfile from './pages/Doctor/Profile';
import PreviousAppointments from './pages/Doctor/PreviousAppointments';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import ManageDoctors from './pages/Admin/ManageDoctors';
import ManageHealthCenters from './pages/Admin/ManageHealthCenters';
import SetAvailability from './pages/Doctor/MyAvailability';
import VerifyOtp from './pages/Auth/VerifyOtp';

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: string[] }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user && !allowedRoles.includes(user.role as string)) {
    // Redirect to their respective dashboard if they try to access unauthorized routes
    if (user.role === 'patient') return <Navigate to="/patient/dashboard" replace />;
    if (user.role === 'doctor') return <Navigate to="/doctor/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOtp />} />

        {/* Protected Routes */}
        <Route element={<Layout />}>
          {/* Patient Routes */}
          <Route path="/patient/dashboard" element={<ProtectedRoute allowedRoles={['patient']}><PatientDashboard /></ProtectedRoute>} />
          <Route path="/patient/doctors" element={<ProtectedRoute allowedRoles={['patient']}><Doctors /></ProtectedRoute>} />
          <Route path="/patient/book" element={<ProtectedRoute allowedRoles={['patient']}><BookAppointment /></ProtectedRoute>} />
          <Route path="/patient/appointments" element={<ProtectedRoute allowedRoles={['patient']}><MyAppointments /></ProtectedRoute>} />
          <Route path="/patient/profile" element={<ProtectedRoute allowedRoles={['patient']}><PatientProfile /></ProtectedRoute>} />

          {/* Doctor Routes */}
          <Route path="/doctor/dashboard" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorDashboard /></ProtectedRoute>} />
          <Route path="/doctor/requests" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorRequests /></ProtectedRoute>} />
          <Route path="/doctor/availability" element={<ProtectedRoute allowedRoles={['doctor']}><SetAvailability /></ProtectedRoute>} />
          <Route path="/doctor/previous-appointments" element={<ProtectedRoute allowedRoles={['doctor']}><PreviousAppointments /></ProtectedRoute>} />
          <Route path="/doctor/profile" element={<ProtectedRoute allowedRoles={['doctor']}><DoctorProfile /></ProtectedRoute>} />

          {/* Admin Routes */}
          <Route path="/admin/dashboard" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/doctors" element={<ProtectedRoute allowedRoles={['admin']}><ManageDoctors /></ProtectedRoute>} />
          <Route path="/admin/health-centers" element={<ProtectedRoute allowedRoles={['admin']}><ManageHealthCenters /></ProtectedRoute>} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
