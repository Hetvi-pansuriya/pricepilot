import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getReport, getReportPdfUrl } from "../api/analysis";
import Button from "../components/common/Button";
import Spinner from "../components/common/Spinner";
import ErrorBanner from "../components/common/ErrorBanner";
import ExecutiveSummary from "../components/report/ExecutiveSummary";
import RevenueChart from "../components/report/RevenueChart";
import FeatureAuditTable from "../components/report/FeatureAuditTable";
import CompetitorTable from "../components/report/CompetitorTable";
import StrategyCard from "../components/report/StrategyCard";
import "./Report.css";
export default function Report() {
  const { companyId, sessionId } = useParams(),
    n = useNavigate(),
    [report, setReport] = useState(),
    [error, setError] = useState("");
  useEffect(() => {
    getReport(sessionId)
      .then(setReport)
      .catch((e) => setError(e.detail));
  }, [sessionId]);
  if (error)
    return (
      <main className="page-container">
        <ErrorBanner message={error} />
      </main>
    );
  if (!report)
    return (
      <main className="page-container">
        <Spinner message="Loading your analysis…" />
      </main>
    );
  const j = report.json_report || {},
    m1 = j.module1_revenue || {},
    currentMrr = m1.current_mrr ?? 0,
    hasRevenueData =
      currentMrr > 0 || Object.keys(m1.scenarios || {}).length > 0,
    strategies =
      j.module4_recommendations && !j.module4_recommendations.error
        ? j.module4_recommendations.strategies || []
        : [],
    max = Math.max(
      ...strategies.map((x) => x.predicted_mrr_change_pct),
      -Infinity,
    );
  const pdf = async () => {
    const blob = await getReportPdfUrl(sessionId),
      url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = `pricing-report-${sessionId}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <main className="page-container stack-lg report-page">
      <div className="row-between">
        <div>
          <h1>Pricing Analysis Report</h1>
          <p>Session {sessionId.slice(0, 8)}</p>
        </div>
        <div className="row">
          <Button
            variant="secondary"
            onClick={() => n(`/company/${companyId}/history`)}
          >
            ← History
          </Button>
          <Button
            disabled={!report.pdf_path}
            title={!report.pdf_path ? "PDF generation pending" : ""}
            onClick={pdf}
          >
            ⬇ Download PDF
          </Button>
          <Button
            variant="secondary"
            onClick={() => n(`/company/${companyId}/setup`)}
          >
            Update &amp; re-analyze →
          </Button>
        </div>
      </div>
      <ExecutiveSummary module={j.module4_recommendations} />
      <RevenueChart module={hasRevenueData ? m1 : null} />
      <div className="grid-2 report-section">
        <FeatureAuditTable module={j.module2_features} />
        <CompetitorTable module={j.module3_benchmark} />
      </div>
      <section className="stack report-section">
        <h2>3 Alternative Pricing Strategies</h2>
        {strategies.length ? (
          <div className="strategies-stack">
            {strategies.map((s, i) => (
              <StrategyCard
                key={i}
                strategy={s}
                recommended={s.predicted_mrr_change_pct === max}
              />
            ))}
          </div>
        ) : (
          <p>Recommendations unavailable</p>
        )}
      </section>
    </main>
  );
}
 
