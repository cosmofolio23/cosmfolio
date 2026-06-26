const fs = require('fs');
const cp = require('child_process');
const path = require('path');
const ffmpeg = require('./node_modules/ffmpeg-static/index.js');
const dir = path.join(__dirname, '../../output/viral_reels_v3');

fs.readdirSync(dir).filter(f => f.endsWith('.webm')).forEach(file => {
  const inPath = path.join(dir, file);
  const outPath = inPath.replace('.webm', '.mp4');
  console.log(`Converting ${file} to mp4...`);
  cp.execSync(`"${ffmpeg}" -y -i "${inPath}" -c:v libx264 -pix_fmt yuv420p "${outPath}"`, {stdio:'inherit'});
  fs.unlinkSync(inPath);
});
console.log('Converted WebM to MP4');
