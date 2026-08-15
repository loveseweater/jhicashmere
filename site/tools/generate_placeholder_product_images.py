from __future__ import annotations

import math
import random
from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "products"
SIZE = (1600, 2000)


PRODUCTS = [
    {"id": "100-cashmere-crewneck-sweater", "kind": "crewneck", "body": ("#f5efe6", "#d5c5b4"), "accent": "#a48f7c"},
    {"id": "100-cashmere-v-neck-sweater", "kind": "vneck", "body": ("#d9d2ca", "#9b9287"), "accent": "#6f675f"},
    {"id": "100-cashmere-cardigan", "kind": "cardigan", "body": ("#e8eee5", "#b9c8bb"), "accent": "#74887b"},
    {"id": "100-cashmere-turtleneck-sweater", "kind": "turtleneck", "body": ("#2c302f", "#858a86"), "accent": "#f0eee7"},
    {"id": "100-cashmere-wrap-scarf", "kind": "scarf", "body": ("#efe1cf", "#ad896d"), "accent": "#80624e"},
    {"id": "100-cashmere-ribbed-beanie", "kind": "beanie", "body": ("#ede7dd", "#aa9d8e"), "accent": "#74685d"},
    {"id": "100-cashmere-knit-gloves", "kind": "gloves", "body": ("#ded7cf", "#8c7c6d"), "accent": "#62564b"},
    {"id": "100-cashmere-winter-gift-set", "kind": "gift-set", "body": ("#f0e8dd", "#b99d82"), "accent": "#7a5d49"},
]


VARIANTS = [
    {"suffix": "01", "bg": "#f8f8f5", "seed": 11, "rotation": -1.5, "scale": 1.06, "x": 0.00, "y": 0.00},
    {"suffix": "02", "bg": "#f5f0ea", "seed": 23, "rotation": 1.2, "scale": 1.00, "x": -0.03, "y": 0.02},
    {"suffix": "03", "bg": "#eef3ef", "seed": 37, "rotation": 0.0, "scale": 1.10, "x": 0.02, "y": -0.02},
    {"suffix": "04", "bg": "#f3f2ee", "seed": 41, "rotation": -2.4, "scale": 0.98, "x": 0.02, "y": 0.04},
    {"suffix": "05", "bg": "#f7f4ee", "seed": 53, "rotation": 2.0, "scale": 1.04, "x": -0.01, "y": 0.00},
]


def hex_to_rgb(value: str) -> tuple[int, int, int]:
    value = value.lstrip("#")
    return tuple(int(value[i : i + 2], 16) for i in (0, 2, 4))


def blend(a: tuple[int, int, int], b: tuple[int, int, int], t: float) -> tuple[int, int, int]:
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))


def solid_studio_bg(color: str, seed: int) -> Image.Image:
    rng = random.Random(seed)
    base = hex_to_rgb(color)
    img = Image.new("RGB", SIZE, base).convert("RGBA")
    draw = ImageDraw.Draw(img)
    for _ in range(18):
        cx = rng.randint(-80, SIZE[0] + 80)
        cy = rng.randint(-80, SIZE[1] + 80)
        radius = rng.randint(180, 440)
        tint = blend(base, rng.choice([(255, 255, 255), (205, 216, 207), (224, 211, 196)]), 0.62)
        draw.ellipse((cx - radius, cy - radius, cx + radius, cy + radius), fill=tint + (18,))
    return img.filter(ImageFilter.GaussianBlur(42))


def knit_lines(mask: Image.Image, accent: str, kind: str, seed: int) -> Image.Image:
    rng = random.Random(seed)
    layer = Image.new("RGBA", mask.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    accent_rgb = hex_to_rgb(accent)
    dark = blend(accent_rgb, (0, 0, 0), 0.18)
    light = blend(accent_rgb, (255, 255, 255), 0.45)
    w, h = mask.size

    if kind in {"crewneck", "vneck", "cardigan", "turtleneck", "beanie", "gloves"}:
        step = 18 if kind in {"turtleneck", "beanie", "gloves"} else 24
        for x in range(80, w - 80, step):
            wave = math.sin((x + seed) * 0.024) * 5
            draw.line((x, 60, x + wave, h - 70), fill=dark + (48,), width=2)
        for x in range(90, w - 90, step):
            draw.line((x, 80, x, h - 80), fill=light + (22,), width=1)

    if kind in {"scarf", "gift-set"}:
        for y in range(100, h - 100, 18):
            draw.line((70, y, w - 70, y + rng.randint(-2, 2)), fill=dark + (42,), width=2)
        for x in range(90, w - 90, 42):
            draw.line((x, 90, x + rng.randint(-6, 6), h - 90), fill=light + (22,), width=1)

    fuzz = Image.new("RGBA", mask.size, (0, 0, 0, 0))
    fdraw = ImageDraw.Draw(fuzz)
    for _ in range(450):
        x = rng.randint(70, w - 70)
        y = rng.randint(70, h - 70)
        length = rng.randint(4, 16)
        fdraw.line((x, y, x + rng.randint(-length, length), y + rng.randint(-3, 3)), fill=light + (30,), width=1)

    texture = Image.alpha_composite(layer, fuzz.filter(ImageFilter.GaussianBlur(0.25)))
    texture.putalpha(Image.composite(texture.getchannel("A"), Image.new("L", mask.size, 0), mask))
    return texture


def gradient_fill(size: tuple[int, int], top: str, bottom: str, mask: Image.Image) -> Image.Image:
    top_rgb = hex_to_rgb(top)
    bottom_rgb = hex_to_rgb(bottom)
    img = Image.new("RGBA", size)
    px = img.load()
    w, h = size
    for y in range(h):
        row = blend(top_rgb, bottom_rgb, y / max(h - 1, 1))
        for x in range(w):
            px[x, y] = row + (255,)
    img.putalpha(mask)
    return img


def rounded_mask(size: tuple[int, int], radius: int, box: tuple[float, float, float, float]) -> Image.Image:
    w, h = size
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rounded_rectangle((w * box[0], h * box[1], w * box[2], h * box[3]), radius=radius, fill=255)
    return mask


def clothing_mask(kind: str, size: tuple[int, int]) -> Image.Image:
    w, h = size
    mask = Image.new("L", size, 0)
    draw = ImageDraw.Draw(mask)

    if kind in {"crewneck", "vneck", "cardigan", "turtleneck"}:
        draw.rounded_rectangle((w * 0.30, h * 0.24, w * 0.70, h * 0.84), radius=82, fill=255)
        draw.polygon([(w * 0.32, h * 0.28), (w * 0.12, h * 0.42), (w * 0.24, h * 0.65), (w * 0.34, h * 0.52)], fill=255)
        draw.polygon([(w * 0.68, h * 0.28), (w * 0.88, h * 0.42), (w * 0.76, h * 0.65), (w * 0.66, h * 0.52)], fill=255)
        if kind == "turtleneck":
            draw.rounded_rectangle((w * 0.42, h * 0.10, w * 0.58, h * 0.34), radius=30, fill=255)
            draw.ellipse((w * 0.445, h * 0.12, w * 0.555, h * 0.25), fill=0)
        else:
            draw.ellipse((w * 0.37, h * 0.17, w * 0.63, h * 0.34), fill=0)
        if kind == "vneck":
            draw.polygon([(w * 0.39, h * 0.20), (w * 0.61, h * 0.20), (w * 0.50, h * 0.39)], fill=0)
        if kind == "cardigan":
            draw.rectangle((w * 0.489, h * 0.23, w * 0.511, h * 0.83), fill=0)
    elif kind == "scarf":
        draw.rounded_rectangle((w * 0.12, h * 0.31, w * 0.88, h * 0.54), radius=110, fill=255)
        draw.rounded_rectangle((w * 0.30, h * 0.47, w * 0.73, h * 0.78), radius=92, fill=255)
        draw.rounded_rectangle((w * 0.18, h * 0.53, w * 0.49, h * 0.82), radius=86, fill=255)
    elif kind == "beanie":
        draw.pieslice((w * 0.18, h * 0.10, w * 0.82, h * 0.72), start=180, end=360, fill=255)
        draw.rounded_rectangle((w * 0.17, h * 0.42, w * 0.83, h * 0.64), radius=34, fill=255)
        draw.ellipse((w * 0.42, h * 0.05, w * 0.58, h * 0.18), fill=255)
    elif kind == "gloves":
        draw.rounded_rectangle((w * 0.19, h * 0.29, w * 0.45, h * 0.80), radius=70, fill=255)
        draw.rounded_rectangle((w * 0.55, h * 0.30, w * 0.81, h * 0.81), radius=70, fill=255)
        for idx, x0 in enumerate((0.19, 0.24, 0.29, 0.34)):
            draw.rounded_rectangle((w * x0, h * (0.13 + idx * 0.012), w * (x0 + 0.07), h * 0.36), radius=24, fill=255)
        for idx, x0 in enumerate((0.56, 0.61, 0.66, 0.71)):
            draw.rounded_rectangle((w * x0, h * (0.14 + idx * 0.012), w * (x0 + 0.07), h * 0.37), radius=24, fill=255)
    elif kind == "gift-set":
        scarf = rounded_mask(size, 95, (0.08, 0.46, 0.92, 0.65))
        hat = clothing_mask("beanie", size).resize((int(w * 0.45), int(h * 0.45)), Image.Resampling.LANCZOS)
        glove = clothing_mask("gloves", size).resize((int(w * 0.48), int(h * 0.48)), Image.Resampling.LANCZOS)
        mask.paste(scarf, (0, 0), scarf)
        mask.paste(hat, (int(w * 0.07), int(h * 0.05)), hat)
        mask.paste(glove, (int(w * 0.43), int(h * 0.11)), glove)
    return mask.filter(ImageFilter.GaussianBlur(0.8))


def product_layer(product: dict, size: tuple[int, int], seed: int) -> Image.Image:
    kind = product["kind"]
    mask = clothing_mask(kind, size)
    layer = gradient_fill(size, product["body"][0], product["body"][1], mask)
    layer = Image.alpha_composite(layer, knit_lines(mask, product["accent"], kind, seed))
    draw = ImageDraw.Draw(layer)
    w, h = size
    white = (255, 255, 255, 88)
    dark = hex_to_rgb(product["accent"]) + (150,)

    if kind == "crewneck":
        draw.arc((w * 0.37, h * 0.17, w * 0.63, h * 0.34), 0, 180, fill=white, width=7)
        draw.line((w * 0.31, h * 0.82, w * 0.69, h * 0.82), fill=white, width=4)
    elif kind == "vneck":
        draw.line((w * 0.40, h * 0.19, w * 0.50, h * 0.34), fill=white, width=7)
        draw.line((w * 0.60, h * 0.19, w * 0.50, h * 0.34), fill=white, width=7)
    elif kind == "cardigan":
        draw.line((w * 0.50, h * 0.23, w * 0.50, h * 0.83), fill=white, width=5)
        for y in (0.35, 0.44, 0.53, 0.62, 0.71):
            draw.ellipse((w * 0.485, h * y, w * 0.515, h * (y + 0.026)), fill=dark)
    elif kind == "turtleneck":
        draw.rounded_rectangle((w * 0.42, h * 0.08, w * 0.58, h * 0.32), radius=28, outline=white, width=5)
        draw.line((w * 0.34, h * 0.84, w * 0.66, h * 0.84), fill=white, width=4)
    elif kind == "scarf":
        for x in (0.18, 0.24, 0.76, 0.82):
            draw.line((w * x, h * 0.62, w * (x - 0.035), h * 0.86), fill=dark, width=8)
    elif kind == "beanie":
        draw.rounded_rectangle((w * 0.17, h * 0.42, w * 0.83, h * 0.64), radius=34, outline=white, width=5)
    elif kind == "gloves":
        draw.rounded_rectangle((w * 0.19, h * 0.29, w * 0.45, h * 0.80), radius=70, outline=white, width=4)
        draw.rounded_rectangle((w * 0.55, h * 0.30, w * 0.81, h * 0.81), radius=70, outline=white, width=4)

    highlight = Image.new("RGBA", size, (0, 0, 0, 0))
    hdraw = ImageDraw.Draw(highlight)
    hdraw.ellipse((w * 0.10, h * 0.02, w * 0.72, h * 0.48), fill=(255, 255, 255, 48))
    highlight.putalpha(Image.composite(highlight.getchannel("A"), Image.new("L", size, 0), mask))
    return Image.alpha_composite(layer, highlight.filter(ImageFilter.GaussianBlur(16)))


def compose(product: dict, variant: dict) -> Image.Image:
    bg = solid_studio_bg(variant["bg"], variant["seed"])
    shadow = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(shadow)
    draw.ellipse((SIZE[0] * 0.18, SIZE[1] * 0.75, SIZE[0] * 0.82, SIZE[1] * 0.88), fill=(30, 28, 25, 58))
    bg = Image.alpha_composite(bg, shadow.filter(ImageFilter.GaussianBlur(68)))

    base_size = (1160, 1420)
    if product["kind"] in {"scarf", "gift-set"}:
        base_size = (1260, 1320)
    if product["kind"] in {"beanie", "gloves"}:
        base_size = (1120, 1180)
    layer = product_layer(product, base_size, variant["seed"])
    layer = layer.resize((int(layer.width * variant["scale"]), int(layer.height * variant["scale"])), Image.Resampling.LANCZOS)
    layer = layer.rotate(variant["rotation"], Image.Resampling.BICUBIC, expand=True)

    canvas = bg.copy()
    x = int((SIZE[0] - layer.width) / 2 + SIZE[0] * variant["x"])
    y = int((SIZE[1] - layer.height) / 2 - 35 + SIZE[1] * variant["y"])
    canvas.alpha_composite(layer, (x, y))

    label = Image.new("RGBA", SIZE, (0, 0, 0, 0))
    ldraw = ImageDraw.Draw(label)
    ldraw.rounded_rectangle((98, 98, 442, 168), radius=0, fill=(255, 255, 255, 230))
    try:
        font = ImageFont.truetype("arialbd.ttf", 28)
    except OSError:
        font = ImageFont.load_default()
    ldraw.text((126, 121), "100% CASHMERE", fill=(26, 32, 29, 255), font=font)
    canvas = Image.alpha_composite(canvas, label)
    return canvas.convert("RGB")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    for product in PRODUCTS:
        for variant in VARIANTS:
            image = compose(product, variant)
            path = OUT / f'{product["id"]}-{variant["suffix"]}.png'
            image.save(path, quality=96)
            print(path)


if __name__ == "__main__":
    main()
