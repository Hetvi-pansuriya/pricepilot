import Card from '../common/Card';

const POSITIONING_STYLES = {
  underpriced: { className: 'badge-warning', label: 'UNDERPRICED' },
  overpriced: { className: 'badge-danger', label: 'OVERPRICED' },
  competitive: { className: 'badge-success', label: 'COMPETITIVE' },
};

export default function CompetitorTable({ module3 }) {
  if (!module3 || module3.error) {
    return (
      <Card>
        <p className="text-muted text-sm">No competitor data available for this analysis.</p>
      </Card>
    );
  }

  const { benchmark } = module3;
  if (!benchmark) {
    return (
      <Card>
        <p className="text-muted text-sm">No competitor data available for this analysis.</p>
      </Card>
    );
  }

  const posStyle = POSITIONING_STYLES[benchmark.positioning] || POSITIONING_STYLES.competitive;
  const { features_we_lack = [], features_we_uniquely_have = [], price_vs_market } = benchmark;

  return (
    <Card className="stack" style={{ gap: 'var(--space-5)' }}>
      <div className="row-between">
        <h4 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Competitor Benchmark</h4>
        <span className={`badge ${posStyle.className}`}>{posStyle.label}</span>
      </div>

      {price_vs_market && (
        <p className="text-sm text-muted">{price_vs_market}</p>
      )}

      <div className="grid-2" style={{ gap: 'var(--space-5)' }}>
        {/* Missing Features */}
        <div style={{
          background: 'var(--color-surface-2)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(70, 69, 84, 0.3)',
        }}>
          <p className="label-caps" style={{ color: 'var(--color-tertiary)', marginBottom: 'var(--space-3)' }}>
            Missing Features
          </p>
          <ul className="stack-sm">
            {features_we_lack.length === 0 ? (
              <li className="text-sm text-muted">None identified</li>
            ) : (
              features_we_lack.map((feat, idx) => (
                <li key={idx} className="row" style={{ gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-muted)' }}>
                  <span style={{ color: 'var(--color-outline)', fontSize: 'var(--font-size-sm)' }}>✕</span>
                  {feat}
                </li>
              ))
            )}
          </ul>
        </div>

        {/* Unique Value */}
        <div style={{
          background: 'rgba(99, 102, 241, 0.05)',
          padding: 'var(--space-4)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid rgba(192, 193, 255, 0.2)',
        }}>
          <p className="label-caps" style={{ color: 'var(--color-primary-light)', marginBottom: 'var(--space-3)' }}>
            Unique Value
          </p>
          <ul className="stack-sm">
            {features_we_uniquely_have.length === 0 ? (
              <li className="text-sm text-muted">None identified</li>
            ) : (
              features_we_uniquely_have.map((feat, idx) => (
                <li key={idx} className="row" style={{ gap: 'var(--space-2)', fontSize: 'var(--font-size-sm)' }}>
                  <span style={{ color: 'var(--color-primary-light)', fontSize: 'var(--font-size-sm)' }}>✓</span>
                  {feat}
                </li>
              ))
            )}
          </ul>
        </div>
      </div>
    </Card>
  );
}
