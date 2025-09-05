import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
import asyncio


async def send_email(mail, solve, title, name):
    smtp_server = "smtp.mail.ru"
    smtp_port = 465  
    login = os.getenv('ADMIN_LOGIN')  
    password = os.getenv('ADMIN_MAIL_PASSWORD')

    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    
    templates_dir = os.path.join(base_dir, 'templates')

    msg = MIMEMultipart()
    msg['From'] = login
    msg['To'] = mail

    if solve:
        msg['Subject'] = f'Официальное предложение о работе на позицию \"{title}\"'
        template_path = os.path.join(templates_dir, 'approved.txt')
        with open(template_path, 'r', encoding='utf-8') as f:
            body = f.read()

    else:
        msg['Subject'] = f'Результаты рассмотрения вашей кандидатуры на позицию \"{title}\"'
        template_path = os.path.join(templates_dir, 'rejected.txt')
        with open(template_path, 'r', encoding='utf-8') as f:
            body = f.read()

    msg.attach(MIMEText(body, 'plain'))

    try:
        with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
            server.login(login, password)
            server.sendmail(login, msg["To"], msg.as_string())
    except Exception as e:
        return{
            'Error': f'Ошибка: {e}'
        }