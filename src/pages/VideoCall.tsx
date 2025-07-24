import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Video, MessageCircle, Crown, Clock, Shield } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import WherebyCallButton from "@/components/VideoCall/WherebyCallButton";
import WherebyEmbeddedCall from "@/components/VideoCall/WherebyEmbeddedCall";

const VideoCall = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { search } = useLocation();
  const { user, isAuthenticated } = useAuth();
  const params = new URLSearchParams(search);
  const recipientId = params.get("with");
  const meetingUrl = params.get("meeting");

  const [currentMeetingUrl, setCurrentMeetingUrl] = useState<string | null>(meetingUrl);
  const [recipientInfo, setRecipientInfo] = useState<any>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  
  const CALL_TIME_LIMIT = 5 * 60; // 5 minutes in seconds
  const isPremiumUser = user?.plan === 'premium' || user?.plan === 'gold';

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to use video calling",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
  }, [isAuthenticated, navigate, toast]);

  // Redirect if no recipient ID
  useEffect(() => {
    if (!recipientId) {
      toast({
        title: "Invalid Call",
        description: "No recipient specified for video call",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }
  }, [recipientId, navigate, toast]);

  // Check premium user access
  useEffect(() => {
    if (!isPremiumUser) {
      toast({
        title: "Premium Feature",
        description: "Video calling is available for premium users only",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }
  }, [isPremiumUser, navigate, toast]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isCallActive && callStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const duration = Math.floor((now.getTime() - callStartTime.getTime()) / 1000);
        setCallDuration(duration);
        
        // End call when time limit is reached
        if (duration >= CALL_TIME_LIMIT) {
          toast({
            title: "Call Time Limit Reached",
            description: "Maximum call duration of 5 minutes has been reached",
            variant: "destructive",
          });
          handleCallEnd();
        }
      }, 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive, callStartTime]);

  // Fetch recipient info
  useEffect(() => {
    const fetchRecipientInfo = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users/${recipientId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          setRecipientInfo(data);
        }
      } catch (error) {
        console.error('Error fetching recipient info:', error);
      }
    };

    if (recipientId) {
      fetchRecipientInfo();
    }
  }, [recipientId]);

  const handleCallInitiated = (meetingUrl: string) => {
    setCurrentMeetingUrl(meetingUrl);
    setCallStartTime(new Date());
    setIsCallActive(true);
    setCallDuration(0);
    
    // Notify Wali about video call start
    notifyWaliAboutVideoCall('started');
    
    toast({
      title: "Call Initiated",
      description: "Professional video call started with Whereby",
    });
  };

  const handleCallEnd = async () => {
    setIsCallActive(false);
    setCurrentMeetingUrl(null);
    
    // Notify Wali about video call end
    await notifyWaliAboutVideoCall('ended');
    
    navigate("/dashboard");
  };

  const notifyWaliAboutVideoCall = async (status: 'started' | 'ended') => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/wali/video-call-notification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipientId,
          recipientInfo,
          status,
          duration: callDuration,
          timestamp: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        console.error('Failed to notify Wali about video call');
      }
    } catch (error) {
      console.error('Error notifying Wali about video call:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getRemainingTime = () => {
    return CALL_TIME_LIMIT - callDuration;
  };

  const handleChatRedirect = () => {
    navigate(`/messages?chat=${recipientId}`);
  };

  // If we have a meeting URL, show the embedded call
  if (currentMeetingUrl && recipientInfo) {
    return (
      <WherebyEmbeddedCall 
        recipientId={recipientId!}
        recipientName={`${recipientInfo.fname} ${recipientInfo.lname}`}
        recipientAvatar={recipientInfo.profilePicture}
        isOpen={true}
        onClose={() => {
          setCurrentMeetingUrl(null);
          navigate("/dashboard");
        }}
        onCallEnded={handleCallEnd}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          
          <h1 className="text-2xl font-bold text-gray-900">
            Professional Video Call
          </h1>
          
          <div className="w-24" /> {/* Spacer for centering */}
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Video className="text-blue-600" size={40} />
            </div>
            <div className="flex items-center justify-center mb-4">
              <h2 className="text-3xl font-bold text-gray-900 mr-3">
                Start Video Call
              </h2>
              <Badge className="bg-yellow-100 text-yellow-800 flex items-center">
                <Crown className="h-3 w-3 mr-1" />
                Premium
              </Badge>
            </div>
            <p className="text-gray-600 max-w-md mx-auto">
              Initiate a professional, secure video call with Islamic compliance monitoring
            </p>
            
            {/* Call Timer Display */}
            {isCallActive && (
              <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      Call Duration: {formatTime(callDuration)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-900">
                      Time Remaining: {formatTime(getRemainingTime())}
                    </span>
                  </div>
                </div>
                
                {/* Warning when less than 1 minute remaining */}
                {getRemainingTime() <= 60 && getRemainingTime() > 0 && (
                  <Alert className="mt-3 border-orange-200 bg-orange-50">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800">
                      Less than 1 minute remaining in your call
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </div>

          {/* Recipient Info */}
          {recipientInfo && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Call Recipient</h3>
              <div className="flex items-center gap-4">
                {recipientInfo.profilePicture ? (
                  <img 
                    src={recipientInfo.profilePicture} 
                    alt={`${recipientInfo.fname} ${recipientInfo.lname}`}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-300 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 font-semibold text-lg">
                      {recipientInfo.fname?.[0]}{recipientInfo.lname?.[0]}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-semibold text-gray-900">
                    {recipientInfo.fname} {recipientInfo.lname}
                  </p>
                  <p className="text-gray-600">@{recipientInfo.username}</p>
                </div>
              </div>
            </div>
          )}

          {/* Call Actions */}
          <div className="space-y-4">
            {recipientId && recipientInfo && (
              <WherebyCallButton
                recipientId={recipientId}
                recipientName={`${recipientInfo.fname} ${recipientInfo.lname}`}
                recipientAvatar={recipientInfo.profilePicture}
                onCallStarted={() => handleCallInitiated('meeting-url-placeholder')}
                variant="primary"
                size="lg"
              />
            )}
            
            {/* Chat Option */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={handleChatRedirect}
                className="flex items-center gap-2"
              >
                <MessageCircle size={20} />
                Continue in Chat Instead
              </Button>
            </div>
          </div>

          {/* Features */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-green-600">🔒</span>
              </div>
              <p className="font-medium">End-to-End Encrypted</p>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-blue-600">📹</span>
              </div>
              <p className="font-medium">Auto Recording</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-purple-600">👁️</span>
              </div>
              <p className="font-medium">Wali Supervision</p>
            </div>
          </div>

          {/* Compliance Notice */}
          <div className="mt-8 bg-amber-50 border border-amber-200 rounded-lg p-4">
            <p className="text-sm text-amber-800 text-center">
              <strong>📹 Islamic Compliance:</strong> This call will be automatically recorded 
              and sent to your Wali for proper supervision and oversight.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCall;
