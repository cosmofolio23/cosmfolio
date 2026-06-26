const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpegStatic = require('ffmpeg-static');

const inputVideo = "C:\\Users\\MY PC\\Videos\\Screen Recordings\\Cosmo r1.mp4";
const outputDir = path.join(__dirname, '../../output/viral_reels_v3');
const tempVideo = path.join(outputDir, 'trimmed_raw.mp4');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Trim the best parts and speed up slightly
// 12-16 (4s)
// 166-170 (4s)
// 188-192 (4s)
const filter = `
  [0:v]trim=start=12:end=16,setpts=PTS-STARTPTS[v0];
  [0:v]trim=start=166:end=170,setpts=PTS-STARTPTS[v1];
  [0:v]trim=start=188:end=192,setpts=PTS-STARTPTS[v2];
  [v0][v1][v2]concat=n=3:v=1:a=0[out]
`.trim().replace(/\n/g, '').replace(/\s+/g, ' ');

const cmd = `"${ffmpegStatic}" -y -i "${inputVideo}" -filter_complex "${filter}" -map "[out]" -c:v libx264 -pix_fmt yuv420p "${tempVideo}"`;

console.log('Stitching raw clips...');
try {
  execSync(cmd, { stdio: 'inherit' });
  console.log(`Successfully created raw clips: ${tempVideo}`);
} catch (e) {
  console.error(`Failed to create raw clips:`, e.message);
  process.exit(1);
}
