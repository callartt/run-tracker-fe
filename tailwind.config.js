/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class', // Add this line
    content: [
      "./index.html",
      "./src/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#3B82F6', // Blue
            dark: '#2563EB',
            light: '#93C5FD',
          },
          secondary: {
            DEFAULT: '#10B981', // Green
            dark: '#059669',
            light: '#6EE7B7',
          },
          accent: {
            DEFAULT: '#F43F5E', // Pink/Red for heart rate
            dark: '#BE123C',
            light: '#FDA4AF',
          },
          background: {
            DEFAULT: '#F9FAFB',
            dark: '#1F2937',
          },
        },
      },
    },
    plugins: [],
  }