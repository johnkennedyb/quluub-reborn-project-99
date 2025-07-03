import { useEffect, useRef, useState, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Clock, Users, PhoneOff } from "lucide-react";
import { loadJitsiScript, createJitsiMeeting } from "@/lib/jitsi";
import { AuthContext } from "@/contexts/AuthContext";
import apiClient from "@/lib/api-client";

const VideoCall = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { search } = useLocation();
  const { user, isAuthenticated } = useContext(AuthContext);
  const params = new URLSearchParams(search);
  const roomId = params.get("room");

  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);
  const initializingRef = useRef(false);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [callState, setCallState] = useState<
    "loading" | "connecting" | "connected" | "error" | "ended"
  >("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [participantCount, setParticipantCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds

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

  // Redirect if no room ID
  useEffect(() => {
    if (!roomId) {
      toast({
        title: "Invalid Room",
        description: "No room ID provided",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }
  }, [roomId, navigate, toast]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callState === "connected") {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleCallTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [callState]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleCallTimeout = async () => {
    toast({
      title: "Call Time Limit Reached",
      description: "Your 5-minute call has ended",
      variant: "destructive",
    });
    
    // Update call status to completed
    try {
      await apiClient.put('/video-call/status', {
        roomId,
        status: 'completed'
      });
    } catch (error) {
      console.error('Error updating call status:', error);
    }
    
    handleEndCall();
  };

  const cleanupJitsiCall = () => {
    if (jitsiApiRef.current) {
      try {
        jitsiApiRef.current.dispose();
      } catch (error) {
        console.error('Error disposing Jitsi call:', error);
      }
      jitsiApiRef.current = null;
    }
    if (callTimerRef.current) {
      clearTimeout(callTimerRef.current);
      callTimerRef.current = null;
    }
    initializingRef.current = false;
  };

  const initializeJitsiCall = async () => {
    if (!roomId || !jitsiContainerRef.current || initializingRef.current || jitsiApiRef.current || !user) {
      return;
    }

    try {
      initializingRef.current = true;
      setCallState("connecting");
      
      // Check if call exists and get call info
      try {
        const callResponse = await apiClient.get(`/video-call/room/${roomId}`);
        console.log('Call info:', callResponse.data);
      } catch (error: any) {
        if (error.response?.status === 404) {
          console.log('Call not found, this might be a direct room join');
        } else {
          console.error('Error fetching call info:', error);
        }
      }
      
      // Load Jitsi script
      await loadJitsiScript();
      
      const displayName = `${user.fname} ${user.lname}`;
      
      const jitsiApi = createJitsiMeeting({
        roomName: roomId,
        parentNode: jitsiContainerRef.current,
        userInfo: {
          displayName: displayName,
        },
        configOverwrite: {
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          enableWelcomePage: false,
          prejoinPageEnabled: false,
          requireDisplayName: false,
          disableProfile: true,
          hideDisplayName: false,
          enableUserRolesBasedOnToken: false,
        },
      });

      jitsiApiRef.current = jitsiApi;

      // Set up event listeners
      jitsiApi.addEventListener('videoConferenceJoined', async () => {
        console.log('Joined Jitsi call as:', displayName);
        setCallState("connected");
        setParticipantCount(1);
        
        // Update call status to ongoing
        try {
          await apiClient.put('/video-call/status', {
            roomId,
            status: 'ongoing'
          });
        } catch (error) {
          console.error('Error updating call status to ongoing:', error);
        }
        
        toast({
          title: "Call Connected",
          description: "You have 5 minutes for this call",
        });
        initializingRef.current = false;
      });

      jitsiApi.addEventListener('videoConferenceLeft', async () => {
        console.log('Left Jitsi call');
        
        // Update call status
        try {
          await apiClient.put('/video-call/status', {
            roomId,
            status: 'completed'
          });
        } catch (error) {
          console.error('Error updating call status:', error);
        }
        
        handleEndCall();
      });

      jitsiApi.addEventListener('participantJoined', (participant: any) => {
        console.log('Participant joined:', participant);
        setParticipantCount(prev => prev + 1);
      });

      jitsiApi.addEventListener('participantLeft', (participant: any) => {
        console.log('Participant left:', participant);
        setParticipantCount(prev => Math.max(0, prev - 1));
      });

      jitsiApi.addEventListener('readyToClose', () => {
        console.log('Jitsi ready to close');
        handleEndCall();
      });

    } catch (error: any) {
      console.error('Error initializing Jitsi call:', error);
      setCallState("error");
      setErrorMessage(error.message || "Failed to initialize video call");
      toast({
        title: "Initialization Error",
        description: "Failed to initialize the video call. No Jitsi registration required.",
        variant: "destructive",
      });
      initializingRef.current = false;
    }
  };

  const handleEndCall = () => {
    setCallState("ended");
    cleanupJitsiCall();
    navigate("/dashboard");
  };

  useEffect(() => {
    if (isAuthenticated && user && roomId) {
      initializeJitsiCall();
    }

    return () => {
      cleanupJitsiCall();
    };
  }, [roomId, isAuthenticated, user]);

  // Don't render if not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  const getStatusMessage = () => {
    switch (callState) {
      case "loading": return "Loading video call...";
      case "connecting": return "Connecting to call... (No Jitsi account needed)";
      case "connected": return "Connected";
      case "error": return errorMessage || "An error occurred";
      case "ended": return "Call ended";
      default: return "Initializing...";
    }
  };

  const getStatusColor = () => {
    switch (callState) {
      case "connected": return "text-green-400";
      case "error": return "text-red-400";
      case "ended": return "text-gray-400";
      case "loading":
      case "connecting": return "text-yellow-400";
      default: return "text-white";
    }
  };

  const getTimeRemainingColor = () => {
    if (timeRemaining <= 60) return "text-red-400";
    if (timeRemaining <= 120) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex flex-col">
      {/* Top bar */}
      <div className="p-4 flex items-center justify-between bg-gray-800 z-10">
        <div className="flex items-center">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="ml-4 text-xl font-medium">Video Call</h2>
          {callState === "connected" && (
            <div className="ml-4 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span className="text-sm">{formatDuration(callDuration)}</span>
              </div>
              <div className={`flex items-center gap-2 ${getTimeRemainingColor()}`}>
                <Clock className="h-4 w-4" />
                <span className="text-sm font-bold">
                  {formatDuration(timeRemaining)} left
                </span>
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span className="text-sm">{participantCount}</span>
          </div>
          <span className={`text-sm ${getStatusColor()}`}>
            {getStatusMessage()}
          </span>
        </div>
      </div>

      {/* Jitsi container */}
      <div className="flex-1 relative">
        <div 
          ref={jitsiContainerRef} 
          className="w-full h-full"
          style={{ minHeight: '500px' }}
        />

        {/* Loading overlay */}
        {(callState === "loading" || callState === "connecting") && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
              <p className={`text-lg ${getStatusColor()}`}>
                {getStatusMessage()}
              </p>
              <p className="text-sm text-gray-300 mt-2">
                Authenticated users only • 5 minute limit • Rejoin anytime
              </p>
            </div>
          </div>
        )}

        {/* Error overlay */}
        {callState === "error" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 z-20">
            <div className="text-center">
              <p className="text-lg text-red-400 mb-4">
                {errorMessage || "An error occurred"}
              </p>
              <Button onClick={() => navigate("/dashboard")} variant="outline">
                Go Back to Dashboard
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-4 bg-gray-800 flex items-center justify-center">
        <Button
          variant="destructive"
          size="icon"
          onClick={handleEndCall}
          className="h-12 w-12 rounded-full"
        >
          <PhoneOff className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default VideoCall;
