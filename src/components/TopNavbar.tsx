
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, User, LogOut, Heart, Eye } from "lucide-react";

const TopNavbar = () => {
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
    navigate("/auth");
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-white border-b z-50 shadow-sm">
      <div className="w-full px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2 flex-shrink-0">
            <img 
              src="/logo.png" 
              alt="Quluub" 
              className="h-8 sm:h-10 md:h-12 w-auto flex-shrink-0"
            />
            {/* Task #21: Show eye icon when account is hidden */}
            {user?.hidden && (
              <Eye className="ml-2 h-5 w-5 text-orange-600" />
            )}
          </Link>
          
          {/* Navigation Icons */}
          <div className="flex items-center space-x-4">
            {/* User's first name */}
            {user?.fname && (
              <span className="text-lg font-medium text-gray-700">
                {user.fname}
              </span>
            )}
            
            <Button 
              variant="ghost" 
              size="icon"
              asChild
            >
              <Link to="/search">
                <Search className="h-5 w-5" />
              </Link>
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              asChild
            >
              <Link to="/profile">
                <User className="h-5 w-5" />
              </Link>
            </Button>
            
            <Button 
              variant="ghost" 
              size="icon"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TopNavbar;
