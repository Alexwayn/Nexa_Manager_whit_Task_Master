import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load environment variables based on mode
  const env = loadEnv(mode, process.cwd(), '')
  
  const isProduction = mode === 'production'
  const isDevelopment = mode === 'development'

  return {
    plugins: [
      react(),
      // Sentry plugin for source maps and release tracking
      ...(isProduction && env.VITE_SENTRY_DSN ? [
        sentryVitePlugin({
          org: env.SENTRY_ORG,
          project: env.SENTRY_PROJECT,
          authToken: env.SENTRY_AUTH_TOKEN,
          sourcemaps: {
            assets: './dist/assets/**',
            ignore: ['node_modules'],
            deleteAfterUpload: true,
          },
          release: {
            name: env.VITE_APP_VERSION || '1.0.0',
            finalize: true,
            setCommits: {
              auto: true,
            },
          },
        })
      ] : [])
    ],
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
        '@services': path.resolve(__dirname, './src/services'),
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
      sourcemap: true, // Essential for Sentry error tracking
      chunkSizeWarningLimit: 500,
      assetsInlineLimit: 4096, // Inline small assets
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
            'sentry': ['@sentry/react', '@sentry/tracing'], // Separate chunk for Sentry
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
      // Terser options for better minification while preserving Sentry integration
      terserOptions: {
        compress: {
          drop_console: isProduction, // Keep console in dev for Sentry
          drop_debugger: true,
          pure_funcs: isProduction 
            ? ['console.log', 'console.info', 'console.debug'] 
            : [] // Don't drop console methods in development for Sentry
        }
      }
    },
    define: {
      __DEV__: JSON.stringify(isDevelopment),
      __SENTRY_DEBUG__: JSON.stringify(isDevelopment),
      __SENTRY_TRACING__: JSON.stringify(true),
    },
    ...(isDevelopment && {
      server: {
        port: 3000,
        open: true
      }
    })
  }
})
