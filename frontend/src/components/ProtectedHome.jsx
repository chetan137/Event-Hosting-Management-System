import React from 'react';
import HeroSection from './HeroSection';

function ProtectedHome() {
  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  return (
    <div className="bg-[#121212] text-white">
      <HeroSection />
      
      {/* Temporary Showcase Section for scrolling demonstration */}
      <div id="showcase" className="min-h-[80vh] flex flex-col items-center justify-center p-10 border-t border-white/10 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none" />
        
        <h2 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent text-center">
          Event Showcase Gallery
        </h2>
        <p className="text-gray-400 text-lg mb-10 max-w-2xl text-center">
          Team Foxtrot is currently building the showcase features here. 
          When they merge their code, you will see attendee credentials and highlight reels in this space.
        </p>
        
        <button 
          onClick={scrollToTop}
          className="px-6 py-3 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 transition-colors flex items-center gap-2 text-gray-300 hover:text-white"
        >
          <span>↑</span> Scroll back up
        </button>
      </div>
    </div>
  );
}

export default ProtectedHome;
