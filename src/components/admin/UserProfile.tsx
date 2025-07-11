import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

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
        const response = await fetch(`/api/admin/users/${userId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
          },
        });
        const data = await response.json();
        if (response.ok) {
          setUser(data);
        } else {
          throw new Error(data.message || 'Failed to fetch user data');
        }
      } catch (error) {
        toast({ title: 'Error', description: 'Could not fetch user profile.', variant: 'destructive' });
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
        <dl className="divide-y divide-gray-200">
          {renderDetail('Email', user.email)}
          {renderDetail('Gender', user.gender)}
          {renderDetail('Date of Birth', user.dob ? new Date(user.dob).toLocaleDateString() : 'N/A')}
          {renderDetail('Country', user.country)}
          {renderDetail('Region', user.region)}
          {renderDetail('Marital Status', user.maritalStatus)}
          {renderDetail('Practicing Since', user.startedPracticing ? new Date(user.startedPracticing).toLocaleDateString() : 'N/A')}
          {renderDetail('Summary', user.summary)}
          {renderDetail('Work/Education', user.workEducation)}
          {renderDetail('Last Seen', user.lastSeen ? new Date(user.lastSeen).toLocaleString() : 'N/A')}
        </dl>
      </CardContent>
    </Card>
  );
};

export default UserProfile;
