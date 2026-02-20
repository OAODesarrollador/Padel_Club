/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/lib/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        bg: "#F1F3F6",
        card: "#FFFFFF",
        ink: "#141B34",
        muted: "#8C98AF",
        line: "#E2E7EF",
        brand: "#1EE65C",
        brandDark: "#15BF4A",
        danger: "#F25A5A",
        amber: "#F7A718"
      },
      boxShadow: {
        soft: "0 12px 24px rgba(16, 28, 61, 0.08)"
      },
      borderRadius: {
        xl2: "20px"
      }
    }
  },
  plugins: []
};
