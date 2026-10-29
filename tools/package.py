#!/usr/bin/env python3
"""ПРОФСИЛА · сборка архива для ведущих.

    python3 tools/package.py                          -> dist/profsila.zip
    python3 tools/package.py --out game/profsila.zip  -> так делает публикация на GitHub Pages

В архиве одна папка ПРОФСИЛА: игра из game/, «КАК ЗАПУСТИТЬ.txt»,
«Памятка ведущего.pdf» и «Листовка A4.pdf». PDF печатаются из game/host.html
и game/flyer.html браузером Chrome в фоновом режиме, поэтому всегда совпадают
с текущими страницами.
"""

import argparse
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile
import zipfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
GAME = ROOT / "game"
FOLDER = "ПРОФСИЛА"
SKIP = {"profsila.zip", ".DS_Store", "Thumbs.db"}
CHROMES = [
    os.environ.get("CHROME", ""),
    "google-chrome",
    "google-chrome-stable",
    "chromium",
    "chromium-browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
]


def find_chrome():
    for name in CHROMES:
        if not name:
            continue
        path = shutil.which(name) or (name if os.path.exists(name) else None)
        if path:
            return path
    sys.exit("Не найден Google Chrome: он нужен, чтобы напечатать PDF. Укажите путь в переменной CHROME.")


def print_pdf(chrome, page, out, profile):
    subprocess.run(
        [chrome, "--headless=new", "--disable-gpu", "--no-first-run", "--no-sandbox",
         "--user-data-dir=" + str(profile), "--no-pdf-header-footer", "--virtual-time-budget=8000",
         "--print-to-pdf=" + str(out), page.as_uri()],
        check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, timeout=180,
    )
    if not out.exists() or out.read_bytes()[:4] != b"%PDF":
        sys.exit("Chrome не напечатал " + page.name)


def main():
    ap = argparse.ArgumentParser(description="Собрать архив ПРОФСИЛА для ведущих")
    ap.add_argument("--out", default=str(ROOT / "dist" / "profsila.zip"), help="куда положить архив")
    args = ap.parse_args()
    out = pathlib.Path(args.out).resolve()
    chrome = find_chrome()

    with tempfile.TemporaryDirectory() as tmp:
        tmp = pathlib.Path(tmp)
        host_pdf, flyer_pdf = tmp / "host.pdf", tmp / "flyer.pdf"
        print_pdf(chrome, GAME / "host.html", host_pdf, tmp / "chrome")
        print_pdf(chrome, GAME / "flyer.html", flyer_pdf, tmp / "chrome")

        # Имена с кириллицей zipfile помечает как UTF-8 — их правильно читает «Извлечь всё» в Windows.
        packed = tmp / "profsila.zip"
        count = 0
        with zipfile.ZipFile(packed, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as z:
            for path in sorted(GAME.rglob("*")):
                if path.is_file() and path.name not in SKIP:
                    z.write(path, FOLDER + "/" + path.relative_to(GAME).as_posix())
                    count += 1
            z.write(ROOT / "package" / "КАК ЗАПУСТИТЬ.txt", FOLDER + "/КАК ЗАПУСТИТЬ.txt")
            z.write(host_pdf, FOLDER + "/Памятка ведущего.pdf")
            z.write(flyer_pdf, FOLDER + "/Листовка A4.pdf")
            count += 3

        out.parent.mkdir(parents=True, exist_ok=True)
        shutil.move(str(packed), str(out))

    print("Собрано: %s · файлов %d · %d КБ" % (os.path.relpath(out, ROOT), count, out.stat().st_size // 1024))


if __name__ == "__main__":
    main()
