
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface PrivateRouteProps {
  element: React.ReactNode;
}

const PrivateRoute = ({ element }: PrivateRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redirect to login page with a return URL
    return <Navigate to="/auth" state={{ from: location.pathname }} replace />;
  }

  return <>{element}</>;
};

export default PrivateRoute;
