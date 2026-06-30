import { useState } from 'react';
import '../../styles/components.css';

export default function FeatureTagInput({ features = [], onAdd, onRemove, disabled }) {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    const name = inputValue.trim();
    if (!name) return;
    onAdd(name);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="stack-sm">
      <label className="label-caps">Features</label>
      <div className="input-row">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Add a feature..."
          disabled={disabled}
          className="feature-input"
          style={{
            flex: 1,
            padding: 'var(--space-2) var(--space-3)',
            backgroundColor: 'var(--color-surface-lowest)',
            border: '1px solid var(--color-outline-variant)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--color-text)',
            fontFamily: 'var(--font-sans)',
            fontSize: 'var(--font-size-sm)',
          }}
        />
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={handleAdd}
          disabled={disabled || !inputValue.trim()}
        >
          Add
        </button>
      </div>
      {features.length > 0 && (
        <div className="row" style={{ gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          {features.map((feat) => (
            <span key={feat.id || feat.feature_name} className="tag">
              {feat.feature_name}
              <button
                type="button"
                className="tag-remove"
                onClick={() => onRemove(feat)}
                disabled={disabled}
                aria-label={`Remove ${feat.feature_name}`}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
