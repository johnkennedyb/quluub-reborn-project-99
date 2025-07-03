
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { format } from "date-fns";
import { ChevronLeft, ChevronRight, RefreshCcw, Eye, EyeOff } from "lucide-react";

interface SignupFormProps {
  onSignup: (name: string, email: string, password: string, gender: string) => void;
  onSwitchToLogin: () => void;
}

interface RegistrationData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  dateOfBirth: Date | null;
  ethnicity: string;
  countryOfResidence: string;
  cityOfResidence: string;
  summary: string;
  username: string;
  gender: string;
}

const ethnicities = [
  "African", "Arab", "Asian", "Bengali", "Black", "Caribbean", "Chinese", "East Asian",
  "European", "Filipino", "Hispanic/Latino", "Indian", "Indigenous", "Japanese",
  "Korean", "Middle Eastern", "Mixed/Multi-ethnic", "Native American", "Pacific Islander",
  "South Asian", "Southeast Asian", "Turkish", "Vietnamese", "White", "Other"
];

const countries = [
  "Afghanistan", "Albania", "Algeria", "Argentina", "Australia", "Austria", "Bangladesh",
  "Belgium", "Brazil", "Canada", "China", "Denmark", "Egypt", "Finland", "France",
  "Germany", "Ghana", "Greece", "India", "Indonesia", "Iran", "Iraq", "Ireland",
  "Italy", "Japan", "Jordan", "Kenya", "Kuwait", "Lebanon", "Malaysia", "Mexico",
  "Morocco", "Netherlands", "Nigeria", "Norway", "Pakistan", "Philippines", "Poland",
  "Qatar", "Russia", "Saudi Arabia", "Singapore", "South Africa", "South Korea",
  "Spain", "Sri Lanka", "Sweden", "Switzerland", "Thailand", "Tunisia", "Turkey",
  "UAE", "Ukraine", "United Kingdom", "United States", "Vietnam", "Other"
];

const SignupForm = ({ onSignup, onSwitchToLogin }: SignupFormProps) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [suggestedUsername, setSuggestedUsername] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState<RegistrationData>({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    dateOfBirth: null,
    ethnicity: "",
    countryOfResidence: "",
    cityOfResidence: "",
    summary: "",
    username: "",
    gender: "male",
  });
  
  // Generate a random password
  useEffect(() => {
    if (formData.password === "") {
      const generatedPassword = generatePassword(10);
      setFormData(prev => ({ ...prev, password: generatedPassword }));
    }
  }, [formData.password]);
  
  // Generate suggested username when first name is filled (only first name + number)
  useEffect(() => {
    if (formData.firstName && step === 7) {
      const firstPart = formData.firstName.toLowerCase().replace(/\s+/g, '');
      const randomNum = Math.floor(Math.random() * 10000);
      
      setSuggestedUsername(`${firstPart}${randomNum}`);
    }
  }, [formData.firstName, step]);

  const generatePassword = (length: number) => {
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };
  
  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, dateOfBirth: date || null }));
  };
  
  const handleNextStep = () => {
    setStep(prev => prev + 1);
  };
  
  const handlePrevStep = () => {
    setStep(prev => prev - 1);
  };
  
  const handleSubmitInitial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      // Simulate email verification process
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowVerification(true);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleVerifyEmail = async () => {
    setIsLoading(true);
    
    try {
      // In a real app, this would verify the OTP code
      await new Promise(resolve => setTimeout(resolve, 1000));
      setShowVerification(false);
      handleNextStep(); // Move to the next step after verification
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleResendCode = () => {
    // In a real app, this would resend the verification code
    console.log("Resending verification code to", formData.email);
  };
  
  const handleSuggestUsername = () => {
    setFormData(prev => ({ ...prev, username: suggestedUsername }));
  };
  
  const handleFinalSubmit = async () => {
    setIsLoading(true);
    
    try {
      // In a real app, this would make an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSignup(
        `${formData.firstName} ${formData.lastName}`,
        formData.email,
        formData.password,
        formData.gender
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleSubmitInitial} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input 
                id="firstName"
                name="firstName"
                placeholder="Your first name"
                value={formData.firstName}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input 
                id="lastName"
                name="lastName"
                placeholder="Your last name"
                value={formData.lastName}
                onChange={handleInputChange}
                required
              />
              <p className="text-xs text-muted-foreground">
                Your name will not be visible to other users
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input 
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <div className="absolute right-0 top-0 flex">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-10 px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                  <Button 
                    type="button" 
                    variant="ghost"
                    size="icon"
                    className="h-10 px-3"
                    onClick={() => setFormData(prev => ({
                      ...prev,
                      password: generatePassword(10)
                    }))}
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="space-y-1 text-xs">
              <p className="text-muted-foreground">By signing up you agree to our:</p>
              <div className="flex items-center gap-1">
                <a href="#" className="text-primary hover:underline">Terms of Service</a>
                <span className="text-muted-foreground">and</span>
                <a href="#" className="text-primary hover:underline">Privacy Policy</a>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : "Submit"}
            </Button>
          </form>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <DatePicker
                date={formData.dateOfBirth || undefined}
                setDate={handleDateChange}
              />
              {formData.dateOfBirth && (
                <p className="text-sm text-muted-foreground">
                  Selected: {format(formData.dateOfBirth, "MMMM d, yyyy")}
                </p>
              )}
            </div>
            
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={!formData.dateOfBirth}
                className="flex items-center gap-1"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="ethnicity">Ethnicity (not nationality)</Label>
              <Select 
                value={formData.ethnicity} 
                onValueChange={(value) => handleSelectChange("ethnicity", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your ethnicity" />
                </SelectTrigger>
                <SelectContent>
                  {ethnicities.map((ethnicity) => (
                    <SelectItem key={ethnicity} value={ethnicity}>
                      {ethnicity}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={!formData.ethnicity}
                className="flex items-center gap-1"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
        
      case 4:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="countryOfResidence">Country of Residence</Label>
              <Select 
                value={formData.countryOfResidence} 
                onValueChange={(value) => handleSelectChange("countryOfResidence", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={!formData.countryOfResidence}
                className="flex items-center gap-1"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
        
      case 5:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="cityOfResidence">City of Residence</Label>
              <Input
                id="cityOfResidence"
                name="cityOfResidence"
                placeholder="Your city"
                value={formData.cityOfResidence}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={!formData.cityOfResidence}
                className="flex items-center gap-1"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
        
      case 6:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="summary">Summary (who are you? in short)</Label>
              <Textarea
                id="summary"
                name="summary"
                placeholder="Tell us about yourself..."
                value={formData.summary}
                onChange={handleInputChange}
                className="min-h-[120px]"
                required
              />
            </div>
            
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={!formData.summary}
                className="flex items-center gap-1"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
        
      case 7:
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username">Username (what would you like others to call you?)</Label>
              <div className="flex space-x-2">
                <Input
                  id="username"
                  name="username"
                  placeholder="Your username"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="flex-1"
                  required
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={handleSuggestUsername}
                  className="whitespace-nowrap"
                >
                  Suggest
                </Button>
              </div>
              {suggestedUsername && !formData.username && (
                <p className="text-sm text-muted-foreground">
                  Suggestion: {suggestedUsername}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gender">I am a</Label>
              <Select 
                value={formData.gender} 
                onValueChange={(value) => handleSelectChange("gender", value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Man</SelectItem>
                  <SelectItem value="female">Woman</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </Button>
              <Button
                type="button"
                onClick={handleNextStep}
                disabled={!formData.username || !formData.gender}
                className="flex items-center gap-1"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
        
      case 8:
        return (
          <div className="space-y-6">
            <div className="rounded-lg border p-4 space-y-4">
              <h3 className="font-medium text-lg">Registration Summary</h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{formData.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name:</span>
                  <span className="font-medium">{formData.firstName} {formData.lastName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Username:</span>
                  <span className="font-medium">{formData.username}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date of Birth:</span>
                  <span className="font-medium">
                    {formData.dateOfBirth ? format(formData.dateOfBirth, "MMM d, yyyy") : "Not provided"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ethnicity:</span>
                  <span className="font-medium">{formData.ethnicity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{formData.cityOfResidence}, {formData.countryOfResidence}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender:</span>
                  <span className="font-medium">{formData.gender === "male" ? "Man" : "Woman"}</span>
                </div>
              </div>
              
              <div className="pt-2">
                <p className="text-sm font-medium mb-1">Summary</p>
                <p className="text-sm text-muted-foreground bg-muted p-2 rounded">
                  {formData.summary}
                </p>
              </div>
            </div>
            
            <div className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevStep}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Edit
              </Button>
              <Button
                type="button"
                onClick={handleFinalSubmit}
                disabled={isLoading}
                className="flex items-center gap-1"
              >
                {isLoading ? "Processing..." : "Save & Complete"}
              </Button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl text-center">
          {step === 1 ? "Create Account" : 
           step === 8 ? "Review Your Information" : 
           `Step ${step - 1} of 7`}
        </CardTitle>
        <CardDescription className="text-center">
          {step === 1 ? "Enter your information to create an account" : 
           step === 8 ? "Please confirm your details" : 
           "Please complete all required fields"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderStepContent()}
      </CardContent>
      {step === 1 && (
        <CardFooter className="flex justify-center">
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <button 
              type="button"
              onClick={onSwitchToLogin}
              className="text-primary hover:underline font-medium"
            >
              Log in
            </button>
          </p>
        </CardFooter>
      )}
      
      {/* Email verification modal */}
      <Dialog open={showVerification} onOpenChange={setShowVerification}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Verify your email address</DialogTitle>
            <DialogDescription>
              We've sent a verification code to {formData.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            <div className="flex flex-col items-center space-y-2">
              <InputOTP maxLength={6} value={verificationCode} onChange={setVerificationCode}>
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                </InputOTPGroup>
              </InputOTP>
              
              <p className="text-sm text-muted-foreground">
                Didn't receive a code?{" "}
                <button 
                  type="button"
                  onClick={handleResendCode}
                  className="text-primary hover:underline font-medium"
                >
                  Resend code
                </button>
              </p>
              
              <p className="text-xs text-center text-muted-foreground mt-2">
                Alternatively, check your email inbox and click the verification link.
              </p>
            </div>
            
            <Button
              onClick={handleVerifyEmail}
              className="w-full"
              disabled={verificationCode.length !== 6 || isLoading}
            >
              {isLoading ? "Verifying..." : "Verify Email"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default SignupForm;
