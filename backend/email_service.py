"""Non-fatal SMTP notifications for completed pricing analyses."""

import asyncio
import html
import os
import smtplib
from email.message import EmailMessage
from pathlib import Path


def _send(
    to_email: str,
    company_name: str,
    company_id: str,
    session_id: str,
    pdf_path: str | None,
) -> bool:
    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    port = int(os.getenv("SMTP_PORT", "587"))
    user = os.getenv("SMTP_USER", "")
    password = os.getenv("SMTP_PASS", "")
    from_email = os.getenv("FROM_EMAIL", user)
    frontend = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")
    if not user or not password:
        print("[Email] SMTP not configured; notification skipped.")
        return False
    message = EmailMessage()
    message["Subject"] = f"PricePilot — Analysis complete for {company_name}"
    message["From"] = f"PricePilot <{from_email}>"
    message["To"] = to_email
    report_url = f"{frontend}/company/{company_id}/report/{session_id}"
    message.set_content(f"Your analysis for {company_name} is ready: {report_url}")
    message.add_alternative(
        f"""<html><body style="font-family:Arial;background:#0f1117;color:#e2e8f0;padding:32px">
        <div style="max-width:520px;margin:auto;background:#181c27;border-radius:12px;padding:28px">
        <h1 style="color:#7c6fff">PricePilot</h1><h2>Analysis complete ✓</h2>
        <p>Your pricing analysis for <strong>{html.escape(company_name)}</strong> is ready.</p>
        <a href="{report_url}" style="background:#7c6fff;color:white;padding:10px 22px;border-radius:8px;text-decoration:none">View Report →</a>
        </div></body></html>""",
        subtype="html",
    )
    if pdf_path and Path(pdf_path).is_file():
        message.add_attachment(
            Path(pdf_path).read_bytes(),
            maintype="application",
            subtype="pdf",
            filename=f"pricing-report-{session_id[:8]}.pdf",
        )
    with smtplib.SMTP(host, port, timeout=30) as server:
        server.starttls()
        server.login(user, password)
        server.send_message(message)
    return True


async def send_analysis_complete_email(
    to_email: str,
    company_name: str,
    company_id: str,
    session_id: str,
    pdf_path: str | None,
    current_mrr: float = 0,
    recommended_increase: str = "N/A",
) -> bool:
    try:
        return await asyncio.to_thread(
            _send, to_email, company_name, company_id, session_id, pdf_path
        )
    except Exception as error:
        print(f"[Email] Non-fatal SMTP failure: {error}")
        return False
