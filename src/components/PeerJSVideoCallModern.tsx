import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Clock, Crown, Minimize2, Maximize2, Settings, User } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface PeerJSVideoCallModernProps {
  participantId: string;
  participantName: string;
  sessionId: string;
  onCallEnd?: () => void;
  isVisible: boolean;
}

export const PeerJSVideoCallModern: React.FC<PeerJSVideoCallModernProps> = ({ 
  participantId, 
  participantName, 
  sessionId,
  onCallEnd,
  isVisible
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [callActive, setCallActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
  const [isMinimized, setIsMinimized] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Auto-hide controls after 3 seconds of inactivity
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  // Clear timer function
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Notify Wali about call status
  const notifyWali = useCallback(async (status: 'started' | 'ended') => {
    try {
      await apiClient.post('/wali/video-call-start', {
        recipientId: participantId,
        recipientInfo: { name: participantName },
        status,
        duration: status === 'ended' ? 300 - timeRemaining : 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to notify Wali about call:', error);
    }
  }, [participantId, participantName, timeRemaining]);

  // Initialize call
  const initializeCall = useCallback(async () => {
    try {
      console.log('🎥 Initializing video call...');
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: true, 
        audio: true 
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer instance
      const peerId = `${user?._id}_${sessionId}`;
      const peer = new Peer(peerId, {
        host: 'localhost',
        port: 5000,
        path: '/peerjs'
      });

      peerRef.current = peer;

      peer.on('open', (id) => {
        console.log('✅ PeerJS connection opened with ID:', id);
        setConnectionStatus('connecting');
        setCallActive(true);
        
        // Start timer
        console.log('🕐 Starting 5-minute countdown timer...');
        timerRef.current = setInterval(() => {
          setTimeRemaining((prev) => {
            if (prev <= 1) {
              endCall();
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        // Notify Wali about call start
        notifyWali('started');
      });

      peer.on('error', (error) => {
        console.error('❌ PeerJS error:', error);
        toast({
          title: "Connection Error",
          description: "Failed to establish video call connection",
          variant: "destructive"
        });
      });

      // Handle incoming calls
      peer.on('call', (call) => {
        console.log('📞 Receiving call from:', call.peer);
        call.answer(stream);
        callRef.current = call;
        
        call.on('stream', (remoteStream) => {
          console.log('📺 Received remote stream');
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStream;
          }
          setConnectionStatus('connected');
        });
      });

      // Make outgoing call
      const remotePeerId = `${participantId}_${sessionId}`;
      console.log('📞 Attempting to call remote peer:', remotePeerId);
      
      setTimeout(() => {
        const call = peer.call(remotePeerId, stream);
        if (call) {
          callRef.current = call;
          
          call.on('stream', (remoteStream) => {
            console.log('📺 Received remote stream from outgoing call');
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = remoteStream;
            }
            setConnectionStatus('connected');
          });
        }
      }, 2000);

    } catch (error) {
      console.error('❌ Failed to initialize call:', error);
      toast({
        title: "Camera/Microphone Error",
        description: "Please allow camera and microphone access",
        variant: "destructive"
      });
    }
  }, [user, sessionId, participantId, notifyWali, toast]);

  // End call function
  const endCall = useCallback(() => {
    console.log('📞 Ending call...');
    
    clearTimer();
    
    // Stop local stream
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (callRef.current) {
      callRef.current.close();
    }
    
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    
    setCallActive(false);
    setConnectionStatus('disconnected');
    
    // Notify Wali about call end
    notifyWali('ended');
    
    if (onCallEnd) {
      onCallEnd();
    }
  }, [clearTimer, notifyWali, onCallEnd]);

  // Toggle video
  const toggleVideo = useCallback(() => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  }, []);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement && containerRef.current) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else if (document.exitFullscreen) {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Initialize call when component mounts
  useEffect(() => {
    if (isVisible) {
      initializeCall();
    }
    
    return () => {
      endCall();
    };
  }, [isVisible]); // Remove initializeCall and endCall from dependencies to prevent infinite re-renders

  // Handle mouse movement for controls
  useEffect(() => {
    const handleMouseMove = () => {
      resetControlsTimeout();
    };

    if (containerRef.current) {
      containerRef.current.addEventListener('mousemove', handleMouseMove);
      containerRef.current.addEventListener('touchstart', handleMouseMove);
    }

    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('mousemove', handleMouseMove);
        containerRef.current.removeEventListener('touchstart', handleMouseMove);
      }
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  if (!isVisible) return null;

  return (
    <div 
      ref={containerRef}
      className={`fixed inset-0 z-50 bg-gray-900 flex flex-col ${isMinimized ? 'hidden' : ''}`}
    >
      {/* Header */}
      <div className={`absolute top-0 left-0 right-0 z-10 bg-gradient-to-b from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-semibold text-sm">Premium Video Call</span>
            </div>
            <div className="flex items-center space-x-2 bg-black/40 rounded-full px-3 py-1">
              <Clock className="w-4 h-4 text-white" />
              <span className={`text-sm font-mono ${timeRemaining <= 60 ? 'text-red-400' : 'text-white'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-full text-xs ${
              connectionStatus === 'connected' ? 'bg-green-500/20 text-green-400' :
              connectionStatus === 'connecting' ? 'bg-yellow-500/20 text-yellow-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-400' :
                connectionStatus === 'connecting' ? 'bg-yellow-400' :
                'bg-red-400'
              }`} />
              <span className="capitalize">{connectionStatus}</span>
            </div>
          </div>
        </div>
        
        <div className="mt-2 text-center">
          <p className="text-white/80 text-sm">
            Video call with <span className="font-semibold">{participantName}</span>
          </p>
          <p className="text-yellow-400 text-xs mt-1">
            🔒 Islamic Supervision Active • 5 min limit • Wali notified
          </p>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative">
        {/* Remote Video (Main) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover bg-gray-800"
        />
        
        {/* Remote Video Placeholder */}
        {connectionStatus !== 'connected' && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
            <div className="text-center text-white">
              <div className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-lg font-semibold">{participantName}</p>
              <p className="text-sm text-gray-400 mt-1">
                {connectionStatus === 'connecting' ? 'Connecting...' : 'Waiting to connect'}
              </p>
            </div>
          </div>
        )}

        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-20 right-4 w-32 h-24 md:w-40 md:h-30 bg-gray-800 rounded-lg overflow-hidden border-2 border-white/20 shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!videoEnabled && (
            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
              <VideoOff className="w-6 h-6 text-gray-400" />
            </div>
          )}
          <div className="absolute bottom-1 left-1 text-xs text-white bg-black/50 px-1 rounded">
            You
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-center space-x-4">
          {/* Audio Toggle */}
          <button
            onClick={toggleAudio}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              audioEnabled 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Video Toggle */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
              videoEnabled 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-red-500 hover:bg-red-600 text-white'
            }`}
          >
            {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* End Call */}
          <button
            onClick={endCall}
            className="w-14 h-14 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors"
          >
            <PhoneOff className="w-6 h-6" />
          </button>

          {/* Fullscreen Toggle (Desktop only) */}
          <button
            onClick={toggleFullscreen}
            className="hidden md:flex w-12 h-12 rounded-full bg-gray-700 hover:bg-gray-600 items-center justify-center text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Time Warning */}
        {timeRemaining <= 60 && (
          <div className="mt-3 text-center">
            <p className="text-red-400 text-sm font-semibold animate-pulse">
              ⚠️ Call ending in {formatTime(timeRemaining)}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeerJSVideoCallModern;
