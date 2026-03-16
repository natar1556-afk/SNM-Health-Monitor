import React, { useEffect, useState } from "react";
import api from "../api/axios.js";
import FoodForm from "../components/FoodForm.jsx";
import WaterForm from "../components/WaterForm.jsx";
import StatCard from "../components/StatCard.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

const Diet = () => {
  const { t } = useLanguage();
  const [foods, setFoods] = useState([]);
  const [burned, setBurned] = useState(0);
  const [waterEntries, setWaterEntries] = useState([]);

  const loadData = async () => {
    const [foodsRes, workoutsRes, waterRes] = await Promise.all([
      api.get("/foods"),
      api.get("/workouts"),
      api.get("/water")
    ]);
    setFoods(foodsRes.data);
    setWaterEntries(waterRes.data);
    const burnedTotal = workoutsRes.data.reduce((sum, w) => sum + w.caloriesBurned, 0);
    setBurned(burnedTotal);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdd = async (payload) => {
    await api.post("/foods", payload);
    loadData();
  };

  const handleDelete = async (id) => {
    await api.delete(`/foods/${id}`);
    loadData();
  };

  const handleWaterAdd = async (payload) => {
    await api.post("/water", payload);
    loadData();
  };

  const handleWaterDelete = async (id) => {
    await api.delete(`/water/${id}`);
    loadData();
  };

  const consumed = foods.reduce((sum, f) => sum + f.calories, 0);
  const balance = burned - consumed;
  const totalWater = waterEntries.reduce((sum, entry) => sum + entry.amountMl, 0);
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayWater = waterEntries
    .filter((entry) => new Date(entry.date).toISOString().slice(0, 10) === todayKey)
    .reduce((sum, entry) => sum + entry.amountMl, 0);

  return (
    <section className="space-y-8">
      <div className="glass rounded-3xl p-6">
        <h1 className="section-title">{t("dietTitle")}</h1>
        <p className="text-slate-400 mt-2">{t("dietSubtitle")}</p>
        <div className="grid gap-4 mt-6 md:grid-cols-3">
          <StatCard label={t("statCaloriesConsumed")} value={consumed} tone="sunrise" />
          <StatCard label={t("statCaloriesBurned")} value={burned} tone="ocean" />
          <StatCard label={t("dietBalance")} value={balance} tone="moss" />
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <FoodForm onSubmit={handleAdd} />
      </div>

      <div className="glass rounded-3xl p-6 space-y-4">
        <h2 className="font-display text-lg">{t("dietMealLog")}</h2>
        <div className="grid gap-3">
          {foods.map((food) => (
            <div
              key={food._id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-slate-800 rounded-2xl p-4"
            >
              <div>
                <div className="font-semibold">{food.name}</div>
                <div className="text-sm text-slate-400">{food.calories} kcal</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400">
                  {new Date(food.date).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(food._id)}
                  className="text-xs uppercase tracking-widest text-red-300 hover:text-red-200"
                >
                  {t("dietDelete")}
                </button>
              </div>
            </div>
          ))}
          {foods.length === 0 && <p className="text-slate-500">{t("dietNoMeals")}</p>}
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-lg">{t("dietHydration")}</h2>
        <p className="text-slate-400 mt-2">{t("dietHydrationSubtitle")}</p>
        <div className="grid gap-4 mt-6 md:grid-cols-2">
          <StatCard label={t("dietWaterToday")} value={todayWater} tone="ocean" />
          <StatCard label={t("dietWaterLogged")} value={totalWater} tone="moss" />
        </div>
        <div className="mt-6">
          <WaterForm onSubmit={handleWaterAdd} />
        </div>
      </div>

      <div className="glass rounded-3xl p-6 space-y-4">
        <h2 className="font-display text-lg">{t("dietWaterLog")}</h2>
        <div className="grid gap-3">
          {waterEntries.map((entry) => (
            <div
              key={entry._id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-slate-800 rounded-2xl p-4"
            >
              <div>
                <div className="font-semibold">{entry.amountMl} ml</div>
                <div className="text-sm text-slate-400">{t("dietHydrationEntry")}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400">
                  {new Date(entry.date).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleWaterDelete(entry._id)}
                  className="text-xs uppercase tracking-widest text-red-300 hover:text-red-200"
                >
                  {t("dietDelete")}
                </button>
              </div>
            </div>
          ))}
          {waterEntries.length === 0 && <p className="text-slate-500">{t("dietNoWater")}</p>}
        </div>
      </div>
    </section>
  );
};

export default Diet;
