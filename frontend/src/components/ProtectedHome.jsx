import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import HeroSection from './HeroSection';
import API from '../services/api';

function ProtectedHome() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUserStatus();
  }, [navigate]);

  const checkUserStatus = async () => {
    try {
      // Check if user is logged in
      const userInfo = localStorage.getItem('userInfo');
      if (!userInfo) {
        // Not logged in - show hero
        setLoading(false);
        return;
      }

      // User is logged in - check if they have registered events
      try {
        const { data } = await API.get('/api/events/user/my-events');
        
        if (data && data.length > 0) {
          // User has registered events - redirect to dashboard
          navigate('/dashboard', { replace: true });
        } else {
          // User has no registered events - redirect to events page
          navigate('/events', { replace: true });
        }
      } catch (error) {
        console.error('Error checking events:', error);
        // If error, redirect to events page to be safe
        navigate('/events', { replace: true });
      }
    } finally {
      setLoading(false);
    }
  };

  // Get userInfo to determine if logged in
  const userInfo = localStorage.getItem('userInfo');

  // If checking status or logged in (will be redirected), don't show anything
  if (loading || userInfo) {
    return null;
  }

  // If not logged in, show hero section
  return <HeroSection />;
}

export default ProtectedHome;
