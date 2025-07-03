
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Crown, Video, Clock } from 'lucide-react';
import { User } from '@/types/user';

interface VideoCallRestrictionProps {
  user: User;
  onStartCall?: () => void;
}

const VideoCallRestriction = ({ user, onStartCall }: VideoCallRestrictionProps) => {
  const [callInProgress, setCallInProgress] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(5 * 60); // 5 minutes in seconds
  
  const isPremium = user.plan === 'premium';
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleStartCall = () => {
    if (!isPremium) {
      return;
    }
    
    setCallInProgress(true);
    if (onStartCall) {
      onStartCall();
    }
    
    // Start countdown timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setCallInProgress(false);
          return 5 * 60; // Reset to 5 minutes
        }
        return prev - 1;
      });
    }, 1000);
  };
  
  if (!isPremium) {
    return (
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <Crown className="h-5 w-5" />
            Premium Feature
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-amber-700">
              Video calling is available for premium members only.
            </p>
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <Video className="h-4 w-4" />
              <span>5-minute video calls</span>
            </div>
            <Button 
              variant="outline" 
              disabled 
              className="w-full border-amber-300 text-amber-700"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Premium Required
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-green-800">
          <Video className="h-5 w-5" />
          Video Call
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            Premium
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {callInProgress ? (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-lg font-semibold text-green-700 mb-2">
                <Clock className="h-5 w-5" />
                {formatTime(timeRemaining)}
              </div>
              <p className="text-sm text-green-600 mb-3">
                Call in progress...
              </p>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={() => {
                  setCallInProgress(false);
                  setTimeRemaining(5 * 60);
                }}
              >
                End Call
              </Button>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2 text-sm text-green-600 mb-3">
                <Clock className="h-4 w-4" />
                <span>5-minute limit per call</span>
              </div>
              <Button 
                onClick={handleStartCall}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Video className="h-4 w-4 mr-2" />
                Start Video Call
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoCallRestriction;
