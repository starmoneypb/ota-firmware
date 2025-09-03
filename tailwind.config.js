
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#dbeeff',
          500: '#2563eb',
          600: '#1e40af'
        }
      }
    }
  },
  plugins: []
};
