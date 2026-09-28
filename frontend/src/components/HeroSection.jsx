import React from 'react';
import { Play, Speaker, Box, Smartphone, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SHOWCASE_PATH = '/showcase';

const HeroSection = () => {
  const videoRef = React.useRef(null);
  const navigate = useNavigate();

  React.useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play().catch(error => {
        console.error("Video play failed:", error);
      });
    }
  }, []);

  const handleGatherNow = () => {
    const userInfo = localStorage.getItem('userInfo');
    if (!userInfo) {
      navigate('/login');
    } else {
      const user = JSON.parse(userInfo);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard'); // User dashboard
      }
    }
  };

  return (
    <div className="relative min-h-screen bg-[#121212] flex items-center justify-center overflow-hidden">
      {/* Background Radial Glow */}
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/20 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/4 right-[10%] w-[400px] h-[400px] bg-cyan-500/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="w-full max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">

        {/* Left Content */}
        <div className="flex flex-col space-y-8 animate-fade-in">
          {/* Logo */}
<br /><br /><br />

          {/* Heading */}
          <h1 className="text-6xl md:text-8xl font-black leading-tight">
            <span className="bg-gradient-to-r from-cyan-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Elevate Your <br /> Events.
            </span>
          </h1>

          {/* Description */}
          <p className="text-gray-400 text-lg md:text-xl max-w-lg leading-relaxed">
            Experience the future of event management with high-fidelity visuals,
            seamless coordination, and immersive digital portals. Designed for the bold.
          </p>

          {/* CTA Button */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleGatherNow}
              className="px-8 py-4 bg-gradient-to-r from-pink-500 to-blue-600 text-white font-bold rounded-2xl hover:shadow-[0_0_20px_rgba(255,0,204,0.4)] hover:scale-105 active:scale-95 transition-all duration-200 group"
            >
              <span className="flex items-center space-x-2">
                <span>Gather Now</span>
                <ExternalLink size={20} />
              </span>
            </button>
            <button 
              onClick={() => {
                const el = document.getElementById('showcase');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="text-gray-300 font-medium hover:text-white hover:border-white cursor-pointer transition-colors border-b border-gray-600 pb-1"
            >
              View Showcase
            </button>
          </div>
        </div>

        {/* Right Content - Portal */}
        <div className="relative flex items-center justify-center h-[500px] lg:h-[700px]">

          {/* Circular Portal Background */}
          {/* Circular Portal Background */}
          <div className="absolute w-[350px] h-[350px] md:w-[580px] md:h-[580px] rounded-full border border-white/10 bg-black shadow-2xl overflow-hidden animate-scale-in">
            {/* Video Player - Full Cover */}
            <div className="absolute inset-0 w-full h-full">
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                loop
                muted
                playsInline
              >
                <source src="/v1.mp4" type="video/mp4" />
              </video>

              {/* Subtle Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

              {/* Minimal Player UI Overlay */}
              {/* <div className="absolute bottom-10 inset-x-0 flex justify-center items-center">
                 <div className="px-1 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center space-x-4">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
                       <Play size={14} className="text-white fill-white" />
                    </div>
                    <div className="w-32 h-1 bg-white/20 rounded-full overflow-hidden">
                       <div className="h-full w-[65%] bg-cyan-400 shadow-[0_0_10px_#00FFFF] animate-progress" />
                    </div>
                 </div>
              </div> */}
            </div>
          </div>

          {/* Floating 3D Elements */}

          {/* Floating Speaker 1 */}
          <div className="absolute top-[10%] left-0 z-20 animate-float-slow">
            <div className="p-4 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl">
              <Speaker className="text-pink-500 w-12 h-12" />
              <div className="absolute -inset-0.5 bg-gradient-to-br from-pink-500/50 to-purple-500/50 blur opacity-30 -z-10" />
            </div>
          </div>

          {/* Floating Cube */}
          <div className="absolute bottom-[20%] left-[5%] z-20 animate-float-medium">
            <div className="p-3 bg-white/10 backdrop-blur-lg border border-white/20 rounded-xl">
              <Box className="text-cyan-400 w-10 h-10" />
            </div>
          </div>

          {/* Floating Smartphone */}
          <div className="absolute top-[20%] right-[-5%] z-20 animate-float-fast">
            <div className="p-4 bg-black/40 backdrop-blur-2xl border border-white/20 rounded-[2rem] shadow-2xl relative">
              <Smartphone className="text-purple-400 w-16 h-16" />
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/20 rounded-full" />
            </div>
          </div>

          {/* Additional Floating Shape */}
          <div className="absolute top-[60%] right-[10%] w-12 h-12 bg-pink-500/20 blur-xl rounded-full animate-pulse-glow" />

        </div>
      </div>

      {/* Decorative Particle Elements */}
      <div className="absolute bottom-10 left-10 w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_10px_#00FFFF]" />
      <div className="absolute top-20 right-40 w-3 h-3 bg-pink-500 rounded-full animate-pulse shadow-[0_0_10px_#FF00CC]" />

      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }

        @keyframes scale-in {
          from { opacity: 0; transform: scale(0.8); }
          to { opacity: 1; transform: scale(1); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }

        @keyframes float-slow {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }

        @keyframes float-medium {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(30px) rotate(-10deg); }
        }

        @keyframes float-fast {
          0%, 100% { transform: translateY(-10px) rotate(5deg); }
          50% { transform: translateY(10px) rotate(-5deg); }
        }

        @keyframes progress {
          0% { width: 0%; }
          50% { width: 65%; }
          100% { width: 0%; }
        }

        @keyframes pulse-glow {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.1); }
        }

        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }

        .animate-scale-in {
          animation: scale-in 1s ease-out;
        }

        .animate-float {
          animation: float 4s ease-in-out infinite;
        }

        .animate-float-slow {
          animation: float-slow 4s ease-in-out infinite;
        }

        .animate-float-medium {
          animation: float-medium 5s ease-in-out infinite;
          animation-delay: 0.5s;
        }

        .animate-float-fast {
          animation: float-fast 6s ease-in-out infinite;
        }

        .animate-progress {
          animation: progress 4s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default HeroSection;
