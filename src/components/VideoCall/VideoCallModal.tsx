import React, { useEffect, useRef, useState } from 'react';
import { X, Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Monitor, Circle } from 'lucide-react';
import { webrtcService, CallData } from '../../services/webrtcService';
import { useVideoCall } from '../../contexts/VideoCallContext';

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
  const { isRecording, callDuration, connectionStatus, endCall } = useVideoCall();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

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
      },
      onConnectionStateChange: (state) => {
        if (state === 'connected') {
          setCallStatus('connected');
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

  if (!isOpen || !callData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      <div className={`relative bg-gray-900 rounded-lg overflow-hidden shadow-2xl ${
        isFullscreen ? 'w-full h-full' : 'w-full max-w-4xl h-[600px]'
      }`}>
        
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/50 to-transparent p-4">
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
