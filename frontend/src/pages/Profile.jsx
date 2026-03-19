import React, { useEffect, useMemo, useState } from "react";
import api from "../api/axios.js";
import { calculateBmi, bmiStatus } from "../utils/bmi.js";
import { useLanguage } from "../context/LanguageContext.jsx";

const Profile = () => {
  const { t } = useLanguage();
  const [form, setForm] = useState({
    name: "",
    age: "",
    height: "",
    weight: "",
    gender: "other",
    goals: { targetWeight: "", weeklyWorkouts: "", dailyCalories: "", dailyWaterMl: "" }
  });
  const [bmi, setBmi] = useState(null);
  const [message, setMessage] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [planGoal, setPlanGoal] = useState("maintain");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [reminder, setReminder] = useState({
    enabled: false,
    daysOfWeek: [],
    time: "",
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    channels: ["email"],
    smsNumber: "",
    quietHours: {
      enabled: false,
      start: "",
      end: ""
    }
  });
  const [reminderMessage, setReminderMessage] = useState("");
  const [reminderError, setReminderError] = useState("");

  const loadProfile = async () => {
    const { data } = await api.get("/users/me");
    setForm({
      name: data.profile.name || "",
      age: data.profile.age || "",
      height: data.profile.height || "",
      weight: data.profile.weight || "",
      gender: data.profile.gender || "other",
      goals: {
        targetWeight: data.profile.goals?.targetWeight || "",
        weeklyWorkouts: data.profile.goals?.weeklyWorkouts || "",
        dailyCalories: data.profile.goals?.dailyCalories || "",
        dailyWaterMl: data.profile.goals?.dailyWaterMl || ""
      }
    });
    setBmi(data.profile.bmi ?? calculateBmi(data.profile.height, data.profile.weight));
    const savedReminder = data.profile.reminder || {};
    setReminder((prev) => ({
      ...prev,
      enabled: Boolean(savedReminder.enabled),
      daysOfWeek: savedReminder.daysOfWeek || [],
      time: savedReminder.time || "",
      timeZone: savedReminder.timeZone || prev.timeZone,
      channels: savedReminder.channels?.length
        ? savedReminder.channels
        : prev.channels,
      smsNumber: savedReminder.smsNumber || "",
      quietHours: {
        enabled: savedReminder.quietHours?.enabled || false,
        start: savedReminder.quietHours?.start || "",
        end: savedReminder.quietHours?.end || ""
      }
    }));
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;
    if (name.startsWith("goals.")) {
      const key = name.split(".")[1];
      setForm((prev) => ({ ...prev, goals: { ...prev.goals, [key]: value } }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const isStrongPassword = (password) => {
    if (!password) return false;
    if (password.length < 8 || password.length > 16) return false;
    return (
      /[A-Z]/.test(password) &&
      /[a-z]/.test(password) &&
      /\d/.test(password) &&
      /[^A-Za-z0-9]/.test(password)
    );
  };

  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    veryActive: 1.9
  };

  const ageBmiBands = [
    { min: 18, max: 24, minBmi: 19, maxBmi: 24 },
    { min: 25, max: 34, minBmi: 20, maxBmi: 25 },
    { min: 35, max: 44, minBmi: 21, maxBmi: 26 },
    { min: 45, max: 54, minBmi: 22, maxBmi: 27 },
    { min: 55, max: 64, minBmi: 23, maxBmi: 28 },
    { min: 65, max: 120, minBmi: 24, maxBmi: 29 }
  ];

  const getAgeBand = (age) =>
    ageBmiBands.find((band) => age >= band.min && age <= band.max) || null;

  const toFixed = (value, digits = 0) =>
    Number.isFinite(value) ? Number(value.toFixed(digits)) : null;

  const calcBmr = (gender, heightCm, weightKg, ageYears) => {
    if (!heightCm || !weightKg || !ageYears) return null;
    const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
    if (gender === "male") return base + 5;
    if (gender === "female") return base - 161;
    return base - 78;
  };

  const buildPlan = () => {
    const height = Number(form.height);
    const weight = Number(form.weight);
    const age = Number(form.age);
    const multiplier = activityMultipliers[activityLevel] || 1.55;

    const bmr = calcBmr(form.gender, height, weight, age);
    const tdee = bmr ? bmr * multiplier : null;
    const goalFactor = planGoal === "loss" ? 0.85 : planGoal === "gain" ? 1.12 : 1;
    const targetCalories = tdee ? tdee * goalFactor : null;

    const waterBaseMl = weight ? weight * 35 : null;
    const waterExtra =
      activityLevel === "sedentary"
        ? 0
        : activityLevel === "light"
          ? 250
          : activityLevel === "moderate"
            ? 500
            : activityLevel === "active"
              ? 750
              : 1000;
    const waterTarget = waterBaseMl ? waterBaseMl + waterExtra : null;

    const ageBand = getAgeBand(age);
    const heightM = height ? height / 100 : null;
    const idealMin =
      ageBand && heightM ? toFixed(ageBand.minBmi * heightM * heightM, 1) : null;
    const idealMax =
      ageBand && heightM ? toFixed(ageBand.maxBmi * heightM * heightM, 1) : null;
    const targetBmi = ageBand ? toFixed((ageBand.minBmi + ageBand.maxBmi) / 2, 1) : null;
    const targetWeight =
      targetBmi && heightM ? toFixed(targetBmi * heightM * heightM, 1) : null;

    return {
      bmr: toFixed(bmr, 0),
      tdee: toFixed(tdee, 0),
      targetCalories: toFixed(targetCalories, 0),
      waterTarget: toFixed(waterTarget, 0),
      ageBand,
      idealMin,
      idealMax,
      targetBmi,
      targetWeight
    };
  };

  const splitFoodText = (label) => {
    if (!label) return { name: "--", amount: "--" };
    const match = label.match(/^(.*?)\s*\(([^)]+)\)\s*$/);
    if (match) {
      return { name: match[1].trim(), amount: match[2].trim() };
    }
    return { name: label, amount: "--" };
  };

  const liveBmi = useMemo(
    () => calculateBmi(Number(form.height), Number(form.weight)),
    [form.height, form.weight]
  );
  const status = bmiStatus(liveBmi);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    const toNumberOrUndefined = (value) => {
      if (value === "" || value === null || value === undefined) return undefined;
      return Number(value);
    };
    const payload = {
      ...form,
      age: toNumberOrUndefined(form.age),
      height: toNumberOrUndefined(form.height),
      weight: toNumberOrUndefined(form.weight),
      goals: {
        targetWeight: toNumberOrUndefined(form.goals.targetWeight),
        weeklyWorkouts: toNumberOrUndefined(form.goals.weeklyWorkouts),
        dailyCalories: toNumberOrUndefined(form.goals.dailyCalories),
        dailyWaterMl: toNumberOrUndefined(form.goals.dailyWaterMl)
      }
    };

    const { data } = await api.put("/users/me", payload);
    setMessage("Profile updated successfully");
    setBmi(data.profile.bmi);
  };

  const handlePasswordSubmit = async (event) => {
    event.preventDefault();
    setPasswordError("");
    setPasswordMessage("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("New password and confirm password do not match.");
      return;
    }
    if (!isStrongPassword(passwordForm.newPassword)) {
      setPasswordError(
        "Password must be 8-16 characters and include at least 1 uppercase, 1 lowercase, 1 number, and 1 special character."
      );
      return;
    }
    try {
      const { data } = await api.put("/users/me/password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordMessage(data.message || "Password updated successfully");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordError(err?.response?.data?.message || "Failed to update password");
    }
  };

  const handleReminderChange = (event) => {
    const { name, value, type, checked } = event.target;
    setReminder((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const toggleReminderDay = (day) => {
    setReminder((prev) => {
      const exists = prev.daysOfWeek.includes(day);
      const daysOfWeek = exists
        ? prev.daysOfWeek.filter((d) => d !== day)
        : [...prev.daysOfWeek, day].sort((a, b) => a - b);
      return { ...prev, daysOfWeek };
    });
  };

  const toggleReminderChannel = (channel) => {
    setReminder((prev) => {
      const exists = prev.channels.includes(channel);
      const channels = exists
        ? prev.channels.filter((value) => value !== channel)
        : [...prev.channels, channel];
      return { ...prev, channels };
    });
  };

  const toggleQuietHours = () => {
    setReminder((prev) => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        enabled: !prev.quietHours.enabled
      }
    }));
  };

  const handleQuietHoursTimeChange = (field, value) => {
    setReminder((prev) => ({
      ...prev,
      quietHours: {
        ...prev.quietHours,
        [field]: value
      }
    }));
  };

  const handleReminderSubmit = async (event) => {
    event.preventDefault();
    setReminderError("");
    setReminderMessage("");
    if (
      reminder.enabled &&
      (!reminder.time || reminder.daysOfWeek.length === 0 || reminder.channels.length === 0)
    ) {
      setReminderError(t("reminderValidation"));
      return;
    }
    if (reminder.enabled && reminder.channels.includes("sms") && !reminder.smsNumber) {
      setReminderError(t("reminderSmsValidation"));
      return;
    }
    if (
      reminder.enabled &&
      reminder.quietHours?.enabled &&
      (!reminder.quietHours.start || !reminder.quietHours.end)
    ) {
      setReminderError(t("reminderQuietValidation"));
      return;
    }
    try {
      const payload = {
        enabled: reminder.enabled,
        daysOfWeek: reminder.enabled ? reminder.daysOfWeek : [],
        time: reminder.enabled ? reminder.time : "",
        timeZone: reminder.timeZone,
        channels: reminder.enabled ? reminder.channels : [],
        smsNumber: reminder.enabled ? reminder.smsNumber : "",
        quietHours: reminder.enabled
          ? {
              enabled: reminder.quietHours?.enabled || false,
              start: reminder.quietHours?.enabled ? reminder.quietHours.start : "",
              end: reminder.quietHours?.enabled ? reminder.quietHours.end : ""
            }
          : { enabled: false }
      };
      const { data } = await api.put("/users/me/reminder", payload);
      setReminderMessage(data.message || t("reminderSaved"));
      if (data.reminder) {
        const saved = data.reminder;
        setReminder((prev) => ({
          ...prev,
          enabled: Boolean(saved.enabled),
          daysOfWeek: saved.daysOfWeek || [],
          time: saved.time || "",
          timeZone: saved.timeZone || prev.timeZone,
          channels: saved.channels?.length ? saved.channels : prev.channels,
          smsNumber: saved.smsNumber || "",
          quietHours: {
            enabled: saved.quietHours?.enabled || false,
            start: saved.quietHours?.start || "",
            end: saved.quietHours?.end || ""
          }
        }));
      }
    } catch (err) {
      setReminderError(err?.response?.data?.message || t("reminderFailed"));
    }
  };

  const plan = buildPlan();
  const workoutGuidance =
    planGoal === "loss"
      ? t("planGuidanceLoss")
      : planGoal === "gain"
        ? t("planGuidanceGain")
        : t("planGuidanceMaintain");

  const weeklyPlans = {
    loss: [
      {
        title: t("planWeekA"),
        focus: t("planLossFocusA"),
        sessions: t("planLossSessionsA"),
        nutrition: t("planLossNutritionA"),
        hydration: t("planLossHydrationA")
      },
      {
        title: t("planWeekB"),
        focus: t("planLossFocusB"),
        sessions: t("planLossSessionsB"),
        nutrition: t("planLossNutritionB"),
        hydration: t("planLossHydrationB")
      }
    ],
    gain: [
      {
        title: t("planWeekA"),
        focus: t("planGainFocusA"),
        sessions: t("planGainSessionsA"),
        nutrition: t("planGainNutritionA"),
        hydration: t("planGainHydrationA")
      },
      {
        title: t("planWeekB"),
        focus: t("planGainFocusB"),
        sessions: t("planGainSessionsB"),
        nutrition: t("planGainNutritionB"),
        hydration: t("planGainHydrationB")
      }
    ]
  };

  const weeklyMealPlans = {
    gain: [
      {
        dayKey: "dayMon",
        meals: {
          breakfast: [
            { key: "gainFoodOats", calories: 150 },
            { key: "gainFoodMilk", calories: 150 },
            { key: "gainFoodBanana", calories: 105 }
          ],
          lunch: [
            { key: "gainFoodRice", calories: 200 },
            { key: "gainFoodChicken", calories: 220 },
            { key: "gainFoodVeg", calories: 80 }
          ],
          snack: [
            { key: "gainFoodNuts", calories: 180 },
            { key: "gainFoodYogurt", calories: 120 }
          ],
          dinner: [
            { key: "gainFoodPaneer", calories: 260 },
            { key: "gainFoodRoti", calories: 180 },
            { key: "gainFoodVeg", calories: 80 }
          ]
        }
      },
      {
        dayKey: "dayTue",
        meals: {
          breakfast: [
            { key: "gainFoodIdli", calories: 180 },
            { key: "gainFoodSambar", calories: 90 }
          ],
          lunch: [
            { key: "gainFoodRice", calories: 200 },
            { key: "gainFoodFish", calories: 200 },
            { key: "gainFoodVeg", calories: 80 }
          ],
          snack: [
            { key: "gainFoodPeanutButter", calories: 190 },
            { key: "gainFoodBread", calories: 160 }
          ],
          dinner: [
            { key: "gainFoodEggs", calories: 140 },
            { key: "gainFoodRoti", calories: 180 },
            { key: "gainFoodVeg", calories: 80 }
          ]
        }
      },
      {
        dayKey: "dayWed",
        meals: {
          breakfast: [
            { key: "gainFoodPoha", calories: 220 },
            { key: "gainFoodMilk", calories: 150 }
          ],
          lunch: [
            { key: "gainFoodRice", calories: 200 },
            { key: "gainFoodChicken", calories: 220 },
            { key: "gainFoodVeg", calories: 80 }
          ],
          snack: [
            { key: "gainFoodBanana", calories: 105 },
            { key: "gainFoodNuts", calories: 180 }
          ],
          dinner: [
            { key: "gainFoodPaneer", calories: 260 },
            { key: "gainFoodRoti", calories: 180 },
            { key: "gainFoodVeg", calories: 80 }
          ]
        }
      },
      {
        dayKey: "dayThu",
        meals: {
          breakfast: [
            { key: "gainFoodOats", calories: 150 },
            { key: "gainFoodPeanutButter", calories: 190 }
          ],
          lunch: [
            { key: "gainFoodRice", calories: 200 },
            { key: "gainFoodRajma", calories: 210 },
            { key: "gainFoodVeg", calories: 80 }
          ],
          snack: [
            { key: "gainFoodYogurt", calories: 120 },
            { key: "gainFoodFruitBowl", calories: 160 }
          ],
          dinner: [
            { key: "gainFoodEggs", calories: 140 },
            { key: "gainFoodRoti", calories: 180 },
            { key: "gainFoodVeg", calories: 80 }
          ]
        }
      },
      {
        dayKey: "dayFri",
        meals: {
          breakfast: [
            { key: "gainFoodUpma", calories: 220 },
            { key: "gainFoodMilk", calories: 150 }
          ],
          lunch: [
            { key: "gainFoodRice", calories: 200 },
            { key: "gainFoodPaneer", calories: 260 },
            { key: "gainFoodVeg", calories: 80 }
          ],
          snack: [
            { key: "gainFoodBanana", calories: 105 },
            { key: "gainFoodNuts", calories: 180 }
          ],
          dinner: [
            { key: "gainFoodChicken", calories: 220 },
            { key: "gainFoodRoti", calories: 180 },
            { key: "gainFoodVeg", calories: 80 }
          ]
        }
      },
      {
        dayKey: "daySat",
        meals: {
          breakfast: [
            { key: "gainFoodDosa", calories: 220 },
            { key: "gainFoodSambar", calories: 90 }
          ],
          lunch: [
            { key: "gainFoodRice", calories: 200 },
            { key: "gainFoodFish", calories: 200 },
            { key: "gainFoodVeg", calories: 80 }
          ],
          snack: [
            { key: "gainFoodPeanutButter", calories: 190 },
            { key: "gainFoodBread", calories: 160 }
          ],
          dinner: [
            { key: "gainFoodPaneer", calories: 260 },
            { key: "gainFoodRoti", calories: 180 },
            { key: "gainFoodVeg", calories: 80 }
          ]
        }
      },
      {
        dayKey: "daySun",
        meals: {
          breakfast: [
            { key: "gainFoodOats", calories: 150 },
            { key: "gainFoodBanana", calories: 105 },
            { key: "gainFoodMilk", calories: 150 }
          ],
          lunch: [
            { key: "gainFoodRice", calories: 200 },
            { key: "gainFoodChicken", calories: 220 },
            { key: "gainFoodVeg", calories: 80 }
          ],
          snack: [
            { key: "gainFoodYogurt", calories: 120 },
            { key: "gainFoodFruitBowl", calories: 160 }
          ],
          dinner: [
            { key: "gainFoodEggs", calories: 140 },
            { key: "gainFoodRoti", calories: 180 },
            { key: "gainFoodVeg", calories: 80 }
          ]
        }
      }
    ],
    maintain: [
      {
        dayKey: "dayMon",
        meals: {
          breakfast: [
            { key: "maintainFoodOats", calories: 140 },
            { key: "maintainFoodFruit", calories: 90 }
          ],
          lunch: [
            { key: "maintainFoodRice", calories: 180 },
            { key: "maintainFoodChicken", calories: 200 },
            { key: "maintainFoodVeg", calories: 70 }
          ],
          snack: [
            { key: "maintainFoodNuts", calories: 150 },
            { key: "maintainFoodYogurt", calories: 100 }
          ],
          dinner: [
            { key: "maintainFoodRoti", calories: 160 },
            { key: "maintainFoodPaneer", calories: 220 },
            { key: "maintainFoodVeg", calories: 70 }
          ]
        }
      },
      {
        dayKey: "dayTue",
        meals: {
          breakfast: [
            { key: "maintainFoodIdli", calories: 160 },
            { key: "maintainFoodSambar", calories: 70 }
          ],
          lunch: [
            { key: "maintainFoodRice", calories: 180 },
            { key: "maintainFoodFish", calories: 190 },
            { key: "maintainFoodVeg", calories: 70 }
          ],
          snack: [
            { key: "maintainFoodFruit", calories: 90 },
            { key: "maintainFoodNuts", calories: 150 }
          ],
          dinner: [
            { key: "maintainFoodEggs", calories: 120 },
            { key: "maintainFoodRoti", calories: 160 },
            { key: "maintainFoodVeg", calories: 70 }
          ]
        }
      },
      {
        dayKey: "dayWed",
        meals: {
          breakfast: [
            { key: "maintainFoodPoha", calories: 190 },
            { key: "maintainFoodMilk", calories: 120 }
          ],
          lunch: [
            { key: "maintainFoodRice", calories: 180 },
            { key: "maintainFoodRajma", calories: 190 },
            { key: "maintainFoodVeg", calories: 70 }
          ],
          snack: [
            { key: "maintainFoodYogurt", calories: 100 },
            { key: "maintainFoodFruit", calories: 90 }
          ],
          dinner: [
            { key: "maintainFoodPaneer", calories: 220 },
            { key: "maintainFoodRoti", calories: 160 },
            { key: "maintainFoodVeg", calories: 70 }
          ]
        }
      },
      {
        dayKey: "dayThu",
        meals: {
          breakfast: [
            { key: "maintainFoodOats", calories: 140 },
            { key: "maintainFoodMilk", calories: 120 }
          ],
          lunch: [
            { key: "maintainFoodRice", calories: 180 },
            { key: "maintainFoodChicken", calories: 200 },
            { key: "maintainFoodVeg", calories: 70 }
          ],
          snack: [
            { key: "maintainFoodNuts", calories: 150 },
            { key: "maintainFoodFruit", calories: 90 }
          ],
          dinner: [
            { key: "maintainFoodEggs", calories: 120 },
            { key: "maintainFoodRoti", calories: 160 },
            { key: "maintainFoodVeg", calories: 70 }
          ]
        }
      },
      {
        dayKey: "dayFri",
        meals: {
          breakfast: [
            { key: "maintainFoodUpma", calories: 190 },
            { key: "maintainFoodMilk", calories: 120 }
          ],
          lunch: [
            { key: "maintainFoodRice", calories: 180 },
            { key: "maintainFoodFish", calories: 190 },
            { key: "maintainFoodVeg", calories: 70 }
          ],
          snack: [
            { key: "maintainFoodYogurt", calories: 100 },
            { key: "maintainFoodNuts", calories: 150 }
          ],
          dinner: [
            { key: "maintainFoodPaneer", calories: 220 },
            { key: "maintainFoodRoti", calories: 160 },
            { key: "maintainFoodVeg", calories: 70 }
          ]
        }
      },
      {
        dayKey: "daySat",
        meals: {
          breakfast: [
            { key: "maintainFoodDosa", calories: 200 },
            { key: "maintainFoodSambar", calories: 70 }
          ],
          lunch: [
            { key: "maintainFoodRice", calories: 180 },
            { key: "maintainFoodChicken", calories: 200 },
            { key: "maintainFoodVeg", calories: 70 }
          ],
          snack: [
            { key: "maintainFoodFruit", calories: 90 },
            { key: "maintainFoodNuts", calories: 150 }
          ],
          dinner: [
            { key: "maintainFoodEggs", calories: 120 },
            { key: "maintainFoodRoti", calories: 160 },
            { key: "maintainFoodVeg", calories: 70 }
          ]
        }
      },
      {
        dayKey: "daySun",
        meals: {
          breakfast: [
            { key: "maintainFoodOats", calories: 140 },
            { key: "maintainFoodFruit", calories: 90 }
          ],
          lunch: [
            { key: "maintainFoodRice", calories: 180 },
            { key: "maintainFoodRajma", calories: 190 },
            { key: "maintainFoodVeg", calories: 70 }
          ],
          snack: [
            { key: "maintainFoodYogurt", calories: 100 },
            { key: "maintainFoodNuts", calories: 150 }
          ],
          dinner: [
            { key: "maintainFoodPaneer", calories: 220 },
            { key: "maintainFoodRoti", calories: 160 },
            { key: "maintainFoodVeg", calories: 70 }
          ]
        }
      }
    ],
    loss: [
      {
        dayKey: "dayMon",
        meals: {
          breakfast: [
            { key: "lossFoodOats", calories: 120 },
            { key: "lossFoodFruit", calories: 80 }
          ],
          lunch: [
            { key: "lossFoodRice", calories: 150 },
            { key: "lossFoodChicken", calories: 180 },
            { key: "lossFoodVeg", calories: 60 }
          ],
          snack: [
            { key: "lossFoodNuts", calories: 120 },
            { key: "lossFoodYogurt", calories: 80 }
          ],
          dinner: [
            { key: "lossFoodRoti", calories: 140 },
            { key: "lossFoodPaneer", calories: 180 },
            { key: "lossFoodVeg", calories: 60 }
          ]
        }
      },
      {
        dayKey: "dayTue",
        meals: {
          breakfast: [
            { key: "lossFoodIdli", calories: 140 },
            { key: "lossFoodSambar", calories: 60 }
          ],
          lunch: [
            { key: "lossFoodRice", calories: 150 },
            { key: "lossFoodFish", calories: 170 },
            { key: "lossFoodVeg", calories: 60 }
          ],
          snack: [
            { key: "lossFoodFruit", calories: 80 },
            { key: "lossFoodNuts", calories: 120 }
          ],
          dinner: [
            { key: "lossFoodEggs", calories: 110 },
            { key: "lossFoodRoti", calories: 140 },
            { key: "lossFoodVeg", calories: 60 }
          ]
        }
      },
      {
        dayKey: "dayWed",
        meals: {
          breakfast: [
            { key: "lossFoodPoha", calories: 160 },
            { key: "lossFoodMilk", calories: 100 }
          ],
          lunch: [
            { key: "lossFoodRice", calories: 150 },
            { key: "lossFoodRajma", calories: 170 },
            { key: "lossFoodVeg", calories: 60 }
          ],
          snack: [
            { key: "lossFoodYogurt", calories: 80 },
            { key: "lossFoodFruit", calories: 80 }
          ],
          dinner: [
            { key: "lossFoodPaneer", calories: 180 },
            { key: "lossFoodRoti", calories: 140 },
            { key: "lossFoodVeg", calories: 60 }
          ]
        }
      },
      {
        dayKey: "dayThu",
        meals: {
          breakfast: [
            { key: "lossFoodOats", calories: 120 },
            { key: "lossFoodMilk", calories: 100 }
          ],
          lunch: [
            { key: "lossFoodRice", calories: 150 },
            { key: "lossFoodChicken", calories: 180 },
            { key: "lossFoodVeg", calories: 60 }
          ],
          snack: [
            { key: "lossFoodNuts", calories: 120 },
            { key: "lossFoodFruit", calories: 80 }
          ],
          dinner: [
            { key: "lossFoodEggs", calories: 110 },
            { key: "lossFoodRoti", calories: 140 },
            { key: "lossFoodVeg", calories: 60 }
          ]
        }
      },
      {
        dayKey: "dayFri",
        meals: {
          breakfast: [
            { key: "lossFoodUpma", calories: 160 },
            { key: "lossFoodMilk", calories: 100 }
          ],
          lunch: [
            { key: "lossFoodRice", calories: 150 },
            { key: "lossFoodFish", calories: 170 },
            { key: "lossFoodVeg", calories: 60 }
          ],
          snack: [
            { key: "lossFoodYogurt", calories: 80 },
            { key: "lossFoodNuts", calories: 120 }
          ],
          dinner: [
            { key: "lossFoodPaneer", calories: 180 },
            { key: "lossFoodRoti", calories: 140 },
            { key: "lossFoodVeg", calories: 60 }
          ]
        }
      },
      {
        dayKey: "daySat",
        meals: {
          breakfast: [
            { key: "lossFoodDosa", calories: 170 },
            { key: "lossFoodSambar", calories: 60 }
          ],
          lunch: [
            { key: "lossFoodRice", calories: 150 },
            { key: "lossFoodChicken", calories: 180 },
            { key: "lossFoodVeg", calories: 60 }
          ],
          snack: [
            { key: "lossFoodFruit", calories: 80 },
            { key: "lossFoodNuts", calories: 120 }
          ],
          dinner: [
            { key: "lossFoodEggs", calories: 110 },
            { key: "lossFoodRoti", calories: 140 },
            { key: "lossFoodVeg", calories: 60 }
          ]
        }
      },
      {
        dayKey: "daySun",
        meals: {
          breakfast: [
            { key: "lossFoodOats", calories: 120 },
            { key: "lossFoodFruit", calories: 80 }
          ],
          lunch: [
            { key: "lossFoodRice", calories: 150 },
            { key: "lossFoodRajma", calories: 170 },
            { key: "lossFoodVeg", calories: 60 }
          ],
          snack: [
            { key: "lossFoodYogurt", calories: 80 },
            { key: "lossFoodNuts", calories: 120 }
          ],
          dinner: [
            { key: "lossFoodPaneer", calories: 180 },
            { key: "lossFoodRoti", calories: 140 },
            { key: "lossFoodVeg", calories: 60 }
          ]
        }
      }
    ]
  };
  const currentMealPlan = weeklyMealPlans[planGoal] || weeklyMealPlans.maintain;

  return (
    <section className="space-y-8">
      <div className="glass rounded-3xl p-6">
        <h1 className="section-title">{t("profileTitle")}</h1>
        <p className="text-slate-400 mt-2">{t("profileSubtitle")}</p>
        <div className="mt-4 text-sm text-slate-300">
          {t("profileBmi")}: {liveBmi ?? bmi ?? "--"}
          {status && (
            <span className={`ml-3 font-semibold ${status.tone}`}>{status.label}</span>
          )}
        </div>
        <div className="mt-3 text-sm text-slate-400">
          {t("profileAge")}: {form.age || "--"} · {t("profileHeight")}: {form.height || "--"} · {t("profileWeight")}: {form.weight || "--"}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="glass rounded-3xl p-6 grid gap-4 md:grid-cols-2">
        <input
          className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
          name="name"
          placeholder={t("registerName")}
          value={form.name}
          onChange={handleChange}
        />
        <input
          className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
          name="age"
          type="number"
          placeholder={t("profileAge")}
          value={form.age}
          onChange={handleChange}
        />
        <input
          className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
          name="height"
          type="number"
          placeholder={t("profileHeight")}
          value={form.height}
          onChange={handleChange}
        />
        <input
          className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
          name="weight"
          type="number"
          placeholder={t("profileWeight")}
          value={form.weight}
          onChange={handleChange}
        />
        <select
          className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
          name="gender"
          value={form.gender}
          onChange={handleChange}
        >
          <option value="male">{t("profileGenderMale")}</option>
          <option value="female">{t("profileGenderFemale")}</option>
          <option value="other">{t("profileGenderOther")}</option>
        </select>
        <div className="md:col-span-2">
          <h3 className="font-display text-lg">{t("profileGoals")}</h3>
        </div>
        <input
          className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
          name="goals.targetWeight"
          type="number"
          placeholder={t("profileTargetWeight")}
          value={form.goals.targetWeight}
          onChange={handleChange}
        />
        <input
          className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
          name="goals.weeklyWorkouts"
          type="number"
          placeholder={t("profileWeeklyWorkouts")}
          value={form.goals.weeklyWorkouts}
          onChange={handleChange}
        />
        <input
          className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
          name="goals.dailyCalories"
          type="number"
          placeholder={t("profileDailyCalories")}
          value={form.goals.dailyCalories}
          onChange={handleChange}
        />
        <input
          className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
          name="goals.dailyWaterMl"
          type="number"
          placeholder={t("profileDailyWater")}
          value={form.goals.dailyWaterMl}
          onChange={handleChange}
        />
        {message && <p className="text-sm text-moss md:col-span-2">{message}</p>}
        <button className="md:col-span-2 bg-ocean text-slate-900 font-semibold py-3 rounded-lg hover:shadow-glow transition">
          {t("profileSave")}
        </button>
      </form>

      <form onSubmit={handlePasswordSubmit} className="glass rounded-3xl p-6 grid gap-4">
        <div>
          <h3 className="font-display text-lg">{t("profilePasswordTitle")}</h3>
          <p className="text-sm text-slate-400 mt-1">{t("profilePasswordHint")}</p>
        </div>
        <input
          className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
          name="currentPassword"
          type="password"
          placeholder={t("profileCurrentPassword")}
          value={passwordForm.currentPassword}
          onChange={handlePasswordChange}
          required
        />
        <input
          className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
          name="newPassword"
          type="password"
          placeholder={t("profileNewPassword")}
          value={passwordForm.newPassword}
          onChange={handlePasswordChange}
          required
        />
        <input
          className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
          name="confirmPassword"
          type="password"
          placeholder={t("profileConfirmPassword")}
          value={passwordForm.confirmPassword}
          onChange={handlePasswordChange}
          required
        />
        {passwordError && <p className="text-sm text-red-300">{passwordError}</p>}
        {passwordMessage && <p className="text-sm text-moss">{passwordMessage}</p>}
        <button className="bg-sunrise text-slate-900 font-semibold py-3 rounded-lg hover:shadow-glow transition">
          {t("profileUpdatePassword")}
        </button>
      </form>

      <form onSubmit={handleReminderSubmit} className="glass rounded-3xl p-6 space-y-4">
        <div>
          <h3 className="font-display text-lg">{t("reminderTitle")}</h3>
          <p className="text-sm text-slate-400 mt-1">{t("reminderSubtitle")}</p>
        </div>
        <label className="flex items-center gap-3 text-sm text-slate-300">
          <input
            type="checkbox"
            name="enabled"
            checked={reminder.enabled}
            onChange={handleReminderChange}
          />
          {t("reminderEnable")}
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
            type="time"
            name="time"
            value={reminder.time}
            onChange={handleReminderChange}
            disabled={!reminder.enabled}
          />
          <input
            className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
            name="timeZone"
            value={reminder.timeZone}
            onChange={handleReminderChange}
            disabled={!reminder.enabled}
          />
        </div>
        <div className="grid gap-2 md:grid-cols-7">
          {[0, 1, 2, 3, 4, 5, 6].map((day) => (
            <button
              type="button"
              key={day}
              onClick={() => toggleReminderDay(day)}
              disabled={!reminder.enabled}
              className={`rounded-lg border px-2 py-1 text-xs uppercase tracking-widest transition ${
                reminder.daysOfWeek.includes(day)
                  ? "border-ocean text-ocean"
                  : "border-slate-700 text-slate-400"
              }`}
            >
              {t(`reminderDay.${day}`)}
            </button>
          ))}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-300">{t("reminderChannelLabel")}</p>
            <p className="text-xs text-slate-500">{t("reminderChannelsHint")}</p>
          </div>
          <div className="flex flex-wrap gap-4 mt-3">
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={reminder.channels.includes("email")}
                onChange={() => toggleReminderChannel("email")}
                disabled={!reminder.enabled}
              />
              {t("reminderChannelEmail")}
            </label>
            <label className="flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={reminder.channels.includes("sms")}
                onChange={() => toggleReminderChannel("sms")}
                disabled={!reminder.enabled}
              />
              {t("reminderChannelSms")}
            </label>
          </div>
        </div>
        <div className="grid gap-2 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="text-sm text-slate-300">{t("reminderPhone")}</label>
            <input
              className="mt-2 w-full rounded-lg bg-slate-900/70 border border-slate-700 p-2"
              name="smsNumber"
              placeholder="+919876543210"
              value={reminder.smsNumber}
              onChange={handleReminderChange}
              disabled={!reminder.enabled || !reminder.channels.includes("sms")}
            />
            <p className="text-xs text-slate-500 mt-1">{t("reminderPhoneHint")}</p>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm text-slate-300">{t("reminderQuietHours")}</p>
              <p className="text-xs text-slate-500">{t("reminderQuietHoursHint")}</p>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-300">
              <input
                type="checkbox"
                checked={reminder.quietHours.enabled}
                onChange={toggleQuietHours}
                disabled={!reminder.enabled}
              />
              {t("reminderQuietHours")}
            </label>
          </div>
          <div className="grid gap-4 mt-4 md:grid-cols-2">
            <div>
              <label className="text-xs text-slate-400">{t("reminderQuietStart")}</label>
              <input
                type="time"
                className="mt-2 w-full rounded-lg bg-slate-900/70 border border-slate-700 p-2"
                value={reminder.quietHours.start}
                onChange={(event) => handleQuietHoursTimeChange("start", event.target.value)}
                disabled={!reminder.enabled || !reminder.quietHours.enabled}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">{t("reminderQuietEnd")}</label>
              <input
                type="time"
                className="mt-2 w-full rounded-lg bg-slate-900/70 border border-slate-700 p-2"
                value={reminder.quietHours.end}
                onChange={(event) => handleQuietHoursTimeChange("end", event.target.value)}
                disabled={!reminder.enabled || !reminder.quietHours.enabled}
              />
            </div>
          </div>
        </div>
        {reminderError && <p className="text-sm text-red-300">{reminderError}</p>}
        {reminderMessage && <p className="text-sm text-moss">{reminderMessage}</p>}
        <button className="bg-ocean text-slate-900 font-semibold py-3 rounded-lg hover:shadow-glow transition">
          {t("reminderSave")}
        </button>
      </form>

      <div className="glass rounded-3xl p-6 space-y-4">
        <div>
          <h3 className="font-display text-lg">{t("profileAgeGuidance")}</h3>
          <p className="text-sm text-slate-400 mt-1">{t("profileAgeHint")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-xs uppercase tracking-widest text-slate-400">
              {t("profileAgeBand")}
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-100">
              {plan.ageBand ? `${plan.ageBand.min}-${plan.ageBand.max}` : "--"}
            </div>
            <div className="mt-1 text-xs text-slate-500">{t("profileAgeBandHint")}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-xs uppercase tracking-widest text-slate-400">
              {t("profileTargetBmi")}
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-100">
              {plan.targetBmi ? `${plan.targetBmi}` : "--"}
            </div>
            <div className="mt-1 text-xs text-slate-500">{t("profileTargetBmiHint")}</div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-xs uppercase tracking-widest text-slate-400">
              {t("profileTargetWeightSingle")}
            </div>
            <div className="mt-2 text-2xl font-semibold text-slate-100">
              {plan.targetWeight ? `${plan.targetWeight} kg` : "--"}
            </div>
            <div className="mt-1 text-xs text-slate-500">{t("profileTargetWeightHint")}</div>
          </div>
        </div>
      </div>

      <div className="glass rounded-3xl p-6 space-y-4">
        <div>
          <h3 className="font-display text-lg">{t("profileGoalPlan")}</h3>
          <p className="text-sm text-slate-400 mt-1">{t("profileGoalHint")}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <select
            className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
            value={planGoal}
            onChange={(e) => setPlanGoal(e.target.value)}
          >
            <option value="loss">{t("profileGoalLoss")}</option>
            <option value="maintain">{t("profileGoalMaintain")}</option>
            <option value="gain">{t("profileGoalGain")}</option>
          </select>
          <select
            className="rounded-lg bg-slate-900/70 border border-slate-700 p-2"
            value={activityLevel}
            onChange={(e) => setActivityLevel(e.target.value)}
          >
            <option value="sedentary">{t("profileActivitySedentary")}</option>
            <option value="light">{t("profileActivityLight")}</option>
            <option value="moderate">{t("profileActivityModerate")}</option>
            <option value="active">{t("profileActivityActive")}</option>
            <option value="veryActive">{t("profileActivityVeryActive")}</option>
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-xs uppercase tracking-widest text-slate-400">{t("profileBmr")}</div>
            <div className="mt-2 text-lg font-semibold">
              {plan.bmr ? `${plan.bmr} kcal` : "--"}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-xs uppercase tracking-widest text-slate-400">{t("profileTdee")}</div>
            <div className="mt-2 text-lg font-semibold">
              {plan.tdee ? `${plan.tdee} kcal` : "--"}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-xs uppercase tracking-widest text-slate-400">
              {t("profileTargetCalories")}
            </div>
            <div className="mt-2 text-lg font-semibold">
              {plan.targetCalories ? `${plan.targetCalories} kcal` : "--"}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
            <div className="text-xs uppercase tracking-widest text-slate-400">
              {t("profileWaterTarget")}
            </div>
            <div className="mt-2 text-lg font-semibold">
              {plan.waterTarget ? `${plan.waterTarget} ml` : "--"}
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4">
          <div className="text-xs uppercase tracking-widest text-slate-400">{t("profileWorkoutGuidance")}</div>
          <p className="mt-2 text-sm text-slate-300">{workoutGuidance}</p>
        </div>
        {planGoal !== "maintain" && (
          <div className="grid gap-4 md:grid-cols-2">
            {weeklyPlans[planGoal].map((planCard) => (
              <div
                key={planCard.title}
                className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-2"
              >
                <div className="text-sm font-semibold text-slate-100">{planCard.title}</div>
                <div className="text-xs uppercase tracking-widest text-slate-400">
                  {planCard.focus}
                </div>
                <p className="text-sm text-slate-300">{planCard.sessions}</p>
                <p className="text-sm text-slate-300">{planCard.nutrition}</p>
                <p className="text-sm text-slate-300">{planCard.hydration}</p>
              </div>
            ))}
          </div>
        )}
        {(planGoal === "gain" || planGoal === "loss" || planGoal === "maintain") && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-4 space-y-4">
            <div>
              <div className="text-sm font-semibold text-slate-100">{t("weeklyMealTitle")}</div>
              <p className="text-sm text-slate-300">{t("weeklyMealSubtitle")}</p>
            </div>
            <div className="grid gap-4">
              {currentMealPlan.map((day) => (
                <div key={day.dayKey} className="rounded-xl border border-slate-800/60 p-3">
                  <div className="text-xs uppercase tracking-widest text-slate-400">
                    {t(day.dayKey)}
                  </div>
                  <div className="mt-2 grid gap-2">
                    {["breakfast", "lunch", "snack", "dinner"].map((slot) => (
                      <div key={`${day.dayKey}-${slot}`} className="space-y-1">
                        <div className="text-xs uppercase tracking-widest text-slate-500">
                          {t(`meal.${slot}`)}
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-xs uppercase tracking-widest text-slate-500">
                          <span>{t("mealColFood")}</span>
                          <span>{t("mealColAmount")}</span>
                          <span className="text-right">{t("mealColCalories")}</span>
                        </div>
                        {day.meals[slot].map((item) => {
                          const label = t(item.key);
                          const { name, amount } = splitFoodText(label);
                          return (
                            <div
                              key={`${day.dayKey}-${slot}-${item.key}`}
                              className="grid grid-cols-3 gap-2 text-sm text-slate-300"
                            >
                              <span>{name}</span>
                              <span className="text-slate-400">{amount}</span>
                              <span className="text-right">{item.calories} kcal</span>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {plan.waterTarget && (
              <p className="text-xs text-slate-400">
                {t("gainFoodWaterHint", { amount: plan.waterTarget })}
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export default Profile;
