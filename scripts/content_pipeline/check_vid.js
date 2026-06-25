const cp = require('child_process');
const ffmpeg = require('ffmpeg-static');

try {
  cp.execSync(`"${ffmpeg}" -i "C:\\Users\\MY PC\\Videos\\Screen Recordings\\Cosmo r1.mp4"`, {stdio: 'pipe'});
} catch(e) {
  console.log(e.stderr.toString());
}
