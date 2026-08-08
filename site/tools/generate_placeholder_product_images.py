from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "products"
SIZE = (1600, 2000)


PRODUCTS = [
    {
        "id": "cashmere-crewneck-sweater",
        "kind": "sweater",
        "body": ("#f6f0e8", "#d8cab8"),
        "accent": "#b9a58f",
    },
    {
        "id": "fine-knit-cardigan",
        "kind": "cardigan",
        "body": ("#e9efe7", "#bfd0c2"),
        "accent": "#7f9185",
    },
    {
        "id": "ribbed-turtleneck-sweater",
        "kind": "turtleneck",
        "body": ("#ece9e3", "#8d9492"),
        "accent": "#606866",
    },
    {
        "id": "cashmere-winter-scarf",
        "kind": "scarf",
        "body": ("#efe5d8", "#ad9178"),
        "accent": "#7e6654",
    },
    {
        "id": "ribbed-knit-gloves",
        "kind": "gloves",
        "body": ("#e8e2d9", "#8b7768"),
        "accent": "#6c5a4d",
    },
]


VARIANTS = [
    {"suffix": "01", "bg": ("#f7f8f5", "#e4ebe7"), "seed": 11, "rotation": -3, "scale": 1.00, "x": 0.0, "y": 0.0},
    {"suffix": "02", "bg": ("#f8f5f0", "#e7ddd2"), "seed": 23, "rotation": 2, "scale": 0.96, "x": -0.04, "y": 0.02},
    {"suffix": "03", "bg": ("#f4f7f6", "#dee7e3"), "seed": 37, "rotation": 0, "scale": 1.06, "x": 0.03, "y": -0.03},
    {"suffix": "04", "bg": ("#f7f6f2", "#e7e1d7"), "seed": 41, "rotation": -5, "scale": 0.92, "x": -0.02, "y": 0.05},
    {"suffix": "05", "bg": ("#f6f7f4", "#dfe8e1"), "seed": 53, "rotation": 4, "scale": 1.02, "x": 0.02, "y": 0.00},
]


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def mix(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def make_linear_gradient(size: tuple[int, int], top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    w, h = size
    img = Image.new("RGB", size)
    px = img.load()
    for y in range(h):
        t = y / max(h - 1, 1)
        row = mix(top, bottom, t)
        for x in range(w):
            px[x, y] = row
    return img


def gradient_background(size: tuple[int, int], top: str, bottom: str, seed: int) -> Image.Image:
    w, h = size
    top_rgb = hex_to_rgb(top)
    bottom_rgb = hex_to_rgb(bottom)
    img = make_linear_gradient(size, top_rgb, bottom_rgb).convert("RGBA")
    rng = random.Random(seed)

    overlay = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)
    for _ in range(24):
        cx = rng.randint(-100, w + 100)
        cy = rng.randint(-100, h + 100)
        radius = rng.randint(220, 520)
        alpha = rng.randint(7, 18)
        color = rng.choice([(255, 255, 255, alpha), (195, 205, 199, alpha), (227, 217, 207, alpha)])
        draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=color)
    overlay = overlay.filter(ImageFilter.GaussianBlur(60))
    img = Image.alpha_composite(img.convert("RGBA"), overlay)

    vignette = Image.new("L", size, 0)
    vdraw = ImageDraw.Draw(vignette)
    margin = int(min(w, h) * 0.06)
    vdraw.rectangle((margin, margin, w - margin, h - margin), fill=255)
    vignette = vignette.filter(ImageFilter.GaussianBlur(120))
    dark = Image.new("RGBA", size, (30, 34, 33, 50))
    img = Image.composite(dark, img, ImageChops.invert(vignette))
    return img


def add_grain(image: Image.Image, seed: int, amount: int = 14) -> Image.Image:
    rng = random.Random(seed)
    noise = Image.new("L", image.size)
    px = noise.load()
    step = 4
    for y in range(0, image.size[1], step):
        for x in range(0, image.size[0], step):
            px[x, y] = max(0, min(255, 128 + rng.randint(-amount, amount)))
    noise = noise.filter(ImageFilter.GaussianBlur(0.35))
    if step > 1:
        noise = noise.resize(image.size, Image.Resampling.BILINEAR)
    tint = Image.merge("RGBA", (noise, noise, noise, Image.new("L", image.size, 30)))
    return Image.alpha_composite(image, tint)


def shadow_layer(size: tuple[int, int], y: int, scale: float = 1.0, blur: int = 80, alpha: int = 85) -> Image.Image:
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    w, h = size
    draw.ellipse((w * 0.24, y - 40, w * (0.76 * scale), y + 95), fill=(20, 20, 20, alpha))
    return layer.filter(ImageFilter.GaussianBlur(blur))


def fabric_texture(size: tuple[int, int], color: tuple[int, int, int], mask: Image.Image, seed: int, mode: str = "sweater") -> Image.Image:
    w, h = size
    layer = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    rng = random.Random(seed)

    if mode in {"sweater", "cardigan", "turtleneck"}:
        step = 24 if mode != "turtleneck" else 20
        for x in range(int(w * 0.2), int(w * 0.8), step):
            offset = int(math.sin((x + seed) * 0.03) * 6)
            draw.line((x, int(h * 0.12), x + offset, int(h * 0.86)), fill=tuple(max(0, min(255, c - 16)) for c in color) + (42,), width=2)
        for y in range(int(h * 0.18), int(h * 0.84), 20):
            draw.line((int(w * 0.26), y, int(w * 0.74), y), fill=tuple(max(0, min(255, c + 10)) for c in color) + (20,), width=1)
    elif mode == "scarf":
        for y in range(int(h * 0.28), int(h * 0.74), 16):
            draw.line((int(w * 0.18), y, int(w * 0.82), y), fill=tuple(max(0, min(255, c - 10)) for c in color) + (38,), width=2)
        for _ in range(80):
            x = rng.randint(int(w * 0.2), int(w * 0.8))
            y = rng.randint(int(h * 0.22), int(h * 0.78))
            draw.line((x, y, x + rng.randint(-16, 16), y + rng.randint(-6, 6)), fill=tuple(max(0, min(255, c + 14)) for c in color) + (24,), width=1)
    else:
        for x in range(int(w * 0.34), int(w * 0.66), 14):
            draw.line((x, int(h * 0.20), x, int(h * 0.86)), fill=tuple(max(0, min(255, c - 12)) for c in color) + (34,), width=2)
        for y in range(int(h * 0.30), int(h * 0.78), 18):
            draw.line((int(w * 0.34), y, int(w * 0.66), y), fill=tuple(max(0, min(255, c + 10)) for c in color) + (18,), width=1)

    layer = layer.filter(ImageFilter.GaussianBlur(0.6))
    return Image.composite(layer, Image.new("RGBA", size, (0, 0, 0, 0)), mask)


def vertical_gradient_fill(size: tuple[int, int], top: tuple[int, int, int], bottom: tuple[int, int, int]) -> Image.Image:
    return make_linear_gradient(size, top, bottom).convert("RGBA")


def garment_mask(kind: str, size: tuple[int, int]) -> Image.Image:
    w, h = size
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)

    if kind in {"sweater", "cardigan", "turtleneck"}:
        draw.rounded_rectangle((w * 0.35, h * 0.22, w * 0.65, h * 0.82), radius=100, fill=255)
        draw.polygon([(w * 0.35, h * 0.27), (w * 0.23, h * 0.40), (w * 0.30, h * 0.52), (w * 0.35, h * 0.47)], fill=255)
        draw.polygon([(w * 0.65, h * 0.27), (w * 0.77, h * 0.40), (w * 0.70, h * 0.52), (w * 0.65, h * 0.47)], fill=255)
        draw.ellipse((w * 0.43, h * 0.11, w * 0.57, h * 0.33), fill=255)
        if kind == "turtleneck":
            draw.rounded_rectangle((w * 0.44, h * 0.12, w * 0.56, h * 0.36), radius=30, fill=255)
        if kind == "cardigan":
            draw.rectangle((w * 0.483, h * 0.23, w * 0.517, h * 0.81), fill=0)
    elif kind == "scarf":
        draw.rounded_rectangle((w * 0.18, h * 0.34, w * 0.82, h * 0.56), radius=120, fill=255)
        draw.rounded_rectangle((w * 0.38, h * 0.44, w * 0.70, h * 0.67), radius=115, fill=255)
        draw.rounded_rectangle((w * 0.22, h * 0.58, w * 0.54, h * 0.79), radius=115, fill=255)
    elif kind == "gloves":
        draw.rounded_rectangle((w * 0.28, h * 0.28, w * 0.49, h * 0.70), radius=65, fill=255)
        draw.rounded_rectangle((w * 0.51, h * 0.30, w * 0.72, h * 0.72), radius=65, fill=255)
        for idx, x0 in enumerate((0.29, 0.325, 0.36, 0.395)):
            draw.rounded_rectangle((w * x0, h * (0.19 + idx * 0.005), w * (x0 + 0.055), h * 0.33), radius=24, fill=255)
        for idx, x0 in enumerate((0.53, 0.565, 0.60, 0.635)):
            draw.rounded_rectangle((w * x0, h * (0.20 + idx * 0.005), w * (x0 + 0.055), h * 0.34), radius=24, fill=255)
    return mask.filter(ImageFilter.GaussianBlur(1.0))


def garment_base_image(kind: str, body: tuple[str, str], accent: str, size: tuple[int, int], seed: int) -> Image.Image:
    w, h = size
    top = hex_to_rgb(body[0])
    bottom = hex_to_rgb(body[1])
    accent_rgb = hex_to_rgb(accent)
    mask = garment_mask(kind, size)
    garment = vertical_gradient_fill(size, top, bottom)
    garment.putalpha(mask)

    shadow = Image.new("RGBA", size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    if kind in {"sweater", "cardigan", "turtleneck"}:
        draw.ellipse((w * 0.36, h * 0.20, w * 0.64, h * 0.86), fill=(0, 0, 0, 55))
    elif kind == "scarf":
        draw.ellipse((w * 0.18, h * 0.34, w * 0.82, h * 0.74), fill=(0, 0, 0, 45))
    else:
        draw.ellipse((w * 0.28, h * 0.26, w * 0.72, h * 0.78), fill=(0, 0, 0, 50))
    shadow = shadow.filter(ImageFilter.GaussianBlur(36))

    layer = Image.alpha_composite(shadow, garment)
    texture = fabric_texture(size, accent_rgb, mask, seed, mode=kind)
    layer = Image.alpha_composite(layer, texture)
    draw = ImageDraw.Draw(layer)

    if kind == "sweater":
        draw.line((w * 0.50, h * 0.23, w * 0.50, h * 0.80), fill=(255, 255, 255, 45), width=3)
        draw.arc((w * 0.42, h * 0.12, w * 0.58, h * 0.31), start=200, end=-20, fill=(255, 255, 255, 110), width=4)
        draw.line((w * 0.35, h * 0.49, w * 0.28, h * 0.54), fill=(255, 255, 255, 40), width=3)
        draw.line((w * 0.65, h * 0.49, w * 0.72, h * 0.54), fill=(255, 255, 255, 40), width=3)
    elif kind == "cardigan":
        draw.line((w * 0.50, h * 0.23, w * 0.50, h * 0.81), fill=(255, 255, 255, 28), width=4)
        for yy in (0.34, 0.43, 0.52, 0.61):
            draw.ellipse((w * 0.487, h * yy, w * 0.513, h * (yy + 0.03)), fill=(110, 120, 112, 210))
        draw.arc((w * 0.41, h * 0.14, w * 0.59, h * 0.30), start=205, end=-25, fill=(255, 255, 255, 90), width=4)
    elif kind == "turtleneck":
        draw.rounded_rectangle((w * 0.43, h * 0.10, w * 0.57, h * 0.34), radius=34, outline=(255, 255, 255, 120), width=3)
        draw.line((w * 0.50, h * 0.12, w * 0.50, h * 0.79), fill=(255, 255, 255, 28), width=4)
        draw.line((w * 0.36, h * 0.44, w * 0.64, h * 0.44), fill=(255, 255, 255, 28), width=2)
    elif kind == "scarf":
        draw.arc((w * 0.18, h * 0.30, w * 0.82, h * 0.64), start=10, end=182, fill=(255, 255, 255, 80), width=16)
        draw.arc((w * 0.22, h * 0.50, w * 0.78, h * 0.84), start=190, end=356, fill=(80, 62, 52, 82), width=16)
        draw.line((w * 0.22, h * 0.69, w * 0.17, h * 0.82), fill=tuple(accent_rgb) + (170,), width=8)
        draw.line((w * 0.78, h * 0.71, w * 0.83, h * 0.84), fill=tuple(accent_rgb) + (170,), width=8)
    else:
        draw.line((w * 0.37, h * 0.24, w * 0.37, h * 0.67), fill=(255, 255, 255, 60), width=3)
        draw.line((w * 0.63, h * 0.25, w * 0.63, h * 0.69), fill=(255, 255, 255, 60), width=3)
        draw.rounded_rectangle((w * 0.28, h * 0.26, w * 0.49, h * 0.69), radius=58, outline=(255, 255, 255, 80), width=2)
        draw.rounded_rectangle((w * 0.51, h * 0.28, w * 0.72, h * 0.71), radius=58, outline=(255, 255, 255, 80), width=2)

    highlight = Image.new("RGBA", size, (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(highlight)
    hdraw.ellipse((w * 0.18, h * 0.06, w * 0.78, h * 0.58), fill=(255, 255, 255, 50))
    highlight = Image.composite(highlight.filter(ImageFilter.GaussianBlur(20)), Image.new("RGBA", size, (0, 0, 0, 0)), mask)
    layer = Image.alpha_composite(layer, highlight)
    return layer


def compose_product(kind: str, body: tuple[str, str], accent: str, bg: tuple[str, str], seed: int, rotation: float, scale: float, shift: tuple[float, float]) -> Image.Image:
    bg_img = gradient_background(SIZE, bg[0], bg[1], seed)
    bg_img = add_grain(bg_img, seed, amount=8)
    bg_rgba = bg_img.convert("RGBA")
    bg_draw = ImageDraw.Draw(bg_rgba)
    bg_draw.rounded_rectangle((120, 120, SIZE[0] - 120, SIZE[1] - 120), radius=46, outline=(255, 255, 255, 120), width=2)
    bg_draw.rounded_rectangle((130, 130, SIZE[0] - 130, SIZE[1] - 130), radius=40, outline=(50, 55, 52, 20), width=1)

    shadow = shadow_layer(SIZE, 1280, scale=scale, blur=74, alpha=70)
    bg_rgba = Image.alpha_composite(bg_rgba, shadow)

    garment = garment_base_image(kind, body, accent, (1000, 1200), seed)
    garment = garment.resize((int(garment.width * scale), int(garment.height * scale)), Image.Resampling.LANCZOS)
    garment = garment.rotate(rotation, resample=Image.Resampling.BICUBIC, expand=True)

    canvas = bg_rgba.copy()
    gx = int((SIZE[0] - garment.width) / 2 + shift[0] * SIZE[0])
    gy = int(150 + shift[1] * SIZE[1])
    canvas.alpha_composite(garment, (gx, gy))

    accent_layer = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    adraw = ImageDraw.Draw(accent_layer)
    adraw.ellipse((220, 220, 380, 340), fill=(255, 255, 255, 58))
    adraw.ellipse((1180, 220, 1380, 420), fill=(255, 255, 255, 32))
    adraw.rectangle((0, 0, SIZE[0], 58), fill=(255, 255, 255, 18))
    canvas = Image.alpha_composite(canvas, accent_layer.filter(ImageFilter.GaussianBlur(30)))

    return canvas.convert("RGB")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for product in PRODUCTS:
        for variant in VARIANTS:
            image = compose_product(
                product["kind"],
                product["body"],
                product["accent"],
                variant["bg"],
                variant["seed"],
                variant["rotation"],
                variant["scale"],
                (variant["x"], variant["y"]),
            )
            path = OUT / f'{product["id"]}-{variant["suffix"]}.png'
            image.save(path, quality=96)
            print(path)


if __name__ == "__main__":
    main()
