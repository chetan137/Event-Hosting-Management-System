import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/auth.css";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Mapping 'name' to 'fullName' as expected by backend
      const payload = {
          fullName: formData.name,
          email: formData.email,
          password: formData.password
      };

      const { data } = await API.post("/api/users/register", payload);

      // Save token/user info
      localStorage.setItem("userInfo", JSON.stringify(data));
      window.dispatchEvent(new Event('userInfoChange')); // Notify hooks

      // Show success toast
      window.showToast(`Welcome, ${data.fullName}! Account created successfully 🎉`, 'success', 2000);
      
      // Redirect after a brief delay
      setTimeout(() => {
        if(data.role === 'admin') {
            navigate('/admin');
        } else {
            navigate('/events');  // Redirect to events page to see all available events
        }
      }, 500);

    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || "Registration failed. Please try again.";
      window.showToast(errorMsg, 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h2>Create Account</h2>
        <p className="auth-subtitle">Join college events</p>

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email address"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button type="submit" disabled={loading}>
            {loading ? "Creating Account..." : "Register"}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Login</Link>
        </div>
      </div>
    </div>
  );
}

export default Register; // Note: Ensure filename matches import. Components is usually Signup.jsx, matching user request 'Register' logic inside Signup.jsx or we rename file. User existing file is Signup.jsx. I will write this into Signup.jsx but keep component name Register or Signup consistent. Let's use Register component name inside Signup.jsx to match user code snippet style but file name remains Signup.jsx.
