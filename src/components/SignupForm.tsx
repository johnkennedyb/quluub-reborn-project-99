import { useState, useEffect } from "react";
import { getAllCountries, getStatesOfCountry, getCitiesOfState, ethnicities as allEthnicities } from "@/lib/data";
import Select from "react-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select as UiSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker-new";
import DatePickerImproved from "@/components/ui/date-picker-improved";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { format, differenceInYears } from "date-fns";
import { ChevronLeft, ChevronRight, RefreshCcw, Eye, EyeOff } from "lucide-react";

interface SignupFormProps {
  onSignup: (data: Omit<RegistrationData, 'username'>) => void;
  onSwitchToLogin: () => void;
}

interface RegistrationData {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  dateOfBirth: Date | null;
  ethnicity: string[];
  countryOfResidence: string;
  stateOfResidence: string;
  cityOfResidence: string;
  summary: string;
  username: string;
  gender: string;
}

interface Location {
  name: string;
  isoCode?: string;
}

const SignupForm = ({ onSignup, onSwitchToLogin }: SignupFormProps) => {
  const [step, setStep] = useState(1);
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [suggestedUsername, setSuggestedUsername] = useState("");
  const [countries, setCountries] = useState<Location[]>([]);
  const [states, setStates] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [selectedCountry, setSelectedCountry] = useState<Location | null>(null);
  const [selectedState, setSelectedState] = useState<Location | null>(null);

  const [formData, setFormData] = useState<RegistrationData>({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    dateOfBirth: null,
    ethnicity: [],
    countryOfResidence: "",
    stateOfResidence: "",
    cityOfResidence: "",
    summary: "",
    username: "",
    gender: "male",
  });

  useEffect(() => {
    if (formData.password === "") {
      const generatedPassword = generatePassword(10);
      setFormData(prev => ({ ...prev, password: generatedPassword }));
    }
  }, [formData.password]);

  useEffect(() => {
    if (formData.firstName && step === 6) { // Changed to step 6
      const firstPart = formData.firstName.toLowerCase().replace(/\s+/g, '');
      const randomNum = Math.floor(Math.random() * 10000);

      setSuggestedUsername(`${firstPart}${randomNum}`);
    }
  }, [formData.firstName, step]);

  useEffect(() => {
    try {
      const countryData = getAllCountries();
      setCountries(countryData);
    } catch (error) {
      console.error("Failed to load country data:", error);
    } finally {
      setIsDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedCountry?.isoCode) {
      const countryStates = getStatesOfCountry(selectedCountry.isoCode);
      setStates(countryStates);
      setCities([]);
      setSelectedState(null);
      handleSelectChange("stateOfResidence", "");
      handleSelectChange("cityOfResidence", "");
    } else {
      setStates([]);
      setCities([]);
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCountry?.isoCode && selectedState?.isoCode) {
      const stateCities = getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode);
      setCities(stateCities);
      handleSelectChange("cityOfResidence", "");
    } else {
      setCities([]);
    }
  }, [selectedState]);

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

  const handleSelectChange = (name: string, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, dateOfBirth: date || null }));
  };

  const handleNextStep = () => {
    setStep(prev => prev + 1);
    setCurrentStep(prev => prev + 1);
  };

  const handlePrevStep = () => {
    setStep(prev => prev - 1);
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmitInitial = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Basic validation
    if (!formData.email || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    try {
      // Use the API client instead of direct fetch
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/email/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('Backend error response:', data);
        throw new Error(data.details || data.message || 'Failed to send verification code. Please try again.');
      }

      // In development, log the verification code to the console
      if (data.code) {
        console.log('Verification code (development only):', data.code);
      }

      setShowVerification(true);
    } catch (error: any) {
      console.error('Error sending verification code:', error);
      // Show error to user (you might want to use a toast notification)
      alert(error.message || 'Failed to send verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (verificationCode.length !== 6) {
      setError('Please enter a valid 6-digit verification code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Use the API client instead of direct fetch
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/email/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          code: verificationCode,
          email: formData.email 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to verify code. Please try again.');
      }

      // If verification is successful, proceed to next step
      setShowVerification(false);
      handleNextStep();
    } catch (error: any) {
      console.error('Error verifying code:', error);
      setError(error.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestUsername = () => {
    setFormData(prev => ({ ...prev, username: suggestedUsername }));
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);

    try {
      // Validate all required fields are filled
      if (!formData.username || !formData.dateOfBirth || !formData.countryOfResidence || 
          !formData.stateOfResidence || !formData.cityOfResidence || !formData.summary) {
        alert('Please fill in all required fields');
        return;
      }

      // Prepare the data in the format expected by the backend
      const dataToSubmit = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fname: formData.firstName,
        lname: formData.lastName,
        gender: formData.gender,
        dateOfBirth: formData.dateOfBirth,
        ethnicity: formData.ethnicity,
        countryOfResidence: formData.countryOfResidence,
        stateOfResidence: formData.stateOfResidence,
        cityOfResidence: formData.cityOfResidence,
        summary: formData.summary,
        parentEmail: formData.email, // Using user's email as parent email by default
      };

      console.log('Submitting registration data:', dataToSubmit);
      await onSignup(dataToSubmit);
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <form onSubmit={handleSubmitInitial} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={isLoading}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
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
            <div className="space-y-4">
              <DatePickerImproved
                date={formData.dateOfBirth || null}
                setDate={(date) => setFormData(prev => ({
                  ...prev,
                  dateOfBirth: date
                }))}
                minAge={18}
                maxAge={100}
                error={errors.dateOfBirth}
                onChange={(date) => {
                  if (date) {
                    const age = differenceInYears(new Date(), date);
                    if (age < 18) {
                      setErrors(prev => ({
                        ...prev,
                        dateOfBirth: 'You must be at least 18 years old'
                      }));
                    } else if (age > 100) {
                      setErrors(prev => ({
                        ...prev,
                        dateOfBirth: 'Maximum age is 100 years'
                      }));
                    } else {
                      setErrors(prev => ({
                        ...prev,
                        dateOfBirth: ''
                      }));
                    }
                  }
                }}
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
                isMulti
                name="ethnicity"
                options={formData.ethnicity.length >= 2 ? [] : allEthnicities}
                className="basic-multi-select"
                classNamePrefix="select"
                onChange={(selectedOptions) => {
                  if (selectedOptions.length <= 2) {
                    handleSelectChange("ethnicity", selectedOptions.map(option => option.value));
                  }
                }}
                value={allEthnicities.filter(option => formData.ethnicity.includes(option.value))}
                placeholder="Select up to 2 ethnicities"
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
                disabled={formData.ethnicity.length === 0}
                className="flex items-center gap-1"
              >
                Next <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );

      case 4:
        if (isDataLoading) {
          return <div className="text-center p-8">Loading location data...</div>;
        }
        return (
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="countryOfResidence">Country of Residence</Label>
              <UiSelect
                value={formData.countryOfResidence}
                onValueChange={(value) => {
                  const country = countries.find(c => c.name === value) || null;
                  setSelectedCountry(country);
                  handleSelectChange("countryOfResidence", value);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your country" />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={country.name} value={country.name}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </UiSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="stateOfResidence">State/Province of Residence</Label>
              <UiSelect
                value={formData.stateOfResidence}
                onValueChange={(value) => {
                  const state = states.find(s => s.name === value) || null;
                  setSelectedState(state);
                  handleSelectChange("stateOfResidence", value);
                }}
                disabled={!selectedCountry || states.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your state/province" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.name} value={state.name}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </UiSelect>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cityOfResidence">City of Residence</Label>
              <UiSelect
                value={formData.cityOfResidence}
                onValueChange={(value) => handleSelectChange("cityOfResidence", value)}
                disabled={!selectedState || cities.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select your city" />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.name} value={city.name}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </UiSelect>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={handlePrevStep}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button type="button" onClick={handleNextStep} disabled={!formData.cityOfResidence}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        );



      case 5:
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

      case 6:
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
              <UiSelect
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
              </UiSelect>
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

      case 7: // Final step - Registration Summary
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
                  <span className="font-medium">{formData.ethnicity.join(', ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{formData.cityOfResidence}, {formData.stateOfResidence}, {formData.countryOfResidence}</span>
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
  
  const totalSteps = 7; // Total number of steps

  return (
    <>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Welcome to Quluub</h2>
        <p className="text-muted-foreground">Your Islamic marriage platform</p>
        <div className="mt-4">
          Step {currentStep} of {totalSteps}
        </div>
      </div>

      {renderStepContent()}

      {step === 1 && (
        <p className="text-sm text-center mt-4">
          Already have an account?{" "}
          <button 
            type="button"
            onClick={onSwitchToLogin}
            className="text-primary hover:underline font-semibold"
          >
            Log in
          </button>
        </p>
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
              
              <div className="text-sm text-muted-foreground">
                Didn't receive a code?{" "}
                <span className="text-primary hover:underline font-medium">
                  Check your email inbox and click the verification link.
                </span>
              </div>
              
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
    </>
  );
};

export default SignupForm;
