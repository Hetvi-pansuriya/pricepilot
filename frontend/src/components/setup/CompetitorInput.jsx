import { useState } from 'react';
import Button from '../common/Button';
import '../../styles/components.css';

const STATUS_BADGE = {
  pending: { className: 'badge-warning', label: 'Pending' },
  success: { className: 'badge-success', label: 'Success' },
  failed: { className: 'badge-danger', label: 'Failed' },
  manual: { className: 'badge-info', label: 'Manual' },
};

export default function CompetitorInput({
  competitor,
  onAdd,
  onDelete,
  onManualPaste,
  adding,
}) {
  const [url, setUrl] = useState('');
  const [manualText, setManualText] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [submittingManual, setSubmittingManual] = useState(false);

  const handleAdd = async () => {
    if (!url.trim()) return;
    await onAdd(url.trim());
    setUrl('');
  };

  const handleManualSubmit = async () => {
    if (!manualText.trim()) return;
    setSubmittingManual(true);
    try {
      await onManualPaste(competitor.id, manualText.trim());
      setShowManual(false);
    } finally {
      setSubmittingManual(false);
    }
  };

  // New competitor input (no competitor object yet)
  if (!competitor) {
    return (
      <div className="row" style={{ gap: 'var(--space-3)' }}>
        <div className="form-field" style={{ flex: 1 }}>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://competitor-website.com/pricing"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={handleAdd}
          loading={adding}
          disabled={!url.trim()}
        >
          Add
        </Button>
      </div>
    );
  }

  // Existing competitor with status
  const status = STATUS_BADGE[competitor.scrape_status] || STATUS_BADGE.pending;

  return (
    <div className="stack-sm" style={{
      padding: 'var(--space-3) var(--space-4)',
      backgroundColor: 'var(--color-surface-2)',
      borderRadius: 'var(--radius-sm)',
      border: '1px solid var(--color-border)',
    }}>
      <div className="row-between">
        <div className="row" style={{ gap: 'var(--space-3)', flex: 1, minWidth: 0 }}>
          <span
            className="text-sm"
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              minWidth: 0,
            }}
          >
            {competitor.url}
          </span>
          <span className={`badge ${status.className}`}>{status.label}</span>
        </div>
        <div className="row" style={{ gap: 'var(--space-2)', flexShrink: 0 }}>
          {competitor.scrape_status === 'failed' && !showManual && (
            <Button variant="secondary" size="sm" onClick={() => setShowManual(true)}>
              Paste Manually
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onDelete(competitor.id)}>
            ✕
          </Button>
        </div>
      </div>

      {showManual && (
        <div className="stack-sm">
          <div className="form-field">
            <label>Paste competitor pricing info</label>
            <textarea
              value={manualText}
              onChange={(e) => setManualText(e.target.value)}
              placeholder="Paste the competitor's pricing page text here..."
              rows={4}
            />
          </div>
          <div className="row" style={{ gap: 'var(--space-2)' }}>
            <Button
              variant="primary"
              size="sm"
              onClick={handleManualSubmit}
              loading={submittingManual}
              disabled={!manualText.trim()}
            >
              Submit
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowManual(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
