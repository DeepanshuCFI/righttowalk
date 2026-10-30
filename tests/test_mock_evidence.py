"""Guard the public summary against mixing one-spot and 100 m answers."""
import importlib.util
import pathlib
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("rtw_mock", ROOT / "tools" / "mock_backend.py")
mock = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mock)


class EvidenceSummaryTest(unittest.TestCase):
    def setUp(self):
        mock.ROWS.clear()
        mock.ROWS.update({
            "spot": {"id": "spot", "status": "published", "mode": "quick", "gate": None,
                     "spot_passable": "no", "client_id": "a", "sector": "A", "owner": "mcg",
                     "answers": {}, "verified": False, "created_at": "2026-10-30T00:00:00Z"},
            "stretch": {"id": "stretch", "status": "published", "mode": "full", "gate": "yes",
                        "spot_passable": None, "client_id": "b", "sector": "A", "owner": "mcg",
                        "answers": {"i1": "yes"}, "verified": False, "created_at": "2026-10-30T01:00:00Z"},
        })

    def tearDown(self):
        mock.ROWS.clear()

    def test_spot_does_not_enter_100m_denominator(self):
        s = mock.stats()
        self.assertEqual((s["spot_tested"], s["spot_blocked"]), (1, 1))
        self.assertEqual((s["gate_tested"], s["gate_pass"]), (1, 1))
        self.assertEqual(mock.group("sector")[0]["gate_tested"], 1)

    def test_people_counts_published_only(self):
        mock.ROWS["pending"] = {"id": "pending", "status": "pending", "mode": "quick",
                                "client_id": "c"}
        self.assertEqual(mock.stats()["people"], 2)


if __name__ == "__main__":
    unittest.main()
