import { useState } from "react";
import { addFeature, deleteFeature } from "../../api/features";
import Button from "../common/Button";
import ErrorBanner from "../common/ErrorBanner";
export default function FeatureTagInput({
  companyId,
  tierId,
  initial = [],
  onChange,
}) {
  const [features, setFeatures] = useState(initial),
    [name, setName] = useState(""),
    [error, setError] = useState("");
  const add = async () => {
    if (!name.trim()) return;
    try {
      const f = await addFeature(companyId, tierId, {
        feature_name: name.trim(),
      });
      const next = [...features, f];
      setFeatures(next);
      onChange?.(next);
      setName("");
    } catch (e) {
      setError(e.detail);
    }
  };
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
      <div className="row">
        <input
          className="compact-input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Add feature"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
        />
        <Button size="sm" variant="secondary" onClick={add}>
          Add
        </Button>
      </div>
    </div>
  );
}
