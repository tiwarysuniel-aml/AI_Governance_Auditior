/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          bg: '#0F172A',      // slate-900
          card: '#1E293B',    // slate-800
          border: '#334155',  // slate-700
          text: '#F8FAFC',    // slate-50
          muted: '#94A3B8'    // slate-400
        },
        risk: {
          low: '#10B981',     // emerald-500
          medium: '#F59E0B',  // amber-500
          high: '#EF4444',    // red-500
          critical: '#7C3AED' // violet-600
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
