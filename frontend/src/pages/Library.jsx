import React, { useMemo, useState } from "react";
import { useLanguage } from "../context/LanguageContext.jsx";

const exercises = [
  {
    name: "Push-up",
    category: "Strength",
    muscle: "Chest, triceps",
    videoUrl: "https://www.youtube.com/watch?v=_l3ySVKYVJ8",
    focus: "UpperBody"
  },
  {
    name: "Bodyweight Squat",
    category: "Strength",
    muscle: "Legs, glutes",
    videoUrl: "https://www.youtube.com/watch?v=aclHkVaku9U",
    focus: "LowerBody"
  },
  {
    name: "Plank",
    category: "Core",
    muscle: "Core",
    videoUrl: "https://www.youtube.com/watch?v=pSHjTRCQxIw",
    focus: "Core"
  },
  {
    name: "Burpees",
    category: "HIIT",
    muscle: "Full body",
    videoUrl: "https://www.youtube.com/watch?v=TU8QYVW0gDU",
    focus: "FullBody"
  },
  {
    name: "Jump Rope",
    category: "Cardio",
    muscle: "Cardio",
    videoUrl: "https://www.youtube.com/watch?v=1BZMwQjrNeg",
    focus: "Cardio"
  },
  {
    name: "Mountain Climbers",
    category: "Cardio",
    muscle: "Core, cardio",
    videoUrl: "https://www.youtube.com/watch?v=nmwgirgXLYM",
    focus: "Cardio"
  },
  {
    name: "Lunges",
    category: "Strength",
    muscle: "Legs, glutes",
    videoUrl: "https://www.youtube.com/watch?v=QOVaHwm-Q6U",
    focus: "LowerBody"
  },
  {
    name: "Shoulder Press",
    category: "Strength",
    muscle: "Shoulders",
    videoUrl: "https://www.youtube.com/watch?v=B-aVuyhvLHU",
    focus: "UpperBody"
  },
  {
    name: "Yoga Stretch",
    category: "Mobility",
    muscle: "Full body",
    videoUrl: "https://www.youtube.com/watch?v=73sjM9JVbjY",
    focus: "Mobility"
  },
  {
    name: "Glute Bridge",
    category: "Strength",
    muscle: "Glutes",
    videoUrl: "https://www.youtube.com/watch?v=m2mZVOd0jWY",
    focus: "LowerBody"
  },
  {
    name: "Dead Bug",
    category: "Core",
    muscle: "Deep core",
    videoUrl: "https://www.youtube.com/watch?v=5rJ4bAbhC0A",
    focus: "Core"
  },
  {
    name: "High Knees",
    category: "Cardio",
    muscle: "Legs, cardio",
    videoUrl: "https://www.youtube.com/watch?v=oDdkytliOqE",
    focus: "Cardio"
  },
  {
    name: "Side Plank",
    category: "Core",
    muscle: "Obliques",
    videoUrl: "https://www.youtube.com/watch?v=K3Q4ap2vjbA",
    focus: "Core"
  },
  {
    name: "Resistance Band Row",
    category: "Strength",
    muscle: "Back, biceps",
    videoUrl: "https://www.youtube.com/watch?v=DJQGX2J4IVw",
    focus: "UpperBody"
  },
  {
    name: "Hip Flexor Stretch",
    category: "Mobility",
    muscle: "Hip flexors",
    videoUrl: "https://www.youtube.com/watch?v=XlM4Zk9dZlI",
    focus: "Mobility"
  },
  {
    name: "Jumping Jack",
    category: "Cardio",
    muscle: "Full body",
    videoUrl: "https://www.youtube.com/watch?v=c4DAnQ6DtF8",
    focus: "FullBody"
  },
  {
    name: "Reverse Lunge with Knee Drive",
    category: "Strength",
    muscle: "Legs, balance",
    videoUrl: "https://www.youtube.com/watch?v=ppqvW7tHZ7w",
    focus: "LowerBody"
  },
  {
    name: "Cat-Cow Stretch",
    category: "Mobility",
    muscle: "Spine",
    videoUrl: "https://www.youtube.com/watch?v=Kp2bYWRQylk",
    focus: "Mobility"
  },
  {
    name: "Shadow Boxing",
    category: "HIIT",
    muscle: "Full body, cardio",
    videoUrl: "https://www.youtube.com/watch?v=e2KfNBAkJO0",
    focus: "FullBody"
  }
];

const focusFilters = ["All", "FullBody", "UpperBody", "LowerBody", "Core", "Cardio", "Mobility"];

const Library = () => {
  const { t } = useLanguage();
  const [focusFilter, setFocusFilter] = useState("All");

  const filtered = useMemo(() => {
    if (focusFilter === "All") return exercises;
    return exercises.filter((item) => item.focus === focusFilter);
  }, [focusFilter]);

  return (
    <section className="space-y-8">
      <div className="glass rounded-3xl p-6">
        <h1 className="section-title">{t("libraryTitle")}</h1>
        <p className="text-slate-400 mt-2">{t("librarySubtitle")}</p>
        <div className="mt-4">
          <select
            className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
            value={focusFilter}
            onChange={(e) => setFocusFilter(e.target.value)}
          >
            {focusFilters.map((filter) => (
              <option key={filter} value={filter}>
                {t(`libraryFilter.${filter}`)}
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
                <div className="text-xs uppercase tracking-widest text-slate-500 mt-1">
                  {t("libraryFocusLabel")}: {t(`libraryFilter.${item.focus}`)}
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
