# Builds RepoRally logo assets from the supplied lockup image.
# usage: python3 scripts/make_logos.py . design/reporally-logo-source.webp  (needs Pillow + numpy)
import sys, os
import numpy as np
from PIL import Image

repo, src = sys.argv[1:3]
out = lambda p: os.path.join(repo, "public", p)
DARK = (0x13, 0x0E, 0x29)  # tailwind brand-dark

img = np.asarray(Image.open(src).convert("RGB")).astype(np.float32)
H, W, _ = img.shape
bg = np.mean([img[5, 5], img[5, W - 6], img[H - 6, 5], img[H - 6, W - 6]], axis=0)
print("bg", bg.round(), "size", W, H)

def unmatte(white_navy):
    d = np.linalg.norm(img - bg, axis=2)
    a = np.clip((d - 10) / 70, 0, 1)
    safe = np.where(a > 0, a, 1)[..., None]
    f = np.clip((img - (1 - a[..., None]) * bg) / safe, 0, 255)
    if white_navy:
        navy = (f[..., 0] < 80) & (f[..., 1] < 80) & (f[..., 2] < 130)
        f[navy] = 255
    rgba = np.dstack([f, a * 255]).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")

light_t = unmatte(False)
dark_t = unmatte(True)
lock = light_t.getbbox(alpha_only=True)
mark_region = light_t.crop((lock[0], 0, int(W * 0.32), H))
mb = mark_region.getbbox(alpha_only=True)
mark = (lock[0] + mb[0], mb[1], lock[0] + mb[2], mb[3])
print("lockup", lock, "mark", mark)

def fit(im, width):
    return im.resize((width, round(im.height * width / im.width)), Image.LANCZOS)

def lockup(t, bg_color, path, cw=2170, ch=725, width=1700):
    logo = fit(t.crop(lock), width)
    canvas = Image.new("RGBA", (cw, ch), bg_color)
    canvas.alpha_composite(logo, ((cw - logo.width) // 2, (ch - logo.height) // 2))
    return canvas

light_bg = tuple(int(round(c)) for c in bg) + (255,)
lockup(light_t, light_bg, None).save(out("logo/header-logo.png"))
lockup(dark_t, DARK + (255,), None).save(out("logo/footer-logo.png"))

mark_png = light_t.crop(mark)

def square(size, pad, bg_color):
    inner = round(size * (1 - 2 * pad))
    m = mark_png.copy()
    m.thumbnail((inner, inner), Image.LANCZOS)
    canvas = Image.new("RGBA", (size, size), bg_color)
    canvas.alpha_composite(m, ((size - m.width) // 2, (size - m.height) // 2))
    return canvas

clear = (0, 0, 0, 0)
square(900, 0.04, clear).save(out("logo/mark-logo.png"))
square(512, 0.12, light_bg).save(out("icon.png"))
square(180, 0.14, light_bg).save(out("apple-icon.png"))
square(180, 0.14, light_bg).save(out("apple-touch-icon.png"))
square(256, 0.04, clear).save(out("favicon.ico"), sizes=[(16, 16), (32, 32), (48, 48)])

og = lockup(dark_t, DARK + (255,), None, cw=1200, ch=630, width=900).convert("RGB")
og.save(out("og-image.png"))
og.save(out("og-image.jpg"), quality=90)
print("done")

# Transparent light-on-dark lockup for dark surfaces (OG cards)
fit(dark_t.crop(lock), 720).save(out("logo/lockup-on-dark.png"))
