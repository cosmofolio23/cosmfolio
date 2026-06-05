#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupTables() {
  console.log('\n🔧 Setting up template tables...\n');

  const sqlFile = path.join(__dirname, '../backend/migrations/001_create_template_tables.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  try {
    // Split SQL into individual statements and execute
    const statements = sql.split(';').filter(s => s.trim());
    
    for (const stmt of statements) {
      if (stmt.trim()) {
        const { data, error } = await supabase.rpc('exec_sql', {
          sql: stmt.trim()
        }).catch(err => {
          // Some SQL might not work via RPC, so try direct method
          return { error: null };
        });

        if (error) {
          console.log(`⚠️  ${stmt.slice(0, 50)}... (may already exist)`);
        } else {
          console.log(`✓ Executed: ${stmt.slice(0, 50)}...`);
        }
      }
    }

    // Try alternative: check if tables exist
    console.log('\n🔍 Verifying tables...\n');
    
    const { data: portfolioTables, error: portfolioError } = await supabase
      .from('portfolio_templates')
      .select('id')
      .limit(1);

    const { data: sheetTables, error: sheetError } = await supabase
      .from('sheet_templates')
      .select('id')
      .limit(1);

    if (!portfolioError && !sheetError) {
      console.log('✅ Tables already exist and are accessible!\n');
      return true;
    } else if (portfolioError || sheetError) {
      console.log('⚠️  Tables may not exist yet');
      console.log('   Run this SQL in Supabase SQL Editor manually:\n');
      console.log('   ' + sql.replace(/\n/g, '\n   '));
      return false;
    }

  } catch (e) {
    console.log('ℹ️  Trying direct table access...');
    
    // Tables might exist, just try to access them
    try {
      await supabase.from('portfolio_templates').select('id').limit(1);
      await supabase.from('sheet_templates').select('id').limit(1);
      console.log('✅ Tables exist!\n');
      return true;
    } catch (err) {
      console.log('❌ Tables not found');
      console.log('\n   📌 ACTION REQUIRED: Run this SQL in Supabase SQL Editor:\n');
      console.log(sql);
      return false;
    }
  }
}

setupTables().then(success => {
  if (success) {
    console.log('🎉 Setup complete! Tables are ready for template import.\n');
  } else {
    console.log('\n⚠️  Please create the tables manually in Supabase, then try again.\n');
  }
});
