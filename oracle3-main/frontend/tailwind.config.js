/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      keyframes: {
        moveButterfly: {
          "0%": {
            transform:
              "translate(var(--butterfly-start-x), var(--butterfly-start-y))",
            opacity: "1",
          },
          "100%": { transform: "translate(-100px, -100px)", opacity: "1" },
        },
      },
      animation: {
        moveButterfly: "moveButterfly 7s infinite",
      },
      fontFamily: {
        alien: ['"Alien-li"'],
      },
    },
  },
  plugins: [],
};
