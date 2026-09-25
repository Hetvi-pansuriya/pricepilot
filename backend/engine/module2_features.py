"""
module2_features.py
─────────────────────────────────────────────────────────────────────────────
PURPOSE: Module 2 — Feature Audit (Groq AI call #1 in the pipeline).

What it does:
  Sends all pricing tiers and their features to the Groq AI.
  The AI classifies each feature into one of 4 types:
    - gatekeeper:      premium feature on a cheap tier → move it UP
    - blocker:         basic feature on a pricey tier  → move it DOWN
    - right_placed:    correct tier                    → keep it
    - undifferentiated: doesn't drive upgrades         → rethink it

WHY this matters for pricing?
  If your "API Access" (premium feature) is available on the $29 Starter tier,
  nobody upgrades to the $79 Pro tier. That's a "gatekeeper" — it gates upgrading.
  Moving API Access to Pro tier drives more upgrade revenue.

CONNECTED TO:
  - analysis.py    → run_module2(company_data, groq_client) called in M1+M2 parallel gather
  - groq_utils.py  → call_groq_with_retry() makes the actual AI API call
  - main.py        → groq_client comes from app.state.groq_client
  - models.py      → Feature.feature_name and PricingTier.name are the inputs
  - analysis.py    → m2_result fed into M3 and M4 as context
  - json_report    → stored in Report.json_report["module2_features"]
"""

import json

from engine.groq_utils import call_groq_with_retry


async def run_module2(company_data: dict, groq_client) -> dict:
    """
    Calls Groq to audit feature placement across pricing tiers.
    Falls back to a partial result with an error key if Groq fails.
    """
    name = company_data.get("name", "Unknown")       # company name, e.g., "CloudHR Pro"
    industry = company_data.get("industry", "Unknown")  # e.g., "saas_b2b"
    tiers = company_data.get("tiers", [])            # list of tier dicts with features

    tiers_with_features = [
        {
            "tier_name": tier["name"],               # e.g., "Basic"
            "price": tier["price"],                   # e.g., 49.0
            "billing_cycle": tier["billing_cycle"],  # e.g., "monthly"
            "features": [f["feature_name"] for f in tier.get("features", [])],
        }
        for tier in tiers  # iterate each tier in the company's tiers list
    ]

    prompt = f"""You are a SaaS pricing strategist. Analyze the following pricing tiers and their features.
Classify each feature into exactly one of these 4 types:
- "gatekeeper": a premium/enterprise feature being given away on a free or cheap tier — it should be moved up
- "blocker": a basic/essential feature locked behind a high-tier paywall — it's causing churn, move it down
- "right_placed": correctly placed in the right tier — no action needed
- "undifferentiated": provides no upgrade incentive between tiers — needs rethinking

Company: {name}, Industry: {industry}
Tiers and features: {json.dumps(tiers_with_features)}

Respond ONLY with a JSON object matching this exact schema:
{{
  "feature_audit": [
    {{
      "feature_name": "string",
      "tier_name": "string",
      "classification": "gatekeeper|blocker|right_placed|undifferentiated",
      "reasoning": "one sentence explanation",
      "recommended_action": "move to X tier / keep / rethink positioning"
    }}
  ],
  "summary": {{
    "gatekeepers_found": 2,
    "blockers_found": 1,
    "right_placed": 5,
    "undifferentiated": 3,
    "biggest_issue": "one sentence"
  }}
}}

Return ONLY the JSON. No markdown. No backticks. No explanation outside the JSON.

Example output:
{{"feature_audit": [{{"feature_name": "API access", "tier_name": "Starter", "classification": "gatekeeper", "reasoning": "API access is a power-user feature being given away on the cheapest tier", "recommended_action": "move to Pro tier"}}], "summary": {{"gatekeepers_found": 1, "blockers_found": 0, "right_placed": 0, "undifferentiated": 0, "biggest_issue": "API access is underpriced"}}}}"""

    if groq_client is None:
        return {
            "error": "GROQ_API_KEY not configured",  # shown to user in report
            "module": "M2",                           # identifies which module failed
            "feature_audit": [],                      # empty list (no features classified)
            "summary": {
                "gatekeepers_found": 0,
                "blockers_found": 0,
                "right_placed": 0,
                "undifferentiated": 0,
                "biggest_issue": "Feature audit unavailable — GROQ_API_KEY not set.",
            },
        }

    try:
        result = await call_groq_with_retry(groq_client, prompt)
        return result  # return it directly to analysis.py

    except (ValueError, AttributeError) as e:
        return {
            "error": str(e),        # the actual error message (useful for debugging)
            "module": "M2",         # identifies which module failed
            "feature_audit": [],    # empty — no features were classified
            "summary": {
                "gatekeepers_found": 0,
                "blockers_found": 0,
                "right_placed": 0,
                "undifferentiated": 0,
                "biggest_issue": "Feature audit unavailable due to AI service error.",
            },
        }
