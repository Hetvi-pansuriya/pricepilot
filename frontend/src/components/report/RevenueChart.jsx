import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Card from "../common/Card";

const money = (number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(number ?? 0);

export default function RevenueChart({ module }) {
  const [value, setValue] = useState(20);
  const mrr = module?.current_mrr ?? 0;
  const scenarios = module?.scenarios ?? {};
  const allValues = [
    mrr,
    ...Object.values(scenarios).map((scenario) => scenario.projected_mrr ?? 0),
  ];
  const maxVal = Math.max(...allValues, 100);
  const points = useMemo(() => {
    if (!module || module.error) return [];
    return [
      { name: "Current", mrr, pct: 0 },
      ...Object.entries(scenarios).map(([name, scenario]) => ({
        name,
        mrr: scenario.projected_mrr ?? 0,
        pct: Number(name.replace(/\D/g, "")),
      })),
    ];
  }, [module, mrr, scenarios]);

  if (!points.length) {
    return (
      <Card>
        <p>Revenue data unavailable</p>
      </Card>
    );
  }

  const sorted = [...points].sort((a, b) => a.pct - b.pct);
  const left = [...sorted].reverse().find((point) => point.pct <= value) || sorted[0];
  const right = sorted.find((point) => point.pct >= value) || sorted.at(-1);
  const ratio =
    right.pct === left.pct ? 0 : (value - left.pct) / (right.pct - left.pct);
  const projected = Math.round(left.mrr + (right.mrr - left.mrr) * ratio);
  const change = mrr > 0 ? (projected / mrr - 1) * 100 : 0;

  return (
    <Card className="stack report-section">
      <div className="row-between">
        <h2>Revenue Sensitivity</h2>
        <strong>{module.recommended_increase} recommended</strong>
      </div>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <XAxis dataKey="name" />
            <YAxis
              domain={[0, Math.ceil(maxVal * 1.1)]}
              tickFormatter={(tick) => `$${Math.round(tick / 1000)}k`}
            />
            <Tooltip formatter={money} />
            <Line
              type="monotone"
              dataKey="mrr"
              stroke="var(--color-primary)"
              strokeWidth={4}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <input
        className="slider"
        type="range"
        min="0"
        max="30"
        value={value}
        onChange={(event) => setValue(Number(event.target.value))}
        style={{ "--fill": `${(value / 30) * 100}%` }}
      />
      <div className="grid-2">
        <div className="callout">
          <span>Current MRR</span>
          <strong className="mrr-display">{money(mrr)}</strong>
        </div>
        <div className="callout">
          <span>Projected MRR</span>
          <strong className={change >= 0 ? "success" : "danger"}>
            {money(projected)} ({change >= 0 ? "+" : ""}
            {change.toFixed(1)}%)
          </strong>
        </div>
      </div>
      <p><em>{module.reasoning}</em></p>
    </Card>
  );
}
