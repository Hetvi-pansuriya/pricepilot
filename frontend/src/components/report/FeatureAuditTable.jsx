import Card from '../common/Card';

const CLASSIFICATION_STYLES = {
  gatekeeper: {
    bg: 'rgba(99, 102, 241, 0.1)',
    color: 'var(--color-primary-light)',
    border: 'rgba(99, 102, 241, 0.2)',
    label: 'GATEKEEPER',
  },
  blocker: {
    bg: 'rgba(239, 68, 68, 0.1)',
    color: 'var(--color-danger)',
    border: 'rgba(239, 68, 68, 0.2)',
    label: 'BLOCKER',
  },
  right_placed: {
    bg: 'rgba(34, 197, 94, 0.1)',
    color: 'var(--color-success)',
    border: 'rgba(34, 197, 94, 0.2)',
    label: 'RIGHT PLACED',
  },
  undifferentiated: {
    bg: 'rgba(59, 130, 246, 0.1)',
    color: 'var(--color-info)',
    border: 'rgba(59, 130, 246, 0.2)',
    label: 'UNDIFFERENTIATED',
  },
};

export default function FeatureAuditTable({ module2 }) {
  if (!module2 || module2.error) {
    return (
      <Card>
        <p className="text-muted text-sm">Feature audit data is unavailable — re-run the analysis.</p>
      </Card>
    );
  }

  const { feature_audit = [], summary } = module2;

  return (
    <Card style={{ padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: 'var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
        <h4 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 600 }}>Feature Value Audit</h4>
        {summary?.biggest_issue && (
          <p className="text-sm text-muted" style={{ marginTop: 'var(--space-2)' }}>
            {summary.biggest_issue}
          </p>
        )}
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-surface-3)' }}>
              <th style={thStyle}>Feature</th>
              <th style={thStyle}>Tier</th>
              <th style={thStyle}>Class</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {feature_audit.map((item, idx) => {
              const cls = CLASSIFICATION_STYLES[item.classification] || CLASSIFICATION_STYLES.undifferentiated;
              return (
                <tr key={idx} style={{ borderBottom: '1px solid rgba(70, 69, 84, 0.3)' }}>
                  <td style={tdStyle}>{item.feature_name}</td>
                  <td style={{ ...tdStyle, fontSize: 'var(--font-size-sm)' }}>{item.tier_name}</td>
                  <td style={tdStyle}>
                    <span style={{
                      display: 'inline-block',
                      padding: 'var(--space-1) var(--space-3)',
                      borderRadius: 'var(--radius-sm)',
                      fontSize: '10px',
                      fontWeight: 700,
                      backgroundColor: cls.bg,
                      color: cls.color,
                      border: `1px solid ${cls.border}`,
                    }}>
                      {cls.label}
                    </span>
                  </td>
                  <td style={{
                    ...tdStyle,
                    fontSize: 'var(--font-size-sm)',
                    color: item.classification === 'blocker' ? 'var(--color-danger)' : 'var(--color-text-muted)',
                  }}>
                    {item.recommended_action}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

const thStyle = {
  padding: 'var(--space-3) var(--space-5)',
  fontSize: 'var(--font-size-xs)',
  fontWeight: 600,
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: 'var(--color-text-muted)',
  textAlign: 'left',
};

const tdStyle = {
  padding: 'var(--space-4) var(--space-5)',
  fontSize: 'var(--font-size-md)',
};
