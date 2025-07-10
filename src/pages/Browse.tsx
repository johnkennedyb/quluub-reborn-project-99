
import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Heart, X, Send, UserPlus, Search, Filter, Star } from "lucide-react";
import AdComponent from '@/components/AdComponent';
import { useAuth } from '@/contexts/AuthContext';
import { userService, relationshipService } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { User } from "@/types/user";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { UserProfileCard } from "@/components/UserProfileCard";
import { Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const Browse = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [usersPerPage] = useState(30);
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);
  const [pendingConnections, setPendingConnections] = useState<string[]>([]);
  const [countryFilter, setCountryFilter] = useState("");
  const [hijabFilter, setHijabFilter] = useState("");
  const [beardFilter, setBeardFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteUsers, setFavoriteUsers] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchUsers = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const fetchedUsers = await userService.getBrowseUsers();
        console.log("Browse users:", fetchedUsers);
        
        if (fetchedUsers && fetchedUsers.length > 0) {
          // Filter users based on current user's gender (men see women, women see men)
          const oppositeGenderUsers = fetchedUsers.filter((u: User) => {
            if (user.gender === 'male') {
              return u.gender === 'female';
            } else if (user.gender === 'female') {
              return u.gender === 'male';
            }
            return true; // fallback for other genders
          });
          
          setUsers(oppositeGenderUsers);
          setFilteredUsers(oppositeGenderUsers);
          setTotalPages(Math.ceil(oppositeGenderUsers.length / usersPerPage));
        } else {
          toast({
            title: "No users found",
            description: "No potential matches were found at this time.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error("Failed to fetch browse users:", error);
        toast({
          title: "Error",
          description: "Failed to load potential matches",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();

    const fetchFavorites = async () => {
      try {
        const favoritesData = await userService.getFavorites();
        if (favoritesData && favoritesData.favorites) {
          const favoriteIds = favoritesData.favorites.map((fav: any) => fav._id || fav.id);
          setFavoriteUsers(favoriteIds);
        }
      } catch (error) {
        console.error("Error fetching favorites:", error);
      }
    };

    fetchFavorites();

    const fetchPendingRequests = async () => {
      try {
        const response = await relationshipService.getPendingRequests();
        if (response && response.requests) {
          const pendingIds = response.requests.map((req: any) => req._id);
          setPendingConnections(pendingIds);
        }
      } catch (error) {
        console.error("Error fetching pending requests:", error);
      }
    };
    
    fetchPendingRequests();
  }, [toast, usersPerPage, user]);

  // Filter users based on search, country, hijab, and beard filters
  useEffect(() => {
    let result = [...users];
    
    if (countryFilter) {
      result = result.filter(user => user.country === countryFilter);
    }
    
    if (hijabFilter && user?.gender === 'male') {
      result = result.filter(user => user.hijab === hijabFilter);
    }
    
    if (beardFilter && user?.gender === 'female') {
      result = result.filter(user => user.beard === beardFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(user => 
        (user.fname?.toLowerCase().includes(query) || 
         user.lname?.toLowerCase().includes(query) || 
         user.kunya?.toLowerCase().includes(query) ||
         user.username?.toLowerCase().includes(query))
      );
    }
    
    setFilteredUsers(result);
    setTotalPages(Math.ceil(result.length / usersPerPage));
    setCurrentPage(1);
  }, [countryFilter, hijabFilter, beardFilter, searchQuery, users, usersPerPage, user]);

  const handleLike = async (userId: string) => {
    if (processingAction) return;
    
    try {
      setProcessingAction(true);
      console.log("Sending request to user ID:", userId);
      await relationshipService.sendRequest(userId);
      setPendingConnections(prev => [...prev, userId]);
      toast({
        title: "Success",
        description: "You have expressed interest in this person",
      });
    } catch (error) {
      console.error("Failed to send like:", error);
      const errorMessage = (error as any)?.response?.data?.message || "Failed to express interest";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleSkip = (userId: string) => {
    toast({
      title: "Skipped",
      description: "You've skipped this profile",
    });
  };

  const handleMessage = (userId: string) => {
    navigate(`/messages?userId=${userId}`);
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile?id=${userId}`);
  };

  const handleToggleFavorite = async (userId: string) => {
    if (processingAction) return;
    
    try {
      setProcessingAction(true);
      
      if (favoriteUsers.includes(userId)) {
        await userService.removeFromFavorites(userId);
        setFavoriteUsers(prev => prev.filter(id => id !== userId));
        toast({
          title: "Removed from favorites",
          description: "User removed from your favorites",
        });
      } else {
        await userService.addToFavorites(userId);
        setFavoriteUsers(prev => [...prev, userId]);
        toast({
          title: "Added to favorites",
          description: "User added to your favorites",
        });
      }
    } catch (error) {
      console.error("Failed to toggle favorite:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites",
        variant: "destructive",
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Get unique countries for the filter
  const uniqueCountries = [...new Set(users.filter(user => user.country).map(user => user.country))];

  // Get current users for the page
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Create array with ads inserted every 5 users
  const createUsersWithAds = (users: User[]) => {
    const result: (User | { type: 'ad', id: string })[] = [];
    
    users.forEach((user, index) => {
      result.push(user);
      
      // Add ad after every 5 users (but not after the last user)
      if ((index + 1) % 5 === 0 && index < users.length - 1 && user?.plan !== 'premium') {
        result.push({ type: 'ad', id: `ad-${index}` });
      }
    });
    
    return result;
  };

  const usersWithAds = createUsersWithAds(currentUsers);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Find Your Match</h1>
        
        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by name or username" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          
          <div className="flex gap-2 items-center">
            <Filter className="h-4 w-4" />
            <Select value={countryFilter} onValueChange={setCountryFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by country" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Countries</SelectItem>
                {uniqueCountries.map(country => (
                  <SelectItem key={country} value={country!}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Hijab filter for men viewing women */}
            {user?.gender === 'male' && (
              <Select value={hijabFilter} onValueChange={setHijabFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Hijab" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            )}
            
            {/* Beard filter for women viewing men */}
            {user?.gender === 'female' && (
              <Select value={beardFilter} onValueChange={setBeardFilter}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Beard" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Any</SelectItem>
                  <SelectItem value="Yes">Yes</SelectItem>
                  <SelectItem value="No">No</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {usersWithAds.map((item, index) => {
                if ('type' in item && item.type === 'ad') {
                  return (
                    <div key={item.id} className="sm:col-span-2 lg:col-span-4 my-4">
                      <AdComponent />
                    </div>
                  );
                }
                
                const user = item as User;
                return (
                  <div key={user._id || user.id} className="flex flex-col h-full">
                    <UserProfileCard
                      user={user}
                      onView={handleViewProfile}
                      onLike={(id) => handleLike(id)}
                      onMessage={(id) => handleMessage(id)}
                    />
                    <div className="flex justify-between space-x-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => handleSkip(user._id || user.id || '')}
                        disabled={processingAction}
                      >
                        <X className="h-5 w-5 text-red-500" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => handleToggleFavorite(user._id || user.id || '')}
                        disabled={processingAction}
                      >
                        <Star className={`h-5 w-5 ${favoriteUsers.includes(user._id || user.id || '') ? 'fill-yellow-500 text-yellow-500' : 'text-gray-400'}`} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => handleLike(user._id || user.id || '')}
                        disabled={processingAction || pendingConnections.includes(user._id || user.id || '')}
                      >
                        {pendingConnections.includes(user._id || user.id || '') ? (
                          <UserPlus className="h-5 w-5 text-amber-500" />
                        ) : (
                          <Heart className="h-5 w-5 text-green-500" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 rounded-full"
                        onClick={() => handleMessage(user._id || user.id || '')}
                        disabled={processingAction}
                      >
                        <Send className="h-5 w-5 text-purple-500" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Pagination */}
            <div className="flex justify-center items-center space-x-4 mt-8">
              <Button 
                variant="outline" 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} 
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center space-x-2">
                {/* Show page numbers */}
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button 
                variant="outline" 
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} 
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>

            <div className="text-center mt-4 text-sm text-muted-foreground">
              Showing {indexOfFirstUser + 1}-{Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} profiles
            </div>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg text-center text-muted-foreground">
                {searchQuery || countryFilter || hijabFilter || beardFilter ? 
                  "No users match your search criteria." :
                  "No more profiles to browse. Check back later!"}
              </p>
              {(searchQuery || countryFilter || hijabFilter || beardFilter) && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setCountryFilter("");
                    setHijabFilter("");
                    setBeardFilter("");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Browse;
