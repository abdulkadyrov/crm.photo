import importlib.util
import json
from pathlib import Path
import threading
import tempfile
import unittest
from urllib.request import Request, urlopen
from urllib.error import HTTPError

spec = importlib.util.spec_from_file_location('portraits', Path(__file__).resolve().parents[2] / 'scripts/local-portraits/server.py')
portraits = importlib.util.module_from_spec(spec)
spec.loader.exec_module(portraits)


class LocalPortraitsTest(unittest.TestCase):
    def test_workflow_uses_template_mask_and_no_restoration(self):
        graph = portraits.workflow('source.png', 'master.png', 'mask.png', 'test')
        self.assertEqual(graph['5']['inputs']['face_restore_model'], 'none')
        self.assertEqual(graph['6']['inputs']['destination'], ['2', 0])
        self.assertEqual(graph['6']['inputs']['mask'], ['4', 0])
        self.assertEqual(graph['7']['inputs']['images'], ['6', 0])

    def test_loopback_origin_and_unknown_service(self):
        server = portraits.ThreadingHTTPServer(('127.0.0.1', 0), portraits.Handler)
        server.jobs_dir = Path(tempfile.gettempdir())
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        base = 'http://127.0.0.1:' + str(server.server_port)
        try:
            with self.assertRaises(HTTPError) as denied:
                urlopen(Request(base + '/local-portraits/jobs', data=b'{}', headers={'Content-Type': 'application/json', 'Origin': 'https://example.com'}))
            self.assertEqual(denied.exception.code, 403)
            denied.exception.close()
            with self.assertRaises(HTTPError) as unsupported:
                urlopen(Request(base + '/local-portraits/jobs', data=json.dumps({'serviceId':'other','source':'x'}).encode(), headers={'Content-Type':'application/json'}))
            self.assertEqual(unsupported.exception.code, 400)
            unsupported.exception.close()
            with urlopen(base + '/') as response:
                self.assertEqual(response.status, 200)
        finally:
            server.shutdown()
            server.server_close()
