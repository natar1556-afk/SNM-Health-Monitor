import React from "react";

const toneClass = {
  ocean: "text-ocean",
  sunrise: "text-sunrise",
  moss: "text-moss"
};

const StatCard = ({ label, value, tone = "ocean" }) => {
  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-2">
      <span className="text-xs uppercase tracking-widest text-slate-400">{label}</span>
      <span className={`text-2xl font-display ${toneClass[tone] || toneClass.ocean}`}>
        {value}
      </span>
    </div>
  );
};

export default StatCard;
