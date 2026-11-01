"""One-time administrator provisioning. Secret is written to a private file, never logs."""
import json, os, secrets, sys
from pathlib import Path
from app import db, password_hash

output=Path(sys.argv[1])
with db() as c:
    if c.execute("SELECT 1 FROM users WHERE role='admin' AND active=1").fetchone():
        raise SystemExit('Administrator already exists; use account management')
    password=secrets.token_urlsafe(24)
    c.execute('INSERT INTO users VALUES(?,?,?,?,?,1)',(secrets.token_hex(16),'owner','Владелец','admin',password_hash(password)))
    fd=os.open(output,os.O_WRONLY|os.O_CREAT|os.O_EXCL,0o600)
    with os.fdopen(fd,'w') as f: f.write('Адрес: https://crm.khanzama.ru\nЛогин: owner\nПароль: '+password+'\n\nПосле входа: Сервер → Сменить пароль. Не отправляйте этот файл сотрудникам.\n')
print('Administrator created; credentials saved to private file')
