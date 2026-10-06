import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const habiaUsuario = useRef(false);

  useEffect(() => {
    if (user) habiaUsuario.current = true;
    if (!loading && !user) {
      if (habiaUsuario.current) {
        toast.error("Tu sesión se cerró", {
          description: "La sesión venció o se cerró. Volvé a iniciar sesión para continuar. Lo que no hayas guardado puede haberse perdido.",
          duration: 12000,
        });
      }
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
