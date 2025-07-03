import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Heart, X, Send, UserPlus, Search, Filter, Star } from "lucide-react";
import { userService, relationshipService } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@/types/user";
import { useNavigate } from "react-router-dom";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
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
  const [usersPerPage] = useState(8); // Show 8 users per page
  const [loading, setLoading] = useState(true);
  const [processingAction, setProcessingAction] = useState(false);
  const [pendingConnections, setPendingConnections] = useState<string[]>([]);
  const [countryFilter, setCountryFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [favoriteUsers, setFavoriteUsers] = useState<string[]>([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const fetchedUsers = await userService.getBrowseUsers({ showAll: true });
        console.log("Browse users:", fetchedUsers);
        if (fetchedUsers && fetchedUsers.length > 0) {
          setUsers(fetchedUsers);
          setFilteredUsers(fetchedUsers);
          setTotalPages(Math.ceil(fetchedUsers.length / usersPerPage));
        } else {
          // If no users found, show toast
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

    // Fetch favorites
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

    // Fetch pending connections to highlight already requested users
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
  }, [toast, usersPerPage]);

  // Filter users based on search and country filter
  useEffect(() => {
    let result = [...users];
    
    if (countryFilter) {
      result = result.filter(user => user.country === countryFilter);
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
    setCurrentPage(1); // Reset to first page when filters change
  }, [countryFilter, searchQuery, users, usersPerPage]);

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
    // In a real app, you might want to track skipped users
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

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Get unique countries for the filter
  const uniqueCountries = [...new Set(users.filter(user => user.country).map(user => user.country))];

  // Get current users
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);

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
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {currentUsers.map(user => (
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
              ))}
            </div>
            
            <Pagination className="mt-6">
              <PaginationContent>
                <PaginationItem>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={goToPrevPage} 
                    disabled={currentPage === 1}
                    className="cursor-pointer"
                  >
                    <PaginationPrevious />
                  </Button>
                </PaginationItem>
                <PaginationItem className="flex items-center px-4">
                  Page {currentPage} of {totalPages}
                </PaginationItem>
                <PaginationItem>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={goToNextPage} 
                    disabled={currentPage === totalPages}
                    className="cursor-pointer"
                  >
                    <PaginationNext />
                  </Button>
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg text-center text-muted-foreground">
                {searchQuery || countryFilter ? 
                  "No users match your search criteria." :
                  "No more profiles to browse. Check back later!"}
              </p>
              {(searchQuery || countryFilter) && (
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => {
                    setSearchQuery("");
                    setCountryFilter("");
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
