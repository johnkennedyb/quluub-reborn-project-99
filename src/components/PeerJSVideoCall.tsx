import React, { useState, useEffect, useRef, useCallback } from 'react';
import Peer, { MediaConnection } from 'peerjs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Clock, Crown } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface PeerJSVideoCallProps {
  participantId: string;
  participantName: string;
  onCallEnd?: () => void;
  isIncoming?: boolean;
  callerId?: string;
}

export const PeerJSVideoCall: React.FC<PeerJSVideoCallProps> = ({ 
  participantId, 
  participantName, 
  onCallEnd,
  isIncoming = false,
  callerId
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const callRef = useRef<MediaConnection | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

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

  // Initialize local media stream
  const initializeLocalStream = async () => {
    try {
      console.log('🎥 Initializing local media stream...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: true
      });

      localStreamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.muted = true; // Mute local video to prevent feedback
        console.log('✅ Local video stream attached');
      }

      return stream;
    } catch (error) {
      console.error('❌ Failed to get local media stream:', error);
      toast({
        title: 'Camera/Microphone Error',
        description: 'Failed to access camera or microphone. Please check permissions.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  // Initialize PeerJS connection
  const initializePeer = async () => {
    try {
      console.log('🔗 Initializing PeerJS connection...');
      
      // Create unique peer ID using user ID and timestamp
      const peerId = `${user?.id}_${Date.now()}`;
      
      const peer = new Peer(peerId, {
        host: 'peerjs-server.herokuapp.com',
        port: 443,
        path: '/',
        secure: true,
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
      });

      peer.on('error', (error) => {
        console.error('❌ PeerJS error:', error);
        toast({
          title: 'Connection Error',
          description: 'Failed to establish peer connection. Please try again.',
          variant: 'destructive'
        });
        setConnectionStatus('disconnected');
      });

      // Handle incoming calls
      peer.on('call', (call) => {
        console.log('📞 Incoming call received');
        handleIncomingCall(call);
      });

      return peer;
    } catch (error) {
      console.error('❌ Failed to initialize PeerJS:', error);
      throw error;
    }
  };

  // Handle incoming call
  const handleIncomingCall = (call: MediaConnection) => {
    console.log('📞 Handling incoming call...');
    
    if (localStreamRef.current) {
      call.answer(localStreamRef.current);
      callRef.current = call;
      
      call.on('stream', (remoteStream) => {
        console.log('📺 Received remote stream');
        remoteStreamRef.current = remoteStream;
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          console.log('✅ Remote video stream attached');
        }
      });

      call.on('close', () => {
        console.log('📞 Call closed by remote peer');
        handleCallEnd();
      });

      setCallActive(true);
      startTimer();
    }
  };

  // Make outgoing call
  const makeCall = async (remotePeerId: string) => {
    try {
      console.log('📞 Making call to:', remotePeerId);
      
      if (!peerRef.current || !localStreamRef.current) {
        throw new Error('Peer or local stream not initialized');
      }

      const call = peerRef.current.call(remotePeerId, localStreamRef.current);
      callRef.current = call;

      call.on('stream', (remoteStream) => {
        console.log('📺 Received remote stream');
        remoteStreamRef.current = remoteStream;
        
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          console.log('✅ Remote video stream attached');
        }
      });

      call.on('close', () => {
        console.log('📞 Call closed by remote peer');
        handleCallEnd();
      });

      setCallActive(true);
      startTimer();
      
      toast({
        title: '📞 Call Started',
        description: `Video call with ${participantName} is now active.`
      });

    } catch (error) {
      console.error('❌ Failed to make call:', error);
      toast({
        title: 'Call Failed',
        description: 'Failed to start video call. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Start the timer
  const startTimer = () => {
    if (timerRef.current) return; // Timer already running

    console.log('🕐 Starting 5-minute countdown timer...');
    timerRef.current = setInterval(() => {
      setTimeRemaining(prevTime => {
        if (prevTime <= 1) {
          console.log('⏰ Timer expired, ending call...');
          handleCallEnd();
          return 0;
        }
        if (prevTime <= 30 && prevTime % 10 === 0) {
          console.log(`⚠️ ${prevTime} seconds remaining`);
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
  }, [participantId, participantName, timeRemaining, onCallEnd, toast, clearTimer]);

  // Start call function
  const startCall = async () => {
    setIsLoading(true);
    
    try {
      // Initialize local media stream
      await initializeLocalStream();
      
      // Initialize PeerJS
      await initializePeer();
      
      // If this is an incoming call, wait for the call to be answered
      if (isIncoming && callerId) {
        console.log('📞 Waiting for incoming call from:', callerId);
        // The incoming call will be handled by the 'call' event listener
      } else {
        // For outgoing calls, we need the remote peer ID
        // In a real implementation, you'd get this from your signaling server
        const remotePeerId = `${participantId}_${Date.now() - 1000}`; // Simulated remote peer ID
        await makeCall(remotePeerId);
      }

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
      console.error('💥 Failed to start call:', error);
      toast({
        title: 'Error Starting Call',
        description: error instanceof Error ? error.message : 'An unknown error occurred.',
        variant: 'destructive'
      });
      await handleCallEnd();
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle video
  const toggleVideo = async () => {
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
  const toggleAudio = async () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
        console.log('🔊 Audio toggled:', audioTrack.enabled ? 'ON' : 'OFF');
      }
    }
  };

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

  // Timer effect
  useEffect(() => {
    if (callActive && !timerRef.current) {
      startTimer();
    } else if (!callActive && timerRef.current) {
      clearTimer();
    }
    
    return () => {
      clearTimer();
    };
  }, [callActive, clearTimer]);

  return (
    <>
      {callActive ? (
        <Dialog open={true} onOpenChange={() => handleCallEnd()}>
          <DialogContent className="max-w-4xl h-[80vh] p-0 bg-black">
            <DialogHeader className="bg-gray-900 p-4 text-white">
              <DialogTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                PeerJS Video Call - {participantName}
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
      ) : (
        <div className="flex justify-center items-center h-full">
          <Button onClick={startCall} disabled={isLoading} size="lg">
            {isLoading ? 'Starting Call...' : `Start PeerJS Video Call with ${participantName}`}
          </Button>
        </div>
      )}
    </>
  );
};

export default PeerJSVideoCall;
