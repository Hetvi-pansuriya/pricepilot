import { useState } from "react";
import { addFeature, deleteFeature } from "../../api/features";
import Button from "../common/Button";
import ErrorBanner from "../common/ErrorBanner";
import { getIndustryFeatures } from "../../data/industryFeatures";
export default function FeatureTagInput({
  companyId,
  tierId,
  industry,
  initial = [],
  onChange,
}) {
  const [features, setFeatures] = useState(initial),
    [name, setName] = useState(""),
    [error, setError] = useState("");
  const add = async (suggestedName = name) => {
    const featureName = suggestedName.trim();
    if (!featureName) return;
    try {
      const f = await addFeature(companyId, tierId, {
        feature_name: featureName,
      });
      const next = [...features, f];
      setFeatures(next);
      onChange?.(next);
      setName("");
    } catch (e) {
      setError(e.detail);
    }
  };
  const selectedNames = new Set(
    features.map((feature) => feature.feature_name.toLowerCase()),
  );
  const suggestions = getIndustryFeatures(industry).filter(
    (suggestion) => !selectedNames.has(suggestion.toLowerCase()),
  );
  const remove = async (f) => {
    try {
      await deleteFeature(companyId, tierId, f.id);
      const next = features.filter((x) => x.id !== f.id);
      setFeatures(next);
      onChange?.(next);
    } catch (e) {
      setError(e.detail);
    }
  };
  return (
    <div className="stack-sm">
      <ErrorBanner message={error} />
      <div className="row">
        {features.map((f) => (
          <span className="tag" key={f.id || f.feature_name}>
            {f.feature_name}
            <Button size="sm" variant="ghost" onClick={() => remove(f)}>
              ×
            </Button>
          </span>
        ))}
      </div>
      <div className="stack-sm">
        <strong className="feature-heading">Suggested for this industry</strong>
        <p className="hint">Click a feature to add it to this tier.</p>
        <div className="feature-suggestions">
          {suggestions.map((suggestion) => (
            <Button
              key={suggestion}
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => add(suggestion)}
            >
              + {suggestion}
            </Button>
          ))}
          {!suggestions.length && (
            <span className="hint">All suggested features are added.</span>
          )}
        </div>
      </div>
      <div className="row">
        <input
          className="compact-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add a custom feature"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add(name);
            }
          }}
        />
        <Button size="sm" variant="secondary" onClick={() => add(name)}>
          Add custom
        </Button>
      </div>
    </div>
  );
}
