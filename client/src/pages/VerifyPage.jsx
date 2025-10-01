import { useEffect } from "react";
import { useAuth } from "@/lib/use-auth.js";
import { useNavigate } from "react-router-dom";

export default function VerifyPage() {
  const { user, resendVerification, reloadUser } = useAuth();
  const nav = useNavigate();

  async function refreshStatus() {
    const fresh = await reloadUser();
    if (fresh?.emailVerified) {
      nav("/categories/Education", { replace: true });
    }
  }

  useEffect(() => {
    if (user?.emailVerified) {
      nav("/categories/Education", { replace: true });
    }
  }, [user?.emailVerified, nav]);

  return (
    <div className="login-wrapper">
      <div className="login-card">
        <h2>Verify your email</h2>
        <p>
          We sent a link to <strong>{user?.email}</strong>. Click it, then return here.
        </p>
        <div className="form-actions">
          <button className="btn" onClick={resendVerification}>
            Resend email
          </button>
          <button className="btn btn-primary" onClick={refreshStatus}>
            I verified - refresh
          </button>
        </div>
      </div>
    </div>
  );
}
