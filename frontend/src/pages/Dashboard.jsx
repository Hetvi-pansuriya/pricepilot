import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { listCompanies, deleteCompany } from '../api/companies';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import EmptyState from '../components/common/EmptyState';
import '../styles/Dashboard.css';
import '../styles/layout.css';
import '../styles/components.css';

const INDUSTRY_LABELS = {
  saas_b2b: 'SaaS B2B',
  saas_b2c: 'SaaS B2C',
  project_management: 'Project Mgmt',
  hr_software: 'HR Software',
  analytics: 'Analytics',
  crm: 'CRM',
  payments: 'Payments',
  ecommerce_tools: 'E-commerce',
  other: 'Other',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCompanies = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await listCompanies();
      setCompanies(data);
    } catch (err) {
      setError(err.detail || 'Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this company and all its data?')) return;
    try {
      await deleteCompany(id);
      setCompanies((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      setError(err.detail || 'Failed to delete company');
    }
  };

  if (loading) return <div className="page-container"><Spinner message="Loading companies..." /></div>;

  return (
    <div className="page-container">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>Your Companies</h1>
          <p>Manage and analyze the pricing strategies of your portfolio.</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/company/new/setup')}>
          + New Company
        </Button>
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {/* Company grid */}
      {companies.length === 0 && !error ? (
        <EmptyState
          icon="📊"
          title="No companies yet"
          description="Create your first company to start analyzing pricing strategies."
          actionLabel="+ New Company"
          onAction={() => navigate('/company/new/setup')}
        />
      ) : (
        <div className="grid-auto">
          {companies.map((company) => (
            <Card key={company.id} className="company-card" onClick={() => navigate(`/company/${company.id}/setup`)}>
              <div className="company-card-header">
                <div className="company-card-icon">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 3h6v6H3V3zm0 8h6v6H3v-6zm8-8h6v6h-6V3zm0 8h6v6h-6v-6z" />
                  </svg>
                </div>
                <span className="badge badge-primary">
                  {INDUSTRY_LABELS[company.industry] || company.industry}
                </span>
              </div>

              <div>
                <h3 className="company-card-name">{company.name}</h3>
                {company.description && (
                  <p className="company-card-desc">{company.description}</p>
                )}
              </div>

              <div className="row" style={{ gap: 'var(--space-3)', marginTop: 'auto' }}>
                <button
                  className="company-card-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/company/${company.id}/setup`);
                  }}
                >
                  View Analysis →
                </button>
                <button
                  className="company-card-action"
                  style={{ color: 'var(--color-text-muted)', marginLeft: 'auto' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/company/${company.id}/history`);
                  }}
                >
                  History
                </button>
                <button
                  className="company-card-action"
                  style={{ color: 'var(--color-danger)' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(company.id);
                  }}
                >
                  ✕
                </button>
              </div>
            </Card>
          ))}

          {/* Dashed "add new" placeholder */}
          <button
            className="new-company-placeholder"
            onClick={() => navigate('/company/new/setup')}
          >
            + Add Company
          </button>
        </div>
      )}
    </div>
  );
}
