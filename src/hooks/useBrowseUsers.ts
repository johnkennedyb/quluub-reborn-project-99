
import { useState, useEffect } from 'react';
import { userService } from '@/lib/api-client';
import { User } from '@/types/user';

interface BrowseUsersResponse {
  users: User[];
  page: number;
  pages: number;
}

interface UseBrowseUsersParams {
  country?: string;
  nationality?: string;
  gender?: string;
  hijab?: string;
  beard?: string;
  page?: number;
}

export const useBrowseUsers = (params: UseBrowseUsersParams = {}) => {
  const [data, setData] = useState<BrowseUsersResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        // Default to 30 users per page
        const searchParams = { ...params, limit: 30 };
        const response = await userService.getBrowseUsers(searchParams);
        setData(response);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch users');
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUsers();
  }, [params.country, params.nationality, params.gender, params.hijab, params.beard, params.page]);

  return { 
    users: data?.users, 
    page: data?.page, 
    pages: data?.pages, 
    isLoading, 
    error
  };
};
