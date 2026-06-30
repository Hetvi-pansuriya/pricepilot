import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createCompany, getCompany, updateCompany } from '../api/companies';
import { addTier, updateTier, deleteTier } from '../api/tiers';
import { addFeature, deleteFeature } from '../api/features';
import { addCompetitor, deleteCompetitor, setManualText } from '../api/competitors';
import { startAnalysis } from '../api/analysis';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Spinner from '../components/common/Spinner';
import ErrorBanner from '../components/common/ErrorBanner';
import TierFormCard from '../components/setup/TierFormCard';
import CompetitorInput from '../components/setup/CompetitorInput';
import '../styles/CompanySetup.css';
import '../styles/layout.css';
import '../styles/components.css';

const INDUSTRY_OPTIONS = [
  { value: 'saas_b2b', label: 'SaaS B2B' },
  { value: 'saas_b2c', label: 'SaaS B2C' },
  { value: 'project_management', label: 'Project Management' },
  { value: 'hr_software', label: 'HR Software' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'crm', label: 'CRM' },
  { value: 'payments', label: 'Payments' },
  { value: 'ecommerce_tools', label: 'E-commerce Tools' },
  { value: 'other', label: 'Other' },
];

const STEPS = [
  { num: 1, label: 'Basic Info' },
  { num: 2, label: 'Tiers & Features' },
  { num: 3, label: 'Competitors' },
];

export default function CompanySetup() {
  const { companyId } = useParams();
  const navigate = useNavigate();
  const isNew = companyId === 'new' || !companyId;

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [companyIdState, setCompanyIdState] = useState(isNew ? null : companyId);

  // Step 1 form
  const [form, setForm] = useState({ name: '', industry: 'saas_b2b', description: '' });

  // Step 2
  const [tiers, setTiers] = useState([]);
  const [newTiers, setNewTiers] = useState([]);

  // Step 3
  const [competitors, setCompetitors] = useState([]);
  const [addingComp, setAddingComp] = useState(false);

  // Load existing company
  const loadCompany = useCallback(async () => {
    if (isNew) return;
    setLoading(true);
    try {
      const data = await getCompany(companyId);
      setForm({ name: data.name, industry: data.industry, description: data.description || '' });
      setTiers(data.tiers || []);
      setCompetitors(data.competitors || []);
      setCompanyIdState(data.id);
    } catch (err) {
      setError(err.detail || 'Failed to load company');
    } finally {
      setLoading(false);
    }
  }, [companyId, isNew]);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  // Reload company data (to get updated tiers/features/competitors)
  const reloadCompany = async () => {
    if (!companyIdState) return;
    try {
      const data = await getCompany(companyIdState);
      setTiers(data.tiers || []);
      setCompetitors(data.competitors || []);
    } catch (err) {
      // silent reload
    }
  };

  // ---- Step 1: Save company ----
  const handleStep1Next = async () => {
    if (!form.name.trim()) {
      setError('Company name is required');
      return;
    }
    setSaving(true);
    setError('');
    try {
      if (companyIdState) {
        await updateCompany(companyIdState, form);
      } else {
        const data = await createCompany(form);
        setCompanyIdState(data.id);
        // Update URL without full navigation
        window.history.replaceState(null, '', `/company/${data.id}/setup`);
      }
      setStep(2);
    } catch (err) {
      setError(err.detail || 'Failed to save company');
    } finally {
      setSaving(false);
    }
  };

  // ---- Step 2: Tier management ----
  const handleSaveTier = async (payload, existingTierId) => {
    setSaving(true);
    setError('');
    try {
      if (existingTierId) {
        await updateTier(companyIdState, existingTierId, payload);
      } else {
        await addTier(companyIdState, payload);
      }
      await reloadCompany();
      setNewTiers([]);
    } catch (err) {
      setError(err.detail || 'Failed to save tier');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTier = async (tierId) => {
    setSaving(true);
    setError('');
    try {
      await deleteTier(companyIdState, tierId);
      await reloadCompany();
    } catch (err) {
      setError(err.detail || 'Failed to delete tier');
    } finally {
      setSaving(false);
    }
  };

  const handleAddFeature = async (tierId, featureName) => {
    setError('');
    try {
      await addFeature(companyIdState, tierId, { feature_name: featureName });
      await reloadCompany();
    } catch (err) {
      setError(err.detail || 'Failed to add feature');
    }
  };

  const handleRemoveFeature = async (tierId, featureId) => {
    setError('');
    try {
      await deleteFeature(companyIdState, tierId, featureId);
      await reloadCompany();
    } catch (err) {
      setError(err.detail || 'Failed to delete feature');
    }
  };

  // ---- Step 3: Competitors ----
  const handleAddCompetitor = async (url) => {
    setAddingComp(true);
    setError('');
    try {
      await addCompetitor(companyIdState, url);
      await reloadCompany();
    } catch (err) {
      setError(err.detail || 'Failed to add competitor');
    } finally {
      setAddingComp(false);
    }
  };

  const handleDeleteCompetitor = async (compId) => {
    setError('');
    try {
      await deleteCompetitor(companyIdState, compId);
      await reloadCompany();
    } catch (err) {
      setError(err.detail || 'Failed to delete competitor');
    }
  };

  const handleManualPaste = async (compId, text) => {
    setError('');
    try {
      await setManualText(companyIdState, compId, text);
      await reloadCompany();
    } catch (err) {
      setError(err.detail || 'Failed to submit manual text');
    }
  };

  // ---- Run Analysis ----
  const handleRunAnalysis = async () => {
    setSaving(true);
    setError('');
    try {
      const { session_id } = await startAnalysis(companyIdState);
      navigate(`/company/${companyIdState}/analyzing/${session_id}`);
    } catch (err) {
      setError(err.detail || 'Failed to start analysis');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-container"><Spinner message="Loading company data..." /></div>;

  return (
    <div className="page-container">
      {/* Step indicator */}
      <div className="step-indicator">
        {STEPS.map((s, idx) => (
          <div key={s.num} style={{ display: 'contents' }}>
            <div className={`step-item ${step === s.num ? 'active' : ''} ${step > s.num ? 'completed' : ''}`}>
              <div className="step-number">
                {step > s.num ? '✓' : s.num}
              </div>
              <span className="step-label">{s.label}</span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`step-line ${step > s.num ? 'active' : ''}`} />
            )}
          </div>
        ))}
      </div>

      <ErrorBanner message={error} onDismiss={() => setError('')} />

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card className="setup-form-card">
          <h2 className="setup-form-title">Tell us about your SaaS</h2>
          <div className="stack" style={{ gap: 'var(--space-5)' }}>
            <div className="form-field">
              <label>Company Name</label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Acme Analytics"
              />
            </div>
            <div className="form-field">
              <label>Industry</label>
              <select
                value={form.industry}
                onChange={(e) => setForm({ ...form, industry: e.target.value })}
              >
                {INDUSTRY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="form-field">
              <label>Description</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Briefly describe your product and value proposition..."
                rows={4}
              />
            </div>
            <Button
              variant="primary"
              fullWidth
              size="lg"
              onClick={handleStep1Next}
              loading={saving}
            >
              Next →
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Tiers & Features */}
      {step === 2 && (
        <div className="setup-form-card">
          <h2 className="setup-form-title">Configure your pricing tiers</h2>
          <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-5)' }}>
            Add each pricing tier, then tag features to it. Tiers are saved immediately.
          </p>

          <div className="tier-list">
            {tiers.map((tier, idx) => (
              <TierFormCard
                key={tier.id}
                tier={tier}
                index={idx}
                companyId={companyIdState}
                onSave={handleSaveTier}
                onDelete={handleDeleteTier}
                onAddFeature={handleAddFeature}
                onRemoveFeature={handleRemoveFeature}
                saving={saving}
              />
            ))}

            {newTiers.map((_, idx) => (
              <TierFormCard
                key={`new-${idx}`}
                tier={null}
                index={tiers.length + idx}
                companyId={companyIdState}
                onSave={handleSaveTier}
                onDelete={() => setNewTiers((prev) => prev.filter((_, i) => i !== idx))}
                onAddFeature={handleAddFeature}
                onRemoveFeature={handleRemoveFeature}
                saving={saving}
              />
            ))}
          </div>

          <Button
            variant="secondary"
            onClick={() => setNewTiers((prev) => [...prev, {}])}
            style={{ marginTop: 'var(--space-4)' }}
          >
            + Add Tier
          </Button>

          <div className="setup-nav">
            <Button variant="secondary" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <Button
              variant="primary"
              onClick={() => setStep(3)}
              disabled={tiers.length === 0}
            >
              Next: Competitors →
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Competitors */}
      {step === 3 && (
        <Card className="setup-form-card">
          <h2 className="setup-form-title">Add competitors</h2>
          <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-5)' }}>
            Add up to 5 competitor pricing page URLs. We'll scrape them automatically.
          </p>

          <div className="competitor-list">
            {competitors.map((comp) => (
              <CompetitorInput
                key={comp.id}
                competitor={comp}
                onDelete={handleDeleteCompetitor}
                onManualPaste={handleManualPaste}
              />
            ))}

            {competitors.length < 5 && (
              <CompetitorInput
                competitor={null}
                onAdd={handleAddCompetitor}
                adding={addingComp}
              />
            )}
          </div>

          <p className="competitor-count" style={{ marginTop: 'var(--space-2)' }}>
            {competitors.length}/5 competitors added
          </p>

          <div className="setup-nav">
            <Button variant="secondary" onClick={() => setStep(2)}>
              ← Back
            </Button>
            <Button
              variant="primary"
              size="lg"
              onClick={handleRunAnalysis}
              loading={saving}
            >
              Finish Setup → Run Analysis
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
