import React, { useState } from "react";
import axios from "axios";
import "./styles/auth.css";

function Register({ setAuthView }) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      await axios.post("http://localhost:5000/api/auth/register", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password
      });

      alert("Registered successfully");
      setLoading(false);

    } catch (error) {
      alert(error.response?.data?.message || "Registration failed");
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>Start using Echo</h2>
        <p>Secure real-time encrypted messaging</p>

        <form onSubmit={handleRegister}>
          <div className="input-group">
            <input
              type="text"
              name="name"
              placeholder="Full Name"
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="text"
              name="phone"
              placeholder="Phone Number"
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              onChange={handleChange}
              required
            />
          </div>

          <div className="input-group">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              onChange={handleChange}
              required
            />
          </div>

          <button className="auth-button">
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>

        <div className="auth-footer">
  Already have an account?{" "}
  <span
    style={{ color: "#3b82f6", cursor: "pointer" }}
    onClick={() => setAuthView("login")}
  >
    Login
  </span>
</div>
      </div>
    </div>
  );
}

export default Register;
