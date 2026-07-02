"""Non-fatal SendGrid email notifications for completed pricing analyses."""

import asyncio
import html
import os
from pathlib import Path
import base64


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
            _send,
            to_email,
            company_name,
            company_id,
            session_id,
            pdf_path,
            current_mrr,
            recommended_increase,
        )
    except Exception as error:
        print(f"[Email] Non-fatal SendGrid failure: {error}")
        return False


def _send(
    to_email: str,
    company_name: str,
    company_id: str,
    session_id: str,
    pdf_path: str | None,
    current_mrr: float = 0,
    recommended_increase: str = "N/A",
) -> bool:
    api_key = os.getenv("SENDGRID_API_KEY", "")
    from_email = os.getenv("FROM_EMAIL", "")
    frontend = os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")

    if not api_key:
        print("[Email] SENDGRID_API_KEY not set; notification skipped.")
        return False

    if not from_email:
        print("[Email] FROM_EMAIL not set; notification skipped.")
        return False

    try:
        from sendgrid import SendGridAPIClient
        from sendgrid.helpers.mail import (
            Mail, Attachment, FileContent, FileName,
            FileType, Disposition
        )
    except ImportError:
        print("[Email] sendgrid package not installed. Run: pip install sendgrid")
        return False

    report_url = f"{frontend}/company/{company_id}/report/{session_id}"
    safe_name = html.escape(company_name)
    mrr_display = f"${current_mrr:,.2f}" if current_mrr else "N/A"

    html_content = f"""<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background:#0f1117;">
<table width="100%" cellpadding="0" cellspacing="0">
  <tr><td align="center" style="padding:40px 20px;">
    <table width="520" cellpadding="0" cellspacing="0"
           style="background:#181c27;border-radius:12px;border:1px solid #2a2f45;overflow:hidden;">

      <!-- Header -->
      <tr>
        <td style="background:linear-gradient(135deg,#667eea,#764ba2);padding:28px 32px;">
          <div style="font-size:20px;font-weight:700;color:#fff;">PricePilot</div>
          <div style="font-size:13px;color:rgba(255,255,255,0.75);margin-top:4px;">
            SaaS Pricing Analyzer
          </div>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="padding:28px 32px;">
          <h2 style="margin:0 0 8px 0;font-size:20px;color:#e2e8f0;">
            Analysis complete ✓
          </h2>
          <p style="margin:0 0 20px 0;font-size:14px;color:#94a3b8;line-height:1.6;">
            Your pricing analysis for
            <strong style="color:#e2e8f0;">{safe_name}</strong>
            has finished. Here's a quick summary:
          </p>

          <!-- Stats -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td width="48%" style="background:#16213e;border:1px solid #2a2f45;
                          border-radius:8px;padding:14px 16px;">
                <div style="font-size:11px;color:#64748b;text-transform:uppercase;
                            letter-spacing:0.08em;margin-bottom:4px;">Current MRR</div>
                <div style="font-size:22px;font-weight:700;color:#667eea;">{mrr_display}</div>
              </td>
              <td width="4%"></td>
              <td width="48%" style="background:#16213e;border:1px solid #2a2f45;
                          border-radius:8px;padding:14px 16px;">
                <div style="font-size:11px;color:#64748b;text-transform:uppercase;
                            letter-spacing:0.08em;margin-bottom:4px;">Recommended Increase</div>
                <div style="font-size:22px;font-weight:700;color:#22c55e;">
                  {html.escape(recommended_increase)}
                </div>
              </td>
            </tr>
          </table>

          <p style="margin:0 0 24px 0;font-size:13px;color:#94a3b8;line-height:1.6;">
            The full report includes revenue scenario modeling, feature placement audit,
            competitor benchmarking, and 3 alternative pricing strategies.
            {"<br><br><strong style='color:#e2e8f0;'>PDF report attached.</strong>"
              if pdf_path and Path(pdf_path).is_file() else ""}
          </p>

          <!-- CTA -->
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td style="background:#667eea;border-radius:8px;">
                <a href="{report_url}"
                   style="display:inline-block;padding:12px 28px;color:#fff;
                          font-size:14px;font-weight:600;text-decoration:none;">
                  View Full Report →
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:16px 32px;border-top:1px solid #2a2f45;">
          <p style="margin:0;font-size:11px;color:#475569;">
            You're receiving this because you ran an analysis on PricePilot.
            This is an automated notification.
          </p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>"""

    plain_text = (
        f"Your pricing analysis for {company_name} is ready.\n\n"
        f"Current MRR: {mrr_display}\n"
        f"Recommended price increase: {recommended_increase}\n\n"
        f"View full report: {report_url}"
    )

    message = Mail(
        from_email=from_email,
        to_emails=to_email,
        subject=f"PricePilot — Analysis complete for {company_name}",
        plain_text_content=plain_text,
        html_content=html_content,
    )

    # Attach PDF if it exists
    if pdf_path and Path(pdf_path).is_file():
        pdf_data = Path(pdf_path).read_bytes()
        encoded = base64.b64encode(pdf_data).decode()
        attachment = Attachment(
            FileContent(encoded),
            FileName(f"pricing-report-{company_name.replace(' ', '-')}-{session_id[:8]}.pdf"),
            FileType("application/pdf"),
            Disposition("attachment"),
        )
        message.attachment = attachment

    sg = SendGridAPIClient(api_key)
    response = sg.send(message)

    print(f"[Email] SendGrid response: {response.status_code} → {to_email}")

    if response.status_code in (200, 202):
        return True
    else:
        print(f"[Email] SendGrid error body: {response.body}")
        return False