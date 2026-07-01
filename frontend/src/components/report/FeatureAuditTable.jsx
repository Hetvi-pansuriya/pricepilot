import Card from "../common/Card";
import Badge from "../common/Badge";
const variants = {
  gatekeeper: "danger",
  blocker: "warning",
  right_placed: "success",
  undifferentiated: "info",
};
export default function FeatureAuditTable({ module }) {
  if (!module || module.error)
    return (
      <Card>
        <p>Feature audit unavailable</p>
      </Card>
    );
  return (
    <Card className="stack">
      <h2>Feature Audit</h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Feature</th>
              <th>Tier</th>
              <th>Classification</th>
            </tr>
          </thead>
          <tbody>
            {(module.feature_audit || []).map((r, i) => (
              <tr className={`audit-row audit-${r.classification}`} key={i}>
                <td>
                  {r.feature_name}
                  <small>{r.recommended_action}</small>
                </td>
                <td>{r.tier_name}</td>
                <td>
                  <Badge variant={variants[r.classification]}>
                    {r.classification.replaceAll("_", " ")}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
