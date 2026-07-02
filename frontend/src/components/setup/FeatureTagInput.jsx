import { useState } from "react";
import { addFeature, deleteFeature } from "../../api/features";
import { getIndustryFeatures } from "../../data/industryFeatures";
import Button from "../common/Button";
import ErrorBanner from "../common/ErrorBanner";
import "./FeatureTagInput.css";

export default function FeatureTagInput({
  companyId,
  tierId,
  industry = "other",
  initial = [],
  onChange,
}) {
  const [features, setFeatures] = useState(initial);
  const [customInput, setCustomInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [error, setError] = useState("");
  const added = new Set(features.map((f) => f.feature_name.toLowerCase()));
  const suggestions = getIndustryFeatures(industry).filter(
    (name) => !added.has(name.toLowerCase()),
  );

  const add = async (name) => {
    const featureName = name.trim();
    if (!featureName || added.has(featureName.toLowerCase())) return;
    try {
      const saved = await addFeature(companyId, tierId, {
        feature_name: featureName,
      });
      const next = [...features, saved];
      setFeatures(next);
      setCustomInput("");
      onChange?.(next);
    } catch (err) {
      setError(err.detail);
    }
  };

  const remove = async (feature) => {
    try {
      if (feature.id) await deleteFeature(companyId, tierId, feature.id);
      const next = features.filter((item) =>
        feature.id
          ? item.id !== feature.id
          : item.feature_name !== feature.feature_name,
      );
      setFeatures(next);
      onChange?.(next);
    } catch {
      setError("Could not remove feature");
    }
  };

  return (
    <div className="feature-picker">
      <ErrorBanner message={error} onDismiss={() => setError("")} />
      <div className="row-between">
        <label className="feature-label">Features ({features.length})</label>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={!suggestions.length}
          onClick={() => setShowSuggestions((shown) => !shown)}
        >
          {showSuggestions ? "Hide suggestions" : `+ Suggestions (${suggestions.length})`}
        </Button>
      </div>
      {showSuggestions && (
        <div className="feature-suggestion-panel">
          {suggestions.map((name) => (
            <Button key={name} type="button" size="sm" variant="secondary" onClick={() => add(name)}>
              + {name}
            </Button>
          ))}
        </div>
      )}
      {features.length ? (
        <div className="feature-list">
          {features.map((feature) => (
            <div className="feature-list-item" key={feature.id || feature.feature_name}>
              <span>{feature.feature_name}</span>
              <Button type="button" size="sm" variant="ghost" onClick={() => remove(feature)} aria-label={`Remove ${feature.feature_name}`}>
                ×
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="feature-empty">No features added yet. Use suggestions or type below.</div>
      )}
      <div className="row">
        <input
          className="compact-input"
          value={customInput}
          onChange={(event) => setCustomInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              add(customInput);
            }
          }}
          placeholder="Add custom feature..."
        />
        <Button type="button" size="sm" disabled={!customInput.trim()} onClick={() => add(customInput)}>
          Add
        </Button>
      </div>
    </div>
  );
}
