#!/bin/bash
# Process Demo Video
# This script speeds up the video 2x, trims it (optional), and burns a text caption.

INPUT_VIDEO=$1
OUTPUT_VIDEO="demo_processed.mp4"

if [ -z "$INPUT_VIDEO" ]; then
  echo "Usage: ./process_demo.sh <input_video.webm/.mp4>"
  exit 1
fi

echo "Processing $INPUT_VIDEO..."

# FFmpeg breakdown:
# -filter_complex "[0:v]setpts=0.5*PTS[v];[v]drawtext=text='AI analyzes your images... -> Instantly generates layouts':fontcolor=white:fontsize=48:box=1:boxcolor=black@0.5:boxborderw=10:x=(w-text_w)/2:y=h-th-40"
# This halves the video duration (2x speed) and draws the caption text centered near the bottom.

ffmpeg -y -i "$INPUT_VIDEO" -filter_complex \
  "[0:v]setpts=0.5*PTS, \
   drawtext=text='AI analyzes your images... \-\> Instantly generates layouts':\
   fontcolor=white:fontsize=48:\
   box=1:boxcolor=black@0.6:boxborderw=20:\
   x=(w-text_w)/2:y=h-100[outv]" \
  -map "[outv]" -c:v libx264 -preset fast -crf 22 "$OUTPUT_VIDEO"

echo "Done! Saved to $OUTPUT_VIDEO"
echo "Copy this file to frontend/public/demo.mp4 to use it on the website."
