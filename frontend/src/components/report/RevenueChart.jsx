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
const money = (n) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n || 0);
export default function RevenueChart({ module }) {
  const [value, setValue] = useState(20);
  const points = useMemo(() => {
    if (!module || module.error) return [];
    return [
      { name: "Current", mrr: module.current_mrr, pct: 0, net: 0 },
      ...Object.entries(module.scenarios || {}).map(([name, x]) => ({
        name,
        mrr: x.projected_mrr,
        pct: Number(name.replace(/\D/g, "")),
        net: x.net_change_pct,
      })),
    ];
  }, [module]);
  if (!points.length)
    return (
      <Card>
        <p>Revenue data unavailable</p>
      </Card>
    );
  const sorted = [...points].sort((a, b) => a.pct - b.pct),
    left = [...sorted].reverse().find((x) => x.pct <= value) || sorted[0],
    right = sorted.find((x) => x.pct >= value) || sorted.at(-1),
    ratio =
      right.pct === left.pct ? 0 : (value - left.pct) / (right.pct - left.pct),
    projected = Math.round(left.mrr + (right.mrr - left.mrr) * ratio),
    change = (projected / module.current_mrr - 1) * 100;
  return (
    <Card className="stack">
      <div className="row-between">
        <h2>Revenue Sensitivity</h2>
        <strong>{module.recommended_increase} recommended</strong>
      </div>
      <div className="chart">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={points}>
            <XAxis dataKey="name" />
            <YAxis tickFormatter={(v) => `$${Math.round(v / 1000)}k`} />
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
        onChange={(e) => setValue(Number(e.target.value))}
        style={{ "--fill": `${(value / 30) * 100}%` }}
      />
      <div className="grid-2">
        <div className="callout">
          <span>Current MRR</span>
          <strong>{money(module.current_mrr)}</strong>
        </div>
        <div className="callout">
          <span>Projected MRR</span>
          <strong className={change >= 0 ? "success" : "danger"}>
            {money(projected)} ({change >= 0 ? "+" : ""}
            {change.toFixed(1)}%)
          </strong>
        </div>
      </div>
      <p>
        <em>{module.reasoning}</em>
      </p>
    </Card>
  );
}
