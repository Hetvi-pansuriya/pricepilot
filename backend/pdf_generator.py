"""
PDF Generator — converts the full analysis report to a styled PDF using
WeasyPrint + Jinja2 HTML template.

WeasyPrint requires the GTK/Pango runtime on Windows. If not installed,
PDF generation is gracefully disabled (the rest of the API still works).
"""

import os
from datetime import datetime
from jinja2 import Template

# Lazy import — WeasyPrint needs GTK on Windows; fail gracefully if unavailable
try:
    import weasyprint
    WEASYPRINT_AVAILABLE = True
except (OSError, ImportError):
    weasyprint = None  # type: ignore
    WEASYPRINT_AVAILABLE = False

# Directory where PDFs are saved
PDF_DIR = os.path.join(os.path.dirname(__file__), "generated_pdfs")

# ─── HTML Template ────────────────────────────────────────────────────────────

_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SaaS Pricing Report — {{ company_name }}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Inter', sans-serif; color: #1a1a2e; background: #fff; font-size: 13px; line-height: 1.6; }

  /* Page */
  .page { padding: 32px 40px; }

  /* Header */
  .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 32px 40px; border-radius: 12px; margin-bottom: 28px; }
  .header h1 { font-size: 26px; font-weight: 700; margin-bottom: 4px; }
  .header .subtitle { font-size: 13px; opacity: 0.85; }
  .header .meta { margin-top: 12px; font-size: 12px; opacity: 0.7; }

  /* Section */
  .section { margin-bottom: 28px; }
  .section-title { font-size: 16px; font-weight: 700; color: #667eea; border-bottom: 2px solid #667eea; padding-bottom: 6px; margin-bottom: 14px; }

  /* Executive Summary */
  .exec-summary { background: #f0f4ff; border-left: 4px solid #667eea; padding: 16px 20px; border-radius: 0 8px 8px 0; font-size: 13px; color: #2d3748; }

  /* Tables */
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 12px; }
  th { background: #667eea; color: white; padding: 8px 12px; text-align: left; font-weight: 600; }
  td { padding: 7px 12px; border-bottom: 1px solid #e8ecf4; }
  tr:hover td { background: #f7f8fc; }
  .mrr-row td { font-weight: 600; background: #f0f4ff; }

  /* Feature classification colors */
  .tag { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; }
  .tag-gatekeeper { background: #ffe0e0; color: #c0392b; }
  .tag-blocker { background: #fff3e0; color: #e67e22; }
  .tag-right_placed { background: #e0f7e9; color: #27ae60; }
  .tag-undifferentiated { background: #e0eeff; color: #2980b9; }

  /* Strategy cards */
  .strategies { display: flex; gap: 28px; }
  .strategy-card { flex: 1; border-radius: 10px; padding: 16px; border: 1px solid #e0e7ff; }
  .strategy-card.conservative { border-top: 4px solid #27ae60; }
  .strategy-card.aggressive { border-top: 4px solid #e74c3c; }
  .strategy-card.strategic { border-top: 4px solid #9b59b6; }
  .strategy-card h3 { font-size: 14px; font-weight: 700; margin-bottom: 6px; }
  .mrr-change { font-size: 22px; font-weight: 700; }
  .conservative .mrr-change { color: #27ae60; }
  .aggressive .mrr-change { color: #e74c3c; }
  .strategic .mrr-change { color: #9b59b6; }
  .risk-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-bottom: 8px; }
  .risk-low { background: #e0f7e9; color: #27ae60; }
  .risk-medium { background: #fff3e0; color: #e67e22; }
  .risk-high { background: #ffe0e0; color: #c0392b; }
  .strategy-card p { font-size: 12px; color: #555; margin-bottom: 8px; }
  .strategy-card ul { padding-left: 16px; font-size: 11px; color: #444; }
  .strategy-card ul li { margin-bottom: 3px; }

  /* Tier structure table inside cards */
  .tier-table { width: 100%; font-size: 11px; border-collapse: collapse; margin-top: 8px; }
  .tier-table th { background: #f0f4ff; color: #667eea; padding: 5px 8px; }
  .tier-table td { padding: 5px 8px; border-bottom: 1px solid #eee; }

  /* Benchmark */
  .positioning { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: 700; font-size: 12px; margin-bottom: 8px; }
  .overpriced { background: #ffe0e0; color: #c0392b; }
  .underpriced { background: #e0f7e9; color: #27ae60; }
  .well_positioned { background: #e0eeff; color: #2980b9; }
  .unknown { background: #f0f0f0; color: #666; }

  .footer { margin-top: 32px; text-align: center; font-size: 11px; color: #aaa; border-top: 1px solid #eee; padding-top: 16px; }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <h1>SaaS Pricing Sensitivity Report</h1>
    <div class="subtitle">{{ company_name }} · {{ industry }}</div>
    <div class="meta">Generated on {{ generated_at }}</div>
  </div>

  <!-- Executive Summary -->
  {% if exec_summary %}
  <div class="section">
    <div class="section-title">Executive Summary</div>
    <div class="exec-summary">{{ exec_summary }}</div>
  </div>
  {% endif %}

  <!-- Module 1: Revenue Scenarios -->
  <div class="section">
    <div class="section-title">Revenue Scenario Analysis</div>
    <table>
      <thead>
        <tr>
          <th>Scenario</th>
          <th>Projected MRR</th>
          <th>User Loss %</th>
          <th>Net Change %</th>
        </tr>
      </thead>
      <tbody>
        <tr class="mrr-row">
          <td>Current (Baseline)</td>
          <td>${{ "%.2f"|format(current_mrr) }}</td>
          <td>—</td>
          <td>—</td>
        </tr>
        {% for scenario_name, data in scenarios.items() %}
        <tr>
          <td>{{ scenario_name }} Price Increase</td>
          <td>${{ "%.2f"|format(data.projected_mrr) }}</td>
          <td>{{ data.user_loss_pct }}%</td>
          <td>{{ "%+.1f"|format(data.net_change_pct) }}%</td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
    {% if recommended_increase %}
    <p style="margin-top:10px;font-size:12px;color:#667eea;font-weight:600;">
      ✓ Recommended: {{ recommended_increase }} — {{ m1_reasoning }}
    </p>
    {% endif %}
  </div>

  <!-- Module 2: Feature Audit -->
  {% if feature_audit %}
  <div class="section">
    <div class="section-title">Feature Placement Audit</div>
    <table>
      <thead>
        <tr>
          <th>Feature</th>
          <th>Current Tier</th>
          <th>Classification</th>
          <th>Recommended Action</th>
        </tr>
      </thead>
      <tbody>
        {% for item in feature_audit %}
        <tr>
          <td>{{ item.feature_name }}</td>
          <td>{{ item.tier_name }}</td>
          <td><span class="tag tag-{{ item.classification }}">{{ item.classification }}</span></td>
          <td>{{ item.recommended_action }}</td>
        </tr>
        {% endfor %}
      </tbody>
    </table>
    {% if audit_summary %}
    <p style="margin-top:8px;font-size:12px;color:#e74c3c;">⚠ {{ audit_summary.biggest_issue }}</p>
    {% endif %}
  </div>
  {% endif %}

  <!-- Module 3: Benchmark -->
  <div class="section">
    <div class="section-title">Competitor Benchmark</div>
    {% if positioning %}
    <span class="positioning {{ positioning }}">{{ positioning | upper | replace('_', ' ') }}</span>
    {% endif %}
    <p style="font-size:12px;margin-bottom:8px;">{{ price_vs_market }}</p>

    {% if features_we_lack %}
    <p style="font-size:12px;font-weight:600;margin-bottom:4px;">Features We Are Missing:</p>
    <ul style="font-size:11px;padding-left:16px;color:#c0392b;">
      {% for f in features_we_lack %}<li>{{ f }}</li>{% endfor %}
    </ul>
    {% endif %}

    {% if features_we_have %}
    <p style="font-size:12px;font-weight:600;margin-top:8px;margin-bottom:4px;">Our Unique Differentiators:</p>
    <ul style="font-size:11px;padding-left:16px;color:#27ae60;">
      {% for f in features_we_have %}<li>{{ f }}</li>{% endfor %}
    </ul>
    {% endif %}
  </div>

  <!-- Module 4: Strategies -->
  {% if strategies %}
  <div class="section">
    <div class="section-title">Recommended Pricing Strategies</div>
    <div class="strategies">
      {% for strat in strategies %}
      <div class="strategy-card {{ strat.type }}">
        <h3>{{ strat.name }}</h3>
        <div class="mrr-change">+{{ strat.predicted_mrr_change_pct }}%</div>
        <span class="risk-badge risk-{{ strat.risk_level }}">{{ strat.risk_level | upper }} RISK</span>
        <p>{{ strat.reasoning }}</p>

        {% if strat.new_tier_structure %}
        <table class="tier-table">
          <thead><tr><th>Tier</th><th>Price</th><th>Target</th></tr></thead>
          <tbody>
            {% for tier in strat.new_tier_structure %}
            <tr>
              <td>{{ tier.name }}</td>
              <td>${{ tier.price }}</td>
              <td>{{ tier.target_customer }}</td>
            </tr>
            {% endfor %}
          </tbody>
        </table>
        {% endif %}

        {% if strat.implementation_steps %}
        <p style="margin-top:8px;font-weight:600;font-size:11px;">Steps:</p>
        <ul>
          {% for step in strat.implementation_steps %}<li>{{ step }}</li>{% endfor %}
        </ul>
        {% endif %}
      </div>
      {% endfor %}
    </div>
  </div>
  {% endif %}

  <div class="footer">
    Generated by SaaS Pricing Analyzer · {{ generated_at }} · Confidential
  </div>
</div>
</body>
</html>"""


# ─── Generator ────────────────────────────────────────────────────────────────

def generate_pdf(report_data: dict, session_id: str) -> str:
    """
    Render report_data as HTML using Jinja2, convert to PDF via WeasyPrint.
    Returns the path to the saved PDF file.
    Raises RuntimeError if WeasyPrint/GTK is not available on this system.
    """
    if not WEASYPRINT_AVAILABLE:
        raise RuntimeError(
            "WeasyPrint is not available. On Windows, install the GTK runtime from "
            "https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer"
        )

    os.makedirs(PDF_DIR, exist_ok=True)

    company = report_data.get("company", {})
    m1 = report_data.get("module1_revenue", {})
    m2 = report_data.get("module2_features", {})
    m3 = report_data.get("module3_benchmark", {})
    m4 = report_data.get("module4_recommendations", {})

    benchmark = m3.get("benchmark", {})

    # Build template context
    context = {
        "company_name": company.get("name", "Unknown"),
        "industry": company.get("industry", "Unknown"),
        "generated_at": report_data.get(
            "generated_at",
            datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC"),
        ),
        # M1
        "current_mrr": m1.get("current_mrr", 0),
        "scenarios": m1.get("scenarios", {}),
        "recommended_increase": m1.get("recommended_increase", ""),
        "m1_reasoning": m1.get("reasoning", ""),
        # M2
        "feature_audit": m2.get("feature_audit", []),
        "audit_summary": m2.get("summary"),
        # M3
        "positioning": benchmark.get("positioning", "unknown"),
        "price_vs_market": benchmark.get("price_vs_market", ""),
        "features_we_lack": benchmark.get("features_we_lack", []),
        "features_we_have": benchmark.get("features_we_uniquely_have", []),
        # M4
        "exec_summary": m4.get("executive_summary", ""),
        "strategies": m4.get("strategies", []),
    }

    template = Template(_HTML_TEMPLATE)
    html_str = template.render(**context)

    pdf_path = os.path.join(PDF_DIR, f"{session_id}.pdf")
    weasyprint.HTML(string=html_str).write_pdf(pdf_path)

    return pdf_path

