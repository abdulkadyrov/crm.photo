#!/usr/bin/env python3
"""Build the complete Bachiyurt/Mayrtup photographer acceptance fixture."""

from __future__ import annotations

import hashlib
import html
import json
import math
import zipfile
from datetime import datetime, timedelta, timezone
from pathlib import Path

from PIL import Image, ImageOps


ROOT_DIR = Path(__file__).resolve().parents[1]
FIXTURE_DIR = ROOT_DIR / "test-fixtures" / "full-photographer-demo"
SHEETS_DIR = FIXTURE_DIR / "source-sheets"
PORTRAITS_DIR = FIXTURE_DIR / "portraits"
RESULTS_DIR = FIXTURE_DIR / "results"
NEURAL_RESULTS_DIR = FIXTURE_DIR / "neural-results"
ARCHIVE_PATH = FIXTURE_DIR / "vakha-studio-bachiyurt-mayrtup-full-demo.zip"
REPORT_PATH = FIXTURE_DIR / "report.html"
REPORT_JSON_PATH = FIXTURE_DIR / "report.json"
OVERVIEW_PATH = FIXTURE_DIR / "before-after-overview.jpg"
TEMPLATE_INDEX_PATH = ROOT_DIR / "assets" / "templates" / "children" / "index.json"
PHOTOGRAPHER_ID = "demo_photographer"
RUN_AT = datetime(2026, 8, 12, 6, 0, tzinfo=timezone.utc)
GRID_GENDERS = ["boy", "girl", "boy", "girl", "boy", "girl", "boy", "girl", "boy", "girl"]


CLASS_SPECS = [
    {
        "slug": "bachiyurt-1a",
        "sheet": "bachiyurt-1a.png",
        "project_id": "demo_project_bachiyurt",
        "project_name": "Бачийурт — школа №1",
        "class_id": "demo_class_bachiyurt_1a",
        "class_name": "1А",
        "students": [
            ("Алихан", "Мусаев"),
            ("Амина", "Исаева"),
            ("Мухаммад", "Эльмурзаев"),
            ("Хадижат", "Сулейманова"),
            ("Абубакар", "Даудов"),
            ("Малика", "Ахмадова"),
            ("Рамзан", "Батаев"),
            ("Сафия", "Магомадова"),
            ("Ибрагим", "Ташуев"),
            ("Айшат", "Юсупова"),
        ],
    },
    {
        "slug": "bachiyurt-2a",
        "sheet": "bachiyurt-2a.png",
        "project_id": "demo_project_bachiyurt",
        "project_name": "Бачийурт — школа №1",
        "class_id": "demo_class_bachiyurt_2a",
        "class_name": "2А",
        "students": [
            ("Ислам", "Хасуев"),
            ("Мадина", "Аслаханова"),
            ("Шамиль", "Идрисов"),
            ("Самира", "Джабраилова"),
            ("Хамзат", "Юсупов"),
            ("Ясмина", "Алиева"),
            ("Ахмад", "Сайханов"),
            ("Хава", "Осмаева"),
            ("Мансур", "Зубайраев"),
            ("Лейла", "Висаитова"),
        ],
    },
    {
        "slug": "mayrtup-1b",
        "sheet": "mayrtup-1b.png",
        "project_id": "demo_project_mayrtup",
        "project_name": "Майртуп — школа №1",
        "class_id": "demo_class_mayrtup_1b",
        "class_name": "1Б",
        "students": [
            ("Эли", "Шамсудинов"),
            ("Алия", "Насуханова"),
            ("Саид-Магомед", "Дахаев"),
            ("Раяна", "Муртазалиева"),
            ("Билал", "Арсанукаев"),
            ("Сумайя", "Эдилова"),
            ("Хусейн", "Межидов"),
            ("Латифа", "Бекмурзаева"),
            ("Умар", "Кадиров"),
            ("Марьям", "Якубова"),
        ],
    },
    {
        "slug": "mayrtup-2b",
        "sheet": "mayrtup-2b.png",
        "project_id": "demo_project_mayrtup",
        "project_name": "Майртуп — школа №1",
        "class_id": "demo_class_mayrtup_2b",
        "class_name": "2Б",
        "students": [
            ("Иса", "Джамалханов"),
            ("Фатима", "Абдурахманова"),
            ("Муса", "Салгириев"),
            ("Зайнаб", "Турлуева"),
            ("Якуб", "Арсланов"),
            ("Седа", "Эльдарова"),
            ("Юсуф", "Накаев"),
            ("Рукият", "Вахаева"),
            ("Салман", "Тумсоев"),
            ("Аиша", "Муслимова"),
        ],
    },
]


def iso(value: datetime) -> str:
    return value.isoformat(timespec="milliseconds").replace("+00:00", "Z")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def load_templates() -> tuple[dict[str, dict], dict[str, list[dict]]]:
    templates = json.loads(TEMPLATE_INDEX_PATH.read_text(encoding="utf-8"))
    enabled = [item for item in templates if item.get("enabled")]
    by_id = {item["id"]: item for item in enabled}
    by_gender = {
        gender: [item for item in enabled if item.get("gender") == gender]
        for gender in ("boy", "girl")
    }
    if len(by_gender["boy"]) < 10 or len(by_gender["girl"]) < 10:
        raise RuntimeError("Not enough enabled child templates for the acceptance fixture")
    return by_id, by_gender


def split_sheet(sheet_path: Path) -> list[Image.Image]:
    sheet = Image.open(sheet_path).convert("RGB")
    width, height = sheet.size
    if width < 1500 or height < 700:
        raise RuntimeError(f"Unexpected source sheet size: {sheet_path} {sheet.size}")
    cells: list[Image.Image] = []
    for index in range(10):
        row, column = divmod(index, 5)
        left = round(column * width / 5)
        right = round((column + 1) * width / 5)
        top = round(row * height / 2)
        bottom = round((row + 1) * height / 2)
        inset = max(3, round(min(right - left, bottom - top) * 0.012))
        cell = sheet.crop((left + inset, top + inset, right - inset, bottom - inset))
        cells.append(ImageOps.fit(cell, (720, 720), Image.Resampling.LANCZOS, centering=(0.5, 0.5)))
    return cells


def install_neural_montage(class_slug: str, student_id: str, template: dict, output_path: Path) -> Path:
    neural_path = NEURAL_RESULTS_DIR / class_slug / f"{student_id}_{template['id']}_neural.png"
    if not neural_path.exists():
        raise FileNotFoundError(
            f"Missing GPT identity-preserve result: {neural_path}. "
            "The fixture no longer permits a local face-mask fallback."
        )
    with Image.open(neural_path) as generated:
        width, height = generated.size
        if width < 900 or height < 1100 or not 0.76 <= width / height <= 0.84:
            raise RuntimeError(f"Unexpected GPT montage dimensions: {neural_path} {generated.size}")
        result = ImageOps.fit(generated.convert("RGB"), (1024, 1280), Image.Resampling.LANCZOS, centering=(0.5, 0.5))
    output_path.parent.mkdir(parents=True, exist_ok=True)
    result.save(output_path, "JPEG", quality=93, optimize=True, progressive=True)
    return neural_path


TRANSLIT = str.maketrans({
    "А": "A", "Б": "B", "В": "V", "Г": "G", "Д": "D", "Е": "E", "Ё": "E", "Ж": "Zh", "З": "Z", "И": "I", "Й": "Y",
    "К": "K", "Л": "L", "М": "M", "Н": "N", "О": "O", "П": "P", "Р": "R", "С": "S", "Т": "T", "У": "U", "Ф": "F",
    "Х": "Kh", "Ц": "Ts", "Ч": "Ch", "Ш": "Sh", "Щ": "Sch", "Ъ": "", "Ы": "Y", "Ь": "", "Э": "E", "Ю": "Yu", "Я": "Ya",
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "e", "ж": "zh", "з": "z", "и": "i", "й": "y",
    "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f",
    "х": "kh", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sch", "ъ": "", "ы": "y", "ь": "", "э": "e", "ю": "yu", "я": "ya",
})


def compact_qr(value: str, length: int) -> str:
    return " ".join(value.translate(TRANSLIT).split())[:length].strip() or "-"


def final_work_qr(project_name: str, class_name: str, first_name: str, last_name: str, service_title: str, created_at: datetime) -> str:
    return "\n".join([
        "Vakha Studio",
        f"School: {compact_qr(project_name, 18)}",
        f"Class: {compact_qr(class_name, 8)}",
        f"Name: {compact_qr(f'{first_name} {last_name}', 18)}",
        f"Order: {compact_qr(service_title, 16)}",
        f"Date: {created_at.strftime('%d.%m.%Y')}",
    ])


def make_data_and_images() -> tuple[dict, list[dict]]:
    template_by_id, templates_by_gender = load_templates()
    projects_by_id: dict[str, dict] = {}
    classes: list[dict] = []
    students: list[dict] = []
    orders: list[dict] = []
    media: list[dict] = []
    final_works: list[dict] = []
    report_students: list[dict] = []
    portrait_hashes: set[str] = set()

    for class_index, class_spec in enumerate(CLASS_SPECS):
        sheet_path = SHEETS_DIR / class_spec["sheet"]
        if not sheet_path.exists():
            raise FileNotFoundError(f"Missing generated source sheet: {sheet_path}")
        cells = split_sheet(sheet_path)
        timestamp = RUN_AT + timedelta(hours=class_index * 2)
        projects_by_id.setdefault(class_spec["project_id"], {
            "id": class_spec["project_id"],
            "name": class_spec["project_name"],
            "templateId": "demo_checklist_template",
            "classSort": "numeric",
            "createdAt": iso(timestamp),
            "updatedAt": iso(timestamp),
            "createdBy": PHOTOGRAPHER_ID,
            "updatedBy": PHOTOGRAPHER_ID,
        })
        classes.append({
            "id": class_spec["class_id"],
            "projectId": class_spec["project_id"],
            "name": class_spec["class_name"],
            "orderIndex": class_index % 2,
            "color": ["blue", "green", "gold", "teal"][class_index],
            "createdAt": iso(timestamp),
            "updatedAt": iso(timestamp),
            "createdBy": PHOTOGRAPHER_ID,
            "updatedBy": PHOTOGRAPHER_ID,
        })
        gender_offsets = {"boy": 0, "girl": 0}
        class_service_ids: set[str] = set()

        for student_index, ((first_name, last_name), gender, source) in enumerate(zip(class_spec["students"], GRID_GENDERS, cells, strict=True), start=1):
            gender_index = gender_offsets[gender]
            gender_offsets[gender] += 1
            gender_pool = templates_by_gender[gender]
            template = gender_pool[(class_index * 5 + gender_index) % len(gender_pool)]
            if template["id"] in class_service_ids:
                raise RuntimeError(f"Duplicate service inside {class_spec['class_name']}: {template['id']}")
            class_service_ids.add(template["id"])
            student_id = f"demo_student_{class_spec['slug'].replace('-', '_')}_{student_index:02d}"
            media_id = f"demo_media_{class_spec['slug'].replace('-', '_')}_{student_index:02d}"
            final_id = f"demo_final_{class_spec['slug'].replace('-', '_')}_{student_index:02d}"
            source_file_name = f"{student_id}_source.jpg"
            result_file_name = f"{student_id}_{template['id']}_final.jpg"
            source_path = PORTRAITS_DIR / class_spec["slug"] / source_file_name
            result_path = RESULTS_DIR / class_spec["slug"] / result_file_name
            source_path.parent.mkdir(parents=True, exist_ok=True)
            source.save(source_path, "JPEG", quality=91, optimize=True, progressive=True)
            source_hash = sha256(source_path)
            if source_hash in portrait_hashes:
                raise RuntimeError(f"Duplicate source portrait detected: {source_path}")
            portrait_hashes.add(source_hash)
            neural_path = install_neural_montage(class_spec["slug"], student_id, template, result_path)
            created_at = timestamp + timedelta(minutes=student_index * 6)
            task_type = f"{template['id']}__portrait"
            payment_status = "paid" if (student_index + class_index) % 4 else "unpaid"
            comment = f"Выбран образ «{template['title']}». Нужен один готовый портрет."

            students.append({
                "id": student_id,
                "classId": class_spec["class_id"],
                "firstName": first_name,
                "lastName": last_name,
                "qrId": student_id,
                "catalogId": template["id"],
                "catalogIds": [template["id"]],
                "selectedServices": [{"serviceId": template["id"], "quantity": 1, "comment": comment}],
                "paymentStatus": payment_status,
                "orderStatus": "",
                "status": "",
                "createdAt": iso(created_at),
                "updatedAt": iso(created_at + timedelta(minutes=3)),
                "createdBy": PHOTOGRAPHER_ID,
                "updatedBy": PHOTOGRAPHER_ID,
            })
            orders.append({
                "id": f"order_{student_id}",
                "studentId": student_id,
                "catalogId": template["id"],
                "catalogIds": [template["id"]],
                "status": "",
                "items": [{
                    "type": task_type,
                    "label": f"{template['title']}: Портрет по шаблону",
                    "status": "done",
                    "fileIds": [media_id],
                    "completedAt": iso(created_at + timedelta(minutes=2)),
                    "completedBy": PHOTOGRAPHER_ID,
                }],
                "createdAt": iso(created_at),
                "updatedAt": iso(created_at + timedelta(minutes=3)),
                "createdBy": PHOTOGRAPHER_ID,
                "updatedBy": PHOTOGRAPHER_ID,
            })
            media.append({
                "id": media_id,
                "studentId": student_id,
                "type": "photo",
                "orderType": task_type,
                "fileName": source_file_name,
                "mimeType": "image/jpeg",
                "size": source_path.stat().st_size,
                "source": "capture",
                "createdAt": iso(created_at),
                "updatedAt": iso(created_at),
                "capturedAt": iso(created_at),
                "createdBy": PHOTOGRAPHER_ID,
                "updatedBy": PHOTOGRAPHER_ID,
                "capturedBy": PHOTOGRAPHER_ID,
            })
            qr_payload = final_work_qr(
                class_spec["project_name"], class_spec["class_name"], first_name, last_name, template["title"], created_at + timedelta(minutes=3)
            )
            final_works.append({
                "id": final_id,
                "projectId": class_spec["project_id"],
                "groupId": class_spec["class_id"],
                "studentId": student_id,
                "serviceId": template["id"],
                "title": template["title"],
                "fileName": result_file_name,
                "mimeType": "image/jpeg",
                "sourceMediaId": media_id,
                "referenceMediaId": f"{template['id']}_master",
                "resultMediaId": "",
                "printQrPayload": qr_payload,
                "processingMode": "gpt-image-identity-preserve",
                "finalImageVersion": 2,
                "status": "ready",
                "createdAt": iso(created_at + timedelta(minutes=3)),
                "updatedAt": iso(created_at + timedelta(minutes=3)),
                "createdBy": PHOTOGRAPHER_ID,
                "updatedBy": PHOTOGRAPHER_ID,
            })
            report_students.append({
                "projectId": class_spec["project_id"],
                "project": class_spec["project_name"],
                "classId": class_spec["class_id"],
                "class": class_spec["class_name"],
                "studentId": student_id,
                "name": f"{last_name} {first_name}",
                "gender": gender,
                "paymentStatus": payment_status,
                "serviceId": template["id"],
                "service": template["title"],
                "source": source_path.relative_to(FIXTURE_DIR).as_posix(),
                "result": result_path.relative_to(FIXTURE_DIR).as_posix(),
                "neuralSource": neural_path.relative_to(FIXTURE_DIR).as_posix(),
                "processingMode": "gpt-image-identity-preserve",
                "sourceSha256": source_hash,
                "resultSha256": sha256(result_path),
            })

        if len(class_service_ids) != 10:
            raise RuntimeError(f"Expected ten distinct services in {class_spec['class_name']}")

    data = {
        "operators": [{
            "id": PHOTOGRAPHER_ID,
            "name": "Тестовый фотограф",
            "code": "2026",
            "role": "photographer",
            "isActive": True,
            "createdAt": iso(RUN_AT),
            "updatedAt": iso(RUN_AT),
        }],
        "operatorEvents": [],
        "projects": list(projects_by_id.values()),
        "classes": classes,
        "students": students,
        "services": [],
        "orders": orders,
        "media": media,
        "finalWorks": final_works,
        "documents": [],
        "settings": [{"id": "spf-initialized", "value": True}],
        "checklistTemplates": [{
            "id": "demo_checklist_template",
            "name": "Полный тестовый чеклист",
            "items": ["portrait"],
            "labels": {"portrait": "Портрет по выбранному образу"},
            "scope": "default",
        }],
        "tasks": [],
        "statuses": [],
    }
    return data, report_students


def build_archive(data: dict, report_students: list[dict]) -> None:
    manifest = {
        "app": "Vakha Studio",
        "schemaVersion": 1,
        "exportType": "full_backup",
        "exportedAt": iso(RUN_AT + timedelta(hours=12)),
        "exportedBy": PHOTOGRAPHER_ID,
        "containsMedia": True,
        "fixture": "bachiyurt-mayrtup-full-photographer-demo",
    }
    by_student = {item["studentId"]: item for item in report_students}
    with zipfile.ZipFile(ARCHIVE_PATH, "w", compression=zipfile.ZIP_STORED, allowZip64=True) as archive:
        archive.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2))
        archive.writestr("data.json", json.dumps(data, ensure_ascii=False, indent=2))
        for media in data["media"]:
            report = by_student[media["studentId"]]
            source_path = FIXTURE_DIR / report["source"]
            archive.write(source_path, f"media/student_files/{media['id']}/{media['fileName']}")
        for work in data["finalWorks"]:
            report = by_student[work["studentId"]]
            result_path = FIXTURE_DIR / report["result"]
            archive.write(result_path, f"final_results/{work['id']}/{work['fileName']}")


def build_overview(report_students: list[dict]) -> None:
    columns = 5
    rows = math.ceil(len(report_students) / columns)
    card_width, card_height = 320, 205
    canvas = Image.new("RGB", (columns * card_width, rows * card_height), "#e2e8f0")
    class_colors = {
        "demo_class_bachiyurt_1a": "#2563eb",
        "demo_class_bachiyurt_2a": "#16a34a",
        "demo_class_mayrtup_1b": "#d97706",
        "demo_class_mayrtup_2b": "#0f766e",
    }
    for index, student in enumerate(report_students):
        x = (index % columns) * card_width
        y = (index // columns) * card_height
        card = Image.new("RGB", (card_width - 6, card_height - 6), "white")
        source = Image.open(FIXTURE_DIR / student["source"]).convert("RGB")
        result = Image.open(FIXTURE_DIR / student["result"]).convert("RGB")
        source_thumb = ImageOps.fit(source, (145, 170), Image.Resampling.LANCZOS, centering=(0.5, 0.43))
        result_thumb = ImageOps.fit(result, (145, 170), Image.Resampling.LANCZOS, centering=(0.5, 0.42))
        card.paste(source_thumb, (8, 27))
        card.paste(result_thumb, (161, 27))
        accent = Image.new("RGB", (card.width, 19), class_colors[student["classId"]])
        card.paste(accent, (0, 0))
        canvas.paste(card, (x + 3, y + 3))
    canvas.save(OVERVIEW_PATH, "JPEG", quality=88, optimize=True, progressive=True)


def build_report(report_students: list[dict], data: dict) -> None:
    counts = {
        "projects": len(data["projects"]),
        "classes": len(data["classes"]),
        "students": len(data["students"]),
        "sourceMedia": len(data["media"]),
        "finalWorks": len(data["finalWorks"]),
        "paid": sum(1 for item in data["students"] if item["paymentStatus"] == "paid"),
        "unpaid": sum(1 for item in data["students"] if item["paymentStatus"] != "paid"),
    }
    report_payload = {
        "fixture": "bachiyurt-mayrtup-full-photographer-demo",
        "generatedAt": iso(RUN_AT + timedelta(hours=12)),
        "syntheticPeopleOnly": True,
        "processingMode": "gpt-image-identity-preserve",
        "counts": counts,
        "archive": ARCHIVE_PATH.name,
        "overview": OVERVIEW_PATH.name,
        "students": report_students,
    }
    REPORT_JSON_PATH.write_text(json.dumps(report_payload, ensure_ascii=False, indent=2), encoding="utf-8")
    sections: list[str] = []
    for project in data["projects"]:
        class_sections: list[str] = []
        for class_item in [item for item in data["classes"] if item["projectId"] == project["id"]]:
            rows = []
            for student in [item for item in report_students if item["classId"] == class_item["id"]]:
                rows.append(f"""
                <article class="student-card">
                  <div class="student-heading">
                    <div><strong>{html.escape(student['name'])}</strong><span>{html.escape(student['service'])}</span></div>
                    <span class="status">Готово</span>
                  </div>
                  <div class="before-after">
                    <figure><a href="{html.escape(student['source'])}"><img src="{html.escape(student['source'])}" alt="Исходник {html.escape(student['name'])}"></a><figcaption>Исходное фото</figcaption></figure>
                    <div class="arrow" aria-hidden="true">→</div>
                    <figure><a href="{html.escape(student['result'])}"><img src="{html.escape(student['result'])}" alt="Результат {html.escape(student['service'])}"></a><figcaption>Готовая работа</figcaption></figure>
                  </div>
                  <div class="meta"><span>{'Оплачено' if student['paymentStatus'] == 'paid' else 'Не оплачено'}</span><code>{html.escape(student['serviceId'])}</code></div>
                </article>
                """)
            class_sections.append(f"""
              <section class="class-section">
                <div class="section-title"><h3>Класс {html.escape(class_item['name'])}</h3><span>10 детей · 10 исходников · 10 готовых</span></div>
                <div class="students">{''.join(rows)}</div>
              </section>
            """)
        sections.append(f"""
          <section class="project-section">
            <div class="project-title"><div><span>Проект</span><h2>{html.escape(project['name'])}</h2></div><strong>20 детей</strong></div>
            {''.join(class_sections)}
          </section>
        """)
    REPORT_PATH.write_text(f"""<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Полный прогон фотографа · Vakha Studio</title>
  <style>
    :root {{ color-scheme: light; font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background:#eef2f7; color:#132238; }}
    * {{ box-sizing:border-box; }} body {{ margin:0; }} a {{ color:inherit; }}
    .page {{ width:min(1500px, calc(100% - 28px)); margin:24px auto 80px; }}
    .hero {{ background:linear-gradient(135deg,#0f172a,#1d4ed8); color:white; border-radius:28px; padding:30px; box-shadow:0 20px 55px #0f172a26; }}
    .hero-top {{ display:flex; gap:18px; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; }}
    h1,h2,h3,p {{ margin:0; }} h1 {{ max-width:800px; font-size:clamp(28px,5vw,52px); line-height:1.02; }}
    .hero p {{ margin-top:14px; max-width:820px; color:#dbeafe; line-height:1.55; }}
    .actions {{ display:flex; gap:10px; flex-wrap:wrap; margin-top:22px; }} .button {{ padding:11px 15px; border-radius:12px; text-decoration:none; background:white; color:#1d4ed8; font-weight:800; }} .button.secondary {{ background:#ffffff1a; color:white; border:1px solid #ffffff47; }}
    .stats {{ display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); gap:10px; margin-top:24px; }} .stat {{ padding:14px; border:1px solid #ffffff35; border-radius:16px; background:#ffffff12; }} .stat strong {{ display:block; font-size:26px; }} .stat span {{ color:#dbeafe; font-size:13px; }}
    .notice {{ margin:18px 0; padding:15px 18px; border-radius:16px; background:#fffbeb; border:1px solid #fde68a; color:#854d0e; }}
    .method {{ margin:18px 0; padding:15px 18px; border-radius:16px; background:#ecfdf5; border:1px solid #86efac; color:#166534; }}
    .overview {{ display:block; width:100%; border-radius:22px; margin:18px 0 28px; box-shadow:0 12px 32px #0f172a20; }}
    .project-section {{ margin-top:28px; }} .project-title,.section-title {{ display:flex; align-items:end; justify-content:space-between; gap:14px; margin-bottom:14px; }} .project-title span,.section-title span {{ color:#64748b; }} .project-title h2 {{ font-size:30px; }}
    .class-section {{ background:white; border:1px solid #dbe3ee; border-radius:24px; padding:20px; margin-bottom:22px; box-shadow:0 10px 30px #0f172a0c; }}
    .students {{ display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }}
    .student-card {{ border:1px solid #e2e8f0; border-radius:18px; padding:14px; min-width:0; }} .student-heading,.meta {{ display:flex; align-items:center; justify-content:space-between; gap:10px; }} .student-heading div {{ min-width:0; }} .student-heading strong,.student-heading span {{ display:block; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }} .student-heading span {{ color:#64748b; font-size:13px; margin-top:3px; }}
    .status {{ flex:0 0 auto; padding:6px 9px; border-radius:999px; color:#166534!important; background:#dcfce7; font-weight:800; }}
    .before-after {{ display:grid; grid-template-columns:1fr 30px 1fr; align-items:center; gap:7px; margin-top:12px; }} figure {{ margin:0; }} figure img {{ display:block; width:100%; aspect-ratio:4/5; object-fit:cover; object-position:50% 35%; border-radius:13px; background:#e2e8f0; }} figcaption {{ margin-top:5px; color:#64748b; font-size:12px; text-align:center; }} .arrow {{ text-align:center; color:#2563eb; font-size:24px; font-weight:900; }}
    .meta {{ margin-top:10px; color:#475569; font-size:12px; }} code {{ max-width:62%; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:#334155; }}
    @media (max-width:900px) {{ .stats {{ grid-template-columns:repeat(3,1fr); }} .students {{ grid-template-columns:1fr; }} }}
    @media (max-width:520px) {{ .page {{ width:min(100% - 16px,1500px); margin-top:8px; }} .hero,.class-section {{ border-radius:18px; padding:16px; }} .stats {{ grid-template-columns:repeat(2,1fr); }} .project-title,.section-title {{ align-items:flex-start; flex-direction:column; }} .before-after {{ grid-template-columns:1fr 18px 1fr; }} }}
  </style>
</head>
<body><main class="page">
  <section class="hero">
    <div class="hero-top"><div><h1>Полный прогон работы фотографа</h1><p>Два школьных проекта, четыре класса и сорок завершённых заказов: от синтетического исходного портрета до реалистичного GPT-нейромонтажа по выбранному образу.</p></div></div>
    <div class="actions"><a class="button" href="../../index.html">Открыть CRM</a><a class="button secondary" href="{html.escape(ARCHIVE_PATH.name)}">Скачать архив для импорта</a><a class="button secondary" href="report.json">JSON-отчёт</a></div>
    <div class="stats">
      <div class="stat"><strong>{counts['projects']}</strong><span>проекта</span></div><div class="stat"><strong>{counts['classes']}</strong><span>класса</span></div><div class="stat"><strong>{counts['students']}</strong><span>детей</span></div><div class="stat"><strong>{counts['sourceMedia']}</strong><span>исходников</span></div><div class="stat"><strong>{counts['finalWorks']}</strong><span>готовых работ</span></div><div class="stat"><strong>100%</strong><span>чеклистов закрыто</span></div>
    </div>
  </section>
  <div class="method"><strong>Способ обработки:</strong> для каждой пары GPT отдельно получил исходный портрет ребёнка и нейрофото персонажа, перенёс идентичность ребёнка и согласовал линию волос, кожу, свет и тени. Локальная вклейка через face-mask не используется.</div>
  <div class="notice"><strong>Важно:</strong> все лица и ФИО в этом отчёте синтетические и созданы только для локального тестирования. Реальные данные детей не использовались.</div>
  <a href="{html.escape(OVERVIEW_PATH.name)}"><img class="overview" src="{html.escape(OVERVIEW_PATH.name)}" alt="Все 40 пар до и после"></a>
  {''.join(sections)}
</main></body></html>""", encoding="utf-8")


def validate_outputs(data: dict, report_students: list[dict]) -> None:
    expected = {"projects": 2, "classes": 4, "students": 40, "media": 40, "finalWorks": 40, "orders": 40}
    for key, value in expected.items():
        if len(data[key]) != value:
            raise RuntimeError(f"Expected {value} {key}, found {len(data[key])}")
    if len({item["name"] for item in report_students}) != 40:
        raise RuntimeError("Student names must be unique")
    if any(not (FIXTURE_DIR / item["source"]).exists() or not (FIXTURE_DIR / item["result"]).exists() for item in report_students):
        raise RuntimeError("A source or result image is missing")
    if any(item.get("processingMode") != "gpt-image-identity-preserve" for item in report_students):
        raise RuntimeError("Every final result must come from GPT identity-preserve editing")
    if any(not (FIXTURE_DIR / item["neuralSource"]).exists() for item in report_students):
        raise RuntimeError("A required GPT neural source is missing")
    with zipfile.ZipFile(ARCHIVE_PATH) as archive:
        names = set(archive.namelist())
        if not {"manifest.json", "data.json"}.issubset(names) or len(names) != 82:
            raise RuntimeError(f"Unexpected archive entries: {len(names)}")


def main() -> None:
    PORTRAITS_DIR.mkdir(parents=True, exist_ok=True)
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    data, report_students = make_data_and_images()
    build_archive(data, report_students)
    build_overview(report_students)
    build_report(report_students, data)
    validate_outputs(data, report_students)
    print(json.dumps({
        "projects": len(data["projects"]),
        "classes": len(data["classes"]),
        "students": len(data["students"]),
        "sourceMedia": len(data["media"]),
        "finalWorks": len(data["finalWorks"]),
        "archive": str(ARCHIVE_PATH),
        "report": str(REPORT_PATH),
        "overview": str(OVERVIEW_PATH),
    }, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
