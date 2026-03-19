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
  const [logs, setLogs] = useState([]);
  const [smtp, setSmtp] = useState({ host: "", port: 587, user: "", pass: "", from: "" });
  const [smtpMessage, setSmtpMessage] = useState("");
  const [smtpError, setSmtpError] = useState("");
  const [testEmail, setTestEmail] = useState("");
  const [exporting, setExporting] = useState({ csv: false, pdf: false });
  const [exportError, setExportError] = useState("");

  const loadData = async () => {
    const [usersRes, statsRes, smtpRes, logsRes] = await Promise.all([
      api.get("/admin/users"),
      api.get("/admin/stats"),
      api.get("/admin/smtp"),
      api.get("/admin/logs")
    ]);
    setUsers(usersRes.data);
    setStats(statsRes.data);
    setSmtp((prev) => ({ ...prev, ...smtpRes.data }));
    setLogs(logsRes.data);
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

  const handleAnalyticsExport = async (format) => {
    setExportError("");
    setExporting((prev) => ({ ...prev, [format]: true }));
    try {
      const response = await api.get("/admin/analytics/export", {
        params: { format },
        responseType: "blob"
      });
      const blob = new Blob([response.data], {
        type: format === "pdf" ? "application/pdf" : "text/csv"
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `snm-analytics-${format}-${new Date().toISOString().slice(0, 10)}.${format}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(t("adminExportFailed"));
    } finally {
      setExporting((prev) => ({ ...prev, [format]: false }));
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

      <div className="glass rounded-3xl p-6 space-y-4">
        <div>
          <h2 className="font-display text-lg">{t("adminExportTitle")}</h2>
          <p className="text-slate-400 text-sm mt-2">{t("adminExportSubtitle")}</p>
        </div>
        {exportError && <p className="text-sm text-red-300">{exportError}</p>}
        <div className="flex flex-wrap gap-4">
          <button
            type="button"
            onClick={() => handleAnalyticsExport("csv")}
            disabled={exporting.csv}
            className="bg-ocean/20 border border-ocean text-ocean px-4 py-2 rounded-xl hover:bg-ocean/30 disabled:opacity-60"
          >
            {exporting.csv ? t("loading") : t("adminExportCsv")}
          </button>
          <button
            type="button"
            onClick={() => handleAnalyticsExport("pdf")}
            disabled={exporting.pdf}
            className="bg-sunrise/20 border border-sunrise text-sunrise px-4 py-2 rounded-xl hover:bg-sunrise/30 disabled:opacity-60"
          >
            {exporting.pdf ? t("loading") : t("adminExportPdf")}
          </button>
        </div>
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

      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-lg">{t("adminLogsTitle")}</h2>
        <p className="text-slate-400 text-sm mt-2">{t("adminLogsSubtitle")}</p>
        <div className="mt-4 space-y-3">
          {logs.map((entry) => (
            <div key={entry.id || entry._id} className="border border-slate-800 rounded-2xl p-4">
              <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-slate-200">
                    {entry.action}
                  </p>
                  {entry.description && (
                    <p className="text-slate-400 text-sm mt-1">{entry.description}</p>
                  )}
                </div>
                <span className="text-xs text-slate-500">
                  {entry.createdAt ? new Date(entry.createdAt).toLocaleString() : ""}
                </span>
              </div>
              <div className="text-xs text-slate-500 mt-2 flex flex-wrap gap-2">
                <span>
                  {entry.user?.name
                    ? `${entry.user.name} (${entry.user.email || ""})`
                    : "System"}
                </span>
                <span>•</span>
                <span>{entry.ip || "—"}</span>
              </div>
            </div>
          ))}
          {logs.length === 0 && <p className="text-slate-500">{t("adminLogsEmpty")}</p>}
        </div>
      </div>
    </section>
  );
};

export default Admin;
