import { useState, useMemo, Suspense } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import TopNavbar from "@/components/TopNavbar";
import Navbar from "@/components/Navbar";
import ProfileEditSections from "@/components/ProfileEditSections";
import UserProfileView from "@/components/UserProfileView";
import { userService } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@/types/user";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

// Type definitions for optimized profile response
interface ProfileOptimizedResponse {
  user: User;
  relationshipStatus: {
    isMatched: boolean;
    hasReceivedRequestFrom: boolean;
    hasSentRequestTo: boolean;
    relationshipId: string | null;
    requestId: string | null;
    isFavorited: boolean;
  };
}

// Loading skeleton component for better perceived performance
const ProfileSkeleton = () => (
  <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardContent className="pt-6 flex flex-col items-center text-center">
            <Skeleton className="w-24 h-24 rounded-full mb-4" />
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-24 mb-1" />
            <Skeleton className="h-4 w-40 mb-4" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-20" />
              <Skeleton className="h-10 w-20" />
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardContent className="p-6">
            <Skeleton className="h-6 w-32 mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
);

const ProfileOptimized = () => {
  const { user: currentUser } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();
  
  // Memoize computed values to prevent unnecessary re-renders
  const isOwnProfile = useMemo(() => !userId || (currentUser?._id === userId), [userId, currentUser?._id]);
  const displayUserId = useMemo(() => userId || currentUser?._id, [userId, currentUser?._id]);
  
  // Use React Query for optimized data fetching with caching
  const {
    data: profileData,
    isLoading,
    error,
    refetch
  } = useQuery<ProfileOptimizedResponse>({
    queryKey: ['profile-optimized', displayUserId],
    queryFn: async (): Promise<ProfileOptimizedResponse> => {
      if (!displayUserId) throw new Error('No user ID provided');
      
      // For own profile, use current user data if available to avoid API call
      if (isOwnProfile && currentUser) {
        return {
          user: currentUser,
          relationshipStatus: {
            isMatched: false,
            hasReceivedRequestFrom: false,
            hasSentRequestTo: false,
            relationshipId: null,
            requestId: null,
            isFavorited: false
          }
        };
      }
      
      // Use optimized endpoint for other users' profiles
      return await userService.getProfileOptimized(displayUserId);
    },
    enabled: !!displayUserId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (renamed from cacheTime in newer versions)
    retry: 2,
    refetchOnWindowFocus: false,
    refetchOnMount: false
  });

  const profileUser = profileData?.user;
  const relationshipStatus = profileData?.relationshipStatus || {
    isMatched: false,
    hasReceivedRequestFrom: false,
    hasSentRequestTo: false,
    relationshipId: null,
    requestId: null,
    isFavorited: false
  };

  // Handle profile update for own profile
  const handleProfileUpdate = (updatedUser: User) => {
    // Update React Query cache
    refetch();
    toast({
      title: "Profile Updated",
      description: "Your profile has been updated successfully.",
    });
  };

  // Error handling
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <TopNavbar />
        <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Profile Not Found</h2>
            <p className="text-gray-600 mb-4">The profile you're looking for doesn't exist or has been removed.</p>
            <button 
              onClick={() => window.history.back()}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
        <Navbar />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopNavbar />
      
      <Suspense fallback={<ProfileSkeleton />}>
        {isLoading ? (
          <ProfileSkeleton />
        ) : profileUser ? (
          <>
            {isOwnProfile && isEditMode ? (
              <ProfileEditSections
                user={profileUser}
                onSave={handleProfileUpdate}
                onCancel={() => setIsEditMode(false)}
              />
            ) : (
              <UserProfileView
                user={profileUser}
                hasReceivedRequestFrom={relationshipStatus.hasReceivedRequestFrom}
                requestId={relationshipStatus.requestId}
                isMatched={relationshipStatus.isMatched}
                relationshipId={relationshipStatus.relationshipId}
              />
            )}
            
            {isOwnProfile && !isEditMode && (
              <div className="fixed bottom-20 right-4 z-50">
                <button
                  onClick={() => setIsEditMode(true)}
                  className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                  aria-label="Edit Profile"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              </div>
            )}
          </>
        ) : (
          <ProfileSkeleton />
        )}
      </Suspense>
      
      <Navbar />
    </div>
  );
};

export default ProfileOptimized;
