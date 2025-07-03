
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, X, Star, User, MessageSquare } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

interface MatchCardProps {
  name: string;
  username?: string;
  age: number;
  location: string;
  photoUrl?: string;
  matchPercentage?: number;
  tags?: string[];
  userId: string;
  summary?: string;
  matchDate?: string;
  bio?: string;
  onLike?: () => void;
  onPass?: () => void;
  onMessage?: () => void;
  onFavorite?: () => void;
  onSendRequest?: () => void;
  onChat?: () => void;
  isFavorited?: boolean;
  isMatched?: boolean;
}

const MatchCard = ({ 
  name, 
  username,
  age, 
  location, 
  photoUrl, 
  matchPercentage, 
  tags = [], 
  userId,
  summary,
  matchDate,
  bio,
  onLike, 
  onPass, 
  onMessage,
  onFavorite,
  onSendRequest,
  onChat,
  isFavorited = false,
  isMatched = false
}: MatchCardProps) => {
  const [isHidden, setIsHidden] = useState(false);
  const navigate = useNavigate();

  const handleFavorite = () => {
    onFavorite?.();
  };

  const handleHide = () => {
    setIsHidden(true);
    onPass?.();
  };

  const handleSendRequest = () => {
    onSendRequest?.();
  };

  const handleChat = () => {
    if (isMatched) {
      navigate(`/messages?matchId=${userId}`);
    } else {
      onChat?.();
    }
  };

  if (isHidden) return null;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
        {/* Display summary text instead of profile picture */}
        <div className="p-4 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mb-2 mx-auto">
            <User className="h-8 w-8 text-white" />
          </div>
          {(summary || bio) && (
            <p className="text-white text-sm line-clamp-3 max-w-xs">
              {summary || bio}
            </p>
          )}
        </div>
        
        {matchPercentage && (
          <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded-full">
            <span className="text-xs font-medium text-primary">{matchPercentage}% match</span>
          </div>
        )}

        {matchDate && (
          <div className="absolute top-2 left-2 bg-white/90 px-2 py-1 rounded-full">
            <span className="text-xs font-medium text-primary">{matchDate}</span>
          </div>
        )}

        {isFavorited && (
          <div className="absolute top-2 left-2 bg-yellow-500/90 px-2 py-1 rounded-full">
            <Star className="h-3 w-3 text-white fill-current" />
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="mb-3">
          <Link to={`/profile/${userId}`} className="hover:underline">
            <h3 className="text-lg font-semibold text-primary cursor-pointer">
              {username || name}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground">{age} • {location}</p>
        </div>

        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        <div className="flex gap-2">
          {onFavorite && (
          <Button
          size="sm"
          onClick={handleFavorite}
          variant="ghost"                    // strip out green defaults
          className={`flex-1 ${
            isFavorited
              ? "!bg-yellow-500 !text-white !hover:bg-yellow-600"
              : "border border-gray-300 text-gray-700 hover:bg-gray-100"
          }`}
        >
          <Star
            className={`h-4 w-4 mr-1 ${
              isFavorited ? "!text-white fill-current" : "text-yellow-500"
            }`}
          />
          {isFavorited ? "Favorited" : "Favorite"}
        </Button>
        
        
        
          )}
          
          {onSendRequest && !isMatched && (
            <Button
              size="sm"
              onClick={handleSendRequest}
              className="flex-1"
            >
              <Heart className="h-4 w-4 mr-1" />
              Send Request
            </Button>
          )}

          {isMatched && (
            <Button
              size="sm"
              onClick={handleChat}
              className="flex-1 bg-green-500 hover:bg-green-600"
            >
              <MessageSquare className="h-4 w-4 mr-1" />
              Message
            </Button>
          )}
          
          <Button
            size="sm"
            variant="outline"
            onClick={handleHide}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MatchCard;
