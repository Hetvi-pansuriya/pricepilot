"""
Module 4 — Final Strategy Recommendations (Gemini call #3).

Synthesises outputs from M1, M2, M3 and generates exactly 3
pricing strategies: conservative, aggressive, strategic.
"""

import json
from engine.gemini_utils import call_gemini_with_retry


_FALLBACK = {
    "executive_summary": "Analysis unavailable due to AI service error.",
    "strategies": [],
}


async def run_module4(
    company_data: dict,
    m1_output: dict,
    m2_output: dict,
    m3_output: dict,
    gemini_model,
) -> dict:
    """
    Calls Gemini to produce 3 alternative pricing strategies.
    Falls back to a partial result if Gemini fails.
    """
    name = company_data.get("name", "Unknown")
    industry = company_data.get("industry", "Unknown")

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

    if gemini_model is None:
        return {
            **_FALLBACK,
            "error": "GEMINI_API_KEY not configured",
            "module": "M4",
        }

    try:
        result = await call_gemini_with_retry(gemini_model, prompt)
        return result
    except (ValueError, AttributeError) as e:
        return {
            **_FALLBACK,
            "error": str(e),
            "module": "M4",
        }
