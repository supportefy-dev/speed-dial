"""Build the README artwork that is derived from other sources.

Outputs (in assets/readme/):
  banner-dark-1280x480.png         dark variant of assets/media-pack/source/readme-banner.svg
  how-it-works-light.png           add / organize / open / go pro flow, GitHub light theme
  how-it-works-dark.png            the same diagram for GitHub's dark theme

Usage: python tools/readme-media/build_assets.py [--chrome PATH]
Needs Google Chrome (or Edge) for SVG to PNG rendering; no Python packages.
"""
import argparse
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "readme"
ICONS = OUT / "icons"
BANNER_SOURCE = ROOT / "assets" / "media-pack" / "source" / "readme-banner.svg"

DEFAULT_BROWSERS = [
    Path(os.environ.get("ProgramFiles", "")) / "Google/Chrome/Application/chrome.exe",
    Path(os.environ.get("ProgramFiles(x86)", "")) / "Microsoft/Edge/Application/msedge.exe",
    Path("/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"),
    Path("/usr/bin/google-chrome"),
]

# Light banner color -> dark banner color, one swap per literal hex used in readme-banner.svg.
BANNER_DARK = {
    "#FAFBFD": "#12141C",
    "#EBEDF7": "#1B1E2B",
    "#16191D": "#EDEFF7",
    "#545B66": "#A6ACC2",
    "#4C68A2": "#8FB4FF",
    "#DCE8FF": "#1E2A4A",
    "#EADFFF": "#2A2145",
    "#E9E0F7": "#2A2145",
    "#E5E8EF": "#232733",
    "#2458A8": "#9FC4FF",
    "#624296": "#C9A8FF",
}

THEMES = {
    "light": {"bg": "#FFFFFF", "card": "#F5F7FF", "line": "#E1E5F0", "ink": "#16191D", "muted": "#545B66", "accent": "#4F8EF7"},
    "dark": {"bg": "#0D0F14", "card": "#171A23", "line": "#2A2E3B", "ink": "#EDEFF7", "muted": "#A6ACC2", "accent": "#8FB4FF"},
}

FONT = "Segoe UI,Helvetica,Arial,sans-serif"


def find_browser(explicit):
    candidates = [Path(explicit)] if explicit else DEFAULT_BROWSERS
    for path in candidates:
        if path.is_file():
            return path
    sys.exit("Chrome or Edge not found; pass --chrome PATH")


def render(browser, svg_text, width, height, target, scale):
    with tempfile.TemporaryDirectory() as tmp:
        svg = Path(tmp) / "art.svg"
        svg.write_text(svg_text, encoding="utf-8")
        subprocess.run([
            str(browser), "--headless=new", "--disable-gpu", "--hide-scrollbars",
            f"--user-data-dir={Path(tmp) / 'profile'}", f"--force-device-scale-factor={scale}",
            f"--window-size={width},{height}", f"--screenshot={target}", svg.as_uri(),
        ], check=True, capture_output=True, timeout=60)
    print(f"wrote {target.relative_to(ROOT)}")


def dark_banner():
    svg = BANNER_SOURCE.read_text(encoding="utf-8")
    for light, dark in BANNER_DARK.items():
        svg = svg.replace(light, dark)
    return svg


def icon(name, x, y, size):
    body = (ICONS / f"{name}.svg").read_text(encoding="utf-8")
    inner = re.sub(r"^<svg[^>]*>|</svg>$", "", body.strip())
    return f'<svg x="{x}" y="{y}" width="{size}" height="{size}" viewBox="0 0 48 48">{inner}</svg>'


def diagram(theme):
    t = THEMES[theme]
    steps = [
        ("quick-add", "Add a site", "+ tile, toolbar button, or right-click"),
        ("groups-layouts", "Organize into groups", "Color-coded, drag to reorder"),
        ("open-newtab", "Open from any new tab", "Tabs or Sections layout, your call"),
        ("pro", "Go Pro (optional)", "Unlimited groups, one-time purchase"),
    ]
    card_w, card_h, gap, top = 270, 150, 40, 60
    left = (1280 - (len(steps) * card_w + (len(steps) - 1) * gap)) // 2
    parts = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="300" viewBox="0 0 1280 300">',
        f'<rect width="1280" height="300" fill="{t["bg"]}"/>',
    ]
    for index, (name, title, sub) in enumerate(steps):
        x = left + index * (card_w + gap)
        parts.append(f'<rect x="{x}" y="{top}" width="{card_w}" height="{card_h}" rx="16" fill="{t["card"]}" stroke="{t["line"]}" stroke-width="1.5"/>')
        parts.append(icon(name, x + 22, top + 22, 44))
        parts.append(f'<text x="{x + 22}" y="{top + 98}" fill="{t["ink"]}" font-family="{FONT}" font-size="19" font-weight="700">{title}</text>')
        parts.append(f'<text x="{x + 22}" y="{top + 122}" fill="{t["muted"]}" font-family="{FONT}" font-size="13.5">{sub}</text>')
        if index < len(steps) - 1:
            ax = x + card_w + 10
            ay = top + card_h // 2
            parts.append(f'<path d="M{ax} {ay}H{ax + gap - 20}M{ax + gap - 28} {ay - 8}l8 8-8 8" fill="none" stroke="{t["accent"]}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>')
    parts.append(f'<text x="{left}" y="{top + card_h + 46}" fill="{t["muted"]}" font-family="{FONT}" font-size="15">Everything is saved in your browser. No account, no server, no tracking.</text>')
    parts.append("</svg>")
    return "".join(parts)


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--chrome", help="path to Chrome or Edge")
    browser = find_browser(parser.parse_args().chrome)
    OUT.mkdir(parents=True, exist_ok=True)
    render(browser, dark_banner(), 1280, 480, OUT / "banner-dark-1280x480.png", 1)
    for theme in THEMES:
        render(browser, diagram(theme), 1280, 300, OUT / f"how-it-works-{theme}.png", 2)


if __name__ == "__main__":
    main()
