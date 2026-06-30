import { useState } from 'react';
import Card from '../common/Card';

const RISK_STYLES = {
  low: { color: 'var(--color-text-muted)', label: 'LOW RISK' },
  medium: { color: 'var(--color-primary-light)', label: 'MED RISK' },
  high: { color: 'var(--color-tertiary)', label: 'HIGH RISK' },
};

export default function StrategyCard({ strategy, isRecommended }) {
  const [expanded, setExpanded] = useState(false);
  const risk = RISK_STYLES[strategy.risk_level] || RISK_STYLES.medium;
  const mrrChange = strategy.predicted_mrr_change_pct;

  return (
    <Card
      className="stack"
      style={{
        gap: 'var(--space-4)',
        position: 'relative',
        border: isRecommended ? '2px solid var(--color-primary-light)' : undefined,
        transform: isRecommended ? 'scale(1.02)' : undefined,
        boxShadow: isRecommended ? '0 10px 40px rgba(192, 193, 255, 0.1)' : undefined,
        cursor: 'pointer',
        transition: 'all var(--transition-base)',
      }}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Recommended badge */}
      {isRecommended && (
        <div style={{
          position: 'absolute',
          top: '-12px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--color-primary)',
          color: '#ffffff',
          padding: 'var(--space-1) var(--space-3)',
          borderRadius: 'var(--radius-sm)',
          fontSize: '10px',
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          Recommended
        </div>
      )}

      {/* Header */}
      <div className="row-between">
        <p className="label-caps" style={{
          color: isRecommended ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
        }}>
          {strategy.type || strategy.name}
        </p>
        <span style={{ fontSize: '10px', fontWeight: 700, color: risk.color }}>
          {risk.label}
        </span>
      </div>

      {/* MRR Change */}
      <div className="row" style={{ alignItems: 'baseline', gap: 'var(--space-2)' }}>
        <span style={{
          fontSize: isRecommended ? 'var(--font-size-3xl)' : 'var(--font-size-xl)',
          fontWeight: 700,
          color: isRecommended ? 'var(--color-primary-light)' : 'var(--color-text)',
        }}>
          {mrrChange >= 0 ? '+' : ''}{mrrChange}%
        </span>
        <span className="text-sm" style={{
          color: isRecommended ? 'var(--color-primary-light)' : 'var(--color-text-muted)',
        }}>
          MRR Δ
        </span>
      </div>

      {/* Reasoning */}
      <p className="text-sm" style={{
        color: isRecommended ? 'var(--color-text)' : 'var(--color-text-muted)',
      }}>
        {strategy.reasoning}
      </p>

      {/* New Tier Structure */}
      {strategy.new_tier_structure && strategy.new_tier_structure.length > 0 && expanded && (
        <div className="stack-sm" style={{
          padding: 'var(--space-3)',
          background: 'var(--color-surface-2)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--color-border)',
        }}>
          <p className="label-caps">Proposed Tiers</p>
          {strategy.new_tier_structure.map((tier, idx) => (
            <div key={idx} className="row-between">
              <span className="text-sm font-semibold">{tier.name}</span>
              <span className="text-sm" style={{ color: 'var(--color-primary-light)' }}>
                ${tier.price}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Implementation Steps */}
      {strategy.implementation_steps && strategy.implementation_steps.length > 0 && expanded && (
        <div className="stack-sm">
          <p className="label-caps">Implementation Steps</p>
          <ol style={{ paddingLeft: 'var(--space-4)' }}>
            {strategy.implementation_steps.map((step, idx) => (
              <li key={idx} className="text-sm text-muted" style={{
                listStyle: 'decimal',
                marginBottom: 'var(--space-2)',
              }}>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Expand hint */}
      <div className="row" style={{
        gap: 'var(--space-1)',
        justifyContent: 'center',
        opacity: 0.5,
        fontSize: 'var(--font-size-xs)',
        color: 'var(--color-text-muted)',
      }}>
        {expanded ? '▲ Collapse' : '▼ Click to expand'}
      </div>
    </Card>
  );
}
