import os
from PIL import Image, ImageDraw

os.makedirs('frontend/assets', exist_ok=True)
img = Image.new('RGBA', (1024, 1024), color=(247, 241, 232, 255))
d = ImageDraw.Draw(img)
d.text((512, 512), "Duro Tracker", fill=(0, 0, 0), anchor="mm")
img.save('frontend/assets/Logo.png')
print("Created Logo.png")
