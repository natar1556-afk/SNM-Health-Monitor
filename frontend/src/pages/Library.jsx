import React, { useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";

const exercises = [
  {
    name: "Push-up",
    category: "Strength",
    muscle: "Chest, triceps",
    videoUrl: "https://www.youtube.com/watch?v=_l3ySVKYVJ8"
  },
  {
    name: "Bodyweight Squat",
    category: "Strength",
    muscle: "Legs, glutes",
    videoUrl: "https://www.youtube.com/watch?v=aclHkVaku9U"
  },
  {
    name: "Plank",
    category: "Core",
    muscle: "Core",
    videoUrl: "https://www.youtube.com/watch?v=pSHjTRCQxIw"
  },
  {
    name: "Burpees",
    category: "HIIT",
    muscle: "Full body",
    videoUrl: "https://www.youtube.com/watch?v=TU8QYVW0gDU"
  },
  {
    name: "Jump Rope",
    category: "Cardio",
    muscle: "Cardio",
    videoUrl: "https://www.youtube.com/watch?v=1BZMwQjrNeg"
  },
  {
    name: "Mountain Climbers",
    category: "Cardio",
    muscle: "Core, cardio",
    videoUrl: "https://www.youtube.com/watch?v=nmwgirgXLYM"
  },
  {
    name: "Lunges",
    category: "Strength",
    muscle: "Legs, glutes",
    videoUrl: "https://www.youtube.com/watch?v=QOVaHwm-Q6U"
  },
  {
    name: "Shoulder Press",
    category: "Strength",
    muscle: "Shoulders",
    videoUrl: "https://www.youtube.com/watch?v=B-aVuyhvLHU"
  },
  {
    name: "Yoga Stretch",
    category: "Mobility",
    muscle: "Full body",
    videoUrl: "https://www.youtube.com/watch?v=73sjM9JVbjY"
  },
  {
    name: "Glute Bridge",
    category: "Strength",
    muscle: "Glutes",
    videoUrl: "https://www.youtube.com/watch?v=m2mZVOd0jWY"
  }
];

const categories = ["All", "Strength", "Cardio", "HIIT", "Core", "Mobility"];

const Library = () => {
  const { t } = useLanguage();
  const [category, setCategory] = useState("All");

  const filtered = useMemo(() => {
    if (category === "All") return exercises;
    return exercises.filter((item) => item.category === category);
  }, [category]);

  return (
    <section className="space-y-8">
      <div className="glass rounded-3xl p-6">
        <h1 className="section-title">{t("libraryTitle")}</h1>
        <p className="text-slate-400 mt-2">{t("librarySubtitle")}</p>
        <div className="mt-4">
          <select
            className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {t(`libraryCategory.${cat}`)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="glass rounded-3xl p-6 space-y-4">
        <h2 className="font-display text-lg">{t("libraryListTitle")}</h2>
        <div className="grid gap-3">
          {filtered.map((item) => (
            <div
              key={`${item.name}-${item.category}`}
              className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-slate-800 rounded-2xl p-4"
            >
              <div>
                <div className="font-semibold">{item.name}</div>
                <div className="text-sm text-slate-400">
                  {t("libraryCategoryLabel")}: {t(`libraryCategory.${item.category}`)}
                </div>
              </div>
              <div className="flex flex-col items-start gap-2 md:items-end">
                <div className="text-sm text-slate-400">{item.muscle}</div>
                {item.videoUrl ? (
                  <a
                    className="text-xs uppercase tracking-widest text-ocean hover:text-white transition"
                    href={item.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t("libraryWatchVideo")}
                  </a>
                ) : (
                  <span className="text-xs text-slate-500">{t("libraryVideoUnavailable")}</span>
                )}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-slate-500">{t("libraryEmpty")}</p>}
        </div>
      </div>
    </section>
  );
};

export default Library;
