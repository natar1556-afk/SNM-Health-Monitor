import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";

const FoodForm = ({ onSubmit }) => {
  const { t } = useLanguage();
  const [form, setForm] = useState({ name: "", calories: "", date: "" });
  const suggestions = [
    { key: "suggestionIdli", calories: 120 },
    { key: "suggestionDosa", calories: 180 },
    { key: "suggestionRice", calories: 200 },
    { key: "suggestionChicken", calories: 220 },
    { key: "suggestionPaneer", calories: 220 },
    { key: "suggestionEggs", calories: 140 },
    { key: "suggestionOats", calories: 150 },
    { key: "suggestionFruit", calories: 100 },
    { key: "suggestionMilk", calories: 150 },
    { key: "suggestionYogurt", calories: 120 },
    { key: "suggestionNuts", calories: 180 },
    { key: "suggestionPoha", calories: 200 },
    { key: "suggestionUpma", calories: 200 },
    { key: "suggestionSambar", calories: 80 },
    { key: "suggestionFish", calories: 200 },
    { key: "suggestionRajma", calories: 210 },
    { key: "suggestionSalad", calories: 90 }
  ];

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => {
      const next = { ...prev, [name]: value };
      if (name === "name") {
        const match = suggestions.find(
          (item) => t(item.key).toLowerCase() === value.trim().toLowerCase()
        );
        if (match) {
          next.calories = String(match.calories);
        }
      }
      return next;
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ ...form, calories: Number(form.calories) });
    setForm({ name: "", calories: "", date: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-4">
      <input
        className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
        name="name"
        placeholder={t("formFoodItem")}
        value={form.name}
        onChange={handleChange}
        list="food-suggestions"
        required
      />
      <datalist id="food-suggestions">
        {suggestions.map((item) => (
          <option key={item.key} value={t(item.key)} />
        ))}
      </datalist>
      <input
        className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
        name="calories"
        type="number"
        placeholder={t("formCalories")}
        value={form.calories}
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
        className="bg-sunrise text-slate-900 font-semibold py-2 rounded-lg hover:shadow-glow transition"
      >
        {t("formAddMeal")}
      </button>
      <p className="md:col-span-4 text-xs text-slate-400">{t("formFoodSuggestions")}</p>
    </form>
  );
};

export default FoodForm;
