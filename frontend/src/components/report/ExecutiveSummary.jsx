import Card from "../common/Card";
export default function ExecutiveSummary({ module }) {
  return (
    <Card className="executive">
      <p className="eyebrow">AI-generated pricing strategy summary</p>
      <h2>
        {module && !module.error
          ? module.executive_summary
          : "Executive summary unavailable — re-run analysis"}
      </h2>
    </Card>
  );
}
