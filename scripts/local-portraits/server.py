"""Local-only CRM static server and ComfyUI adapter. Python 3.11+, Pillow.
Run: python scripts/local-portraits/server.py --jobs-dir D:/CRMPhoto/jobs
No cloud credentials, remote URLs or incoming LAN connections are supported.
"""
import argparse
import base64
import io
import json
import threading
import time
import uuid
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import URLError
from urllib.parse import urlencode, urlparse
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[2]
COMFY = 'http://127.0.0.1:8188'
SERVICE = 'child-boy-pirate-captain'
JOBS = {}
LOCK = threading.Lock()
JOBS_LOCK = threading.Lock()


def comfy(path, data=None, content_type='application/json'):
    if isinstance(data, dict):
        data = json.dumps(data).encode()
    try:
        with urlopen(Request(COMFY + path, data=data, headers={'Content-Type': content_type}), timeout=30) as response:
            return response.read()
    except URLError as error:
        raise RuntimeError('ComfyUI недоступен или отклонил запрос. Запустите ComfyUI на 127.0.0.1:8188 и проверьте его журнал.') from error


def upload(data, name):
    boundary = uuid.uuid4().hex
    payload = (f'--{boundary}\r\nContent-Disposition: form-data; name="image"; filename="{name}"\r\nContent-Type: image/png\r\n\r\n'.encode()
               + data + f'\r\n--{boundary}--\r\n'.encode())
    result = json.loads(comfy('/upload/image', payload, f'multipart/form-data; boundary={boundary}'))
    return '/'.join(filter(None, [result.get('subfolder'), result['name']]))


def workflow(source, master, mask, job_id):
    return {
        '1': {'class_type': 'LoadImage', 'inputs': {'image': source}},
        '2': {'class_type': 'LoadImage', 'inputs': {'image': master}},
        '3': {'class_type': 'LoadImage', 'inputs': {'image': mask}},
        '4': {'class_type': 'ImageToMask', 'inputs': {'image': ['3', 0], 'channel': 'red'}},
        '5': {'class_type': 'ReActorFaceSwap', 'inputs': {
            'enabled': True, 'input_image': ['2', 0], 'source_image': ['1', 0],
            'swap_model': 'inswapper_128.onnx', 'facedetection': 'retinaface_resnet50',
            'face_restore_model': 'none', 'face_restore_visibility': 1.0, 'codeformer_weight': 0.5,
            'detect_gender_input': 'no', 'detect_gender_source': 'no',
            'input_faces_index': '0', 'source_faces_index': '0', 'console_log_level': 1}},
        '6': {'class_type': 'ImageCompositeMasked', 'inputs': {'destination': ['2', 0], 'source': ['5', 0], 'mask': ['4', 0], 'x': 0, 'y': 0, 'resize_source': False}},
        '7': {'class_type': 'SaveImage', 'inputs': {'images': ['6', 0], 'filename_prefix': f'CRMPhoto/{job_id}'}}
    }


def check_setup():
    info = json.loads(comfy('/object_info'))
    required = ['LoadImage', 'ImageToMask', 'ReActorFaceSwap', 'ImageCompositeMasked', 'SaveImage']
    missing = [node for node in required if node not in info]
    if missing:
        raise RuntimeError('Установите локальные узлы ComfyUI: ' + ', '.join(missing))
    models = info['ReActorFaceSwap']['input']['required']['swap_model'][0]
    if 'inswapper_128.onnx' not in models:
        raise RuntimeError('В ComfyUI отсутствует модель inswapper_128.onnx. Подготовьте модели на D: по инструкции.')


def run_job(job_id, payload, directory):
    job = JOBS[job_id]
    try:
        with LOCK:
            job['status'] = 'running'
            check_setup()
            from PIL import Image, ImageChops
            raw = base64.b64decode(payload['source'], validate=True)
            image = Image.open(io.BytesIO(raw))
            if image.width * image.height > 50_000_000:
                raise ValueError('Исходник слишком большой: максимум 50 мегапикселей')
            # Remove EXIF/GPS before uploading to the local engine.
            from PIL import ImageOps
            clean = io.BytesIO()
            ImageOps.exif_transpose(image).convert('RGB').save(clean, format='PNG')
            folder = directory / job_id
            folder.mkdir(parents=True)
            (folder / 'source.png').write_bytes(clean.getvalue())
            (folder / 'request.json').write_text(json.dumps({'serviceId': SERVICE, 'comment': payload.get('comment', ''), 'manualReview': True}, ensure_ascii=False), encoding='utf-8')
            template = ROOT / 'assets/templates/children' / SERVICE
            master = (template / 'master.png').read_bytes()
            graph = workflow(upload(clean.getvalue(), job_id+'-source.png'), upload(master, job_id+'-master.png'), upload((template/'face-mask.png').read_bytes(), job_id+'-mask.png'), job_id)
            (folder / 'workflow.json').write_text(json.dumps(graph), encoding='utf-8')
            reply = json.loads(comfy('/prompt', {'prompt': graph, 'client_id': job_id}))
            if reply.get('node_errors') or not reply.get('prompt_id'):
                raise RuntimeError('ComfyUI отклонил схему. Проверьте узлы ReActor и модели.')
            prompt_id = reply['prompt_id']
            for _ in range(900):
                history = json.loads(comfy('/history/' + prompt_id)).get(prompt_id)
                if history:
                    if history.get('status', {}).get('status_str') == 'error':
                        raise RuntimeError('Ошибка обработки ComfyUI. Откройте его журнал; старый черновик сохранён.')
                    outputs = history.get('outputs', {}).get('7', {}).get('images', [])
                    if outputs:
                        output = outputs[0]
                        data = comfy('/view?' + urlencode({k: output[k] for k in ('filename', 'subfolder', 'type')}))
                        result = Image.open(io.BytesIO(data)).convert('RGB')
                        original = Image.open(io.BytesIO(master)).convert('RGB')
                        if result.size != original.size or ImageChops.difference(result, original).getbbox() is None:
                            raise RuntimeError('ComfyUI не заменил лицо или изменил размер. Проверьте исходник и журнал; черновик не сохранён.')
                        (folder / 'draft.png').write_bytes(data)
                        job.update(status='done', image=base64.b64encode(data).decode())
                        return
                time.sleep(1)
            raise RuntimeError('Превышено время обработки. Проверьте очередь ComfyUI перед повторным запуском.')
    except Exception as error:
        job.update(status='error', error=str(error))


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def valid_local_request(self):
        allowed = f'127.0.0.1:{self.server.server_port}'
        origin = self.headers.get('Origin')
        return self.headers.get('Host') == allowed and (not origin or origin == 'http://' + allowed)

    def respond(self, status, value):
        data = json.dumps(value, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def do_GET(self):
        if not self.valid_local_request():
            return self.respond(403, {'error': 'Доступ только с этого ПК'})
        path = urlparse(self.path).path
        if path.startswith('/local-portraits/jobs/'):
            job = JOBS.get(path.rsplit('/', 1)[-1])
            return self.respond(200 if job else 404, job or {'error': 'Задание не найдено. Сервис был перезапущен; повторите обработку.'})
        if path.startswith('/local-portraits'):
            return self.respond(404, {'error': 'Неизвестная операция'})
        # Do not expose Git metadata, local backups, or Python source through the server.
        if any(part.startswith('.') for part in Path(path).parts) or path.startswith(('/scripts/', '/tests/', '/output/', '/tmp/')):
            return self.respond(404, {'error': 'Не найдено'})
        return super().do_GET()

    def list_directory(self, path):
        self.send_error(404)
        return None

    def do_POST(self):
        if not self.valid_local_request() or self.headers.get('Content-Type') != 'application/json':
            return self.respond(403, {'error': 'Доступ только из локальной CRM'})
        if self.path != '/local-portraits/jobs':
            return self.respond(404, {'error': 'Неизвестная операция'})
        try:
            size = int(self.headers.get('Content-Length', 0))
            if not 0 < size <= 40_000_000:
                return self.respond(413, {'error': 'Исходник слишком большой (до 30 МБ)'})
            payload = json.loads(self.rfile.read(size))
            if payload.get('serviceId') != SERVICE or not isinstance(payload.get('source'), str):
                return self.respond(400, {'error': 'Автоматическая обработка ещё не настроена'})
            with JOBS_LOCK:
                if any(j['status'] in ('queued', 'running') for j in JOBS.values()):
                    return self.respond(409, {'error': 'ComfyUI уже обрабатывает заказ. Дождитесь завершения.'})
                # Results remain on D:; bound the in-memory HTTP response cache.
                while len(JOBS) >= 20:
                    del JOBS[next(iter(JOBS))]
                job_id = uuid.uuid4().hex
                JOBS[job_id] = {'id': job_id, 'status': 'queued'}
            threading.Thread(target=run_job, args=(job_id, payload, self.server.jobs_dir), daemon=True).start()
            return self.respond(202, {'id': job_id})
        except (ValueError, TypeError):
            return self.respond(400, {'error': 'Неверный формат задания'})


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--jobs-dir', type=Path, required=True)
    parser.add_argument('--port', type=int, default=4175)
    args = parser.parse_args()
    server = ThreadingHTTPServer(('127.0.0.1', args.port), Handler)
    server.jobs_dir = args.jobs_dir.resolve()
    server.jobs_dir.mkdir(parents=True, exist_ok=True)
    print(f'Локальная CRM: http://127.0.0.1:{args.port}', flush=True)
    server.serve_forever()
