import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";

const HeartRateForm = ({ onSubmit }) => {
  const { t } = useLanguage();
  const [form, setForm] = useState({ bpm: "", date: "" });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ bpm: Number(form.bpm), date: form.date });
    setForm({ bpm: "", date: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
      <input
        className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
        name="bpm"
        type="number"
        placeholder={t("formHeartRate")}
        value={form.bpm}
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
        {t("formAddHeartRate")}
      </button>
    </form>
  );
};

export default HeartRateForm;
