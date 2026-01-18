import { useState, useEffect } from 'react';
import '../styles/toast.css';

function Toast() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    window.showToast = (message, type = 'success', duration = 3000) => {
      const id = Date.now();
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    };

    return () => {
      delete window.showToast;
    };
  }, []);

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast-${toast.type}`}
        >
          <div className="toast-content">
            {toast.type === 'success' && <span className="toast-icon">✓</span>}
            {toast.type === 'error' && <span className="toast-icon">✕</span>}
            {toast.type === 'info' && <span className="toast-icon">ℹ</span>}
            <span className="toast-message">{toast.message}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default Toast;
