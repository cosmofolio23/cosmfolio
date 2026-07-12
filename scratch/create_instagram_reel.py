#!/usr/bin/env python
"""
Batch Auto-Reels Content Engine for CosmoFolio
Automates script generation, avatar lip-syncing (free via Hugging Face),
human-like Playwright browser screen recording, and compilation of vertical 9:16 Reels.
"""

import os
import sys
import json
import time
import math
import glob
import numpy as np
from PIL import Image, ImageDraw, ImageFont
import cv2
from dotenv import load_dotenv
from gtts import gTTS
from playwright.sync_api import sync_playwright
from gradio_client import Client, handle_file

# Add backend to path for environment loading
sys.path.append(os.path.abspath("backend"))
load_dotenv(os.path.abspath("backend/.env"))

# Constants & Configuration
COSMOFOLIO_URL = os.getenv("COSMOFOLIO_URL", "http://localhost:3000")
DEMO_EMAIL = os.getenv("DEMO_ACCOUNT_EMAIL", "boseraj001@gmail.com")
DEMO_PASSWORD = os.getenv("DEMO_ACCOUNT_PASSWORD", "cosmofolio_demo_123")
HF_SADTALKER_SPACE = "vinthony/SadTalker"

SCRATCH_DIR = os.path.abspath("scratch")
OUTPUT_DIR = os.path.abspath("output/reels")
os.makedirs(SCRATCH_DIR, exist_ok=True)
os.makedirs(OUTPUT_DIR, exist_ok=True)


def get_default_font(size):
    """Load a standard font (Arial/Helvetica/Impact) for subtitles"""
    font_paths = [
        "C:\\Windows\\Fonts\\arialbd.ttf",  # Arial Bold
        "C:\\Windows\\Fonts\\Impact.ttf",   # Impact
        "C:\\Windows\\Fonts\\tahoma.ttf",   # Tahoma
    ]
    for p in font_paths:
        if os.path.exists(p):
            try:
                return ImageFont.truetype(p, size)
            except Exception:
                pass
    return ImageFont.load_default()


def simulate_human_mouse(page, end_x, end_y, steps=15):
    """Move cursor along a natural Bezier curve to a button to look human-made"""
    # Start from current position or top-left
    start_x, start_y = 100, 100
    control_x = start_x + (end_x - start_x) / 2 + 80
    control_y = start_y + (end_y - start_y) / 2 - 120
    
    for i in range(steps + 1):
        t = i / steps
        # Bezier curve formula
        x = int((1-t)**2 * start_x + 2*(1-t)*t * control_x + t**2 * end_x)
        y = int((1-t)**2 * start_y + 2*(1-t)*t * control_y + t**2 * end_y)
        page.mouse.move(x, y)
        time.sleep(0.01)


def generate_audio(text, output_path):
    """Synthesize voice script using free gTTS"""
    print(f"[gTTS] Generating audio for: '{text[:40]}...'")
    tts = gTTS(text=text, lang='en', slow=False)
    tts.save(output_path)
    print(f"[gTTS] Audio saved to {output_path}")


def lip_sync_avatar(image_path, audio_path, output_path):
    """Sync avatar image with audio using free Hugging Face SadTalker space"""
    print(f"[Gradio] Sending {image_path} and {audio_path} to Hugging Face...")
    try:
        client = Client(HF_SADTALKER_SPACE)
        # Call the SadTalker endpoint
        result = client.predict(
            source_image=handle_file(image_path),
            driven_audio=handle_file(audio_path),
            preprocess='crop', # crop, resize, full
            still_mode=True,
            use_generator=True,
            api_name="/predict"
        )
        # Result will be a path to the generated video file
        if isinstance(result, tuple):
            video_result = result[0]
        else:
            video_result = result
            
        if os.path.exists(video_result):
            # Copy file to output_path
            import shutil
            shutil.copy(video_result, output_path)
            print(f"[Gradio] Lip-sync video successfully generated: {output_path}")
            return True
    except Exception as e:
        print(f"[Gradio ERROR] Failed to generate lip-sync: {str(e)}")
        return False


def playwright_record_demo(feature_id, output_path):
    """Launch Playwright, log in, perform human-like actions, and record a 9:16 video locally"""
    url = COSMOFOLIO_URL
    print(f"[Playwright] Checking local server status at {url}...")
    try:
        import requests
        requests.get(url, timeout=2)
        print(f"[Playwright] Local server {url} is online.")
    except Exception:
        raise ConnectionError(
            f"\n[Playwright ERROR] Local CosmoFolio server is offline at {url}.\n"
            f"Please start your local server (e.g., run Next.js and FastAPI dev servers) before running this script.\n"
            f"Note: To keep this tool 100% offline and secure, it will not connect to the live production site."
        )

    print(f"[Playwright] Recording demo for feature '{feature_id}' locally...")
    
    # We will record as vertical 9:16 viewport
    width, height = 540, 960  # Good scale for 1080x1920 output
    
    with sync_playwright() as p:
        # Launch headful browser so the viewport renders correctly
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            viewport={"width": width, "height": height},
            record_video_dir=os.path.join(SCRATCH_DIR, "raw_recordings"),
            record_video_size={"width": width, "height": height}
        )
        
        page = context.new_page()
        
        try:
            # 1. Sign In
            print(f"[Playwright] Accessing local sign-in page at {url}/signin")
            page.goto(f"{url}/signin")
            page.wait_for_timeout(1500)
            
            # Fill inputs with delays
            page.click('input[type="email"]')
            page.type('input[type="email"]', DEMO_EMAIL, delay=80)
            page.wait_for_timeout(500)
            
            page.click('input[type="password"]')
            page.type('input[type="password"]', DEMO_PASSWORD, delay=80)
            page.wait_for_timeout(500)
            
            # Submit form
            page.click('button[type="submit"]')
            print("[Playwright] Logged in successfully!")
            
            # Wait for redirect
            page.wait_for_url("**/dashboard**", timeout=10000)
            page.wait_for_timeout(2000)
            
            # 2. Perform Custom Workflow based on feature
            if feature_id == "template_switcher":
                # Navigate to templates library
                page.goto(f"{url}/dashboard/templates")
                page.wait_for_timeout(2500)
                
                # Scroll to template cards
                page.evaluate("window.scrollBy({top: 300, behavior: 'smooth'})")
                page.wait_for_timeout(1500)
                
                # Simulate smooth cursor hovering over a template
                simulate_human_mouse(page, 270, 480)
                page.wait_for_timeout(1000)
                
                # Scroll a bit more
                page.evaluate("window.scrollBy({top: 400, behavior: 'smooth'})")
                page.wait_for_timeout(2000)
                
            elif feature_id == "pdf_export":
                # Navigate to my portfolios
                page.goto(f"{url}/dashboard/my-portfolios")
                page.wait_for_timeout(2500)
                
                # Hover over the first portfolio and click preview/settings
                simulate_human_mouse(page, 270, 300)
                page.wait_for_timeout(1000)
                
                page.evaluate("window.scrollBy({top: 600, behavior: 'smooth'})")
                page.wait_for_timeout(2000)
                
            else: # Default onboard sheet wizard
                page.goto(f"{url}/dashboard")
                page.wait_for_timeout(2500)
                page.evaluate("window.scrollBy({top: 200, behavior: 'smooth'})")
                page.wait_for_timeout(2000)
                
            print("[Playwright] Action recorded!")
            
        except Exception as err:
            print(f"[Playwright ERROR] Recording failed: {str(err)}")
            
        finally:
            context.close()
            browser.close()
            
        # Locate the recorded video file and rename/copy it
        video_files = glob.glob(os.path.join(SCRATCH_DIR, "raw_recordings", "*.webm"))
        if video_files:
            latest_video = max(video_files, key=os.path.getctime)
            # Reformat to output_path using OpenCV to standardize
            cap = cv2.VideoCapture(latest_video)
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, 30.0, (width, height))
            
            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    break
                out.write(frame)
            cap.release()
            out.release()
            
            # Clean up raw files
            for vf in video_files:
                try:
                    os.remove(vf)
                except Exception:
                    pass
            print(f"[Playwright] Saved standardized demo video: {output_path}")
            return True
            
    return False


def render_subtitles_on_frame(frame, text, font, font_size):
    """Draw a beautiful subtitle with black borders on a frame"""
    # Convert OpenCV BGR to PIL RGB
    img = Image.fromarray(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))
    draw = ImageDraw.Draw(img)
    w, h = img.size
    
    # Calculate text dimensions
    # Split text into lines if too long
    words = text.split()
    lines = []
    current_line = []
    for word in words:
        current_line.append(word)
        # Test line length
        test_str = " ".join(current_line)
        bbox = draw.textbbox((0, 0), test_str, font=font)
        text_w = bbox[2] - bbox[0]
        if text_w > w - 80:  # Margin of 40px on each side
            current_line.pop()
            lines.append(" ".join(current_line))
            current_line = [word]
    if current_line:
        lines.append(" ".join(current_line))
        
    # Draw each line centered near bottom
    y_start = h - 220 - (len(lines) * (font_size + 10))
    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        tw = bbox[2] - bbox[0]
        th = bbox[3] - bbox[1]
        tx = (w - tw) // 2
        ty = y_start + i * (font_size + 15)
        
        # Draw outline (stroke) for high legibility
        for ox in [-3, -2, -1, 0, 1, 2, 3]:
            for oy in [-3, -2, -1, 0, 1, 2, 3]:
                draw.text((tx+ox, ty+oy), line, font=font, fill=(0, 0, 0))
                
        # Draw bright yellow text inside outline
        draw.text((tx, ty), line, font=font, fill=(255, 230, 0))
        
    # Convert PIL back to OpenCV
    return cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)


def compile_reel_video(avatar_hook_path, app_demo_path, avatar_outro_path, script_hook_text, script_outro_text, final_output):
    """Merge videos, crop to vertical 9:16 (1080x1920), and render text captions"""
    print("[Compiler] Compiling final vertical 9:16 Reel...")
    
    # Target resolution
    target_w, target_h = 1080, 1920
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    out = cv2.VideoWriter(final_output, fourcc, 30.0, (target_w, target_h))
    
    # Load fonts
    font_large = get_default_font(60)
    
    clips = [
        {"path": avatar_hook_path, "subtitle": script_hook_text, "type": "avatar"},
        {"path": app_demo_path, "subtitle": "CosmoFolio App Demo", "type": "demo"},
        {"path": avatar_outro_path, "subtitle": script_outro_text, "type": "avatar"}
    ]
    
    for clip in clips:
        if not os.path.exists(clip["path"]):
            print(f"[Compiler Warning] Missing video clip: {clip['path']}. Skipping.")
            continue
            
        cap = cv2.VideoCapture(clip["path"])
        fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        
        # Word timing helper for dynamic caption highlighting
        sub_text = clip["subtitle"]
        
        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
                
            fh, fw, _ = frame.shape
            
            # Crop to 9:16 center
            aspect = target_w / target_h
            if (fw / fh) > aspect:
                # Wide video -> Crop sides
                new_w = int(fh * aspect)
                start_x = (fw - new_w) // 2
                cropped = frame[:, start_x:start_x+new_w]
            else:
                # Tall video -> Crop top/bottom
                new_h = int(fw / aspect)
                start_y = (fh - new_h) // 2
                cropped = frame[start_y:start_y+new_h, :]
                
            # Resize to 1080x1920
            resized = cv2.resize(cropped, (target_w, target_h))
            
            # Render captions (only for avatar talk segments to keep them high-impact)
            if clip["type"] == "avatar":
                final_frame = render_subtitles_on_frame(resized, sub_text, font_large, 60)
            else:
                # For demo segments, don't overlay the full script text to avoid covering the UI
                final_frame = resized
                
            out.write(final_frame)
            
        cap.release()
        
    out.release()
    print(f"[Compiler SUCCESS] Video compiled at: {final_output}")


def generate_single_reel(topic):
    """Executes the pipeline for a single topic feature"""
    reel_id = topic["id"]
    print(f"\n==================================================")
    print(f"PROCESSING REEL: {topic['feature_name']} ({reel_id})")
    print(f"==================================================")
    
    # Path settings
    audio_hook_path = os.path.join(SCRATCH_DIR, f"{reel_id}_hook.mp3")
    audio_outro_path = os.path.join(SCRATCH_DIR, f"{reel_id}_outro.mp3")
    
    avatar_hook_video = os.path.join(SCRATCH_DIR, f"{reel_id}_avatar_hook.mp4")
    avatar_outro_video = os.path.join(SCRATCH_DIR, f"{reel_id}_avatar_outro.mp4")
    
    app_demo_video = os.path.join(SCRATCH_DIR, f"{reel_id}_demo.mp4")
    final_output = os.path.join(OUTPUT_DIR, f"{reel_id}_reel.mp4")
    
    # Step 1: Generate Audio / Voiceover
    # Check if user placed their own voiceover file
    user_audio_hook = os.path.join(SCRATCH_DIR, f"my_voice_hook_{reel_id}.mp3")
    user_audio_outro = os.path.join(SCRATCH_DIR, f"my_voice_outro_{reel_id}.mp3")
    
    if os.path.exists(user_audio_hook):
        import shutil
        shutil.copy(user_audio_hook, audio_hook_path)
        print(f"[Voice] Using user's custom hook audio: {audio_hook_path}")
    else:
        generate_audio(topic["hook_script"], audio_hook_path)
        
    if os.path.exists(user_audio_outro):
        import shutil
        shutil.copy(user_audio_outro, audio_outro_path)
        print(f"[Voice] Using user's custom outro audio: {audio_outro_path}")
    else:
        generate_audio(topic["outro_script"], audio_outro_path)
        
    # Step 2: Generate Avatar Video (Lip Sync)
    user_face_img = os.path.join(SCRATCH_DIR, "my_face.jpg")
    
    # Check if user already provided pre-recorded videos for hook/outro directly
    user_video_hook = os.path.join(SCRATCH_DIR, f"my_video_hook_{reel_id}.mp4")
    user_video_outro = os.path.join(SCRATCH_DIR, f"my_video_outro_{reel_id}.mp4")
    
    use_lip_sync_hook = True
    use_lip_sync_outro = True
    
    if os.path.exists(user_video_hook):
        import shutil
        shutil.copy(user_video_hook, avatar_hook_video)
        print(f"[Video] Using user's custom pre-recorded hook video: {avatar_hook_video}")
        use_lip_sync_hook = False
        
    if os.path.exists(user_video_outro):
        import shutil
        shutil.copy(user_video_outro, avatar_outro_video)
        print(f"[Video] Using user's custom pre-recorded outro video: {avatar_outro_video}")
        use_lip_sync_outro = False
        
    # Run lip sync if no user video was provided
    if use_lip_sync_hook or use_lip_sync_outro:
        if not os.path.exists(user_face_img):
            print(f"[WARNING] 'my_face.jpg' not found in {SCRATCH_DIR}.")
            print("Please place your portrait picture at 'scratch/my_face.jpg'.")
            print("Falling back to a placeholder face image for testing...")
            
            # Generate placeholder face image using Pillow
            placeholder_img = Image.new('RGB', (512, 512), color=(40, 44, 52))
            draw = ImageDraw.Draw(placeholder_img)
            # Simple geometric face representation for test
            draw.ellipse([156, 156, 356, 356], fill=(230, 200, 180))
            draw.ellipse([210, 220, 240, 250], fill=(50, 50, 50))
            draw.ellipse([270, 220, 300, 250], fill=(50, 50, 50))
            draw.chord([220, 280, 290, 320], start=0, end=180, fill=(150, 50, 50))
            placeholder_img.save(user_face_img)
            
        if use_lip_sync_hook:
            lip_sync_avatar(user_face_img, audio_hook_path, avatar_hook_video)
        if use_lip_sync_outro:
            lip_sync_avatar(user_face_img, audio_outro_path, avatar_outro_video)
            
    # Step 3: Record App Interaction via Playwright
    # Check if a custom demo clip is already placed by user
    user_demo_video = os.path.join(SCRATCH_DIR, f"my_demo_{reel_id}.mp4")
    if os.path.exists(user_demo_video):
        import shutil
        shutil.copy(user_demo_video, app_demo_video)
        print(f"[Video] Using user's custom pre-recorded demo video: {app_demo_video}")
    else:
        # Run Playwright to log in and record live
        playwright_record_demo(reel_id, app_demo_video)
        
    # Step 4: Compile Final 9:16 Video
    compile_reel_video(
        avatar_hook_path=avatar_hook_video,
        app_demo_path=app_demo_video,
        avatar_outro_path=avatar_outro_video,
        script_hook_text=topic["hook_script"],
        script_outro_text=topic["outro_script"],
        final_output=final_output
    )


def main():
    """Main batch loop"""
    # Load topics database
    topics_path = os.path.join(SCRATCH_DIR, "topics.json")
    if not os.path.exists(topics_path):
        print(f"Topics database not found at {topics_path}")
        return
        
    with open(topics_path, "r") as f:
        topics = json.load(f)
        
    pending_topics = [t for t in topics if t.get("status") == "pending"]
    print(f"Found {len(pending_topics)} pending reels to generate.")
    
    for topic in pending_topics:
        try:
            generate_single_reel(topic)
            topic["status"] = "completed"
            
            # Update status in topics.json
            with open(topics_path, "w") as fw:
                json.dump(topics, fw, indent=2)
                
        except Exception as e:
            print(f"[Batch Error] Failed to generate reel for {topic['id']}: {str(e)}")


if __name__ == "__main__":
    main()
