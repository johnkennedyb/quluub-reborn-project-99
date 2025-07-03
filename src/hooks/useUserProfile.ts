
import { useState, useEffect } from 'react';
import { userService } from '@/lib/api-client';
import { User } from '@/types/user';
import { useToast } from '@/components/ui/use-toast';

export const useUserProfile = (userId?: string) => {
  const [profile, setProfile] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!userId) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        console.log("Fetching user profile for ID:", userId);
        const userData = await userService.getProfile(userId);
        console.log("Fetched user profile:", userData);
        setProfile(userData);
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setError(err instanceof Error ? err : new Error('Failed to fetch profile'));
        toast({
          title: "Error",
          description: "Failed to load user profile. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();
  }, [userId, toast]);

  return { profile, isLoading, error };
};
