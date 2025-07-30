import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Clock, Crown, Minimize2, Maximize2, Settings } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface PeerJSVideoCallSimpleProps {
  participantId: string;
  participantName: string;
  sessionId: string;
  onCallEnd?: () => void;
  isVisible: boolean;
}

export const PeerJSVideoCallSimple: React.FC<PeerJSVideoCallSimpleProps> = ({ 
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

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Clear timer function
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log('🛑 Timer cleared');
    }
  }, []);

  // Initialize PeerJS and start call
  const initializeCall = useCallback(async () => {
    try {
      console.log('🚀 Initializing PeerJS video call...');
      
      // Get local media stream first
      console.log('🎥 Getting local media stream...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      localStreamRef.current = stream;
      
      // Attach local video immediately
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true;
        console.log('✅ Local video stream attached');
      }

      // Create PeerJS instance
      const peerId = `${user?.id}_${sessionId}`;
      console.log('🔗 Creating PeerJS instance with ID:', peerId);
      
      const peer = new Peer(peerId, {
        host: 'localhost',
        port: 5000,
        path: '/peerjs',
        secure: false,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
          ]
        }
      });

      peerRef.current = peer;

      peer.on('open', (id) => {
        console.log('✅ PeerJS connection opened with ID:', id);
        setConnectionStatus('connected');
        setCallActive(true);
        startTimer();
        
        toast({
          title: '📞 Call Started',
          description: `Video call with ${participantName} is now active.`
        });
      });

      peer.on('error', (error) => {
        console.error('❌ PeerJS error:', error);
        setConnectionStatus('disconnected');
        toast({
          title: 'Connection Error',
          description: 'Failed to establish peer connection.',
          variant: 'destructive'
        });
      });

      // Handle incoming calls
      peer.on('call', (call) => {
        console.log('📞 Incoming call received');
        call.answer(stream);
        setupCall(call);
      });

      // For demo purposes, try to call the other participant
      // In a real app, you'd coordinate this through your signaling server
      setTimeout(() => {
        const remotePeerId = `${participantId}_${sessionId}`;
        console.log('📞 Attempting to call remote peer:', remotePeerId);
        
        try {
          const call = peer.call(remotePeerId, stream);
          if (call) {
            setupCall(call);
          }
        } catch (error) {
          console.log('📞 Remote peer not ready yet, waiting for incoming call...');
        }
      }, 2000);

      // Notify Wali about call start
      try {
        await apiClient.post('/wali/video-call-start', {
          participantId,
          participantName
        });
      } catch (error) {
        console.error('Failed to notify Wali about call start:', error);
      }

    } catch (error) {
      console.error('❌ Failed to initialize call:', error);
      toast({
        title: 'Call Failed',
        description: 'Failed to start video call. Please check camera/microphone permissions.',
        variant: 'destructive'
      });
      handleCallEnd();
    }
  }, [user?.id, sessionId, participantId, participantName, toast]);

  // Setup call event listeners
  const setupCall = (call: MediaConnection) => {
    callRef.current = call;

    call.on('stream', (remoteStream) => {
      console.log('📺 Received remote stream');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        console.log('✅ Remote video stream attached');
      }
    });

    call.on('close', () => {
      console.log('📞 Call closed by remote peer');
      handleCallEnd();
    });

    call.on('error', (error) => {
      console.error('❌ Call error:', error);
      handleCallEnd();
    });
  };

  // Start the timer
  const startTimer = () => {
    if (timerRef.current) return;

    console.log('🕐 Starting 5-minute countdown timer...');
    timerRef.current = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime <= 1) {
          console.log('⏰ Timer expired, ending call...');
          handleCallEnd();
          return 0;
        }
        if (prevTime <= 30 && prevTime % 10 === 0) {
          toast({
            title: '⏰ Time Warning',
            description: `${prevTime} seconds remaining`,
            duration: 2000
          });
        }
        return prevTime - 1;
      });
    }, 1000);
  };

  // Handle call end
  const handleCallEnd = useCallback(async () => {
    console.log('📞 Ending call...');
    
    clearTimer();
    
    // Close PeerJS call
    if (callRef.current) {
      callRef.current.close();
      callRef.current = null;
    }

    // Stop local media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log('✅ Stopped track:', track.kind);
      });
      localStreamRef.current = null;
    }

    // Clear video elements
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    // Close peer connection
    if (peerRef.current) {
      peerRef.current.destroy();
      peerRef.current = null;
    }

    setCallActive(false);
    setConnectionStatus('disconnected');
    setTimeRemaining(300);

    // Notify Wali about call end
    try {
      await apiClient.post('/wali/video-call-end', {
        participantId,
        duration: 300 - timeRemaining
      });
    } catch (error) {
      console.error('Failed to notify Wali about call end:', error);
    }

    if (onCallEnd) {
      onCallEnd();
    }

    toast({
      title: '📞 Call Ended',
      description: `Your call with ${participantName} has ended.`,
      duration: 3000
    });
  }, [participantId, timeRemaining, onCallEnd, toast, clearTimer]);

  // Toggle video
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
        console.log('📹 Video toggled:', videoTrack.enabled ? 'ON' : 'OFF');
      }
    }
  };

  // Toggle audio
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
        console.log('🔊 Audio toggled:', audioTrack.enabled ? 'ON' : 'OFF');
      }
    }
  };

  // Initialize call when component becomes visible
  useEffect(() => {
    console.log('🔍 quluub Video Call Effect:', {
      isVisible,
      callActive,
      hasPeer: !!peerRef.current,
      sessionId,
      participantId,
      participantName
    });
    
    if (isVisible && !callActive && !peerRef.current) {
      console.log('🚀 Initializing PeerJS call...');
      initializeCall();
    }
  }, [isVisible, callActive, initializeCall]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearTimer();
      if (callRef.current) {
        callRef.current.close();
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, [clearTimer]);

  // Moved console.log to useEffect to prevent render loop
  
  if (!isVisible) {
    console.log('⚠️ quluub Video Call not visible, returning null');
    return null;
  }

  return (
    <Dialog open={true} onOpenChange={() => handleCallEnd()}>
      <DialogContent className="max-w-4xl h-[80vh] p-0 bg-black">
        <DialogHeader className="bg-gray-900 p-4 text-white">
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            quluub Video Call - {participantName}
            <Badge variant="secondary" className="ml-2">
              Premium
            </Badge>
          </DialogTitle>
          <DialogDescription className="text-gray-300">
            Video call with {participantName} is active. 
            <span className="text-yellow-400 ml-2">
              🕐 Islamic Supervision Active • 5 min limit • Wali notified
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-grow relative bg-black">
          {/* Main video area (remote participant) */}
          <video 
            ref={remoteVideoRef} 
            className="w-full h-full object-cover" 
            playsInline 
            autoPlay 
            style={{ 
              backgroundColor: '#1a1a1a',
              display: 'block',
              visibility: 'visible'
            }}
          />
          
          {/* Local video (picture-in-picture) */}
          <video 
            ref={localVideoRef} 
            className="absolute bottom-2 right-2 w-24 h-18 sm:bottom-4 sm:right-4 sm:w-36 sm:h-28 md:w-48 md:h-36 object-cover border-2 border-white rounded-md shadow-lg" 
            playsInline 
            autoPlay 
            muted={true}
            style={{ 
              backgroundColor: '#2a2a2a',
              display: 'block',
              visibility: 'visible',
              zIndex: 10
            }}
          />
          
          {/* Video status indicators */}
          <div className="absolute top-4 left-4 flex gap-2">
            <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              {videoEnabled ? '📹 Video On' : '📹 Video Off'}
            </div>
            <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              {audioEnabled ? '🔊 Audio On' : '🔇 Audio Off'}
            </div>
            <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
              📡 {connectionStatus}
            </div>
          </div>
          
          {/* Participant info */}
          <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-2 rounded">
            <span className="text-sm font-medium">{participantName}</span>
          </div>
        </div>
        
        <DialogFooter className="bg-gray-900 p-4 flex justify-center items-center gap-4">
          <div className="text-white font-mono text-lg">
            <Clock className="inline-block mr-2" />
            {formatTime(timeRemaining)}
          </div>
          <Button onClick={toggleVideo} variant={videoEnabled ? 'secondary' : 'destructive'} size="icon">
            {videoEnabled ? <Video /> : <VideoOff />}
          </Button>
          <Button onClick={toggleAudio} variant={audioEnabled ? 'secondary' : 'destructive'} size="icon">
            {audioEnabled ? <Mic /> : <MicOff />}
          </Button>
          <Button onClick={handleCallEnd} variant="destructive" size="icon">
            <PhoneOff />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default PeerJSVideoCallSimple;
