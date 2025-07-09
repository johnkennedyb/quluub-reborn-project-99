
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Heart, MessageCircle, MapPin, Calendar, User, Book, Briefcase, Users } from 'lucide-react';
import { User as UserType } from '@/types/user';
import { formatDistanceToNow } from 'date-fns';

interface EnhancedProfileViewProps {
  user: UserType;
  onLike?: (userId: string) => void;
  onMessage?: (userId: string) => void;
  onVideoCall?: (userId: string) => void;
  currentUser?: UserType;
}

const EnhancedProfileView = ({ 
  user, 
  onLike, 
  onMessage, 
  onVideoCall, 
  currentUser 
}: EnhancedProfileViewProps) => {
  const [isLiked, setIsLiked] = useState(false);
  
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
  const waliDetails = user.waliDetails ? parseJsonString(user.waliDetails) : null;

  const handleLike = () => {
    if (onLike) {
      onLike(user._id || user.id || '');
      setIsLiked(!isLiked);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Image */}
            <div className="flex flex-col items-center space-y-4">
              <Avatar className="h-32 w-32">
                <AvatarImage src={user.profile_pic || ""} alt={`${user.fname} ${user.lname}`} />
                <AvatarFallback className="text-2xl">
                  {(user.fname?.charAt(0) || "") + (user.lname?.charAt(0) || "")}
                </AvatarFallback>
              </Avatar>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant={isLiked ? "default" : "outline"}
                  size="sm"
                  onClick={handleLike}
                  className="flex items-center gap-2"
                >
                  <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                  Like
                </Button>
                
                {onMessage && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onMessage(user._id || user.id || '')}
                    className="flex items-center gap-2"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Message
                  </Button>
                )}

                {onVideoCall && currentUser?.plan === 'premium' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onVideoCall(user._id || user.id || '')}
                    className="flex items-center gap-2"
                  >
                    Video Call
                  </Button>
                )}
              </div>
            </div>

            {/* Basic Info */}
            <div className="flex-1 space-y-4">
              <div>
                <h1 className="text-2xl font-bold">
                  {user.fname} {user.lname}
                  {age && <span className="text-muted-foreground">, {age}</span>}
                </h1>
                <p className="text-muted-foreground">@{user.kunya || user.username}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant={user.status === "active" ? "default" : "secondary"}>
                  {user.status}
                </Badge>
                <Badge variant="outline">{user.plan}</Badge>
                {user.gender && (
                  <Badge variant="outline" className="capitalize">{user.gender}</Badge>
                )}
                {user.maritalStatus && (
                  <Badge variant="outline">{user.maritalStatus}</Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                {user.country && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{user.region ? `${user.region}, ` : ''}{user.country}</span>
                  </div>
                )}
                
                {user.nationality && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>Nationality: {user.nationality}</span>
                  </div>
                )}

                {user.startedPracticing && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Practicing since {new Date(user.startedPracticing).getFullYear()}</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Last active: {lastSeen}</span>
                </div>
              </div>

              {user.summary && (
                <div>
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-sm leading-relaxed">{user.summary}</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.build && (
              <div>
                <span className="font-medium">Build:</span>
                <span className="ml-2 text-muted-foreground">{user.build}</span>
              </div>
            )}
            
            {user.appearance && (
              <div>
                <span className="font-medium">Appearance:</span>
                <span className="ml-2 text-muted-foreground">{user.appearance}</span>
              </div>
            )}

            {user.hijab && (
              <div>
                <span className="font-medium">Hijab:</span>
                <span className="ml-2 text-muted-foreground">{user.hijab}</span>
              </div>
            )}

            {user.beard && (
              <div>
                <span className="font-medium">Beard:</span>
                <span className="ml-2 text-muted-foreground">{user.beard}</span>
              </div>
            )}

            {user.ethnicity && Array.isArray(user.ethnicity) && user.ethnicity.length > 0 && (
              <div>
                <span className="font-medium">Ethnicity:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {user.ethnicity.map((eth, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {eth}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {user.genotype && (
              <div>
                <span className="font-medium">Genotype:</span>
                <span className="ml-2 text-muted-foreground">{user.genotype}</span>
              </div>
            )}

            {user.patternOfSalaah && (
              <div>
                <span className="font-medium">Pattern of Salaah:</span>
                <span className="ml-2 text-muted-foreground">{user.patternOfSalaah}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Professional Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Professional & Family
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {user.workEducation && (
              <div>
                <span className="font-medium">Work & Education:</span>
                <p className="text-sm text-muted-foreground mt-1">{user.workEducation}</p>
              </div>
            )}

            {user.noOfChildren && (
              <div>
                <span className="font-medium">Number of Children:</span>
                <span className="ml-2 text-muted-foreground">{user.noOfChildren}</span>
              </div>
            )}

            {/* Wali Details for Female Profiles */}
            {user.gender === 'female' && waliDetails && (
              <div>
                <span className="font-medium">Wali Contact:</span>
                <div className="mt-1">
                  {waliDetails.email && (
                    <p className="text-sm text-muted-foreground">Email: {waliDetails.email}</p>
                  )}
                  {waliDetails.phone && (
                    <p className="text-sm text-muted-foreground">Phone: {waliDetails.phone}</p>
                  )}
                  {waliDetails.relationship && (
                    <p className="text-sm text-muted-foreground">Relationship: {waliDetails.relationship}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Traits */}
      {Array.isArray(traits) && traits.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Qualities & Interests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {traits.map((trait, index) => (
                <Badge key={index} variant="outline" className="text-sm">
                  {trait}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedProfileView;
