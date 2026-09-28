import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedHome from './components/ProtectedHome';
import CreateEvent from './components/CreateEvent';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import UserDashboard from './components/UserDashboard';
import EventsPage from './components/EventsPage';
import EventDetailPage from './components/EventDetailPage';
import AdminScannerPage from './components/AdminScannerPage';
import AdminEventDetails from './components/AdminEventDetails';
import CompletedEventsAnalytics from './components/CompletedEventsAnalytics';
import EventAnalyticsDashboard from './components/EventAnalyticsDashboard';
import ShowcaseGallery from './components/ShowcaseGallery';
import VerifyCertificate from './components/VerifyCertificate';
import Footer from './components/Footer';
import Toast from './components/Toast';
import './styles/mobile-responsive.css';

function App() {
  return (
    <Router>
      <Toast />
      <div className="min-h-screen flex flex-col selection:bg-cyan-500/30">
        <Navbar />
        <Routes>
          <Route path="/" element={<ProtectedHome />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/create" element={<CreateEvent />} />
          <Route path="/admin/edit/:id" element={<CreateEvent />} />
          <Route path="/admin/events/:eventId/manage" element={<AdminEventDetails />} />
          <Route path="/admin/scanner/:eventId" element={<AdminScannerPage />} />
          <Route path="/admin/analytics" element={<CompletedEventsAnalytics />} />
          <Route path="/admin/analytics/:eventId" element={<EventAnalyticsDashboard />} />
          <Route path="/showcase" element={<ShowcaseGallery />} />
          <Route path="/gallery" element={<ShowcaseGallery />} />
          <Route path="/credentials/:id" element={<ShowcaseGallery />} />
          <Route path="/verify" element={<VerifyCertificate />} />
          <Route path="/verify-certificate/:certificateNumber" element={<VerifyCertificate />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
