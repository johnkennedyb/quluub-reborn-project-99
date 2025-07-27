import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';

interface UserProfileProps {
  userId: string;
}

const UserProfile = ({ userId }: UserProfileProps) => {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const apiClient = axios.create({
          baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
          headers: { 'Content-Type': 'application/json' },
        });

        const adminToken = localStorage.getItem('adminToken');
        if (adminToken) {
          apiClient.defaults.headers.Authorization = `Bearer ${adminToken}`;
        }

        const response = await apiClient.get(`/admin/users/${userId}`);
        setUser(response.data);
      } catch (error: any) {
        console.error('Error fetching user profile:', error);
        toast({ 
          title: 'Error', 
          description: error.response?.data?.message || 'Could not fetch user profile.', 
          variant: 'destructive' 
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [userId, toast]);

  if (isLoading) {
    return <div>Loading user profile...</div>;
  }

  if (!user) {
    return <div>User not found.</div>;
  }

  const renderDetail = (label: string, value: any) => (
    <div className="grid grid-cols-3 gap-4 py-2 border-b">
      <dt className="font-medium text-gray-500">{label}</dt>
      <dd className="col-span-2">{value || 'N/A'}</dd>
    </div>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.fname} {user.lname}</CardTitle>
        <CardDescription>@{user.username}</CardDescription>
        <div className="flex space-x-2 pt-2">
          <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>{user.status}</Badge>
          <Badge variant="outline">{user.plan}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Activity Stats</h3>
            <div className="space-y-1 text-sm">
              <div>Total Matches: <span className="font-medium">{user.stats?.totalMatches || 0}</span></div>
              <div>Total Conversations: <span className="font-medium">{user.stats?.totalConversations || 0}</span></div>
              <div>Profile Views: <span className="font-medium">{user.stats?.profileViews || 0}</span></div>
            </div>
          </div>
        </div>
        <dl className="divide-y divide-gray-200">
          {renderDetail('Email', user.email)}
          {renderDetail('Gender', user.gender)}
          {renderDetail('Date of Birth', user.birthDate ? new Date(user.birthDate).toLocaleDateString() : 'N/A')}
          {renderDetail('City', user.cityOfResidence || 'N/A')}
          {renderDetail('Region', user.region)}
          {renderDetail('Marital Status', user.maritalStatus)}
          {renderDetail('Practicing Since', user.startedPracticing ? new Date(user.startedPracticing).toLocaleDateString() : 'N/A')}
          {renderDetail('Summary', user.summary || 'No summary provided - user should be encouraged to complete profile')}
          {renderDetail('Work/Education', user.workEducation)}
          {renderDetail('Last Active', user.stats?.lastActive ? (() => {
            const lastActiveDate = new Date(user.stats.lastActive);
            const now = new Date();
            const diffTime = Math.abs(now.getTime() - lastActiveDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) {
              return '1 day ago';
            } else if (diffDays < 30) {
              return `${diffDays} days ago`;
            } else {
              return lastActiveDate.toLocaleDateString();
            }
          })() : 'Never')}
        </dl>
      </CardContent>
    </Card>
  );
};

export default UserProfile;
