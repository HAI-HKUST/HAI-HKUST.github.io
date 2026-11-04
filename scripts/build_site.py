#!/usr/bin/env python3
"""Validate and assemble a dependency-free static GitHub Pages artifact."""
from __future__ import annotations
import argparse
from hashlib import sha256
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import shutil
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
PAGES = ("index.html", "talks.html", "events.html", "talk.html",
         "handbook.html", "collaboration.html", "links.html")
ASSETS = ROOT / "assets"
OUTPUT = ROOT / "_site"
IMPORT = re.compile(r"""(\bfrom\s*['"])(\./[^'"]+\.js)(['"])""")
CSS_URL = re.compile(r"""url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)""")
HTML_ASSET = re.compile(r"""((?:href|src)=["'])(assets/[^"'?#]+)(["'])""")
JS_IMAGE = re.compile(r"""(assets/images/[A-Za-z0-9_./-]+\.(?:png|jpe?g|svg))(?=['"])""")
CSS_IMAGE = re.compile(r"""(url\(\s*['"]?)(\.\./images/[A-Za-z0-9_./-]+)(['"]?\s*\))""")


class PageRefs(HTMLParser):
    def __init__(self):
        super().__init__()
        self.refs = []
        self.translations = set()
        self.chrome = set()

    def handle_starttag(self, tag, attrs):
        props = dict(attrs)
        self.chrome.update(key for key in ("data-site-header", "data-site-footer") if key in props)
        if props.get("data-i18n"):
            self.translations.add(props["data-i18n"])
        for name in ("src", "href", "poster", "data-demo"):
            if props.get(name):
                self.refs.append(props[name])


def check_ref(ref: str, file: Path, root: Path) -> None:
    parsed = urlsplit(ref)
    if not parsed.path or parsed.scheme or parsed.netloc or ref.startswith(("#", "//")):
        return
    rel = unquote(parsed.path)
    target = root / rel.lstrip("/") if rel.startswith("/") else file.parent / rel
    target = target.resolve()
    if not target.is_relative_to(root.resolve()) or not target.is_file():
        raise ValueError(f"Invalid local reference in {file.relative_to(root)}: {ref}")


def translation_keys(root: Path) -> set[str]:
    text = (root / "assets/js/i18n.js").read_text(encoding="utf-8")
    separator = text.find('\n  "en":')
    if separator < 0:
        raise ValueError("English translation dictionary missing")
    zh = re.findall(r'^\s{4}"([^"]+)":', text[:separator], re.M)
    en = re.findall(r'^\s{4}"([^"]+)":', text[separator:], re.M)
    if len(zh) != len(set(zh)) or len(en) != len(set(en)) or set(zh) != set(en):
        raise ValueError("Duplicate or unmatched bilingual keys")
    return set(zh)


def verify(root: Path) -> None:
    keys = translation_keys(root)
    for name in PAGES:
        file = root / name
        parser = PageRefs()
        parser.feed(file.read_text(encoding="utf-8"))
        if parser.chrome != {"data-site-header", "data-site-footer"}:
            raise ValueError(f"Missing shared layout placeholders in {name}")
        for ref in parser.refs:
            check_ref(ref, file, root)
        if parser.translations - keys:
            raise ValueError(f"Missing translations in {name}: {sorted(parser.translations - keys)}")
    for file in (root / "assets/css").glob("*.css"):
        for double, single, bare in CSS_URL.findall(file.read_text(encoding="utf-8")):
            ref = (double or single or bare).strip()
            if not ref.startswith("data:"):
                check_ref(ref, file, root)
    for file in (root / "assets/js").glob("*.js"):
        for ref in re.findall(r"""\bfrom\s*['"]([^'"]+)['"]""", file.read_text(encoding="utf-8")):
            check_ref(ref, file, root)
    manifest = root / "assets/favicon/site.webmanifest"
    for icon in json.loads(manifest.read_text(encoding="utf-8")).get("icons", []):
        check_ref(icon["src"], manifest, root)
    talks = (root / "assets/js/talks-data.js").read_text(encoding="utf-8")
    ids = re.findall(r"^\s+id:\s*'([^']+)'", talks, re.M)
    if not ids or len(ids) != len(set(ids)):
        raise ValueError("Missing or duplicated Talk IDs")
    print(f"Verified {len(PAGES)} pages, {len(keys)} translation keys, {len(ids)} Talks and resources")


def fingerprint() -> str:
    digest = sha256()
    for file in sorted(ASSETS.rglob("*")):
        if file.is_file():
            digest.update(file.relative_to(ROOT).as_posix().encode())
            digest.update(file.read_bytes())
    return digest.hexdigest()[:12]


def build() -> None:
    verify(ROOT)
    if OUTPUT.exists():
        shutil.rmtree(OUTPUT)
    OUTPUT.mkdir()
    shutil.copytree(ASSETS, OUTPUT / "assets")
    version = fingerprint()
    for name in PAGES:
        original = (ROOT / name).read_text(encoding="utf-8")
        rendered = HTML_ASSET.sub(lambda m: m[1] + m[2] + "?v=" + version + m[3], original)
        (OUTPUT / name).write_text(rendered, encoding="utf-8")
    for file in (OUTPUT / "assets/js").glob("*.js"):
        script = file.read_text(encoding="utf-8")
        script = IMPORT.sub(lambda m: m[1] + m[2] + "?v=" + version + m[3], script)
        script = JS_IMAGE.sub(lambda m: m[1] + "?v=" + version, script)
        file.write_text(script, encoding="utf-8")
    for file in (OUTPUT / "assets/css").glob("*.css"):
        css = file.read_text(encoding="utf-8")
        css = CSS_IMAGE.sub(lambda m: m[1] + m[2] + "?v=" + version + m[3], css)
        file.write_text(css, encoding="utf-8")
    manifest = OUTPUT / "assets/favicon/site.webmanifest"
    metadata = json.loads(manifest.read_text(encoding="utf-8"))
    for icon in metadata.get("icons", []):
        icon["src"] = urlsplit(icon["src"]).path + "?v=" + version
    manifest.write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    shutil.copy2(ROOT / ".nojekyll", OUTPUT / ".nojekyll")
    verify(OUTPUT)
    print(f"Built verified _site/ with unified asset version {version}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--build", action="store_true")
    args = parser.parse_args()
    build() if args.build else verify(ROOT)
