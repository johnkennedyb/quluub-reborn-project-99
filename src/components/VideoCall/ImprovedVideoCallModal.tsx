import React, { useState, useEffect, useRef } from 'react';
import { X, Phone, PhoneOff, Copy, ExternalLink, Share2, Clock, Users, Video, Mic, MicOff, VideoOff, Shield, Maximize2, Minimize2, Link2 } from 'lucide-react';
import toast from 'react-hot-toast';
import apiClient from '../../lib/api-client';
import { useAuth } from '../../contexts/AuthContext';
// @ts-ignore
import ZoomVideo from '@zoom/videosdk';

interface ImprovedVideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  onCallStarted?: (callData: any) => void;
  onCallEnded?: (callData: any) => void;
}

const ImprovedVideoCallModal: React.FC<ImprovedVideoCallModalProps> = ({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  recipientAvatar,
  onCallStarted,
  onCallEnded
}) => {
  const { user } = useAuth();
  const [isCreatingCall, setIsCreatingCall] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callData, setCallData] = useState<any>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(true);
  const [shareableLink, setShareableLink] = useState<string>('');
  const [showLinkShare, setShowLinkShare] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes

  const videoContainerRef = useRef<HTMLDivElement>(null);
  const videoElementRef = useRef<HTMLVideoElement>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Zoom Video SDK state
  const [zoomClient, setZoomClient] = useState<any>(null);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);
  const [mediaStream, setMediaStream] = useState<any>(null);
  const [isSDKInitialized, setIsSDKInitialized] = useState(false);

  // Call duration and countdown timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isCallActive && callStartTimeRef.current) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - callStartTimeRef.current!) / 1000);
        setCallDuration(elapsed);
        setTimeRemaining(Math.max(0, 300 - elapsed));
        
        // Auto-end call after 5 minutes
        if (elapsed >= 300) {
          handleEndCall();
        }
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive]);

  // Don't auto-start call - let user click to start
  // useEffect(() => {
  //   if (isOpen && !isCallActive && !isCreatingCall) {
  //     handleStartCall();
  //   }
  // }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isCallActive) {
        handleEndCall();
      }
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleStartCall = async () => {
    if (!user) {
      toast.error('Please log in to start a video call');
      return;
    }

    if (isCreatingCall || isCallActive) {
      return;
    }

    try {
      setIsCreatingCall(true);
      console.log('Starting video call process...');

      // First, request camera and microphone permissions
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: true, 
          audio: true 
        });
        console.log('Camera and microphone permissions granted');
        // Stop the stream immediately as Zoom SDK will handle it
        stream.getTracks().forEach(track => track.stop());
      } catch (permissionError) {
        console.warn('Camera/microphone permission denied:', permissionError);
        toast.error('Please allow camera and microphone access for video calls');
        setIsCreatingCall(false);
        return;
      }

      // Create Zoom Video SDK session
      console.log('Creating Zoom meeting...');
      const response = await apiClient.post('/zoom/create-meeting', {
        topic: `Video Call with ${recipientName}`,
        participantId: recipientId,
        duration: 5
      });

      const sessionData = response.data;
      console.log('Zoom meeting created:', sessionData);
      setCallData(sessionData);
      // Fetch Zoom SDK join signature
      const sigRes = await apiClient.post('/zoom/signature', {
        meetingNumber: sessionData.sessionNumber,
        role: 1
      });
      sessionData.signature = sigRes.data.signature;

      // Set shareable link for the session
      const shareableUrl = `${window.location.origin}/video-call/${sessionData.sessionName}`;
      setShareableLink(shareableUrl);
      setShowLinkShare(true);

      // Initialize Zoom SDK for video call
      await initializeZoomSDK(sessionData);
      // Mark call as active
      setIsCallActive(true);
      callStartTimeRef.current = Date.now();
      onCallStarted?.(sessionData);
      toast.success(`Video call started with ${recipientName}`);
      
      setIsCreatingCall(false);
      
    } catch (error: any) {
      console.error('Error starting video call:', error);
      toast.error(`Failed to start video call: ${error.response?.data?.message || error.message}`);
      setIsCreatingCall(false);
    }
  };

  // Initialize Zoom Video SDK
  const initializeZoomSDK = async (sessionData: any) => {
    try {
      console.log('Initializing Zoom SDK with session data:', sessionData);
      
      // Check if ZoomVideo is available
      if (!ZoomVideo) {
        throw new Error('Zoom Video SDK not loaded');
      }
      
      // Initialize Zoom Video SDK
      const client = ZoomVideo.createClient();
      setZoomClient(client);
      
      // Initialize the client with proper configuration
      await client.init('en-US', 'Global', {
        patchJsMedia: true,
        leaveOnPageUnload: true
      });
      
      console.log('Zoom client initialized, attempting to join session...');
      console.log('Session data structure:', JSON.stringify(sessionData, null, 2));
      
      // For Zoom Video SDK, use the session name as the session key
      const sessionKey = sessionData.sessionName;
      const sdkToken = sessionData.sdkJWT;
      const userName = String(sessionData.userName || user?.fname || user?.username || `User_${Date.now()}`);
      
      console.log('Joining with Video SDK parameters:', {
        sessionKey,
        sdkToken: sdkToken.substring(0, 20) + '...',
        userName,
        sdkKey: sessionData.sdkKey?.substring(0, 10) + '...'
      });
      
      // Join the session with correct Video SDK parameters (sessionName, token, userName)
      await client.join(
        sessionKey,
        sdkToken,
        userName
      );
      
      console.log('Successfully joined Zoom session');
      
      // Get media stream
      const stream = client.getMediaStream();
      setMediaStream(stream);
      
      // Set up event listeners
      client.on('user-added', (payload) => {
        console.log('User added to call:', payload);
        setParticipants(prev => [...prev, payload]);
      });
      
      client.on('user-removed', (payload: any) => {
        console.log('User removed:', payload);
        setParticipants(prev => prev.filter(p => p.userId !== payload.userId));
      });
      
      toast.success('Video call connected!');
      
    } catch (error: any) {
      console.error('❌ Error initializing Zoom SDK:', error);
      toast.error('Failed to initialize video call');
      throw error;
    }
  };
  
  // Toggle video mute
  const toggleVideo = async () => {
    if (!mediaStream) return;
    
    try {
      if (isVideoMuted) {
        await mediaStream.startVideo({ videoElement: videoElementRef.current });
        setIsVideoMuted(false);
        toast.success('Video enabled');
      } else {
        await mediaStream.stopVideo();
        setIsVideoMuted(true);
        toast.success('Video disabled');
      }
    } catch (error) {
      console.error('Error toggling video:', error);
      toast.error('Failed to toggle video');
    }
  };
  
  // Toggle audio mute
  const toggleAudio = async () => {
    if (!mediaStream) return;
    
    try {
      if (isAudioMuted) {
        await mediaStream.unmuteAudio();
        setIsAudioMuted(false);
        toast.success('Audio enabled');
      } else {
        await mediaStream.muteAudio();
        setIsAudioMuted(true);
        toast.success('Audio disabled');
      }
    } catch (error) {
      console.error('Error toggling audio:', error);
      toast.error('Failed to toggle audio');
    }
  };

  const handleEndCall = async () => {
    try {
      // Clean up Zoom SDK
      if (zoomClient) {
        await zoomClient.leave();
        setZoomClient(null);
      }
      
      if (mediaStream) {
        await mediaStream.stopVideo();
        setMediaStream(null);
      }
      
      setIsSDKInitialized(false);
      setParticipants([]);
      
    } catch (error) {
      console.error('Error cleaning up video call:', error);
    }
    
    setIsCallActive(false);
    setCallDuration(0);
    setTimeRemaining(300);
    callStartTimeRef.current = null;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    onCallEnded?.(callData);
    toast.success('Video call ended');
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const copyJoinLink = async () => {
    if (shareableLink) {
      try {
        await navigator.clipboard.writeText(shareableLink);
        toast.success('Video call link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy link');
      }
    }
  };

  const openJoinLink = () => {
    if (shareableLink) {
      window.open(shareableLink, '_blank', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    }
  };

  const shareLink = async () => {
    if (shareableLink) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: `Video Call with ${recipientName}`,
            text: `Join my video call on Quluub`,
            url: shareableLink
          });
        } catch (error) {
          // Fallback to copy
          copyJoinLink();
        }
      } else {
        copyJoinLink();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop - Fixed overlay that doesn't affect page layout */}
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className={`relative bg-white rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ${
          isFullscreen ? 'w-full h-full' : 'w-[90vw] h-[85vh] max-w-6xl'
        }`}>
          
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {recipientAvatar && (
                  <img 
                    src={recipientAvatar} 
                    alt={recipientName}
                    className="w-10 h-10 rounded-full border-2 border-white/30"
                  />
                )}
                {!recipientAvatar && (
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="font-semibold">{recipientName}</h3>
                  <div className="flex items-center space-x-2 text-sm text-blue-100">
                    <Shield size={12} />
                    <span>Professional Call</span>
                    {isRecording && (
                      <>
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                        <span>Recording</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Call Duration & Time Remaining */}
                {isCallActive && (
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-3 py-1 rounded-full">
                      <Clock size={14} />
                      <span className="text-sm font-mono">{formatDuration(callDuration)}</span>
                    </div>
                    <div className={`flex items-center space-x-2 px-3 py-1 rounded-full ${
                      timeRemaining <= 60 ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-200'
                    }`}>
                      <span className="text-sm font-mono">
                        {formatDuration(timeRemaining)} left
                      </span>
                    </div>
                  </div>
                )}

                {/* Recording Indicator */}
                {isRecording && (
                  <div className="flex items-center space-x-1 bg-red-500 bg-opacity-20 px-2 py-1 rounded-full">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                    <span className="text-xs">REC</span>
                  </div>
                )}

                {/* Link Share Button */}
                {showLinkShare && shareableLink && (
                  <button
                    onClick={() => setShowLinkShare(!showLinkShare)}
                    className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                    title="Share Call Link"
                  >
                    <Share2 size={18} />
                  </button>
                )}

                {/* Controls */}
                <button
                  onClick={toggleFullscreen}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
                </button>

                <button
                  onClick={handleEndCall}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Link Sharing Panel */}
            {showLinkShare && shareableLink && (
              <div className="mt-4 p-3 bg-white/10 rounded-lg backdrop-blur-sm">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Link2 size={16} />
                    Share Call Link
                  </h4>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={shareableLink}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-sm text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
                  />
                  <button
                    onClick={copyJoinLink}
                    className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-1 text-sm"
                  >
                    <Copy size={14} />
                    Copy
                  </button>
                  <button
                    onClick={openJoinLink}
                    className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-1 text-sm"
                  >
                    <ExternalLink size={14} />
                    Open
                  </button>
                  <button
                    onClick={shareLink}
                    className="px-3 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors flex items-center gap-1 text-sm"
                  >
                    <Share2 size={14} />
                    Share
                  </button>
                </div>
                <p className="text-xs text-white/70 mt-2">
                  Send this link to {recipientName} so they can join the call
                </p>
              </div>
            )}
          </div>

          {/* Video Container */}
          <div className="flex-1 relative bg-gray-900 flex items-center justify-center" style={{ height: 'calc(100% - 120px)' }}>
            {isCreatingCall ? (
              <div className="text-center text-white">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Creating Video Call...</h3>
                <p className="text-gray-300">Setting up meeting with {recipientName}</p>
              </div>
            ) : isCallActive ? (
              <div className="relative w-full h-full">
                {/* Embedded Video Container */}
                <div 
                  ref={videoContainerRef}
                  className="w-full h-full bg-gray-900 rounded-lg overflow-hidden relative"
                  style={{ minHeight: '400px' }}
                >
                  {/* Video Element for Zoom SDK */}
                  <video
                    ref={videoElementRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                  
                  {!isSDKInitialized && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                      <div className="text-center text-white">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto mb-4" />
                        <p>Connecting to video call...</p>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Video Controls Overlay */}
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4 bg-black/50 backdrop-blur-sm rounded-full px-6 py-3">
                  {/* Audio Toggle */}
                  <button
                    onClick={toggleAudio}
                    className={`p-3 rounded-full transition-colors ${
                      isAudioMuted 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                    title={isAudioMuted ? 'Unmute Audio' : 'Mute Audio'}
                  >
                    {isAudioMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                  </button>
                  
                  {/* Video Toggle */}
                  <button
                    onClick={toggleVideo}
                    className={`p-3 rounded-full transition-colors ${
                      isVideoMuted 
                        ? 'bg-red-600 hover:bg-red-700' 
                        : 'bg-white/20 hover:bg-white/30'
                    }`}
                    title={isVideoMuted ? 'Turn On Video' : 'Turn Off Video'}
                  >
                    {isVideoMuted ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
                  </button>
                </div>
                  
                  {/* Video overlay with call info */}
                  <div className="absolute top-4 left-4 flex flex-col space-y-2">
                    <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span>Connected</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
                      <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                      <span>Recording</span>
                    </div>
                    <div className="flex items-center space-x-2 bg-black/70 backdrop-blur-sm rounded-full px-3 py-1 text-white text-sm">
                      <Clock className="w-3 h-3" />
                      <span>{formatDuration(callDuration)}</span>
                    </div>
                  </div>
                  
                  {/* Call controls overlay */}
                  <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                    <div className="flex items-center space-x-4 bg-black/70 backdrop-blur-sm rounded-full px-6 py-3">
                      {/* Video toggle */}
                      <button
                        onClick={toggleVideo}
                        className={`p-3 rounded-full transition-colors ${
                          isVideoMuted 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        {isVideoMuted ? <VideoOff className="w-5 h-5 text-white" /> : <Video className="w-5 h-5 text-white" />}
                      </button>
                      
                      {/* Audio toggle */}
                      <button
                        onClick={toggleAudio}
                        className={`p-3 rounded-full transition-colors ${
                          isAudioMuted 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'bg-gray-600 hover:bg-gray-700'
                        }`}
                      >
                        {isAudioMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-white" />}
                      </button>
                      
                      {/* End call */}
                      <button
                        onClick={handleEndCall}
                        className="p-3 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
                      >
                        <PhoneOff className="w-5 h-5 text-white" />
                      </button>
                    </div>
                  </div>
                </div>
            ) : (
              <div className="text-center text-white">
                <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mb-6 mx-auto hover:bg-blue-700 transition-colors">
                  <Phone className="w-12 h-12" />
                </div>
                <h3 className="text-xl font-semibold mb-2">Ready to Call {recipientName}</h3>
                <p className="text-gray-300 mb-6">Start your professional video call</p>
                
                <button
                  onClick={handleStartCall}
                  disabled={isCreatingCall}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold flex items-center gap-3 mx-auto transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingCall ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                      Creating Meeting...
                    </>
                  ) : (
                    <>
                      <Phone className="w-5 h-5" />
                      Start Video Call
                    </>
                  )}
                </button>
                
                <div className="mt-6 text-sm text-gray-400 space-y-1">
                  <p>• 5-minute duration limit</p>
                  <p>• Automatically recorded for supervision</p>
                  <p>• Link will be shared with {recipientName}</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer - Islamic Compliance Notice & Controls */}
          <div className="bg-gray-50 p-4 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2 text-gray-600">
                  <Users size={14} className="text-blue-600" />
                  <span>Premium Feature</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Shield size={14} className="text-green-600" />
                  <span>Islamic Compliance Enabled</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <Clock size={14} className="text-orange-600" />
                  <span>5 Minute Limit</span>
                </div>
              </div>
              
              {isCallActive && (
                <button
                  onClick={handleEndCall}
                  className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <PhoneOff size={16} />
                  End Call
                </button>
              )}
            </div>
            
            <div className="mt-2 text-xs text-gray-500 text-center">
              <span className="font-arabic">بسم الله الرحمن الرحيم</span> • 
              This call is monitored for Islamic compliance and proper conduct
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ImprovedVideoCallModal;
