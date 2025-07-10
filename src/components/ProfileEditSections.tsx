import React, { useState } from "react";
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

const ProfileEditSections = ({ user, onSave, onCancel }: ProfileEditSectionsProps) => {
  const [currentSection, setCurrentSection] = useState(0);

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

  const handleEthnicityChange = (selectedOptions: any) => {
    if (selectedOptions.length <= 2) {
      setSelectedEthnicity(selectedOptions.map((option: any) => option.value));
    }
  };

  const countries = [
    { name: "Nigeria", cities: ["Lagos", "Abuja", "Kano"] },
    { name: "United Kingdom", cities: ["London", "Manchester", "Birmingham"] },
    { name: "United States", cities: ["New York", "Los Angeles", "Chicago"] },
  ];

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
    "South Asian", "Southeast Asian", "Spanish", "Sri Lankan", "Sudanese", "Swedish", "Swiss", "Syrian", "Taiwanese", "Tajik",
    "Tamil", "Thai", "Tibetan", "Turkish", "Turkmen", "Ukrainian", "Urdu", "Uzbek", "Vietnamese", "Welsh", "West African",
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
        ...(field === 'country' && { region: '' }),
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
      ethnicity: JSON.stringify(selectedEthnicity),
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
                <Label>Country of Residence</Label>
                <Select value={formData.country} onValueChange={(value) => handleInputChange("country", value)}>
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
                <Label>City of Residence</Label>
                <Select
                  value={formData.region} // Using 'region' field for city
                  onValueChange={(value) => handleInputChange("region", value)}
                  disabled={!formData.country}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    {formData.country &&
                      countries.find((c) => c.name === formData.country)?.cities.map((city) => (
                        <SelectItem key={city} value={city}>{city}</SelectItem>
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
                  options={ethnicityOptions.map(e => ({ value: e, label: e }))}
                  value={selectedEthnicity.map(e => ({ value: e, label: e }))}
                  onChange={handleEthnicityChange}
                  placeholder="Select up to 2 ethnicities"
                />
              </div>
            </div>
          </div>
        );

      case 2: // Appearance and Co
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Height (cm)</Label>
                <Input value={formData.height} onChange={(e) => handleInputChange("height", e.target.value)} />
              </div>
              <div>
                <Label>Weight (kg)</Label>
                <Input value={formData.weight} onChange={(e) => handleInputChange("weight", e.target.value)} />
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
                    <SelectItem value="Few Extra Pounds">A few extra pounds</SelectItem>
                    <SelectItem value="Big & Tall/Full Figured">Big & Tall/Full Figured</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Appearance</Label>
              <Select value={formData.appearance} onValueChange={(value) => handleInputChange("appearance", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select appearance" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Handsome">Handsome</SelectItem>
                  <SelectItem value="Beautiful">Beautiful</SelectItem>
                  <SelectItem value="Good Looking">Good Looking</SelectItem>
                  <SelectItem value="Pretty">Pretty</SelectItem>
                  <SelectItem value="Ok">Ok</SelectItem>
                  <SelectItem value="Average">Average</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {user.gender === 'female' && (
              <div>
                <Label>Hijab</Label>
                <Select value={formData.hijab} onValueChange={(value) => handleInputChange("hijab", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hijab style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Niqab">Niqab</SelectItem>
                    <SelectItem value="Jilbab">Jilbab</SelectItem>
                    <SelectItem value="Hijab">Hijab</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {user.gender === 'male' && (
              <div>
                <Label>Beard</Label>
                <Select value={formData.beard} onValueChange={(value) => handleInputChange("beard", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select beard style" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sunnah">Sunnah</SelectItem>
                    <SelectItem value="Trimmed">Trimmed</SelectItem>
                    <SelectItem value="No">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        );

      case 3: // Lifestyle and Traits
        return (
          <div className="space-y-6">
            <div>
              <Label>Genotype</Label>
              <Select value={formData.genotype} onValueChange={(value) => handleInputChange("genotype", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select genotype" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AA">AA</SelectItem>
                  <SelectItem value="AS">AS</SelectItem>
                  <SelectItem value="AC">AC</SelectItem>
                  <SelectItem value="SS">SS</SelectItem>
                  <SelectItem value="SC">SC</SelectItem>
                  <SelectItem value="CC">CC</SelectItem>
                  <SelectItem value="Unknown">I don't know</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              <Label>Open to matches from</Label>
              <Select value={formData.openToMatches} onValueChange={(value) => handleInputChange("openToMatches", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Anywhere">Anywhere in the world</SelectItem>
                  <SelectItem value="My Country">My country of residence</SelectItem>
                  <SelectItem value="My City">My city of residence</SelectItem>
                </SelectContent>
              </Select>
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
                    <SelectItem value="5 Times">5 times a day</SelectItem>
                    <SelectItem value="Sometimes">Sometimes</SelectItem>
                    <SelectItem value="Jummah">Only Jummah</SelectItem>
                    <SelectItem value="Learning">Learning</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Are you a revert?</Label>
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
