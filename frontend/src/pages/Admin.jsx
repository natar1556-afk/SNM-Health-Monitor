import React, { useEffect, useState } from "react";
import api from "../api/axios.js";
import { useAuth } from "../context/AuthContext.jsx";
import StatCard from "../components/StatCard.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

const Admin = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [smtp, setSmtp] = useState({ host: "", port: 587, user: "", pass: "", from: "" });
  const [smtpMessage, setSmtpMessage] = useState("");
  const [smtpError, setSmtpError] = useState("");
  const [testEmail, setTestEmail] = useState("");

  const loadData = async () => {
    const [usersRes, statsRes, smtpRes] = await Promise.all([
      api.get("/admin/users"),
      api.get("/admin/stats"),
      api.get("/admin/smtp")
    ]);
    setUsers(usersRes.data);
    setStats(statsRes.data);
    setSmtp((prev) => ({ ...prev, ...smtpRes.data }));
  };

  useEffect(() => {
    if (user?.role === "admin") {
      loadData();
    }
  }, [user]);

  const handleDelete = async (id) => {
    await api.delete(`/admin/users/${id}`);
    loadData();
  };

  const handleSmtpChange = (event) => {
    const { name, value } = event.target;
    setSmtp((prev) => ({ ...prev, [name]: value }));
  };

  const handleSmtpSubmit = async (event) => {
    event.preventDefault();
    setSmtpError("");
    setSmtpMessage("");
    try {
      const payload = {
        ...smtp,
        port: smtp.port ? Number(smtp.port) : 587
      };
      const { data } = await api.post("/admin/smtp", payload);
      setSmtpMessage(data.message || "SMTP settings updated");
    } catch (err) {
      setSmtpError(err?.response?.data?.message || "Failed to save SMTP settings");
    }
  };

  const handleSmtpTest = async () => {
    setSmtpError("");
    setSmtpMessage("");
    try {
      const { data } = await api.post("/admin/smtp/test", {
        to: testEmail || undefined
      });
      setSmtpMessage(data.message || "Test email sent");
    } catch (err) {
      setSmtpError(err?.response?.data?.message || "Failed to send test email");
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="glass rounded-3xl p-6">
        <h1 className="section-title">{t("adminAccessOnly")}</h1>
        <p className="text-slate-400 mt-2">{t("adminAccessHint")}</p>
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <div className="glass rounded-3xl p-6">
        <h1 className="section-title">{t("adminTitle")}</h1>
        <p className="text-slate-400 mt-2">{t("adminSubtitle")}</p>
        {stats && (
          <div className="grid gap-4 mt-6 md:grid-cols-6">
            <StatCard label={t("adminUsers")} value={stats.users} tone="ocean" />
            <StatCard label={t("adminWorkouts")} value={stats.workouts} tone="sunrise" />
            <StatCard label={t("adminMeals")} value={stats.foods} tone="moss" />
            <StatCard label={t("adminWaterEntries")} value={stats.waterEntries} tone="ocean" />
            <StatCard label={t("adminHeartRateEntries")} value={stats.heartRateEntries} tone="sunrise" />
            <StatCard label={t("statCaloriesBurned")} value={stats.caloriesBurned} tone="ocean" />
          </div>
        )}
      </div>

      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-lg">{t("adminSmtpTitle")}</h2>
        <p className="text-slate-400 text-sm mt-2">{t("adminSmtpSubtitle")}</p>
        <form onSubmit={handleSmtpSubmit} className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
            name="host"
            placeholder={t("adminSmtpHost")}
            value={smtp.host}
            onChange={handleSmtpChange}
            required
          />
          <input
            className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
            name="port"
            type="number"
            placeholder={t("adminSmtpPort")}
            value={smtp.port}
            onChange={handleSmtpChange}
          />
          <input
            className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
            name="user"
            placeholder={t("adminSmtpUser")}
            value={smtp.user}
            onChange={handleSmtpChange}
            required
          />
          <input
            className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
            name="pass"
            type="password"
            placeholder={t("adminSmtpPass")}
            value={smtp.pass}
            onChange={handleSmtpChange}
            required
          />
          <input
            className="rounded-lg bg-slate-900/70 border border-slate-700 p-2 md:col-span-2"
            name="from"
            placeholder={t("adminSmtpFrom")}
            value={smtp.from}
            onChange={handleSmtpChange}
          />
          <input
            className="rounded-lg bg-slate-900/70 border border-slate-700 p-2 md:col-span-2"
            name="testEmail"
            placeholder={t("adminSmtpTest")}
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
          {smtpError && <p className="text-sm text-red-300 md:col-span-2">{smtpError}</p>}
          {smtpMessage && <p className="text-sm text-moss md:col-span-2">{smtpMessage}</p>}
          <button className="md:col-span-2 bg-ocean text-slate-900 font-semibold py-3 rounded-lg hover:shadow-glow transition">
            {t("adminSmtpSave")}
          </button>
          <button
            type="button"
            onClick={handleSmtpTest}
            className="md:col-span-2 bg-slate-800 text-slate-100 font-semibold py-3 rounded-lg hover:bg-slate-700 transition"
          >
            {t("adminSmtpSend")}
          </button>
        </form>
      </div>

      <div className="glass rounded-3xl p-6 space-y-4">
        <h2 className="font-display text-lg">{t("adminUsers")}</h2>
        <div className="grid gap-3">
          {users.map((account) => (
            <div
              key={account._id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-slate-800 rounded-2xl p-4"
            >
              <div>
                <div className="font-semibold">{account.name}</div>
                <div className="text-sm text-slate-400">{account.email}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs uppercase tracking-widest text-slate-400">
                  {account.role}
                </span>
                <button
                  onClick={() => handleDelete(account._id)}
                  className="text-xs uppercase tracking-widest text-red-300 hover:text-red-200"
                >
                  {t("adminDelete")}
                </button>
              </div>
            </div>
          ))}
          {users.length === 0 && <p className="text-slate-500">{t("adminNoUsers")}</p>}
        </div>
      </div>
    </section>
  );
};

export default Admin;
