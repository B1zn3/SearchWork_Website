import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import aiofiles
from pathlib import Path

async def send_email_async(mail, solve, name, login):
    smtp_server = "smtp.mail.ru"
    smtp_port = 465
    password = os.getenv('ADMIN_MAIL_PASSWORD')

    base_dir = Path(__file__).parent.parent
    templates_dir = base_dir / 'templates' / 'email_template'

    msg = MIMEMultipart()
    msg['From'] = login
    msg['To'] = mail

    if solve:
        msg['Subject'] = f'Собеседование. Здравствуйте, {name}!'
        template_path = templates_dir / 'approved.txt'
    else:
        msg['Subject'] = f'Отказ. Здравствуйте, {name}!'
        template_path = templates_dir / 'rejected.txt'

    async with aiofiles.open(template_path, 'r', encoding='utf-8') as f:
        body = await f.read()
    
    msg.attach(MIMEText(body, 'plain'))

    try:
        await aiosmtplib.send(
            msg,
            hostname=smtp_server,
            port=smtp_port,
            username=login,
            password=password,
            use_tls=True
        )
        return {"status": "success", "message": "Email sent successfully"}
    except Exception as e:
        return {"status": "error", "message": f"Ошибка отправки email: {str(e)}"}