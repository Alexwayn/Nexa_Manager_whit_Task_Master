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
        // Base paths
        '@': path.resolve(__dirname, './src'),
        
        // Feature-based structure
        '@/features': path.resolve(__dirname, './src/features'),
        '@/shared': path.resolve(__dirname, './src/shared'),
        '@/pages': path.resolve(__dirname, './src/pages'),
        
        // Shared module aliases
        '@/shared/components': path.resolve(__dirname, './src/shared/components'),
        '@/shared/hooks': path.resolve(__dirname, './src/shared/hooks'),
        '@/shared/services': path.resolve(__dirname, './src/shared/services'),
        '@/shared/utils': path.resolve(__dirname, './src/shared/utils'),
        '@/shared/types': path.resolve(__dirname, './src/shared/types'),
        '@/shared/constants': path.resolve(__dirname, './src/shared/constants'),
        '@/shared/styles': path.resolve(__dirname, './src/shared/styles'),
        
        // Legacy aliases for backward compatibility (to be removed gradually)
        '@components': path.resolve(__dirname, './src/components'),
        '@shared': path.resolve(__dirname, './src/shared'),
        '@features': path.resolve(__dirname, './src/features'),
        '@utils': path.resolve(__dirname, './src/utils'),
        '@hooks': path.resolve(__dirname, './src/shared/hooks'),
        '@types': path.resolve(__dirname, './src/shared/types'),
        '@services': path.resolve(__dirname, './src/shared/services'),
        '@assets': path.resolve(__dirname, '../assets'),
        '@styles': path.resolve(__dirname, './src/shared/styles'),
        '@lib': path.resolve(__dirname, './src/lib'),
        '@scanner': path.resolve(__dirname, './src/features/scanner'),
        '@router': path.resolve(__dirname, './src/router'),
        '@pages': path.resolve(__dirname, './src/pages'),
      },
    },
    esbuild: {
      target: 'es2020',
    },
    optimizeDeps: {
      esbuildOptions: {
        target: 'es2020',
      },
      include: [
        'react',
        'react-dom',
        '@headlessui/react',
        '@heroicons/react',
        'framer-motion'
      ],
      exclude: ['@stagewise/toolbar']
    },
    build: {
      target: 'esnext',
      minify: 'terser',
      sourcemap: true, // Essential for Sentry error tracking
      chunkSizeWarningLimit: 500,
      assetsInlineLimit: 4096, // Inline small assets
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Vendor chunks
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) {
                return 'react-vendor';
              }
              if (id.includes('react-router-dom')) {
                return 'router';
              }
              if (id.includes('@heroicons/react') || id.includes('lucide-react')) {
                return 'ui-vendor';
              }
              if (id.includes('chart.js') || id.includes('react-chartjs-2') || id.includes('recharts')) {
                return 'charts';
              }
              if (id.includes('html2canvas') || id.includes('jspdf')) {
                return 'pdf-canvas';
              }
              if (id.includes('@supabase/supabase-js')) {
                return 'supabase';
              }
              if (id.includes('react-i18next') || id.includes('i18next')) {
                return 'i18n';
              }
              if (id.includes('date-fns')) {
                return 'date-utils';
              }
              if (id.includes('@sentry/react') || id.includes('@sentry/tracing')) {
                return 'sentry';
              }
              if (id.includes('@tanstack/react-query')) {
                return 'react-query';
              }
              if (id.includes('@clerk/clerk-react')) {
                return 'clerk';
              }
              return 'vendor';
            }
            
            // Feature-based chunks
            if (id.includes('/src/features/auth/')) {
              return 'feature-auth';
            }
            if (id.includes('/src/features/clients/')) {
              return 'feature-clients';
            }
            if (id.includes('/src/features/financial/')) {
              return 'feature-financial';
            }
            if (id.includes('/src/features/email/')) {
              return 'feature-email';
            }
            if (id.includes('/src/features/dashboard/')) {
              return 'feature-dashboard';
            }
            if (id.includes('/src/features/analytics/')) {
              return 'feature-analytics';
            }
            if (id.includes('/src/features/calendar/')) {
              return 'feature-calendar';
            }
            if (id.includes('/src/features/documents/')) {
              return 'feature-documents';
            }
            if (id.includes('/src/features/scanner/')) {
              return 'feature-scanner';
            }
            
            // Shared chunks
            if (id.includes('/src/shared/components/')) {
              return 'shared-components';
            }
            if (id.includes('/src/shared/services/')) {
              return 'shared-services';
            }
            if (id.includes('/src/shared/')) {
              return 'shared';
            }
            
            // Default chunk
            return 'main';
          },
          chunkFileNames: (chunkInfo) => {
            const facadeModuleId = chunkInfo.facadeModuleId
              ? chunkInfo.facadeModuleId.split('/').pop().replace('.jsx', '').replace('.tsx', '')
              : 'chunk';
            return `assets/${facadeModuleId}-[hash].js`;
          },
          assetFileNames: (assetInfo) => {
            // Keep SVG files in root for favicon and logo references
            if (assetInfo.name?.endsWith('.svg')) {
              return '[name][extname]';
            }
            return 'assets/[name]-[hash][extname]';
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
