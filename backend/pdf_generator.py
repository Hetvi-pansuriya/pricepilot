"""
PDF Generator — converts the full analysis report to a styled PDF using
WeasyPrint + Jinja2 HTML template.

Color palette matches the PricePilot UI:
  Background:  #0f0f1a  (page bg)
  Surface:     #1a1a2e  (cards)
  Surface-2:   #16213e  (inner cards)
  Accent:      #667eea  (primary purple-blue)
  Accent-2:    #764ba2  (secondary purple)
  Text:        #e2e8f0
  Muted:       #94a3b8
  Success:     #22c55e
  Warning:     #f59e0b
  Danger:      #ef4444
  Border:      #2a2f45
"""

import os
from datetime import datetime
from jinja2 import Template

try:
    import weasyprint
    WEASYPRINT_AVAILABLE = True
except (OSError, ImportError):
    weasyprint = None
    WEASYPRINT_AVAILABLE = False

PDF_DIR = os.path.join(os.path.dirname(__file__), "generated_pdfs")

_HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>SaaS Pricing Report — {{ company_name }}</title>
<style>

/* ── Reset ── */
* { box-sizing: border-box; margin: 0; padding: 0; }

/* ── Page setup ── */
@page {
  size: A4;
  margin: 0;
}

body {
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 12px;
  line-height: 1.6;
  color: #e2e8f0;
  background: #0f0f1a;
}

/* ── Outer wrapper ── */
.document {
  width: 100%;
  background: #0f0f1a;
  padding: 0;
}

/* ── Cover / Header ── */
.cover {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 48px 48px 40px 48px;
  position: relative;
}

.cover-logo {
  font-size: 13px;
  font-weight: 700;
  color: rgba(255,255,255,0.7);
  letter-spacing: 0.12em;
  text-transform: uppercase;
  margin-bottom: 32px;
}

.cover-title {
  font-size: 30px;
  font-weight: 800;
  color: #ffffff;
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.cover-subtitle {
  font-size: 14px;
  color: rgba(255,255,255,0.75);
  margin-bottom: 32px;
}

.cover-meta-row {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
}

.cover-meta-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.cover-meta-label {
  font-size: 10px;
  color: rgba(255,255,255,0.55);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.cover-meta-value {
  font-size: 13px;
  color: #ffffff;
  font-weight: 600;
}

/* ── Page body ── */
.body {
  padding: 36px 48px 48px 48px;
  background: #0f0f1a;
}

/* ── Section ── */
.section {
  margin-bottom: 36px;
}

.section-title {
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #667eea;
  margin-bottom: 14px;
  padding-bottom: 8px;
  border-bottom: 1px solid #2a2f45;
}

/* ── Executive Summary ── */
.exec-card {
  background: #1a1a2e;
  border: 1px solid #2a2f45;
  border-left: 4px solid #667eea;
  border-radius: 8px;
  padding: 20px 24px;
  font-size: 13px;
  color: #cbd5e1;
  line-height: 1.75;
}

/* ── MRR Table ── */
.table-wrap {
  background: #1a1a2e;
  border: 1px solid #2a2f45;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 12px;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

thead th {
  background: #16213e;
  color: #94a3b8;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 10px 16px;
  text-align: left;
  border-bottom: 1px solid #2a2f45;
}

tbody td {
  padding: 10px 16px;
  color: #e2e8f0;
  border-bottom: 1px solid #1e2538;
  vertical-align: middle;
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:nth-child(even) td {
  background: rgba(255,255,255,0.02);
}

.row-baseline td {
  font-weight: 700;
  color: #ffffff;
  background: rgba(102,126,234,0.08) !important;
}

.row-recommended td {
  background: rgba(102,126,234,0.12) !important;
  color: #a5b4fc;
  font-weight: 600;
}

.recommended-note {
  font-size: 11px;
  color: #818cf8;
  font-weight: 600;
  margin-top: 8px;
  padding: 10px 14px;
  background: rgba(102,126,234,0.1);
  border-radius: 6px;
  border-left: 3px solid #667eea;
}

/* ── Tags ── */
.tag {
  display: inline-block;
  padding: 3px 9px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  white-space: nowrap;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.tag-gatekeeper       { background: rgba(239,68,68,0.15);  color: #f87171; }
.tag-blocker          { background: rgba(245,158,11,0.15); color: #fbbf24; }
.tag-right_placed     { background: rgba(34,197,94,0.15);  color: #4ade80; }
.tag-undifferentiated { background: rgba(99,102,241,0.15); color: #a5b4fc; }
.tag-unknown          { background: rgba(148,163,184,0.15);color: #94a3b8; }

/* ── Benchmark ── */
.positioning-badge {
  display: inline-block;
  padding: 5px 16px;
  border-radius: 20px;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 12px;
}
.pos-overpriced      { background: rgba(239,68,68,0.15);  color: #f87171; border: 1px solid rgba(239,68,68,0.3); }
.pos-underpriced     { background: rgba(34,197,94,0.15);  color: #4ade80; border: 1px solid rgba(34,197,94,0.3); }
.pos-well_positioned { background: rgba(99,102,241,0.15); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.3); }
.pos-competitive     { background: rgba(99,102,241,0.15); color: #a5b4fc; border: 1px solid rgba(99,102,241,0.3); }
.pos-unknown         { background: rgba(148,163,184,0.15);color: #94a3b8; }

.price-vs-market {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.65;
  margin-bottom: 16px;
  background: #1a1a2e;
  border: 1px solid #2a2f45;
  border-radius: 8px;
  padding: 14px 18px;
}

.bench-two-col {
  display: table;
  width: 100%;
  border-spacing: 12px 0;
}

.bench-col {
  display: table-cell;
  width: 50%;
  vertical-align: top;
  background: #1a1a2e;
  border: 1px solid #2a2f45;
  border-radius: 8px;
  padding: 14px 16px;
}

.bench-col-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: 10px;
}

.bench-col-title.missing  { color: #f87171; }
.bench-col-title.unique   { color: #4ade80; }

.bench-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.bench-list li {
  font-size: 11px;
  padding: 4px 0;
  border-bottom: 1px solid #1e2538;
  color: #cbd5e1;
  display: flex;
  align-items: flex-start;
  gap: 6px;
}

.bench-list li:last-child { border-bottom: none; }

.bench-dot-miss { color: #f87171; font-size: 14px; line-height: 1; }
.bench-dot-uniq { color: #4ade80; font-size: 14px; line-height: 1; }

/* ── Strategy cards — stacked, page-break-safe ── */
.strategy-card {
  background: #1a1a2e;
  border: 1px solid #2a2f45;
  border-radius: 10px;
  padding: 20px 24px;
  margin-bottom: 16px;
  page-break-inside: avoid;
}

.strategy-card.conservative { border-top: 3px solid #22c55e; }
.strategy-card.aggressive   { border-top: 3px solid #ef4444; }
.strategy-card.strategic    { border-top: 3px solid #a855f7; }

.strategy-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 12px;
}

.strategy-mrr {
  font-size: 28px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
}
.conservative .strategy-mrr { color: #22c55e; }
.aggressive   .strategy-mrr { color: #ef4444; }
.strategic    .strategy-mrr { color: #a855f7; }

.strategy-header-right {
  flex: 1;
}

.strategy-name {
  font-size: 15px;
  font-weight: 700;
  color: #ffffff;
  margin-bottom: 4px;
}

.risk-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.risk-low    { background: rgba(34,197,94,0.15);  color: #4ade80; }
.risk-medium { background: rgba(245,158,11,0.15); color: #fbbf24; }
.risk-high   { background: rgba(239,68,68,0.15);  color: #f87171; }

.strategy-reasoning {
  font-size: 12px;
  color: #94a3b8;
  line-height: 1.65;
  margin-bottom: 14px;
}

.strategy-tiers-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #64748b;
  margin-bottom: 8px;
}

.tier-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 14px;
}

.tier-pill {
  background: #16213e;
  border: 1px solid #2a2f45;
  border-radius: 8px;
  padding: 8px 14px;
}

.tier-pill-name {
  font-size: 12px;
  font-weight: 700;
  color: #e2e8f0;
  margin-bottom: 2px;
}

.tier-pill-price {
  font-size: 14px;
  font-weight: 800;
  color: #667eea;
  margin-bottom: 2px;
}

.tier-pill-target {
  font-size: 10px;
  color: #64748b;
}

.steps-title {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: #64748b;
  margin-bottom: 6px;
}

.steps-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.steps-list li {
  font-size: 11px;
  color: #94a3b8;
  padding: 3px 0 3px 16px;
  position: relative;
  border-bottom: 1px solid #1e2538;
}

.steps-list li:last-child { border-bottom: none; }

.steps-list li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: #667eea;
}

/* ── Footer ── */
.footer {
  background: #0a0a14;
  border-top: 1px solid #1e2538;
  padding: 16px 48px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 10px;
  color: #475569;
}

.footer-brand {
  font-weight: 700;
  color: #667eea;
}

/* ── Audit warning note ── */
.audit-note {
  margin-top: 10px;
  padding: 8px 14px;
  background: rgba(245,158,11,0.08);
  border-left: 3px solid #f59e0b;
  border-radius: 0 6px 6px 0;
  font-size: 11px;
  color: #fbbf24;
}

</style>
</head>
<body>
<div class="document">

  <!-- ═══ COVER ═══ -->
  <div class="cover">
    <div class="cover-logo">PricePilot · SaaS Pricing Analyzer</div>
    <div class="cover-title">Pricing Sensitivity Report</div>
    <div class="cover-subtitle">AI-powered analysis of your pricing strategy</div>
    <div class="cover-meta-row">
      <div class="cover-meta-item">
        <span class="cover-meta-label">Company</span>
        <span class="cover-meta-value">{{ company_name }}</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Industry</span>
        <span class="cover-meta-value">{{ industry }}</span>
      </div>
      <div class="cover-meta-item">
        <span class="cover-meta-label">Generated</span>
        <span class="cover-meta-value">{{ generated_date }}</span>
      </div>
    </div>
  </div>

  <!-- ═══ BODY ═══ -->
  <div class="body">

    <!-- Executive Summary -->
    {% if exec_summary %}
    <div class="section">
      <div class="section-title">Executive Summary</div>
      <div class="exec-card">{{ exec_summary }}</div>
    </div>
    {% endif %}

    <!-- Revenue Scenario Analysis -->
    <div class="section">
      <div class="section-title">Revenue Scenario Analysis</div>
      <div class="table-wrap">
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
            <tr class="row-baseline">
              <td>Current (Baseline)</td>
              <td>${{ "%.2f"|format(current_mrr) }}</td>
              <td>—</td>
              <td>—</td>
            </tr>
            {% for key, s in scenarios.items() %}
            <tr {% if key == recommended_increase %}class="row-recommended"{% endif %}>
              <td>{{ key }} Price Increase {% if key == recommended_increase %}★{% endif %}</td>
              <td>${{ "%.2f"|format(s.projected_mrr) }}</td>
              <td>{{ s.user_loss_pct }}%</td>
              <td>{{ "%+.1f"|format(s.net_change_pct) }}%</td>
            </tr>
            {% endfor %}
          </tbody>
        </table>
      </div>
      {% if m1_reasoning %}
      <div class="recommended-note">★ Recommended: {{ recommended_increase }} — {{ m1_reasoning }}</div>
      {% endif %}
    </div>

    <!-- Feature Placement Audit -->
    {% if feature_audit %}
    <div class="section">
      <div class="section-title">Feature Placement Audit</div>
      <div class="table-wrap">
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
              <td style="color:#94a3b8;">{{ item.tier_name }}</td>
              <td>
                <span class="tag tag-{{ item.classification }}">
                  {{ item.classification | replace('_', ' ') }}
                </span>
              </td>
              <td style="color:#94a3b8;font-size:11px;">{{ item.recommended_action }}</td>
            </tr>
            {% endfor %}
          </tbody>
        </table>
      </div>
      {% if audit_summary and audit_summary.biggest_issue %}
      <div class="audit-note">⚠ {{ audit_summary.biggest_issue }}</div>
      {% endif %}
    </div>
    {% endif %}

    <!-- Competitor Benchmark -->
    <div class="section">
      <div class="section-title">Competitor Benchmark</div>
      {% if positioning %}
      <span class="positioning-badge pos-{{ positioning }}">
        {{ positioning | upper | replace('_', ' ') }}
      </span>
      {% endif %}
      {% if price_vs_market %}
      <div class="price-vs-market">{{ price_vs_market }}</div>
      {% endif %}
      {% if features_we_lack or features_we_have %}
      <div class="bench-two-col">
        {% if features_we_lack %}
        <div class="bench-col">
          <div class="bench-col-title missing">Features We're Missing</div>
          <ul class="bench-list">
            {% for f in features_we_lack %}
            <li><span class="bench-dot-miss">•</span>{{ f }}</li>
            {% endfor %}
          </ul>
        </div>
        {% endif %}
        {% if features_we_have %}
        <div class="bench-col">
          <div class="bench-col-title unique">Our Unique Differentiators</div>
          <ul class="bench-list">
            {% for f in features_we_have %}
            <li><span class="bench-dot-uniq">✓</span>{{ f }}</li>
            {% endfor %}
          </ul>
        </div>
        {% endif %}
      </div>
      {% endif %}
    </div>

    <!-- Pricing Strategies -->
    {% if strategies %}
    <div class="section">
      <div class="section-title">Recommended Pricing Strategies</div>

      {% for strat in strategies %}
      <div class="strategy-card {{ strat.type }}">

        <div class="strategy-header">
          <div class="strategy-mrr">+{{ strat.predicted_mrr_change_pct }}%</div>
          <div class="strategy-header-right">
            <div class="strategy-name">{{ strat.name }}</div>
            <span class="risk-badge risk-{{ strat.risk_level }}">
              {{ strat.risk_level | upper }} RISK
            </span>
          </div>
        </div>

        <div class="strategy-reasoning">{{ strat.reasoning }}</div>

        {% if strat.new_tier_structure %}
        <div class="strategy-tiers-title">New Tier Structure</div>
        <div class="tier-pills">
          {% for tier in strat.new_tier_structure %}
          <div class="tier-pill">
            <div class="tier-pill-name">{{ tier.name }}</div>
            <div class="tier-pill-price">
              {% if tier.price is none or tier.price == None %}
                Custom
              {% else %}
                ${{ tier.price }}/mo
              {% endif %}
            </div>
            <div class="tier-pill-target">{{ tier.target_customer | truncate(40) }}</div>
          </div>
          {% endfor %}
        </div>
        {% endif %}

        {% if strat.implementation_steps %}
        <div class="steps-title">Implementation Steps</div>
        <ul class="steps-list">
          {% for step in strat.implementation_steps %}
          <li>{{ step }}</li>
          {% endfor %}
        </ul>
        {% endif %}

      </div>
      {% endfor %}

    </div>
    {% endif %}

  </div><!-- /body -->

  <!-- ═══ FOOTER ═══ -->
  <div class="footer">
    <span><span class="footer-brand">PricePilot</span> · SaaS Pricing Analyzer</span>
    <span>{{ company_name }} · {{ generated_date }} · Confidential</span>
  </div>

</div><!-- /document -->
</body>
</html>"""


def generate_pdf(report_data: dict, session_id: str) -> str:
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

    # Format generated date nicely
    raw_date = report_data.get("generated_at", "")
    try:
        dt = datetime.fromisoformat(raw_date)
        generated_date = dt.strftime("%B %d, %Y")
    except Exception:
        generated_date = datetime.utcnow().strftime("%B %d, %Y")

    context = {
        "company_name":       company.get("name", "Unknown"),
        "industry":           company.get("industry", "Unknown").replace("_", " ").title(),
        "generated_date":     generated_date,
        # M1
        "current_mrr":        m1.get("current_mrr", 0),
        "scenarios":          m1.get("scenarios", {}),
        "recommended_increase": m1.get("recommended_increase", ""),
        "m1_reasoning":       m1.get("reasoning", ""),
        # M2
        "feature_audit":      m2.get("feature_audit", []),
        "audit_summary":      m2.get("summary"),
        # M3
        "positioning":        benchmark.get("positioning", "unknown"),
        "price_vs_market":    benchmark.get("price_vs_market", ""),
        "features_we_lack":   benchmark.get("features_we_lack", []),
        "features_we_have":   benchmark.get("features_we_uniquely_have", []),
        # M4
        "exec_summary":       m4.get("executive_summary", ""),
        "strategies":         m4.get("strategies", []),
    }

    template = Template(_HTML_TEMPLATE)
    html_str = template.render(**context)

    pdf_path = os.path.join(PDF_DIR, f"pricing-report-{session_id}.pdf")
    weasyprint.HTML(string=html_str).write_pdf(pdf_path)

    return pdf_path