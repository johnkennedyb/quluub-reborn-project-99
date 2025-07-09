
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { createZoomMeeting, joinZoomMeeting, getZoomMeetingUsage } from '@/lib/zoom';
import { useAuth } from '@/contexts/AuthContext';

interface VideoCallProps {
  participantId: string;
  participantName: string;
  onCallEnd?: () => void;
}

const VideoCall = ({ participantId, participantName, onCallEnd }: VideoCallProps) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [usage, setUsage] = useState({ totalMinutes: 0, costPerMinute: 0, totalCost: 0 });
  const [currentMeeting, setCurrentMeeting] = useState<any>(null);
  const intervalRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    fetchUsage();
    
    // Load Zoom Web SDK
    const script = document.createElement('script');
    script.src = 'https://source.zoom.us/2.9.5/lib/vendor/react.min.js';
    document.head.appendChild(script);
    
    const script2 = document.createElement('script');
    script2.src = 'https://source.zoom.us/zoom-meeting-2.9.5.min.js';
    document.head.appendChild(script2);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const fetchUsage = async () => {
    try {
      const usageData = await getZoomMeetingUsage();
      setUsage(usageData);
    } catch (error) {
      console.error('Error fetching usage:', error);
    }
  };

  const startCall = async () => {
    if (!user || user.plan === 'freemium') {
      toast({
        title: 'Premium Required',
        description: 'Video calling is only available for premium users.',
        variant: 'destructive',
      });
      return;
    }

    setIsConnecting(true);
    
    try {
      const meeting = await createZoomMeeting({
        topic: `Call with ${participantName}`,
        duration: 60, // 1 hour max
        hostEmail: user.email,
        participantEmails: [user.email], // Add participant email if available
        password: Math.random().toString(36).substring(2, 8),
      });

      setCurrentMeeting(meeting);
      
      // Join the meeting
      joinZoomMeeting(meeting.id, meeting.password);
      
      setIsCallActive(true);
      setIsConnecting(false);
      
      // Start duration timer
      intervalRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);

      toast({
        title: 'Call Started',
        description: `Video call with ${participantName} has started.`,
      });
    } catch (error) {
      console.error('Failed to start call:', error);
      setIsConnecting(false);
      toast({
        title: 'Call Failed',
        description: 'Failed to start the video call. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const endCall = () => {
    setIsCallActive(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Update usage
    fetchUsage();
    
    toast({
      title: 'Call Ended',
      description: `Call duration: ${Math.floor(callDuration / 60)}:${String(callDuration % 60).padStart(2, '0')}`,
    });
    
    setCallDuration(0);
    setCurrentMeeting(null);
    
    if (onCallEnd) {
      onCallEnd();
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // In a real implementation, you would control the Zoom meeting audio
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    // In a real implementation, you would control the Zoom meeting video
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  if (!user || user.plan === 'freemium') {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Video Calling
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Badge variant="outline" className="mb-2">Premium Feature</Badge>
            <p className="text-sm text-muted-foreground">
              Video calling is only available for premium users. Upgrade your plan to start video calls.
            </p>
          </div>
          <Button className="w-full" variant="outline" disabled>
            Upgrade to Premium
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Video Call with {participantName}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Usage Information */}
        <div className="bg-muted p-3 rounded-lg">
          <div className="flex justify-between text-sm">
            <span>Total Usage:</span>
            <span>{usage.totalMinutes} minutes</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Rate:</span>
            <span>{formatCurrency(usage.costPerMinute)}/minute</span>
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span>Total Cost:</span>
            <span>{formatCurrency(usage.totalCost)}</span>
          </div>
        </div>

        {/* Call Controls */}
        {!isCallActive ? (
          <Button
            onClick={startCall}
            disabled={isConnecting}
            className="w-full"
            size="lg"
          >
            {isConnecting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Connecting...
              </>
            ) : (
              <>
                <Phone className="h-4 w-4 mr-2" />
                Start Video Call
              </>
            )}
          </Button>
        ) : (
          <div className="space-y-4">
            <div className="text-center">
              <Badge variant="default" className="mb-2">
                Call Active - {formatDuration(callDuration)}
              </Badge>
              <p className="text-sm text-muted-foreground">
                Current cost: {formatCurrency((callDuration / 60) * usage.costPerMinute)}
              </p>
            </div>

            <div className="flex justify-center gap-2">
              <Button
                variant={isMuted ? "destructive" : "outline"}
                size="icon"
                onClick={toggleMute}
              >
                {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              
              <Button
                variant={isVideoOff ? "destructive" : "outline"}
                size="icon"
                onClick={toggleVideo}
              >
                {isVideoOff ? <VideoOff className="h-4 w-4" /> : <Video className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="destructive"
                size="icon"
                onClick={endCall}
              >
                <PhoneOff className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Zoom Meeting Container */}
        {isCallActive && (
          <div id="zmmtg-root" className="w-full h-64 bg-black rounded-lg">
            {/* Zoom meeting will be rendered here */}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoCall;
