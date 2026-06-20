// Convert SVG demo assets → PNG using Playwright (headless browser rendering)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '../../demo-assets');
const svgs = fs.readdirSync(ASSETS_DIR).filter(f => f.endsWith('.svg'));

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const svg of svgs) {
    const svgPath = path.join(ASSETS_DIR, svg);
    const pngPath = path.join(ASSETS_DIR, svg.replace('.svg', '.png'));

    if (fs.existsSync(pngPath)) {
      console.log(`  Skipping (exists): ${svg.replace('.svg', '.png')}`);
      continue;
    }

    const svgContent = fs.readFileSync(svgPath, 'utf-8');
    // Extract viewBox dimensions
    const match = svgContent.match(/viewBox="0 0 (\d+) (\d+)"/);
    const w = match ? parseInt(match[1]) : 1200;
    const h = match ? parseInt(match[2]) : 900;

    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<html><body style="margin:0;padding:0">${svgContent}</body></html>`);
    await page.waitForTimeout(500);
    await page.screenshot({ path: pngPath, fullPage: false });
    console.log(`  ✅ ${svg} → ${path.basename(pngPath)}`);
  }

  await browser.close();
  console.log('Done converting assets.');
})();
