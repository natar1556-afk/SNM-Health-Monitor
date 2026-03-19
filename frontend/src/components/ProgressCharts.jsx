import React, { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
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
  const [energyFilter, setEnergyFilter] = useState({ burned: true, consumed: true });
  const [recoveryFilter, setRecoveryFilter] = useState({ water: true, heart: true });

  const energySeries = useMemo(() => {
    const labels = [];
    const pushLabel = (label) => {
      if (label && !labels.includes(label)) labels.push(label);
    };
    (weeklyBurned || []).forEach((item) => pushLabel(item.label));
    (weeklyConsumed || []).forEach((item) => pushLabel(item.label));
    const map = labels.reduce((acc, label) => {
      acc[label] = { label, burned: 0, consumed: 0, net: 0 };
      return acc;
    }, {});
    (weeklyBurned || []).forEach((item) => {
      if (!map[item.label]) map[item.label] = { label: item.label, burned: 0, consumed: 0, net: 0 };
      map[item.label].burned = item.value || 0;
    });
    (weeklyConsumed || []).forEach((item) => {
      if (!map[item.label]) map[item.label] = { label: item.label, burned: 0, consumed: 0, net: 0 };
      map[item.label].consumed = item.value || 0;
    });
    return Object.values(map).map((row) => ({
      ...row,
      net: (row.burned || 0) - (row.consumed || 0)
    }));
  }, [weeklyBurned, weeklyConsumed]);

  const recoverySeries = useMemo(() => {
    const labels = [];
    const pushLabel = (label) => {
      if (label && !labels.includes(label)) labels.push(label);
    };
    (weeklyWater || []).forEach((item) => pushLabel(item.label));
    (weeklyHeartRate || []).forEach((item) => pushLabel(item.label));
    const map = labels.reduce((acc, label) => {
      acc[label] = { label, water: 0, heart: 0 };
      return acc;
    }, {});
    (weeklyWater || []).forEach((item) => {
      if (!map[item.label]) map[item.label] = { label: item.label, water: 0, heart: 0 };
      map[item.label].water = item.value || 0;
    });
    (weeklyHeartRate || []).forEach((item) => {
      if (!map[item.label]) map[item.label] = { label: item.label, water: 0, heart: 0 };
      map[item.label].heart = item.value || 0;
    });
    return Object.values(map);
  }, [weeklyWater, weeklyHeartRate]);

  const bestWeek = useMemo(() => {
    if (!energySeries.length) return null;
    return energySeries.reduce((best, row) => (row.net > best.net ? row : best), energySeries[0]);
  }, [energySeries]);

  const weekToImprove = useMemo(() => {
    if (!energySeries.length) return null;
    return energySeries.reduce((worst, row) => (row.net < worst.net ? row : worst), energySeries[0]);
  }, [energySeries]);

  const csvRows = useMemo(() => {
    return energySeries.map((row) => {
      const recovery = recoverySeries.find((item) => item.label === row.label) || {
        water: 0,
        heart: 0
      };
      return {
        label: row.label,
        burned: row.burned,
        consumed: row.consumed,
        net: row.net,
        water: recovery.water,
        heart: recovery.heart
      };
    });
  }, [energySeries, recoverySeries]);

  const handleEnergyToggle = (key) =>
    setEnergyFilter((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleRecoveryToggle = (key) =>
    setRecoveryFilter((prev) => ({ ...prev, [key]: !prev[key] }));

  const handleDownloadCsv = () => {
    if (!csvRows.length) return;
    const header = ["Week", "Calories Burned", "Calories Consumed", "Net", "Water (ml)", "Heart (bpm)"];
    const body = csvRows
      .map((row) => [row.label, row.burned, row.consumed, row.net, row.water, row.heart].join(","))
      .join("\\n");
    const csv = `${header.join(",")}\\n${body}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "snm-health-insights.csv");
    link.click();
    URL.revokeObjectURL(url);
  };

  const toggleButtonClass = (active) =>
    `rounded-full border px-3 py-1 text-sm transition ${
      active ? "border-emerald-500/70 text-emerald-200 bg-emerald-500/10" : "border-slate-700 text-slate-400 hover:text-slate-200"
    }`;

  return (
    <div className="space-y-6">
      <div className="glass rounded-2xl p-4">
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
          <div>
            <h3 className="font-display text-lg">{t("chartEnergyBalance")}</h3>
            <p className="text-slate-400 text-sm">{t("chartDataRange")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleEnergyToggle("burned")}
              className={toggleButtonClass(energyFilter.burned)}
            >
              {t("chartToggleBurned")}
            </button>
            <button
              type="button"
              onClick={() => handleEnergyToggle("consumed")}
              className={toggleButtonClass(energyFilter.consumed)}
            >
              {t("chartToggleConsumed")}
            </button>
            <button
              type="button"
              onClick={handleDownloadCsv}
              className="rounded-full border border-slate-600 px-3 py-1 text-sm text-slate-200 hover:bg-slate-800"
            >
              {t("chartDownloadCsv")}
            </button>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={energySeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
            <XAxis dataKey="label" stroke="#94a3b8" />
            <YAxis stroke="#94a3b8" />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="burned"
              name={t("chartToggleBurned")}
              stroke="#0ea5e9"
              fill="#0ea5e9"
              fillOpacity={0.15}
              hide={!energyFilter.burned}
            />
            <Area
              type="monotone"
              dataKey="consumed"
              name={t("chartToggleConsumed")}
              stroke="#f97316"
              fill="#f97316"
              fillOpacity={0.15}
              hide={!energyFilter.consumed}
            />
            <Line
              type="monotone"
              dataKey="net"
              name={t("chartNetCalories")}
              stroke="#22c55e"
              strokeWidth={3}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass rounded-2xl p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-4">
            <h3 className="font-display text-lg">{t("chartHydrationRecovery")}</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleRecoveryToggle("water")}
                className={toggleButtonClass(recoveryFilter.water)}
              >
                {t("chartToggleWater")}
              </button>
              <button
                type="button"
                onClick={() => handleRecoveryToggle("heart")}
                className={toggleButtonClass(recoveryFilter.heart)}
              >
                {t("chartToggleHeart")}
              </button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart data={recoverySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis yAxisId="left" stroke="#94a3b8" />
              <YAxis yAxisId="right" orientation="right" stroke="#94a3b8" />
              <Tooltip />
              <Legend />
              <Bar
                yAxisId="left"
                dataKey="water"
                name={t("chartWeeklyWater")}
                fill="#38bdf8"
                radius={[6, 6, 0, 0]}
                hide={!recoveryFilter.water}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="heart"
                name={t("chartWeeklyHeartRate")}
                stroke="#f43f5e"
                strokeWidth={3}
                dot={{ strokeWidth: 2 }}
                hide={!recoveryFilter.heart}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-2xl p-4">
          <h3 className="font-display text-lg mb-4">{t("chartWeightTrend")}</h3>
          <ResponsiveContainer width="100%" height={260}>
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

      <div className="grid gap-4 md:grid-cols-3">
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-slate-400">{t("chartBestWeek")}</p>
          <p className="text-2xl font-display mt-2">
            {bestWeek ? `${bestWeek.label} • ${bestWeek.net.toLocaleString()} kcal` : "–"}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {bestWeek
              ? `${bestWeek.burned.toLocaleString()} kcal ${t("chartToggleBurned")}`
              : t("chartDataRange")}
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-slate-400">{t("chartWorstWeek")}</p>
          <p className="text-2xl font-display mt-2 text-amber-300">
            {weekToImprove ? `${weekToImprove.label} • ${weekToImprove.net.toLocaleString()} kcal` : "–"}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {weekToImprove
              ? `${weekToImprove.consumed.toLocaleString()} kcal ${t("chartToggleConsumed")}`
              : t("chartDataRange")}
          </p>
        </div>
        <div className="glass rounded-2xl p-4">
          <p className="text-sm text-slate-400">{t("chartNetCalories")}</p>
          <p className="text-2xl font-display mt-2">
            {energySeries.length
              ? `${Math.round(
                  energySeries.reduce((sum, item) => sum + item.net, 0) / energySeries.length
                ).toLocaleString()} kcal`
              : "–"}
          </p>
          <p className="text-slate-400 text-sm mt-1">{t("chartDataRange")}</p>
        </div>
      </div>
    </div>
  );
};

export default ProgressCharts;
