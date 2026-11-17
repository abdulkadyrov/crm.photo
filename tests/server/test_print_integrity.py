import unittest,sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[2]/'server'))
from print_integrity import replaces_finished_with_camera
class PrintIntegrity(unittest.TestCase):
 def test_rebuild_must_not_replace_template_with_camera(self):
  current={'originalFinalImage':{'$syncBlob':'template','mime':'image/png'}};camera={'$syncBlob':'camera'}
  self.assertTrue(replaces_finished_with_camera(current,{'originalFinalImage':camera},camera))
  self.assertFalse(replaces_finished_with_camera(current,{'originalFinalImage':{'$syncBlob':'new-template'}},camera))
  self.assertFalse(replaces_finished_with_camera(None,{'originalFinalImage':camera},camera))
