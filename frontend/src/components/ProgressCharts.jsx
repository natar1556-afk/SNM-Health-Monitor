import React from "react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from "recharts";
import { useLanguage } from "../context/LanguageContext.jsx";

const ProgressCharts = ({
  weeklyBurned,
  weeklyConsumed,
  weeklyWater,
  weeklyHeartRate,
  weightTrend
}) => {
  const { t } = useLanguage();

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="glass rounded-2xl p-4">
        <h3 className="font-display text-lg mb-4">{t("chartWeeklyCalories")}</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={weeklyBurned}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="label" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="value" fill="#0ea5e9" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass rounded-2xl p-4">
        <h3 className="font-display text-lg mb-4">{t("chartWeeklyConsumed")}</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={weeklyConsumed}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="label" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="value" fill="#f97316" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass rounded-2xl p-4">
        <h3 className="font-display text-lg mb-4">{t("chartWeeklyWater")}</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={weeklyWater}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="label" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="value" fill="#38bdf8" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass rounded-2xl p-4">
        <h3 className="font-display text-lg mb-4">{t("chartWeeklyHeartRate")}</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={weeklyHeartRate}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="label" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Bar dataKey="value" fill="#f43f5e" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass rounded-2xl p-4 lg:col-span-2">
        <h3 className="font-display text-lg mb-4">{t("chartWeightTrend")}</h3>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={weightTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="date" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Line type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ProgressCharts;
