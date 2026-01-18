import { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/auth.css";

function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const { token } = useParams();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      window.showToast('Passwords do not match', 'error', 2000);
      return;
    }

    try {
      await API.put(`/api/users/reset-password/${token}`, { password });
      window.showToast('Password reset successful! ✅', 'success', 2000);
      navigate("/login");
    } catch (error) {
      console.error(error);
      window.showToast(error.response?.data?.message || 'Invalid or Expired Token', 'error', 3000);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Reset Password</h2>
        <p className="auth-subtitle">Enter your new password</p>

        <form onSubmit={handleSubmit}>
          <input
            type="password"
            name="password"
            placeholder="New Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
           <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm New Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
          />

          <button type="submit">Reset Password</button>
        </form>

        <div className="auth-switch">
          <Link to="/login">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
