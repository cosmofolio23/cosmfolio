const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../../output');
const SCREENSHOTS_DIR = path.join(OUTPUT_DIR, 'screenshots');
const REEL_A_OUT = path.join(OUTPUT_DIR, 'reel_demo.mp4');
const REEL_B_OUT = path.join(OUTPUT_DIR, 'reel_before_after.mp4');
const TIMESTAMPS_FILE = path.join(OUTPUT_DIR, 'timestamps.json');

if (!fs.existsSync(TIMESTAMPS_FILE)) {
  console.error('timestamps.json not found — run 1_record_session.js first.');
  process.exit(1);
}

const timestamps = JSON.parse(fs.readFileSync(TIMESTAMPS_FILE, 'utf-8'));
const videoFile = timestamps.videoFile ? path.join(OUTPUT_DIR, timestamps.videoFile) : null;
const ffmpegStatic = require('ffmpeg-static');
const ff = `"${ffmpegStatic}"`;

function esc(text) {
  // Escape special chars for ffmpeg drawtext
  return text
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "’")   // replace apostrophe with right-single-quote (avoids shell escaping hell)
    .replace(/:/g, '\\:')
    .replace(/,/g, '\\,');
}

// ─── REEL A — Product Demo (18-20s vertical 1080x1920) ────────────────────────
// Uses the recorded .webm session video. If not available, builds from screenshots.
console.log('\n── Reel A (Product Demo) ──────────────────────────────────────');

const captions = [
  { text: "you're still manually placing drawings on sheets?", from: 0,  to: 2,  color: 'white' },
  { text: "meanwhile architecture students are doing this",    from: 2,  to: 5,  color: 'white' },
  { text: "upload your drawings",                              from: 5,  to: 7,  color: 'white' },
  { text: "AI builds the layout",                             from: 7,  to: 9,  color: '#AFA9EC' },
  { text: "add scale-accurate entourage in one click",        from: 9,  to: 13, color: '#5DCAA5' },
  { text: "submission-ready sheet. done.",                    from: 13, to: 17, color: 'white' },
  { text: "CosmoFolio — free beta, link in bio",        from: 17, to: 20, color: '#5DCAA5' },
];

// Build drawtext filter chain
function buildDrawtextChain(inputLabel, captions) {
  let chain = inputLabel;
  captions.forEach((c, i) => {
    const outLabel = i === captions.length - 1 ? '[out]' : `[dt${i}]`;
    const prevLabel = i === 0 ? inputLabel : `[dt${i - 1}]`;
    chain = `${prevLabel}drawtext=text='${esc(c.text)}':fontcolor='${c.color}':fontsize=52:x=(w-text_w)/2:y=h-350:box=1:boxcolor=black@0.6:boxborderw=14:enable='between(t,${c.from},${c.to})'${outLabel}`;
  });
  return captions.map((c, i) => {
    const prevLabel = i === 0 ? '[scaled]' : `[dt${i - 1}]`;
    const outLabel = i === captions.length - 1 ? '[out]' : `[dt${i}]`;
    return `${prevLabel}drawtext=text='${esc(c.text)}':fontcolor='${c.color}':fontsize=52:x=(w-text_w)/2:y=h-350:box=1:boxcolor=black@0.6:boxborderw=14:enable='between(t,${c.from},${c.to})'${outLabel}`;
  }).join(';');
}

if (videoFile && fs.existsSync(videoFile)) {
  console.log(`Using recorded video: ${path.basename(videoFile)}`);

  // scale to 1080 wide, pad to 1920 tall with brand-dark background
  const scaleFilter = `[0:v]scale=1080:-2,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x0A0A0A[scaled]`;
  const textChain = buildDrawtextChain('[scaled]', captions);
  const filterComplex = `${scaleFilter};${textChain}`;

  const cmdA = `${ff} -y -i "${videoFile}" -t 20 -filter_complex "${filterComplex}" -map "[out]" -c:v libx264 -preset fast -pix_fmt yuv420p -r 30 "${REEL_A_OUT}"`;
  try {
    execSync(cmdA, { stdio: 'inherit' });
    console.log(`Reel A → ${REEL_A_OUT}`);
  } catch (e) {
    console.error('Reel A failed:', e.message);
    buildReelAFromScreenshots();
  }
} else {
  console.log('No session video found — building Reel A from screenshots slideshow.');
  buildReelAFromScreenshots();
}

function buildReelAFromScreenshots() {
  // Build a 20s slideshow from screenshots: each visible ~3-4s
  const shots = [
    '01_dashboard.png',
    '02_portfolio_builder.png',
    '03_upload.png',
    '04_ai_generating.png',
    '05_entourage.png',
    '09_cv_generator.png',
  ].map(s => path.join(SCREENSHOTS_DIR, s)).filter(fs.existsSync);

  if (shots.length === 0) {
    console.error('No screenshots available for Reel A slideshow. Run step 1 first.');
    return;
  }

  // Create a concat demuxer file
  const concatFile = path.join(OUTPUT_DIR, '_concat_a.txt');
  const dur = Math.floor(20 / shots.length);
  const lines = shots.map(s => `file '${s.replace(/\\/g, '/')}'\nduration ${dur}`).join('\n');
  fs.writeFileSync(concatFile, lines + '\n');

  const scaleFilter = `[0:v]scale=1080:-2,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x0A0A0A[scaled]`;
  const textChain = buildDrawtextChain('[scaled]', captions);
  const filterComplex = `${scaleFilter};${textChain}`;

  const cmdA = `${ff} -y -f concat -safe 0 -i "${concatFile}" -filter_complex "${filterComplex}" -map "[out]" -c:v libx264 -preset fast -pix_fmt yuv420p -r 30 -t 20 "${REEL_A_OUT}"`;
  try {
    execSync(cmdA, { stdio: 'inherit' });
    console.log(`Reel A (slideshow) → ${REEL_A_OUT}`);
  } catch (e) {
    console.error('Reel A slideshow failed:', e.message);
  }
}

// ─── REEL B — Before / After (10-12s vertical 1080x1920) ──────────────────────
console.log('\n── Reel B (Before / After) ────────────────────────────────────');

// "Before" = dashboard (raw, not styled by CosmoFolio)
// "After"  = best finished screenshot (entourage, cv, or sheet)
const beforeCandidates = ['01_dashboard.png'];
const afterCandidates  = [
  '06_entourage_elements.png', '09_cv_generator.png', '11_sheet_composer.png',
  '04_ai_generating.png',
  // fallbacks from previous pipeline runs (old naming scheme)
  '06_finished_sheet.png', '05_entourage.png', '04_sheet_composer.png', '07_cv_generator.png',
];

const beforeImg = beforeCandidates.map(s => path.join(SCREENSHOTS_DIR, s)).find(fs.existsSync);
const afterImg  = afterCandidates.map(s => path.join(SCREENSHOTS_DIR, s)).find(fs.existsSync);

if (!beforeImg || !afterImg) {
  console.error(`Missing screenshots for Reel B.\n  before: ${beforeImg}\n  after: ${afterImg}`);
  console.error('Run 1_record_session.js first.');
} else {
  // before: 5s  after: 7s
  // Each image: scale→pad to 1080x1920, add caption
  const reelB_filter = [
    // Before segment
    `[0:v]scale=1080:-2,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x0A0A0A[b0]`,
    `[b0]drawtext=text='before':fontcolor=white:fontsize=120:x=(w-text_w)/2:y=h-320:box=1:boxcolor=black@0.5:boxborderw=20[v0]`,
    // After segment
    `[1:v]scale=1080:-2,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0x0A0A0A[b1]`,
    `[b1]drawtext=text='after':fontcolor='#5DCAA5':fontsize=120:x=(w-text_w)/2:y=h-320:box=1:boxcolor=black@0.5:boxborderw=20:enable='between(t,0,5)'[a1]`,
    `[a1]drawtext=text='CosmoFolio. free beta this month.':fontcolor='#AFA9EC':fontsize=50:x=(w-text_w)/2:y=h-200:box=1:boxcolor=black@0.5:boxborderw=12:enable='between(t,5,7)'[v1]`,
    // Concat
    `[v0][v1]concat=n=2:v=1:a=0[out]`,
  ].join(';');

  const cmdB = `${ff} -y -loop 1 -t 5 -i "${beforeImg}" -loop 1 -t 7 -i "${afterImg}" -filter_complex "${reelB_filter}" -map "[out]" -c:v libx264 -preset fast -pix_fmt yuv420p -r 30 "${REEL_B_OUT}"`;
  try {
    execSync(cmdB, { stdio: 'inherit' });
    console.log(`Reel B → ${REEL_B_OUT}`);
  } catch (e) {
    console.error('Reel B failed:', e.message);
  }
}

console.log('\nDone.');
