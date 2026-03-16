/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,jsx}"] ,
  theme: {
    extend: {
      colors: {
        midnight: "#0f172a",
        ocean: "#0ea5e9",
        sunrise: "#f97316",
        moss: "#22c55e"
      },
      fontFamily: {
        display: ["Montserrat", "sans-serif"],
        body: ["Source Sans 3", "sans-serif"]
      },
      boxShadow: {
        glow: "0 0 30px rgba(14,165,233,0.35)"
      }
    }
  },
  plugins: [require("@tailwindcss/forms")]
};
