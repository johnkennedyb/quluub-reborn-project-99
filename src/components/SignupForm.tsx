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
import { ChevronLeft, ChevronRight, Eye, EyeOff } from "lucide-react";

// Major cities by country - simplified location structure
const majorCitiesByCountry: { [key: string]: string[] } = {
  "Nigeria": [
    "Aba", "Abakaliki", "Abeokuta", "Abuja", "Ado-Ekiti", "Akure", "Asaba",
    "Awka", "Bauchi", "Benin City", "Birnin Kebbi", "Calabar", "Damaturu",
    "Dutse", "Enugu", "Gombe", "Ibadan", "Ilorin", "Jalingo", "Jos",
    "Kaduna", "Kano", "Katsina", "Lafia", "Lagos", "Lokoja", "Maiduguri",
    "Makurdi", "Minna", "Ogun", "Onitsha", "Osogbo", "Owerri", "Port Harcourt",
    "Sokoto", "Umuahia", "Uyo", "Warri", "Yenagoa", "Yola", "Zaria"
  ],
  "United Kingdom": [
    "Belfast", "Birmingham", "Bolton", "Bournemouth", "Bradford", "Brighton",
    "Bristol", "Cardiff", "Coventry", "Derby", "Edinburgh", "Glasgow",
    "Hull", "Leeds", "Leicester", "Liverpool", "London", "Luton",
    "Manchester", "Newcastle", "Northampton", "Norwich", "Nottingham", "Plymouth",
    "Portsmouth", "Reading", "Sheffield", "Southampton", "Stoke-on-Trent", "Wolverhampton"
  ],
  "United States": [
    "Austin", "Boston", "Charlotte", "Chicago", "Columbus", "Dallas",
    "Denver", "Detroit", "El Paso", "Fort Worth", "Houston", "Indianapolis",
    "Jacksonville", "Los Angeles", "Nashville", "New York", "Oklahoma City", "Philadelphia",
    "Phoenix", "San Antonio", "San Diego", "San Francisco", "San Jose", "Seattle",
    "Washington DC"
  ],
  "Canada": [
    "Calgary", "Edmonton", "Halifax", "Hamilton", "Kitchener", "London",
    "Montreal", "Oshawa", "Ottawa", "Quebec City", "Regina", "Saskatoon",
    "Sherbrooke", "Toronto", "Vancouver", "Victoria", "Windsor", "Winnipeg"
  ],
  "Australia": [
    "Adelaide", "Ballarat", "Bendigo", "Brisbane", "Cairns", "Canberra",
    "Darwin", "Geelong", "Gold Coast", "Hobart", "Melbourne", "Newcastle",
    "Perth", "Sunshine Coast", "Sydney", "Toowoomba", "Townsville", "Wollongong"
  ]
};

interface SignupFormProps {
  onSignup: (data: any) => void;
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
  const [verificationSent, setVerificationSent] = useState<boolean>(false);
  const [resendCooldown, setResendCooldown] = useState<number>(0);
  const [verificationAttempts, setVerificationAttempts] = useState<number>(0);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [suggestedUsername, setSuggestedUsername] = useState("");
  const [countries, setCountries] = useState<Location[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  const [selectedCountry, setSelectedCountry] = useState<Location | null>(null);

  const [formData, setFormData] = useState<RegistrationData>({
    email: "",
    firstName: "",
    lastName: "",
    password: "", 
    dateOfBirth: null,
    ethnicity: [],
    countryOfResidence: "",
    cityOfResidence: "",
    summary: "",
    username: "",
    gender: "male",
  });

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      password: e.target.value
    }));
  };

  const generateSecurePassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
    
    const allChars = lowercase + uppercase + numbers + symbols;
    let password = '';
    
    // Ensure at least one character from each category
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += symbols[Math.floor(Math.random() * symbols.length)];
    
    // Fill the rest randomly (12 characters total)
    for (let i = 4; i < 12; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }
    
    // Shuffle the password
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    setFormData(prev => ({
      ...prev,
      password: password
    }));
    
    // Show password when generated
    setShowPassword(true);
  };



  useEffect(() => {
    if (formData.firstName && step === 6) { 
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
    if (selectedCountry?.name) {
      // Get major cities for the selected country
      const cities = majorCitiesByCountry[selectedCountry.name] || [];
      setAvailableCities(cities);
      handleSelectChange("cityOfResidence", "");
    } else {
      setAvailableCities([]);
    }
  }, [selectedCountry]);



  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    let processedValue = value;
    if (name === 'username' || name === 'email') {
      processedValue = value.toLowerCase().replace(/\s/g, '');
    }
    setFormData(prev => ({ ...prev, [name]: processedValue }));
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

    if (verificationSent && resendCooldown > 0) {
      setError('Please wait before requesting another verification email');
      setIsLoading(false);
      return;
    }

    if (!formData.email || !formData.firstName || !formData.lastName) {
      setError('Please fill in all required fields');
      setIsLoading(false);
      return;
    }

    try {
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

      if (data.code) {
        console.log('Verification code (development only):', data.code);
      }

      setShowVerification(true);
      setVerificationSent(true);
      setResendCooldown(60); 
      
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

    } catch (error: any) {
      console.error('Error sending verification code:', error);
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

    if (verificationAttempts >= 5) {
      setError('Too many failed attempts. Please request a new verification code.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/email/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          code: verificationCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setVerificationAttempts(prev => prev + 1);
        throw new Error(data.message || 'Invalid verification code');
      }

      setIsVerified(true);
      setShowVerification(false);
      setStep(2);
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

  const handleResendVerification = async () => {
    if (resendCooldown > 0) {
      setError(`Please wait ${resendCooldown} seconds before resending`);
      return;
    }

    setIsLoading(true);
    setError('');

    try {
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
        throw new Error(data.details || data.message || 'Failed to resend verification code');
      }

      setResendCooldown(60); 
      
      const timer = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      alert('Verification code resent successfully!');
    } catch (error: any) {
      setError(error.message || 'Failed to resend verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinalSubmit = async () => {
    setIsLoading(true);

    try {
      if (!formData.username || !formData.dateOfBirth || !formData.countryOfResidence || 
          !formData.cityOfResidence || !formData.summary) {
        alert('Please fill in all required fields');
        return;
      }

      const dataToSubmit = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        fname: formData.firstName, 
        lname: formData.lastName,   
        gender: formData.gender,
        dob: formData.dateOfBirth!.toISOString(), // Convert Date object to ISO string
        ethnicity: formData.ethnicity,
        country: formData.countryOfResidence,
        state: formData.stateOfResidence || formData.countryOfResidence, // Fallback if state is empty
        city: formData.cityOfResidence,
        summary: formData.summary,
      };

      // Debug logging for signup data
      console.log('=== SIGNUP DATA DEBUG ===');
      console.log('Full signup data being sent:', dataToSubmit);
      console.log('DOB field specifically:', dataToSubmit.dob);
      console.log('DOB type:', typeof dataToSubmit.dob);
      console.log('Original dateOfBirth from form:', formData.dateOfBirth);
      console.log('========================');

      await onSignup(dataToSubmit);
    } catch (error) {
      console.error('Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const totalSteps = 7; 

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">


            <form onSubmit={handleSubmitInitial} className="space-y-6">
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
                    onChange={handlePasswordChange}
                    required
                    minLength={6}
                    placeholder="Enter your password or generate one"
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
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateSecurePassword}
                  className="w-full mt-2"
                >
                  🔐 Generate Secure Password
                </Button>
                <p className="text-xs text-muted-foreground">
                  Password must be at least 6 characters long
                </p>
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
                {isLoading ? "Processing..." : "Continue"}
              </Button>
            </form>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full mt-4 flex items-center justify-center gap-2 py-3"
                onClick={() => {
                  console.log('Google sign-in clicked');
                }}
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <DatePickerImproved
                date={formData.dateOfBirth}
                setDate={(date) => {
                  setFormData(prev => ({
                    ...prev,
                    dateOfBirth: date
                  }));
                  
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
                  } else {
                    setErrors(prev => ({
                      ...prev,
                      dateOfBirth: ''
                    }));
                  }
                }}
                minAge={18}
                maxAge={100}
                error={errors.dateOfBirth}
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
                disabled={!formData.dateOfBirth || !!errors.dateOfBirth}
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
              <Label htmlFor="cityOfResidence">City of Residence</Label>
              <UiSelect
                value={formData.cityOfResidence}
                onValueChange={(value) => handleSelectChange("cityOfResidence", value)}
                disabled={!selectedCountry || availableCities.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={selectedCountry ? "Select your city" : "Select country first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
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
              <p className="text-xs text-muted-foreground">
                We recommend not using your full name
              </p>
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

      case 7: 
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

  return (
    <>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold">Welcome to Quluub</h2>
        <p className="text-muted-foreground">Your Islamic marriage platform</p>
        <div className="mt-4">
          Step {step} of {totalSteps}
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
            <Button
              onClick={handleResendVerification}
              variant="outline"
              className="w-full"
              disabled={isLoading || resendCooldown > 0}
            >
              {isLoading ? "Resending..." : resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Verification Code'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SignupForm;
