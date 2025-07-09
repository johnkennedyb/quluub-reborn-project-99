import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const UserProfileCard = ({ user }) => {
  if (!user) return null;

  const getInitials = (fname, lname) => {
    return `${fname?.charAt(0) || ''}${lname?.charAt(0) || ''}`.toUpperCase();
  };

  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={user.profilePicture} alt={`${user.fname} ${user.lname}`} />
            <AvatarFallback>{getInitials(user.fname, user.lname)}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle className="text-2xl">{`${user.fname} ${user.lname}`}</CardTitle>
            <p className="text-sm text-muted-foreground">@{user.username}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold">Status</h3>
            <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>{user.status}</Badge>
          </div>
          <div>
            <h3 className="font-semibold">Plan</h3>
            <Badge variant={user.plan === 'premium' ? 'premium' : 'secondary'}>{user.plan}</Badge>
          </div>
          <div>
            <h3 className="font-semibold">Email</h3>
            <p>{user.email}</p>
          </div>
          <div>
            <h3 className="font-semibold">Gender</h3>
            <p>{user.gender}</p>
          </div>
          <div>
            <h3 className="font-semibold">Location</h3>
            <p>{`${user.city || 'N/A'}, ${user.country || 'N/A'}`}</p>
          </div>
          <div>
            <h3 className="font-semibold">Joined</h3>
            <p>{new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
          <div>
            <h3 className="font-semibold">Last Seen</h3>
            <p>{new Date(user.lastSeen).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfileCard;
