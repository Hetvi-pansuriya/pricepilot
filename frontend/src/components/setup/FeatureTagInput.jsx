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
  const [selection, setSelection] = useState("");
  const [customInput, setCustomInput] = useState("");
  const [error, setError] = useState("");
  const addedNames = new Set(
    features.map((feature) => feature.feature_name.toLowerCase()),
  );
  const suggestions = getIndustryFeatures(industry).filter(
    (name) => !addedNames.has(name.toLowerCase()),
  );
  const isCustom = selection === "__custom";

  const add = async (rawName) => {
    const featureName = rawName.trim();
    if (!featureName || addedNames.has(featureName.toLowerCase())) return;
    try {
      const saved = await addFeature(companyId, tierId, {
        feature_name: featureName,
      });
      const next = [...features, saved];
      setFeatures(next);
      setSelection("");
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
      <label className="feature-label" htmlFor={`features-${tierId}`}>
        Features ({features.length})
      </label>
      <div className="feature-select-row">
        <select
          id={`features-${tierId}`}
          value={selection}
          onChange={(event) => setSelection(event.target.value)}
        >
          <option value="">Select a feature to add…</option>
          {suggestions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
          <option value="__custom">Other / New feature…</option>
        </select>
        {!isCustom && (
          <Button
            type="button"
            size="sm"
            disabled={!selection}
            onClick={() => add(selection)}
          >
            Add
          </Button>
        )}
      </div>
      {isCustom && (
        <div className="custom-feature-box">
          <div>
            <strong>Add a new feature</strong>
            <p>Enter a feature that is not available in the list.</p>
          </div>
          <div className="feature-select-row">
            <input
              autoFocus
              value={customInput}
              onChange={(event) => setCustomInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  add(customInput);
                }
              }}
              placeholder="Enter feature name…"
            />
            <Button
              type="button"
              size="sm"
              disabled={!customInput.trim()}
              onClick={() => add(customInput)}
            >
              Add New
            </Button>
            <Button
              type="button"
              size="sm"
              variant="ghost"
              onClick={() => {
                setSelection("");
                setCustomInput("");
              }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
      {features.length ? (
        <div className="feature-list">
          {features.map((feature) => (
            <div
              className="feature-list-item"
              key={feature.id || feature.feature_name}
            >
              <span>{feature.feature_name}</span>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => remove(feature)}
                aria-label={`Remove ${feature.feature_name}`}
              >
                ×
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="feature-empty">No features added yet.</div>
      )}
    </div>
  );
}
