import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import Card from '../common/Card';

export default function RevenueChart({ module1 }) {
  if (!module1 || module1.error) {
    return (
      <Card>
        <p className="text-muted text-sm">Revenue data is unavailable — re-run the analysis.</p>
      </Card>
    );
  }

  const { current_mrr, scenarios, recommended_increase, reasoning } = module1;
  const scenarioKeys = Object.keys(scenarios || {});

  // Build chart data from scenario points
  const baseChartData = useMemo(() => {
    return [
      { name: 'Current', mrr: current_mrr },
      ...scenarioKeys.map((key) => ({
        name: key,
        mrr: scenarios[key].projected_mrr,
        userLoss: scenarios[key].user_loss_pct,
        netChange: scenarios[key].net_change_pct,
      })),
    ];
  }, [current_mrr, scenarios, scenarioKeys]);

  // Price slider state
  const [sliderValue, setSliderValue] = useState(50);

  // Interpolate projected MRR based on slider (0-100 maps across scenario range)
  const interpolatedMrr = useMemo(() => {
    if (scenarioKeys.length === 0) return current_mrr;
    const mrrValues = scenarioKeys.map((k) => scenarios[k].projected_mrr);
    const allValues = [current_mrr, ...mrrValues];
    const fraction = sliderValue / 100;
    const index = fraction * (allValues.length - 1);
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    if (lower === upper) return allValues[lower];
    const t = index - lower;
    return Math.round(allValues[lower] * (1 - t) + allValues[upper] * t);
  }, [sliderValue, current_mrr, scenarios, scenarioKeys]);

  const mrrChange = current_mrr > 0
    ? (((interpolatedMrr - current_mrr) / current_mrr) * 100).toFixed(1)
    : 0;

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div style={{
        background: 'var(--color-surface-3)',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--space-3)',
      }}>
        <p style={{ fontSize: 'var(--font-size-xs)', fontWeight: 700, color: 'var(--color-primary-light)', textTransform: 'uppercase' }}>
          {label}
        </p>
        <p style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-text)' }}>
          ${payload[0]?.value?.toLocaleString()}
        </p>
      </div>
    );
  };

  return (
    <div className="grid-2" style={{ alignItems: 'stretch' }}>
      {/* Chart + Slider */}
      <Card style={{ gridColumn: 'span 1' }}>
        <div className="row-between" style={{ marginBottom: 'var(--space-4)' }}>
          <h4 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Revenue Sensitivity</h4>
          <div className="row" style={{ gap: 'var(--space-4)' }}>
            <span className="row" style={{ gap: 'var(--space-1)', fontSize: '10px', fontWeight: 700, color: 'var(--color-outline)', textTransform: 'uppercase' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-outline)', display: 'inline-block' }} />
              Current
            </span>
            <span className="row" style={{ gap: 'var(--space-1)', fontSize: '10px', fontWeight: 700, color: 'var(--color-primary-light)', textTransform: 'uppercase' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--color-primary-light)', display: 'inline-block' }} />
              Projected
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: 250 }}>
          <ResponsiveContainer>
            <LineChart data={baseChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis dataKey="name" stroke="var(--color-outline)" fontSize={12} />
              <YAxis stroke="var(--color-outline)" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="mrr"
                stroke="var(--color-primary-light)"
                strokeWidth={3}
                dot={{ fill: 'var(--color-primary-light)', r: 5 }}
                activeDot={{ r: 7, fill: 'var(--color-primary)' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Price Slider */}
        <div style={{ paddingTop: 'var(--space-4)' }}>
          <div className="row-between" style={{ marginBottom: 'var(--space-2)' }}>
            <span className="label-caps">Adjust Price Sensitivity</span>
            <span style={{ fontSize: 'var(--font-size-lg)', fontWeight: 700, color: 'var(--color-primary-light)' }}>
              {sliderValue}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={sliderValue}
            onChange={(e) => setSliderValue(Number(e.target.value))}
            style={{
              width: '100%',
              accentColor: 'var(--color-primary-light)',
            }}
          />
          <div className="row-between" style={{ marginTop: 'var(--space-1)' }}>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-outline-variant)' }}>Current</span>
            <span style={{ fontSize: '10px', fontWeight: 700, color: 'var(--color-outline-variant)' }}>Maximum</span>
          </div>
        </div>
      </Card>

      {/* MRR Callouts */}
      <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <h4 className="label-caps" style={{ marginBottom: 'var(--space-5)' }}>Estimated Growth</h4>
          <div className="stack-lg">
            <div>
              <p className="text-sm text-muted">Current MRR</p>
              <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-outline-variant)', lineHeight: 1.2 }}>
                ${current_mrr?.toLocaleString()}
              </p>
            </div>
            <div style={{
              padding: 'var(--space-4)',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(128, 131, 255, 0.1)',
              border: '1px solid rgba(192, 193, 255, 0.2)',
            }}>
              <p className="text-sm" style={{ color: 'var(--color-primary-light)' }}>Projected MRR</p>
              <div className="row" style={{ alignItems: 'baseline', gap: 'var(--space-2)' }}>
                <p style={{ fontSize: 'var(--font-size-3xl)', fontWeight: 700, color: 'var(--color-primary-light)', lineHeight: 1.2 }}>
                  ${interpolatedMrr?.toLocaleString()}
                </p>
                <span style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: 700,
                  color: Number(mrrChange) >= 0 ? 'var(--color-primary-light)' : 'var(--color-danger)',
                }}>
                  {Number(mrrChange) >= 0 ? '+' : ''}{mrrChange}%
                </span>
              </div>
            </div>
          </div>
        </div>
        {reasoning && (
          <div style={{
            marginTop: 'var(--space-5)',
            padding: 'var(--space-3)',
            borderRadius: 'var(--radius-sm)',
            background: 'var(--color-surface-3)',
            border: '1px solid var(--color-border)',
          }}>
            <div className="row" style={{ gap: 'var(--space-2)', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--color-tertiary)' }}>📈</span>
              <p className="text-sm" style={{ fontStyle: 'italic' }}>"{reasoning}"</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
