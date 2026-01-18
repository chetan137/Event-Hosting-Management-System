import React, { useState, useEffect } from 'react';
import { QrCode, Download, CheckCircle, Clock, AlertCircle, Loader } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import API from '../services/api';

const QRCodeDisplay = ({ registrationId, eventName }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    console.log(`📱 QRCodeDisplay mounted with registrationId: ${registrationId}`);
    fetchQRCode();
  }, [registrationId]);

  const fetchQRCode = async () => {
    try {
      setLoading(true);
      console.log(`🔍 Fetching QR code for registration: ${registrationId}`);
      const { data } = await API.get(`/api/qr/registration/${registrationId}`);
      console.log(`✅ QR code fetched:`, data);
      setQrData(data);
    } catch (err) {
      console.error(`❌ QR fetch error:`, err.response?.status, err.response?.data);
      if (err.response?.status === 404) {
        console.log(`ℹ️ QR doesn't exist yet (404)`);
        setQrData(null);
      } else {
        setError('Failed to load QR code');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateQR = async () => {
    try {
      setGenerating(true);
      setError('');
      const { data } = await API.post(`/api/qr/generate/${registrationId}`);
      setQrData(data.qrCode);
      window.showToast('QR code generated! Check your email 📧', 'success', 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate QR code');
    } finally {
      setGenerating(false);
    }
  };

  const downloadQR = () => {
    const canvas = document.createElement('canvas');
    const svg = document.getElementById('qr-code-svg');
    const svgData = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const link = document.createElement('a');
      link.download = `${eventName}-QR.png`;
      link.href = canvas.toDataURL();
      link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  if (!qrData) {
    return (
      <div className="bg-[#1E1E1E] rounded-2xl p-6 border border-white/10">
        <div className="text-center">
          <QrCode className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Generate Your QR Code</h3>
          <p className="text-gray-400 mb-6">
            Get your unique QR code to check in at the event
          </p>
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          <button
            onClick={handleGenerateQR}
            disabled={generating}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
          >
            {generating ? (
              <span className="flex items-center gap-2">
                <Loader className="w-4 h-4 animate-spin" />
                Generating...
              </span>
            ) : (
              'Generate QR Code'
            )}
          </button>
        </div>
      </div>
    );
  }

  const getStatusBadge = () => {
    if (qrData.isUsed) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg">
          <CheckCircle className="w-5 h-5" />
          <span className="font-semibold">✅ Checked In</span>
        </div>
      );
    }
    if (qrData.isExpired || new Date() > new Date(qrData.expiresAt)) {
      return (
        <div className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span className="font-semibold">Expired</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg">
        <Clock className="w-5 h-5" />
        <span className="font-semibold">Ready to Scan</span>
      </div>
    );
  };

  return (
    <div className="bg-[#1E1E1E] rounded-2xl p-4 sm:p-6 border border-white/10">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">🎟️ Your Event QR Code</h3>
        <p className="text-gray-400 text-sm sm:text-base">Show this at the event entrance</p>
      </div>

      {/* Status Badge */}
      <div className="flex justify-center mb-6">
        {getStatusBadge()}
      </div>

      {/* QR Code */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl mb-6 flex justify-center">
        <QRCodeSVG
          id="qr-code-svg"
          value={qrData.qrToken}
          size={Math.min(window.innerWidth - 100, 300)}
          level="H"
          includeMargin={true}
        />
      </div>

      {/* Attendance ID - for manual check-in if QR fails */}
      <div className="bg-cyan-500/20 border border-cyan-500/30 rounded-xl p-3 mb-4">
        <p className="text-cyan-400 text-xs font-semibold mb-2">📇 Manual Attendance ID</p>
        <p className="text-white text-lg font-mono font-bold tracking-widest break-all">
          {qrData.registration ? qrData.registration.substring(0, 12).toUpperCase() : 'N/A'}
        </p>
        <p className="text-gray-400 text-xs mt-2">👤 Use this ID if QR code cannot be scanned</p>
      </div>

      {/* Info */}
      <div className="bg-[#2a2a2a] rounded-xl p-4 mb-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Event:</span>
          <span className="text-white font-semibold">{eventName}</span>
        </div>
        {qrData.isUsed && qrData.scannedAt && (
          <div className="flex justify-between">
            <span className="text-gray-400">Scanned:</span>
            <span className="text-green-400 font-semibold">
              {new Date(qrData.scannedAt).toLocaleString()}
            </span>
          </div>
        )}
        {!qrData.isUsed && (
          <div className="flex justify-between">
            <span className="text-gray-400">Expires:</span>
            <span className="text-white">
              {new Date(qrData.expiresAt).toLocaleDateString()}
            </span>
          </div>
        )}
      </div>

      {/* Actions */}
      {!qrData.isUsed && !qrData.isExpired && (
        <button
          onClick={downloadQR}
          className="w-full py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2"
        >
          <Download className="w-5 h-5" />
          Download QR Code
        </button>
      )}

      {/* Warning */}
      {!qrData.isUsed && (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
          <p className="text-yellow-400 text-xs sm:text-sm">
            ⚠️ <strong>Important:</strong> This QR code is unique to you. Do not share it. It can only be used once.
          </p>
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay;
