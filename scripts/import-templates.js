#!/usr/bin/env node

/**
 * Import Templates to Supabase
 * Reads from templates_library and sheets_library, imports to Supabase
 */

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Get Supabase config from environment
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function importPortfolioTemplates() {
  console.log('\n' + '='.repeat(60));
  console.log('📥 IMPORTING PORTFOLIO TEMPLATES');
  console.log('='.repeat(60));

  const templatesPath = path.join(__dirname, '../templates_library/templates.json');

  if (!fs.existsSync(templatesPath)) {
    console.error(`❌ File not found: ${templatesPath}`);
    return false;
  }

  try {
    const templates = JSON.parse(fs.readFileSync(templatesPath, 'utf8'));
    console.log(`Found ${templates.length} portfolio templates\n`);

    let success = 0;
    let failed = 0;

    for (const template of templates) {
      try {
        const record = {
          id: template.id,
          name: template.name,
          category: template.category,
          description: template.description,
          colors: template.colors,
          fonts: template.fonts,
          layouts: template.layouts,
          placeholders: template.placeholders,
          preview_image: template.preview_image,
          style_notes: template.style_notes,
          page_count_range: template.page_count_range,
          orientation: template.orientation,
          source: 'downloaded',
          created_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('portfolio_templates')
          .upsert(record, { onConflict: 'id' });

        if (error) {
          console.log(`  ✗ ${template.name} - ${error.message}`);
          failed++;
        } else {
          console.log(`  ✓ ${template.name}`);
          success++;
        }
      } catch (e) {
        console.log(`  ✗ ${template.name} - ${e.message}`);
        failed++;
      }
    }

    console.log(`\n✅ Portfolio templates: ${success} imported, ${failed} failed`);
    return failed === 0;
  } catch (e) {
    console.error(`❌ Error: ${e.message}`);
    return false;
  }
}

async function importSheetTemplates() {
  console.log('\n' + '='.repeat(60));
  console.log('📥 IMPORTING SHEET TEMPLATES');
  console.log('='.repeat(60));

  const sheetsPath = path.join(__dirname, '../sheets_library/sheets.json');

  if (!fs.existsSync(sheetsPath)) {
    console.error(`❌ File not found: ${sheetsPath}`);
    return false;
  }

  try {
    const templates = JSON.parse(fs.readFileSync(sheetsPath, 'utf8'));
    console.log(`Found ${templates.length} sheet templates\n`);

    let success = 0;
    let failed = 0;

    for (const template of templates) {
      try {
        const record = {
          id: template.id,
          name: template.name,
          sheet_type: template.sheet_type || 'concept',
          category: template.category,
          format: template.format || 'A1',
          description: template.description,
          colors: {
            primary: template.colors_primary,
            accent: template.colors_accent,
          },
          typography: {
            heading_font: template.heading_font,
            body_font: template.body_font,
          },
          key_placeholders: template.key_placeholders,
          style_notes: template.style_notes,
          source: 'downloaded',
          created_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('sheet_templates')
          .upsert(record, { onConflict: 'id' });

        if (error) {
          console.log(`  ✗ ${template.name} - ${error.message}`);
          failed++;
        } else {
          console.log(`  ✓ ${template.name}`);
          success++;
        }
      } catch (e) {
        console.log(`  ✗ ${template.name} - ${e.message}`);
        failed++;
      }
    }

    console.log(`\n✅ Sheet templates: ${success} imported, ${failed} failed`);
    return failed === 0;
  } catch (e) {
    console.error(`❌ Error: ${e.message}`);
    return false;
  }
}

async function verifyImports() {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 VERIFYING IMPORTS');
  console.log('='.repeat(60));

  try {
    const portfolioRes = await supabase
      .from('portfolio_templates')
      .select('id', { count: 'exact' });
    const portfolioCount = portfolioRes.count || 0;

    const sheetRes = await supabase
      .from('sheet_templates')
      .select('id', { count: 'exact' });
    const sheetCount = sheetRes.count || 0;

    console.log(`\n📊 Database Summary:`);
    console.log(`   Portfolio templates: ${portfolioCount}`);
    console.log(`   Sheet templates: ${sheetCount}`);
    console.log(`   Total: ${portfolioCount + sheetCount}`);

    return portfolioCount > 0 && sheetCount > 0;
  } catch (e) {
    console.error(`❌ Error: ${e.message}`);
    return false;
  }
}

async function main() {
  console.log('\n🚀 Template Import Script\n');

  const portfolioOk = await importPortfolioTemplates();
  const sheetOk = await importSheetTemplates();
  const verifyOk = await verifyImports();

  console.log('\n' + '='.repeat(60));
  if (portfolioOk && sheetOk && verifyOk) {
    console.log('✅ IMPORT COMPLETE - All templates imported successfully!');
  } else {
    console.log('⚠️  IMPORT COMPLETE - Check above for any errors');
  }
  console.log('='.repeat(60) + '\n');

  process.exit(portfolioOk && sheetOk ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
