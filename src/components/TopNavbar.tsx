
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Search, User, LogOut } from "lucide-react";

const TopNavbar = () => {
  const { logout } = useAuth();
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
      <div className="container px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/dashboard" className="text-2xl font-bold text-primary">
            Quluub
          </Link>
          
          {/* Navigation Icons */}
          <div className="flex items-center space-x-4">
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
