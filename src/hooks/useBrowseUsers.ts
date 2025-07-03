
import { useState, useEffect } from 'react';
import { userService } from '@/lib/api-client';
import { User } from '@/types/user';
import { useToast } from '@/components/ui/use-toast';

interface UseBrowseUsersParams {
  country?: string;
  nationality?: string;
  limit?: number;
  showAll?: boolean;
  page?: number; // Add pagination support
}

export const useBrowseUsers = (params: UseBrowseUsersParams = {}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(params.page || 1);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching browse users with params:", params);
        const fetchedUsers = await userService.getBrowseUsers({
          ...params,
          showAll: true // Always fetch all users
        });
        console.log("Fetched browse users:", fetchedUsers);
        
        // Log some statistics about the data
        if (fetchedUsers && fetchedUsers.length > 0) {
          console.log(`Fetched ${fetchedUsers.length} users`);
          console.log(`Users with maritalStatus: ${fetchedUsers.filter(u => u.maritalStatus).length}`);
          console.log(`Users with nationality: ${fetchedUsers.filter(u => u.nationality).length}`);
          console.log(`Users with patternOfSalaah: ${fetchedUsers.filter(u => u.patternOfSalaah).length}`);
          console.log(`Users with summary: ${fetchedUsers.filter(u => u.summary).length}`);
          
          // Calculate total pages (assuming we display 4 users per page)
          setTotalPages(Math.ceil(fetchedUsers.length / 4));
        } else {
          console.log("No users fetched or empty users array");
        }
        
        setUsers(fetchedUsers || []);
      } catch (err) {
        console.error("Failed to fetch browse users:", err);
        setError(err instanceof Error ? err : new Error('Failed to fetch users'));
        toast({
          title: "Error",
          description: "Failed to load potential spouses. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [params.country, params.nationality, params.limit, params.page, toast]);

  // Function to navigate to specific page
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return { 
    users, 
    isLoading, 
    error, 
    totalPages, 
    currentPage, 
    goToPage 
  };
};
