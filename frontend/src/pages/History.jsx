import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getHistory, startAnalysis } from "../api/analysis";
import { getCompany } from "../api/companies";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import Spinner from "../components/common/Spinner";
import ErrorBanner from "../components/common/ErrorBanner";
import EmptyState from "../components/common/EmptyState";
import "./History.css";
const variants = {
  completed: "success",
  partial: "warning",
  running: "info",
  failed: "danger",
  pending: "neutral",
};
export default function History() {
  const { companyId } = useParams(),
    n = useNavigate(),
    [rows, setRows] = useState([]),
    [company, setCompany] = useState(),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [selected, setSelected] = useState([]);
  useEffect(() => {
    Promise.all([getHistory(companyId), getCompany(companyId)])
      .then(([h, c]) => {
        setRows(
          [...h].sort(
            (a, b) => new Date(b.started_at) - new Date(a.started_at),
          ),
        );
        setCompany(c);
      })
      .catch((e) => setError(e.detail))
      .finally(() => setLoading(false));
  }, [companyId]);
  const run = async () => {
    try {
      const s = await startAnalysis(companyId);
      n(`/company/${companyId}/analyzing/${s.session_id}`);
    } catch (e) {
      setError(e.detail);
    }
  };
  const toggleSelect = (sessionId) =>
    setSelected((current) =>
      current.includes(sessionId)
        ? current.filter((id) => id !== sessionId)
        : current.length < 2
          ? [...current, sessionId]
          : current,
    );
  return (
    <main className="page-container stack-lg">
      <div className="row-between">
        <div>
          <h1>Analysis History</h1>
          <p>{company?.name}</p>
        </div>
        <div className="row">
          {selected.length === 2 && (
            <Button onClick={() => n(`/company/${companyId}/compare/${selected[0]}/${selected[1]}`)}>
              Compare selected →
            </Button>
          )}
          <Button variant="secondary" onClick={() => n("/dashboard")}>
            ← Dashboard
          </Button>
          <Button onClick={run}>Run New Analysis</Button>
        </div>
      </div>
      <ErrorBanner message={error} />
      {loading ? (
        <Spinner message="Loading history…" />
      ) : rows.length ? (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Select</th>
                <th>Date</th>
                <th>Session ID</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.session_id}>
                  <td>
                    {["completed", "partial"].includes(r.status) && (
                      <input
                        type="checkbox"
                        checked={selected.includes(r.session_id)}
                        disabled={selected.length >= 2 && !selected.includes(r.session_id)}
                        onChange={() => toggleSelect(r.session_id)}
                        aria-label={`Select session ${r.session_id.slice(0, 8)}`}
                      />
                    )}
                  </td>
                  <td>{new Date(r.started_at).toLocaleString()}</td>
                  <td>{r.session_id.slice(0, 8)}</td>
                  <td>
                    <Badge variant={variants[r.status]}>
                      <span className={`status-${r.status}`}>{r.status}</span>
                    </Badge>
                  </td>
                  <td>
                    {["completed", "partial"].includes(r.status) ? (
                      <Button
                        size="sm"
                        onClick={() =>
                          n(`/company/${companyId}/report/${r.session_id}`)
                        }
                      >
                        View Report →
                      </Button>
                    ) : r.status === "failed" ? (
                      <Button size="sm" onClick={run}>
                        Retry ↻
                      </Button>
                    ) : (
                      <span className="muted">Processing…</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon="◷"
          title="No analyses yet for this company"
          description="Run your first analysis to see pricing recommendations."
          actionLabel="Run Analysis"
          onAction={run}
        />
      )}
    </main>
  );
}
