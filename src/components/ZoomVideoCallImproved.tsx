import React, { useEffect, useRef, useState } from 'react';
import uitoolkit from '@zoom/videosdk-ui-toolkit';
import '@zoom/videosdk-ui-toolkit/dist/videosdk-ui-toolkit.css';
import type { OldUIkitFeature } from '@zoom/videosdk-ui-toolkit';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { 
  Clock, 
  Shield, 
  PhoneOff, 
  Users, 
  Settings, 
  MessageCircle, 
  Video, 
  VideoOff,
  Mic,
  MicOff,
  Crown,
  Heart,
  UserPlus
} from 'lucide-react';
import socket from '../lib/socket';

interface ZoomVideoCallImprovedProps {
  sessionId: string;
  recipientId?: string;
  recipientName?: string;
  onCallEnd?: () => void;
  isIncomingCall?: boolean;
  callId?: string;
}

const ZoomVideoCallImproved: React.FC<ZoomVideoCallImprovedProps> = ({
  sessionId,
  recipientId,
  recipientName,
  onCallEnd,
  isIncomingCall = false,
  callId
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const sessionContainerRef = useRef<HTMLDivElement>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [isCallActive, setIsCallActive] = useState(false);
  const [participants, setParticipants] = useState<number>(0);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [callStatus, setCallStatus] = useState<'connecting' | 'connected' | 'ended'>('connecting');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get time color based on remaining time
  const getTimeColor = () => {
    if (timeLeft <= 60) return 'text-red-500'; // Last minute
    if (timeLeft <= 120) return 'text-orange-500'; // Last 2 minutes
    return 'text-green-500';
  };

  // Start 5-minute countdown timer
  const startTimer = () => {
    console.log('🕐 Starting 5-minute countdown timer...');
    setIsCallActive(true);
    setCallStatus('connected');
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          console.log('⏰ 5-minute limit reached, ending call...');
          endCall('time_limit');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Send invitation to recipient
  const sendInvitation = async () => {
    if (!recipientId) return;
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/zoom/send-invitation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipientId,
          sessionId,
          callId
        })
      });

      if (response.ok) {
        console.log('📧 Invitation sent successfully');
        toast({
          title: "Invitation Sent",
          description: `Video call invitation sent to ${recipientName}`,
        });
      }
    } catch (error) {
      console.error('Error sending invitation:', error);
    }
  };

  // Initialize Zoom session
  const initializeZoom = async () => {
    try {
      console.log('🚀 Initializing Zoom session...');
      
      const endpoint = isIncomingCall ? '/zoom/join-session' : '/zoom/session';
      const body = isIncomingCall 
        ? { sessionId, callId }
        : { sessionId, userRole: 1, recipientId };

      const response = await fetch(`${import.meta.env.VITE_API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const sessionData = await response.json();
      console.log('✅ Session data received:', sessionData);

      if (sessionContainerRef.current) {
        const config = {
          videoSDKJWT: sessionData.signature,
          sessionName: sessionData.sessionId,
          userName: sessionData.userName,
          sessionPasscode: sessionData.sessionKey || '',
          features: ['preview', 'video', 'audio', 'settings', 'users', 'chat', 'share'] as OldUIkitFeature[],
          options: {
            init: {
              enforceMultipleVideos: false
            }
          }
        };

        console.log('🔧 Initializing UI Toolkit with config:', config);
        
        await uitoolkit.joinSession(sessionContainerRef.current, config);
        setIsJoined(true);
        setParticipants(1);
        startTimer();

        // Send invitation if this is not an incoming call
        if (!isIncomingCall) {
          await sendInvitation();
        }

        // Notify Wali about call start
        if (recipientId) {
          notifyWaliCallStart();
        }

        toast({
          title: "Call Connected",
          description: "Video call started successfully",
        });
      }
    } catch (error) {
      console.error('❌ Error initializing Zoom:', error);
      toast({
        title: "Connection Failed",
        description: "Failed to connect to video call",
        variant: "destructive"
      });
    }
  };

  // Notify Wali about call start
  const notifyWaliCallStart = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/zoom/notify-wali`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          recipientId,
          action: 'call_started',
          duration: 0
        })
      });
    } catch (error) {
      console.error('Error notifying Wali:', error);
    }
  };

  // End call function
  const endCall = async (reason: string = 'user_ended') => {
    console.log(`📞 Ending call. Reason: ${reason}`);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    try {
      await uitoolkit.closeSession(sessionContainerRef.current!);
      
      // Notify Wali about call end
      if (recipientId) {
        await fetch(`${import.meta.env.VITE_API_URL}/api/zoom/notify-wali`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            recipientId,
            action: 'call_ended',
            duration: 300 - timeLeft
          })
        });
      }

      setCallStatus('ended');
      toast({
        title: "Call Ended",
        description: reason === 'time_limit' ? "5-minute time limit reached" : "Call ended",
      });

      if (onCallEnd) {
        onCallEnd();
      }
    } catch (error) {
      console.error('Error ending call:', error);
    }
  };

  useEffect(() => {
    initializeZoom();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header Controls */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-between p-4">
          {/* Left side - Call info */}
          <div className="flex items-center space-x-4">
            <Badge variant="secondary" className="bg-purple-500/20 text-purple-200 border-purple-400">
              <Crown className="w-3 h-3 mr-1" />
              Premium Call
            </Badge>
            <Badge variant="secondary" className="bg-green-500/20 text-green-200 border-green-400">
              <Shield className="w-3 h-3 mr-1" />
              Wali Supervised
            </Badge>
            {recipientName && (
              <Badge variant="secondary" className="bg-blue-500/20 text-blue-200 border-blue-400">
                <Heart className="w-3 h-3 mr-1" />
                {recipientName}
              </Badge>
            )}
          </div>

          {/* Center - Timer */}
          <Card className="bg-black/30 border-white/20">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <Clock className={`w-4 h-4 ${getTimeColor()}`} />
                <span className={`font-mono text-lg font-bold ${getTimeColor()}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Right side - Participants */}
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20">
              <Users className="w-3 h-3 mr-1" />
              {participants} participant{participants !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Video Container */}
      <div className="h-full w-full pt-20 pb-20">
        <div 
          ref={sessionContainerRef} 
          className="h-full w-full rounded-lg overflow-hidden shadow-2xl"
          style={{ minHeight: '400px' }}
        />
      </div>

      {/* Bottom Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/20 backdrop-blur-sm">
        <div className="flex items-center justify-center p-6 space-x-4">
          {/* Video Toggle */}
          <Button
            variant={isVideoOn ? "default" : "destructive"}
            size="lg"
            className="rounded-full w-14 h-14"
            onClick={() => setIsVideoOn(!isVideoOn)}
          >
            {isVideoOn ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
          </Button>

          {/* Audio Toggle */}
          <Button
            variant={isAudioOn ? "default" : "destructive"}
            size="lg"
            className="rounded-full w-14 h-14"
            onClick={() => setIsAudioOn(!isAudioOn)}
          >
            {isAudioOn ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
          </Button>

          {/* End Call */}
          <Button
            variant="destructive"
            size="lg"
            className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600"
            onClick={() => endCall('user_ended')}
          >
            <PhoneOff className="w-8 h-8" />
          </Button>

          {/* Chat */}
          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-14 h-14 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <MessageCircle className="w-6 h-6" />
          </Button>

          {/* Settings */}
          <Button
            variant="outline"
            size="lg"
            className="rounded-full w-14 h-14 bg-white/10 border-white/20 text-white hover:bg-white/20"
          >
            <Settings className="w-6 h-6" />
          </Button>
        </div>

        {/* Status Messages */}
        <div className="text-center pb-4">
          {callStatus === 'connecting' && (
            <p className="text-white/70 text-sm">Connecting to video call...</p>
          )}
          {callStatus === 'connected' && timeLeft <= 60 && (
            <p className="text-red-400 text-sm font-semibold animate-pulse">
              ⚠️ Call will end in {formatTime(timeLeft)}
            </p>
          )}
          {!isIncomingCall && recipientId && (
            <p className="text-white/70 text-sm">
              Invitation sent to {recipientName}. Waiting for them to join...
            </p>
          )}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-1/4 left-10 w-20 h-20 bg-purple-500/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute bottom-1/4 right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-xl animate-pulse" />
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-40 h-40 bg-indigo-500/5 rounded-full blur-2xl animate-pulse" />
    </div>
  );
};

export default ZoomVideoCallImproved;
