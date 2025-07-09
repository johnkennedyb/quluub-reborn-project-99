
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface UserProfileCardProps {
  user: {
    _id: string;
    fullName: string;
    username: string;
    plan: string;
    status: string;
    age?: number;
    country: string;
    joinedAgo?: number;
    lastSeenAgo?: number;
  };
  onEdit: (user: any) => void;
  onDelete: (userId: string) => void;
  onViewProfile: (userId: string) => void;
}

const UserProfileCard = ({ user, onEdit, onDelete, onViewProfile }: UserProfileCardProps) => {
  const getPlanBadgeVariant = (plan: string) => {
    switch (plan) {
      case 'premium':
      case 'pro':
        return 'default';
      case 'freemium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold">{user.fullName}</h3>
            <p className="text-sm text-gray-600">@{user.username}</p>
          </div>
          <div className="flex gap-2">
            <Badge variant={getPlanBadgeVariant(user.plan)}>{user.plan}</Badge>
            <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>{user.status}</Badge>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-2 text-sm mb-3">
          <div><strong>Age:</strong> {user.age || 'N/A'}</div>
          <div><strong>Country:</strong> {user.country}</div>
          <div><strong>Joined:</strong> {user.joinedAgo ? `${user.joinedAgo} days ago` : 'N/A'}</div>
          <div><strong>Last Seen:</strong> {user.lastSeenAgo ? `${user.lastSeenAgo} days ago` : 'N/A'}</div>
        </div>

        <div className="flex gap-2">
          <Button size="sm" onClick={() => onViewProfile(user._id)}>View</Button>
          <Button size="sm" variant="outline" onClick={() => onEdit(user)}>Edit</Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(user._id)}>Delete</Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default UserProfileCard;
