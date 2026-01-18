import React, { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Camera, Keyboard, CheckCircle, XCircle, Loader, Users, RefreshCw } from 'lucide-react';
import API from '../services/api';
import FeedbackForm from './FeedbackForm';
import '../styles/qrScanner.css';

const QRScanner = ({ eventId, eventName, onScanSuccess: onScanCallback }) => {
  const [scanMode, setScanMode] = useState('camera'); // 'camera' or 'manual'
  const [manualToken, setManualToken] = useState('');
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [recentScans, setRecentScans] = useState([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [lastAttendance, setLastAttendance] = useState(null);
  const [scanCooldown, setScanCooldown] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [activeCameraId, setActiveCameraId] = useState(null);

  const scannerRef = useRef(null);
  const isScanningRef = useRef(false);

  // Initialize scanner on mount or mode change
  useEffect(() => {
    if (scanMode === 'camera') {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [scanMode]);

  useEffect(() => {
    // Get available cameras
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        setCameras(devices);
        // Default to back camera if available
        const backCamera = devices.find(id => id.label.toLowerCase().includes('back'));
        setActiveCameraId(backCamera ? backCamera.id : devices[0].id);
      }
    }).catch(err => {
      console.error('Error getting cameras', err);
      setCameraError('Could not access camera. Please ensure permissions are granted.');
    });
  }, []);

  const startScanner = async () => {
    try {
      if (isScanningRef.current) return;

      setCameraError(null);

      const elementId = "qr-reader-video";

      // Ensure element exists
      if (!document.getElementById(elementId)) {
        console.warn('Scanner element not found, retrying...');
        setTimeout(startScanner, 100);
        return;
      }

      const html5QrCode = new Html5Qrcode(elementId);
      scannerRef.current = html5QrCode;

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        formatsToSupport: [ Html5QrcodeSupportedFormats.QR_CODE ]
      };

      await html5QrCode.start(
        activeCameraId || { facingMode: "environment" },
        config,
        (decodedText) => handleQRSuccess(decodedText),
        (errorMessage) => {
          // Ignore polling errors
        }
      );

      isScanningRef.current = true;
    } catch (err) {
      console.error("Error starting scanner", err);
      setCameraError('Failed to start camera. Please check permissions or try a different browser.');
      isScanningRef.current = false;
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current && isScanningRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (err) {
        console.error("Error stopping scanner", err);
      }
      isScanningRef.current = false;
    }
  };

  const restartScanner = async () => {
    await stopScanner();
    await startScanner();
  };

  const handleQRSuccess = async (decodedText) => {
    if (scanCooldown) return;

    setScanCooldown(true);
    // Cooldown for 3 seconds
    setTimeout(() => setScanCooldown(false), 3000);

    await handleScan(decodedText);
  };

  const handleScan = async (token) => {
    try {
      setScanning(true);
      setResult(null);

      // Play beep sound
      const beep = new Audio('data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU'); // Short beep
      beep.play().catch(() => {});

      const { data } = await API.post('/api/attendance/scan', {
        qrToken: token
      });

      // Play success sound
      if (data.playSound) {
        const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77eefTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrgs7y2Yk2CBlou+3nn00QDFC');
        audio.play().catch(() => {});
      }

      setResult({
        success: true,
        message: data.message,
        data: data.attendance
      });

      setLastAttendance(data.attendance);
      setShowFeedback(true);
      setRecentScans(prev => [data.attendance, ...prev.slice(0, 4)]);

      if (onScanCallback) onScanCallback(data.attendance);

    } catch (error) {
      console.error('Scan Error:', error);
      const errorMessage = error.response?.data?.message || 'Scan failed';

      setResult({
        success: false,
        message: errorMessage,
        data: null
      });

      // Error sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIGWi77eefTRAMUKfj8LZjHAY4ktfyzHksBSR3x/DdkEAKFF606+uoVRQKRp/g8r5sIQUrgs7y2Yk2CBlou+3nn00QDFC');
      audio.play().catch(() => {});

      setTimeout(() => setResult(null), 3000);
    } finally {
      setScanning(false);
      setManualToken('');
    }
  };

  const handleManualScan = (e) => {
    e.preventDefault();
    if (manualToken.trim()) {
      handleScan(manualToken.trim());
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#1E1E1E] rounded-2xl p-4 sm:p-6 border border-white/10">
        <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">📱 QR Scanner</h2>
        <p className="text-gray-400">{eventName}</p>
      </div>

      {/* Mode Selector */}
      <div className="flex gap-2 sm:gap-4">
        <button
          onClick={() => setScanMode('camera')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
            scanMode === 'camera'
              ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white'
              : 'bg-[#1E1E1E] text-gray-400 border border-white/10'
          }`}
        >
          <Camera className="w-5 h-5" />
          <span className="hidden sm:inline">Camera</span>
        </button>
        <button
          onClick={() => setScanMode('manual')}
          className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
            scanMode === 'manual'
              ? 'bg-gradient-to-r from-cyan-500 to-pink-500 text-white'
              : 'bg-[#1E1E1E] text-gray-400 border border-white/10'
          }`}
        >
          <Keyboard className="w-5 h-5" />
          <span className="hidden sm:inline">Manual</span>
        </button>
      </div>

      {/* Scanner Area */}
      <div className="bg-[#1E1E1E] rounded-2xl p-4 sm:p-6 border border-white/10 overflow-hidden min-h-[400px]">
        {scanMode === 'camera' ? (
          <div className="relative">
            {cameraError ? (
              <div className="text-center p-8 bg-red-500/10 rounded-xl border border-red-500/30">
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-white font-semibold mb-2">Camera Error</p>
                <p className="text-gray-400 text-sm mb-4">{cameraError}</p>
                <button
                  onClick={restartScanner}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors flex items-center justify-center gap-2 mx-auto"
                >
                  <RefreshCw size={16} /> Try Again
                </button>
              </div>
            ) : (
              <>
                <div id="qr-reader-video" className="w-full rounded-xl overflow-hidden bg-black"></div>

                {/* Camera Selector */}
                {cameras.length > 1 && (
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
                    <select
                      value={activeCameraId}
                      onChange={(e) => {
                        setActiveCameraId(e.target.value);
                        restartScanner();
                      }}
                      className="bg-black/60 text-white px-4 py-2 rounded-full text-sm border border-white/20 backdrop-blur-md outline-none"
                    >
                      {cameras.map(camera => (
                        <option key={camera.id} value={camera.id}>
                          {camera.label || `Camera ${camera.id.slice(0, 5)}...`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <p className="text-center text-gray-400 text-sm mt-4">
                  Point camera at QR code to auto-scan
                </p>
              </>
            )}
          </div>
        ) : (
          <form onSubmit={handleManualScan} className="space-y-4">
            <div>
              <label className="block text-gray-400 mb-2 text-sm font-semibold">Enter QR Token or Attendance ID</label>
              <textarea
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="📱 Paste QR token (JWT) OR&#10;📇 Enter Attendance ID"
                className="w-full px-4 py-3 bg-[#2a2a2a] border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                rows="5"
              />
            </div>
            <button
              type="submit"
              disabled={scanning || !manualToken.trim()}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {scanning ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                'Mark Attendance'
              )}
            </button>
          </form>
        )}
      </div>

      {/* Result Display */}
      {result && (
        <div className={`p-4 sm:p-6 rounded-2xl border ${
          result.success
            ? 'bg-green-500/10 border-green-500/30'
            : 'bg-red-500/10 border-red-500/30'
        }`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0 mt-1" />
            ) : (
              <XCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
            )}
            <div className="flex-1">
              <h3 className={`font-bold text-lg mb-1 ${
                result.success ? 'text-green-400' : 'text-red-400'
              }`}>
                {result.message}
              </h3>
              {result.success && result.data && (
                <div className="text-sm space-y-1 mt-2">
                  <p className="text-white"><strong>Name:</strong> {result.data.userName}</p>
                  <p className="text-gray-400"><strong>Email:</strong> {result.data.userEmail}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Form */}
      {showFeedback && lastAttendance && (
        <FeedbackForm
          eventId={eventId}
          eventName={eventName}
          onSubmitSuccess={() => {
            setShowFeedback(false);
            setLastAttendance(null);
            setResult(null);
            // Optionally restart scanner if stopped?
            setScanCooldown(false);
          }}
        />
      )}

      {/* Recent Scans */}
      {recentScans.length > 0 && (
        <div className="bg-[#1E1E1E] rounded-2xl p-4 sm:p-6 border border-white/10">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Recent Check-ins
          </h3>
          <div className="space-y-2">
            {recentScans.map((scan, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-[#2a2a2a] rounded-lg">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-semibold truncate">{scan.userName}</p>
                  <p className="text-gray-400 text-sm truncate">{scan.userEmail}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 ml-2" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
