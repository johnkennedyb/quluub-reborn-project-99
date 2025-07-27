import React, { useState, useEffect, Fragment } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import TopNavbar from "@/components/TopNavbar";
import Navbar from "@/components/Navbar";
import MatchCard from "@/components/MatchCard";
import Advert from "@/components/Advert";
import { useAuth } from "@/contexts/AuthContext";
import { relationshipService } from "@/lib/api-client";
import { userService } from "@/lib/api-client";
import { isPremiumUser } from "@/utils/premiumUtils";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@/types/user";
import { useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";

const Search = () => {
  // State matching taofeeq_UI structure
  const [results, setResults] = useState<User[]>([]);
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(10);
  const [lastRequest, setLastRequest] = useState("");

  const [inputs, setInputs] = useState({
    nationality: "",
    country: "",
    ageRange: [22, 45],
    heightRange: [52, 80],
    weightRange: [50, 90],
    build: "",
    appearance: "",
    maritalStatus: "",
    patternOfSalaah: "",
    genotype: "",
    sortBy: "lastSeen",
  });

  const { user: currentUser } = useAuth();


  const { toast } = useToast();
  const navigate = useNavigate();

  const handleChange = (field: string, value: any) => {
    setInputs(prev => ({ ...prev, [field]: value }));
  };

  const searchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 20,
      };

      // Only apply gender filter if user is logged in (this is essential for the app logic)
      if (currentUser) {
        params.gender = currentUser.gender === 'male' ? 'female' : 'male';
      }

      if (inputs.country) {
        params.country = inputs.country;
      }

      if (inputs.nationality) {
        params.nationality = inputs.nationality;
      }

      if (inputs.build) {
        params.build = inputs.build;
      }

      if (inputs.appearance) {
        params.appearance = inputs.appearance;
      }

      if (inputs.maritalStatus) {
        params.maritalStatus = inputs.maritalStatus;
      }

      if (inputs.patternOfSalaah) {
        params.patternOfSalaah = inputs.patternOfSalaah;
      }

      if (inputs.genotype) {
        params.genotype = inputs.genotype;
      }
      
      // Only apply age range if user has changed from default (22-45)
      if (inputs.ageRange && inputs.ageRange.length === 2) {
        if (inputs.ageRange[0] !== 22 || inputs.ageRange[1] !== 45) {
          params.minAge = inputs.ageRange[0];
          params.maxAge = inputs.ageRange[1];
        }
      }
      
      // Add height range parameters (only if not default range)
      if (inputs.heightRange && inputs.heightRange.length === 2) {
        // Only apply height filter if user has changed from default
        if (inputs.heightRange[0] !== 52 || inputs.heightRange[1] !== 80) {
          params.minHeight = inputs.heightRange[0];
          params.maxHeight = inputs.heightRange[1];
        }
      }
      
      // Add weight range parameters (only if not default range)
      if (inputs.weightRange && inputs.weightRange.length === 2) {
        // Only apply weight filter if user has changed from default
        if (inputs.weightRange[0] !== 50 || inputs.weightRange[1] !== 90) {
          params.minWeight = inputs.weightRange[0];
          params.maxWeight = inputs.weightRange[1];
        }
      }

      console.log('🔍 Search params:', params);
      const response = await userService.getBrowseUsers(params);
      console.log('📊 API Response:', response);
      
      if (response && response.data) {
        // Handle axios response format
        const data = response.data;
        if (data.users && Array.isArray(data.users)) {
          console.log('✅ Found users:', data.users.length);
          setResults(data.users);
          setTotalPages(data.pages || 1);
        } else {
          console.warn('⚠️ No users array in response data:', data);
          setResults([]);
          setTotalPages(1);
        }
      } else if (response && response.users) {
        // Direct response format
        console.log('✅ Found users (direct):', response.users.length);
        setResults(response.users);
        setTotalPages(response.pages || 1);
      } else if (Array.isArray(response)) {
        // Array response format
        console.log('✅ Found users (array):', response.length);
        setResults(response);
        setTotalPages(Math.ceil(response.length / 20));
      } else {
        console.warn('⚠️ Unexpected API response format:', response);
        setResults([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('❌ Search error:', error);
      toast({
        title: "Error",
        description: "Failed to search users. Please try again.",
        variant: "destructive",
      });
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    searchUsers();
  }, [page, currentUser]);
  const [pendingConnections, setPendingConnections] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [matchedUserIds, setMatchedUserIds] = useState<string[]>([]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const data = await relationshipService.getMatches();
        let matchesArray: any[] = Array.isArray(data)
          ? data
          : data.matches
          ? data.matches
          : data.data
          ? data.data
          : [];
        const ids = matchesArray.map((match: any) => match._id);
        setMatchedUserIds(ids);
      } catch (err) {
        console.error("Error fetching matches", err);
      }
    };
    fetchMatches();
  }, []);

  const calculateAge = (dob: string | Date | undefined) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  const extractTags = (user: User) => {
    const tags: string[] = [];
    
    if (user.workEducation) {
      const workParts = user.workEducation.split(' ');
      if (workParts.length > 0) tags.push(workParts[0]);
    }
    
    if (user.patternOfSalaah) {
      // Return to normal pattern names
      const patternMap: { [key: string]: string } = {
        'always': 'Always prays',
        'usually': 'Usually prays', 
        'sometimes': 'Sometimes prays',
        'rarely': 'Rarely prays'
      };
      tags.push(patternMap[user.patternOfSalaah] || user.patternOfSalaah);
    }
    
    if (user.maritalStatus) tags.push(user.maritalStatus);
    
    if (user.traits) {
      try {
        const traitsArray = JSON.parse(user.traits);
        if (Array.isArray(traitsArray) && traitsArray.length > 0) {
          tags.push(traitsArray[0]);
        }
      } catch (e) {
        if (typeof user.traits === 'string') tags.push(user.traits);
      }
    }
    
    return tags.slice(0, 3);
  };
  

  
  const handleSendRequest = async (userId: string) => {
    try {
      await relationshipService.sendRequest(userId);
      setPendingConnections(prev => [...prev, userId]);
      toast({
        title: "Request Sent",
        description: "Your connection request has been sent successfully.",
      });
    } catch (error) {
      console.error("Failed to send request:", error);
      toast({
        title: "Error",
        description: "Failed to send request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleAddToFavorites = async (userId: string) => {
    try {
      await userService.addToFavorites(userId); // <-- use this
      setFavorites(prev => [...prev, userId]);
      toast({
        title: "Added to Favorites",
        description: "User has been added to your favorites.",
      });
    } catch (error) {
      console.error("Failed to add to favorites:", error);
      toast({
        title: "Error",
        description: "Failed to add user to favorites.",
        variant: "destructive",
      });
    }
  };
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const data = await userService.getFavorites();
        const favoriteIds = data.favorites.map((user: User) => user._id);
        setFavorites(favoriteIds);
      } catch (err) {
        console.error("Error fetching favorites", err);
      }
    };
  
    fetchFavorites();
  }, []);
  

  const handleRemoveFromFavorites = async (userId: string) => {
    try {
      await userService.removeFromFavorites(userId);
      setFavorites(prev => prev.filter(id => id !== userId));
      toast({
        title: "Removed from Favorites",
        description: "User has been removed from your favorites.",
      });
    } catch (error) {
      console.error("Failed to remove from favorites:", error);
      toast({
        title: "Error",
        description: "Failed to remove user from favorites.",
        variant: "destructive",
      });
    }
  };
  
  
  const handlePass = (userId: string) => {
    toast({
      title: "Hidden",
      description: "This profile has been hidden from your list.",
    });
  };

  // Sort users based on selection
  const sortedUsers = results ? [...results].filter(user => !matchedUserIds.includes(user._id)).sort((a, b) => {
    if (inputs.sortBy === "newest") {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    } else if (inputs.sortBy === "lastSeen") {
      return new Date(b.lastSeen || 0).getTime() - new Date(a.lastSeen || 0).getTime();
    }
    return 0;
  }) : [];

  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <TopNavbar />
      <div className="container py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Filter sidebar */}
          <Card className="md:col-span-1 h-fit">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold">Search Filters</h2>
                <Select value={inputs.sortBy} onValueChange={(value) => handleChange('sortBy', value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="lastSeen">Last Seen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Age Range</label>
                  <div className="mb-2">
                    <Slider 
                      value={inputs.ageRange}
                      min={18} 
                      max={60} 
                      step={1}
                      onValueChange={(value) => handleChange('ageRange', value)}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{inputs.ageRange[0]}</span>
                    <span>{inputs.ageRange[1]}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Height range</label>
                  <div className="mb-2">
                    <Slider 
                      value={inputs.heightRange} 
                      min={120} 
                      max={215} 
                      step={1}
                      onValueChange={(value) => handleChange('heightRange', value)}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{Math.floor(inputs.heightRange[0]/30.48)}'{Math.round((inputs.heightRange[0]/2.54)%12)}"</span>
                    <span>{Math.floor(inputs.heightRange[1]/30.48)}'{Math.round((inputs.heightRange[1]/2.54)%12)}"</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Weight range</label>
                  <div className="mb-2">
                    <Slider 
                      value={inputs.weightRange} 
                      min={30} 
                      max={125} 
                      step={1}
                      onValueChange={(value) => handleChange('weightRange', value)}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{inputs.weightRange[0]}kg</span>
                    <span>{inputs.weightRange[1]}kg</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Select value={inputs.country} onValueChange={(value) => handleChange('country', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="anywhere">Anywhere</SelectItem>
                      <SelectItem value="Nigeria">Nigeria</SelectItem>
                      <SelectItem value="Ghana">Ghana</SelectItem>
                      <SelectItem value="Saudi Arabia">Saudi Arabia</SelectItem>
                      <SelectItem value="United States">United States</SelectItem>
                      <SelectItem value="United Kingdom">United Kingdom</SelectItem>
                      <SelectItem value="Canada">Canada</SelectItem>
                      <SelectItem value="Australia">Australia</SelectItem>
                      <SelectItem value="South Africa">South Africa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Nationality</label>
                  <Select value={inputs.nationality} onValueChange={(value) => handleChange('nationality', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any nationality" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any nationality</SelectItem>
                      <SelectItem value="Nigerian">Nigerian</SelectItem>
                      <SelectItem value="Ghanaian">Ghanaian</SelectItem>
                      <SelectItem value="Saudi">Saudi</SelectItem>
                      <SelectItem value="Egyptian">Egyptian</SelectItem>
                      <SelectItem value="Jordanian">Jordanian</SelectItem>
                      <SelectItem value="Pakistani">Pakistani</SelectItem>
                      <SelectItem value="Indian">Indian</SelectItem>
                      <SelectItem value="Malaysian">Malaysian</SelectItem>
                      <SelectItem value="Indonesian">Indonesian</SelectItem>
                      <SelectItem value="Turkish">Turkish</SelectItem>
                      <SelectItem value="Moroccan">Moroccan</SelectItem>
                      <SelectItem value="Lebanese">Lebanese</SelectItem>
                      <SelectItem value="Syrian">Syrian</SelectItem>
                      <SelectItem value="Bangladeshi">Bangladeshi</SelectItem>
                      <SelectItem value="Iranian">Iranian</SelectItem>
                      <SelectItem value="Afghan">Afghan</SelectItem>
                      <SelectItem value="Somali">Somali</SelectItem>
                      <SelectItem value="Sudanese">Sudanese</SelectItem>
                      <SelectItem value="Yemeni">Yemeni</SelectItem>
                      <SelectItem value="Iraqi">Iraqi</SelectItem>
                      <SelectItem value="Kuwaiti">Kuwaiti</SelectItem>
                      <SelectItem value="Emirati">Emirati</SelectItem>
                      <SelectItem value="Qatari">Qatari</SelectItem>
                      <SelectItem value="Bahraini">Bahraini</SelectItem>
                      <SelectItem value="Omani">Omani</SelectItem>
                      <SelectItem value="Algerian">Algerian</SelectItem>
                      <SelectItem value="Tunisian">Tunisian</SelectItem>
                      <SelectItem value="Libyan">Libyan</SelectItem>
                      <SelectItem value="American">American</SelectItem>
                      <SelectItem value="British">British</SelectItem>
                      <SelectItem value="Canadian">Canadian</SelectItem>
                      <SelectItem value="Australian">Australian</SelectItem>
                      <SelectItem value="German">German</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="Italian">Italian</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="Dutch">Dutch</SelectItem>
                      <SelectItem value="Swedish">Swedish</SelectItem>
                      <SelectItem value="Norwegian">Norwegian</SelectItem>
                      <SelectItem value="Danish">Danish</SelectItem>
                      <SelectItem value="Finnish">Finnish</SelectItem>
                      <SelectItem value="Albanian">Albanian</SelectItem>
                      <SelectItem value="Bosnian">Bosnian</SelectItem>
                      <SelectItem value="Kosovan">Kosovan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Marital Status</label>
                  <Select value={inputs.maritalStatus} onValueChange={(value) => handleChange('maritalStatus', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any status</SelectItem>
                      <SelectItem value="single">Single</SelectItem>
                      <SelectItem value="divorced">Divorced</SelectItem>
                      <SelectItem value="widowed">Widowed</SelectItem>
                      <SelectItem value="married">Married</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Pattern of Salaah</label>
                  <Select value={inputs.patternOfSalaah} onValueChange={(value) => handleChange('patternOfSalaah', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any practice" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any practice</SelectItem>
                      <SelectItem value="always">Always prays</SelectItem>
                      <SelectItem value="usually">Usually prays</SelectItem>
                      <SelectItem value="sometimes">Sometimes prays</SelectItem>
                      <SelectItem value="rarely">Rarely prays</SelectItem>
                      <SelectItem value="never">Never prays</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Build</label>
                  <Select value={inputs.build} onValueChange={(value) => handleChange('build', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any build" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any build</SelectItem>
                      <SelectItem value="Slim">Slim</SelectItem>
                      <SelectItem value="Average">Average</SelectItem>
                      <SelectItem value="Athletic">Athletic</SelectItem>
                      <SelectItem value="Muscular">Muscular</SelectItem>
                      <SelectItem value="Curvy">Curvy</SelectItem>
                      <SelectItem value="Heavy">Heavy</SelectItem>
                      <SelectItem value="Plus Size">Plus Size</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Facial Appearance</label>
                  <Select value={inputs.appearance} onValueChange={(value) => handleChange('appearance', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any appearance" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any appearance</SelectItem>
                      <SelectItem value="Very Fair">Very Fair</SelectItem>
                      <SelectItem value="Fair">Fair</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Dark">Dark</SelectItem>
                      <SelectItem value="Very Dark">Very Dark</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Genotype</label>
                  <Select value={inputs.genotype} onValueChange={(value) => handleChange('genotype', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Any genotype" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any genotype</SelectItem>
                      <SelectItem value="AA">AA</SelectItem>
                      <SelectItem value="AS">AS</SelectItem>
                      <SelectItem value="AC">AC</SelectItem>
                      <SelectItem value="SS">SS</SelectItem>
                      <SelectItem value="SC">SC</SelectItem>
                      <SelectItem value="CC">CC</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="hijab" className="text-sm font-medium">Hijab</Label>
                    <p className="text-xs text-muted-foreground">Show only sisters who wear hijab</p>
                  </div>
                  <Switch id="hijab" checked={false} onCheckedChange={() => {}} disabled={currentUser?.gender !== 'male'} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="beard" className="text-sm font-medium">Beard</Label>
                    <p className="text-xs text-muted-foreground">Show only brothers with beard</p>
                  </div>
                  <Switch id="beard" checked={false} onCheckedChange={() => {}} disabled={currentUser?.gender !== 'female'} />
                </div>

                <Button 
                  onClick={searchUsers}
                  className="w-full mt-4"
                  disabled={loading}
                >
                  {loading ? "Searching..." : "Search"}
                </Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Search results */}
          <div className="md:col-span-3">
            <h1 className="text-2xl font-bold mb-6">Potential Spouses</h1>
            
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : false ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-red-500">Error loading users. Please try again.</p>
                </CardContent>
              </Card>
            ) : sortedUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(() => {
                  const items: JSX.Element[] = [];
                  let profileCount = 0;
                  
                  sortedUsers.forEach((user, index) => {
                    const age = calculateAge(user.dob) || 0;
                    
                    if (age < inputs.ageRange[0] || age > inputs.ageRange[1]) {
                      return;
                    }
                    
                    // Add profile card
                    items.push(
                      <MatchCard 
                        key={user._id}
                        name={`${user.fname} ${user.lname}`}
                        username={user.username}
                        age={age}
                        location={user.country || "Location not specified"}
                        summary={user.summary}
                        matchPercentage={Math.floor(Math.random() * 30) + 70}
                        tags={extractTags(user)}
                        userId={user._id}
                        lastSeen={user.lastSeen}
                        isFavorited={favorites.includes(user._id!)}
                        onFavorite={() =>
                          favorites.includes(user._id!)
                            ? handleRemoveFromFavorites(user._id!)
                            : handleAddToFavorites(user._id!)
                        }
                        onSendRequest={() => handleSendRequest(user._id!)}
                        onPass={() => handlePass(user._id!)}
                      />
                    );
                    
                    profileCount++;
                    
                    // Add ad card after every 5 profiles (only for non-premium users)
                    if (profileCount % 5 === 0 && !isPremiumUser(currentUser)) {
                      items.push(
                        <div key={`ad-${profileCount}`} className="col-span-1">
                          <Advert />
                        </div>
                      );
                    }
                  });
                  
                  return items;
                })()}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">No users match your current filters. Try adjusting your criteria.</p>
                </CardContent>
              </Card>
            )}

            {/* Pagination Controls */}
            {totalPages && totalPages > 1 && (
              <div className="flex justify-center mt-6 items-center space-x-4">
                <Button 
                  onClick={() => setPage(prev => Math.max(prev - 1, 1))}
                  disabled={page <= 1 || loading}
                  variant="outline"
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Button 
                  onClick={() => setPage(prev => prev + 1)}
                  disabled={page >= totalPages || loading}
                  variant="outline"
                >
                  Next
                </Button>
              </div>
            )}
            {!isPremiumUser(currentUser) && (
              <div className="flex justify-center mt-4">
                <Advert />
              </div>
            )}
          </div>
        </div>
      </div>
      <Navbar />
    </div>
  );
};

export default Search;
