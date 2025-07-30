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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const attachVideoStreams = useCallback(() => {
    if (!callActive || !zoomClientRef.current || !mediaStreamRef.current) return;

    console.log('📹 Attaching video streams...');

    const stream = mediaStreamRef.current;
    const localVideoElement = localPlayerRef.current;
    const remoteVideoElement = remotePlayerRef.current;

    if (localVideoElement) {
      stream.attachVideo(localVideoElement, zoomClientRef.current.getCurrentUserInfo().userId)
        .then(() => console.log('✅ Local video attached.'))
        .catch((e: any) => console.error('❌ Error attaching local video:', e));
    }

    const handleUserAdded = (payload: any[]) => {
      const remoteUser = payload[0];
      if (remoteVideoElement && remoteUser) {
        console.log(`👤 Remote user ${remoteUser.displayName} joined. Attaching video.`);
        stream.attachVideo(remoteVideoElement, remoteUser.userId)
          .then(() => console.log('✅ Remote video attached.'))
          .catch((e: any) => console.error('❌ Error attaching remote video:', e));
      }
    };

    zoomClientRef.current.on('user-added', handleUserAdded);

    // Check for existing users
    const participants = zoomClientRef.current.getPlayoutUserList();
    if (participants.length > 0) {
      handleUserAdded(participants);
    }

  }, [callActive]);

  const handleCallEnd = useCallback(async () => {
    console.log('📞 Ending call...');
    
    // Clear timer first
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      console.log('🛑 Timer cleared');
    }
    
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
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [callActive, handleCallEnd]);

  useEffect(() => {
    const startCall = async () => {
      setIsLoading(true);
      try {
        console.log('🎥 Initializing Zoom Video SDK...');
        const client = ZoomVideo.createClient();
        zoomClientRef.current = client;

        await client.init('en-US', 'Global');
          // Attach local video
          console.log('📹 Attaching local video stream...');
          await mediaStream.attachVideo(localPlayerRef.current, currentUser.userId);
          console.log('✅ Local video attached.');

          // Handle remote participants
          const handleUserAdded = async (payload) => {
            console.log('👤 User added:', payload);
            for (const user of payload) {
              if (user.userId !== currentUser.userId) {
                console.log(`📹 Attaching video for remote user: ${user.userId}`);
                await mediaStream.attachVideo(remotePlayerRef.current, user.userId);
                console.log(`✅ Remote video attached for user: ${user.userId}`);
                break; // Attach first remote user
              }
            }
          };

          client.on('user-added', handleUserAdded);

          // Check for existing users already in the call
          const existingUsers = client.getParticipants();
          if (existingUsers.length > 1) {
            handleUserAdded(existingUsers);
          }

          return () => {
            client.off('user-added', handleUserAdded);
          };

        } catch (error) {
          console.error('💥 Error attaching video streams:', error);
        }
      }
    };

    attachVideoStreams();

  }, [callActive]);
  
  // Cleanup on unmount - only cleanup resources, don't call handleCallEnd
  useEffect(() => {
    return () => {
      // Only cleanup resources without triggering the full handleCallEnd flow
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (zoomClientRef.current) {
        try {
          zoomClientRef.current.leave();
        } catch (error) {
          console.error('Error during unmount cleanup:', error);
        }
      }
    };
  }, []); // Empty dependency array to only run on unmount

  const startCall = async () => {
    setIsLoading(true);
    try {
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
      
      // Start video and attach to local player
      await mediaStreamRef.current.startVideo();
      console.log('📹 Video stream started successfully');
      


      setCallActive(true);
      console.log('📞 Call is now active, attaching video streams...');
      attachVideoStreams(); // Attach video streams now that call is active
      toast({ title: '📞 Call Started', description: `Call with ${participantName} is live.` });

      // Handle remote user leaving
      client.on('user-removed', () => {
        console.log('👤 Remote user left the call');
        toast({ title: '👋 User Left', description: 'The other participant has left the call.' });
        // Optionally end the call when remote user leaves
        // handleCallEnd();
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
              <video ref={remotePlayerRef} className="w-full h-full object-cover" playsInline />
              <video ref={localPlayerRef} className="absolute bottom-4 right-4 w-48 h-36 object-cover border-2 border-white rounded-md" playsInline />
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
