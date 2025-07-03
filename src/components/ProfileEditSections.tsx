import React, { useState } from "react";
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
import Navbar from "@/components/Navbar";

interface ProfileEditSectionsProps {
  user: User;
  onSave: (updatedUser: Partial<User>) => void;
  onCancel: () => void;
}

const ProfileEditSections = ({ user, onSave, onCancel }: ProfileEditSectionsProps) => {
  const [currentSection, setCurrentSection] = useState(0);
  
  // Parse JSON fields from database
  const parseEthnicity = () => {
    try {
      return Array.isArray(parseJsonField(user.ethnicity)) ? parseJsonField(user.ethnicity) : [];
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
    region: user.region || "",
    ethnicity: user.ethnicity || "",
    height: user.height || "",
    weight: user.weight || "",
    build: user.build || "",
    appearance: user.appearance || "",
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

  const sections = [
    "Basic Info",
    "Location and Ethnicity", 
    "Appearance and Co",
    "Lifestyle and Traits",
    "Interests",
    "Matching Details",
    "Deen"
  ];

  const sidebarItems = [
    { icon: "👤", label: "Basic Info" },
    { icon: "🌍", label: "Location and Ethnicity" },
    { icon: "👗", label: "Appearance and Co" },
    { icon: "🎭", label: "Lifestyle and Traits" },
    { icon: "🎯", label: "Interests" },
    { icon: "💕", label: "Matching Details" },
    { icon: "🕌", label: "Deen" }
  ];

  // Comprehensive nationality options
  const nationalityOptions = [
    "Afghan", "Albanian", "Algerian", "American", "Andorran", "Angolan", "Antiguans", "Argentinean", "Armenian", "Australian",
    "Austrian", "Azerbaijani", "Bahamian", "Bahraini", "Bangladeshi", "Barbadian", "Barbudans", "Batswana", "Belarusian", "Belgian",
    "Belizean", "Beninese", "Bhutanese", "Bolivian", "Bosnian", "Brazilian", "British", "Bruneian", "Bulgarian", "Burkinabe",
    "Burmese", "Burundian", "Cambodian", "Cameroonian", "Canadian", "Cape Verdean", "Central African", "Chadian", "Chilean", "Chinese",
    "Colombian", "Comoran", "Congolese", "Costa Rican", "Croatian", "Cuban", "Cypriot", "Czech", "Danish", "Djibouti",
    "Dominican", "Dutch", "East Timorese", "Ecuadorean", "Egyptian", "Emirian", "Equatorial Guinean", "Eritrean", "Estonian", "Ethiopian",
    "Fijian", "Filipino", "Finnish", "French", "Gabonese", "Gambian", "Georgian", "German", "Ghanaian", "Greek",
    "Grenadian", "Guatemalan", "Guinea-Bissauan", "Guinean", "Guyanese", "Haitian", "Herzegovinian", "Honduran", "Hungarian", "Icelander",
    "Indian", "Indonesian", "Iranian", "Iraqi", "Irish", "Israeli", "Italian", "Ivorian", "Jamaican", "Japanese",
    "Jordanian", "Kazakhstani", "Kenyan", "Kittian and Nevisian", "Kuwaiti", "Kyrgyz", "Laotian", "Latvian", "Lebanese", "Liberian",
    "Libyan", "Liechtensteiner", "Lithuanian", "Luxembourger", "Macedonian", "Malagasy", "Malawian", "Malaysian", "Maldivan", "Malian",
    "Maltese", "Marshallese", "Mauritanian", "Mauritian", "Mexican", "Micronesian", "Moldovan", "Monacan", "Mongolian", "Moroccan",
    "Mosotho", "Motswana", "Mozambican", "Namibian", "Nauruan", "Nepalese", "New Zealander", "Ni-Vanuatu", "Nicaraguan", "Nigerian",
    "Nigerien", "North Korean", "Northern Irish", "Norwegian", "Omani", "Pakistani", "Palauan", "Panamanian", "Papua New Guinean", "Paraguayan",
    "Peruvian", "Polish", "Portuguese", "Qatari", "Romanian", "Russian", "Rwandan", "Saint Lucian", "Salvadoran", "Samoan",
    "San Marinese", "Sao Tomean", "Saudi", "Scottish", "Senegalese", "Serbian", "Seychellois", "Sierra Leonean", "Singaporean", "Slovakian",
    "Slovenian", "Solomon Islander", "Somali", "South African", "South Korean", "Spanish", "Sri Lankan", "Sudanese", "Surinamer", "Swazi",
    "Swedish", "Swiss", "Syrian", "Taiwanese", "Tajik", "Tanzanian", "Thai", "Togolese", "Tongan", "Trinidadian or Tobagonian",
    "Tunisian", "Turkish", "Tuvaluan", "Ugandan", "Ukrainian", "Uruguayan", "Uzbekistani", "Venezuelan", "Vietnamese", "Welsh",
    "Yemenite", "Zambian", "Zimbabwean"
  ];

  // Comprehensive ethnicity options
  const ethnicityOptions = [
    "Afghan", "African American", "Albanian", "Algerian", "American Indian", "Arab", "Armenian", "Asian", "Australian Aboriginal",
    "Azerbaijani", "Bangladeshi", "Basque", "Belarusian", "Bengali", "Berber", "Bosnian", "Brazilian", "Bulgarian", "Burmese",
    "Cambodian", "Caribbean", "Catalan", "Caucasian", "Central Asian", "Cherokee", "Chinese", "Circassian", "Croatian", "Cuban",
    "Czech", "Danish", "Dutch", "East African", "Eastern European", "Egyptian", "English", "Estonian", "Ethiopian", "European",
    "Filipino", "Finnish", "French", "Georgian", "German", "Greek", "Gujarati", "Gypsy/Roma", "Haitian", "Han Chinese",
    "Hispanic", "Hmong", "Hungarian", "Icelandic", "Indian", "Indigenous", "Indonesian", "Iranian", "Iraqi", "Irish",
    "Italian", "Japanese", "Jewish", "Jordanian", "Kazakh", "Korean", "Kurdish", "Kyrgyz", "Lao", "Latin American",
    "Latino", "Latvian", "Lebanese", "Lithuanian", "Macedonian", "Malay", "Maltese", "Maori", "Mexican", "Middle Eastern",
    "Moldovan", "Mongolian", "Moroccan", "Native American", "Native Hawaiian", "Nepalese", "Nigerian", "Nordic", "North African", "Norwegian",
    "Pacific Islander", "Pakistani", "Palestinian", "Persian", "Polish", "Portuguese", "Punjabi", "Romanian", "Russian", "Samoan",
    "Scandinavian", "Scottish", "Serbian", "Sindhi", "Sinhalese", "Slavic", "Slovak", "Slovenian", "Somali", "South African",
    "South Asian", "Southeast Asian", "Spanish", "Sri Lankan", "Sudanese", "Swedish", "Syrian", "Tajik", "Tamil",
    "Thai", "Tibetan", "Turkish", "Turkmen", "Ukrainian", "Urdu", "Uzbek", "Vietnamese", "Welsh", "West African",
    "White", "Yoruba", "Zulu"
  ];

  const interestOptions = [
    "Board Games", "Playing Card Games", "Fashion", "Museums", "Reading", "Tropics", "Nature Lover", "Flower Lover",
    "Cat Lover", "Mountain Lover", "Sunrise Lover", "Sunset Lover", "Star Lover", 
    "Mango", "Avocado", "Potato", "Spice", "Steak", "Ramen", "Sushi", "Ice Cream", "Chocolate", "Coffee",
    "Tea", "Bubble Tea", "Matcha", "Beaches", "Architecture", "Umrah", "Camping", "Fun Fairs", "Theme Parks",
    "Bullet Train", "Cruises", "Jetsetter", "Skydiving", "Fireworks", "Competitions", "Football", "Basketball", 
    "Rugby", "American Football", "Baseball", "Bowling"
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
    setFormData(prev => ({ ...prev, [field]: value }));
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

  const toggleEthnicity = (ethnicity: string) => {
    setSelectedEthnicity(prev => 
      prev.includes(ethnicity) 
        ? prev.filter(e => e !== ethnicity)
        : [...prev, ethnicity]
    );
  };

  const handleSave = () => {
    const updatedData = {
      ...formData,
      interests: JSON.stringify(selectedInterests),
      traits: JSON.stringify(selectedTraits),
      ethnicity: JSON.stringify(selectedEthnicity),
      waliDetails: JSON.stringify(formData.waliDetails),
    };
  
    // Remove or sanitize problematic fields if they exist and are invalid
    if ((updatedData as any).type === "NEW") {
      delete (updatedData as any).type;
    }
  
    if ((updatedData as any).status === "NEW") {
      delete (updatedData as any).status;
    }
  
    onSave(updatedData);
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
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.dob && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.dob ? format(formData.dob, "dd MMM yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.dob}
                      onSelect={(date) => handleInputChange("dob", date)}
                      initialFocus
                      className="pointer-events-auto"
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
            <div>
            <Label>Parent Email</Label>
            <Input value={formData.parentEmail} onChange={(e) => handleInputChange("parentEmail", e.target.value)} />
            </div>
          </div>
        );

      case 1: // Location and Ethnicity
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nationality</Label>
                <Select value={formData.nationality} onValueChange={(value) => handleInputChange("nationality", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select nationality" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {nationalityOptions.map((nationality) => (
                      <SelectItem key={nationality} value={nationality}>{nationality}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Region</Label>
                <Select value={formData.region} onValueChange={(value) => handleInputChange("region", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lagos">Lagos</SelectItem>
                    <SelectItem value="Abuja">Abuja</SelectItem>
                    <SelectItem value="Kano">Kano</SelectItem>
                    <SelectItem value="Kaduna">Kaduna</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Country of Residence</Label>
              <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {nationalityOptions.map((country) => (
                    <SelectItem key={country} value={country}>{country}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ethnicity (Select all that apply)</Label>
              <div className="grid grid-cols-4 gap-2 mt-2 max-h-40 overflow-y-auto">
                {ethnicityOptions.map((ethnicity) => (
                  <Badge
                    key={ethnicity}
                    variant={selectedEthnicity.includes(ethnicity) ? "default" : "outline"}
                    className="cursor-pointer justify-center text-xs py-1"
                    onClick={() => toggleEthnicity(ethnicity)}
                  >
                    {ethnicity}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 2: // Appearance and Co
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Height</Label>
                <Select value={formData.height} onValueChange={(value) => handleInputChange("height", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select height" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4 feet 0 inches">4 feet 0 inches</SelectItem>
                    <SelectItem value="5 feet 0 inches">5 feet 0 inches</SelectItem>
                    <SelectItem value="5 feet 6 inches">5 feet 6 inches</SelectItem>
                    <SelectItem value="6 feet 0 inches">6 feet 0 inches</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Weight</Label>
                <Select value={formData.weight} onValueChange={(value) => handleInputChange("weight", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select weight" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="31 to 35kg">31 to 35kg</SelectItem>
                    <SelectItem value="51 to 60kg">51 to 60kg</SelectItem>
                    <SelectItem value="61 to 70kg">61 to 70kg</SelectItem>
                    <SelectItem value="71 to 80kg">71 to 80kg</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Genotype</Label>
                <Select value={formData.genotype} onValueChange={(value) => handleInputChange("genotype", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AA">AA</SelectItem>
                    <SelectItem value="AS">AS</SelectItem>
                    <SelectItem value="SS">SS</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Build</Label>
                <Select value={formData.build} onValueChange={(value) => handleInputChange("build", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select build" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Skinny">Skinny</SelectItem>
                    <SelectItem value="Average">Average</SelectItem>
                    <SelectItem value="Athletic">Athletic</SelectItem>
                    <SelectItem value="Heavy">Heavy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Appearance</Label>
                <Select value={formData.appearance} onValueChange={(value) => handleInputChange("appearance", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select appearance" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standout">Standout</SelectItem>
                    <SelectItem value="Average">Average</SelectItem>
                    <SelectItem value="Attractive">Attractive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        );

      case 3: // Lifestyle and Traits
        return (
          <div className="space-y-4">
            <div>
              <Label>Which of these Traits describe you (Select all that apply)</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {traitOptions.map((trait) => (
                  <Badge
                    key={trait}
                    variant={selectedTraits.includes(trait) ? "default" : "outline"}
                    className="cursor-pointer justify-center text-xs py-1"
                    onClick={() => toggleTrait(trait)}
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
          <div className="space-y-6">
            <div>
              <Label>Which of these Recreational activities appeal to you (Select all that apply)</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {interestOptions.slice(0, 15).map((interest) => (
                  <Badge
                    key={interest}
                    variant={selectedInterests.includes(interest) ? "default" : "outline"}
                    className="cursor-pointer justify-center text-xs py-1"
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Which of these Food and Travel activities appeal to you (Select all that apply)</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {interestOptions.slice(15, 35).map((interest) => (
                  <Badge
                    key={interest}
                    variant={selectedInterests.includes(interest) ? "default" : "outline"}
                    className="cursor-pointer justify-center text-xs py-1"
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <Label>Which of these Sports and Relaxation activities appeal to you (Select all that apply)</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {interestOptions.slice(35).map((interest) => (
                  <Badge
                    key={interest}
                    variant={selectedInterests.includes(interest) ? "default" : "outline"}
                    className="cursor-pointer justify-center text-xs py-1"
                    onClick={() => toggleInterest(interest)}
                  >
                    {interest}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case 5: // Matching Details
        return (
          <div className="space-y-6">
            <div>
              <Label>Open to matches from... (Select all that apply)</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Badge variant="outline" className="cursor-pointer justify-center py-2">
                  😌 Reverts
                </Badge>
                <Badge variant="outline" className="cursor-pointer justify-center py-2">
                  👤 Widows/Widowers
                </Badge>
                <Badge variant="outline" className="cursor-pointer justify-center py-2">
                  ∞ Divorcees
                </Badge>
                <Badge variant="outline" className="cursor-pointer justify-center py-2">
                  👥 Parents
                </Badge>
              </div>
            </div>
            <div>
              <Label htmlFor="icebreakers">Add Icebreakers</Label>
              <Textarea
                id="icebreakers"
                value={formData.icebreakers}
                onChange={(e) => handleInputChange("icebreakers", e.target.value)}
                placeholder="What would be good conversation starters..."
                className="min-h-[80px]"
              />
            </div>
           
          </div>
        );

      case 6: // Deen
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Are you a revert?</Label>
                <Select value={formData.revert} onValueChange={(value) => handleInputChange("revert", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>When did you start practicing?</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.startedPracticing && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.startedPracticing ? format(formData.startedPracticing, "dd MMM yyyy") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.startedPracticing}
                      onSelect={(date) => handleInputChange("startedPracticing", date)}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
            <div>
              <Label>How often do you pray?</Label>
              <Select value={formData.patternOfSalaah} onValueChange={(value) => handleInputChange("patternOfSalaah", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="never">Never or One-offs</SelectItem>
                  <SelectItem value="sometimes">Sometimes</SelectItem>
                  <SelectItem value="usually">Usually</SelectItem>
                  <SelectItem value="always">Always</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="practice-details">Details about how you practice deen, where you learn (scholars/speakers)?</Label>
              <Textarea
                id="practice-details"
                value={formData.scholarsSpeakers}
                onChange={(e) => handleInputChange("scholarsSpeakers", e.target.value)}
                placeholder="Tell us about your religious practice and learning..."
                className="min-h-[100px]"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-80 bg-white shadow-sm min-h-screen">
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-semibold text-lg">
                  {user.fname?.charAt(0)}{user.lname?.charAt(0)}
                </span>
              </div>
              <div>
                <h2 className="font-medium">{user.fname} {user.lname}</h2>
                <p className="text-sm text-gray-500">Manage your profile here</p>
              </div>
            </div>
          </div>
          
          <nav className="p-4">
            {sidebarItems.map((item, index) => (
              <button
                key={index}
                onClick={() => setCurrentSection(index)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors ${
                  currentSection === index 
                    ? 'bg-blue-50 text-blue-600 border-r-2 border-blue-600' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t">
            <Button onClick={handleSave} className="w-full mb-2">
              Update my profile
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-xl">{sections[currentSection]}</CardTitle>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
                  disabled={currentSection === 0}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
                  disabled={currentSection === sections.length - 1}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="min-h-[500px]">
              {renderSection()}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Use consistent Navbar */}
      <Navbar />
    </div>
  );
};

export default ProfileEditSections;
