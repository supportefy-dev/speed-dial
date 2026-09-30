"""Render the extension icons: a 2x2 tile grid on a rounded gradient square."""

from pathlib import Path

from PIL import Image, ImageDraw

MASTER = 512
SIZES = (16, 32, 48, 128)
TOP = (79, 142, 247)
BOTTOM = (160, 108, 240)
TILE_COLOURS = ((255, 255, 255, 255), (255, 255, 255, 215), (255, 255, 255, 215), (255, 255, 255, 255))
OUT = Path(__file__).resolve().parent.parent / "icons"


def gradient(size):
    img = Image.new("RGBA", (size, size))
    draw = ImageDraw.Draw(img)
    for y in range(size):
        t = y / (size - 1)
        colour = tuple(round(a + (b - a) * t) for a, b in zip(TOP, BOTTOM))
        draw.line([(0, y), (size, y)], fill=colour + (255,))
    return img


def master():
    base = gradient(MASTER)
    mask = Image.new("L", (MASTER, MASTER), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, MASTER - 1, MASTER - 1], radius=MASTER * 0.24, fill=255)
    icon = Image.new("RGBA", (MASTER, MASTER), (0, 0, 0, 0))
    icon.paste(base, (0, 0), mask)

    tiles = Image.new("RGBA", (MASTER, MASTER), (0, 0, 0, 0))
    draw = ImageDraw.Draw(tiles)
    pad, gap = MASTER * 0.22, MASTER * 0.08
    cell = (MASTER - 2 * pad - gap) / 2
    for index, colour in enumerate(TILE_COLOURS):
        x = pad + (index % 2) * (cell + gap)
        y = pad + (index // 2) * (cell + gap)
        draw.rounded_rectangle([x, y, x + cell, y + cell], radius=cell * 0.28, fill=colour)
    return Image.alpha_composite(icon, tiles)


def main():
    OUT.mkdir(exist_ok=True)
    art = master()
    for size in SIZES:
        art.resize((size, size), Image.LANCZOS).save(OUT / f"icon{size}.png")


if __name__ == "__main__":
    main()
