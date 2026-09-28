import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Share2,
  CheckCircle,
  Copy,
  Award,
  Calendar,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  FileText,
  Image as ImageIcon,
  Loader2,
  Check
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { downloadCredentialPNG, downloadCredentialPDF } from '../utils/credentialDownload';

const CredentialModal = ({ credential, onClose }) => {
  const [downloadingPNG, setDownloadingPNG] = useState(false);
  const [downloadingPDF, setDownloadingPDF] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showVerificationDetails, setShowVerificationDetails] = useState(false);

  if (!credential) return null;

  // Trigger celebration confetti on mount
  React.useEffect(() => {
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#06b6d4', '#ec4899', '#eab308', '#3b82f6']
      });
    } catch (e) {
      // safe fallback
    }
  }, []);

  const verifyUrl = `${window.location.origin}/showcase?id=${credential.credentialId || credential._id}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(verifyUrl);
    setCopied(true);
    if (window.showToast) {
      window.showToast('Credential verification link copied to clipboard! 📋', 'success', 2500);
    }
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPNG = async () => {
    try {
      setDownloadingPNG(true);
      await downloadCredentialPNG(credential);
      if (window.showToast) {
        window.showToast('PNG Credential downloaded successfully! 🎉', 'success', 3000);
      }
    } catch (err) {
      console.error(err);
      if (window.showToast) {
        window.showToast('Failed to download PNG credential. Please retry.', 'error', 3000);
      }
    } finally {
      setDownloadingPNG(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloadingPDF(true);
      await downloadCredentialPDF(credential);
      if (window.showToast) {
        window.showToast('PDF Certificate downloaded successfully! 📄', 'success', 3000);
      }
    } catch (err) {
      console.error(err);
      if (window.showToast) {
        window.showToast('Failed to download PDF certificate. Please retry.', 'error', 3000);
      }
    } finally {
      setDownloadingPDF(false);
    }
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent(`I'm excited to share my verified credential for "${credential.eventName}" on @EventSync! 🎓 Verify here:`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(verifyUrl)}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`, '_blank');
  };

  const eventDateFormatted = credential.eventDate
    ? new Date(credential.eventDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date().toLocaleDateString();

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-md transition-all"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative w-full max-w-4xl bg-[#12161f] border border-cyan-500/30 rounded-3xl shadow-[0_0_50px_rgba(6,182,212,0.15)] overflow-hidden z-10 my-auto flex flex-col max-h-[92vh]"
        >
          {/* Top Status & Controls Bar */}
          <div className="flex items-center justify-between px-5 py-4 bg-white/5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
                <span>Verified Ledger Record</span>
              </div>
              <span className="text-gray-500 hidden sm:inline">•</span>
              <div className="hidden sm:flex items-center gap-1 font-mono text-xs text-gray-300 bg-white/10 px-2.5 py-1 rounded-md">
                <span>{credential.credentialId || 'ES-2026-VERIFIED'}</span>
                <button
                  onClick={handleCopyLink}
                  title="Copy verification link"
                  className="hover:text-cyan-400 transition-colors ml-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-gray-300 hover:text-white transition-all sm:hidden"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                aria-label="Close modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Scrollable Center: The Certificate Display */}
          <div className="overflow-y-auto p-4 sm:p-7 space-y-6">
            {/* The High-Fidelity Certificate Card */}
            <div className="relative rounded-2xl bg-gradient-to-br from-[#0c1017] via-[#121824] to-[#090d14] border-2 border-cyan-500/40 p-5 sm:p-8 shadow-2xl overflow-hidden">
              {/* Double inner border */}
              <div className="absolute inset-2 sm:inset-3 border border-yellow-500/30 rounded-xl pointer-events-none" />

              {/* Watermark Logo & Header */}
              <div className="text-center relative z-10 mb-4 sm:mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[11px] sm:text-xs font-semibold tracking-wider uppercase mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>EventSync Accreditation Ledger</span>
                </div>
                <h2 className="text-xl sm:text-3xl font-extrabold uppercase tracking-wide bg-gradient-to-r from-cyan-400 via-pink-400 to-yellow-400 bg-clip-text text-transparent">
                  {credential.credentialType || 'Certificate of Attendance'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-400 italic mt-1 font-serif">
                  This official credential is proudly presented to
                </p>
              </div>

              {/* Recipient Name */}
              <div className="text-center relative z-10 mb-4 sm:mb-6">
                <div className="text-2xl sm:text-4xl font-black text-white tracking-wide">
                  {credential.recipientName || 'Verified Attendee'}
                </div>
                <div className="w-36 sm:w-56 h-0.5 bg-gradient-to-r from-transparent via-yellow-500 to-transparent mx-auto mt-2" />
              </div>

              {/* Statement & Event Info */}
              <div className="text-center relative z-10 max-w-2xl mx-auto space-y-3 mb-6">
                <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                  {credential.description ||
                    `For distinguished attendance, participation, and completion of all track requirements in:`}
                </p>
                <div className="text-lg sm:text-2xl font-bold text-cyan-400">
                  {credential.eventName}
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-gray-400">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    {eventDateFormatted}
                  </span>
                  <span className="text-gray-600">•</span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-pink-400" />
                    {credential.location || (credential.locationType === 'online' ? 'Online Event' : 'Main Venue')}
                  </span>
                </div>

                {/* Skills/Tags */}
                {credential.skills && credential.skills.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5 pt-2">
                    {credential.skills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 bg-white/5 border border-white/10 rounded-full text-[11px] text-gray-300"
                      >
                        ✦ {skill}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Certificate Bottom Section: QR Code, Official Seal & Signatures */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center pt-6 border-t border-white/10 relative z-10">
                {/* 1. Dynamic QR Code */}
                <div className="flex flex-col items-center md:items-start text-center md:text-left">
                  <div className="p-2 bg-white rounded-xl shadow-lg inline-block">
                    <QRCodeSVG
                      value={verifyUrl}
                      size={90}
                      level="H"
                      includeMargin={false}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium mt-1.5 flex items-center gap-1">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    Scan to verify validity
                  </span>
                </div>

                {/* 2. Official Seal Stamp in Center */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-600 via-yellow-400 to-yellow-200 p-1 shadow-lg flex items-center justify-center">
                    <div className="w-full h-full rounded-full border-2 border-yellow-800 bg-gradient-to-b from-yellow-500 to-yellow-600 flex flex-col items-center justify-center text-center text-yellow-950 font-black">
                      <Award className="w-6 h-6 text-yellow-950" />
                      <span className="text-[9px] uppercase tracking-tighter">VERIFIED</span>
                      <span className="text-[8px] font-bold">2026</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold text-gray-300 mt-2">
                    {credential.credentialId || 'ES-2026-VERIFIED'}
                  </span>
                </div>

                {/* 3. Authorized Signature on Right */}
                <div className="flex flex-col items-center md:items-end text-center md:text-right">
                  <div className="font-serif italic text-lg sm:text-xl text-cyan-300 font-bold tracking-wide">
                    Chetan Shende
                  </div>
                  <div className="w-36 h-px bg-white/30 my-1" />
                  <div className="text-xs font-semibold text-white">Chetan Shende</div>
                  <div className="text-[10px] text-gray-400">
                    {credential.issuerTitle || 'Director of Operations, EventSync'}
                  </div>
                </div>
              </div>
            </div>

            {/* Instant Download & Sharing Action Bar */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h4 className="text-white font-bold text-sm sm:text-base flex items-center justify-center sm:justify-start gap-2">
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                    Instant Export & Verification
                  </h4>
                  <p className="text-gray-400 text-xs mt-0.5">
                    Download official high-resolution documents or share to your professional profile
                  </p>
                </div>

                {/* The Two Instant Download Buttons */}
                <div className="flex items-center gap-3 w-full sm:w-auto">
                  {/* Instant PNG Download Button */}
                  <button
                    onClick={handleDownloadPNG}
                    disabled={downloadingPNG}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {downloadingPNG ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Rendering...</span>
                      </>
                    ) : (
                      <>
                        <ImageIcon className="w-4 h-4" />
                        <span>Download PNG</span>
                      </>
                    )}
                  </button>

                  {/* Instant PDF Download Button */}
                  <button
                    onClick={handleDownloadPDF}
                    disabled={downloadingPDF}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-400 hover:to-purple-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-pink-500/20 hover:shadow-pink-500/40 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {downloadingPDF ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4" />
                        <span>Download PDF</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Social Share & Verification details toggle */}
              <div className="flex flex-wrap items-center justify-between gap-3 mt-4 pt-4 border-t border-white/10 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">Share to:</span>
                  <button
                    onClick={shareOnLinkedIn}
                    className="px-2.5 py-1 bg-[#0A66C2]/20 hover:bg-[#0A66C2]/30 text-[#0A66C2] border border-[#0A66C2]/40 rounded-lg font-medium transition-all"
                  >
                    LinkedIn
                  </button>
                  <button
                    onClick={shareOnTwitter}
                    className="px-2.5 py-1 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/40 rounded-lg font-medium transition-all"
                  >
                    X (Twitter)
                  </button>
                  <button
                    onClick={handleCopyLink}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Link'}</span>
                  </button>
                </div>

                <button
                  onClick={() => setShowVerificationDetails(!showVerificationDetails)}
                  className="text-cyan-400 hover:text-cyan-300 font-semibold transition-colors flex items-center gap-1"
                >
                  <span>{showVerificationDetails ? 'Hide Security Details' : 'Verify Authenticity'}</span>
                </button>
              </div>

              {/* Expandable Cryptographic Security Details */}
              {showVerificationDetails && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs"
                >
                  <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-1">
                    <span className="text-gray-400">Ledger Hash (SHA-256):</span>
                    <p className="font-mono text-cyan-300 break-all">
                      {credential.verificationHash || '9a72b8c5e13d4f00389c72e9'}
                    </p>
                  </div>
                  <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-1">
                    <span className="text-gray-400">Issuing Authority:</span>
                    <p className="text-white font-medium">
                      {credential.issuer || 'EventSync Official Organization'}
                    </p>
                  </div>
                  <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-1">
                    <span className="text-gray-400">Verification URL:</span>
                    <p className="font-mono text-gray-300 truncate">
                      {verifyUrl}
                    </p>
                  </div>
                  <div className="bg-black/30 p-2.5 rounded-lg border border-white/5 space-y-1">
                    <span className="text-gray-400">Timestamp:</span>
                    <p className="text-white font-medium">
                      {new Date(credential.issueDate || Date.now()).toUTCString()}
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CredentialModal;
