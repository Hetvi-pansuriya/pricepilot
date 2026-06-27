"""
Module 1 — Revenue Impact Analysis (pure Python math, no AI).

Calculates current MRR and simulates +10%, +20%, +30% price increase scenarios
using industry-based price elasticity to estimate user loss.
"""

from typing import Any

# Price elasticity: fraction of users lost per price-increase scenario
ELASTICITY: dict[str, dict[str, float]] = {
    "saas_b2b": {"+10%": 0.03, "+20%": 0.08, "+30%": 0.18},
    "saas_b2c": {"+10%": 0.08, "+20%": 0.18, "+30%": 0.32},
    "default":  {"+10%": 0.05, "+20%": 0.12, "+30%": 0.25},
}

SCENARIOS = ["+10%", "+20%", "+30%"]
MULTIPLIERS = {"+10%": 1.10, "+20%": 1.20, "+30%": 1.30}


def _resolve_elasticity(industry: str) -> dict[str, float]:
    industry_lower = industry.lower().replace(" ", "_")
    for key in ELASTICITY:
        if key in industry_lower:
            return ELASTICITY[key]
    return ELASTICITY["default"]


def run_module1(company_data: dict) -> dict:
    """
    Synchronous revenue simulation.
    Expected company_data keys: name, industry, tiers (list of tier dicts).
    """
    industry = company_data.get("industry", "")
    tiers = company_data.get("tiers", [])
    elasticity = _resolve_elasticity(industry)

    current_mrr = sum(t["price"] * t["user_count"] for t in tiers)

    # Aggregate projected MRRs per scenario
    scenario_totals: dict[str, float] = {s: 0.0 for s in SCENARIOS}
    scenario_user_loss: dict[str, float] = {s: 0.0 for s in SCENARIOS}
    total_users = max(sum(t["user_count"] for t in tiers), 1)  # avoid div/0

    per_tier_results = []

    for tier in tiers:
        price = tier["price"]
        users = tier["user_count"]
        tier_current_mrr = price * users

        tier_scenarios: dict[str, Any] = {}
        for scenario in SCENARIOS:
            loss_pct = elasticity[scenario]
            remaining_users = users * (1 - loss_pct)
            new_price = price * MULTIPLIERS[scenario]
            new_mrr = remaining_users * new_price
            tier_scenarios[scenario] = {
                "projected_mrr": round(new_mrr, 2),
                "user_loss_pct": round(loss_pct * 100, 2),
                "net_change_pct": round(
                    ((new_mrr - tier_current_mrr) / max(tier_current_mrr, 0.01)) * 100, 2
                ),
            }
            scenario_totals[scenario] += new_mrr
            scenario_user_loss[scenario] += users * loss_pct

        per_tier_results.append(
            {
                "tier_name": tier["name"],
                "current_mrr": round(tier_current_mrr, 2),
                "scenarios": tier_scenarios,
            }
        )

    # Build aggregated scenarios with overall user_loss_pct
    aggregate_scenarios: dict[str, Any] = {}
    for scenario in SCENARIOS:
        proj_mrr = round(scenario_totals[scenario], 2)
        net_change = round(
            ((proj_mrr - current_mrr) / max(current_mrr, 0.01)) * 100, 2
        )
        overall_loss_pct = round((scenario_user_loss[scenario] / total_users) * 100, 2)
        aggregate_scenarios[scenario] = {
            "projected_mrr": proj_mrr,
            "user_loss_pct": overall_loss_pct,
            "net_change_pct": net_change,
        }

    # Recommend the scenario that maximises MRR
    best_scenario = max(SCENARIOS, key=lambda s: aggregate_scenarios[s]["projected_mrr"])
    best_data = aggregate_scenarios[best_scenario]

    reasoning = (
        f"{best_scenario} increase yields highest projected MRR of "
        f"${best_data['projected_mrr']:,.2f} "
        f"({best_data['net_change_pct']:+.1f}% change) "
        f"with an estimated {best_data['user_loss_pct']:.1f}% user loss — "
        f"best balance of revenue gain and acceptable churn."
    )

    return {
        "current_mrr": round(current_mrr, 2),
        "scenarios": aggregate_scenarios,
        "per_tier": per_tier_results,
        "recommended_increase": best_scenario,
        "reasoning": reasoning,
    }
