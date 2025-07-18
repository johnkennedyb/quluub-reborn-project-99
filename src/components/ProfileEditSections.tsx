import React, { useState, useEffect } from "react";
import { getAllCountries, getStatesOfCountry, getCitiesOfState, ethnicities as allEthnicities } from "@/lib/data";
import ReactSelect from "react-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { User } from "@/types/user";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { parseJsonField } from "@/utils/dataUtils";

interface ProfileEditSectionsProps {
  user: User;
  onSave: (updatedUser: Partial<User>) => void;
  onCancel: () => void;
}

interface Location {
  name: string;
  isoCode?: string;
}

const ProfileEditSections = ({ user, onSave, onCancel }: ProfileEditSectionsProps) => {
  const [currentSection, setCurrentSection] = useState(0);

  const parseEthnicity = () => {
    try {
      if (Array.isArray(user.ethnicity)) {
        return user.ethnicity;
      }
      const parsed = parseJsonField(user.ethnicity);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const parseTraits = () => {
    try {
      return Array.isArray(parseJsonField(user.traits)) ? parseJsonField(user.traits) : [];
    } catch {
      return [];
    }
  };

  const parseWaliDetails = () => {
    try {
      return parseJsonField(user.waliDetails) || { name: "", email: "", whatsapp: "", telegram: "", otherNumber: "" };
    } catch {
      return { name: "", email: "", whatsapp: "", telegram: "", otherNumber: "" };
    }
  };

  const [formData, setFormData] = useState({
    kunya: user.kunya || "",
    dob: user.dob ? new Date(user.dob) : undefined,
    maritalStatus: user.maritalStatus || "",
    noOfChildren: user.noOfChildren || "",
    summary: user.summary || "",
    workEducation: user.workEducation || "",
    nationality: user.nationality || "",
    country: user.country || "",
    state: user.state || "",
    region: user.region || "",
    ethnicity: Array.isArray(user.ethnicity) ? user.ethnicity : [],
    height: user.height || "",
    weight: user.weight || "",
    build: user.build || "",
    appearance: user.appearance || "",
    hijab: user.hijab || "No",
    beard: user.beard || "No",
    genotype: user.genotype || "",
    patternOfSalaah: user.patternOfSalaah || "",
    revert: user.revert || "",
    startedPracticing: user.startedPracticing ? new Date(user.startedPracticing) : undefined,
    sect: user.sect || "",
    scholarsSpeakers: user.scholarsSpeakers || "",
    dressingCovering: user.dressingCovering || "",
    islamicPractice: user.islamicPractice || "",
    traits: user.traits || "",
    openToMatches: user.openToMatches || "",
    dealbreakers: user.dealbreakers || "",
    icebreakers: user.icebreakers || "",
    waliDetails: parseWaliDetails(),
    parentEmail: user.parentEmail || "",
  });

  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedTraits, setSelectedTraits] = useState<string[]>(parseTraits());
  const [selectedEthnicity, setSelectedEthnicity] = useState<string[]>(parseEthnicity());

  const [countries, setCountries] = useState<Location[]>([]);
  const [states, setStates] = useState<Location[]>([]);
  const [cities, setCities] = useState<Location[]>([]);

  const [selectedCountry, setSelectedCountry] = useState<Location | null>(null);
  const [selectedState, setSelectedState] = useState<Location | null>(null);

  const [open, setOpen] = useState(false);

  const handleEthnicityChange = (selectedOptions: any) => {
    if (selectedOptions.length <= 2) {
      setSelectedEthnicity(selectedOptions.map((option: any) => option.value));
    }
  };

  useEffect(() => {
    const countries = getAllCountries();
    setCountries(countries);

    if (user.country) {
      const country = countries.find(c => c.name === user.country) || null;
      setSelectedCountry(country);
    }
  }, [user.country]);

  useEffect(() => {
    if (selectedCountry?.isoCode) {
      const countryStates = getStatesOfCountry(selectedCountry.isoCode);
      setStates(countryStates);
      if (user.state) {
        const state = countryStates.find(s => s.name === user.state) || null;
        setSelectedState(state);
      }
    } else {
      setStates([]);
      setCities([]);
    }
  }, [selectedCountry, user.state]);

  useEffect(() => {
    if (selectedCountry?.isoCode && selectedState?.isoCode) {
      const stateCities = getCitiesOfState(selectedCountry.isoCode, selectedState.isoCode);
      setCities(stateCities);
    } else {
      setCities([]);
    }
  }, [selectedState]);

  const sections = [
    "Basic Info",
    "Location and Ethnicity",
    "Appearance and Co",
    "Lifestyle and Traits",
    "Interests",
    "Matching Details",
    "Deen",
    ...(user.gender === 'female' ? ["Wali Details"] : []),
  ];

  const sidebarItems = [
    { icon: "👤", label: "Basic Info" },
    { icon: "🌍", label: "Location and Ethnicity" },
    { icon: "👗", label: "Appearance and Co" },
    { icon: "🎭", label: "Lifestyle and Traits" },
    { icon: "🎯", label: "Interests" },
    { icon: "💕", label: "Matching Details" },
    { icon: "🕌", label: "Deen" },
    ...(user.gender === 'female' ? [{ icon: "👨‍👧", label: "Wali Details" }] : []),
  ];

  const nationalityOptions = allEthnicities.map(e => e.label);
  const ethnicityOptions = allEthnicities.map(e => e.value);

  const interestOptions = [
    "Reading", "Traveling", "Cooking", "Sports", "Music", 
    "Art", "Photography", "Gaming", "Gardening", "Writing",
    "Hiking", "Fitness", "Movies", "Technology", "Fashion",
    "Volunteering", "Dancing", "Camping", "Foodie", "History",
    "Animals", "Cars", "DIY", "Board Games", "Podcasts"
  ];

  const traitOptions = [
    "Funny", "Cheeky", "Innocent", "Loving", "Crazy", "Suspicious", "Detective", "Angry", "Mischievous",
    "Gamer", "Loves To Make Dua", "Hafidh", "Strong", "Dentist", "Policeman", "Tired", "Saluting", "Cold",
    "Cowboy", "Passionate", "Palm Down Hand", "Handshaker", "Selfie Connoisseur", "Intelligent", "Good with Kids",
    "Beard", "Good Teeth", "Bald", "Deaf", "Astronaut", "Firefighter", "Scientist", "Mechanic", "Judge", "Chef",
    "Artist", "Pilot", "Farmer", "Graduate", "Teacher", "Programmer", "Businessman", "Nurse", "Weightlifter",
    "Talkative", "Graceful", "Flamboyant", "Tall", "Dangerous", "Sunny", "Wavy", "Winner", "Good Talker", "Masjid Goer"
  ];

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('waliDetails.')) {
      const key = field.split('.')[1];
      setFormData(prev => ({
        ...prev,
        waliDetails: { ...prev.waliDetails, [key]: value },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        ...(field === 'country' && { state: '', region: '' }),
        ...(field === 'state' && { region: '' }),
      }));
    }
  };

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const toggleTrait = (trait: string) => {
    setSelectedTraits(prev =>
      prev.includes(trait)
        ? prev.filter(t => t !== trait)
        : [...prev, trait]
    );
  };

  const handleSave = () => {
    const updatedData = {
      ...formData,
      interests: JSON.stringify(selectedInterests),
      traits: JSON.stringify(selectedTraits),
      ethnicity: selectedEthnicity,
      waliDetails: JSON.stringify(formData.waliDetails),
    };

    if ((updatedData as any).type === "NEW") {
      delete (updatedData as any).type;
    }

    if ((updatedData as any).status === "NEW") {
      delete (updatedData as any).status;
    }

    onSave(updatedData);
  };

  const renderWaliDetailsSection = () => (
    <div className="space-y-4">
      <div>
        <Label>Wali's Name</Label>
        <Input
          value={formData.waliDetails.name}
          onChange={(e) => handleInputChange("waliDetails.name", e.target.value)}
          placeholder="Enter your Wali's name"
        />
      </div>
      <div>
        <Label>Wali's Email</Label>
        <Input
          type="email"
          value={formData.waliDetails.email}
          onChange={(e) => handleInputChange("waliDetails.email", e.target.value)}
          placeholder="Enter your Wali's email"
        />
      </div>
      <div>
        <Label>Wali's WhatsApp Number</Label>
        <Input
          value={formData.waliDetails.whatsapp}
          onChange={(e) => handleInputChange("waliDetails.whatsapp", e.target.value)}
          placeholder="Enter your Wali's WhatsApp number"
        />
      </div>
      <div>
        <Label>Wali's Telegram</Label>
        <Input
          value={formData.waliDetails.telegram}
          onChange={(e) => handleInputChange("waliDetails.telegram", e.target.value)}
          placeholder="Enter your Wali's Telegram username"
        />
      </div>
      <div>
        <Label>Wali's Other Contact Number</Label>
        <Input
          value={formData.waliDetails.otherNumber}
          onChange={(e) => handleInputChange("waliDetails.otherNumber", e.target.value)}
          placeholder="Another contact number for your Wali"
        />
      </div>
    </div>
  );

  const generateHeightOptions = () => {
    const heights = [];
    for (let ft = 4; ft <= 7; ft++) {
      for (let inch = 0; inch < 12; inch++) {
        if (ft === 7 && inch === 0) break; // Stop before 7ft 0in if needed
        heights.push(`${ft}ft ${inch}in`);
      }
    }
    return heights;
  };

  const generateWeightOptions = () => {
    const weights = [];
    for (let kg = 30; kg <= 110; kg += 5) {
      weights.push(`${kg}kg - ${kg + 4}kg`);
    }
    return weights;
  };

  const renderSection = () => {
    switch (currentSection) {
      case 0: // Basic Info
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="kunya">Nickname / Kunya</Label>
                <Input
                  id="kunya"
                  value={formData.kunya}
                  onChange={(e) => handleInputChange("kunya", e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <Label>Date of Birth</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.dob && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dob ? (
                        format(formData.dob, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.dob}
                      onSelect={(date) => {
                        handleInputChange("dob", date);
                        setOpen(false);
                      }}
                      initialFocus
                      captionLayout="dropdown-buttons"
                      fromYear={1900}
                      toYear={new Date().getFullYear() - 18}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Marital Status</Label>
                <Select value={formData.maritalStatus} onValueChange={(value) => handleInputChange("maritalStatus", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Single">Single</SelectItem>
                    <SelectItem value="Married">Married</SelectItem>
                    <SelectItem value="Widowed">Widowed</SelectItem>
                    <SelectItem value="Divorced">Divorced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="children">Number of Children</Label>
                <Input
                  id="children"
                  value={formData.noOfChildren}
                  onChange={(e) => handleInputChange("noOfChildren", e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="summary">About Me</Label>
              <Textarea
                id="summary"
                value={formData.summary}
                onChange={(e) => handleInputChange("summary", e.target.value)}
                placeholder="Tell us about yourself..."
                className="min-h-[100px]"
              />
            </div>
            <div>
              <Label htmlFor="work">Work & Education</Label>
              <Textarea
                id="work"
                value={formData.workEducation}
                onChange={(e) => handleInputChange("workEducation", e.target.value)}
                placeholder="Your occupation and education background..."
              />
            </div>
            {user.gender === 'female' && (
              <div>
                <Label>Parent Email</Label>
                <Input value={formData.parentEmail} onChange={(e) => handleInputChange("parentEmail", e.target.value)} />
              </div>
            )}
          </div>
        );

      case 1: // Location and Ethnicity
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Country of Residence</Label>
                <Select 
                  value={formData.country} 
                  onValueChange={(value) => {
                    const country = countries.find(c => c.name === value) || null;
                    setSelectedCountry(country);
                    handleInputChange("country", value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {countries.map((country) => (
                      <SelectItem key={country.name} value={country.name}>{country.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>State/Province of Residence</Label>
                <Select
                  value={formData.state}
                  onValueChange={(value) => {
                    const state = states.find(s => s.name === value) || null;
                    setSelectedState(state);
                    handleInputChange("state", value);
                  }}
                  disabled={!selectedCountry || states.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select state/province" />
                  </SelectTrigger>
                  <SelectContent>
                    {states.map((state) => (
                      <SelectItem key={state.name} value={state.name}>{state.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>City of Residence</Label>
                <Select
                  value={formData.region} // Using 'region' field for city
                  onValueChange={(value) => handleInputChange("region", value)}
                  disabled={!selectedState || cities.length === 0}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map((city) => (
                      <SelectItem key={city.name} value={city.name}>{city.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nationality</Label>
                <Select value={formData.nationality} onValueChange={(value) => handleInputChange("nationality", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {nationalityOptions.map((nat) => (
                      <SelectItem key={nat} value={nat}>{nat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Ethnicity</Label>
                <ReactSelect
                  isMulti
                  options={allEthnicities}
                  value={allEthnicities.filter(option => selectedEthnicity.includes(option.value))}
                  onChange={handleEthnicityChange}
                  getOptionValue={(option) => option.value}
                  getOptionLabel={(option) => option.label}
                  placeholder="Select up to 2 ethnicities"
                />
              </div>
            </div>
          </div>
        );

      case 2: // Appearance and Co
        return (
          <div className="space-y-6">
            <div>
              <Label>Height</Label>
              <Select value={formData.height} onValueChange={(value) => handleInputChange("height", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select height" />
                </SelectTrigger>
                <SelectContent>
                  {generateHeightOptions().map((height) => (
                    <SelectItem key={height} value={height}>{height}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Weight</Label>
              <Select value={formData.weight} onValueChange={(value) => handleInputChange("weight", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select weight range" />
                </SelectTrigger>
                <SelectContent>
                  {generateWeightOptions().map((weight) => (
                    <SelectItem key={weight} value={weight}>{weight}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Build</Label>
              <Select value={formData.build} onValueChange={(value) => handleInputChange("build", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select build" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Slim">Slim</SelectItem>
                  <SelectItem value="Athletic">Athletic</SelectItem>
                  <SelectItem value="Average">Average</SelectItem>
                  <SelectItem value="Muscular">Muscular</SelectItem>
                  <SelectItem value="Curvy">Curvy</SelectItem>
                  <SelectItem value="Large">Large</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Facial Appearance</Label>
              <Select value={formData.appearance} onValueChange={(value) => handleInputChange("appearance", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select facial appearance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Clean Shaven">Clean Shaven</SelectItem>
                  <SelectItem value="Beard">Beard</SelectItem>
                  <SelectItem value="Hijab">Hijab</SelectItem>
                  <SelectItem value="Niqab">Niqab</SelectItem>
                  <SelectItem value="Jilbab">Jilbab</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Genotype</Label>
              <Select value={formData.genotype} onValueChange={(value) => handleInputChange("genotype", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select genotype" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AA">AA</SelectItem>
                  <SelectItem value="AS">AS</SelectItem>
                  <SelectItem value="SS">SS</SelectItem>
                  <SelectItem value="AC">AC</SelectItem>
                  <SelectItem value="SC">SC</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>How Covered Are You?</Label>
              <Select value={formData.dressingCovering} onValueChange={(value) => handleInputChange("dressingCovering", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select coverage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fully Covered">Fully Covered</SelectItem>
                  <SelectItem value="Partially Covered">Partially Covered</SelectItem>
                  <SelectItem value="Not Covered">Not Covered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Lifestyle and Hobbies</Label>
              <Textarea value={formData.islamicPractice} onChange={(e) => handleInputChange("islamicPractice", e.target.value)} placeholder="Describe your lifestyle and hobbies." />
            </div>
          </div>
        );

      case 3: // Lifestyle and Traits
        return (
          <div className="space-y-6">
            <div>
              <Label>Traits</Label>
              <div className="flex flex-wrap gap-2">
                {traitOptions.map((trait) => (
                  <Badge
                    key={trait}
                    variant={selectedTraits.includes(trait) ? "default" : "secondary"}
                    onClick={() => toggleTrait(trait)}
                    className="cursor-pointer"
                  >
                    {trait}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 4: // Interests
        return (
          <div>
            <Label>Interests</Label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((interest) => (
                <Badge
                  key={interest}
                  variant={selectedInterests.includes(interest) ? "default" : "secondary"}
                  onClick={() => toggleInterest(interest)}
                  className="cursor-pointer"
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        );

      case 5: // Matching Details
        return (
          <div className="space-y-6">
            <div>
              <Label>Open to Matches From</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {["Revert", "Widows/Widowers", "Divorcees", "Parents"].map((option) => (
                  <Badge
                    key={option}
                    variant={formData.openToMatches.includes(option) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => {
                      let updated;
                      if (formData.openToMatches.includes(option)) {
                        updated = formData.openToMatches.split(", ").filter(o => o !== option).join(", ");
                      } else {
                        updated = formData.openToMatches ? `${formData.openToMatches}, ${option}` : option;
                      }
                      handleInputChange("openToMatches", updated);
                    }}
                  >
                    {option}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Dealbreakers</Label>
              <Textarea
                value={formData.dealbreakers}
                onChange={(e) => handleInputChange("dealbreakers", e.target.value)}
                placeholder="What are your absolute dealbreakers?"
              />
            </div>
            <div>
              <Label>Icebreakers</Label>
              <Textarea
                value={formData.icebreakers}
                onChange={(e) => handleInputChange("icebreakers", e.target.value)}
                placeholder="Suggest some fun icebreakers for your matches!"
              />
            </div>
          </div>
        );

      case 6: // Deen
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Pattern of Salaah</Label>
                <Select value={formData.patternOfSalaah} onValueChange={(value) => handleInputChange("patternOfSalaah", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select pattern" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Always">Always</SelectItem>
                    <SelectItem value="Sometimes">Sometimes</SelectItem>
                    <SelectItem value="Never">Never</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Revert to Islam</Label>
                <Select value={formData.revert} onValueChange={(value) => handleInputChange("revert", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Yes">Yes</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Started Practicing On (easily backdatable)</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.startedPracticing && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.startedPracticing ? (
                      format(formData.startedPracticing, "PPP")
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={formData.startedPracticing}
                    onSelect={(date) => handleInputChange("startedPracticing", date)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Sect/Methodology</Label>
              <Input value={formData.sect} onChange={(e) => handleInputChange("sect", e.target.value)} placeholder="e.g. Sunni, Salafi, etc."/>
            </div>
            <div>
              <Label>Scholars/Speakers you listen to</Label>
              <Input value={formData.scholarsSpeakers} onChange={(e) => handleInputChange("scholarsSpeakers", e.target.value)} placeholder="e.g. Mufti Menk, etc."/>
            </div>
            <div>
              <Label>Dressing/Covering</Label>
              <Textarea value={formData.dressingCovering} onChange={(e) => handleInputChange("dressingCovering", e.target.value)} placeholder="Describe your usual dressing style."/>
            </div>
            <div>
              <Label>What are you doing to improve your Islamic practice?</Label>
              <Textarea value={formData.islamicPractice} onChange={(e) => handleInputChange("islamicPractice", e.target.value)} placeholder="e.g. Taking classes, reading books, etc."/>
            </div>
          </div>
        );

      case 7: // Wali Details
        if (user.gender === 'female') {
          return renderWaliDetailsSection();
        }
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-white p-6 border-r flex flex-col justify-between">
        <div>
          <h2 className="text-2xl font-bold mb-8 text-primary">Quluub</h2>
          <nav className="space-y-2">
            {sidebarItems.map((item, index) => (
              <Button
                key={item.label}
                variant={currentSection === index ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={() => setCurrentSection(index)}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Button>
            ))}
          </nav>
        </div>
        <div className="space-y-2">
          <Button onClick={handleSave} className="w-full">Save Changes</Button>
          <Button variant="outline" onClick={onCancel} className="w-full">Cancel</Button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto">
        <Card>
          <CardHeader>
            <CardTitle>{sections[currentSection]}</CardTitle>
          </CardHeader>
          <CardContent>
            {renderSection()}
          </CardContent>
        </Card>
        <div className="flex justify-between mt-6">
          <Button onClick={() => setCurrentSection(s => Math.max(0, s - 1))} disabled={currentSection === 0}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Previous
          </Button>

          <Button onClick={() => setCurrentSection(s => Math.min(sections.length - 1, s + 1))} disabled={currentSection === sections.length - 1}>
            Next <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
};

export default ProfileEditSections;
