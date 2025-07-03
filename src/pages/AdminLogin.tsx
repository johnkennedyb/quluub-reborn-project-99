
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { AlertCircle, Eye, EyeOff, Shield } from "lucide-react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";

const AdminLogin = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const { adminLogin } = useAdminAuth();
  const navigate = useNavigate();
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      await adminLogin({ username, password });
      navigate("/admin");
    } catch (error: any) {
      console.error("Admin login error:", error);
      setError(error.message || "Invalid admin credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md">
        <Card className="w-full max-w-md mx-auto border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-800">Admin Access</CardTitle>
            <CardDescription className="text-red-600">
              Enter your admin credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="username">Admin Username</Label>
                <Input 
                  id="username"
                  type="text" 
                  placeholder="Enter admin username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input 
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700" 
                disabled={isLoading}
              >
                {isLoading ? "Authenticating..." : "Access Admin Panel"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Need to create an admin account?{" "}
            <button 
              type="button"
              onClick={() => navigate("/admin/signup")}
              className="text-red-600 hover:underline font-medium"
            >
              Admin Signup
            </button>
          </p>
          <p className="text-sm text-gray-600">
            Need regular user access?{" "}
            <button 
              type="button"
              onClick={() => navigate("/auth")}
              className="text-blue-600 hover:underline font-medium"
            >
              User Login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
