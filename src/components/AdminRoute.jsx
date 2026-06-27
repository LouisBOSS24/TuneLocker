import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isMeAdmin } from "../lib/admin";

export default function AdminRoute({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    (async () => {
      if (!user) return;
      const result = await isMeAdmin(user.id);
      setIsAdmin(result);
      setChecking(false);
    })();
  }, [user]);

  if (authLoading || checking) {
    return <p style={{ padding: 24 }}>Vérification…</p>;
  }
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/home" replace />;
  return children;
}
