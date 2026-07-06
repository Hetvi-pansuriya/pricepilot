import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getHistory, startAnalysis } from "../api/analysis";
import usePolling from "../hooks/usePolling";
import Card from "../components/common/Card";
import Button from "../components/common/Button";
import ErrorBanner from "../components/common/ErrorBanner";
import { useAuth } from "../context/AuthContext";
import "./AnalysisWaiting.css";
import "./EmailToast.css";

const labels = [
  "Calculating revenue scenarios",
  "Auditing feature placement",
  "Benchmarking competitors",
  "Generating recommendations",
];

export default function AnalysisWaiting() {
  const { companyId, sessionId } = useParams();
  const navigate = useNavigate();
  const { email } = useAuth();
  const [activeId, setActiveId] = useState(sessionId);
  const [elapsed, setElapsed] = useState(0);
  const [streamProgress, setStreamProgress] = useState(null);
  const [streamDone, setStreamDone] = useState(false);
  const [showEmailToast, setShowEmailToast] = useState(false);
  const fetchFn = useCallback(() => getHistory(companyId), [companyId, activeId]);
  const stop = useCallback(
    (rows) =>
      ["completed", "partial", "failed"].includes(
        rows.find((item) => item.session_id === activeId)?.status,
      ),
    [activeId],
  );
  const { data = [], error, timedOut } = usePolling(fetchFn, stop);
  const current = useMemo(
    () => data.find((item) => item.session_id === activeId),
    [data, activeId],
  );
  const done = streamDone || ["completed", "partial"].includes(current?.status);
  const failed = current?.status === "failed";
  const progress = done ? 100 : streamProgress ?? current?.progress ?? 0;
  const lit = done ? 4 : Math.min(Math.floor(progress / 25), 3);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return undefined;
    const source = new EventSource(
      `${import.meta.env.VITE_API_URL}/analysis/progress/${activeId}?token=${encodeURIComponent(token)}`,
    );
    source.onmessage = (event) => {
      try {
        const update = JSON.parse(event.data);
        setStreamProgress(update.progress ?? 0);
        if (
          update.progress >= 100 ||
          ["completed", "partial"].includes(update.status)
        ) {
          setStreamDone(true);
          source.close();
        }
      } catch {
        source.close();
      }
    };
    source.onerror = () => source.close();
    return () => source.close();
  }, [activeId]);

  useEffect(() => {
    if (done || failed) return undefined;
    const timer = setInterval(() => setElapsed((seconds) => seconds + 1), 1000);
    return () => clearInterval(timer);
  }, [done, failed, activeId]);

  useEffect(() => {
    if (done) {
      const timer = setTimeout(
        () =>
          navigate(`/company/${companyId}/report/${activeId}`, {
            state: { showEmailToast: true, email },
          }),
        1200,
      );
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [done, activeId, companyId, email, navigate]);

  useEffect(() => {
    if (!done) return undefined;
    setShowEmailToast(true);
    const timer = setTimeout(() => setShowEmailToast(false), 5000);
    return () => clearTimeout(timer);
  }, [done]);

  const retry = async () => {
    const session = await startAnalysis(companyId);
    setElapsed(0);
    setStreamProgress(null);
    setStreamDone(false);
    setActiveId(session.session_id);
  };

  return (
    <main className="page-container waiting">
      <Card glow className="waiting-card stack-lg">
        <div className="waiting-header">
          <div className={`progress-ring ${done ? "complete" : ""}`}>
            <span className="progress-pct">
              {done ? "✓" : `${Math.min(progress, 99)}%`}
            </span>
          </div>
          <div>
            <h1>
              {done
                ? "Analysis complete!"
                : failed
                  ? "Analysis failed"
                  : "Analyzing your pricing strategy..."}
            </h1>
            <p className="text-muted">
              Usually takes 20–30 seconds. Powered by AI
            </p>
            {!done && !failed && (
              <p className="elapsed-time">
                Elapsed: {Math.floor(elapsed / 60)}:
                {String(elapsed % 60).padStart(2, "0")}
              </p>
            )}
          </div>
        </div>
        <ErrorBanner
          message={
            error?.detail ||
            (timedOut
              ? "Analysis is taking longer than expected. The server may be waking up."
              : "")
          }
        />
        <div className="steps-list">
          {labels.map((label, index) => (
            <div
              key={label}
              className={`step-item ${
                index < lit
                  ? "done"
                  : index === lit && !done
                    ? "active"
                    : "pending"
              }`}
            >
              <span className="step-icon">
                {index < lit || done ? "✓" : index === lit ? "⟳" : "○"}
              </span>
              <span>{label}</span>
            </div>
          ))}
        </div>
        {(failed || timedOut) && (
          <div className="row">
            <Button onClick={retry}>↻ Retry Analysis</Button>
            <Button
              variant="secondary"
              onClick={() => navigate(`/company/${companyId}/setup`)}
            >
              Back to Setup
            </Button>
          </div>
        )}
        {!failed && !timedOut && (
          <Button
            variant="ghost"
            onClick={() => navigate(`/company/${companyId}/setup`)}
          >
            ← Back to Setup
          </Button>
        )}
      </Card>
      {showEmailToast && (
        <div className="email-toast">
          <span>✉</span>
          <div>
            <strong>Report emailed!</strong>
            <p>Sent to {email} with PDF attached.</p>
          </div>
          <Button size="sm" variant="ghost" onClick={() => setShowEmailToast(false)}>
            ×
          </Button>
        </div>
      )}
    </main>
  );
}
