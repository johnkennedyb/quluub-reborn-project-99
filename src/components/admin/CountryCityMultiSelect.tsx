import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface CountryCityMultiSelectProps {
  countryValue: string[];
  cityValue: string[];
  onCountryChange: (values: string[]) => void;
  onCityChange: (values: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
}

const COUNTRIES = [
  'Nigeria', 'Ghana', 'Saudi Arabia', 'United States', 'United Kingdom', 
  'Canada', 'Australia', 'South Africa', 'Egypt', 'Jordan', 'Pakistan', 
  'India', 'Malaysia', 'Indonesia', 'Turkey', 'Morocco', 'Lebanon', 
  'Syria', 'Bangladesh', 'Iran', 'Afghanistan', 'Somalia', 'Sudan', 
  'Yemen', 'Iraq', 'Kuwait', 'UAE', 'Qatar', 'Bahrain', 'Oman', 
  'Algeria', 'Tunisia', 'Libya', 'Germany', 'France', 'Italy', 'Spain', 
  'Netherlands', 'Sweden', 'Norway', 'Denmark', 'Finland', 'Albania', 
  'Bosnia and Herzegovina', 'Kosovo'
];

const CITIES_BY_COUNTRY: { [key: string]: string[] } = {
  'Nigeria': ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Kaduna', 'Port Harcourt', 'Benin City', 'Maiduguri', 'Zaria', 'Aba', 'Jos', 'Ilorin', 'Oyo', 'Enugu', 'Abeokuta'],
  'Ghana': ['Accra', 'Kumasi', 'Tamale', 'Sekondi-Takoradi', 'Ashaiman', 'Sunyani', 'Cape Coast', 'Obuasi', 'Teshi Old Town', 'Tema'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Buraidah', 'Khamis Mushait', 'Hofuf'],
  'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
  'United Kingdom': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Bristol', 'Sheffield', 'Leeds', 'Edinburgh', 'Leicester'],
  'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Mississauga', 'Winnipeg', 'Quebec City', 'Hamilton'],
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong'],
  'Egypt': ['Cairo', 'Alexandria', 'Giza', 'Shubra El Kheima', 'Port Said', 'Suez', 'Luxor', 'Mansoura', 'El Mahalla El Kubra', 'Tanta'],
  'Pakistan': ['Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Multan', 'Hyderabad', 'Gujranwala', 'Peshawar', 'Quetta', 'Islamabad'],
  'India': ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat'],
  'Turkey': ['Istanbul', 'Ankara', 'Izmir', 'Bursa', 'Antalya', 'Gaziantep', 'Konya', 'Mersin', 'Diyarbakir', 'Kayseri']
};

const CountryCityMultiSelect = ({ 
  countryValue = [], 
  cityValue = [],
  onCountryChange, 
  onCityChange,
  placeholder = "Search and select...", 
  maxSelections = 5 
}: CountryCityMultiSelectProps) => {
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const countryRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);

  const filteredCountries = COUNTRIES.filter(country =>
    country.toLowerCase().includes(countrySearch.toLowerCase()) &&
    !countryValue.includes(country)
  );

  const availableCities = countryValue.length > 0 
    ? countryValue.flatMap(country => CITIES_BY_COUNTRY[country] || [])
    : [];

  const filteredCities = availableCities.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase()) &&
    !cityValue.includes(city)
  );

  const handleCountrySelect = (country: string) => {
    if (countryValue.length < maxSelections && !countryValue.includes(country)) {
      const newCountries = [...countryValue, country];
      onCountryChange(newCountries);
      
      // Remove cities that are no longer available
      const availableCitiesForNewCountries = newCountries.flatMap(c => CITIES_BY_COUNTRY[c] || []);
      const validCities = cityValue.filter(city => availableCitiesForNewCountries.includes(city));
      if (validCities.length !== cityValue.length) {
        onCityChange(validCities);
      }
      
      setCountrySearch('');
    }
  };

  const handleCitySelect = (city: string) => {
    if (cityValue.length < maxSelections && !cityValue.includes(city)) {
      onCityChange([...cityValue, city]);
      setCitySearch('');
    }
  };

  const handleCountryRemove = (country: string) => {
    const newCountries = countryValue.filter(item => item !== country);
    onCountryChange(newCountries);
    
    // Remove cities that are no longer available
    const availableCitiesForNewCountries = newCountries.flatMap(c => CITIES_BY_COUNTRY[c] || []);
    const validCities = cityValue.filter(city => availableCitiesForNewCountries.includes(city));
    onCityChange(validCities);
  };

  const handleCityRemove = (city: string) => {
    onCityChange(cityValue.filter(item => item !== city));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (countryRef.current && !countryRef.current.contains(event.target as Node)) {
        setCountryOpen(false);
      }
      if (cityRef.current && !cityRef.current.contains(event.target as Node)) {
        setCityOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="space-y-4">
      {/* Country Selector */}
      <div ref={countryRef} className="relative w-full">
        <label className="text-sm font-medium mb-2 block">Countries</label>
        <div
          className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
          onClick={() => setCountryOpen(true)}
        >
          <div className="flex flex-wrap gap-1 mb-1">
            {countryValue.map((country) => (
              <Badge variant="secondary" className="text-xs" key={country}>
                {country}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCountryRemove(country);
                  }}
                  className="ml-1 hover:bg-muted rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <Input
              value={countrySearch}
              onChange={(e) => setCountrySearch(e.target.value)}
              placeholder={countryValue.length === 0 ? "Search countries..." : "Search for more..."}
              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={countryValue.length >= maxSelections}
              onFocus={() => setCountryOpen(true)}
            />
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </div>

        {countryOpen && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
            {filteredCountries.length > 0 ? (
              filteredCountries.map((country) => (
                <div
                  key={country}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
                  onClick={() => handleCountrySelect(country)}
                >
                  <span>{country}</span>
                  <Check className="h-4 w-4 opacity-0" />
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {countrySearch ? 'No countries found' : 'Maximum selections reached'}
              </div>
            )}
          </div>
        )}
      </div>

      {/* City Selector */}
      <div ref={cityRef} className="relative w-full">
        <label className="text-sm font-medium mb-2 block">Cities</label>
        <div
          className={`min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${
            countryValue.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          onClick={() => countryValue.length > 0 && setCityOpen(true)}
        >
          <div className="flex flex-wrap gap-1 mb-1">
            {cityValue.map((city) => (
              <Badge variant="secondary" className="text-xs" key={city}>
                {city}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCityRemove(city);
                  }}
                  className="ml-1 hover:bg-muted rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
          
          <div className="flex items-center justify-between">
            <Input
              value={citySearch}
              onChange={(e) => setCitySearch(e.target.value)}
              placeholder={countryValue.length === 0 ? "Select countries first..." : cityValue.length === 0 ? "Search cities..." : "Search for more..."}
              className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
              disabled={countryValue.length === 0 || cityValue.length >= maxSelections}
              onFocus={() => countryValue.length > 0 && setCityOpen(true)}
            />
            <ChevronDown className="h-4 w-4 opacity-50" />
          </div>
        </div>

        {cityOpen && countryValue.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
            {filteredCities.length > 0 ? (
              filteredCities.map((city) => (
                <div
                  key={city}
                  className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
                  onClick={() => handleCitySelect(city)}
                >
                  <span>{city}</span>
                  <Check className="h-4 w-4 opacity-0" />
                </div>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-muted-foreground">
                {citySearch ? 'No cities found' : 'Maximum selections reached'}
              </div>
            )}
          </div>
        )}

        {countryValue.length === 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Please select countries first to enable city selection
          </p>
        )}
      </div>
    </div>
  );
};

export default CountryCityMultiSelect;