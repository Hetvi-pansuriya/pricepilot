import { useParams, useNavigate } from 'react-router-dom';
import { usePolling } from '../hooks/usePolling';
import { getHistory, startAnalysis } from '../api/analysis';
import Button from '../components/common/Button';
import ErrorBanner from '../components/common/ErrorBanner';
import '../styles/AnalysisWaiting.css';
import '../styles/layout.css';

const ANALYSIS_STEPS = [
  { label: 'Calculating revenue', icon: '💰' },
  { label: 'Auditing features', icon: '🔍' },
  { label: 'Benchmarking competitors', icon: '📊' },
  { label: 'Generating recommendations', icon: '⚡' },
];

function getProgressFromStatus(status) {
  switch (status) {
    case 'pending': return 0;
    case 'running': return 2;
    case 'completed': return 4;
    case 'partial': return 4;
    case 'failed': return -1;
    default: return 0;
  }
}

export default function AnalysisWaiting() {
  const { companyId, sessionId } = useParams();
  const navigate = useNavigate();

  const { data, error, isPolling } = usePolling(
    () => getHistory(companyId),
    (history) => {
      const session = history?.find((h) => h.session_id === sessionId);
      if (!session) return false;
      return ['completed', 'partial', 'failed'].includes(session.status);
    },
    3000,
    120000,
    true
  );

  const currentSession = data?.find((h) => h.session_id === sessionId);
  const status = currentSession?.status || 'pending';
  const progress = getProgressFromStatus(status);
  const failed = status === 'failed';
  const done = status === 'completed' || status === 'partial';

  // Auto-navigate on completion
  if (done && currentSession) {
    const reportSessionId = currentSession.session_id;
    setTimeout(() => navigate(`/company/${companyId}/report/${reportSessionId}`), 800);
  }

  const handleRetry = async () => {
    try {
      const { session_id } = await startAnalysis(companyId);
      navigate(`/company/${companyId}/analyzing/${session_id}`, { replace: true });
    } catch (err) {
      // Error will show in the polling
    }
  };

  return (
    <div className="analysis-waiting">
      {/* Pulsing orb */}
      {!failed && <div className="analysis-orb" />}
      {failed && (
        <div className="analysis-orb" style={{
          background: 'var(--color-danger)',
          boxShadow: '0 0 60px rgba(239, 68, 68, 0.3)',
          animation: 'none',
          opacity: 0.8,
        }} />
      )}

      <h1 className="analysis-title">
        {failed ? 'Analysis failed' : done ? 'Analysis complete!' : 'Analyzing your pricing strategy...'}
      </h1>

      {!failed && !done && (
        <div className="analysis-estimate">
          <span>⏱</span>
          <span>Estimated time: 20-30 seconds</span>
        </div>
      )}

      {error && <ErrorBanner message={error.detail || error.message} />}

      {/* Progress steps */}
      <div className="analysis-steps">
        {ANALYSIS_STEPS.map((s, idx) => {
          const isCompleted = progress > idx;
          const isActive = progress === idx && !failed && !done;

          return (
            <div
              key={idx}
              className={`analysis-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
            >
              <div className="analysis-step-icon">
                {isCompleted ? '✓' : s.icon}
              </div>
              <span className="analysis-step-label">{s.label}</span>
              {isActive && (
                <div className="analysis-step-progress">
                  <div className="analysis-step-progress-bar" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Retry on failure */}
      {failed && (
        <div className="analysis-error">
          <Button variant="primary" onClick={handleRetry}>
            ↻ Retry Analysis
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/company/${companyId}/setup`)}>
            Back to Setup
          </Button>
        </div>
      )}

      {/* Powered by */}
      <div className="analysis-powered">
        <span>✨</span>
        <span>Powered by Gemini AI</span>
      </div>
    </div>
  );
}
