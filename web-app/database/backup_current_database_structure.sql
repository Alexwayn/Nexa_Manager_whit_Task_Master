-- BACKUP COMPLETO STRUTTURA DATABASE SUPABASE
-- Data: $(date)
-- Questo script crea un backup completo della struttura attuale

-- CREA SCHEMA DI BACKUP
CREATE SCHEMA IF NOT EXISTS backup_$(date +%Y%m%d);

-- BACKUP STRUTTURA TABELLE
DO $$
DECLARE
    table_name text;
    sql_command text;
BEGIN
    FOR table_name IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        -- Crea la tabella di backup con la stessa struttura
        sql_command := 'CREATE TABLE backup_$(date +%Y%m%d).' || quote_ident(table_name) || 
                      ' AS SELECT * FROM public.' || quote_ident(table_name);
        EXECUTE sql_command;
        
        RAISE NOTICE 'Backup creato per tabella: %', table_name;
    END LOOP;
END $$;

-- BACKUP POLICIES RLS
\copy (SELECT 'CREATE POLICY ' || policyname || ' ON public.' || tablename || 
              CASE 
                WHEN cmd = 'ALL' THEN ' FOR ALL '
                WHEN cmd = 'SELECT' THEN ' FOR SELECT '
                WHEN cmd = 'INSERT' THEN ' FOR INSERT '
                WHEN cmd = 'UPDATE' THEN ' FOR UPDATE '
                WHEN cmd = 'DELETE' THEN ' FOR DELETE '
              END ||
              ' TO ' || array_to_string(roles, ', ') ||
              CASE WHEN qual IS NOT NULL THEN ' USING (' || qual || ')' ELSE '' END ||
              CASE WHEN with_check IS NOT NULL THEN ' WITH CHECK (' || with_check || ')' ELSE '' END ||
              ';'
       FROM pg_policies 
       WHERE schemaname = 'public') TO 'database_backup_policies.sql';

-- BACKUP FOREIGN KEYS
\copy (SELECT 'ALTER TABLE public.' || tc.table_name || 
              ' ADD CONSTRAINT ' || tc.constraint_name ||
              ' FOREIGN KEY (' || kcu.column_name || ')' ||
              ' REFERENCES public.' || ccu.table_name || '(' || ccu.column_name || ');'
       FROM information_schema.table_constraints AS tc 
       JOIN information_schema.key_column_usage AS kcu
         ON tc.constraint_name = kcu.constraint_name
       JOIN information_schema.constraint_column_usage AS ccu
         ON ccu.constraint_name = tc.constraint_name
       WHERE tc.constraint_type = 'FOREIGN KEY' 
       AND tc.table_schema = 'public') TO 'database_backup_foreign_keys.sql';

-- BACKUP VIEWS
\copy (SELECT 'CREATE VIEW public.' || viewname || ' AS ' || definition || ';'
       FROM pg_views 
       WHERE schemaname = 'public') TO 'database_backup_views.sql';

-- BACKUP TRIGGERS
\copy (SELECT 'CREATE TRIGGER ' || trigger_name || 
              ' ' || action_timing || ' ' || event_manipulation ||
              ' ON public.' || event_object_table ||
              ' ' || action_statement || ';'
       FROM information_schema.triggers
       WHERE trigger_schema = 'public') TO 'database_backup_triggers.sql';

-- LOG DEL BACKUP
SELECT 'Backup completato in data: ' || current_timestamp; 