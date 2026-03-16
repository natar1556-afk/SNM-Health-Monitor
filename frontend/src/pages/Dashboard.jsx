import React, { useEffect, useState } from "react";
import api from "../api/axios.js";
import StatCard from "../components/StatCard.jsx";
import ProgressCharts from "../components/ProgressCharts.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import logo from "../assets/logo.png";

const Dashboard = () => {
  const { user, setUser } = useAuth();
  const { t } = useLanguage();
  const [summary, setSummary] = useState({
    weeklyBurned: [],
    weeklyConsumed: [],
    weeklyWater: [],
    weeklyHeartRate: [],
    weightTrend: [],
    streak: { current: 0, longest: 0 },
    weeklyReport: null
  });
  const [stats, setStats] = useState({
    workouts: 0,
    caloriesBurned: 0,
    caloriesConsumed: 0,
    latestHeartRate: 0
  });

  const loadData = async () => {
    const [profileRes, summaryRes, workoutsRes, foodsRes, heartRateRes] = await Promise.all([
      api.get("/users/me"),
      api.get("/summary"),
      api.get("/workouts"),
      api.get("/foods"),
      api.get("/heart-rate")
    ]);

    setUser((prev) => ({ ...prev, ...profileRes.data.profile }));
    setSummary({
      weeklyBurned: summaryRes.data.weeklyBurned,
      weeklyConsumed: summaryRes.data.weeklyConsumed,
      weeklyWater: summaryRes.data.weeklyWater,
      weeklyHeartRate: summaryRes.data.weeklyHeartRate || [],
      weightTrend: summaryRes.data.weightTrend.map((entry) => ({
        ...entry,
        date: new Date(entry.date).toLocaleDateString()
      })),
      streak: summaryRes.data.streak,
      weeklyReport: summaryRes.data.weeklyReport
    });

    const totalBurned = workoutsRes.data.reduce((sum, w) => sum + w.caloriesBurned, 0);
    const totalConsumed = foodsRes.data.reduce((sum, f) => sum + f.calories, 0);
    const latestHeartRate = heartRateRes.data[0]?.bpm || 0;

    setStats({
      workouts: workoutsRes.data.length,
      caloriesBurned: totalBurned,
      caloriesConsumed: totalConsumed,
      latestHeartRate
    });
  };

  useEffect(() => {
    loadData();
  }, []);

  return (
    <section className="space-y-8">
      <div className="glass rounded-3xl p-6">
        <div className="flex items-center gap-3">
          <img src={logo} alt={t("appName")} className="h-12 w-12 rounded-full object-cover" />
          <div>
            <h1 className="section-title">{t("dashboardWelcome", { name: user?.name || "" })}</h1>
            <p className="text-slate-400 mt-1">{t("dashboardSubtitle")}</p>
          </div>
        </div>
        <div className="grid gap-4 mt-6 md:grid-cols-6">
          <StatCard label={t("statWorkoutsLogged")} value={stats.workouts} tone="ocean" />
          <StatCard label={t("statCaloriesBurned")} value={stats.caloriesBurned} tone="sunrise" />
          <StatCard label={t("statCaloriesConsumed")} value={stats.caloriesConsumed} tone="moss" />
          <StatCard label={t("statCurrentStreak")} value={summary.streak?.current || 0} tone="ocean" />
          <StatCard label={t("statBestStreak")} value={summary.streak?.longest || 0} tone="sunrise" />
          <StatCard label={t("statLatestHeartRate")} value={stats.latestHeartRate} tone="ocean" />
        </div>
      </div>

      {summary.weeklyReport && (
        <div className="glass rounded-3xl p-6">
          <h2 className="font-display text-lg">{t("weeklyReportTitle")}</h2>
          <p className="text-slate-400 mt-2">
            {t("weeklyReportSince", {
              date: new Date(summary.weeklyReport.weekStart).toLocaleDateString()
            })}
          </p>
          <div className="grid gap-4 mt-6 md:grid-cols-5">
            <StatCard
              label={t("weeklyWorkouts")}
              value={`${summary.weeklyReport.workouts}${
                summary.weeklyReport.goals?.weeklyWorkouts
                  ? ` / ${summary.weeklyReport.goals.weeklyWorkouts}`
                  : ""
              }`}
              tone="ocean"
            />
            <StatCard
              label={t("statCaloriesBurned")}
              value={summary.weeklyReport.caloriesBurned}
              tone="sunrise"
            />
            <StatCard
              label={t("statCaloriesConsumed")}
              value={summary.weeklyReport.caloriesConsumed}
              tone="moss"
            />
            <StatCard label={t("weeklyWater")} value={summary.weeklyReport.waterMl} tone="ocean" />
            <StatCard
              label={t("weeklyHeartRate")}
              value={summary.weeklyReport.avgHeartRate || 0}
              tone="sunrise"
            />
          </div>
        </div>
      )}

      <ProgressCharts
        weeklyBurned={summary.weeklyBurned}
        weeklyConsumed={summary.weeklyConsumed}
        weeklyWater={summary.weeklyWater}
        weeklyHeartRate={summary.weeklyHeartRate}
        weightTrend={summary.weightTrend}
      />
    </section>
  );
};

export default Dashboard;
