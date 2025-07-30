
import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams } from "react-router-dom";
import TopNavbar from "@/components/TopNavbar";
import Navbar from "@/components/Navbar";
import ProfileEditSections from "@/components/ProfileEditSections";
import UserProfileView from "@/components/UserProfileView";
import { userService, relationshipService } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@/types/user";

const Profile = () => {
  const { user: currentUser } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [relationshipStatus, setRelationshipStatus] = useState<{
    isMatched: boolean;
    hasReceivedRequestFrom: boolean;
    relationshipId?: string;
    requestId?: string;
  }>({ isMatched: false, hasReceivedRequestFrom: false });
  const { toast } = useToast();
  
  // Memoize computed values to prevent unnecessary re-renders
  const isOwnProfile = useMemo(() => !userId || (currentUser?._id === userId), [userId, currentUser?._id]);
  const displayUserId = useMemo(() => userId || currentUser?._id, [userId, currentUser?._id]);
  
  // Fetch relationship status for other users' profiles
  const fetchRelationshipStatus = useCallback(async (targetUserId: string) => {
    if (!currentUser?._id || isOwnProfile) return;
    
    try {
      // Check if user is in matches (accepted relationships)
      const matchesResponse = await relationshipService.getMatches();
      console.log('Matches response:', matchesResponse);
      
      // Handle different response structures
      const matchesArray = Array.isArray(matchesResponse) ? matchesResponse : 
                          matchesResponse?.matches ? matchesResponse.matches : 
                          matchesResponse?.data ? matchesResponse.data : [];
      
      if (!Array.isArray(matchesArray)) {
        console.warn('Matches data is not an array:', matchesArray);
        return;
      }
      
      const match = matchesArray.find((match: any) => match._id === targetUserId);
      
      if (match) {
        setRelationshipStatus({
          isMatched: true,
          hasReceivedRequestFrom: false,
          relationshipId: match.relationshipId || match._id
        });
        return;
      }
      
      // Check if user has sent a request to current user (received requests)
      const receivedRequestsResponse = await relationshipService.getReceivedRequests();
      const receivedRequestsArray = receivedRequestsResponse?.requests || receivedRequestsResponse || [];
      const receivedRequest = Array.isArray(receivedRequestsArray) ? 
        receivedRequestsArray.find((req: any) => req._id === targetUserId || req.requester?._id === targetUserId) : null;
      
      if (receivedRequest) {
        setRelationshipStatus({
          isMatched: false,
          hasReceivedRequestFrom: true,
          requestId: receivedRequest._id || receivedRequest.relationship?.id
        });
        return;
      }
      
      // Check if current user has sent a request to target user (sent requests)
      const sentRequestsResponse = await relationshipService.getSentRequests();
      const sentRequestsArray = sentRequestsResponse?.requests || sentRequestsResponse || [];
      const sentRequest = Array.isArray(sentRequestsArray) ? 
        sentRequestsArray.find((req: any) => req._id === targetUserId || req.recipient?._id === targetUserId) : null;
      
      if (sentRequest) {
        setRelationshipStatus({
          isMatched: false,
          hasReceivedRequestFrom: false,
          relationshipId: sentRequest._id
        });
        return;
      }
      
      // No relationship found
      setRelationshipStatus({ isMatched: false, hasReceivedRequestFrom: false });
      
    } catch (error) {
      console.error("Failed to fetch relationship status:", error);
      setRelationshipStatus({ isMatched: false, hasReceivedRequestFrom: false });
    }
  }, [currentUser?._id, isOwnProfile]);

  // Memoize the fetch function to prevent recreation on every render
  const fetchUserProfile = useCallback(async () => {
    if (!displayUserId) return;
    
    try {
      setLoading(true);
      
      // Always fetch fresh data from backend to ensure DOB and other fields are up-to-date
      const userData = await userService.getProfile(displayUserId);
      
      // Debug logging for DOB issue
      console.log('=== PROFILE DATA DEBUG ===');
      console.log('Full user data from backend:', userData);
      console.log('DOB field specifically:', userData?.dob);
      console.log('DOB type:', typeof userData?.dob);
      console.log('All date-related fields:', {
        dob: userData?.dob,
        dateOfBirth: userData?.dateOfBirth,
        createdAt: userData?.createdAt,
        updatedAt: userData?.updatedAt
      });
      console.log('========================');
      
      setProfileUser(userData || null);
      
      // Fetch relationship status for other users' profiles
      if (!isOwnProfile && userData) {
        await fetchRelationshipStatus(userData._id);
      }
      
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      toast({
        title: "Error",
        description: "Failed to load user profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [displayUserId, isOwnProfile, currentUser, toast, fetchRelationshipStatus]);
  
  useEffect(() => {
    fetchUserProfile();
  }, [fetchUserProfile]);

  const handleProfileSave = useCallback(async (updatedData: Partial<User>) => {
    if (!profileUser?._id) return;
    
    try {
      // Optimistically update UI first for better UX
      const optimisticUpdate = { ...profileUser, ...updatedData };
      setProfileUser(optimisticUpdate);
      
      // Make API call
      await userService.updateProfile(profileUser._id, updatedData);
      
      setIsEditMode(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      
      // Revert optimistic update on error
      setProfileUser(profileUser);
      
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  }, [profileUser, toast]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <TopNavbar />
        <div className="container py-6 flex justify-center items-center h-[calc(100vh-100px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16">
        <TopNavbar />
        <div className="container py-6">
          <div className="text-center">
            <p className="text-lg text-muted-foreground">Profile not found</p>
          </div>
        </div>
      </div>
    );
  }

  // Always show edit mode for own profile, or regular view for others
  if (isOwnProfile) {
    return (
      <div className="min-h-screen bg-gray-50 pt-16" style={{paddingBottom: '200px'}}>
        <TopNavbar />
        <ProfileEditSections
          user={profileUser}
          onSave={handleProfileSave}
          onCancel={() => setIsEditMode(false)}
        />
        <Navbar />
      </div>
    );
  }

  // For viewing other users' profiles (non-edit mode)
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <TopNavbar />
      <UserProfileView 
        user={profileUser} 
        hasReceivedRequestFrom={relationshipStatus.hasReceivedRequestFrom}
        requestId={relationshipStatus.requestId}
        isMatched={relationshipStatus.isMatched}
        relationshipId={relationshipStatus.relationshipId}
      />
      <Navbar />
    </div>
  );
};

export default Profile;
