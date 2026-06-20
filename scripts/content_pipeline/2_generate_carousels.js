const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../../output');
const CAROUSEL_1_DIR = path.join(OUTPUT_DIR, 'carousel_1');
const CAROUSEL_2_DIR = path.join(OUTPUT_DIR, 'carousel_2');

if (!fs.existsSync(CAROUSEL_1_DIR)) fs.mkdirSync(CAROUSEL_1_DIR, { recursive: true });
if (!fs.existsSync(CAROUSEL_2_DIR)) fs.mkdirSync(CAROUSEL_2_DIR, { recursive: true });

const carousel1Slides = [
  "Your portfolio is taking 3 days.<br/>It should take 30 minutes.",
  "Every architecture student knows this cycle:<br/><span style='color:#AFA9EC;font-size:0.8em;'>Layout in InDesign → export → realize spacing is off → redo it → realize the font doesn't match → redo it again</span>",
  "By the time it's 'done,' you've spent more time formatting than designing.",
  "CosmoFolio fixes the formatting problem.<br/><span style='color:#5DCAA5'>AI builds the layout. You focus on the work.</span>",
  "Portfolio Generator + Sheet Composer<br/><span style='color:#AFA9EC'>Built specifically for architecture, not generic templates.</span>",
  "Free beta this month.<br/><span style='color:#5DCAA5'>Link in bio → cosmofolio.studio</span>"
];

const carousel2Slides = [
  "5 things every architecture portfolio is missing",
  "1. A consistent grid across every sheet — not 'close enough'",
  "2. Scale-accurate entourage — not a random Google Images tree",
  "3. A CV that matches your portfolio's visual identity",
  "4. Project descriptions that don't sound like a Wikipedia page",
  "5. Time. You're missing time, because formatting ate it.",
  "CosmoFolio handles all five.<br/><span style='color:#5DCAA5'>Free beta → cosmofolio.studio</span>"
];

function generateHtml(text, slideNum, totalSlides) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body {
          margin: 0;
          padding: 0;
          background-color: #0A0A0A;
          color: white;
          font-family: "Helvetica Neue", Arial, sans-serif;
          font-weight: bold;
          width: 1080px;
          height: 1350px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-sizing: border-box;
          border: 4px solid #AFA9EC;
          position: relative;
        }
        .content {
          width: 80%;
          text-align: left;
          font-size: 64px;
          line-height: 1.3;
        }
        .slide-number {
          position: absolute;
          top: 40px;
          right: 40px;
          font-size: 36px;
          color: #AFA9EC;
        }
        .brand {
          position: absolute;
          bottom: 40px;
          right: 40px;
          font-size: 48px;
          color: #5DCAA5;
          letter-spacing: -1px;
        }
      </style>
    </head>
    <body>
      <div class="slide-number">${slideNum}/${totalSlides}</div>
      <div class="content">${text}</div>
      <div class="brand">CosmoFolio</div>
    </body>
    </html>
  `;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1080, height: 1350 },
    deviceScaleFactor: 1
  });
  const page = await context.newPage();

  console.log('Generating Carousel 1...');
  for (let i = 0; i < carousel1Slides.length; i++) {
    const html = generateHtml(carousel1Slides[i], i + 1, carousel1Slides.length);
    await page.setContent(html);
    await page.waitForLoadState('networkidle');
    const paddedNum = String(i + 1).padStart(2, '0');
    await page.screenshot({ path: path.join(CAROUSEL_1_DIR, `slide_${paddedNum}.png`) });
    console.log(`Generated carousel 1 slide ${paddedNum}`);
  }

  console.log('Generating Carousel 2...');
  for (let i = 0; i < carousel2Slides.length; i++) {
    const html = generateHtml(carousel2Slides[i], i + 1, carousel2Slides.length);
    await page.setContent(html);
    await page.waitForLoadState('networkidle');
    const paddedNum = String(i + 1).padStart(2, '0');
    await page.screenshot({ path: path.join(CAROUSEL_2_DIR, `slide_${paddedNum}.png`) });
    console.log(`Generated carousel 2 slide ${paddedNum}`);
  }

  await browser.close();
  console.log('Carousel generation complete.');
}

run();
