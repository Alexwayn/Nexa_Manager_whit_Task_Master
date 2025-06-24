import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@lib': path.resolve(__dirname, './src/lib'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@context': path.resolve(__dirname, './src/context'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@i18n': path.resolve(__dirname, './src/i18n'),
      '@types': path.resolve(__dirname, './src/types'),
      '@router': path.resolve(__dirname, './src/router'),
      '@hoc': path.resolve(__dirname, './src/components/hoc'),
    },
  },
  esbuild: {
    target: 'es2020',
  },
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2020',
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    sourcemap: true,
    chunkSizeWarningLimit: 500,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'router': ['react-router-dom'],
          'ui-vendor': ['@heroicons/react'],
          'charts': ['chart.js', 'react-chartjs-2'],
          'pdf-canvas': ['html2canvas', 'jspdf'],
          'supabase': ['@supabase/supabase-js'],
          'i18n': ['react-i18next', 'i18next'],
          'date-utils': ['date-fns'],
          'analytics': [
            './src/components/analytics/AnalyticsDashboard.jsx',
            './src/components/analytics/AdvancedFinancialAnalytics.jsx',
            './src/components/analytics/AdvancedTimePeriodSelector.jsx',
            './src/components/analytics/EnhancedKPICard.jsx'
          ],
          'financial': [
            './src/components/financial/TaxCalculator.jsx',
            './src/components/financial/FinancialForecast.jsx',
            './src/components/financial/PaymentDashboard.jsx',
            './src/components/financial/PaymentModal.jsx'
          ],
          'reports': [
            './src/components/reports/FinancialOverview.jsx',
            './src/components/reports/ReportHeader.jsx',
            './src/components/reports/TabNavigation.jsx'
          ]
        },
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace('.jsx', '').replace('.tsx', '')
            : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        }
      }
    },
    // Terser options for better minification
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug']
      }
    }
  },
  define: {
    __DEV__: JSON.stringify(false)
  },
  ...(process.env.NODE_ENV === 'development' && {
    server: {
      port: 3000,
      open: true
    }
  })
})
