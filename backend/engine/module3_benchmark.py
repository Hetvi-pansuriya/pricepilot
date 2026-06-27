"""
Module 3 — Competitor Benchmarking (Gemini call #2).

Parses raw competitor scraped text, computes value scores,
and produces a benchmark analysis against the target company.
"""

import json
from engine.gemini_utils import call_gemini_with_retry


def _build_our_value_scores(tiers: list) -> list:
    """Compute value_score = price / feature_count for each tier (lower = better value)."""
    scores = []
    for tier in tiers:
        feature_count = len(tier.get("features", [])) or 1
        value_score = round(tier["price"] / feature_count, 2)
        scores.append({"tier_name": tier["name"], "value_score": value_score})
    return scores


_EMPTY_BENCHMARK = {
    "competitors_parsed": [],
    "benchmark": {
        "our_value_scores": [],
        "positioning": "unknown",
        "features_we_lack": [],
        "features_we_uniquely_have": [],
        "price_vs_market": "No competitor data available for benchmarking.",
    },
}


async def run_module3(
    company_data: dict,
    m1_output: dict,
    m2_output: dict,
    competitors: list,
    gemini_model,
) -> dict:
    """
    Calls Gemini to parse competitor text and benchmark the target company.
    Falls back to placeholder if no competitor data exists.
    """
    name = company_data.get("name", "Unknown")
    industry = company_data.get("industry", "Unknown")
    tiers = company_data.get("tiers", [])

    # Check if we have any usable competitor data
    usable_competitors = [
        c for c in competitors if c.get("raw_scraped_text", "").strip()
    ]

    our_value_scores = _build_our_value_scores(tiers)
    import copy
    empty = copy.deepcopy(_EMPTY_BENCHMARK)
    empty["benchmark"]["our_value_scores"] = our_value_scores

    if not usable_competitors:
        return empty

    # Build competitor text block
    competitor_block = ""
    for comp in usable_competitors:
        competitor_block += (
            f"--- COMPETITOR: {comp.get('name', comp['url'])} (URL: {comp['url']}) ---\n"
            f"{comp['raw_scraped_text'][:8000]}\n\n"  # cap to avoid prompt overflows
        )

    tiers_summary = [
        {
            "name": t["name"],
            "price": t["price"],
            "features": [f["feature_name"] for f in t.get("features", [])],
        }
        for t in tiers
    ]

    prompt = f"""You are a SaaS pricing benchmarking expert. Given a company's pricing data and raw competitor pricing page text, extract structured competitor data and produce a benchmark analysis.

TARGET COMPANY: {name}
INDUSTRY: {industry}
CURRENT MRR: {m1_output.get("current_mrr", "unknown")}
TIERS: {json.dumps(tiers_summary)}

COMPETITOR RAW TEXT:
{competitor_block}

TASK:
1. Parse each competitor's raw text to extract: tier names, prices, and key features (best effort — text may be messy)
2. Compute a value score for each tier = price / feature_count (lower = better value)
3. Compare the target company's tiers against each competitor

Respond ONLY with this exact JSON schema:
{{
  "competitors_parsed": [
    {{
      "name": "string",
      "tiers": [
        {{"name": "string", "price": null, "features": ["string"], "value_score": null}}
      ]
    }}
  ],
  "benchmark": {{
    "our_value_scores": {json.dumps(our_value_scores)},
    "positioning": "overpriced|underpriced|well_positioned",
    "features_we_lack": ["feature competitors have that we don't"],
    "features_we_uniquely_have": ["our differentiators"],
    "price_vs_market": "one sentence — are we above/below/at market rate"
  }}
}}

Return ONLY the JSON. No markdown. No backticks."""

    if gemini_model is None:
        fallback = copy.deepcopy(empty)
        fallback["error"] = "GEMINI_API_KEY not configured"
        fallback["module"] = "M3"
        return fallback

    try:
        result = await call_gemini_with_retry(gemini_model, prompt)
        # Ensure our_value_scores is always populated even if Gemini omits it
        if "benchmark" in result:
            if not result["benchmark"].get("our_value_scores"):
                result["benchmark"]["our_value_scores"] = our_value_scores
        return result
    except (ValueError, AttributeError) as e:
        fallback = copy.deepcopy(empty)
        fallback["error"] = str(e)
        fallback["module"] = "M3"
        return fallback
