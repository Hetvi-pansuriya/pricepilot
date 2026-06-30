import { useState } from 'react';
import Card from '../common/Card';
import Button from '../common/Button';
import FeatureTagInput from './FeatureTagInput';
import '../../styles/components.css';

const BILLING_OPTIONS = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'annual', label: 'Annual' },
];

export default function TierFormCard({
  tier,
  companyId,
  onSave,
  onDelete,
  onAddFeature,
  onRemoveFeature,
  saving,
  index,
}) {
  const [form, setForm] = useState({
    name: tier?.name || '',
    price: tier?.price ?? '',
    billing_cycle: tier?.billing_cycle || 'monthly',
    user_count: tier?.user_count ?? '',
    churn_rate: tier?.churn_rate ?? '',
  });
  const [saved, setSaved] = useState(!!tier?.id);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    const payload = {
      name: form.name,
      price: parseFloat(form.price) || 0,
      billing_cycle: form.billing_cycle,
      user_count: parseInt(form.user_count) || 0,
    };
    if (form.churn_rate !== '' && form.churn_rate !== null) {
      payload.churn_rate = parseFloat(form.churn_rate);
    }
    await onSave(payload, tier?.id);
    setSaved(true);
  };

  return (
    <Card className="tier-form-card">
      <div className="row-between" style={{ marginBottom: 'var(--space-4)' }}>
        <h4 style={{ fontSize: 'var(--font-size-md)', fontWeight: 600 }}>
          {tier?.id ? `Tier: ${form.name || `#${index + 1}`}` : `New Tier #${index + 1}`}
        </h4>
        <div className="row" style={{ gap: 'var(--space-2)' }}>
          {saved && (
            <span className="badge badge-success" style={{ fontSize: '10px' }}>
              ✓ Saved
            </span>
          )}
          {tier?.id && (
            <Button variant="danger" size="sm" onClick={() => onDelete(tier.id)}>
              Delete
            </Button>
          )}
        </div>
      </div>

      <div className="stack">
        {/* Name */}
        <div className="form-field">
          <label>Tier Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="e.g. Starter, Pro, Enterprise"
          />
        </div>

        {/* Price + Billing */}
        <div className="row" style={{ gap: 'var(--space-4)', alignItems: 'flex-end' }}>
          <div className="form-field" style={{ flex: 1 }}>
            <label>Price</label>
            <input
              name="price"
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label>Billing Cycle</label>
            <select name="billing_cycle" value={form.billing_cycle} onChange={handleChange}>
              {BILLING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Users + Churn */}
        <div className="row" style={{ gap: 'var(--space-4)', alignItems: 'flex-end' }}>
          <div className="form-field" style={{ flex: 1 }}>
            <label>User Count</label>
            <input
              name="user_count"
              type="number"
              min="0"
              value={form.user_count}
              onChange={handleChange}
              placeholder="0"
            />
          </div>
          <div className="form-field" style={{ flex: 1 }}>
            <label>Churn Rate (0–1)</label>
            <input
              name="churn_rate"
              type="number"
              min="0"
              max="1"
              step="0.01"
              value={form.churn_rate}
              onChange={handleChange}
              placeholder="0.05"
            />
          </div>
        </div>

        {/* Features */}
        {tier?.id && (
          <FeatureTagInput
            features={tier?.features || []}
            onAdd={(name) => onAddFeature(tier.id, name)}
            onRemove={(feat) => onRemoveFeature(tier.id, feat.id)}
            disabled={saving}
          />
        )}

        {/* Save */}
        <Button
          variant="primary"
          onClick={handleSave}
          loading={saving}
          disabled={!form.name || !form.price}
          fullWidth
        >
          {tier?.id ? 'Update Tier' : 'Save Tier'}
        </Button>
      </div>
    </Card>
  );
}
