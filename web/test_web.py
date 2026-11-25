from html.parser import HTMLParser
from pathlib import Path
import re
import unittest

ROOT = Path(__file__).resolve().parent
EXPECTED_PAGES = {"home", "shift", "trips", "expenses", "history", "reports", "assistant", "settings"}


class PageInventory(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.pages, self.targets = [], [], []
        self.labels, self.stylesheets, self.scripts = [], [], []
        self.external_assets, self.forms, self.password_inputs = [], 0, 0
        self.mobile_nav = False
        self.sections = []

    def handle_starttag(self, tag, attrs):
        values = dict(attrs)
        if "id" in values:
            self.ids.append(values["id"])
        if "data-page" in values:
            self.pages.append(values["data-page"])
            self.sections.append((values["data-page"], values.get("aria-labelledby")))
        if "data-page-target" in values:
            self.targets.append(values["data-page-target"])
        if "aria-label" in values:
            self.labels.append(values["aria-label"])
        if "mobile-nav" in values.get("class", "").split():
            self.mobile_nav = True
        if tag == "form":
            self.forms += 1
        if tag == "input" and values.get("type", "").lower() == "password":
            self.password_inputs += 1
        if tag == "link" and values.get("rel") == "stylesheet":
            self.stylesheets.append(values.get("href", ""))
        if tag == "script" and values.get("src"):
            self.scripts.append(values["src"])
        for attr in ("src", "href"):
            value = values.get(attr, "")
            if value.startswith(("https://", "http://", "//")):
                self.external_assets.append(value)


class WebPrototypeTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.html = (ROOT / "index.html").read_text(encoding="utf-8")
        cls.css = (ROOT / "styles.css").read_text(encoding="utf-8")
        cls.js = (ROOT / "app.js").read_text(encoding="utf-8")
        cls.inventory = PageInventory()
        cls.inventory.feed(cls.html)

    def test_arabic_rtl_has_all_captain_sections(self):
        self.assertRegex(self.html, r'<html[^>]+lang="ar"[^>]+dir="rtl"')
        self.assertEqual(set(self.inventory.pages), EXPECTED_PAGES)

    def test_every_navigation_target_exists(self):
        self.assertTrue(self.inventory.targets)
        self.assertTrue(set(self.inventory.targets).issubset(EXPECTED_PAGES))

    def test_each_section_has_a_heading_reference(self):
        ids = set(self.inventory.ids)
        for page, heading_id in self.inventory.sections:
            self.assertIsNotNone(heading_id, page)
            self.assertIn(heading_id, ids, page)

    def test_dom_ids_are_unique_and_mobile_navigation_exists(self):
        self.assertEqual(len(self.inventory.ids), len(set(self.inventory.ids)))
        self.assertTrue(self.inventory.mobile_nav)
        self.assertIn("إغلاق القائمة", self.inventory.labels)

    def test_only_local_assets_are_referenced(self):
        self.assertEqual(self.inventory.external_assets, [])
        self.assertEqual(self.inventory.stylesheets, ["./styles.css"])
        self.assertEqual(self.inventory.scripts, ["./app.js"])
        self.assertTrue((ROOT / "styles.css").is_file())
        self.assertTrue((ROOT / "app.js").is_file())

    def test_preview_does_not_collect_credentials_or_submit_forms(self):
        self.assertEqual(self.inventory.forms, 0)
        self.assertEqual(self.inventory.password_inputs, 0)

    def test_no_storage_network_or_sensitive_browser_apis(self):
        forbidden = (
            r"\blocalStorage\b", r"\bsessionStorage\b", r"\bindexedDB\b",
            r"\bnavigator\.geolocation\b", r"\bnavigator\.serviceWorker\b",
            r"\bfetch\s*\(", r"\bXMLHttpRequest\b", r"\bWebSocket\b",
        )
        for pattern in forbidden:
            self.assertIsNone(re.search(pattern, self.js), pattern)
        self.assertIn("navigator.onLine", self.js)

    def test_reduced_motion_and_responsive_layout_exist(self):
        self.assertIn("@media(max-width:760px)", self.css)
        self.assertIn("@media(max-width:440px)", self.css)
        self.assertIn("prefers-reduced-motion:reduce", self.css)
        self.assertIn("--primary:#087F7B", self.css)
        self.assertIn("--ai:#635BCA", self.css)

    def test_ai_remains_disabled_and_financial_claims_are_absent(self):
        self.assertIn("المساعد غير مفعّل", self.html)
        self.assertIn("المحرك المالي غير متاح", self.html)
        self.assertIn("لا يتم تأكيد أي إجراء قبل الربط الفعلي", self.html)


if __name__ == "__main__":
    unittest.main()
