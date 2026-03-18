import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import api from "../api/axios.js";
import logo from "../assets/logo.png";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setInfo("");
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      const message = err?.response?.data?.message || t("loginFailed");
      if (message.toLowerCase().includes("verify")) {
        setInfo(message);
      } else {
        setError(message);
      }
    }
  };

  const handleResend = async () => {
    setError("");
    setInfo("");
    try {
      const { data } = await api.post("/auth/resend-verify", { email: form.email });
      setInfo(data.message || t("verifyResent"));
    } catch (err) {
      setError(err?.response?.data?.message || t("verifyResendFailed"));
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-16 glass rounded-3xl p-8">
      <div className="flex items-center gap-3">
        <img src={logo} alt={t("appName")} className="h-12 w-12 rounded-full object-cover" />
        <div>
          <h1 className="section-title">{t("loginTitle")}</h1>
          <p className="text-slate-400 mt-1">{t("loginSubtitle")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <input
          className="rounded-lg bg-slate-900/70 border border-slate-700 p-3"
          name="email"
          type="email"
          placeholder={t("loginEmail")}
          value={form.email}
          onChange={handleChange}
          required
        />
        <div className="relative">
          <input
            className="rounded-lg bg-slate-900/70 border border-slate-700 p-3 pr-24 w-full"
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder={t("loginPassword")}
            value={form.password}
            onChange={handleChange}
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute inset-y-0 right-2 text-xs font-semibold uppercase tracking-widest text-ocean hover:text-white"
            aria-pressed={showPassword}
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
        {info && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-3 text-sm text-slate-300">
            <p>{info}</p>
            <button
              type="button"
              onClick={handleResend}
              className="mt-2 text-xs uppercase tracking-widest text-ocean hover:text-white"
            >
              {t("verifyResend")}
            </button>
          </div>
        )}
        <button className="bg-ocean text-slate-900 font-semibold py-3 rounded-lg hover:shadow-glow transition">
          {t("loginButton")}
        </button>
      </form>
      <div className="flex items-center justify-between text-sm text-slate-400 mt-4">
        <Link to="/register" className="text-ocean">
          {t("loginCreate")}
        </Link>
        <Link to="/forgot-password" className="text-slate-300 hover:text-white">
          {t("loginForgot")}
        </Link>
      </div>
    </div>
  );
};

export default Login;
