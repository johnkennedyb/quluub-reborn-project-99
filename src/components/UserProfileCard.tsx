
import { User } from "@/types/user";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProfileImage from "./ProfileImage";
import { formatDistanceToNow } from "date-fns";

interface UserProfileCardProps {
  user: User;
  onView?: (userId: string) => void;
  onLike?: (userId: string) => void;
  onMessage?: (userId: string) => void;
}

export const UserProfileCard = ({ user, onView, onLike, onMessage }: UserProfileCardProps) => {
  // Parse JSON strings from user data
  const parseJsonString = (jsonString: string | null | undefined) => {
    if (!jsonString) return null;
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      return jsonString;
    }
  };

  // Calculate age from DOB
  const calculateAge = (dob: Date | string | undefined) => {
    if (!dob) return null;
    
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDifference = today.getMonth() - birthDate.getMonth();
    
    if (monthDifference < 0 || (monthDifference === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const traits = user.traits ? parseJsonString(user.traits) : [];
  const age = calculateAge(user.dob);
  const lastSeen = user.lastSeen ? formatDistanceToNow(new Date(user.lastSeen), { addSuffix: true }) : 'Unknown';

  return (
    <Card className="overflow-hidden">
      <div className="relative h-48">
        <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-primary/20 to-primary/40 flex items-center justify-center">
          <ProfileImage
            src={user.profile_pic || ""}
            alt={`${user.fname || ''} ${user.lname || ''}`}
            fallback={(user.fname?.charAt(0) || "") + (user.lname?.charAt(0) || "")}
            size="lg"
            className="h-20 w-20 text-2xl"
          />
        </div>
        
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-white">
          <h3 className="text-lg font-bold">
            {user.fname} {user.lname}{age ? `, ${age}` : ''}
          </h3>
          <p className="text-xs">{user.country || "Location not specified"}</p>
        </div>
      </div>

      <CardHeader className="p-4 pb-0">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">{user.kunya || user.username}</span>
          <Badge variant={user.status === "active" ? "default" : "secondary"}>
            {user.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">Last active: {lastSeen}</p>
      </CardHeader>
      
      <CardContent className="p-4">
        {user.summary && (
          <p className="text-sm line-clamp-2 mb-2">{user.summary}</p>
        )}
        
        {Array.isArray(traits) && traits.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {traits.slice(0, 3).map((trait, i) => (
              <Badge key={i} variant="outline" className="text-xs">
                {trait}
              </Badge>
            ))}
            {traits.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{traits.length - 3}
              </Badge>
            )}
          </div>
        )}
        
        <div className="flex justify-between mt-4 pt-2 border-t border-border">
          {onView && (
            <button 
              onClick={() => onView(user._id || user.id || '')}
              className="text-xs font-medium text-primary hover:underline"
            >
              View Profile
            </button>
          )}
          {onLike && (
            <button 
              onClick={() => onLike(user._id || user.id || '')}
              className="text-xs font-medium text-primary hover:underline"
            >
              Like
            </button>
          )}
          {onMessage && (
            <button 
              onClick={() => onMessage(user._id || user.id || '')}
              className="text-xs font-medium text-primary hover:underline"
            >
              Message
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
