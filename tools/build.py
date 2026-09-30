"""Build installable packages for each browser family.

    python tools/build.py

Writes dist/<target>/ (a folder you can load unpacked) and
dist/speed-dial-<version>-<target>.zip (manifest.json at the zip root, as the
Chrome Web Store, Edge Add-ons and addons.mozilla.org require).

manifest.json in the repository is the Chromium manifest. The Firefox build
derives from it: Firefox runs MV3 background code as a module script instead
of a service worker, has no favicon cache API, and needs a gecko id.
"""

import copy
import json
import shutil
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / "dist"
PACKAGE_PATHS = ("_locales", "icons", "src")
GECKO_ID = "speed-dial@supportefy.com"
FIREFOX_MIN_VERSION = "128.0"
CHROMIUM_ONLY_PERMISSIONS = ("favicon",)
CHROMIUM_ONLY_KEYS = ("minimum_chrome_version",)


def chromium_manifest(source: dict) -> dict:
    return copy.deepcopy(source)


def firefox_manifest(source: dict) -> dict:
    manifest = copy.deepcopy(source)
    for key in CHROMIUM_ONLY_KEYS:
        manifest.pop(key, None)
    manifest["permissions"] = [p for p in manifest["permissions"] if p not in CHROMIUM_ONLY_PERMISSIONS]
    worker = manifest["background"]["service_worker"]
    manifest["background"] = {"scripts": [worker], "type": "module"}
    manifest["browser_specific_settings"] = {
        "gecko": {"id": GECKO_ID, "strict_min_version": FIREFOX_MIN_VERSION},
    }
    return manifest


TARGETS = {"chromium": chromium_manifest, "firefox": firefox_manifest}


def build(target: str, source: dict) -> Path:
    out = DIST / target
    if out.exists():
        shutil.rmtree(out)
    out.mkdir(parents=True)
    for name in PACKAGE_PATHS:
        shutil.copytree(ROOT / name, out / name)
    (out / "manifest.json").write_text(json.dumps(TARGETS[target](source), indent=2) + "\n", encoding="utf-8")

    archive = DIST / f"speed-dial-{source['version']}-{target}.zip"
    with zipfile.ZipFile(archive, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in sorted(out.rglob("*")):
            if path.is_file():
                zf.write(path, path.relative_to(out).as_posix())
    return archive


def main() -> None:
    source = json.loads((ROOT / "manifest.json").read_text(encoding="utf-8"))
    for target in TARGETS:
        archive = build(target, source)
        print(f"{target:9} {archive.relative_to(ROOT)}  {archive.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
