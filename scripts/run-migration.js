const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Erro: Variáveis de ambiente NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessárias.');
  console.error('   Certifique-se de que estão definidas no arquivo .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
  db: { schema: 'public' },
});

async function runMigration(filePath) {
  console.log(`📄 Executando migration: ${filePath}`);
  const sql = fs.readFileSync(filePath, 'utf-8');

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  let successCount = 0;
  let errorCount = 0;

  for (const stmt of statements) {
    try {
      const { error } = await supabase.rpc('exec_sql', { query: stmt + ';' });
      if (error) {
        // If exec_sql doesn't exist, try alternative approach
        console.warn(`   ⚠️  Não foi possível executar via RPC: ${error.message}`);
        console.warn('   Tentando via REST API...');
        throw error;
      }
      console.log(`   ✅ Comando executado`);
      successCount++;
    } catch (e) {
      // Try via direct SQL endpoint
      try {
        const response = await fetch(
          `${supabaseUrl}/rest/v1/rpc/exec_sql`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': serviceRoleKey,
              'Authorization': `Bearer ${serviceRoleKey}`,
            },
            body: JSON.stringify({ query: stmt + ';' }),
          }
        );

        if (!response.ok) {
          const text = await response.text();
          console.error(`   ❌ Erro no comando ${successCount + errorCount + 1}: ${text}`);
          errorCount++;
        } else {
          console.log(`   ✅ Comando executado`);
          successCount++;
        }
      } catch (e2) {
        console.error(`   ❌ Erro no comando: ${e2.message}`);
        errorCount++;
      }
    }
  }

  return { successCount, errorCount };
}

async function ensureExecSqlFunction() {
  console.log('🔧 Verificando/Criando função exec_sql...');

  // Try to create the function first via REST
  const createFunctionSQL = `
    CREATE OR REPLACE FUNCTION exec_sql(query text)
    RETURNS void
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    BEGIN
      EXECUTE query;
    END;
    $$;
  `;

  try {
    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/exec_sql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceRoleKey,
          'Authorization': `Bearer ${serviceRoleKey}`,
        },
        body: JSON.stringify({ query: 'SELECT 1' }),
      }
    );

    if (response.ok || response.status === 200) {
      console.log('   ✅ Função exec_sql já existe');
      return true;
    }
  } catch (e) {
    // Function doesn't exist, try to create it via SQL API
  }

  console.log('   ⚠️  Função exec_sql não encontrada.');
  console.log('');
  console.log('   👇 Para criar a função, execute manualmente no Supabase SQL Editor:');
  console.log('');
  console.log('   CREATE OR REPLACE FUNCTION exec_sql(query text)');
  console.log('   RETURNS void');
  console.log('   LANGUAGE plpgsql');
  console.log('   SECURITY DEFINER');
  console.log('   AS $$');
  console.log('   BEGIN');
  console.log('     EXECUTE query;');
  console.log('   END;');
  console.log('   $$;');
  console.log('');
  return false;
}

async function main() {
  console.log('🚀 PROART - Migration Tool');
  console.log('==========================');
  console.log(`🔗 Supabase URL: ${supabaseUrl}`);
  console.log('');

  const hasExecFn = await ensureExecSqlFunction();
  if (!hasExecFn) {
    console.log('❌ Não foi possível criar a função exec_sql automaticamente.');
    console.log('   Por favor, siga as instruções acima e execute novamente este script.');
    process.exit(1);
  }

  // Run migrations in order
  const migrationsDir = path.join(__dirname, '..', 'supabase');
  const migrationFiles = [
    'schema-completo.sql',
    'schema.sql',
    'rls-policies.sql',
    'products-schema.sql',
    'sample-data.sql',
    'add-columns.sql',
    'migration-safe.sql',
    'supabase_schema_fix.sql',
  ];

  for (const file of migrationFiles) {
    const filePath = path.join(migrationsDir, file);
    if (!fs.existsSync(filePath)) {
      console.log(`⏭️  ${file} não encontrado, pulando...`);
      continue;
    }

    console.log(`\n📄 Executando ${file}...`);
    const { successCount, errorCount } = await runMigration(filePath);
    console.log(`   ✅ ${successCount} comandos executados, ❌ ${errorCount} erros`);
  }

  console.log('\n✅ Migração concluída!');
}

main().catch(console.error);
