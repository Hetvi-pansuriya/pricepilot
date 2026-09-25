import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listCompanies } from "../api/companies";
import { getHistory } from "../api/analysis";
import Button from "../components/common/Button";
import Spinner from "../components/common/Spinner";
import ErrorBanner from "../components/common/ErrorBanner";
import EmptyState from "../components/common/EmptyState";
import Badge from "../components/common/Badge";
import "./History.css";

export default function AllHistory() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  useEffect(() => {
    (async () => {
      try {
        const companies = await listCompanies();
        const histories = await Promise.all(
          companies.map((company) =>
            getHistory(company.id)
              .then((items) => items.map((item) => ({
                ...item,
                companyId: company.id,
                companyName: company.name,
              })))
              .catch(() => []),
          ),
        );
        setEntries(
          histories.flat().sort(
            (a, b) => new Date(b.started_at) - new Date(a.started_at),
          ),
        );
      } catch (err) {
        setError(err.detail || "Failed to load history.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);
  if (loading) return <main className="page-container"><Spinner message="Loading all analyses…" /></main>;
  return <main className="page-container stack-lg">
    <div><h1>Analysis History</h1><p>All pricing analyses across all companies.</p></div>
    <ErrorBanner message={error} />
    {!entries.length ? <EmptyState icon="▥" title="No analyses yet" description="Run your first analysis from the Dashboard." /> :
      <div className="card table-wrap"><table><thead><tr><th>Company</th><th>Date</th><th>Status</th><th>Action</th></tr></thead><tbody>{entries.map((entry) => <tr key={entry.session_id}><td><strong>{entry.companyName}</strong></td><td>{new Date(entry.started_at).toLocaleString()}</td><td><Badge variant={entry.status === "completed" ? "success" : entry.status === "partial" ? "warning" : entry.status === "failed" ? "danger" : "info"}>{entry.status}</Badge></td><td>{entry.report_id ? <Button size="sm" variant="ghost" onClick={() => navigate(`/company/${entry.companyId}/report/${entry.session_id}`)}>View Report →</Button> : "—"}</td></tr>)}</tbody></table></div>}
  </main>;
}
