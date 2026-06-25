const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpegStatic = require('ffmpeg-static');

const inputVideo = "C:\\Users\\MY PC\\Videos\\Screen Recordings\\Cosmo r1.mp4";
const outputDir = path.join(__dirname, '../../output/viral_reels_v2');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const hooks = [
  {
    name: "PainPoint",
    text1: "If you are still spending 3 days",
    text2: "formatting your architecture portfolio...",
    color: "white"
  },
  {
    name: "SecretTool",
    text1: "Architecture students are",
    text2: "gatekeeping this AI tool...",
    color: "white"
  },
  {
    name: "TheFlex",
    text1: "How I built my entire",
    text2: "architecture portfolio in 30 minutes",
    color: "white"
  }
];

hooks.forEach((hook, index) => {
  console.log(`Generating V2 Reel Variant ${index + 1}: ${hook.name}...`);
  const outputFile = path.join(outputDir, `Reel_${hook.name}_Blurred.mp4`);
  
  const filter = `
    [0:v]trim=start=12:end=16,setpts=PTS-STARTPTS[v0];
    [0:v]trim=start=166:end=170,setpts=PTS-STARTPTS[v1];
    [0:v]trim=start=188:end=192,setpts=PTS-STARTPTS[v2];
    [v0][v1][v2]concat=n=3:v=1:a=0[vcat];
    [vcat]split[fg][bg];
    [bg]scale=-1:1920,crop=1080:1920,boxblur=40:40[bg_blur];
    [fg]scale=1080:-1[fg_scaled];
    [bg_blur][fg_scaled]overlay=0:(H-h)/2[vid];
    [vid]drawtext=text='${hook.text1}':fontcolor=${hook.color}:fontsize=52:x=(w-text_w)/2:y=200:box=1:boxcolor=black@0.6:boxborderw=15:enable='between(t,0,4)'[t1];
    [t1]drawtext=text='${hook.text2}':fontcolor=${hook.color}:fontsize=52:x=(w-text_w)/2:y=280:box=1:boxcolor=black@0.6:boxborderw=15:enable='between(t,0,4)'[t2];
    [t2]drawtext=text='CosmoFolio - Free Beta (Link in Bio)':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-250:box=1:boxcolor=#5DCAA5@0.9:boxborderw=15:enable='between(t,8,12)'[out]
  `.trim().replace(/\n/g, '').replace(/\s+/g, ' ');

  const cmd = `"${ffmpegStatic}" -y -i "${inputVideo}" -filter_complex "${filter}" -map "[out]" -c:v libx264 -pix_fmt yuv420p "${outputFile}"`;

  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`Successfully created: ${outputFile}`);
  } catch (e) {
    console.error(`Failed to create ${hook.name}:`, e.message);
  }
});

console.log("All V2 blurred background reels generated!");
