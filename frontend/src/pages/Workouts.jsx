import React, { useEffect, useState } from "react";
import api from "../api/axios.js";
import WorkoutForm from "../components/WorkoutForm.jsx";
import HeartRateForm from "../components/HeartRateForm.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";

const Workouts = () => {
  const { t } = useLanguage();
  const [workouts, setWorkouts] = useState([]);
  const [heartRates, setHeartRates] = useState([]);

  const loadWorkouts = async () => {
    const { data } = await api.get("/workouts");
    setWorkouts(data);
  };

  const loadHeartRates = async () => {
    const { data } = await api.get("/heart-rate");
    setHeartRates(data);
  };

  const loadAll = async () => {
    await Promise.all([loadWorkouts(), loadHeartRates()]);
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleAdd = async (payload) => {
    await api.post("/workouts", payload);
    loadWorkouts();
  };

  const handleDelete = async (id) => {
    await api.delete(`/workouts/${id}`);
    loadWorkouts();
  };

  const handleHeartRateAdd = async (payload) => {
    await api.post("/heart-rate", payload);
    loadHeartRates();
  };

  const handleHeartRateDelete = async (id) => {
    await api.delete(`/heart-rate/${id}`);
    loadHeartRates();
  };

  return (
    <section className="space-y-8">
      <div className="glass rounded-3xl p-6">
        <h1 className="section-title">{t("workoutsTitle")}</h1>
        <p className="text-slate-400 mt-2">{t("workoutsSubtitle")}</p>
      </div>

      <div className="glass rounded-3xl p-6">
        <WorkoutForm onSubmit={handleAdd} />
      </div>

      <div className="glass rounded-3xl p-6 space-y-4">
        <h2 className="font-display text-lg">{t("workoutsRecent")}</h2>
        <div className="grid gap-3">
          {workouts.map((workout) => (
            <div
              key={workout._id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-slate-800 rounded-2xl p-4"
            >
              <div>
                <div className="font-semibold">{workout.type}</div>
                <div className="text-sm text-slate-400">
                  {workout.category} · {workout.duration} min · {workout.caloriesBurned} kcal
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400">
                  {new Date(workout.date).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleDelete(workout._id)}
                  className="text-xs uppercase tracking-widest text-red-300 hover:text-red-200"
                >
                  {t("dietDelete")}
                </button>
              </div>
            </div>
          ))}
          {workouts.length === 0 && <p className="text-slate-500">{t("workoutsNone")}</p>}
        </div>
      </div>

      <div className="glass rounded-3xl p-6">
        <h2 className="font-display text-lg">{t("heartRateTitle")}</h2>
        <p className="text-slate-400 mt-2">{t("heartRateSubtitle")}</p>
        <div className="mt-6">
          <HeartRateForm onSubmit={handleHeartRateAdd} />
        </div>
      </div>

      <div className="glass rounded-3xl p-6 space-y-4">
        <h2 className="font-display text-lg">{t("heartRateLog")}</h2>
        <div className="grid gap-3">
          {heartRates.map((entry) => (
            <div
              key={entry._id}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-slate-800 rounded-2xl p-4"
            >
              <div>
                <div className="font-semibold">{entry.bpm} bpm</div>
                <div className="text-sm text-slate-400">{t("heartRateEntry")}</div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-slate-400">
                  {new Date(entry.date).toLocaleDateString()}
                </span>
                <button
                  onClick={() => handleHeartRateDelete(entry._id)}
                  className="text-xs uppercase tracking-widest text-red-300 hover:text-red-200"
                >
                  {t("dietDelete")}
                </button>
              </div>
            </div>
          ))}
          {heartRates.length === 0 && <p className="text-slate-500">{t("heartRateNone")}</p>}
        </div>
      </div>
    </section>
  );
};

export default Workouts;
