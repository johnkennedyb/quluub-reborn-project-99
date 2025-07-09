import { useState , useEffect} from "react";
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
import TopNavbar from "@/components/TopNavbar";
import Navbar from "@/components/Navbar";
import MatchCard from "@/components/MatchCard";
import { useBrowseUsers } from "@/hooks/useBrowseUsers";
import { useAuth } from "@/contexts/AuthContext";
import { relationshipService } from "@/lib/api-client";
import { userService } from "@/lib/api-client"; // ensure this is imported
import AdComponent from '@/components/AdComponent';

import { useToast } from "@/components/ui/use-toast";
import { User } from "@/types/user";
import { useNavigate } from "react-router-dom";

const Search = () => {
  const [ageRange, setAgeRange] = useState([18, 60]);
  const [heightRange, setHeightRange] = useState([150, 200]);
  const [weightRange, setWeightRange] = useState([30, 125]);
  const [location, setLocation] = useState("anywhere");
  const [nationality, setNationality] = useState("any");
  const [maritalStatus, setMaritalStatus] = useState("any");
  const [patternOfSalaah, setPatternOfSalaah] = useState("any");
  const [sortBy, setSortBy] = useState("newest");
  const [searchGender, setSearchGender] = useState("any");
  const [showHijabOnly, setShowHijabOnly] = useState(false);
  const [showBeardOnly, setShowBeardOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const { user: currentUser } = useAuth();

  useEffect(() => {
    if (currentUser) {
      setSearchGender(currentUser.gender === 'male' ? 'female' : 'male');
    }
  }, [currentUser]);
  
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [filterParams, setFilterParams] = useState<{
    country?: string;
    nationality?: string;
    gender?: string;
    hijab?: string;
    beard?: string;
    page?: number;
  }>({});
  
  useEffect(() => {
    const params: any = {};

    if (searchGender !== "any") {
      params.gender = searchGender;
    }

    if (location !== "anywhere") {
      params.country = location;
    }

    if (nationality !== "any") {
      params.nationality = nationality;
    }

    if (showHijabOnly) {
      params.hijab = 'Yes';
    }

    if (showBeardOnly) {
      params.beard = 'Yes';
    }

    params.page = currentPage;

    setFilterParams(params);
  }, [currentUser, location, nationality, showHijabOnly, showBeardOnly, currentPage, searchGender]);

  const { users, page, pages, isLoading, error } = useBrowseUsers(filterParams);
  const [pendingConnections, setPendingConnections] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  
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
  const sortedUsers = users ? [...users].sort((a, b) => {
    if (sortBy === "newest") {
      return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
    } else if (sortBy === "lastSeen") {
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
                <Select value={sortBy} onValueChange={setSortBy}>
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
                      value={ageRange}
                      min={18} 
                      max={60} 
                      step={1}
                      onValueChange={(value) => setAgeRange(value as number[])}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{ageRange[0]}</span>
                    <span>{ageRange[1]}</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Height range</label>
                  <div className="mb-2">
                    <Slider 
                      value={heightRange} 
                      min={120} 
                      max={215} 
                      step={1}
                      onValueChange={(value) => setHeightRange(value as number[])}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{Math.floor(heightRange[0]/30.48)}'{Math.round((heightRange[0]/2.54)%12)}"</span>
                    <span>{Math.floor(heightRange[1]/30.48)}'{Math.round((heightRange[1]/2.54)%12)}"</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Weight range</label>
                  <div className="mb-2">
                    <Slider 
                      value={weightRange} 
                      min={30} 
                      max={125} 
                      step={1}
                      onValueChange={(value) => setWeightRange(value as number[])}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{weightRange[0]}kg</span>
                    <span>{weightRange[1]}kg</span>
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">Location</label>
                  <Select value={location} onValueChange={setLocation}>
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
                  <Select value={nationality} onValueChange={setNationality}>
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
                  <Select value={maritalStatus} onValueChange={setMaritalStatus}>
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
                  <Select value={patternOfSalaah} onValueChange={setPatternOfSalaah}>
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
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="hijab" className="text-sm font-medium">Hijab</Label>
                    <p className="text-xs text-muted-foreground">Show only sisters who wear hijab</p>
                  </div>
                  <Switch id="hijab" checked={showHijabOnly} onCheckedChange={setShowHijabOnly} disabled={currentUser?.gender !== 'male'} />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label htmlFor="beard" className="text-sm font-medium">Beard</Label>
                    <p className="text-xs text-muted-foreground">Show only brothers with beard</p>
                  </div>
                  <Switch id="beard" checked={showBeardOnly} onCheckedChange={setShowBeardOnly} disabled={currentUser?.gender !== 'female'} />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Gender</label>
                  <Select value={searchGender} onValueChange={setSearchGender}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Search results */}
          <div className="md:col-span-3">
            <h1 className="text-2xl font-bold mb-6">Potential Spouses</h1>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : error ? (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-red-500">Error loading users. Please try again.</p>
                </CardContent>
              </Card>
            ) : sortedUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedUsers.map((user, index) => {
                  const age = calculateAge(user.dob) || 0;
                  
                  if (age < ageRange[0] || age > ageRange[1]) {
                    return null;
                  }
                  
                  return (
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
                })}
                
                {/* Show ads between every 5 people for non-premium users */}
                {currentUser?.plan !== 'premium' && sortedUsers.length > 5 && (
                  <div className="md:col-span-3 lg:col-span-3 w-full">
                    <AdComponent />
                  </div>
                )}
              </div>
            ) : (
              <Card>
                <CardContent className="p-6">
                  <p className="text-center text-muted-foreground">No users match your current filters. Try adjusting your criteria.</p>
                </CardContent>
              </Card>
            )}

            {/* Pagination Controls */}
            {pages && pages > 1 && (
              <div className="mt-6 space-y-4">
                <div className="flex justify-center items-center space-x-2">
                  <Button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={page <= 1 || isLoading}
                    variant="outline"
                  >
                    Previous
                  </Button>
                  {Array.from({ length: Math.min(pages, 10) }, (_, i) => {
                    let pageNumber;
                    if (pages <= 10) {
                      pageNumber = i + 1;
                    } else {
                      const start = Math.max(1, page - 5);
                      const end = Math.min(pages, start + 9);
                      pageNumber = start + i;
                      if (pageNumber > end) return null;
                    }
                    return (
                      <Button 
                        key={pageNumber} 
                        onClick={() => setCurrentPage(pageNumber)}
                        disabled={isLoading}
                        variant={pageNumber === page ? 'default' : 'outline'}
                        size="sm"
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                  <Button 
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={page >= pages || isLoading}
                    variant="outline"
                  >
                    Next
                  </Button>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  Page {page} of {pages} • Showing 30 profiles per page
                </div>
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
