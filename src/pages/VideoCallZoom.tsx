import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Video, MessageCircle, Crown, Clock, Shield, Phone, PhoneOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Zoom SDK types
declare global {
  interface Window {
    ZoomMtg: any;
  }
}

const VideoCallZoom = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { search } = useLocation();
  const { user, isAuthenticated } = useAuth();
  const params = new URLSearchParams(search);
  const recipientId = params.get("with");
  const meetingNumber = params.get("meeting");

  const [recipientInfo, setRecipientInfo] = useState<any>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [meetingConfig, setMeetingConfig] = useState<any>(null);
  const [isJoiningMeeting, setIsJoiningMeeting] = useState(false);
  
  const CALL_TIME_LIMIT = 5 * 60; // 5 minutes in seconds
  const isPremiumUser = user?.plan === 'premium' || user?.plan === 'gold';
  const zoomContainerRef = useRef<HTMLDivElement>(null);

  // Load Zoom SDK
  useEffect(() => {
    const loadZoomSDK = () => {
      if (window.ZoomMtg) {
        setIsSDKLoaded(true);
        return;
      }

      // Load Zoom Web SDK
      const script = document.createElement('script');
      script.src = 'https://source.zoom.us/2.18.0/lib/vendor/react.min.js';
      script.onload = () => {
        const zoomScript = document.createElement('script');
        zoomScript.src = 'https://source.zoom.us/2.18.0/lib/vendor/react-dom.min.js';
        zoomScript.onload = () => {
          const mainScript = document.createElement('script');
          mainScript.src = 'https://source.zoom.us/2.18.0/lib/vendor/redux.min.js';
          mainScript.onload = () => {
            const finalScript = document.createElement('script');
            finalScript.src = 'https://source.zoom.us/2.18.0/lib/vendor/redux-thunk.min.js';
            finalScript.onload = () => {
              const zoomMtgScript = document.createElement('script');
              zoomMtgScript.src = 'https://source.zoom.us/2.18.0/lib/vendor/lodash.min.js';
              zoomMtgScript.onload = () => {
                const finalZoomScript = document.createElement('script');
                finalZoomScript.src = 'https://source.zoom.us/2.18.0/lib/ZoomMtg.min.js';
                finalZoomScript.onload = () => {
                  if (window.ZoomMtg) {
                    window.ZoomMtg.setZoomJSLib('https://source.zoom.us/2.18.0/lib', '/av');
                    window.ZoomMtg.preLoadWasm();
                    window.ZoomMtg.prepareWebSDK();
                    setIsSDKLoaded(true);
                  }
                };
                document.head.appendChild(finalZoomScript);
              };
              document.head.appendChild(zoomMtgScript);
            };
            document.head.appendChild(finalScript);
          };
          document.head.appendChild(mainScript);
        };
        document.head.appendChild(zoomScript);
      };
      document.head.appendChild(script);

      // Load CSS
      const css = document.createElement('link');
      css.rel = 'stylesheet';
      css.href = 'https://source.zoom.us/2.18.0/css/bootstrap.css';
      document.head.appendChild(css);

      const zoomCss = document.createElement('link');
      zoomCss.rel = 'stylesheet';
      zoomCss.href = 'https://source.zoom.us/2.18.0/css/react-select.css';
      document.head.appendChild(zoomCss);
    };

    loadZoomSDK();
  }, []);

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

  const createZoomMeeting = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/zoom/create-meeting`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipientId,
          topic: `Quluub Video Call - ${user?.fname} & ${recipientInfo?.fname}`,
          duration: 5 // 5 minutes
        })
      });

      if (response.ok) {
        const meetingData = await response.json();
        setMeetingConfig(meetingData);
        return meetingData;
      } else {
        throw new Error('Failed to create Zoom meeting');
      }
    } catch (error) {
      console.error('Error creating Zoom meeting:', error);
      toast({
        title: "Meeting Creation Failed",
        description: "Unable to create video call meeting. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const joinZoomMeeting = async (meetingData: any) => {
    if (!window.ZoomMtg || !isSDKLoaded) {
      toast({
        title: "SDK Not Ready",
        description: "Zoom SDK is still loading. Please wait.",
        variant: "destructive",
      });
      return;
    }

    setIsJoiningMeeting(true);

    try {
      // Generate signature on backend
      const signatureResponse = await fetch(`${import.meta.env.VITE_API_URL}/zoom/signature`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          meetingNumber: meetingData.meetingNumber,
          role: 1 // Host role
        })
      });

      if (!signatureResponse.ok) {
        throw new Error('Failed to generate meeting signature');
      }

      const { signature } = await signatureResponse.json();

      // Initialize Zoom meeting
      window.ZoomMtg.init({
        leaveUrl: window.location.origin + '/dashboard',
        success: () => {
          window.ZoomMtg.join({
            signature: signature,
            meetingNumber: meetingData.meetingNumber,
            userName: `${user?.fname} ${user?.lname}`,
            apiKey: meetingData.apiKey,
            userEmail: user?.email,
            passWord: meetingData.password,
            success: (success: any) => {
              console.log('Joined meeting successfully', success);
              setIsCallActive(true);
              setCallStartTime(new Date());
              notifyWaliAboutVideoCall('started');
              
              toast({
                title: "Call Started",
                description: "Video call has been initiated successfully",
              });
            },
            error: (error: any) => {
              console.error('Failed to join meeting', error);
              toast({
                title: "Join Failed",
                description: "Unable to join the video call. Please try again.",
                variant: "destructive",
              });
            }
          });
        },
        error: (error: any) => {
          console.error('Failed to initialize Zoom', error);
          toast({
            title: "Initialization Failed",
            description: "Unable to initialize video call. Please try again.",
            variant: "destructive",
          });
        }
      });
    } catch (error) {
      console.error('Error joining meeting:', error);
      toast({
        title: "Join Failed",
        description: "Unable to join the video call. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoiningMeeting(false);
    }
  };

  const handleStartCall = async () => {
    if (!recipientInfo) {
      toast({
        title: "Recipient Not Found",
        description: "Unable to find recipient information",
        variant: "destructive",
      });
      return;
    }

    const meetingData = await createZoomMeeting();
    if (meetingData) {
      await joinZoomMeeting(meetingData);
    }
  };

  const handleCallEnd = () => {
    if (window.ZoomMtg && isCallActive) {
      window.ZoomMtg.leaveMeeting({});
    }
    
    setIsCallActive(false);
    setCallStartTime(null);
    setCallDuration(0);
    
    // Notify Wali about video call end
    notifyWaliAboutVideoCall('ended');
    
    toast({
      title: "Call Ended",
      description: "Video call has been ended",
    });
  };

  const notifyWaliAboutVideoCall = async (status: 'started' | 'ended') => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/zoom/notify-wali`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipientId,
          status,
          duration: status === 'ended' ? callDuration : 0,
          meetingId: meetingConfig?.meetingNumber
        })
      });
    } catch (error) {
      console.error('Error notifying Wali:', error);
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
    navigate(`/messages?with=${recipientId}`);
  };

  if (!isAuthenticated || !recipientId || !isPremiumUser) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </Button>
            
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Crown size={16} className="mr-1" />
                Premium Feature
              </Badge>
              {isCallActive && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Video size={16} className="mr-1" />
                  Call Active
                </Badge>
              )}
            </div>
          </div>

          {/* Call Status and Timer */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="text-center mb-6">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Zoom Video Call
              </h1>
              <p className="text-gray-600">
                Professional video calling with Islamic compliance
              </p>
            </div>

            {/* Call Timer and Warnings */}
            {isCallActive && (
              <div className="space-y-4 mb-6">
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 bg-blue-50 px-4 py-2 rounded-full">
                    <Clock size={20} className="text-blue-600" />
                    <span className="font-mono text-lg font-semibold text-blue-700">
                      {formatTime(callDuration)}
                    </span>
                    <span className="text-blue-600">/ 5:00</span>
                  </div>
                </div>
                
                {getRemainingTime() <= 60 && getRemainingTime() > 0 && (
                  <Alert className="border-orange-200 bg-orange-50">
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

          {/* Zoom Meeting Container */}
          <div id="zmmtg-root" ref={zoomContainerRef} className="mb-8"></div>

          {/* Call Actions */}
          <div className="space-y-4">
            {!isCallActive ? (
              <div className="flex justify-center gap-4">
                <Button
                  onClick={handleStartCall}
                  disabled={!isSDKLoaded || isJoiningMeeting || !recipientInfo}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
                >
                  <Phone size={20} />
                  {isJoiningMeeting ? "Joining..." : "Start Video Call"}
                </Button>
              </div>
            ) : (
              <div className="flex justify-center gap-4">
                <Button
                  onClick={handleCallEnd}
                  variant="destructive"
                  className="flex items-center gap-2 px-8 py-3 text-lg"
                >
                  <PhoneOff size={20} />
                  End Call
                </Button>
              </div>
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
              <p className="font-medium">Professional Quality</p>
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
              <strong>📹 Islamic Compliance:</strong> This call uses Zoom's professional platform 
              and will be logged and reported to your Wali for proper supervision and oversight.
            </p>
          </div>

          {/* SDK Loading Status */}
          {!isSDKLoaded && (
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-500">Loading Zoom SDK...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCallZoom;
