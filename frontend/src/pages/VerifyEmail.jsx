import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/axios.js";
import { useLanguage } from "../context/LanguageContext.jsx";

const VerifyEmail = () => {
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState({ loading: true, message: "" });

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setStatus({ loading: false, message: t("verifyMissing") });
      return;
    }

    const run = async () => {
      try {
        const { data } = await api.get(`/auth/verify?token=${encodeURIComponent(token)}`);
        setStatus({ loading: false, message: data.message || t("verifySuccess") });
      } catch (err) {
        setStatus({
          loading: false,
          message: err?.response?.data?.message || t("verifyFailed")
        });
      }
    };

    run();
  }, [searchParams, t]);

  return (
    <div className="max-w-xl mx-auto mt-16 glass rounded-3xl p-8">
      <h1 className="section-title">{t("verifyTitle")}</h1>
      <p className="text-slate-400 mt-2">
        {status.loading ? t("verifyWorking") : status.message}
      </p>
      <div className="mt-4">
        <Link to="/login" className="text-ocean">
          {t("verifyBackLogin")}
        </Link>
      </div>
    </div>
  );
};

export default VerifyEmail;
