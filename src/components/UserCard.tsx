import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import { MessageCircle, User as UserIcon, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { userService } from '@/lib/api-client';

import { User } from '@/types/user';

// Helper function for capitalizing first letter
const capitalizeFirstLetter = (str: string): string => {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

interface UserCardProps {
  user: User;
  isSearch?: boolean;
  showChatButton?: boolean;
  conversationId?: string;
  showViewProfileButton?: boolean;
  showFavoriteButton?: boolean;
  isFavorited?: boolean;
  onFavoriteToggle?: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({ 
  user, 
  isSearch = false, 
  showChatButton = false, 
  conversationId, 
  showViewProfileButton = false,
  showFavoriteButton = false,
  isFavorited = false,
  onFavoriteToggle
}) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isUpdatingFavorite, setIsUpdatingFavorite] = useState(false);

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user._id || isUpdatingFavorite) return;

    setIsUpdatingFavorite(true);
    try {
      if (isFavorited) {
        await userService.removeFromFavorites(user._id);
        toast({
          title: "Removed from Favorites",
          description: "User has been removed from your favorites.",
        });
      } else {
        await userService.addToFavorites(user._id);
        toast({
          title: "Added to Favorites",
          description: "User has been added to your favorites.",
        });
      }
      onFavoriteToggle?.(user._id);
    } catch (error) {
      console.error("Failed to update favorites:", error);
      toast({
        title: "Error",
        description: "Failed to update favorites.",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingFavorite(false);
    }
  };

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (conversationId) {
      navigate(`/messages?conversation=${conversationId}`);
    } else {
      // If no conversationId, try to navigate with user ID
      navigate(`/messages?user=${user._id || user.username}`);
    }
  };

  const handleViewProfileClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/profile/${user._id || user.username}`);
  };

  const summary = user.summary || '';
  const maxLength = 200;

  const daysAgo = (timestamp?: Date | string) => {
    if (!timestamp) return '';
    const now = moment();
    const date = moment(timestamp);
    const diffInDays = now.diff(date, 'days');

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    return `${diffInDays} days ago`;
  };

  const isOnline = (timestamp?: Date) => {
    if (!timestamp) return false;
    const inputTime = new Date(timestamp).getTime();
    const currentTime = Date.now();
    const differenceInMinutes = (currentTime - inputTime) / (1000 * 60);
    return differenceInMinutes <= 30;
  };

  // Simplified flag display - removed country flags dependency for now
  const getFlag = (nationality?: string) => {
    return null; // Temporarily disabled until country flags are properly set up
  };

  const getAge = (dob?: Date) => {
    if (!dob) return '';
    return `${moment().diff(moment(dob), 'years')} year old`;
  };

  return (
    <Card
      className="w-full cursor-pointer hover:shadow-lg transition-shadow duration-200"
      onClick={() => navigate(`/profile/${user.username}`)}
    >
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <p className="font-bold text-slate-800 capitalize">{user.username}</p>
            {user.kunya && <p className="text-sm text-muted-foreground ml-1">({user.kunya})</p>}
            {isOnline(user.lastSeen) && (
              <Badge variant="outline" className="ml-2 border-green-500 text-green-500">Online</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* Relationship status badges - temporarily disabled until User type is updated */}
            {/* {user.isMatched && <Badge variant="default">Matched</Badge>} */}
            {/* {user.isSent && <Badge variant="secondary">Request Sent</Badge>} */}
            {/* {user.isReceived && <Badge variant="secondary">Request Received</Badge>} */}
            {/* {user.hasBeenRejectedByMe && <Badge variant="destructive">You Rejected</Badge>} */}
            {/* {user.hasRejectedMe && <Badge variant="destructive">Rejected</Badge>} */}
          </div>
        </div>

        <div className="border-t my-3"></div>

        <p className="text-sm text-muted-foreground mb-3">
          {summary.length > maxLength ? `${summary.substring(0, maxLength)}...` : summary || '✨ This user hasn\'t shared their story yet. Send them a message to learn more!'}
        </p>

        <div className="flex items-center text-xs text-muted-foreground gap-2 flex-wrap">
          <span>{getAge(user.dob)}</span>
          {user.nationality && <span>{capitalizeFirstLetter(user.nationality)}</span>}
          {getFlag(user.nationality)}
          {user.country && <span>| Lives in: {capitalizeFirstLetter(user.country)}</span>}
        </div>
        
        {/* Ethnicity display with yellow background */}
        {user.ethnicity && Array.isArray(user.ethnicity) && user.ethnicity.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {user.ethnicity.map((eth: string, index: number) => (
              eth && eth.trim() ? (
                <Badge 
                  key={index} 
                  className="text-xs bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200"
                  variant="outline"
                >
                  {capitalizeFirstLetter(eth.trim())}
                </Badge>
              ) : null
            ))}
          </div>
        )}

        <div className="text-xs text-muted-foreground mt-2 italic">
            Last seen: {daysAgo(user.lastSeen || user.createdAt)}
        </div>
        
        {(showChatButton || showViewProfileButton || showFavoriteButton) && (
          <div className="mt-4 pt-3 border-t">
            <div className={`flex gap-2 ${(showChatButton && showViewProfileButton) || (showChatButton && showFavoriteButton) || (showViewProfileButton && showFavoriteButton) ? 'flex-row' : 'flex-col'}`}>
              {showChatButton && (
                <Button 
                  onClick={handleChatClick}
                  className={`flex items-center gap-2 bg-blue-600 hover:bg-blue-700 ${(showViewProfileButton || showFavoriteButton) ? 'flex-1' : 'w-full'}`}
                  size="sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat
                </Button>
              )}
              {showViewProfileButton && (
                <Button 
                  onClick={handleViewProfileClick}
                  variant="outline"
                  className={`flex items-center gap-2 ${(showChatButton || showFavoriteButton) ? 'flex-1' : 'w-full'}`}
                  size="sm"
                >
                  <UserIcon className="w-4 h-4" />
                  View Profile
                </Button>
              )}
              {showFavoriteButton && (
                <Button 
                  onClick={handleFavoriteClick}
                  variant={isFavorited ? "default" : "outline"}
                  className={`flex items-center gap-2 ${isFavorited ? 'bg-red-500 hover:bg-red-600 text-white' : 'border-red-500 text-red-500 hover:bg-red-50'} ${(showChatButton || showViewProfileButton) ? 'flex-1' : 'w-full'}`}
                  size="sm"
                  disabled={isUpdatingFavorite}
                >
                  <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                  {isFavorited ? 'Favorited' : 'Favorite'}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserCard;
