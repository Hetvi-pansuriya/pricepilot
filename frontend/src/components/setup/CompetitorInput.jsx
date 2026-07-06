import { useState } from "react";
import {
  addCompetitor,
  deleteCompetitor,
  setManualText,
} from "../../api/competitors";
import Button from "../common/Button";
import Badge from "../common/Badge";
import ErrorBanner from "../common/ErrorBanner";

const getStatusBadge = (status) => {
  const key = String(status || "").toLowerCase();
  if (key === "pending") return { label: "Scraping...", variant: "warning" };
  if (key === "success" || key === "success_layer1" || key === "success_layer2") {
    return { label: "Scraped ✓", variant: "success" };
  }
  if (key === "failed") return { label: "Failed", variant: "danger" };
  if (key === "manual") return { label: "Manual", variant: "info" };
  if (key === "manual_required") {
    return { label: "Paste required", variant: "warning" };
  }
  return { label: status, variant: "neutral" };
};

export default function CompetitorInput({
  companyId,
  item,
  onAdded,
  onDeleted,
}) {
  const [url, setUrl] = useState(item?.url || ""),
    [manual, setManual] = useState(false),
    [text, setText] = useState(""),
    [error, setError] = useState("");
  const status = item?.scrape_status;
  const statusBadge = getStatusBadge(status);
  const statusKey = String(status || "").toLowerCase();
  const canPasteManual = ["failed", "manual_required"].includes(statusKey);
  return (
    <div className="card stack-sm">
      <ErrorBanner message={error} />
      <div className="row">
        <input
          className="compact-input"
          value={url}
          disabled={!!item}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://competitor.com/pricing"
        />
        {status && (
          <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
        )}
        {item ? (
          <Button
            variant="danger"
            size="sm"
            onClick={async () => {
              await deleteCompetitor(companyId, item.id);
              onDeleted(item.id);
            }}
          >
            Delete
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={async () => {
              try {
                onAdded(await addCompetitor(companyId, url));
                setUrl("");
              } catch (e) {
                setError(e.detail);
              }
            }}
          >
            Add
          </Button>
        )}
      </div>
      {canPasteManual && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setManual(!manual)}
        >
          Paste Manually
        </Button>
      )}
      {manual && (
        <>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste competitor pricing details"
          />
          <Button
            size="sm"
            onClick={async () => {
              try {
                onAdded(await setManualText(companyId, item.id, text));
                setManual(false);
              } catch (e) {
                setError(e.detail);
              }
            }}
          >
            Save manual data
          </Button>
        </>
      )}
    </div>
  );
}
