/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx,html}'
  ],
  darkMode: 'class',
  safelist: [
    // Dynamic color utilities for status badges and indicators
    'bg-red-100', 'bg-red-500', 'text-red-800', 'text-red-500', 'text-red-600',
    'bg-yellow-100', 'bg-yellow-500', 'text-yellow-800', 'text-yellow-500', 'text-yellow-600',
    'bg-blue-100', 'bg-blue-500', 'text-blue-800', 'text-blue-500', 'text-blue-600',
    'bg-green-100', 'bg-green-500', 'text-green-800', 'text-green-500', 'text-green-600',
    'bg-gray-100', 'bg-gray-500', 'text-gray-800', 'text-gray-500', 'text-gray-600',
    'bg-orange-100', 'bg-orange-500', 'text-orange-800', 'text-orange-500', 'text-orange-600',
    'bg-purple-100', 'bg-purple-500', 'text-purple-800', 'text-purple-500', 'text-purple-600',
    
    // Dynamic spacing utilities
    'h-1', 'h-2', 'h-3', 'h-4', 'h-5', 'h-6', 'h-8', 'h-10', 'h-12', 'h-16', 'h-20', 'h-24',
    'w-1', 'w-2', 'w-3', 'w-4', 'w-5', 'w-6', 'w-8', 'w-10', 'w-12', 'w-16', 'w-20', 'w-24',
    
    // Dynamic border colors
    'border-red-500', 'border-yellow-500', 'border-blue-500', 'border-green-500', 'border-gray-500', 'border-orange-500',
    
    // Potential dynamic chart colors (match SimpleChart.jsx)
    'bg-indigo-500', 'bg-purple-500',
    
    // Dynamic width classes
    'w-8', 'w-12', 'w-16', 'w-20', 'w-24', 'w-28', 'w-32', 'w-36', 'w-40',
    
    // Additional dynamic utility patterns
    {
      pattern: /bg-(red|yellow|blue|green|gray|orange|purple|indigo)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /text-(red|yellow|blue|green|gray|orange|purple|indigo)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      pattern: /border-(red|yellow|blue|green|gray|orange|purple|indigo)-(50|100|200|300|400|500|600|700|800|900)/,
    },
    {
      // numeric w/h like w-4, h-10
      pattern: /(h|w)-([1-9]|[1-9][0-9])/,
    },
    {
      // fractional and special widths used via template strings
      pattern: /w-(1\/2|1\/3|2\/3|1\/4|2\/4|3\/4|1\/5|2\/5|3\/5|4\/5|1\/6|2\/6|3\/6|4\/6|5\/6|full|screen|min|max|fit)/,
    },
    {
      // gradient color stops for ReportHeader and similar components
      pattern: /(from|via|to)-(red|yellow|blue|green|gray|orange|purple|indigo)-(50|100|200|300|400|500|600|700|800|900)/,
    },
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        },
        danger: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(0, 0, 0, 0.07), 0 10px 20px -2px rgba(0, 0, 0, 0.04)',
        'medium': '0 4px 25px -5px rgba(0, 0, 0, 0.1), 0 20px 25px -5px rgba(0, 0, 0, 0.04)',
        'large': '0 10px 50px -10px rgba(0, 0, 0, 0.15), 0 30px 60px -30px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
    },
  },
  plugins: [
    // Add form styles plugin if needed
    // require('@tailwindcss/forms'),
  ],
};
