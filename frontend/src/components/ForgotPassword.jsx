import { useState } from "react";
import { Link } from "react-router-dom";
import API from "../services/api";
import "../styles/auth.css";

function ForgotPassword() {
  const [email, setEmail] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await API.post("/api/users/forgot-password", { email });
      window.showToast('Reset link sent! Check your email 📧', 'success', 3000);
    } catch (error) {
      console.error(error);
      window.showToast(error.response?.data?.message || 'Failed to send reset link', 'error', 3000);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Reset Password</h2>
        <p className="auth-subtitle">Enter your email to receive a link</p>

        <form onSubmit={handleSubmit}>
          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <button type="submit">Send Reset Link</button>
        </form>

        <div className="auth-switch">
          Remembered it? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;
