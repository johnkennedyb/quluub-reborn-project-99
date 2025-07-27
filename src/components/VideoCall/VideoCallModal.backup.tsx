import React, { useEffect, useRef, useState } from 'react';
import { X, Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Monitor, Circle, Users, Shield, Clock, Copy, ExternalLink } from 'lucide-react';
import { webrtcService, CallData } from '../../services/webrtcService';
import { useVideoCall } from '../../contexts/VideoCallContext';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callData: CallData | null;
  isIncoming?: boolean;
  onAccept?: () => void;
  onReject?: () => void;
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({
  isOpen,
  onClose,
  callData,
  isIncoming = false,
  onAccept,
  onReject
}) => {
  const { user } = useAuth();
  const { isRecording, callDuration, connectionStatus, endCall } = useVideoCall();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [meetingUrl, setMeetingUrl] = useState<string>('');
  const [showJoinLink, setShowJoinLink] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // Generate meeting URL when modal opens
    const url = generateMeetingUrl();
    setMeetingUrl(url);

    // Set up local video stream
    const localStream = webrtcService.getLocalStream();
    if (localStream && localVideoRef.current) {
      localVideoRef.current.srcObject = localStream;
    }

    // Set up WebRTC callbacks
    webrtcService.setCallbacks({
      onIncomingCall: () => {},
      onCallAccepted: () => {
        setCallStatus('connected');
        setShowJoinLink(true);
      },
      onCallRejected: () => {
        setCallStatus('ended');
        setTimeout(onClose, 1500);
      },
      onCallEnded: () => {
        setCallStatus('ended');
        setTimeout(onClose, 1500);
      },
      onCallCancelled: () => {
        setCallStatus('ended');
        setTimeout(onClose, 1500);
      },
      onRemoteStream: (stream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
        setCallStatus('connected');
        setShowJoinLink(true);
      },
      onConnectionStateChange: (state) => {
        if (state === 'connected') {
          setCallStatus('connected');
          setShowJoinLink(true);
        } else if (state === 'failed' || state === 'disconnected') {
          setCallStatus('ended');
        }
      }
    });

    return () => {
      // Cleanup is handled by the service
    };
  }, [isOpen, onClose]);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAccept = async () => {
    try {
      await webrtcService.acceptCall();
      onAccept?.();
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };

  const handleReject = () => {
    webrtcService.rejectCall();
    onReject?.();
    onClose();
  };

  const handleEndCall = async () => {
    await endCall();
    onClose();
  };

  const handleCancelCall = () => {
    webrtcService.cancelCall();
    onClose();
  };

  const toggleVideo = () => {
    const enabled = webrtcService.toggleVideo();
    setIsVideoEnabled(enabled);
  };

  const toggleAudio = () => {
    const enabled = webrtcService.toggleAudio();
    setIsAudioEnabled(enabled);
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const copyJoinLink = async () => {
    if (meetingUrl) {
      try {
        await navigator.clipboard.writeText(meetingUrl);
        toast.success('Join link copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy join link');
      }
    }
  };

  const openJoinLink = () => {
    if (meetingUrl) {
      window.open(meetingUrl, '_blank');
    }
  };

  const generateMeetingUrl = () => {
    // Generate a professional meeting URL based on call data
    const baseUrl = window.location.origin;
    const meetingId = callData?.callId || `call-${Date.now()}`;
    return `${baseUrl}/video-call/${meetingId}`;
  };

  if (!isOpen || !callData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`relative bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-200 ${
        isFullscreen ? 'w-full h-full' : 'w-full max-w-6xl h-[700px]'
      }`}>
        
        {/* Modern Header */}
        <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-white via-white/95 to-transparent p-6 border-b border-gray-100">
          <div className="flex items-center justify-between">
            {/* Call Info */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                  {callData.recipientName?.charAt(0) || callData.callerName?.charAt(0) || 'U'}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {isIncoming ? callData.callerName : callData.recipientName}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <div className={`w-2 h-2 rounded-full ${
                      connectionStatus === 'connected' ? 'bg-green-500 animate-pulse' : 
                      connectionStatus === 'connecting' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'
                    }`}></div>
                    <span>
                      {connectionStatus === 'connecting' ? 'Connecting...' : 
                       connectionStatus === 'connected' ? formatDuration(callDuration) : 'Call Ended'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Professional Features Badge */}
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-full">
                <Shield className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Professional Call</span>
              </div>
              
              {/* Recording Indicator */}
              {isRecording && (
                <div className="flex items-center space-x-2 px-3 py-1.5 bg-red-50 rounded-full">
                  <Circle className="w-3 h-3 fill-red-500 text-red-500 animate-pulse" />
                  <span className="text-sm font-medium text-red-700">Recording</span>
                </div>
              )}
            </div>
            
            {/* Header Actions */}
            <div className="flex items-center space-x-3">
              {/* Join Link Button */}
              {showJoinLink && meetingUrl && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={copyJoinLink}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium text-gray-700"
                  >
                    <Copy className="w-4 h-4" />
                    <span>Copy Link</span>
                  </button>
                  <button
                    onClick={openJoinLink}
                    className="flex items-center space-x-2 px-3 py-2 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors text-sm font-medium text-blue-700"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Open</span>
                  </button>
                </div>
              )}
              
              {/* Fullscreen Toggle */}
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
              >
                <Monitor className="w-5 h-5" />
              </button>
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-600 hover:text-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center space-x-3">
              {callData.callerAvatar || callData.recipientAvatar ? (
                <img
                  src={isIncoming ? callData.callerAvatar : callData.recipientAvatar}
                  alt="Profile"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {(isIncoming ? callData.callerName : callData.recipientName)?.charAt(0)}
                  </span>
                </div>
              )}
              <div>
                <h3 className="font-semibold">
                  {isIncoming ? callData.callerName : callData.recipientName}
                </h3>
                <p className="text-sm text-gray-300">
                  {callStatus === 'connecting' && (isIncoming ? 'Incoming call...' : 'Calling...')}
                  {callStatus === 'connected' && formatDuration(callDuration)}
                  {callStatus === 'ended' && 'Call ended'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleFullscreen}
                className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
              >
                <Monitor className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-full bg-black/30 hover:bg-black/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Video Container */}
        <div className="relative w-full h-full">
          {/* Remote Video (Main) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />
          
          {/* Remote Video Placeholder */}
          {callStatus !== 'connected' && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <div className="text-center text-white">
                {callData.callerAvatar || callData.recipientAvatar ? (
                  <img
                    src={isIncoming ? callData.callerAvatar : callData.recipientAvatar}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-600 flex items-center justify-center mx-auto mb-4">
                    <span className="text-4xl font-medium">
                      {(isIncoming ? callData.callerName : callData.recipientName)?.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex items-center space-x-4 text-white">
                  {/* Recording Status */}
                  {isRecording && (
                    <div className="flex items-center space-x-2">
                      <Circle className="w-3 h-3 fill-red-500 text-red-500 animate-pulse" />
                      <span className="text-sm font-medium">REC</span>
                    </div>
                  )}
                  
                  {/* Call Status */}
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full animate-pulse ${
                      connectionStatus === 'connected' ? 'bg-green-500' : 
                      connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                    }`}></div>
                    <span className="text-sm">
                      {connectionStatus === 'connecting' ? 'Connecting...' : 
                       connectionStatus === 'connected' ? formatDuration(callDuration) : 'Call Ended'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute top-20 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <VideoOff className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6">
          <div className="flex items-center justify-center space-x-4">
            
            {/* Incoming Call Controls */}
            {isIncoming && callStatus === 'connecting' && (
              <>
                <button
                  onClick={handleReject}
                  className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors text-white"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
                <button
                  onClick={handleAccept}
                  className="p-4 rounded-full bg-green-500 hover:bg-green-600 transition-colors text-white"
                >
                  <Phone className="w-6 h-6" />
                </button>
              </>
            )}

            {/* Active Call Controls */}
            {(callStatus === 'connected' || (callStatus === 'connecting' && !isIncoming)) && (
              <>
                <button
                  onClick={toggleAudio}
                  className={`p-3 rounded-full transition-colors ${
                    isAudioEnabled 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={toggleVideo}
                  className={`p-3 rounded-full transition-colors ${
                    isVideoEnabled 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>

                <button
                  onClick={callStatus === 'connecting' && !isIncoming ? handleCancelCall : handleEndCall}
                  className="p-4 rounded-full bg-red-500 hover:bg-red-600 transition-colors text-white"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoCallModal;
