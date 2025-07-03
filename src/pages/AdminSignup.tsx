
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
import { AlertCircle, Eye, EyeOff, Shield, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const AdminSignup = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    fname: "",
    lname: "",
    adminKey: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/admin/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Admin signup failed');
      }

      toast({
        title: "Admin account created successfully",
        description: "You can now access the admin dashboard!",
      });
      
      navigate("/admin/login");
    } catch (error: any) {
      console.error("Admin signup error:", error);
      setError(error.message || "Failed to create admin account. Please try again.");
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
              <UserPlus className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-2xl text-red-800">Create Admin Account</CardTitle>
            <CardDescription className="text-red-600">
              Register a new administrator account
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
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fname">First Name</Label>
                  <Input 
                    id="fname"
                    name="fname"
                    type="text" 
                    placeholder="John" 
                    value={formData.fname}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lname">Last Name</Label>
                  <Input 
                    id="lname"
                    name="lname"
                    type="text" 
                    placeholder="Doe" 
                    value={formData.lname}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input 
                  id="username"
                  name="username"
                  type="text" 
                  placeholder="admin_username" 
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email"
                  name="email"
                  type="email" 
                  placeholder="admin@example.com" 
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Input 
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••" 
                    value={formData.password}
                    onChange={handleChange}
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
              
              <div className="space-y-2">
                <Label htmlFor="adminKey">Admin Key</Label>
                <div className="relative">
                  <Input 
                    id="adminKey"
                    name="adminKey"
                    type={showAdminKey ? "text" : "password"}
                    placeholder="Enter admin key" 
                    value={formData.adminKey}
                    onChange={handleChange}
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowAdminKey(!showAdminKey)}
                  >
                    {showAdminKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-500">
                  Contact system administrator for the admin key
                </p>
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-red-600 hover:bg-red-700" 
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Admin Account"}
              </Button>
            </form>
          </CardContent>
        </Card>
        
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-gray-600">
            Already have an admin account?{" "}
            <button 
              type="button"
              onClick={() => navigate("/admin/login")}
              className="text-red-600 hover:underline font-medium"
            >
              Admin Login
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

export default AdminSignup;
