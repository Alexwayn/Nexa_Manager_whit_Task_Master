/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SENTRY_DSN: string
  readonly VITE_SENTRY_ENVIRONMENT: string
  readonly VITE_APP_VERSION: string
  readonly VITE_API_URL: string
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  readonly VITE_AWS_REGION: string
  readonly VITE_AWS_USER_POOL_ID: string
  readonly VITE_AWS_USER_POOL_WEB_CLIENT_ID: string
  readonly VITE_AWS_IDENTITY_POOL_ID: string
  readonly VITE_AWS_APPSYNC_GRAPHQL_ENDPOINT: string
  readonly VITE_AWS_APPSYNC_REGION: string
  readonly VITE_AWS_APPSYNC_AUTHENTICATION_TYPE: string
  readonly VITE_AWS_APPSYNC_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 