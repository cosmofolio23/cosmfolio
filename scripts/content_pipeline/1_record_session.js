const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../../output');
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');
const APP_URL = process.env.APP_URL || 'https://cosmofolio-beryl.vercel.app';
const DEMO_EMAIL = process.env.DEMO_EMAIL || '';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD || '';

if (!DEMO_EMAIL || !DEMO_PASSWORD) {
  console.error('Set DEMO_EMAIL and DEMO_PASSWORD env vars.');
  process.exit(1);
}

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });
if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

// Prefer PNG versions of assets (raster, accepted by image/* inputs)
const DEMO_ASSETS_DIR = path.join(__dirname, '../../demo-assets');
const demoFiles = fs.existsSync(DEMO_ASSETS_DIR)
  ? fs.readdirSync(DEMO_ASSETS_DIR)
      .filter(f => /\.png$/i.test(f))   // PNGs only
      .map(f => path.join(DEMO_ASSETS_DIR, f))
  : [];

console.log(`Demo PNG assets: ${demoFiles.length}`);
demoFiles.forEach(f => console.log('  ', path.basename(f)));

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function shot(page, name) {
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, name), fullPage: false });
  console.log(`  📸 ${name}`);
}

async function signIn(page) {
  console.log('\n── Sign in ─────────────────────────────────────────');
  await page.goto(`${APP_URL}/signin`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);
  await page.locator('input[type="email"], input[name="email"]').first().fill(DEMO_EMAIL);
  await page.locator('input[type="password"]').first().fill(DEMO_PASSWORD);
  await page.locator('button[type="submit"], button:has-text("Sign In"), button:has-text("Sign in")').first().click();
  await page.waitForURL(`${APP_URL}/dashboard**`, { timeout: 20000 });
  await page.waitForTimeout(2000);
  console.log('  ✅ Signed in');
}

async function dismissWizard(page) {
  // Click Landscape on step 1 if present
  const landscape = page.locator('text="Landscape"').first();
  if (await landscape.isVisible({ timeout: 3000 }).catch(() => false)) await landscape.click();

  // Click through all "Next Step" buttons until modal closes
  for (let i = 0; i < 6; i++) {
    const btn = page.locator('button:has-text("Next Step"), button:has-text("Finish"), button:has-text("Start Designing"), button:has-text("Done")').first();
    if (!await btn.isVisible({ timeout: 1500 }).catch(() => false)) break;
    // On purpose step: pick University
    const uni = page.locator('text="University Application"').first();
    if (await uni.isVisible({ timeout: 500 }).catch(() => false)) await uni.click();
    await btn.click();
    await page.waitForTimeout(700);
    console.log(`  Wizard step ${i + 1} → next`);
  }
  // Fallback close
  const x = page.locator('button:has-text("×"), button:has-text("✕"), button[aria-label="Close"]').first();
  if (await x.isVisible({ timeout: 1000 }).catch(() => false)) await x.click();
  else await page.keyboard.press('Escape');
  await page.waitForTimeout(1000);
  console.log('  ✅ Wizard closed');
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: OUTPUT_DIR, size: { width: 1440, height: 900 } }
  });
  const page = await context.newPage();
  const timestamps = {};
  const t0 = Date.now();
  const mark = (k) => { timestamps[k] = +((Date.now() - t0) / 1000).toFixed(2); console.log(`  ⏱ [${timestamps[k]}s] ${k}`); };

  try {
    // ── 1. Sign in ────────────────────────────────────────────────────────
    await signIn(page);
    await shot(page, '01_dashboard.png');
    mark('dashboard');

    // ── 2. Templates page ────────────────────────────────────────────────
    console.log('\n── Templates gallery ───────────────────────────────');
    await page.goto(`${APP_URL}/dashboard/templates`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    await shot(page, '02_templates_page.png');
    mark('templates');

    // ── 3. Dismiss setup wizard ──────────────────────────────────────────
    await dismissWizard(page);
    await shot(page, '03_templates_gallery.png');

    // ── 4. Pick a template & open editor ────────────────────────────────
    console.log('\n── Selecting template ──────────────────────────────');
    // Try named templates first, then first card
    for (const name of ['Dark Studio', 'Minimal Studio', 'Graduate Portfolio', 'Architectural Journal']) {
      const el = page.locator(`text="${name}"`).first();
      if (await el.isVisible({ timeout: 1500 }).catch(() => false)) {
        await el.click(); await page.waitForTimeout(1500);
        console.log(`  Clicked: ${name}`); break;
      }
    }

    // Click "Use Template" button that appears
    const useBtn = page.locator('button:has-text("Use Template"), button:has-text("Use this template"), button:has-text("Open Editor"), button:has-text("Start with this")').first();
    if (await useBtn.isVisible({ timeout: 4000 }).catch(() => false)) {
      await useBtn.click();
    } else {
      // fallback: click first card
      await page.locator('[class*="card"]').first().click();
      await page.waitForTimeout(1000);
      const btn2 = page.locator('button:has-text("Use")').first();
      if (await btn2.isVisible({ timeout: 2000 }).catch(() => false)) await btn2.click();
    }

    await shot(page, '04_template_selected.png');

    // ── 5. Wait for editor ───────────────────────────────────────────────
    console.log('\n── Editor loading ──────────────────────────────────');
    await page.waitForURL(`${APP_URL}/dashboard/templates/**/editor**`, { timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(5000);
    mark('editor_loaded');
    await shot(page, '05_editor_loaded.png');

    // ── 6. Upload PNG assets one by one ─────────────────────────────────
    if (demoFiles.length > 0) {
      console.log('\n── Uploading PNG assets ────────────────────────────');
      for (const f of demoFiles) {
        const input = page.locator('input[type="file"]').first();
        if (await input.count() > 0) {
          await input.setInputFiles(f);
          await page.waitForTimeout(2500);
          console.log(`  ✅ ${path.basename(f)}`);
        }
      }
      await shot(page, '06_assets_uploaded.png');

      // ── 7. Auto-fill all image slots ──────────────────────────────────
      console.log('\n── Auto-fill ───────────────────────────────────────');
      const autoFill = page.locator('button:has-text("Auto-fill"), button:has-text("Auto fill")').first();
      if (await autoFill.isVisible({ timeout: 3000 }).catch(() => false)) {
        await autoFill.click();
        console.log('  ✅ Auto-fill clicked — waiting for images to populate...');
        await page.waitForTimeout(6000);
        await shot(page, '07_autofilled.png');
      }
    }

    // ── 8. Capture cover page in editor ─────────────────────────────────
    console.log('\n── Capturing pages ─────────────────────────────────');
    await shot(page, '08_cover_page.png');
    mark('cover');

    // ── 9. Navigate pages via left sidebar items (text-based) ────────────
    // The left nav lists pages by name: "Selected Works", "About Me", "Project 01", etc.
    const pageLabels = ['Selected Works', 'About Me', 'Curriculum Vitae', 'Project 01', 'Project 02'];
    for (let i = 0; i < pageLabels.length; i++) {
      const lbl = page.locator(`text="${pageLabels[i]}"`).first();
      if (await lbl.isVisible({ timeout: 2000 }).catch(() => false)) {
        await lbl.click();
        await page.waitForTimeout(2000);
        const num = String(9 + i).padStart(2, '0');
        await shot(page, `${num}_page_${pageLabels[i].replace(/ /g, '_').toLowerCase()}.png`);
        console.log(`  → ${pageLabels[i]}`);
      }
    }
    mark('pages_done');

    // ── 10. Open Spread Manager for the big overview shot ────────────────
    console.log('\n── Spread Manager overview ─────────────────────────');
    const spreadsBtn = page.locator('button:has-text("Spreads")').first();
    if (await spreadsBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await spreadsBtn.click();
      await page.waitForTimeout(3000);
      await shot(page, '14_spread_manager.png');
      console.log('  ✅ Spread Manager captured');
      // Close it
      const closeM = page.locator('button:has-text("Close Manager")').first();
      if (await closeM.isVisible({ timeout: 2000 }).catch(() => false)) await closeM.click();
      else await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }

    // ── 11. Preview ──────────────────────────────────────────────────────
    console.log('\n── Preview ─────────────────────────────────────────');
    const previewBtn = page.locator('button:has-text("Preview"), button[title*="Preview"]').first();
    if (await previewBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await previewBtn.click();
      await page.waitForTimeout(3000);
      await shot(page, '15_preview.png');
      console.log('  ✅ Preview captured');
      await page.keyboard.press('Escape');
      await page.waitForTimeout(1000);
    }

    mark('done');
    console.log('\n✅ All done!');

  } catch (err) {
    console.error('\n❌ Error:', err.message);
    await shot(page, 'error_state.png').catch(() => {});
  } finally {
    await context.close();
    const videoPath = page.video() ? await page.video().path() : null;
    await browser.close();
    timestamps.videoFile = videoPath ? path.basename(videoPath) : null;
    fs.writeFileSync(path.join(OUTPUT_DIR, 'timestamps.json'), JSON.stringify(timestamps, null, 2));
    console.log(`\nVideo → ${videoPath || 'none'}`);
  }
}

run();
