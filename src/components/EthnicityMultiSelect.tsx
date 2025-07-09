
import React, { useState, useRef, useEffect } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EthnicityMultiSelectProps {
  value: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  maxSelections?: number;
}

const ETHNICITIES = [
  'African', 'African American', 'Albanian', 'Arab', 'Armenian', 'Asian', 'Australian',
  'Austrian', 'Bangladeshi', 'Belgian', 'Brazilian', 'British', 'Bulgarian', 'Canadian',
  'Caribbean', 'Chinese', 'Colombian', 'Croatian', 'Czech', 'Danish', 'Dutch', 'Egyptian',
  'Estonian', 'Ethiopian', 'Filipino', 'Finnish', 'French', 'German', 'Greek', 'Hungarian',
  'Icelandic', 'Indian', 'Indonesian', 'Iranian', 'Iraqi', 'Irish', 'Italian', 'Japanese',
  'Jordanian', 'Korean', 'Lebanese', 'Malaysian', 'Mexican', 'Moroccan', 'Nigerian',
  'Norwegian', 'Pakistani', 'Palestinian', 'Polish', 'Portuguese', 'Romanian', 'Russian',
  'Saudi Arabian', 'Scottish', 'Serbian', 'Singaporean', 'Slovak', 'Slovenian', 'Somali',
  'South African', 'Spanish', 'Sri Lankan', 'Swedish', 'Swiss', 'Syrian', 'Thai',
  'Turkish', 'Ukrainian', 'Vietnamese', 'Welsh', 'Yemeni'
];

const EthnicityMultiSelect = ({ 
  value = [], 
  onChange, 
  placeholder = "Search and select ethnicities...", 
  maxSelections = 2 
}: EthnicityMultiSelectProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredEthnicities = ETHNICITIES.filter(ethnicity =>
    ethnicity.toLowerCase().includes(searchTerm.toLowerCase()) &&
    !value.includes(ethnicity)
  );

  const handleSelect = (ethnicity: string) => {
    if (value.length < maxSelections && !value.includes(ethnicity)) {
      onChange([...value, ethnicity]);
      setSearchTerm('');
    }
  };

  const handleRemove = (ethnicity: string) => {
    onChange(value.filter(item => item !== ethnicity));
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className="min-h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background cursor-pointer focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex flex-wrap gap-1 mb-1">
          {value.map((ethnicity) => (
            <Badge key={ethnicity} variant="secondary" className="text-xs">
              {ethnicity}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(ethnicity);
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={value.length === 0 ? placeholder : "Search for more..."}
            className="border-0 p-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
            disabled={value.length >= maxSelections}
            onFocus={() => setIsOpen(true)}
          />
          <ChevronDown className="h-4 w-4 opacity-50" />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-md max-h-60 overflow-auto">
          {filteredEthnicities.length > 0 ? (
            filteredEthnicities.map((ethnicity) => (
              <div
                key={ethnicity}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground flex items-center justify-between"
                onClick={() => handleSelect(ethnicity)}
              >
                <span>{ethnicity}</span>
                <Check className="h-4 w-4 opacity-0" />
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              {searchTerm ? 'No ethnicities found' : 'Maximum selections reached'}
            </div>
          )}
        </div>
      )}

      {value.length >= maxSelections && (
        <p className="text-xs text-muted-foreground mt-1">
          Maximum of {maxSelections} ethnicities allowed
        </p>
      )}
    </div>
  );
};

export default EthnicityMultiSelect;
