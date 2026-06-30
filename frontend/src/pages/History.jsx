import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getHistory, startAnalysis } from '../api/analysis';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import EmptyState from '../components/common/EmptyState';
import '../styles/History.css';
import '../styles/layout.css';
import '../styles/components.css';

const STATUS_CONFIG = {
  completed: { label: 'Completed', dotClass: 'completed', badgeClass: 'badge-success' },
  running: { label: 'Running', dotClass: 'running', badgeClass: 'badge-warning' },
  pending: { label: 'Pending', dotClass: 'pending', badgeClass: 'badge-neutral' },
  partial: { label: 'Partial', dotClass: 'partial', badgeClass: 'badge-warning' },
  failed: { label: 'Failed', dotClass: 'failed', badgeClass: 'badge-danger' },
};

function formatDate(isoString) {
  if (!isoString) return '—';
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatTime(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

export default function History() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getHistory(companyId);
      // Sort newest first
      data.sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
      setHistory(data);
    } catch (err) {
      setError(err.detail || 'Failed to load analysis history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [companyId]);

  const handleNewAnalysis = async () => {
    try {
      const { session_id } = await startAnalysis(companyId);
      navigate(`/company/${companyId}/analyzing/${session_id}`);
    } catch (err) {
      setError(err.detail || 'Failed to start analysis');
    }
  };

  const handleRetry = async () => {
    await handleNewAnalysis();
  };

  if (loading) return <div className="page-container"><Spinner message="Loading history..." /></div>;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="history-header">
        <div>
          <h1>Analysis History</h1>
          <p>Comprehensive log of pricing model simulations and market impact reports.</p>
        </div>
        <div className="row" style={{ gap: 'var(--space-3)' }}>
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            ← Dashboard
          </Button>
          <Button variant="primary" onClick={handleNewAnalysis}>
            🔄 New Analysis
          </Button>
        </div>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {history.length === 0 && !error ? (
        <EmptyState
          icon="📋"
          title="No analyses yet"
          description="Run your first analysis to see results here."
          actionLabel="Run Analysis"
          onAction={handleNewAnalysis}
        />
      ) : (
        <div className="history-table-container">
          <table className="history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Session</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => {
                const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
                const canView = item.status === 'completed' || item.status === 'partial';

                return (
                  <tr key={item.session_id}>
                    <td>
                      <div className="history-date">{formatDate(item.started_at)}</div>
                      <div className="history-date-time">{formatTime(item.started_at)}</div>
                    </td>
                    <td>
                      <span className="history-session">
                        {item.session_id?.slice(0, 8)}...
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${cfg.badgeClass}`}>
                        <span className={`history-status-dot ${cfg.dotClass}`} />
                        {cfg.label}
                      </span>
                    </td>
                    <td>
                      {canView ? (
                        <button
                          className="history-action-link"
                          onClick={() => navigate(`/company/${companyId}/report/${item.session_id}`)}
                        >
                          View Report →
                        </button>
                      ) : item.status === 'failed' ? (
                        <button className="history-action-link" onClick={handleRetry} style={{ color: 'var(--color-danger)' }}>
                          Retry ↻
                        </button>
                      ) : item.status === 'running' || item.status === 'pending' ? (
                        <span className="text-sm text-muted">Processing</span>
                      ) : null}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
