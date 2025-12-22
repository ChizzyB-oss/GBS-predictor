/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],

  extend: {
  colors: {
    nhs: {
      blue: "#005EB8",
      darkBlue: "#003087",
      lightBlue: "#41B6E6",
      aqua: "#00A9CE",
      black: "#212B32",
      grey: "#425563",
      lightGrey: "#F0F4F5",
    },
    dark: {
      bg: "#0F172A",
      card: "#1E293B",
      text: "#E2E8F0",
    }
  },

  // Animations
  animation: {
    fadeIn: "fadeIn 0.4s ease-in-out",
    scaleUp: "scaleUp 0.3s ease-out",
    slideUp: "slideUp 0.35s ease-out",
  },
  keyframes: {
    fadeIn: {
      "0%": { opacity: 0 },
      "100%": { opacity: 1 }
    },
    scaleUp: {
      "0%": { transform: "scale(0.9)", opacity: 0 },
      "100%": { transform: "scale(1)", opacity: 1 }
    },
    slideUp: {
      "0%": { transform: "translateY(20px)", opacity: 0 },
      "100%": { transform: "translateY(0)", opacity: 1 }
    }
  }
}

};

