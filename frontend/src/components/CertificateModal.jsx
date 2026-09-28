import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  Share2,
  CheckCircle,
  Eye,
  EyeOff,
  ExternalLink,
  Award,
  ShieldCheck,
  Calendar,
  MapPin,
  Copy,
  Printer
} from 'lucide-react';
import API from '../services/api';

const CertificateModal = ({ certificate, onClose, onUpdate }) => {
  const [isPublic, setIsPublic] = useState(certificate?.isPublic ?? true);
  const [copied, setCopied] = useState(false);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);

  if (!certificate) return null;

  const certNumber = certificate.certificateNumber;
  const verifyUrl = `${window.location.origin}/verify-certificate/${certNumber}`;
  const pdfDownloadUrl = `${API.defaults.baseURL || ''}/api/certificates/${certNumber}/pdf`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePrivacy = async () => {
    try {
      setUpdatingPrivacy(true);
      const { data } = await API.put(`/api/certificates/${certificate._id}/privacy`, {
        isPublic: !isPublic
      });
      setIsPublic(data.certificate.isPublic);
      if (onUpdate) onUpdate(data.certificate);
    } catch (error) {
      console.error('Failed to toggle privacy:', error);
    } finally {
      setUpdatingPrivacy(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = certificate.eventDate
    ? new Date(certificate.eventDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : new Date(certificate.issuedAt || Date.now()).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-4xl bg-[#0f172a] border border-cyan-500/30 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden my-auto"
        >
          {/* Top Bar with Controls */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-white/5">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-cyan-400" />
              <span className="text-white font-semibold text-sm sm:text-base">
                Verified Credential • {certNumber}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Privacy toggle if owner */}
              {certificate._id && (
                <button
                  onClick={handleTogglePrivacy}
                  disabled={updatingPrivacy}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isPublic
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30'
                      : 'bg-gray-500/20 text-gray-400 border border-gray-500/30 hover:bg-gray-500/30'
                  }`}
                  title="Toggle visibility in public showcase gallery"
                >
                  {isPublic ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{isPublic ? 'Public in Showcase' : 'Private'}</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Certificate Body (Printable area) */}
          <div className="p-4 sm:p-8">
            <div
              id="printable-certificate"
              className="relative p-6 sm:p-12 rounded-xl sm:rounded-2xl border-2 border-cyan-400/40 bg-gradient-to-b from-[#0b0f19] to-[#0d1527] shadow-inner text-center overflow-hidden"
              style={{
                boxShadow: '0 0 50px rgba(6, 182, 212, 0.15) inset'
              }}
            >
              {/* Inner Double Accent Border */}
              <div className="absolute inset-2 sm:inset-3 border border-amber-500/30 rounded-lg pointer-events-none" />

              {/* Watermark Logo/Text */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none select-none text-white text-9xl font-black">
                EVENTSYNC
              </div>

              {/* Header */}
              <div className="relative z-10 mb-4 sm:mb-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs tracking-widest font-semibold uppercase mb-2">
                  ✦ EventSync Verified Credentials ✦
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-wider uppercase">
                  Certificate of {certificate.certificateType || 'Completion'}
                </h1>
                <p className="text-xs sm:text-sm text-gray-400 tracking-wider uppercase mt-1">
                  This is officially presented and verified for
                </p>
              </div>

              {/* Recipient Name */}
              <div className="relative z-10 my-4 sm:my-6">
                <h2 className="text-2xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-amber-300">
                  {certificate.recipientName}
                </h2>
                <div className="w-48 sm:w-64 h-0.5 mx-auto bg-gradient-to-r from-transparent via-amber-400 to-transparent mt-2" />
              </div>

              {/* Achievement description */}
              <div className="relative z-10 max-w-xl mx-auto mb-6 text-xs sm:text-sm text-gray-300 leading-relaxed">
                for successful active participation and demonstrated excellence in
                <div className="text-lg sm:text-2xl font-bold text-white mt-1">
                  "{certificate.eventName}"
                </div>
              </div>

              {/* Event Metadata */}
              <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 text-xs sm:text-sm text-gray-400 mb-8">
                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>{formattedDate}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-pink-400" />
                  <span>{certificate.eventLocation || 'Online Session'}</span>
                </div>
              </div>

              {/* Footer details: QR Code, Seal, Signature */}
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center pt-6 border-t border-white/10">
                {/* Left: QR Code & Verification */}
                <div className="flex items-center justify-center sm:justify-start gap-3">
                  {certificate.qrCodeDataUrl ? (
                    <img
                      src={certificate.qrCodeDataUrl}
                      alt="Verification QR"
                      className="w-20 h-20 bg-white p-1 rounded-lg shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-white/10 rounded-lg flex items-center justify-center">
                      <ShieldCheck className="w-8 h-8 text-cyan-400" />
                    </div>
                  )}
                  <div className="text-left text-xs">
                    <div className="text-cyan-400 font-semibold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Verified Credential</span>
                    </div>
                    <div className="text-gray-400 text-[10px] mt-0.5 font-mono truncate max-w-[120px]">
                      ID: {certNumber}
                    </div>
                    <div className="text-green-400 text-[10px] font-semibold mt-0.5">
                      Status: Active ✓
                    </div>
                  </div>
                </div>

                {/* Middle: Official Seal */}
                <div className="flex justify-center">
                  <div className="w-20 h-20 rounded-full border-2 border-amber-400/60 p-1 flex items-center justify-center bg-amber-500/10 shadow-lg shadow-amber-500/10">
                    <div className="w-full h-full rounded-full border border-cyan-400/50 flex flex-col items-center justify-center text-[9px] text-amber-300 font-bold uppercase tracking-tighter">
                      <span>EventSync</span>
                      <span className="text-[7px] text-cyan-300">★ ★ ★</span>
                      <span>Verified</span>
                    </div>
                  </div>
                </div>

                {/* Right: Signature */}
                <div className="text-center sm:text-right">
                  <div className="inline-block border-b border-gray-500 pb-1 px-4">
                    <span className="font-serif italic text-cyan-300 text-lg">
                      EventSync Authority
                    </span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1 font-medium">
                    Authorized Issuing Authority
                  </div>
                  <div className="text-[9px] text-gray-500">
                    Cryptographically Validated
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 border-t border-white/10 bg-white/5">
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Link Copied!' : 'Copy Verify URL'}</span>
              </button>

              <a
                href={verifyUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Verify Publicly</span>
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>

              <a
                href={pdfDownloadUrl}
                target="_blank"
                rel="noreferrer"
                download={`Certificate-${certNumber}.pdf`}
                className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-cyan-500/25 transition-all transform hover:-translate-y-0.5 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download High-Res PDF</span>
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CertificateModal;
