import os
import glob

files = glob.glob('frontend/src/app/**/*.tsx', recursive=True)
for f in files:
    with open(f, 'r', encoding='utf-8') as file:
        content = file.read()
        
    new_content = content.replace(
        'text-stone-300',
        'text-gray-300'
    ).replace(
        '<Link href="/" className="flex items-center gap-2">',
        '<Link href="/" className="flex items-center gap-2 text-white hover:text-white/90">'
    )
    
    if new_content != content:
        with open(f, 'w', encoding='utf-8') as file:
            file.write(new_content)
        print(f"Updated {f}")
