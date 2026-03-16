import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";

const WorkoutForm = ({ onSubmit }) => {
  const { t } = useLanguage();
  const categories = [
    { value: "Cardio", label: t("categoryCardio") },
    { value: "Strength", label: t("categoryStrength") },
    { value: "Yoga", label: t("categoryYoga") },
    { value: "HIIT", label: t("categoryHIIT") },
    { value: "Mobility", label: t("categoryMobility") },
    { value: "Other", label: t("categoryOther") }
  ];

  const [form, setForm] = useState({
    type: "",
    category: "Cardio",
    duration: "",
    caloriesBurned: "",
    date: ""
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({
      ...form,
      duration: Number(form.duration),
      caloriesBurned: Number(form.caloriesBurned)
    });
    setForm({ type: "", category: "Cardio", duration: "", caloriesBurned: "", date: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-5">
      <input
        className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
        name="type"
        placeholder={t("formWorkoutType")}
        value={form.type}
        onChange={handleChange}
        required
      />
      <select
        className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
        name="category"
        value={form.category}
        onChange={handleChange}
      >
        {categories.map((cat) => (
          <option key={cat.value} value={cat.value}>
            {cat.label}
          </option>
        ))}
      </select>
      <input
        className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
        name="duration"
        type="number"
        placeholder={t("formWorkoutMinutes")}
        value={form.duration}
        onChange={handleChange}
        required
      />
      <input
        className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
        name="caloriesBurned"
        type="number"
        placeholder={t("formCalories")}
        value={form.caloriesBurned}
        onChange={handleChange}
        required
      />
      <input
        className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
        name="date"
        type="date"
        value={form.date}
        onChange={handleChange}
        required
        aria-label={t("formDate")}
      />
      <button
        type="submit"
        className="md:col-span-5 bg-ocean text-slate-900 font-semibold py-2 rounded-lg hover:shadow-glow transition"
      >
        {t("formAddWorkout")}
      </button>
    </form>
  );
};

export default WorkoutForm;
