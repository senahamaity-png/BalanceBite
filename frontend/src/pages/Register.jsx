import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import api from "../services/api";

function Register() {
  const navigate =
    useNavigate();

  const [form, setForm] =
    useState({
      name: "",
      email: "",
      password: "",
    });

  const [message, setMessage] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]:
        e.target.value,
    });
  };

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      setMessage("");
      setLoading(true);

      try {
        const response =
          await api.post(
            "/auth/register",
            form
          );

        localStorage.setItem(
          "balancebite_token",
          response.data.token
        );

        localStorage.setItem(
          "balancebite_user",
          JSON.stringify(
            response.data.user
          )
        );

        navigate("/dashboard");
      } catch (error) {
        setMessage(
          error.response?.data
            ?.message ||
            "Registration failed"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo">
          BalanceBite
        </div>

        <div className="logo-subtitle">
          SMART NUTRITION
        </div>

        <h1>
          Create Account
        </h1>

        <p className="subtitle">
          Start your healthier
          lifestyle today.
        </p>

        <form
          onSubmit={
            handleSubmit
          }
        >
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={form.name}
            onChange={
              handleChange
            }
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email Address"
            value={form.email}
            onChange={
              handleChange
            }
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={
              handleChange
            }
            minLength="6"
            required
          />

          {message && (
            <div className="error">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Creating..."
              : "Create Account"}
          </button>
        </form>

        <p className="bottom-text">
          Already have an account?{" "}
          <Link to="/login">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;