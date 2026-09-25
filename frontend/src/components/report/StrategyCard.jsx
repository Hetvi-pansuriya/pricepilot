import { useState } from "react";
import Card from "../common/Card";
import Badge from "../common/Badge";
import Button from "../common/Button";

export default function StrategyCard({ strategy, recommended }) {
  const [more, setMore] = useState(false);
  const [steps, setSteps] = useState(false);
  const positive = strategy.predicted_mrr_change_pct >= 0;
  return (
    <Card
      glow={recommended}
      className={`strategy ${recommended ? "recommended" : ""}`}
    >
      <div className="strategy-card-inner">
        <div className="stack-sm">
          <h2>{strategy.name}</h2>
          <strong className={`metric ${positive ? "success" : "danger"}`}>
            {positive ? "+" : ""}
            {strategy.predicted_mrr_change_pct}%
          </strong>
          {recommended && <Badge variant="info">★ Recommended</Badge>}
          <Badge
            variant={
              strategy.risk_level === "low"
                ? "success"
                : strategy.risk_level === "medium"
                  ? "warning"
                  : "danger"
            }
          >
            {strategy.risk_level} risk
          </Badge>
        </div>
        <div className="stack-sm">
          <p className={more ? "" : "clamp"}>{strategy.reasoning}</p>
          <Button variant="ghost" size="sm" onClick={() => setMore(!more)}>
            {more ? "Show less" : "Show more"}
          </Button>
        </div>
        <div className="stack-sm">
          <div className="table-wrap">
            <table className="report-table">
              <tbody>
                {(strategy.new_tier_structure || []).map((tier, index) => (
                  <tr key={index}>
                    <td>{tier.name}</td>
                    <td>${tier.price}</td>
                    <td>{tier.target_customer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button variant="secondary" onClick={() => setSteps(!steps)}>
            Implementation Steps
          </Button>
          {steps && (
            <ol>
              {(strategy.implementation_steps || []).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </Card>
  );
}
