const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const ffmpegStatic = require('ffmpeg-static');

const inputVideo = "C:\\Users\\MY PC\\Videos\\Screen Recordings\\Cosmo r1.mp4";
const outputDir = path.join(__dirname, '../../output/viral_reels');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const hooks = [
  {
    name: "PainPoint",
    text1: "If you are still spending 3 days",
    text2: "formatting your architecture portfolio...",
    color: "white",
    bg: "red"
  },
  {
    name: "SecretTool",
    text1: "Architecture students are",
    text2: "gatekeeping this AI tool...",
    color: "white",
    bg: "purple"
  },
  {
    name: "TheFlex",
    text1: "How I built my entire",
    text2: "architecture portfolio in 30 minutes",
    color: "white",
    bg: "#5DCAA5"
  }
];

// The video is 1916x906. We want 1080x1920 (vertical).
// We'll scale height to 1920 (which makes width ~4060) and then crop the center 1080.
// We'll extract 3 segments: 00:10-00:13, 01:00-01:04, 02:30-02:35.
// We'll concatenate them.

// To do this reliably with ffmpeg, we can use a complex filter.
// We select the 3 segments:
// [0:v]trim=start=10:end=13,setpts=PTS-STARTPTS[v0];
// [0:v]trim=start=60:end=64,setpts=PTS-STARTPTS[v1];
// [0:v]trim=start=150:end=155,setpts=PTS-STARTPTS[v2];
// concat: [v0][v1][v2]concat=n=3:v=1:a=0[vcat];
// scale & crop: [vcat]scale=-1:1920,crop=1080:1920[vcrop];
// drawtext: [vcrop]drawtext=...[out]

hooks.forEach((hook, index) => {
  console.log(`Generating Reel Variant ${index + 1}: ${hook.name}...`);
  const outputFile = path.join(outputDir, `Reel_${hook.name}.mp4`);
  
  const filter = `
    [0:v]trim=start=10:end=13,setpts=PTS-STARTPTS[v0];
    [0:v]trim=start=60:end=64,setpts=PTS-STARTPTS[v1];
    [0:v]trim=start=150:end=155,setpts=PTS-STARTPTS[v2];
    [v0][v1][v2]concat=n=3:v=1:a=0[vcat];
    [vcat]scale=-1:1920,crop=1080:1920[vcrop];
    [vcrop]drawtext=text='${hook.text1}':fontcolor=${hook.color}:fontsize=56:x=(w-text_w)/2:y=h/3-60:box=1:boxcolor=black@0.6:boxborderw=10:enable='between(t,0,4)'[t1];
    [t1]drawtext=text='${hook.text2}':fontcolor=${hook.color}:fontsize=56:x=(w-text_w)/2:y=h/3+20:box=1:boxcolor=black@0.6:boxborderw=10:enable='between(t,0,4)'[t2];
    [t2]drawtext=text='CosmoFolio - Free Beta (Link in Bio)':fontcolor=white:fontsize=48:x=(w-text_w)/2:y=h-300:box=1:boxcolor=#AFA9EC@0.8:boxborderw=10:enable='between(t,7,12)'[out]
  `.trim().replace(/\n/g, '').replace(/\s+/g, ' ');

  const cmd = `"${ffmpegStatic}" -y -i "${inputVideo}" -filter_complex "${filter}" -map "[out]" -c:v libx264 -pix_fmt yuv420p "${outputFile}"`;

  try {
    execSync(cmd, { stdio: 'inherit' });
    console.log(`Successfully created: ${outputFile}`);
  } catch (e) {
    console.error(`Failed to create ${hook.name}:`, e.message);
  }
});

console.log("All viral reels generated!");
