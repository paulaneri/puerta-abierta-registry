import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { needsSetup } from "@/lib/setupConfig";

/**
 * Wraps the app and redirects to /setup if the app is not configured.
 * Only redirects from protected routes, not from /setup or /auth.
 */
export const SetupGuard = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const exempt = ["/setup", "/auth"];
    if (exempt.includes(location.pathname)) {
      setChecked(true);
      return;
    }

    if (needsSetup()) {
      navigate("/setup", { replace: true });
    } else {
      setChecked(true);
    }
  }, [location.pathname, navigate]);

  if (!checked && !["/setup", "/auth"].includes(location.pathname)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
      </div>
    );
  }

  return <>{children}</>;
};
