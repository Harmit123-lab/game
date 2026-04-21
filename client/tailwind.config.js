/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gold: "#d9b86f",
        wine: "#3a0d1f",
        ember: "#ff6a3d"
      },
      boxShadow: {
        glow: "0 0 24px rgba(217, 184, 111, 0.45)"
      }
    }
  },
  plugins: []
};
