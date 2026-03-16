import React from "react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useLanguage } from "../context/LanguageContext.jsx";
import { useTheme } from "../context/ThemeContext.jsx";
import logo from "../assets/logo.png";

const navLinkClass = ({ isActive }) =>
  `text-sm font-semibold uppercase tracking-wider ${
    isActive ? "text-ocean" : "text-slate-200 hover:text-white"
  }`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();

  return (
    <header className="px-6 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-3">
        <img src={logo} alt={t("appName")} className="h-10 w-10 rounded-full object-cover" />
        <span className="font-display text-xl">{t("appName")}</span>
      </Link>
      {user && (
        <nav className="flex items-center gap-6">
          <NavLink to="/dashboard" className={navLinkClass}>
            {t("navDashboard")}
          </NavLink>
          <NavLink to="/workouts" className={navLinkClass}>
            {t("navWorkouts")}
          </NavLink>
          <NavLink to="/diet" className={navLinkClass}>
            {t("navNutrition")}
          </NavLink>
          <NavLink to="/profile" className={navLinkClass}>
            {t("navProfile")}
          </NavLink>
          <NavLink to="/library" className={navLinkClass}>
            {t("navLibrary")}
          </NavLink>
          {user.role === "admin" && (
            <NavLink to="/admin" className={navLinkClass}>
              {t("navAdmin")}
            </NavLink>
          )}
          <select
            className="theme-select rounded-lg bg-slate-900/70 border border-slate-700 px-2 py-1 text-xs uppercase tracking-wider text-slate-200"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            aria-label={t("navLanguage")}
          >
            <option value="en">{t("langEnglish")}</option>
            <option value="ta">{t("langTamil")}</option>
          </select>
          <select
            className="theme-select rounded-lg bg-slate-900/70 border border-slate-700 px-2 py-1 text-xs uppercase tracking-wider text-slate-200"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            aria-label={t("navTheme")}
          >
            <option value="system">{t("themeSystem")}</option>
            <option value="light">{t("themeLight")}</option>
            <option value="dark">{t("themeDark")}</option>
          </select>
          <button
            onClick={logout}
            className="text-sm font-semibold uppercase tracking-wider text-slate-200 hover:text-white"
          >
            {t("navLogout")}
          </button>
        </nav>
      )}
    </header>
  );
};

export default Navbar;
