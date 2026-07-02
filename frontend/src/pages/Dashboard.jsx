import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  deleteCompany,
  getCompany,
  listCompanies,
} from "../api/companies";
import { getHistory } from "../api/analysis";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import Badge from "../components/common/Badge";
import ErrorBanner from "../components/common/ErrorBanner";
import EmptyState from "../components/common/EmptyState";
import Spinner from "../components/common/Spinner";
import "./Dashboard.css";
import "./DashboardAdjustments.css";

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function Dashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [totalAnalyses, setTotalAnalyses] = useState(0);
  const [lastAnalysisDate, setLastAnalysisDate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        const companies = await listCompanies();
        const details = await Promise.all(
          companies.map((company) =>
            getCompany(company.id).catch(() => company),
          ),
        );
        setItems(details);
        const histories = await Promise.all(
          companies.map((company) =>
            getHistory(company.id)
              .then((rows) =>
                rows.map((row) => ({
                  ...row,
                  companyId: company.id,
                  companyName: company.name,
                })),
              )
              .catch(() => []),
          ),
        );
        const sessions = histories
          .flat()
          .sort((a, b) => new Date(b.started_at) - new Date(a.started_at));
        setTotalAnalyses(sessions.length);
        setLastAnalysisDate(sessions[0]?.started_at || null);
      } catch (err) {
        setError(err.detail);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteCompany(deleteTarget.id);
      setItems((current) =>
        current.filter((company) => company.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
    } catch (err) {
      setError(err.detail);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <main className="page-container stack-lg">
      <div className="row-between">
        <div>
          <h1>Your Companies</h1>
          <p>Manage pricing models and run analysis.</p>
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
        </div>
      )}
      {loading ? (
        <Spinner message="Loading companies..." />
      ) : items.length ? (
        <div className="company-grid">
          {items.map((company) => {
            const savedTiers = company.tiers || [];
            const hasFeatures = savedTiers.some(
              (tier) => (tier.features || []).length > 0,
            );
            const complete = savedTiers.length > 0 && hasFeatures;
            return (
              <Card
                key={company.id}
                className="company-card stack"
                onClick={() => navigate(`/company/${company.id}/setup`)}
              >
                <div className="row-between">
                  <h2 className="company-name">{company.name}</h2>
                  <Badge variant={complete ? "success" : "warning"}>
                    {complete ? "Complete" : "Incomplete"}
                  </Badge>
                </div>
                <Badge variant="info">
                  {company.industry?.replaceAll("_", " ").toUpperCase()}
                </Badge>
                {company.description && <p>{company.description}</p>}
                {!complete && (
                  <p className="setup-warning">
                    Add at least one tier and feature to complete setup.
                  </p>
                )}
                <p className="font-sm">
                  Created {formatDate(company.created_at)}
                </p>
                <div className="card-actions">
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
                  <div className="card-actions-right">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={(event) => {
                        event.stopPropagation();
                        navigate(`/company/${company.id}/setup`);
                      }}
                    >
                      ✎ Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={(event) => {
                        event.stopPropagation();
                        setDeleteTarget(company);
                      }}
                      aria-label={`Delete ${company.name}`}
                      title="Delete company"
                    >
                      🗑
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
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
      {deleteTarget && (
        <div className="modal-backdrop" role="presentation">
          <section
            className="delete-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-company-title"
          >
            <h2 id="delete-company-title">Delete {deleteTarget.name}?</h2>
            <p>
              This permanently deletes its tiers, features, competitors, and
              reports. This action cannot be undone.
            </p>
            <div className="row modal-actions">
              <Button
                variant="secondary"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button variant="danger" loading={deleting} onClick={confirmDelete}>
                Delete Company
              </Button>
            </div>
          </section>
        </div>
      )}
    </main>
  );
}
