
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { LayoutDashboard, Search, User, Bell, Settings } from "lucide-react";
import ProfileImage from "./ProfileImage";

const Navbar = () => {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
  };

  if (!user) return null;

  // Check which route is active
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="fixed bottom-0 left-0 w-full bg-white border-t z-50">
      <div className="container px-0 py-2">
        <nav>
          <ul className="flex items-center justify-around">
            <li>
              <Button 
                variant={isActive("/dashboard") ? "default" : "ghost"} 
                asChild 
                className="flex flex-col items-center px-2 h-auto"
              >
                <Link to="/dashboard">
                  <LayoutDashboard className={`h-5 w-5 mb-1 ${isActive("/dashboard") ? "text-primary-foreground" : ""}`} />
                  <span className={`text-xs ${isActive("/dashboard") ? "text-primary-foreground" : ""}`}>Dashboard</span>
                </Link>
              </Button>
            </li>
            
            <li>
              <Button 
                variant={isActive("/search") ? "default" : "ghost"} 
                asChild 
                className="flex flex-col items-center px-2 h-auto"
              >
                <Link to="/search">
                  <Search className={`h-5 w-5 mb-1 ${isActive("/search") ? "text-primary-foreground" : ""}`} />
                  <span className={`text-xs ${isActive("/search") ? "text-primary-foreground" : ""}`}>Search</span>
                </Link>
              </Button>
            </li>
            
            <li>
              <Button 
                variant={isActive("/profile") ? "default" : "ghost"} 
                asChild 
                className="flex flex-col items-center px-2 h-auto"
              >
                <Link to="/profile">
                  <div className="flex items-center justify-center mb-1">
                    {isActive("/profile") ? (
                      <User className="h-5 w-5 text-primary-foreground" />
                    ) : (
                      <ProfileImage
                        src={user.profile_pic || ""}
                        alt={user.username}
                        fallback={user.fname?.charAt(0) || "U"}
                        size="sm"
                      />
                    )}
                  </div>
                  <span className={`text-xs ${isActive("/profile") ? "text-primary-foreground" : ""}`}>Profile</span>
                </Link>
              </Button>
            </li>
            
            <li>
              <Button 
                variant={isActive("/alerts") ? "default" : "ghost"} 
                asChild 
                className="flex flex-col items-center px-2 h-auto"
              >
                <Link to="/alerts">
                  <Bell className={`h-5 w-5 mb-1 ${isActive("/alerts") ? "text-primary-foreground" : ""}`} />
                  <span className={`text-xs ${isActive("/alerts") ? "text-primary-foreground" : ""}`}>Alerts</span>
                </Link>
              </Button>
            </li>
            
            <li>
              <Button 
                variant={isActive("/settings") ? "default" : "ghost"} 
                asChild 
                className="flex flex-col items-center px-2 h-auto"
              >
                <Link to="/settings">
                  <Settings className={`h-5 w-5 mb-1 ${isActive("/settings") ? "text-primary-foreground" : ""}`} />
                  <span className={`text-xs ${isActive("/settings") ? "text-primary-foreground" : ""}`}>Settings</span>
                </Link>
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Navbar;
