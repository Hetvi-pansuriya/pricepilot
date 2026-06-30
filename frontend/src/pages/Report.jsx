import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getReport, getReportPdfUrl } from '../api/analysis';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import Button from '../components/common/Button';
import ExecutiveSummary from '../components/report/ExecutiveSummary';
import RevenueChart from '../components/report/RevenueChart';
import FeatureAuditTable from '../components/report/FeatureAuditTable';
import CompetitorTable from '../components/report/CompetitorTable';
import StrategyCard from '../components/report/StrategyCard';
import '../styles/Report.css';
import '../styles/layout.css';
import '../styles/components.css';

export default function Report() {
  const { companyId, sessionId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getReport(sessionId);
        setReport(data);
      } catch (err) {
        setError(err.detail || 'Failed to load report');
      } finally {
        setLoading(false);
      }
    };
    fetchReport();
  }, [sessionId]);

  const handleDownloadPdf = () => {
    const token = localStorage.getItem('token');
    const url = getReportPdfUrl(sessionId);
    // Open in new tab with auth — use fetch + blob for authenticated download
    fetch(url, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (!res.ok) throw new Error('PDF not available');
        return res.blob();
      })
      .then((blob) => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `pricing-report-${sessionId}.pdf`;
        a.click();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(() => setError('PDF generation is still pending. Try again later.'));
  };

  if (loading) return <div className="page-container"><Spinner message="Loading report..." /></div>;
  if (error && !report) {
    return (
      <div className="page-container">
        <ErrorBanner message={error} />
        <Button variant="secondary" onClick={() => navigate(`/company/${companyId}/history`)} style={{ marginTop: 'var(--space-4)' }}>
          ← Back to History
        </Button>
      </div>
    );
  }

  const json = report?.json_report || {};
  const mod1 = json.module1_revenue;
  const mod2 = json.module2_features;
  const mod3 = json.module3_benchmark;
  const mod4 = json.module4_recommendations;

  // Find recommended strategy (highest MRR change)
  const strategies = mod4?.strategies || [];
  const recommendedIdx = strategies.reduce(
    (best, s, idx) => (s.predicted_mrr_change_pct > (strategies[best]?.predicted_mrr_change_pct ?? -Infinity) ? idx : best),
    0
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="report-header-row">
        <div className="report-header">
          <h1>Pricing Analysis Report</h1>
          <p>Session: {sessionId?.slice(0, 8)}...</p>
        </div>
        <div className="row" style={{ gap: 'var(--space-3)' }}>
          <Button variant="secondary" onClick={() => navigate(`/company/${companyId}/history`)}>
            ← History
          </Button>
          <Button
            variant="primary"
            className="report-pdf-btn"
            onClick={handleDownloadPdf}
            disabled={!report?.pdf_path}
          >
            ⬇ Download PDF
          </Button>
        </div>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      <div className="stack-xl">
        {/* Executive Summary */}
        <div className="report-section">
          {mod4 && !mod4.error ? (
            <ExecutiveSummary summary={mod4.executive_summary} />
          ) : (
            <div className="module-unavailable">
              Executive summary is unavailable — re-run the analysis.
            </div>
          )}
        </div>

        {/* Revenue Chart */}
        <div className="report-section">
          {mod1 && !mod1.error ? (
            <RevenueChart module1={mod1} />
          ) : (
            <div className="module-unavailable">
              Revenue data is unavailable — re-run the analysis.
            </div>
          )}
        </div>

        {/* Feature Audit + Competitor Benchmark */}
        <div className="report-audit-grid">
          <FeatureAuditTable module2={mod2} />
          <CompetitorTable module3={mod3} />
        </div>

        {/* Strategic Recommendations */}
        {strategies.length > 0 && (
          <div className="report-section">
            <h3 className="report-section-title">Strategic Recommendations</h3>
            <div className="report-strategies">
              {strategies.map((strategy, idx) => (
                <StrategyCard
                  key={idx}
                  strategy={strategy}
                  isRecommended={idx === recommendedIdx}
                />
              ))}
            </div>
          </div>
        )}

        {strategies.length === 0 && mod4 && !mod4.error && (
          <div className="module-unavailable">
            No strategy recommendations available for this analysis.
          </div>
        )}

        {mod4?.error && (
          <div className="module-unavailable">
            Recommendations are unavailable — re-run the analysis.
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="report-footer">
        <p>Powered by PricePilot Engine</p>
      </div>
    </div>
  );
}
