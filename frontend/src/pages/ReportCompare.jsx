import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getReport } from "../api/analysis";
import Button from "../components/common/Button";
import Card from "../components/common/Card";
import Spinner from "../components/common/Spinner";
import ErrorBanner from "../components/common/ErrorBanner";
import "./ReportCompare.css";

const money = (value) =>
  value == null ? "—" : `$${Number(value).toLocaleString()}`;

export default function ReportCompare() {
  const { sessionA, sessionB } = useParams();
  const navigate = useNavigate();
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    Promise.all([getReport(sessionA), getReport(sessionB)])
      .then((items) =>
        setReports(
          items.sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
        ),
      )
      .catch(() => setError("Could not load reports for comparison"));
  }, [sessionA, sessionB]);
  if (error) return <main className="page-container"><ErrorBanner message={error} /></main>;
  if (reports.length < 2) return <main className="page-container"><Spinner message="Loading reports..." /></main>;
  const [older, newer] = reports;
  const oldMrr = older.json_report?.module1_revenue?.current_mrr;
  const newMrr = newer.json_report?.module1_revenue?.current_mrr;
  const delta = oldMrr != null && newMrr != null ? newMrr - oldMrr : null;
  const percent = oldMrr ? ((delta / oldMrr) * 100).toFixed(1) : null;
  const oldAudit = older.json_report?.module2_features?.feature_audit || [];
  const newAudit = newer.json_report?.module2_features?.feature_audit || [];
  const oldMap = Object.fromEntries(oldAudit.map((f) => [f.feature_name, f.classification]));
  const changed = newAudit.filter((f) => oldMap[f.feature_name] && oldMap[f.feature_name] !== f.classification);
  return (
    <main className="page-container stack-lg report-page">
      <div className="row-between">
        <div><h1>Report Comparison</h1><p>{new Date(older.created_at).toLocaleDateString()} vs {new Date(newer.created_at).toLocaleDateString()}</p></div>
        <Button variant="secondary" onClick={() => navigate(-1)}>← Back</Button>
      </div>
      <Card className="stack"><h2>MRR Comparison</h2><div className="grid-3 compare-metrics">
        <div><span>Older report</span><strong>{money(oldMrr)}</strong></div>
        <div><span>Change</span><strong className={delta > 0 ? "success" : delta < 0 ? "danger" : "muted"}>{delta == null ? "—" : `${delta > 0 ? "+" : ""}${money(delta)}${percent ? ` (${percent}%)` : ""}`}</strong></div>
        <div><span>Newer report</span><strong>{money(newMrr)}</strong></div>
      </div></Card>
      <Card className="stack"><h2>Feature Audit Changes</h2>{changed.length ? changed.map((f) => <div className="compare-change" key={f.feature_name}><strong>{f.feature_name}</strong><span className="danger">{oldMap[f.feature_name]}</span><span>→</span><span className="success">{f.classification}</span></div>) : <p>No feature classification changes between these reports.</p>}</Card>
    </main>
  );
}
