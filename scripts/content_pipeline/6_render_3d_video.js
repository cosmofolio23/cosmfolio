const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../../output/viral_reels_v3');
const RAW_VIDEO = path.join(OUTPUT_DIR, 'trimmed_raw.mp4');

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Copy the video into a local static directory so Playwright can access it locally easily
const staticDir = path.join(__dirname, 'static');
if (!fs.existsSync(staticDir)) fs.mkdirSync(staticDir);
const copiedVideo = path.join(staticDir, 'trimmed_raw.mp4');
fs.copyFileSync(RAW_VIDEO, copiedVideo);

const hooks = [
  {
    name: "PainPoint",
    t1: "If you are still spending 3 days",
    t2: "formatting your architecture portfolio..."
  },
  {
    name: "SecretTool",
    t1: "Architecture students are",
    t2: "gatekeeping this AI tool..."
  },
  {
    name: "TheFlex",
    t1: "How I built my entire",
    t2: "architecture portfolio in 30 minutes"
  }
];

function generateHtml(t1, t2) {
  return `
<!DOCTYPE html>
<html>
<head>
<style>
  body {
    margin: 0;
    overflow: hidden;
    background-color: #0A0A0A;
    font-family: 'Helvetica Neue', Arial, sans-serif;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 1080px;
    height: 1920px;
    position: relative;
  }
  .glow-1 {
    position: absolute;
    width: 1000px; height: 1000px;
    background: radial-gradient(circle, rgba(175,169,236,0.3) 0%, rgba(0,0,0,0) 70%);
    top: 5%; left: -20%;
    animation: float1 10s infinite alternate;
  }
  .glow-2 {
    position: absolute;
    width: 1000px; height: 1000px;
    background: radial-gradient(circle, rgba(93,202,165,0.2) 0%, rgba(0,0,0,0) 70%);
    bottom: 5%; right: -20%;
    animation: float2 12s infinite alternate;
  }
  .mockup-container {
    perspective: 1500px;
    z-index: 10;
  }
  .laptop {
    width: 1000px;
    height: 600px;
    background: #111;
    border-radius: 20px;
    border: 4px solid #333;
    box-shadow: 0 40px 100px rgba(0,0,0,0.8), 0 0 40px rgba(175,169,236,0.2);
    overflow: hidden;
    transform: rotateX(5deg) rotateY(-10deg) scale(0.9);
    animation: intro 2s ease-out forwards;
    position: relative;
    display: flex;
    flex-direction: column;
  }
  .browser-bar {
    height: 35px;
    background: #222;
    display: flex;
    align-items: center;
    padding-left: 20px;
    gap: 10px;
  }
  .dot { width: 14px; height: 14px; border-radius: 50%; background: #555; }
  .dot.red { background: #ff5f56; }
  .dot.yellow { background: #ffbd2e; }
  .dot.green { background: #27c93f; }
  video {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .text-overlay {
    position: absolute;
    top: 300px;
    width: 100%;
    text-align: center;
    z-index: 20;
    color: white;
  }
  .text-overlay h1 {
    font-size: 60px;
    margin: 10px 0;
    text-shadow: 0 10px 30px rgba(0,0,0,0.8);
    opacity: 0;
    transform: translateY(50px);
  }
  .text-overlay h1.t1 { animation: slideUp 0.8s 1s forwards; color: white; }
  .text-overlay h1.t2 { animation: slideUp 0.8s 1.5s forwards; color: #AFA9EC; }
  
  .cta {
    position: absolute;
    bottom: 300px;
    width: 100%;
    text-align: center;
    z-index: 20;
    opacity: 0;
    animation: fadeIn 1s 8s forwards;
  }
  .cta-btn {
    background: linear-gradient(135deg, #5DCAA5, #419b7d);
    color: black;
    font-size: 48px;
    font-weight: bold;
    padding: 25px 60px;
    border-radius: 60px;
    box-shadow: 0 15px 40px rgba(93,202,165,0.4);
    display: inline-block;
  }

  @keyframes intro {
    0% { transform: translateY(200px) rotateX(20deg) rotateY(0deg) scale(0.7); opacity: 0; }
    100% { transform: translateY(0) rotateX(5deg) rotateY(-10deg) scale(0.9); opacity: 1; }
  }
  @keyframes float1 { 0% { transform: translate(0,0); } 100% { transform: translate(100px, 100px); } }
  @keyframes float2 { 0% { transform: translate(0,0); } 100% { transform: translate(-100px, -100px); } }
  @keyframes slideUp { to { opacity: 1; transform: translateY(0); } }
  @keyframes fadeIn { to { opacity: 1; transform: translateY(0) scale(1); } from { transform: translateY(20px) scale(0.95); } }
</style>
</head>
<body>
  <div class="glow-1"></div>
  <div class="glow-2"></div>
  
  <div class="text-overlay">
    <h1 class="t1">${t1}</h1>
    <h1 class="t2">${t2}</h1>
  </div>

  <div class="mockup-container">
    <div class="laptop">
      <div class="browser-bar">
        <div class="dot red"></div><div class="dot yellow"></div><div class="dot green"></div>
      </div>
      <video src="trimmed_raw.mp4" autoplay muted playsinline></video>
    </div>
  </div>

  <div class="cta">
    <div class="cta-btn">CosmoFolio - Free Beta</div>
  </div>
</body>
</html>
  `;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  
  for (const hook of hooks) {
    console.log(`Recording 3D Mockup: ${hook.name}...`);
    
    const htmlFile = path.join(staticDir, `index_${hook.name}.html`);
    fs.writeFileSync(htmlFile, generateHtml(hook.t1, hook.t2));

    const context = await browser.newContext({
      viewport: { width: 1080, height: 1920 },
      deviceScaleFactor: 1,
      recordVideo: {
        dir: OUTPUT_DIR,
        size: { width: 1080, height: 1920 }
      }
    });

    const page = await context.newPage();
    // Use file:// protocol to load the local html and allow video playback
    await page.goto(`file:///${htmlFile.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
    
    // Wait for the duration of the video (12 seconds)
    await page.waitForTimeout(12000);
    
    await context.close();
    
    // Playwright names the video with a hash. Let's rename it.
    const videoPath = await page.video().path();
    const finalPath = path.join(OUTPUT_DIR, `3D_Reel_${hook.name}.webm`);
    
    if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
    fs.renameSync(videoPath, finalPath);
    
    console.log(`Saved: ${finalPath}`);
  }

  await browser.close();
  console.log('All 3D Mockup Reels completed!');
}

run().catch(console.error);
