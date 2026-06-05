#!/usr/bin/env node
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
  const templates = JSON.parse(fs.readFileSync('templates_library/templates.json'));
  const sheets = JSON.parse(fs.readFileSync('sheets_library/sheets.json'));

  console.log(`\n📥 Importing ${templates.length} portfolio templates...\n`);
  
  let success = 0;
  for (const tpl of templates) {
    try {
      const { error } = await supabase.from('portfolio_templates').insert({
        id: tpl.id,
        name: tpl.name,
        category: tpl.category,
        description: tpl.description,
        colors: tpl.colors,
        fonts: tpl.fonts,
        layouts: tpl.layouts,
        placeholders: tpl.placeholders,
        preview_image: tpl.preview_image,
        style_notes: tpl.style_notes,
        page_count_range: tpl.page_count_range,
        orientation: tpl.orientation,
      });
      
      if (error) {
        if (!error.message.includes('already exists')) console.log(`  ✗ ${tpl.name}`);
      } else {
        console.log(`  ✓ ${tpl.name}`);
        success++;
      }
    } catch (e) {
      console.log(`  ✗ ${tpl.name} - ${e.message}`);
    }
  }
  
  console.log(`\n✅ Imported ${success} / ${templates.length} portfolio templates`);
  
  console.log(`\n📥 Importing ${sheets.length} sheet templates...\n`);
  
  success = 0;
  for (const sht of sheets) {
    try {
      const { error } = await supabase.from('sheet_templates').insert({
        id: sht.id,
        name: sht.name,
        sheet_type: sht.sheet_type || 'concept',
        category: sht.category,
        format: sht.format || 'A1',
        description: sht.description,
        colors: { primary: sht.colors_primary, accent: sht.colors_accent },
        typography: { heading: sht.heading_font, body: sht.body_font },
        key_placeholders: sht.key_placeholders,
        style_notes: sht.style_notes,
      });
      
      if (error) {
        if (!error.message.includes('already exists')) console.log(`  ✗ ${sht.name}`);
      } else {
        console.log(`  ✓ ${sht.name}`);
        success++;
      }
    } catch (e) {
      console.log(`  ✗ ${sht.name}`);
    }
  }
  
  console.log(`\n✅ Imported ${success} / ${sheets.length} sheet templates\n`);
}

main();
