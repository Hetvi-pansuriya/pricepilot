import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listCompanies, deleteCompany } from "../api/companies";
import { getHistory, getReport } from "../api/analysis";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import ErrorBanner from "../components/common/ErrorBanner";
import EmptyState from "../components/common/EmptyState";
import Spinner from "../components/common/Spinner";
import "./Dashboard.css";
import "./DashboardLight.css";

function formatDate(iso) {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalAnalyses, setTotalAnalyses] = useState(0);
  const [lastAnalysisDate, setLastAnalysisDate] = useState(null);
  const [latestMrr, setLatestMrr] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    listCompanies()
      .then(async (companies) => {
        setItems(companies);
        const histories = await Promise.all(
          companies.map((company) =>
            getHistory(company.id).catch(() => []),
          ),
        );
        setTotalAnalyses(
          histories.reduce((count, history) => count + history.length, 0),
        );
        const allSessions = histories
          .flat()
          .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
        setLastAnalysisDate(allSessions[0]?.started_at || null);
        const latestCompleted = allSessions.find((session) =>
          ["completed", "partial"].includes(session.status),
        );
        if (latestCompleted) {
          const latestReport = await getReport(latestCompleted.session_id).catch(
            () => null,
          );
          setLatestMrr(
            latestReport?.json_report?.module1_revenue?.current_mrr ?? null,
          );
        }
      })
      .catch((err) => setError(err.detail))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="page-container stack-lg">
      <div className="row-between">
        <div>
          <h1>Your Companies</h1>
          <p className="text-muted">Manage pricing models and run analysis.</p>
        </div>
        <Button onClick={() => navigate("/company/new/setup")}>
          + New Company
        </Button>
      </div>
      <ErrorBanner message={error} />

      {!loading && items.length > 0 && (
        <div className="stats-row">
          <div className="stat-card">
            <span className="stat-value">{items.length}</span>
            <span className="stat-label">Companies</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">{totalAnalyses}</span>
            <span className="stat-label">Analyses Run</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {lastAnalysisDate
                ? new Date(lastAnalysisDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })
                : "—"}
            </span>
            <span className="stat-label">Last Analysis</span>
          </div>
          <div className="stat-card">
            <span className="stat-value">
              {latestMrr == null
                ? "—"
                : `$${Number(latestMrr).toLocaleString()}`}
            </span>
            <span className="stat-label">Recent MRR</span>
          </div>
        </div>
      )}

      {loading ? (
        <Spinner message="Loading companies..." />
      ) : items.length ? (
        <div className="company-grid">
          {items.map((company) => (
            <Card
              key={company.id}
              className="company-card stack"
              onClick={() => navigate(`/company/${company.id}/setup`)}
            >
              <div className="row-between">
                <h2 className="company-name">{company.name}</h2>
                <Badge variant="info">
                  {company.industry?.replaceAll("_", " ").toUpperCase()}
                </Badge>
              </div>
              {company.description && (
                <p className="company-desc text-muted">
                  {company.description}
                </p>
              )}
              <p className="text-muted font-sm">
                Created {formatDate(company.created_at)}
              </p>
              <div className="row card-actions">
                <Button size="sm">Open →</Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(`/company/${company.id}/history`);
                  }}
                >
                  History
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={async (event) => {
                    event.stopPropagation();
                    if (
                      window.confirm(
                        `Delete ${company.name}? This cannot be undone.`,
                      )
                    ) {
                      await deleteCompany(company.id);
                      setItems((current) =>
                        current.filter((item) => item.id !== company.id),
                      );
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          icon="◇"
          title="No companies yet"
          description="Add your first company to uncover its pricing potential."
          actionLabel="+ New Company"
          onAction={() => navigate("/company/new/setup")}
        />
      )}
    </main>
  );
}
