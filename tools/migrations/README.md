# Database Migrations

This directory contains database migration files for the Nexa Manager application.

## Structure

- **supabase/** - Supabase-specific migrations
- **scripts/** - Migration utility scripts
- **rollbacks/** - Rollback scripts for migrations

## Migration Naming Convention

Migrations follow the format: `YYYYMMDDHHMMSS_description.sql`

Example: `20250124225900_create_scanned_documents_table.sql`

## Usage

### Creating a New Migration
```bash
npm run db:migrate
```

### Applying Migrations
```bash
npm run db:push
```

### Rolling Back Migrations
```bash
npm run db:reset
```

## Guidelines

- Always test migrations locally first
- Include rollback instructions in migration comments
- Use descriptive names for migrations
- Keep migrations atomic and focused
- Document breaking changes