import smtplib
from email.message import EmailMessage
import ssl

SMTP_HOST = "smtp.gmail.com"     # or your SMTP provider
SMTP_PORT = 465                  # 587 for STARTTLS, 465 for SSL
SMTP_USER = "niloy.quazi.off@gmail.com"
SMTP_PASS = "gavp aaoa xbtx npsq"  # App password (not your Gmail password)

def send_email(to_email: str, subject: str, html_content: str):
    msg = EmailMessage()
    msg["Subject"] = subject
    msg["From"] = SMTP_USER
    msg["To"] = to_email
    msg.set_content("This is an HTML email. Please enable HTML view.")
    msg.add_alternative(html_content, subtype='html')

    context = ssl.create_default_context()
    with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
        server.login(SMTP_USER, SMTP_PASS)
        server.send_message(msg)
