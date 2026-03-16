import React, { useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";

const WaterForm = ({ onSubmit }) => {
  const { t } = useLanguage();
  const [form, setForm] = useState({ amountMl: "", date: "" });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit({ amountMl: Number(form.amountMl), date: form.date });
    setForm({ amountMl: "", date: "" });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
      <input
        className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
        name="amountMl"
        type="number"
        placeholder={t("formWaterMl")}
        value={form.amountMl}
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
        className="bg-ocean text-slate-900 font-semibold py-2 rounded-lg hover:shadow-glow transition"
      >
        {t("formAddWater")}
      </button>
    </form>
  );
};

export default WaterForm;
