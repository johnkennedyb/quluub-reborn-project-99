
import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import TopNavbar from "@/components/TopNavbar";
import Navbar from "@/components/Navbar";
import ProfileEditSections from "@/components/ProfileEditSections";
import { userService } from "@/lib/api-client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { User } from "@/types/user";

const Profile = () => {
  const { user: currentUser } = useAuth();
  const { userId } = useParams<{ userId: string }>();
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const { toast } = useToast();
  
  const isOwnProfile = !userId || (currentUser?._id === userId);
  const displayUserId = userId || currentUser?._id;
  
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!displayUserId) return;
      
      try {
        setLoading(true);
        const userData = isOwnProfile
          ? currentUser
          : await userService.getProfile(displayUserId);
          
        setProfileUser(userData || null);
        console.log("Profile user data:", userData);
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
    };
    
    fetchUserProfile();
  }, [displayUserId, isOwnProfile, currentUser, toast]);

  const handleProfileSave = async (updatedData: Partial<User>) => {
    if (!profileUser?._id) return;
    
    try {
      await userService.updateProfile(profileUser._id, updatedData);
      setProfileUser(prev => prev ? { ...prev, ...updatedData } : null);
      setIsEditMode(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error("Failed to update profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    }
  };

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
      <div className="min-h-screen bg-gray-50 pt-16">
        <TopNavbar />
        <ProfileEditSections
          user={profileUser}
          onSave={handleProfileSave}
          onCancel={() => setIsEditMode(false)}
        />
      </div>
    );
  }

  // For viewing other users' profiles (non-edit mode)
  return (
    <div className="min-h-screen bg-gray-50 pt-16">
      <TopNavbar />
      <div className="container py-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold">{profileUser.fname} {profileUser.lname}</h2>
          <p className="text-muted-foreground">{profileUser.country}</p>
        </div>
      </div>
      <Navbar />
    </div>
  );
};

export default Profile;
