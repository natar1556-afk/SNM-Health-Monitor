import React, { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios.js";
import { useLanguage } from "../context/LanguageContext.jsx";

const ForgotPassword = () => {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    try {
      const { data } = await api.post("/auth/forgot", { email });
      setMessage(data.message || "If the email exists, a reset code was sent.");
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to send reset code");
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-16 glass rounded-3xl p-8">
      <h1 className="section-title">{t("forgotTitle")}</h1>
      <p className="text-slate-400 mt-2">{t("forgotSubtitle")}</p>

      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <input
          className="rounded-lg bg-slate-900/70 border border-slate-700 p-3"
          name="email"
          type="email"
          placeholder={t("loginEmail")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        {error && <p className="text-sm text-red-300">{error}</p>}
        {message && <p className="text-sm text-moss">{message}</p>}
        <button className="bg-ocean text-slate-900 font-semibold py-3 rounded-lg hover:shadow-glow transition">
          {t("forgotSend")}
        </button>
      </form>

      {message && (
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <p className="text-sm text-slate-300">{t("forgotHint")}</p>
          <Link
            to={`/reset-password?email=${encodeURIComponent(email)}`}
            className="inline-flex mt-3 text-sm font-semibold uppercase tracking-widest text-ocean hover:text-white"
          >
            {t("forgotGoReset")}
          </Link>
        </div>
      )}

      <p className="text-sm text-slate-400 mt-4">
        {t("forgotRemembered")} <Link to="/login" className="text-ocean">{t("forgotBackLogin")}</Link>
      </p>
    </div>
  );
};

export default ForgotPassword;
