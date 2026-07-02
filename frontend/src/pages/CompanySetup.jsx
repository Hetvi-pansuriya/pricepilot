import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createCompany,
  getCompany,
  listCompanies,
  updateCompany,
} from "../api/companies";
import { listCompetitors } from "../api/competitors";
import { startAnalysis } from "../api/analysis";
import Card from "../components/common/Card";
import Input from "../components/common/Input";
import Button from "../components/common/Button";
import Spinner from "../components/common/Spinner";
import ErrorBanner from "../components/common/ErrorBanner";
import Badge from "../components/common/Badge";
import TierFormCard from "../components/setup/TierFormCard";
import CompetitorInput from "../components/setup/CompetitorInput";
import "./CompanySetup.css";
const industries = [
  "saas_b2b",
  "saas_b2c",
  "project_management",
  "hr_software",
  "analytics",
  "crm",
  "payments",
  "ecommerce_tools",
  "other",
];
export default function CompanySetup() {
  const p = useParams(),
    n = useNavigate(),
    [id, setId] = useState(p.companyId === "new" ? null : p.companyId),
    [step, setStep] = useState(1),
    [info, setInfo] = useState({
      name: "",
      industry: "saas_b2b",
      description: "",
    }),
    [tiers, setTiers] = useState([]),
    [competitors, setCompetitors] = useState([]),
    [loading, setLoading] = useState(!!id),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  useEffect(() => {
    if (id)
      getCompany(id)
        .then((c) => {
          setInfo({
            name: c.name,
            industry: c.industry,
            description: c.description || "",
          });
          setTiers(c.tiers || []);
          setCompetitors(c.competitors || []);
        })
        .catch((e) => setError(e.detail))
        .finally(() => setLoading(false));
  }, []);
  const saveInfo = async () => {
    if (!info.name.trim()) return setError("Company name is required");
    setBusy(true);
    try {
      if (!id) {
        const companies = await listCompanies();
        const duplicate = companies.some(
          (company) =>
            company.name.trim().toLowerCase() === info.name.trim().toLowerCase(),
        );
        if (duplicate) {
          setError(
            "A company with this name is already registered. Please open the existing company or use a different name.",
          );
          return;
        }
      }
      const c = id ? await updateCompany(id, info) : await createCompany(info);
      setId(c.id);
      setTiers((current) =>
        current.length
          ? current
          : [{ _key: crypto.randomUUID() }],
      );
      setStep(2);
    } catch (e) {
      setError(e.detail);
    } finally {
      setBusy(false);
    }
  };
  const finish = async () => {
    setBusy(true);
    try {
      const s = await startAnalysis(id);
      n(`/company/${id}/analyzing/${s.session_id}`);
    } catch (e) {
      setError(e.detail);
      setBusy(false);
    }
  };
  const openReview = async () => {
    setBusy(true);
    try {
      const company = await getCompany(id);
      setInfo({
        name: company.name,
        industry: company.industry,
        description: company.description || "",
      });
      setTiers(company.tiers || []);
      setCompetitors(company.competitors || []);
      setStep(4);
    } catch (e) {
      setError(e.detail);
    } finally {
      setBusy(false);
    }
  };
  if (loading)
    return (
      <main className="page-container">
        <Spinner message="Loading company…" />
      </main>
    );
  return (
    <main className="page-container stack-lg">
      <div>
        <Button variant="ghost" size="sm" onClick={() => n("/dashboard")}>
          ← Back to Dashboard
        </Button>
        <h1>Company Setup</h1>
        <p>Give PricePilot the signal it needs for a useful analysis.</p>
      </div>
      <div className="steps">
        {[1, 2, 3, 4].map((x) => (
          <div
            className={`step ${x === step ? "active" : x < step ? "done" : ""}`}
            key={x}
          >
            <span className="step-circle">{x < step ? "✓" : x}</span>
          </div>
        ))}
      </div>
      <ErrorBanner message={error} onDismiss={() => setError("")} />
      {step === 1 && (
        <Card className="stack">
          <h2>Basic Information</h2>
          <Input
            label="Company Name"
            name="name"
            value={info.name}
            onChange={(e) => setInfo({ ...info, name: e.target.value })}
            required
          />
          <div className="form-field">
            <label>Industry</label>
            <select
              value={info.industry}
              onChange={(e) => setInfo({ ...info, industry: e.target.value })}
            >
              {industries.map((x) => (
                <option key={x} value={x}>
                  {x.replaceAll("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Description</label>
            <textarea
              value={info.description}
              onChange={(e) =>
                setInfo({ ...info, description: e.target.value })
              }
            />
          </div>
          <div className="row-between">
            <span />
            <Button loading={busy} onClick={saveInfo}>
              Next →
            </Button>
          </div>
        </Card>
      )}
      {step === 2 && (
        <div className="stack">
          <div className="row-between">
            <h2>Tiers & Features</h2>
          </div>
          {tiers.map((t, i) => (
            <TierFormCard
              key={t.id || t._key}
              companyId={id}
              tier={t}
              industry={info.industry}
              onSaved={(d) =>
                setTiers((v) => v.map((x, j) => (j === i ? d : x)))
              }
              onDeleted={(tierKey) =>
                setTiers((v) =>
                  v.filter((x) => (x.id || x._key) !== tierKey),
                )
              }
            />
          ))}
          <div className="tier-add-row">
            <Button
              variant="secondary"
              onClick={() =>
                setTiers((v) => [...v, { _key: crypto.randomUUID() }])
              }
            >
              + Add Another Tier
            </Button>
          </div>
          <div className="row-between">
            <Button variant="secondary" onClick={() => setStep(1)}>
              ← Back
            </Button>
            <Button
              disabled={!tiers.some((x) => x.id)}
              onClick={async () => {
                try {
                  setCompetitors(await listCompetitors(id));
                } catch (e) {
                  setError(e.detail);
                }
                setStep(3);
              }}
            >
              Next →
            </Button>
          </div>
        </div>
      )}
      {step === 3 && (
        <div className="stack">
          <div>
            <h2>Competitors</h2>
            <p>Add up to 5 competitor pricing pages (optional)</p>
          </div>
          {competitors.map((c) => (
            <CompetitorInput
              key={c.id}
              companyId={id}
              item={c}
              onAdded={(u) =>
                setCompetitors((v) => v.map((x) => (x.id === u.id ? u : x)))
              }
              onDeleted={(cid) =>
                setCompetitors((v) => v.filter((x) => x.id !== cid))
              }
            />
          ))}
          {competitors.length < 5 && (
            <CompetitorInput
              companyId={id}
              onAdded={(c) => setCompetitors((v) => [...v, c])}
            />
          )}
          <p>{competitors.length}/5 competitors added</p>
          <div className="row-between">
            <Button variant="secondary" onClick={() => setStep(2)}>
              ← Back
            </Button>
            <Button loading={busy} onClick={openReview}>
              Review Setup →
            </Button>
          </div>
        </div>
      )}
      {step === 4 && (
        <div className="stack-lg">
          <div className="row-between">
            <div>
              <h2>Review Your Setup</h2>
              <p>Confirm everything below before running the analysis.</p>
            </div>
            <Badge variant="info">Final step</Badge>
          </div>
          <Card className="stack">
            <div className="row-between">
              <h3>Company Information</h3>
              <Button size="sm" variant="ghost" onClick={() => setStep(1)}>
                ✎ Edit
              </Button>
            </div>
            <div className="review-grid">
              <div>
                <span>Name</span>
                <strong>{info.name}</strong>
              </div>
              <div>
                <span>Industry</span>
                <strong>{info.industry.replaceAll("_", " ")}</strong>
              </div>
              <div className="review-wide">
                <span>Description</span>
                <strong>{info.description || "No description provided"}</strong>
              </div>
            </div>
          </Card>
          <Card className="stack">
            <div className="row-between">
              <h3>Tiers & Features</h3>
              <Button size="sm" variant="ghost" onClick={() => setStep(2)}>
                ✎ Edit
              </Button>
            </div>
            <div className="review-tier-list">
              {tiers
                .filter((tier) => tier.id)
                .map((tier) => (
                  <div className="review-tier" key={tier.id}>
                    <div className="row-between">
                      <strong>{tier.name}</strong>
                      <span>
                        ${Number(tier.price).toLocaleString()} /{" "}
                        {tier.billing_cycle}
                      </span>
                    </div>
                    <p>
                      {tier.user_count} users · Churn{" "}
                      {tier.churn_rate ?? "Not set"}
                    </p>
                    <div className="review-features">
                      {(tier.features || []).length ? (
                        tier.features.map((feature) => (
                          <span key={feature.id || feature.feature_name}>
                            {feature.feature_name}
                          </span>
                        ))
                      ) : (
                        <em>No features added</em>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </Card>
          <Card className="stack">
            <div className="row-between">
              <h3>Competitors</h3>
              <Button size="sm" variant="ghost" onClick={() => setStep(3)}>
                ✎ Edit
              </Button>
            </div>
            {competitors.length ? (
              <div className="review-competitors">
                {competitors.map((competitor) => (
                  <div key={competitor.id}>
                    <span>{competitor.url}</span>
                    <Badge
                      variant={
                        ["success", "manual"].includes(
                          competitor.scrape_status,
                        )
                          ? "success"
                          : competitor.scrape_status === "failed"
                            ? "danger"
                            : "warning"
                      }
                    >
                      {competitor.scrape_status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p>No competitors added. This is optional.</p>
            )}
          </Card>
          <div className="row-between">
            <Button variant="secondary" onClick={() => setStep(3)}>
              ← Back
            </Button>
            <Button loading={busy} onClick={finish}>
              Confirm & Run Analysis →
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}
