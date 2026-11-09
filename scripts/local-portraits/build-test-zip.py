"""Build a small import fixture from the repository's demonstration portrait."""
import copy
import io
import json
from pathlib import Path
import zipfile
from PIL import Image

root = Path(__file__).resolve().parents[2]
source = root / 'test-fixtures/full-photographer-demo/vakha-studio-bachiyurt-mayrtup-full-demo.zip'
target = root / 'test-fixtures/local-portraits-acceptance.zip'
with zipfile.ZipFile(source) as archive:
    original = json.loads(archive.read('data.json'))
    person = original['students'][0]
    portrait = next(m for m in original['media'] if m['studentId'] == person['id'])
    photo = archive.read(f"media/student_files/{portrait['id']}/{portrait['fileName']}")
    pirate = {'id':'child-boy-pirate-captain','title':'Капитан пиратов'}
    princess = {'id':'child-girl-fairytale-princess','title':'Сказочная принцесса'}

data = {key: [] for key in original}
data['projects'] = [{'id':'portrait_acceptance_school', 'name':'Тест локальных портретов', 'classSort':'numeric'}]
data['classes'] = [{'id':'portrait_acceptance_class','projectId':'portrait_acceptance_school','name':'Тестовый класс'}]
data['services'] = []  # Use the bundled catalog without replacing its records.
files = []
for i, name in enumerate(['01 Подходящий', '02 Нет фото', '03 Два портрета', '04 Другой образ', '05 Ошибка лица', '06 После ошибки']):
    student_id = f'portrait_acceptance_student_{i}'
    service = princess if i == 3 else pirate
    student = copy.deepcopy(person)
    student.update(id=student_id,qrId=student_id,classId='portrait_acceptance_class',firstName=name,lastName='Демо',catalogId=service['id'],catalogIds=[service['id']],selectedServices=[{'serviceId':service['id'],'quantity':1,'comment':'Проверьте сходство и сохранение улыбки вручную'}])
    data['students'].append(student)
    task = {'type':service['id']+'__portrait','label':service['title']+': Портрет','status':'pending','fileIds':[]}
    for j in range(0 if i == 1 else 2 if i == 2 else 1):
        media_id=f'{student_id}_photo_{j}'
        content=photo
        if i == 4:
            blank=io.BytesIO();Image.new('RGB',(512,512),'white').save(blank,'JPEG');content=blank.getvalue()
        media={'id':media_id,'studentId':student_id,'type':'photo','orderType':task['type'],'fileName':media_id+'.jpg','mimeType':'image/jpeg','size':len(content)}
        data['media'].append(media);task['fileIds'].append(media_id)
        files.append((f"media/student_files/{media_id}/{media['fileName']}",content))
    if task['fileIds']:task['status']='done'
    data['orders'].append({'id':'order_'+student_id,'studentId':student_id,'catalogId':service['id'],'items':[task]})
manifest={'app':'Vakha Studio','schemaVersion':1,'exportType':'full_backup','containsMedia':True,'exportedAt':'2026-11-09T00:00:00.000Z','fixture':'local-portraits-acceptance'}
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED) as archive:
    archive.writestr('manifest.json',json.dumps(manifest,ensure_ascii=False))
    archive.writestr('data.json',json.dumps(data,ensure_ascii=False))
    for name,content in files:archive.writestr(name,content)
print(target)
