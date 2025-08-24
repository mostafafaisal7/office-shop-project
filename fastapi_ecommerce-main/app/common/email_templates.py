from datetime import timedelta, datetime, timezone

def password_reset_email(name: str, reset_link: str) -> str:
    return f"""
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Password Reset</title>
        <style>
            body {{
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }}
            .container {{
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                padding: 20px 30px;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }}
            .header {{
                text-align: center;
                padding-bottom: 20px;
            }}
            .header img {{
                height: 50px;
            }}
            .title {{
                font-size: 24px;
                color: #333;
                margin-bottom: 20px;
            }}
            .content p {{
                font-size: 16px;
                color: #555;
                line-height: 1.6;
            }}
            .button {{
                display: inline-block;
                margin-top: 20px;
                padding: 12px 20px;
                background-color: #007bff;
                color: #fff;
                text-decoration: none;
                border-radius: 5px;
                font-weight: bold;
            }}
            .footer {{
                text-align: center;
                margin-top: 40px;
                font-size: 12px;
                color: #aaa;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <img src="https://yourdomain.com/logo.png" alt="Your Logo" />
            </div>
            <div class="title">Reset Your Password</div>
            <div class="content">
                <p>Hi {name},</p>
                <p>We received a request to reset your password. Click the button below to proceed:</p>
                <p style="text-align: center;">
                    <a href="{reset_link}" class="button">Reset Password</a>
                </p>
                <p>If you didn’t request this, just ignore this email — your password won’t change.</p>
                <p>This link will expire in 1 hour.</p>
            </div>
            <div class="footer">
                &copy; {datetime.now(timezone.utc).year} Your Company. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    """

def verification_email(name: str, link: str):
    return f"""
    <html>
        <body>
            <p>Hi {name},</p>
            <p>Click the link below to verify your email address:</p>
            <a href="{link}">Verify Email</a>
            <p>This link will expire in 24 hours.</p>
        </body>
    </html>
    """