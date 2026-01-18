import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Instagram, Linkedin, Github } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#0A0A0A] border-t border-white/5 pt-20 pb-10 px-6 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Brand */}
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="flex items-center space-x-2 mb-6 pointer-events-auto inline-block">
              <img
                src="/logo.png"
                alt="EventSync"
                className="w-12 h-12 object-contain"
              />
              <span className="text-white text-2xl font-bold tracking-tight">EventSync</span>
            </Link>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              The next generation event hosting platform. Create, manage, and experience events like never before.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-cyan-400 transition-all">
                <Twitter size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-pink-500 transition-all">
                <Instagram size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-purple-500 transition-all">
                <Linkedin size={18} />
              </a>
              <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-all">
                <Github size={18} />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="text-white font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link to="/" className="hover:text-cyan-400 transition-colors">Features</Link></li>
              <li><Link to="/" className="hover:text-cyan-400 transition-colors">Integrations</Link></li>
              <li><Link to="/" className="hover:text-cyan-400 transition-colors">Pricing</Link></li>
              <li><Link to="/" className="hover:text-cyan-400 transition-colors">Changelog</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-white font-bold mb-6">Resources</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link to="/" className="hover:text-pink-500 transition-colors">Documentation</Link></li>
              <li><Link to="/" className="hover:text-pink-500 transition-colors">API Reference</Link></li>
              <li><Link to="/" className="hover:text-pink-500 transition-colors">Community</Link></li>
              <li><Link to="/" className="hover:text-pink-500 transition-colors">Help Center</Link></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-bold mb-6">Company</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link to="/" className="hover:text-purple-500 transition-colors">About</Link></li>
              <li><Link to="/" className="hover:text-purple-500 transition-colors">Careers</Link></li>
              <li><Link to="/" className="hover:text-purple-500 transition-colors">Blog</Link></li>
              <li><Link to="/" className="hover:text-purple-500 transition-colors">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between text-xs text-gray-600">
          <p>© 2026 EventSync Inc. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
            <Link to="/" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
