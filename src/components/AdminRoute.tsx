
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { Loader2 } from "lucide-react";

interface AdminRouteProps {
  element: React.ReactNode;
}

const AdminRoute = ({ element }: AdminRouteProps) => {
  const { adminUser, isAdminAuthenticated, isLoading } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-red-600" />
      </div>
    );
  }

  if (!isAdminAuthenticated) {
    // Redirect to admin login page
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  return <>{element}</>;
};

export default AdminRoute;
