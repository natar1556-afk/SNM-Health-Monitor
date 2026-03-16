import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios.js";
import { useLanguage } from "../context/LanguageContext.jsx";

const ResetPassword = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [form, setForm] = useState({ email: "", otp: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const { data } = await api.post("/auth/reset", form);
      setMessage(data.message || "Password updated");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to reset password");
    }
  };

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setForm((prev) => ({ ...prev, email: emailParam }));
    }
  }, [searchParams]);

  return (
    <div className="max-w-xl mx-auto mt-16 glass rounded-3xl p-8">
      <h1 className="section-title">{t("resetTitle")}</h1>
      <p className="text-slate-400 mt-2">{t("resetSubtitle")}</p>

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
        <input
          className="rounded-lg bg-slate-900/70 border border-slate-700 p-3"
          name="otp"
          placeholder={t("resetOtp")}
          value={form.otp}
          onChange={handleChange}
          required
        />
        <input
          className="rounded-lg bg-slate-900/70 border border-slate-700 p-3"
          name="password"
          type="password"
          placeholder={t("resetNewPassword")}
          value={form.password}
          onChange={handleChange}
          required
        />
        {error && <p className="text-sm text-red-300">{error}</p>}
        {message && <p className="text-sm text-moss">{message}</p>}
        <button className="bg-sunrise text-slate-900 font-semibold py-3 rounded-lg hover:shadow-glow transition">
          {t("resetUpdate")}
        </button>
      </form>

      <p className="text-sm text-slate-400 mt-4">
        <Link to="/login" className="text-ocean">
          {t("forgotBackLogin")}
        </Link>
      </p>
    </div>
  );
};

export default ResetPassword;
