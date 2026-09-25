"""
module4_recommendations.py
─────────────────────────────────────────────────────────────────────────────
PURPOSE: Module 4 — Final Strategy Recommendations (Groq AI call #3).

What it does:
  Takes ALL previous module outputs (M1 revenue data, M2 feature audit,
  M3 competitor benchmark) and synthesizes them into exactly 3 complete
  pricing strategy proposals for the user to choose from.

The 3 strategies always generated:
  1. CONSERVATIVE: small changes, low risk, 8-15% MRR gain
  2. AGGRESSIVE: major restructure, high risk, 20-40% MRR gain
  3. STRATEGIC: market repositioning, enterprise focus, long-term play

WHY 3 strategies? Different users have different risk tolerances.
  A bootstrapped startup might want "conservative", while a VC-funded
  company going for growth might choose "aggressive".

CONNECTED TO:
  - analysis.py    → run_module4(company_data, m1_output, m2_output, m3_output, groq_client)
                     called after M3 completes (at 90% progress mark)
  - groq_utils.py  → call_groq_with_retry() makes the actual AI API call
  - module1, 2, 3  → their outputs are passed as context (m1_output, m2_output, m3_output)
  - json_report    → stored in Report.json_report["module4_recommendations"]
  - frontend       → displays strategies as selectable cards with charts
"""

import json

from engine.groq_utils import call_groq_with_retry


_FALLBACK = {
    "executive_summary": "Analysis unavailable due to AI service error.",  # shown in report header
    "strategies": [],  # empty list — no strategies could be generated
}


async def run_module4(
    company_data: dict,
    m1_output: dict,
    m2_output: dict,
    m3_output: dict,
    groq_client,
) -> dict:
    """
    Calls Groq to produce 3 alternative pricing strategies.
    Falls back to a partial result if Groq fails.
    """
    name = company_data.get("name", "Unknown")      # e.g., "CloudHR Pro"
    industry = company_data.get("industry", "Unknown")  # e.g., "saas_b2b"

    prompt = f"""You are a senior SaaS pricing strategist. You have complete analysis data for a company. Generate exactly 3 alternative pricing strategies.

COMPANY: {name}, INDUSTRY: {industry}

MODULE 1 — REVENUE MODEL:
{json.dumps(m1_output)}

MODULE 2 — FEATURE AUDIT:
{json.dumps(m2_output)}

MODULE 3 — COMPETITOR BENCHMARK:
{json.dumps(m3_output)}

Generate EXACTLY 3 pricing strategies:
1. CONSERVATIVE — low risk, minor changes, 8–15% MRR gain, minimal disruption
2. AGGRESSIVE — high risk, significant restructure, 20–40% MRR gain, possible churn
3. STRATEGIC — market repositioning, enterprise focus, rename tiers, long-term play

For EACH strategy provide a complete new tier structure with specific prices and features.

Respond ONLY with this exact JSON:
{{
  "executive_summary": "2-3 sentence summary of the biggest pricing problem and the single most impactful fix",
  "strategies": [
    {{
      "type": "conservative|aggressive|strategic",
      "name": "short name for this strategy",
      "predicted_mrr_change_pct": 12,
      "confidence_score": 0.85,
      "risk_level": "low|medium|high",
      "reasoning": "2-3 sentences explaining why this strategy works",
      "new_tier_structure": [
        {{
          "name": "new tier name",
          "price": 99,
          "key_changes": ["moved API access to this tier", "added SSO"],
          "target_customer": "who this tier is for"
        }}
      ],
      "implementation_steps": ["step 1", "step 2", "step 3"]
    }}
  ]
}}

Return ONLY the JSON. No markdown. No backticks."""

    if groq_client is None:
        return {
            **_FALLBACK,                                    # spread _FALLBACK keys
            "error": "GROQ_API_KEY not configured",        # add error key
            "module": "M4",                                 # identify which module failed
        }

    try:
        result = await call_groq_with_retry(groq_client, prompt)
        return result  # parsed JSON dict with executive_summary and strategies list

    except (ValueError, AttributeError) as e:
        return {
            **_FALLBACK,          # spread _FALLBACK keys (executive_summary, strategies)
            "error": str(e),      # actual error message for debugging
            "module": "M4",       # identifies which module failed
        }
