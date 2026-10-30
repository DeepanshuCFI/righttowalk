"""Offline checks for the public export's evidence and spreadsheet safety."""
import csv
import importlib.util
import io
import json
import pathlib
import tempfile
import unittest
from unittest import mock


SCRIPT = pathlib.Path(__file__).resolve().parents[1] / "tools" / "snapshot.py"
spec = importlib.util.spec_from_file_location("rtw_snapshot", SCRIPT)
snapshot = importlib.util.module_from_spec(spec)
spec.loader.exec_module(snapshot)


class SnapshotTests(unittest.TestCase):
    def test_csv_neutralizes_formula_cells_but_json_keeps_original(self):
        row = {"id": "check-1", "mode": "quick", "road": " =HYPERLINK(\"https://example.invalid\")", "sector": "@SUM(1,2)", "spot_passable": "no", "obs": {"parked": "\t=1+1"}, "answers": {}}
        parsed = next(csv.DictReader(io.StringIO(snapshot.csv_text([row]))))
        self.assertEqual(parsed["road"], "' =HYPERLINK(\"https://example.invalid\")")
        self.assertEqual(parsed["sector"], "'@SUM(1,2)")
        self.assertEqual(parsed["obs_parked"], "'\t=1+1")
        self.assertEqual(row["road"], " =HYPERLINK(\"https://example.invalid\")")

    def test_unchanged_rows_keep_data_timestamp_but_refresh_checked_at(self):
        with tempfile.TemporaryDirectory() as directory:
            rows = [{"id": "check-1", "mode": "quick", "spot_passable": "no", "gate": None, "answers": {}, "obs": {}}]
            def fetch(_url, _anon, path, _headers=None):
                if "public_checks" in path:
                    return rows
                if "public_stats" in path:
                    return {"published": 1, "gate_tested": 0, "spot_tested": 1}
                return []
            with mock.patch.dict(snapshot.os.environ, {"RTW_OUT": directory}), mock.patch.object(snapshot, "load_config", return_value=("https://example.invalid", "anon")), mock.patch.object(snapshot, "fetch_json", side_effect=fetch), mock.patch.object(snapshot, "now_iso", side_effect=["2026-10-30T00:00:00Z", "2026-10-31T00:00:00Z"]):
                self.assertEqual(snapshot.main(), 0)
                first = json.loads((pathlib.Path(directory) / "checks.json").read_text())
                self.assertEqual(snapshot.main(), 0)
                second = json.loads((pathlib.Path(directory) / "stats.json").read_text())
            self.assertEqual(first["data_changed_at"], "2026-10-30T00:00:00Z")
            self.assertEqual(second["data_changed_at"], "2026-10-30T00:00:00Z")
            self.assertEqual(second["checked_at"], "2026-10-31T00:00:00Z")
            self.assertEqual(second["stats"]["gate_tested"], 0)


if __name__ == "__main__":
    unittest.main()
