"""Regression contracts for the HAI-HKUST static site."""
import importlib.util
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("hai_build", ROOT / "scripts/build_site.py")
site = importlib.util.module_from_spec(spec)
spec.loader.exec_module(site)


class SiteContracts(unittest.TestCase):
    def test_pages_assets_translations(self):
        site.verify(ROOT)

    def test_single_shared_layout(self):
        shared = (ROOT / "assets/js/site.js").read_text(encoding="utf-8")
        self.assertIn("function injectLayout()", shared)
        for name in site.PAGES:
            html = (ROOT / name).read_text(encoding="utf-8")
            with self.subTest(page=name):
                self.assertIn("data-site-header", html)
                self.assertIn("data-site-footer", html)
                self.assertIn("assets/css/site.css", html)
                self.assertIn("assets/js/site.js", html)
                self.assertNotIn('<header class="site-header">', html)

    def test_stable_talk_ids(self):
        data = (ROOT / "assets/js/talks-data.js").read_text(encoding="utf-8")
        ids = re.findall(r"^\s+id:\s*'([^']+)'", data, re.M)
        self.assertGreaterEqual(len(ids), 2)
        self.assertEqual(len(ids), len(set(ids)))
        self.assertIn("getTalkById", data)
        self.assertIn("talksByStatus", data)

    def test_manifest_icon_versions_come_from_build(self):
        manifest = (ROOT / "assets/favicon/site.webmanifest").read_text(encoding="utf-8")
        self.assertNotRegex(manifest, r"\?v=[\w-]+")
        self.assertIn("web-app-manifest-192x192.png", manifest)

    def test_no_manual_cache_versions(self):
        for page in site.PAGES:
            self.assertNotRegex((ROOT / page).read_text(encoding="utf-8"), r"\?v=[\w-]+")
        for js in (ROOT / "assets/js").glob("*.js"):
            self.assertNotRegex(js.read_text(encoding="utf-8"), r"\?v=[\w-]+")


if __name__ == "__main__":
    unittest.main()
