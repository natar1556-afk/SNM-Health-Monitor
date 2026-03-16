export const calculateBmi = (heightCm, weightKg) => {
  if (!heightCm || !weightKg) return null;
  const heightM = heightCm / 100;
  if (heightM <= 0) return null;
  return Number((weightKg / (heightM * heightM)).toFixed(1));
};

export const bmiStatus = (bmi) => {
  if (!bmi) return null;
  if (bmi < 18.5) return { label: "Low (Kammiya)", tone: "text-sunrise" };
  if (bmi < 25) return { label: "Normal", tone: "text-moss" };
  if (bmi < 30) return { label: "High (Athigama)", tone: "text-sunrise" };
  return { label: "Very High (Athigama)", tone: "text-red-400" };
};
