import Card from '../common/Card';

export default function ExecutiveSummary({ summary }) {
  if (!summary) {
    return (
      <Card className="executive-summary-unavailable">
        <p className="text-muted text-sm">Executive summary is unavailable — re-run the analysis.</p>
      </Card>
    );
  }

  return (
    <Card className="executive-summary" style={{
      borderLeft: '4px solid var(--color-primary-container)',
      padding: 'var(--space-5)',
    }}>
      <div className="row" style={{ gap: 'var(--space-4)', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '28px', color: 'var(--color-primary-light)', flexShrink: 0 }}>
          💡
        </span>
        <div className="stack-sm">
          <h3 style={{
            fontSize: 'var(--font-size-lg)',
            fontWeight: 600,
            color: 'var(--color-text)',
          }}>
            Executive Summary
          </h3>
          <p style={{
            fontSize: 'var(--font-size-xl)',
            fontWeight: 600,
            lineHeight: 'var(--line-height-xl)',
            color: 'var(--color-text)',
          }}>
            {summary}
          </p>
        </div>
      </div>
    </Card>
  );
}
