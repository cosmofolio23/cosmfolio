import os
try:
    import pypdf
except ImportError:
    os.system("pip install pypdf")
    import pypdf

reader = pypdf.PdfReader("test.pdf")
print("Number of pages:", len(reader.pages))
for i, page in enumerate(reader.pages):
    box = page.mediabox
    width = float(box.width)
    height = float(box.height)
    print(f"Page {i+1} dimensions:")
    print(f"  - MediaBox: {box}")
    # Convert points (1/72 inch) to inches and mm
    width_in = width / 72.0
    height_in = height / 72.0
    width_mm = width_in * 25.4
    height_mm = height_in * 25.4
    print(f"  - Size: {width_in:.2f} x {height_in:.2f} inches ({width_mm:.1f} x {height_mm:.1f} mm)")
