#!/usr/bin/env python3
"""Build the 40 A4 child portrait templates generated for the 2026 catalog set."""

from __future__ import annotations

import json
import subprocess
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
GENERATED = Path.home() / ".codex/generated_images/019ff733-a982-70a2-be91-78381671d90a"
OUTPUT = ROOT / "assets/templates/children"
BUILDER = ROOT / "scripts/build-child-template-assets.py"

ITEMS = [
    ("child-boy-chechen-mosque-dawn", "exec-93b833e5-7dca-430d-8057-a9e681b66ca2.png", "boy", "У мечети на рассвете", 0.50, 0.275, 0.175, 0.155),
    ("child-boy-chechen-stone-tower", "exec-fba75d92-ba25-4d0b-b7a4-82009e685212.png", "boy", "У древней башни", 0.50, 0.275, 0.175, 0.155),
    ("child-boy-chechen-wolf-guardian", "exec-fdd9940b-c3e7-47be-906d-41754f0cedab.png", "boy", "Страж гор и волк", 0.50, 0.275, 0.175, 0.155),
    ("child-boy-chechen-horse-valley", "exec-d5e928ad-af61-41ce-8884-8dd72ba1532c.png", "boy", "Джигит с конём", 0.50, 0.275, 0.175, 0.155),
    ("child-boy-chechen-fortress-sunset", "exec-d28b4557-1c25-4829-9e12-49b71bb3c0bd.png", "boy", "Крепость на закате", 0.50, 0.275, 0.175, 0.155),
    ("child-boy-chechen-waterfall", "exec-cec570c3-0eda-4adb-a8d8-1cdcd2497b32.png", "boy", "У горного водопада", 0.50, 0.275, 0.175, 0.155),
    ("child-boy-winter-cadet", "exec-0c431f47-7d8b-4fc7-af8f-93b5f63b9957.png", "boy", "Зимний кадет", 0.50, 0.235, 0.170, 0.150),
    ("child-boy-rescue-unit", "exec-79fb6157-b9f9-4fe2-b1a2-49925d936408.png", "boy", "Горный спасатель", 0.50, 0.235, 0.170, 0.150),
    ("child-boy-field-observer", "exec-65338033-5995-4027-8e05-0fbd55b7e88c.png", "boy", "Полевой наблюдатель", 0.50, 0.235, 0.170, 0.150),
    ("child-boy-rescue-helicopter-pilot", "exec-e08b7183-a335-4b91-a2ad-84257f615e0c.png", "boy", "Пилот спасательной службы", 0.50, 0.235, 0.170, 0.150),
    ("child-boy-solar-cape-guardian", "exec-e38a9c45-7e6f-4953-ac87-376643ca3cf5.png", "boy", "Солнечный страж", 0.36, 0.270, 0.170, 0.150),
    ("child-boy-emerald-giant-friend", "exec-80190fdd-c341-4aaa-8757-eb4f6aa0bd58.png", "boy", "Изумрудный великан", 0.36, 0.270, 0.170, 0.150),
    ("child-boy-iron-tech-guardian", "exec-4638b848-5cff-4db2-941d-e208dbc532fa.png", "boy", "Железный техностраж", 0.36, 0.270, 0.170, 0.150),
    ("child-boy-thunder-guardian", "exec-5ff5eb0d-2fbf-4e21-a1af-30640acd4cbb.png", "boy", "Громовой защитник", 0.36, 0.270, 0.170, 0.150),
    ("child-boy-speed-hedgehog-friend", "exec-00cba631-4807-431f-b1c9-cade80726351.png", "boy", "Скоростной синий друг", 0.36, 0.270, 0.170, 0.150),
    ("child-boy-night-wing-guardian", "exec-a50e4142-b687-4d9c-ab1f-baae5b1ba177.png", "boy", "Ночной крылатый страж", 0.36, 0.270, 0.170, 0.150),
    ("child-boy-ninja-turtle-friend", "exec-33984dad-8635-43e2-a2b5-e6a0471ea367.png", "boy", "Черепаха-исследователь", 0.36, 0.270, 0.170, 0.150),
    ("child-boy-robot-lion-pilot", "exec-9cf3bd47-3e5b-4b6e-9e75-1f18563fff0a.png", "boy", "Белый робот-лев", 0.36, 0.270, 0.170, 0.150),
    ("child-boy-cosmic-ranger-friend", "exec-5a15395f-ad36-471a-87f8-7667c6f6ea29.png", "boy", "Космический рейнджер", 0.36, 0.270, 0.170, 0.150),
    ("child-boy-city-hero-shield", "exec-bd2df06b-8c1d-45ce-92e5-1e36d59dd318.png", "boy", "Герой энергетического щита", 0.36, 0.270, 0.170, 0.150),
    ("child-girl-chechen-mosque-garden", "exec-dc4a101a-8b3b-470e-8eaf-2559c84c3789.png", "girl", "В саду у мечети", 0.50, 0.275, 0.175, 0.155),
    ("child-girl-chechen-stone-tower", "exec-7410e95f-be88-47d5-b31c-63e1bf071721.png", "girl", "Девочка у башни", 0.50, 0.275, 0.175, 0.155),
    ("child-girl-chechen-wolf-companion", "exec-1cba9376-8baa-401e-a8ef-680bad62449d.png", "girl", "Хозяйка гор и волк", 0.50, 0.275, 0.175, 0.155),
    ("child-girl-chechen-waterfall", "exec-5b36b555-209c-47fd-96d1-38684041c32c.png", "girl", "У водопада в белом", 0.50, 0.275, 0.175, 0.155),
    ("child-girl-sun-tower-princess", "exec-1011e201-1f7d-4517-b71b-476b4c1b1a76.png", "girl", "Златовласка с фонарём", 0.36, 0.270, 0.170, 0.150),
    ("child-girl-forest-apple-princess", "exec-d14ef42c-9406-462e-9351-0616c675142f.png", "girl", "Принцесса леса и яблок", 0.36, 0.270, 0.170, 0.150),
    ("child-girl-highland-archer-princess", "exec-ed8cc553-fcab-40b1-910a-b0bacf6f18e4.png", "girl", "Рыжая принцесса гор", 0.36, 0.270, 0.170, 0.150),
    ("child-girl-rose-princess-beast", "exec-307a70a1-26b2-41c4-92a9-f4492293be08.png", "girl", "Красавица и добрый зверь", 0.36, 0.270, 0.170, 0.150),
    ("child-girl-glass-slipper-princess", "exec-48402fd5-76c9-4189-be89-1f59bf4a80a4.png", "girl", "Принцесса хрустальной туфельки", 0.36, 0.270, 0.170, 0.150),
    ("child-girl-coral-sea-princess", "exec-ef370eb5-a013-4174-b20b-e8c7d6b7b256.png", "girl", "Коралловая морская принцесса", 0.36, 0.270, 0.170, 0.150),
    ("child-girl-ocean-wayfinder", "exec-daff51ce-7843-4705-a04e-844414662084.png", "girl", "Океанская путешественница", 0.36, 0.270, 0.170, 0.150),
    ("child-girl-northern-crystal-queen", "exec-02a54273-db49-41b3-920f-9bb339d725e8.png", "girl", "Северная кристальная королева", 0.36, 0.270, 0.170, 0.150),
    ("child-girl-moon-warrior-princess", "exec-d49d8af1-2472-416f-9089-374636d75fef.png", "girl", "Лунная принцесса-воительница", 0.36, 0.270, 0.170, 0.150),
    ("child-girl-desert-palace-princess", "exec-3aecf968-b418-415c-b60f-9b09580dc887.png", "girl", "Принцесса пустынного дворца", 0.36, 0.270, 0.170, 0.150),
    ("child-girl-star-cape-heroine", "exec-7397c44c-922c-4458-84a4-22b731e20393.png", "girl", "Звёздная героиня", 0.36, 0.270, 0.170, 0.150),
    ("child-girl-sun-shield-heroine", "exec-ae047bd5-170f-4d12-a322-2ded59df3c93.png", "girl", "Героиня солнечного щита", 0.36, 0.270, 0.170, 0.150),
    ("child-girl-ladybird-heroine", "exec-c99a4109-0bda-493a-a03b-925da4dd89f5.png", "girl", "Героиня удачи", 0.36, 0.270, 0.170, 0.150),
    ("child-girl-bear-forest-friend", "exec-77375724-dbff-40d9-bd7e-69507b90eaa6.png", "girl", "Добрый лесной медведь", 0.36, 0.270, 0.170, 0.150),
    ("child-girl-fashion-dream-friend", "exec-f686751a-7ba6-4ee8-8627-30d08164e5b4.png", "girl", "Модная мечта", 0.36, 0.270, 0.170, 0.150),
    ("child-girl-butterfly-fairy-mentor", "exec-e43df7e7-6ca8-4eb7-bd31-701469ace6b9.png", "girl", "Фея-бабочка", 0.36, 0.270, 0.170, 0.150),
]


def main() -> None:
    for template_id, source_name, gender, title, center_x, center_y, face_width, face_height in ITEMS:
        source = GENERATED / source_name
        if not source.is_file():
            raise FileNotFoundError(source)
        with Image.open(source) as generated_image:
            source_width, source_height = generated_image.size
        output_dir = OUTPUT / template_id
        subprocess.run(
            [
                "python3", str(BUILDER), str(source), str(output_dir), "--canvas", "a4",
                "--center-x", str(center_x), "--center-y", str(center_y),
                "--face-width", str(face_width), "--face-height", str(face_height),
            ],
            check=True,
        )
        metadata = {
            "id": template_id,
            "title": title,
            "gender": gender,
            "masterSrc": f"./assets/templates/children/{template_id}/master.jpg",
            "previewSrc": f"./assets/templates/children/{template_id}/preview.webp",
            "faceMaskSrc": f"./assets/templates/children/{template_id}/face-mask.png",
            "metadataSrc": f"./assets/templates/children/{template_id}/metadata.json",
            "faceGuide": {
                "centerX": center_x, "centerY": center_y,
                "width": face_width, "height": face_height, "feather": 0.018,
            },
            "canvas": {
                "format": "A4", "orientation": "portrait", "width": 2480, "height": 3508,
                "previewWidth": 600, "previewHeight": 849, "dpi": 300, "masterFile": "master.jpg",
            },
            "printFormat": "A4",
            "enabled": True,
            "version": 3,
            "aiAdapter": "face-swap-v1",
            "sourceGenerationSize": {"width": source_width, "height": source_height},
            "masterPreparation": "lanczos-upscale-and-a4-crop",
        }
        (output_dir / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Built {len(ITEMS)} A4 templates in {OUTPUT}")


if __name__ == "__main__":
    main()
