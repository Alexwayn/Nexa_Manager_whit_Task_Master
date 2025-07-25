# Supabase Database Setup

This directory contains the Supabase configuration and migrations for the Nexa Manager project.

## Quick Start

### 1. Prerequisites

**Install Docker Desktop** (required for local development):
- Windows: https://docs.docker.com/desktop/install/windows-install/
- macOS: https://docs.docker.com/desktop/install/mac-install/
- Linux: https://docs.docker.com/desktop/install/linux-install/

**Install Supabase CLI**:
```bash
# Using npm
npm install -g supabase

# Using Homebrew (macOS)
brew install supabase/tap/supabase

# Using Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### 2. Setup Options

#### Option A: Local Development (Recommended)

```bash
# Make sure Docker Desktop is running first!
npm run setup:supabase

# Or manually:
npm run db:start    # Start local Supabase
npm run db:reset    # Apply all migrations
```

#### Option B: Remote Database Only

If you don't want to use local development:

```bash
# Show all migrations to copy manually
npm run db:migrations:show

# Or if you have CLI linked to your project:
npm run db:link     # Link to your Supabase project
npm run db:deploy   # Deploy migrations
```

### 3. Environment Configuration

Copy `.env.local.example` to `.env.local` and fill in your Supabase credentials:

```env
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## Available Commands

| Command | Description |
|---------|-------------|
| `npm run db:start` | Start local Supabase |
| `npm run db:stop` | Stop local Supabase |
| `npm run db:reset` | Reset database with all migrations |
| `npm run db:push` | Push migrations to remote database |
| `npm run db:pull` | Pull schema from remote database |
| `npm run db:diff` | Show differences between local and remote |
| `npm run db:migrate <name>` | Create new migration |
| `npm run db:status` | Show Supabase status |
| `npm run db:link` | Link to remote Supabase project |
| `npm run db:deploy` | Deploy to linked remote project |
| `npm run db:migrations:show` | Show all migrations for manual application |

## Migration Workflow

### Creating New Migrations

```bash
# Create a new migration
npm run db:migrate add_new_feature

# Edit the generated file in supabase/migrations/
# Then apply it
npm run db:reset
```

### Applying Migrations

```bash
# Local development
npm run db:reset

# Production deployment
npm run db:deploy
```

## Database Schema

### Document Scanner Tables

- **`scanned_documents`** - Main table for storing scanned document metadata
- **`document_tags`** - User-specific tags for document organization
- **`document_categories`** - Predefined document categories
- **`document_search_history`** - Search analytics and history

### Key Features

- **Row Level Security (RLS)** - All tables have proper security policies
- **Full-text Search** - PostgreSQL GIN indexes for text search
- **Automatic Timestamps** - Created/updated timestamps with triggers
- **Data Cleanup** - Automatic cleanup functions for old data

## Local Development URLs

When running locally, Supabase provides these services:

- **Studio**: http://localhost:54323
- **API**: http://localhost:54321
- **Database**: postgresql://postgres:postgres@localhost:54322/postgres
- **Inbucket (Email)**: http://localhost:54324

## Production Deployment

### Link to Remote Project

```bash
# Link to your Supabase project
npm run db:link

# Deploy migrations
npm run db:deploy
```

### Manual Deployment

If you prefer manual deployment:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste migration files in order
4. Execute each migration

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in `supabase/config.toml`
2. **Migration errors**: Check SQL syntax and dependencies
3. **Permission errors**: Ensure proper RLS policies

### Reset Everything

```bash
npm run db:stop
npm run db:start
npm run db:reset
```

## File Structure

```
supabase/
├── config.toml              # Supabase configuration
├── migrations/              # Database migrations
│   ├── 20250124225900_create_scanned_documents_table.sql
│   ├── 20250124230000_create_document_tags_tables.sql
│   └── 20250124230100_create_document_search_history_table.sql
└── README.md               # This file
```

## Security Notes

- All tables use Row Level Security (RLS)
- Users can only access their own data
- Service role key should never be exposed to client-side code
- Use environment variables for all sensitive configuration