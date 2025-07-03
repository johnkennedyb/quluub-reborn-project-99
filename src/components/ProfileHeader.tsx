
import { Button } from "@/components/ui/button";
import { Heart, MessageCircle, Share } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import ProfileImage from "@/components/ProfileImage";

interface ProfileHeaderProps {
  name: string;
  age: number;
  location: string;
  photoUrl: string;
  isOwnProfile?: boolean;
}

const ProfileHeader = ({
  name,
  age,
  location,
  photoUrl,
  isOwnProfile = false
}: ProfileHeaderProps) => {
  return (
    <Card className="border-0 shadow-none">
      <CardContent className="p-0">
        <div className="relative">
          <div className="h-40 md:h-60 w-full bg-gradient-to-b from-primary/20 to-primary/5 rounded-t-xl"></div>
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2">
            <ProfileImage 
              src={photoUrl} 
              alt={name} 
              fallback={name.substring(0, 2).toUpperCase()}
              size="xl"
              className="border-4 border-white"
            />
          </div>
        </div>
        
        <div className="mt-16 md:mt-20 text-center px-4">
          <h1 className="text-2xl font-bold">{name}, {age}</h1>
          <p className="text-muted-foreground">{location}</p>
          
          <div className="flex justify-center mt-4 space-x-2">
            {isOwnProfile ? (
              <Button variant="outline">Edit Profile</Button>
            ) : (
              <>
                <Button variant="outline" size="icon" className="rounded-full">
                  <MessageCircle className="h-5 w-5" />
                </Button>
                <Button variant="default" className="rounded-full px-6 bg-primary">
                  <Heart className="h-5 w-5 mr-2" />
                  <span>Like</span>
                </Button>
                <Button variant="outline" size="icon" className="rounded-full">
                  <Share className="h-5 w-5" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileHeader;
