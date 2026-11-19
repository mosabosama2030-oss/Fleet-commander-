from pathlib import Path
import json
import struct
import unittest

ROOT = Path(__file__).resolve().parent
MANIFEST_PATH = ROOT / "manifest.webmanifest"


def png_dimensions(path: Path) -> tuple[int, int]:
    data = path.read_bytes()
    if data[:8] != b"\\x89PNG\\r\\n\\x1a\\n":
        raise AssertionError(f"{path.name} is not a PNG file")
    return struct.unpack(">II", data[16:24])


class PwaManifestTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.manifest = json.loads(MANIFEST_PATH.read_text(encoding="utf-8"))
        cls.index = (ROOT / "index.html").read_text(encoding="utf-8")

    def test_manifest_has_installability_metadata(self):
        self.assertTrue(self.manifest["name"])
        self.assertTrue(self.manifest["short_name"])
        self.assertEqual(self.manifest["lang"], "ar")
        self.assertEqual(self.manifest["dir"], "rtl")
        self.assertEqual(self.manifest["display"], "standalone")
        self.assertEqual(self.manifest["start_url"], "./index.html")
        self.assertEqual(self.manifest["scope"], "./")

    def test_manifest_icons_exist_and_have_required_dimensions(self):
        expected = {
            "./icons/icon-192.png": (192, 192),
            "./icons/icon-512.png": (512, 512),
            "./icons/icon-maskable-512.png": (512, 512),
        }
        entries = {icon["src"]: icon for icon in self.manifest["icons"]}
        self.assertTrue(set(expected).issubset(entries))
        for src, dimensions in expected.items():
            path = ROOT / src.removeprefix("./")
            self.assertTrue(path.is_file(), src)
            self.assertEqual(png_dimensions(path), dimensions, src)
        self.assertEqual(entries["./icons/icon-maskable-512.png"]["purpose"], "maskable")

    def test_index_links_manifest_and_local_icons(self):
        self.assertIn('<link rel="manifest" href="./manifest.webmanifest">', self.index)
        self.assertIn('./icons/icon-192.png', self.index)
        self.assertTrue(MANIFEST_PATH.is_file())

    def test_no_offline_or_service_worker_claim_is_added(self):
        app_js = (ROOT / "app.js").read_text(encoding="utf-8")
        self.assertNotIn("navigator.serviceWorker", app_js)
        self.assertNotIn("serviceWorker.register", app_js)


if __name__ == "__main__":
    unittest.main()
