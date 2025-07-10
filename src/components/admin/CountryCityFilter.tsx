
import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';

interface CountryCityFilterProps {
  selectedCountries: string[];
  selectedCities: string[];
  onCountriesChange: (countries: string[]) => void;
  onCitiesChange: (cities: string[]) => void;
}

const countries = [
  'United Kingdom', 'United States', 'Canada', 'Australia', 'Nigeria', 'Ghana', 'South Africa',
  'Germany', 'France', 'Netherlands', 'Belgium', 'Sweden', 'Norway', 'Denmark',
  'Saudi Arabia', 'UAE', 'Qatar', 'Kuwait', 'Bahrain', 'Oman',
  'Pakistan', 'Bangladesh', 'India', 'Malaysia', 'Indonesia', 'Turkey'
];

const cityData: Record<string, string[]> = {
  'United Kingdom': ['London', 'Birmingham', 'Manchester', 'Glasgow', 'Liverpool', 'Leeds', 'Sheffield', 'Edinburgh', 'Bristol', 'Cardiff'],
  'United States': ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'],
  'Canada': ['Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg', 'Quebec City', 'Hamilton', 'Kitchener'],
  'Australia': ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Gold Coast', 'Newcastle', 'Canberra', 'Sunshine Coast', 'Wollongong'],
  'Nigeria': ['Lagos', 'Abuja', 'Kano', 'Ibadan', 'Port Harcourt', 'Benin City', 'Kaduna', 'Maiduguri', 'Zaria', 'Jos'],
  'Ghana': ['Accra', 'Kumasi', 'Tamale', 'Cape Coast', 'Sekondi-Takoradi', 'Sunyani', 'Koforidua', 'Ho', 'Wa', 'Bolgatanga'],
  'Germany': ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Stuttgart', 'Düsseldorf', 'Dortmund', 'Essen', 'Leipzig'],
  'France': ['Paris', 'Marseille', 'Lyon', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille'],
  'Saudi Arabia': ['Riyadh', 'Jeddah', 'Mecca', 'Medina', 'Dammam', 'Khobar', 'Tabuk', 'Buraidah', 'Khamis Mushait', 'Hofuf'],
  'UAE': ['Dubai', 'Abu Dhabi', 'Sharjah', 'Al Ain', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Umm Al Quwain'],
  'Pakistan': ['Karachi', 'Lahore', 'Faisalabad', 'Rawalpindi', 'Gujranwala', 'Peshawar', 'Multan', 'Hyderabad', 'Islamabad', 'Quetta']
};

const CountryCityFilter = ({ selectedCountries, selectedCities, onCountriesChange, onCitiesChange }: CountryCityFilterProps) => {
  const [availableCities, setAvailableCities] = useState<string[]>([]);

  useEffect(() => {
    if (selectedCountries.length > 0) {
      const cities = selectedCountries.flatMap(country => cityData[country] || []);
      setAvailableCities([...new Set(cities)]);
    } else {
      setAvailableCities([]);
      onCitiesChange([]);
    }
  }, [selectedCountries, onCitiesChange]);

  const handleCountrySelect = (country: string) => {
    if (!selectedCountries.includes(country)) {
      onCountriesChange([...selectedCountries, country]);
    }
  };

  const handleCitySelect = (city: string) => {
    if (!selectedCities.includes(city)) {
      onCitiesChange([...selectedCities, city]);
    }
  };

  const removeCountry = (country: string) => {
    const newCountries = selectedCountries.filter(c => c !== country);
    onCountriesChange(newCountries);
    
    // Remove cities from removed country
    const remainingCountryCities = newCountries.flatMap(c => cityData[c] || []);
    const validCities = selectedCities.filter(city => remainingCountryCities.includes(city));
    onCitiesChange(validCities);
  };

  const removeCity = (city: string) => {
    onCitiesChange(selectedCities.filter(c => c !== city));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-2 block">Countries</label>
        <Select onValueChange={handleCountrySelect}>
          <SelectTrigger>
            <SelectValue placeholder="Select countries..." />
          </SelectTrigger>
          <SelectContent>
            {countries.filter(country => !selectedCountries.includes(country)).map(country => (
              <SelectItem key={country} value={country}>{country}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedCountries.map(country => (
            <Badge key={country} variant="secondary" className="flex items-center gap-1">
              {country}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeCountry(country)} />
            </Badge>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm font-medium mb-2 block">Cities</label>
        <Select onValueChange={handleCitySelect} disabled={availableCities.length === 0}>
          <SelectTrigger>
            <SelectValue placeholder={availableCities.length === 0 ? "Select countries first..." : "Select cities..."} />
          </SelectTrigger>
          <SelectContent>
            {availableCities.filter(city => !selectedCities.includes(city)).map(city => (
              <SelectItem key={city} value={city}>{city}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-2 mt-2">
          {selectedCities.map(city => (
            <Badge key={city} variant="secondary" className="flex items-center gap-1">
              {city}
              <X className="h-3 w-3 cursor-pointer" onClick={() => removeCity(city)} />
            </Badge>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CountryCityFilter;
