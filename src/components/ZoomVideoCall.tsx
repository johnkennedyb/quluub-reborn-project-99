import React, { useState, useEffect, useRef, useCallback } from 'react';
import ZoomVideo from '@zoom/videosdk';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, Clock, Crown } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface ZoomVideoCallProps {
  participantId: string;
  participantName: string;
  onCallEnd?: () => void;
}

export const ZoomVideoCall: React.FC<ZoomVideoCallProps> = ({ participantId, participantName, onCallEnd }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const zoomClientRef = useRef<any>(null);
  const mediaStreamRef = useRef<any>(null);
  const localPlayerRef = useRef<HTMLVideoElement>(null);
  const remotePlayerRef = useRef<HTMLVideoElement>(null);
  const localCameraStreamRef = useRef<MediaStream | null>(null);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  // Reusable timer cleanup function
  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log('🛑 Timer cleared');
    }
  }, []);

  // Reusable video attachment function
  const attachVideoStream = useCallback(async ({
    element,
    userId,
    label,
  }: {
    element: HTMLVideoElement | null;
    userId: number;
    label: string;
  }) => {
    if (!element || !mediaStreamRef.current) {
      console.warn(`⚠️ ${label} video attachment failed - missing refs:`, {
        element: !!element,
        mediaStreamRef: !!mediaStreamRef.current
      });
      return;
    }

    try {
      console.log(`📹 Attaching ${label.toLowerCase()} video...`, {
        element,
        userId,
        mediaStream: mediaStreamRef.current
      });
      
      // Clear any existing content
      element.srcObject = null;
      
      // Ensure video element is ready and visible
      element.style.display = 'block';
      element.style.visibility = 'visible';
      element.autoplay = true;
      element.playsInline = true;
      
      // Attach the Zoom video stream
      await mediaStreamRef.current.attachVideo(element, userId);
      console.log(`✅ ${label} video attached successfully!`);
      
      // Force play if needed
      try {
        await element.play();
      } catch (playErr) {
        console.log(`📹 ${label} video autoplay handled by browser`);
      }
      
      // Verify video is working
      setTimeout(() => {
        if (element) {
          console.log(`📹 ${label} video element state:`, {
            videoWidth: element.videoWidth,
            videoHeight: element.videoHeight,
            readyState: element.readyState,
            paused: element.paused,
            srcObject: !!element.srcObject
          });
          
          // If video dimensions are 0, try to refresh
          if (element.videoWidth === 0 || element.videoHeight === 0) {
            console.log(`🔄 ${label} video has no dimensions, attempting refresh...`);
            element.load();
          }
        }
      }, 2000);
      
    } catch (err) {
      console.error(`❌ Error attaching ${label.toLowerCase()} video:`, err);
      
      // Retry with delay
      setTimeout(async () => {
        try {
          console.log(`🔄 Retrying ${label.toLowerCase()} video attachment...`);
          await mediaStreamRef.current.attachVideo(element, userId);
          console.log(`✅ ${label} video attached on retry!`);
          
          // Force play on retry
          try {
            await element.play();
          } catch (playErr) {
            console.log(`📹 ${label} video retry autoplay handled`);
          }
        } catch (retryErr) {
          console.error(`❌ ${label} video retry failed:`, retryErr);
        }
      }, 3000);
    }
  }, []);

  const handleCallEnd = useCallback(async () => {
    console.log('📞 Ending call...');
    
    // Clear timer first
    clearTimer();
    
    // Cleanup Zoom resources
    if (zoomClientRef.current) {
      try {
        console.log('🧹 Cleaning up Zoom resources...');
        
        // Stop media streams
        if (mediaStreamRef.current) {
          try {
            await mediaStreamRef.current.stopVideo();
            await mediaStreamRef.current.stopAudio();
            console.log('📹 Media streams stopped');
          } catch (error) {
            console.error('Error stopping media streams:', error);
          }
        }
        
        // Leave Zoom session
        await zoomClientRef.current.leave();
        console.log('✅ Left Zoom session successfully');
        
        // Remove event listeners
        zoomClientRef.current.off('user-added');
        
      } catch (error) {
        console.error('Error during call cleanup:', error);
      } finally {
        zoomClientRef.current = null;
        mediaStreamRef.current = null;
      }
    }
    
    // Cleanup direct camera stream
    if (localCameraStreamRef.current) {
      try {
        console.log('📹 Stopping direct camera stream...');
        localCameraStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log('✅ Camera track stopped:', track.kind);
        });
        localCameraStreamRef.current = null;
        
        // Clear video elements
        if (localPlayerRef.current) {
          localPlayerRef.current.srcObject = null;
        }
        if (remotePlayerRef.current) {
          remotePlayerRef.current.srcObject = null;
        }
      } catch (error) {
        console.error('Error stopping camera stream:', error);
      }
    }
    
    // Update UI state
    setCallActive(false);
    setTimeRemaining(300); // Reset timer for next call
    
    // Notify parent component
    if (onCallEnd) {
      onCallEnd();
    }
    
    toast({ 
      title: '📞 Call Ended', 
      description: `Your call with ${participantName} has ended.`,
      duration: 3000
    });
  }, [onCallEnd, participantName, toast]);

  useEffect(() => {
    // Timer effect - only start timer when call is active and timer hasn't started yet
    if (callActive && !timerRef.current) {
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
          }
          return prevTime - 1;
        });
      }, 1000);
    } else if (!callActive && timerRef.current) {
      console.log('🛑 Clearing timer - call ended');
      clearTimer();
    }
    
    return () => {
      clearTimer();
    };
  }, [callActive, handleCallEnd]);

  // Video attachment is now handled directly in startCall function
  // This useEffect is no longer needed as timing was causing issues
  
  // Cleanup on unmount - only cleanup resources, don't call handleCallEnd
  useEffect(() => {
    return () => {
      // Only cleanup resources without triggering the full handleCallEnd flow
      clearTimer();
      if (zoomClientRef.current) {
        try {
          zoomClientRef.current.leave();
        } catch (error) {
          console.error('Error during unmount cleanup:', error);
        }
      }
    };
  }, [clearTimer]); // Include clearTimer in dependencies

  // Function to initialize camera permissions (no direct video attachment)
  const initializeCameraPermissions = async () => {
    try {
      console.log('🎥 Checking camera permissions...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }, 
        audio: true 
      });
      
      // Stop the stream immediately - we just needed to check permissions
      stream.getTracks().forEach(track => track.stop());
      console.log('✅ Camera permissions verified');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to access camera:', error);
      toast({
        title: 'Camera Error',
        description: 'Failed to access camera. Please check permissions.',
        variant: 'destructive'
      });
      throw error;
    }
  };

  const startCall = async () => {
    setIsLoading(true);
    
    try {
      // Check camera permissions first
      await initializeCameraPermissions();
      
      console.log('🎥 Initializing Zoom Video SDK...');
      const client = ZoomVideo.createClient();
      zoomClientRef.current = client;

      await client.init('en-US', 'Global');

      console.log('📞 Requesting video session from backend...');
      const { data } = await apiClient.post('/zoom/create-meeting', {
        participantId,
        topic: `Quluub Call with ${participantName}`,
      });

      const { sdkJWT, sessionName, userName } = data;
      if (!sdkJWT || !sessionName) {
        throw new Error('Missing SDK credentials from backend.');
      }

      await client.join(sessionName, sdkJWT, userName);
      console.log('✅ Joined Zoom session successfully.');

      mediaStreamRef.current = client.getMediaStream();

      // Start video stream
      try {
        await mediaStreamRef.current.startVideo();
        console.log('📹 Video stream started');
      } catch (err) {
        console.error('❌ Failed to start video stream:', err);
      }

      setCallActive(true);
      
      // Wait for UI to render then attach video streams
      setTimeout(async () => {
        try {
          const currentUser = client.getCurrentUserInfo();
          console.log('👤 Current user info:', currentUser);
          
          // Clear any existing video content
          if (localPlayerRef.current) {
            localPlayerRef.current.srcObject = null;
          }
          
          // Attach local video stream
          await attachVideoStream({
            element: localPlayerRef.current,
            userId: currentUser.userId,
            label: 'Local'
          });
        } catch (err) {
          console.error('❌ Error attaching local video:', err);
        }
      }, 1000);
      
      console.log('📞 Call is now active, timer starting...');
      toast({ title: '📞 Call Started', description: `Call with ${participantName} is live.` });

      // Handle remote users joining
      client.on('user-added', async (payload) => {
        console.log('👤 User added:', payload);
        
        for (const user of payload) {
          const currentUser = client.getCurrentUserInfo();
          if (user.userId !== currentUser.userId) {
            setTimeout(async () => {
              await attachVideoStream({
                element: remotePlayerRef.current,
                userId: user.userId,
                label: 'Remote'
              });
            }, 500);
            break; // Attach first remote user
          }
        }
      });
      
      // Handle remote user leaving
      client.on('user-removed', () => {
        console.log('👤 Remote user left the call');
        toast({ title: '👋 User Left', description: 'The other participant has left the call.' });
      });

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

  const toggleVideo = async () => {
    if (mediaStreamRef.current) {
      if (videoEnabled) {
        await mediaStreamRef.current.stopVideo();
        toast({ title: 'Video Off' });
      } else {
        await mediaStreamRef.current.startVideo();
        toast({ title: 'Video On' });
      }
      setVideoEnabled(!videoEnabled);
    }
  };

  const toggleAudio = async () => {
    if (mediaStreamRef.current) {
      if (audioEnabled) {
        await mediaStreamRef.current.muteAudio();
        toast({ title: 'Audio Muted' });
      } else {
        await mediaStreamRef.current.unmuteAudio();
        toast({ title: 'Audio Unmuted' });
      }
      setAudioEnabled(!audioEnabled);
    }
  };

  return (
    <>
      {callActive ? (
        <Dialog open={callActive} onOpenChange={(open) => {
          if (!open) {
            handleCallEnd();
          }
        }}>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 bg-black">
            <DialogHeader className="p-4 text-white">
              <DialogTitle>Call with {participantName}</DialogTitle>
              <DialogDescription>Video call with {participantName} is active.</DialogDescription>
            </DialogHeader>
            <div className="flex-grow relative bg-black">
              {/* Main video area (remote participant) */}
              <video 
                ref={remotePlayerRef} 
                className="w-full h-full object-cover" 
                playsInline 
                autoPlay 
                muted={false}
                style={{ 
                  backgroundColor: '#1a1a1a',
                  display: 'block',
                  visibility: 'visible'
                }}
              />
              
              {/* Local video (picture-in-picture) - responsive sizing */}
              <video 
                ref={localPlayerRef} 
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
                  {videoEnabled ? ' Video On' : ' Video Off'}
                </div>
                <div className="bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                  {audioEnabled ? '🔊 Audio On' : '🔇 Audio Off'}
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
            {isLoading ? 'Starting Call...' : `Start Video Call with ${participantName}`}
          </Button>
        </div>
      )}
    </>
  );
};
