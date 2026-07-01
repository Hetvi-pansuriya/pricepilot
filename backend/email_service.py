"""Send analysis-complete emails through Resend without blocking analysis."""

import asyncio
import base64
import html
import os
from pathlib import Path
from dotenv import load_dotenv

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

try:
    import resend
except ImportError:
    resend = None

FROM_EMAIL = os.getenv("EMAIL_FROM", "noreply@pricepilot.app")
APP_URL = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")


def _build_html(
    company_name: str,
    company_id: str,
    session_id: str,
    current_mrr: float,
    recommended: str,
) -> str:
    safe_company = html.escape(company_name)
    safe_recommended = html.escape(str(recommended))
    report_url = f"{APP_URL}/company/{company_id}/report/{session_id}"
    return f"""<!doctype html>
<html>
<body style="font-family:Arial,sans-serif;background:#f5f6fa;padding:32px 16px">
  <main style="max-width:560px;margin:auto;background:#fff;border-radius:12px;overflow:hidden">
    <header style="background:#667eea;padding:32px;text-align:center;color:#fff">
      <h1 style="margin:0">PricePilot</h1>
      <p style="color:#fff">Your pricing analysis is ready</p>
    </header>
    <section style="padding:32px;color:#4a5568;line-height:1.6">
      <p>Your pricing sensitivity analysis for <strong>{safe_company}</strong> has completed.</p>
      <p><strong>Current MRR:</strong> ${current_mrr:,.0f}<br>
      <strong>Recommended increase:</strong> {safe_recommended}</p>
      <p>The PDF report is attached when available.</p>
      <a href="{report_url}" style="display:block;background:#667eea;color:#fff;text-align:center;padding:14px;border-radius:8px;text-decoration:none">View Full Report →</a>
    </section>
  </main>
</body>
</html>"""


async def send_analysis_complete_email(
    to_email: str,
    company_name: str,
    company_id: str,
    session_id: str,
    pdf_path: str | None,
    current_mrr: float = 0,
    recommended_increase: str = "N/A",
) -> bool:
    api_key = os.getenv("RESEND_API_KEY", "")
    if resend is None or not api_key:
        print("[Email] RESEND_API_KEY not configured; notification skipped.")
        return False

    try:
        resend.api_key = api_key
        params = {
            "from": os.getenv("EMAIL_FROM", FROM_EMAIL),
            "to": [to_email],
            "subject": f"Analysis complete: {company_name} — PricePilot",
            "html": _build_html(
                company_name,
                company_id,
                session_id,
                current_mrr,
                recommended_increase,
            ),
        }
        if pdf_path and Path(pdf_path).is_file():
            params["attachments"] = [
                {
                    "filename": f"pricing-report-{session_id[:8]}.pdf",
                    "content": base64.b64encode(Path(pdf_path).read_bytes()).decode(),
                }
            ]
        await asyncio.to_thread(resend.Emails.send, params)
        print(f"[Email] Analysis notification sent to {to_email}.")
        return True
    except Exception as error:
        print(f"[Email] Non-fatal send failure: {error}")
        return False
