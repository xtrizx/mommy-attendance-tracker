/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'bg-base': '#0a0e14',
        'bg-surface': '#121821',
        'bg-surface-2': '#1a2230',
        'bg-surface-3': '#232d3f',
        'border-subtle': '#2a3548',
        'border-strong': '#3a4a63',
        'text-primary': '#e8eef7',
        'text-secondary': '#9aa9bd',
        'text-muted': '#6b7a92',
        accent: '#f5b942',
        'accent-soft': '#f5b94222',
        'accent-strong': '#ffd166',
        primary: '#4ea8de',
        'primary-soft': '#4ea8de22',
        'primary-strong': '#6cc6ff',
        success: '#4ade80',
        'success-soft': '#4ade8022',
        warning: '#fbbf24',
        'warning-soft': '#fbbf2422',
        error: '#f87171',
        'error-soft': '#f8717122',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Cinzel', 'Inter', 'ui-sans-serif', 'system-ui', 'serif'],
      },
    },
  },
  plugins: [],
};
