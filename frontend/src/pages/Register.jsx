import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import logo from "../assets/logo.png";

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
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
      const { data } = await register(form);
      if (data?.message) {
        setInfo(data.message);
      }
      navigate("/login");
    } catch (err) {
      setError(err?.response?.data?.message || "Registration failed");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-16 glass rounded-3xl p-8">
      <div className="flex items-center gap-3">
        <img src={logo} alt={t("appName")} className="h-12 w-12 rounded-full object-cover" />
        <div>
          <h1 className="section-title">{t("registerTitle")}</h1>
          <p className="text-slate-400 mt-1">{t("registerSubtitle")}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <input
          className="rounded-lg bg-slate-900/70 border border-slate-700 p-3"
          name="name"
          placeholder={t("registerName")}
          value={form.name}
          onChange={handleChange}
          required
        />
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
        {info && <p className="text-sm text-moss">{info}</p>}
        <button className="bg-sunrise text-slate-900 font-semibold py-3 rounded-lg hover:shadow-glow transition">
          {t("registerButton")}
        </button>
      </form>
      <p className="text-sm text-slate-400 mt-4">
        {t("registerHaveAccount")} <Link to="/login" className="text-ocean">{t("registerLogin")}</Link>
      </p>
    </div>
  );
};

export default Register;
