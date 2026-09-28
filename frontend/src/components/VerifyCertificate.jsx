import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Award,
  Download,
  Share2,
  Calendar,
  MapPin,
  Search,
  ExternalLink,
  Copy,
  ChevronLeft,
  Lock,
  ArrowRight
} from 'lucide-react';
import API from '../services/api';
import CertificateModal from './CertificateModal';

const VerifyCertificate = () => {
  const { certificateNumber } = useParams();
  const navigate = useNavigate();

  const [inputNumber, setInputNumber] = useState(certificateNumber || '');
  const [loading, setLoading] = useState(false);
  const [verificationData, setVerificationData] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);

  useEffect(() => {
    if (certificateNumber) {
      setInputNumber(certificateNumber);
      handleVerify(certificateNumber);
    }
  }, [certificateNumber]);

  const handleVerify = async (certNum) => {
    const numToTest = certNum || inputNumber;
    if (!numToTest || !numToTest.trim()) return;

    try {
      setLoading(true);
      setError(null);
      setVerificationData(null);

      const { data } = await API.get(
        `/api/certificates/verify/${encodeURIComponent(numToTest.trim().toUpperCase())}`
      );
      setVerificationData(data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Certificate record not found in the EventSync registry.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (inputNumber.trim()) {
      navigate(`/verify-certificate/${inputNumber.trim().toUpperCase()}`);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const pdfUrl = `${API.defaults.baseURL || ''}/api/certificates/${verificationData?.details?.certificateNumber}/pdf`;

  return (
    <div className="min-h-screen bg-[#0b0f17] text-white pt-24 pb-16 px-4 sm:px-6 lg:px-8">
      {/* Background neon glows */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-cyan-500/10 blur-[130px] rounded-full" />
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Navigation Back */}
        <div className="mb-6">
          <Link
            to="/showcase"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Back to Showcase Gallery</span>
          </Link>
        </div>

        {/* Verification Lookup Input Card */}
        <div className="p-6 sm:p-8 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white">
                Verify Credential Authenticity
              </h1>
              <p className="text-xs sm:text-sm text-gray-400">
                Official public ledger lookup for EventSync issued certificates.
              </p>
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={inputNumber}
              onChange={(e) => setInputNumber(e.target.value)}
              placeholder="Enter Certificate ID (e.g. ES-2026-ABC123)"
              className="flex-1 px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white font-mono uppercase placeholder-gray-500 text-sm focus:outline-none focus:border-cyan-400 transition-colors"
            />
            <button
              type="submit"
              disabled={loading || !inputNumber.trim()}
              className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Search className="w-4 h-4" />
              <span>{loading ? 'Verifying...' : 'Verify Credential'}</span>
            </button>
          </form>
        </div>

        {/* Result Area */}
        {loading && (
          <div className="p-12 text-center bg-white/5 rounded-3xl border border-white/10 animate-pulse">
            <ShieldCheck className="w-12 h-12 text-cyan-400 mx-auto mb-3 animate-spin" />
            <p className="text-gray-300 text-sm">Consulting cryptographic ledger records...</p>
          </div>
        )}

        {error && !loading && (
          <div className="p-8 rounded-3xl bg-red-500/10 border border-red-500/30 text-center">
            <XCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-red-400">Verification Failed</h3>
            <p className="text-xs sm:text-sm text-gray-300 mt-1 max-w-md mx-auto">
              {error}
            </p>
            <div className="mt-4">
              <span className="text-xs text-gray-500">
                Please double-check the Certificate ID or contact the issuer.
              </span>
            </div>
          </div>
        )}

        {verificationData && verificationData.verified && !loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 sm:p-10 rounded-3xl bg-gradient-to-b from-[#0f172a] to-[#0b1120] border-2 border-green-500/40 shadow-2xl shadow-green-500/10"
          >
            {/* Verified Header Stamp */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-400 font-bold text-lg sm:text-xl">
                      OFFICIALLY VERIFIED CREDENTIAL
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-xs font-semibold">
                      Active
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Cryptographic signature verified on EventSync Credential Registry
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={handleCopyLink}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copied ? 'Copied Link' : 'Share Verification'}</span>
                </button>
              </div>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-6 border-b border-white/10">
              {/* Recipient */}
              <div className="space-y-1">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                  Recipient Name
                </span>
                <div className="text-xl sm:text-2xl font-bold text-white">
                  {verificationData.details.recipientName}
                </div>
                <div className="text-xs text-gray-500">
                  Contact: {verificationData.details.recipientEmailMasked}
                </div>
              </div>

              {/* Event Name */}
              <div className="space-y-1">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                  Event / Achievement
                </span>
                <div className="text-xl sm:text-2xl font-bold text-cyan-300">
                  {verificationData.details.eventName}
                </div>
                <div className="text-xs text-gray-400">
                  Type: Certificate of {verificationData.details.certificateType || 'Completion'}
                </div>
              </div>

              {/* Issue Date */}
              <div className="space-y-1">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                  Issue Date
                </span>
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-cyan-400" />
                  <span>
                    {new Date(verificationData.details.issuedAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              </div>

              {/* Issuer Authority */}
              <div className="space-y-1">
                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                  Issuing Authority
                </span>
                <div className="text-sm font-semibold text-white flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <span>{verificationData.details.issuer}</span>
                </div>
              </div>
            </div>

            {/* Cryptographic Hash Details */}
            <div className="py-6 border-b border-white/10 bg-black/30 p-4 rounded-xl my-6">
              <div className="flex items-center gap-2 text-xs text-cyan-400 font-semibold mb-2">
                <Lock className="w-3.5 h-3.5" />
                <span>Cryptographic Verification Hash (SHA-256)</span>
              </div>
              <div className="font-mono text-xs text-gray-400 break-all bg-black/50 p-2.5 rounded-lg border border-white/5">
                {verificationData.details.verificationHash}
              </div>
              <div className="text-[11px] text-gray-500 mt-2">
                Certificate ID: <strong className="text-gray-300 font-mono">{verificationData.details.certificateNumber}</strong>
              </div>
            </div>

            {/* Actions: Download PDF and View Full Certificate */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => setShowCertificateModal(true)}
                className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all"
              >
                <Award className="w-4 h-4 text-cyan-400" />
                <span>View Full Digital Certificate</span>
              </button>

              <a
                href={pdfUrl}
                target="_blank"
                rel="noreferrer"
                download
                className="px-6 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all transform hover:-translate-y-0.5 active:scale-95"
              >
                <Download className="w-4 h-4" />
                <span>Download Official PDF</span>
              </a>
            </div>
          </motion.div>
        )}
      </div>

      {/* Modal for full visual certificate */}
      {showCertificateModal && verificationData?.details && (
        <CertificateModal
          certificate={verificationData.details}
          onClose={() => setShowCertificateModal(false)}
        />
      )}
    </div>
  );
};

export default VerifyCertificate;
