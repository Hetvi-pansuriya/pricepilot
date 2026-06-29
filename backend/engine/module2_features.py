"""
Module 2 — Feature Audit (Groq call #1).

Classifies every feature into one of 4 types:
  gatekeeper | blocker | right_placed | undifferentiated
"""

import json
from engine.groq_utils import call_groq_with_retry


async def run_module2(company_data: dict, groq_client) -> dict:
    """
    Calls Groq to audit feature placement across pricing tiers.
    Falls back to a partial result with an error key if Groq fails.
    """
    name = company_data.get("name", "Unknown")
    industry = company_data.get("industry", "Unknown")
    tiers = company_data.get("tiers", [])

    # Build tiers+features structure for the prompt
    tiers_with_features = [
        {
            "tier_name": tier["name"],
            "price": tier["price"],
            "billing_cycle": tier["billing_cycle"],
            "features": [f["feature_name"] for f in tier.get("features", [])],
        }
        for tier in tiers
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
            "error": "GROQ_API_KEY not configured",
            "module": "M2",
            "feature_audit": [],
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
        return result
    except (ValueError, AttributeError) as e:
        return {
            "error": str(e),
            "module": "M2",
            "feature_audit": [],
            "summary": {
                "gatekeepers_found": 0,
                "blockers_found": 0,
                "right_placed": 0,
                "undifferentiated": 0,
                "biggest_issue": "Feature audit unavailable due to AI service error.",
            },
        }
