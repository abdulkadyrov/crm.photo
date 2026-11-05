# Local OCR runtime

Pinned Tesseract.js 6.0.1 and tesseract.js-core 6.1.2, copied from the locked npm dependencies. Licenses are included as LICENSE.md and CORE-LICENSE. All four core variants are retained so the worker can select the supported WebAssembly implementation.

Russian model: `@tesseract.js-data/rus@1.0.0/4.0.0_best_int/rus.traineddata.gz`, downloaded from https://cdn.jsdelivr.net/npm/@tesseract.js-data/rus@1.0.0/4.0.0_best_int/rus.traineddata.gz . Tesseract language data is Apache-2.0 licensed: https://github.com/tesseract-ocr/tessdata_best .

The runtime is loaded on demand from this application's own origin. Images are processed in a browser worker and are never uploaded by the photo importer. The existing service worker caches the requested assets; the language model is also cached by Tesseract in IndexedDB. First use needs these assets downloaded; offline availability depends on browser cache retention.

Upstream API and local deployment: https://github.com/naptha/tesseract.js/blob/master/docs/api.md and https://github.com/naptha/tesseract.js/blob/master/docs/local-installation.md .
