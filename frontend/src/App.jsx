import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import CreateEvent from './components/CreateEvent';
import AdminDashboard from './components/AdminDashboard';
import Login from './components/Login';
import Signup from './components/Signup';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import UserDashboard from './components/UserDashboard';
import EventsPage from './components/EventsPage';
import AdminScannerPage from './components/AdminScannerPage';
import AdminEventDetails from './components/AdminEventDetails';
import CompletedEventsAnalytics from './components/CompletedEventsAnalytics';
import EventAnalyticsDashboard from './components/EventAnalyticsDashboard';
import Footer from './components/Footer';
import './styles/mobile-responsive.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col selection:bg-cyan-500/30">
        <Navbar />
        <Routes>
          <Route path="/" element={<HeroSection />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/create" element={<CreateEvent />} />
          <Route path="/admin/edit/:id" element={<CreateEvent />} />
          <Route path="/admin/events/:eventId/manage" element={<AdminEventDetails />} />
          <Route path="/admin/scanner/:eventId" element={<AdminScannerPage />} />
          <Route path="/admin/analytics" element={<CompletedEventsAnalytics />} />
          <Route path="/admin/analytics/:eventId" element={<EventAnalyticsDashboard />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
