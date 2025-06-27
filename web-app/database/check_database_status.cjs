#!/usr/bin/env node

/**
 * =====================================================
 * SCRIPT DI VERIFICA STATO DATABASE - CONTROLLO PREVENTIVO
 * =====================================================
 * ⚠️ REGOLA FONDAMENTALE: ESEGUI SEMPRE QUESTO SCRIPT
 * PRIMA DI QUALSIASI MODIFICA AL DATABASE!
 * 
 * Controlla quali tabelle esistono già nel database
 * e fornisce raccomandazioni su quali script eseguire
 * 
 * Uso: node check_database_status.js
 * =====================================================
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configurazione Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERRORE: Variabili ambiente Supabase mancanti');
    console.error('Assicurati che VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY siano configurate');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Tabelle da controllare
const REQUIRED_TABLES = {
    'roles': 'roles_and_permissions_schema.sql',
    'permissions': 'roles_and_permissions_schema.sql',
    'user_roles': 'roles_and_permissions_schema.sql',
    'role_permissions': 'roles_and_permissions_schema.sql',
    'user_sessions': 'security_tables_schema.sql',
    'security_audit_logs': 'security_tables_schema.sql',
    'email_settings': 'email_settings_schema.sql',
    'email_templates': 'email_settings_schema.sql',
    'notification_preferences': 'email_settings_schema.sql',
    'email_activity': 'email_settings_schema.sql'
};

// Colonne critiche da controllare
const CRITICAL_COLUMNS = {
    'user_sessions': ['session_token'],
    'profiles': ['id'],
    'email_settings': ['user_id'],
    'user_roles': ['user_id', 'role_id']
};

async function checkTableExists(tableName) {
    try {
        const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(1);
        
        return !error;
    } catch (err) {
        return false;
    }
}

async function getTableInfo(tableName) {
    try {
        const { data, error } = await supabase.rpc('get_table_info', {
            table_name: tableName
        });
        
        if (error) {
            // Fallback: prova a fare una query semplice
            const { count, error: countError } = await supabase
                .from(tableName)
                .select('*', { count: 'exact', head: true });
            
            return countError ? null : { count: count || 0 };
        }
        
        return data;
    } catch (err) {
        return null;
    }
}

async function checkDatabaseStatus() {
    console.log('🔍 VERIFICA STATO DATABASE NEXA MANAGER');
    console.log('=' .repeat(50));
    
    const results = {
        existing_tables: [],
        missing_tables: [],
        scripts_needed: new Set(),
        issues: [],
        recommendations: []
    };
    
    // 1. Controlla tabelle esistenti
    console.log('\n📋 CONTROLLO TABELLE...');
    
    for (const [tableName, scriptFile] of Object.entries(REQUIRED_TABLES)) {
        const exists = await checkTableExists(tableName);
        
        if (exists) {
            results.existing_tables.push(tableName);
            console.log(`✅ ${tableName} - ESISTE`);
            
            // Controlla il numero di record
            const info = await getTableInfo(tableName);
            if (info && info.count !== undefined) {
                console.log(`   📊 Record: ${info.count}`);
            }
        } else {
            results.missing_tables.push(tableName);
            results.scripts_needed.add(scriptFile);
            console.log(`❌ ${tableName} - MANCANTE`);
        }
    }
    
    // 2. Controlla tabella profiles (critica per Clerk)
    console.log('\n👤 CONTROLLO COMPATIBILITÀ CLERK...');
    
    const profilesExists = await checkTableExists('profiles');
    if (profilesExists) {
        console.log('✅ profiles - ESISTE');
        
        // Qui potresti aggiungere controlli specifici per il tipo di colonna
        // ma richiederebbe query SQL più complesse
        results.recommendations.push('Verifica che profiles.id sia TEXT (non UUID) per compatibilità Clerk');
    } else {
        console.log('❌ profiles - MANCANTE');
        results.issues.push('Tabella profiles mancante - potrebbe essere necessaria migrazione Clerk');
    }
    
    // 3. Genera raccomandazioni
    console.log('\n📝 RACCOMANDAZIONI:');
    
    if (results.scripts_needed.size === 0) {
        console.log('🎉 Tutte le tabelle principali esistono!');
        console.log('💡 Puoi procedere con il test dell\'applicazione');
    } else {
        console.log('📋 Script da eseguire nell\'ordine:');
        
        const executionOrder = [
            'roles_and_permissions_schema.sql',
            'security_tables_schema.sql', 
            'email_settings_schema.sql',
            'clerk_compatibility_migration.sql'
        ];
        
        let stepNumber = 1;
        for (const script of executionOrder) {
            if (results.scripts_needed.has(script)) {
                console.log(`   ${stepNumber}. ${script}`);
                stepNumber++;
            }
        }
    }
    
    // 4. Mostra problemi rilevati
    if (results.issues.length > 0) {
        console.log('\n⚠️  PROBLEMI RILEVATI:');
        results.issues.forEach(issue => console.log(`   • ${issue}`));
    }
    
    // 5. Mostra raccomandazioni aggiuntive
    if (results.recommendations.length > 0) {
        console.log('\n💡 RACCOMANDAZIONI AGGIUNTIVE:');
        results.recommendations.forEach(rec => console.log(`   • ${rec}`));
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('✅ VERIFICA COMPLETATA');
    
    return results;
}

// Esegui la verifica
if (require.main === module) {
    checkDatabaseStatus()
        .then(() => {
            console.log('\n🔧 Per eseguire gli script SQL:');
            console.log('   1. Apri Supabase Dashboard > SQL Editor');
            console.log('   2. Copia e incolla il contenuto dei file .sql');
            console.log('   3. Esegui nell\'ordine raccomandato');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Errore durante la verifica:', error.message);
            process.exit(1);
        });
}

module.exports = { checkDatabaseStatus };