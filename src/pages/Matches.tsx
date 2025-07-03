
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import Navbar from "@/components/Navbar";
import MatchCard from "@/components/MatchCard";
import { relationshipService } from "@/lib/api-client";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@/types/user";
import { useNavigate } from "react-router-dom";
import { calculateAge } from "@/utils/dataUtils";

interface MatchesResponse {
  count: number;
  matches: (User & {
    relationship: {
      id: string;
      status: string;
      createdAt: string;
    }
  })[];
}

const Matches = () => {
  const [matches, setMatches] = useState<MatchesResponse["matches"]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        const response = await relationshipService.getMatches();
        console.log("Matches data:", response);
        setMatches(response.matches || []);
      } catch (error) {
        console.error("Failed to fetch matches:", error);
        toast({
          title: "Error",
          description: "Failed to load your matches. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [toast]);

  // Function to format match date (relative to now)
  const formatMatchDate = (date: string) => {
    const matchDate = new Date(date);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - matchDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} week${Math.floor(diffInDays / 7) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInDays / 30)} month${Math.floor(diffInDays / 30) > 1 ? 's' : ''} ago`;
  };

  // Extract up to 3 interests from user data
  const extractInterests = (user: User) => {
    const tags: string[] = [];
    
    if (user.workEducation) tags.push(user.workEducation.split(' ')[0]);
    if (user.patternOfSalaah) tags.push(user.patternOfSalaah);
    if (user.nationality) tags.push(user.nationality);
    
    // Try to extract traits if they exist
    if (user.traits) {
      try {
        const traitsArray = JSON.parse(user.traits);
        if (Array.isArray(traitsArray) && traitsArray.length > 0) {
          tags.push(traitsArray[0]);
        }
      } catch (e) {
        // If parsing fails, just use the string
        if (typeof user.traits === 'string') tags.push(user.traits);
      }
    }
    
    return tags.filter(Boolean).slice(0, 3);
  };
  
  // Handle clicking on a match to start messaging
  const handleStartChat = (userId: string) => {
    console.log('Starting chat with user:', userId);
    navigate(`/messages?matchId=${userId}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container py-6">
        <h1 className="text-2xl font-bold mb-6">Your Matched Spouses</h1>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : matches.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <div key={match._id}>
                <MatchCard 
                  name={`${match.fname} ${match.lname}`}
                  age={calculateAge(match.dob as string) || 0}
                  location={match.country || "Location not specified"}
                  photoUrl=""
                  matchDate={match.relationship?.createdAt ? formatMatchDate(match.relationship.createdAt) : "Recently"}
                  tags={extractInterests(match)}
                  bio={match.summary || "No summary provided"}
                  onChat={() => handleStartChat(match._id!)}
                  userId={match._id || ''}
                />
              </div>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-lg text-center text-muted-foreground">
                SubhanAllah, you don't have any matches yet. Start browsing to find your halal match, insha'Allah!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Matches;
