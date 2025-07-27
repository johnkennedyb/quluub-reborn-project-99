import React, { useState, useEffect, useRef, useCallback } from 'react';
import ZoomVideo from '@zoom/videosdk';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
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

  const handleCallEnd = useCallback(async () => {
    console.log('📞 Ending call...');
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (zoomClientRef.current) {
      try {
        await zoomClientRef.current.leave();
      } catch (error) {
        console.error("Error during call cleanup:", error);
      }
      zoomClientRef.current = null;
      mediaStreamRef.current = null;
    }
    setCallActive(false);
    if (onCallEnd) {
      onCallEnd();
    }
    toast({ title: "Call Ended", description: `Your call with ${participantName} has ended.` });
  }, [onCallEnd, participantName, toast]);

  useEffect(() => {
    // Timer effect
    if (callActive) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prevTime => {
          if (prevTime <= 1) {
            handleCallEnd();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callActive, handleCallEnd]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (zoomClientRef.current) {
        handleCallEnd();
      }
    };
  }, [handleCallEnd]);

  const startCall = async () => {
    setIsLoading(true);
    try {
      const sessionKey = `quluub-call-${[user?._id, participantId].sort().join('-')}`;
      
      console.log(`🔑 Requesting Video SDK JWT for session: ${sessionKey}`);
      const { data } = await apiClient.post('/zoom/get-sdk-token', { sessionKey });
      const { sdkJWT } = data;

      if (!sdkJWT) {
        throw new Error('Missing SDK JWT from server.');
      }

      const client = ZoomVideo.createClient();
      zoomClientRef.current = client;

      await client.init('en-US', 'Global', { patchJsMedia: true });

      client.on('peer-video-state-change', async (payload: any) => {
        const { action, userId } = payload;
        if (remotePlayerRef.current && mediaStreamRef.current) {
          if (action === 'Start') {
            await mediaStreamRef.current.renderVideo(remotePlayerRef.current, userId, 1280, 720, 0, 0, 3);
          } else if (action === 'Stop') {
            await mediaStreamRef.current.stopRenderVideo(remotePlayerRef.current, userId);
          }
        }
      });

      client.on('user-removed', () => {
        handleCallEnd();
      });
      
      client.on('connection-change', (payload: any) => {
        if (payload.state === 'Disconnected') {
          handleCallEnd();
        }
      });

      await client.join(sessionKey, sdkJWT, user?.fname || 'Quluub User');
      const stream = client.getMediaStream();
      mediaStreamRef.current = stream;

      if (localPlayerRef.current) {
        await stream.startVideo({ videoElement: localPlayerRef.current });
      }
      await stream.startAudio();
      
      setVideoEnabled(true);
      setAudioEnabled(true);
      setCallActive(true);
      toast({ title: "Call Started", description: `Your call with ${participantName} has begun.` });

    } catch (error) {
      console.error('💥 Failed to start call:', error);
      toast({ title: 'Error', description: 'Could not start the video call. Please try again.', variant: 'destructive' });
      await handleCallEnd();
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVideo = async () => {
    if (mediaStreamRef.current) {
      try {
        if (videoEnabled) {
          await mediaStreamRef.current.stopVideo();
        } else {
          if (localPlayerRef.current) {
            await mediaStreamRef.current.startVideo({ videoElement: localPlayerRef.current });
          }
        }
        setVideoEnabled(!videoEnabled);
      } catch (err) {
        console.error('Error toggling video', err);
      }
    }
  };

  const toggleAudio = async () => {
    if (mediaStreamRef.current) {
      try {
        if (audioEnabled) {
          await mediaStreamRef.current.muteAudio();
        } else {
          await mediaStreamRef.current.unmuteAudio();
        }
        setAudioEnabled(!audioEnabled);
      } catch (err) {
        console.error('Error toggling audio', err);
      }
    }
  };

  return (
    <>
      {!callActive ? (
        <Card className="w-full max-w-md mx-auto my-8 bg-gray-800 text-white border-gray-700">
          <CardHeader>
            <CardTitle className="flex flex-col items-center text-center">
              <Crown className="w-8 h-8 text-yellow-500 mb-2" />
              <span className="text-2xl">Premium Video Call</span>
              <Badge variant="outline" className="mt-2 border-green-500 text-green-500">
                Wali Supervised
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center gap-4">
            <img
              src={`https://ui-avatars.com/api/?name=${participantName.replace(/\s/g, '+')}&background=random&size=96&color=fff`}
              alt={participantName}
              className="w-24 h-24 rounded-full border-4 border-blue-500 shadow-lg"
            />
            <p>You are about to start a call with <span className="font-bold">{participantName}</span>.</p>
            
            <div className="text-xs text-muted-foreground bg-gray-700 p-3 rounded-lg">
              <p className="font-bold mb-2">Please remember:</p>
              <ul className="list-disc list-inside text-left">
                <li>• 5-minute duration limit</li>
                <li>• Automatic cloud recording</li>
                <li>• Wali supervision notification</li>
                <li>• Islamic compliance monitoring</li>
              </ul>
            </div>
            
            <Button 
              onClick={startCall}
              disabled={isLoading}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Creating Call...
                </> 
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  Start Video Call
                </>
              )}
            </Button>
            
            <p className="text-xs text-center text-muted-foreground">
              This call will be recorded and sent to the Wali for Islamic supervision
            </p>
          </CardContent>
        </Card>
      ) : (
        <Dialog open={callActive} onOpenChange={(isOpen) => !isOpen && handleCallEnd()}>
          <DialogContent className="bg-gray-900 text-white p-0 border-0 max-w-4xl w-full h-[90vh] flex flex-col">
            <DialogHeader className="p-4 flex-shrink-0">
              <DialogTitle className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  <span className="font-semibold">Video Call with {participantName}</span>
                  <Badge variant="outline" className="border-green-500 text-green-500">
                    Premium Feature
                  </Badge>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-yellow-400">
                    <Clock className="w-4 h-4" />
                    <span className="font-mono text-lg">
                      {formatTime(timeRemaining)}
                    </span>
                  </div>
                  {timeRemaining <= 60 && (
                    <Badge variant="destructive" className="animate-pulse">
                      ⚠️ 1 Minute Remaining
                    </Badge>
                  )}
                </div>
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 bg-gray-800 min-h-0 relative">
              <video ref={remotePlayerRef} id="remote-player" className="w-full h-full object-contain" autoPlay playsInline></video>
              <video ref={localPlayerRef} id="local-player" className="absolute bottom-4 right-4 border-2 border-gray-600 rounded-md w-32 h-24" autoPlay playsInline muted></video>
            </div>

            <DialogFooter className="bg-gray-900 p-4 flex justify-center gap-4 flex-shrink-0">
              <Button
                onClick={toggleVideo}
                variant={videoEnabled ? "default" : "destructive"}
                size="lg"
                className="rounded-full w-12 h-12"
              >
                {videoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
              </Button>
              <Button
                onClick={toggleAudio}
                variant={audioEnabled ? "default" : "destructive"}
                size="lg"
                className="rounded-full w-12 h-12"
              >
                {audioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              </Button>
              <Button
                onClick={handleCallEnd}
                variant="destructive"
                size="lg"
                className="rounded-full w-12 h-12"
              >
                <PhoneOff className="w-5 h-5" />
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};
