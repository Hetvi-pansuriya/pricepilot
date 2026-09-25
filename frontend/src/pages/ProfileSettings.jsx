import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/common/Button";
import ErrorBanner from "../components/common/ErrorBanner";
import "./ProfileSettings.css";

export default function ProfileSettings() {
  const { email, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const remove = async () => {
    if (text !== "DELETE") return setError("Please type DELETE to confirm.");
    setBusy(true);
    try {
      await deleteAccount();
      navigate("/login");
    } catch (err) {
      setError(err.detail || "Failed to delete account.");
      setBusy(false);
    }
  };
  return <main className="page-container stack-lg">
    <div><h1>Profile Settings</h1><p>Manage your account preferences.</p></div>
    <section className="settings-card"><h2>Account</h2><div className="settings-row"><span>Email</span><strong>{email}</strong></div><div className="settings-row"><span>Password</span><Link to="/forgot-password">Change password via email →</Link></div></section>
    <section className="settings-card danger-zone"><h2>Danger Zone</h2><p>Permanently delete your account and all data. This cannot be undone.</p>
      {!confirming ? <Button variant="danger" onClick={() => setConfirming(true)}>Delete Account</Button> : <div className="stack"><ErrorBanner message={error} /><p>Type <strong>DELETE</strong> to confirm:</p><input className="confirm-input" value={text} onChange={(e) => setText(e.target.value)} /><div className="row"><Button variant="danger" loading={busy} onClick={remove}>Yes, Delete Everything</Button><Button variant="secondary" onClick={() => { setConfirming(false); setText(""); }}>Cancel</Button></div></div>}
    </section>
  </main>;
}
