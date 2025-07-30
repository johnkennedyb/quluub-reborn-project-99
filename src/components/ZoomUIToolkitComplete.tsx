import React, { useEffect, useRef, useState } from 'react';
import uitoolkit from '@zoom/videosdk-ui-toolkit';
import '@zoom/videosdk-ui-toolkit/dist/videosdk-ui-toolkit.css';
import type { OldUIkitFeature } from '@zoom/videosdk-ui-toolkit';
import { useToast } from '../hooks/use-toast';
import { useAuth } from '../contexts/AuthContext';
import { Button } from './ui/button';
import { Clock, Shield, Flag, PhoneOff, Users, Settings, MessageCircle } from 'lucide-react';
import socket from '../lib/socket';

interface ZoomUIToolkitCompleteProps {
  sessionId: string;
  recipientId?: string;
  recipientName?: string;
  onCallEnd?: () => void;
  isIncomingCall?: boolean;
}

const ZoomUIToolkitComplete: React.FC<ZoomUIToolkitCompleteProps> = ({
  sessionId,
  recipientId,
  recipientName,
  onCallEnd,
  isIncomingCall = false
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const sessionContainerRef = useRef<HTMLDivElement>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [isCallActive, setIsCallActive] = useState(false);
  const [participants, setParticipants] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Start 5-minute countdown timer
  const startTimer = () => {
    console.log('🕐 Starting 5-minute countdown timer...');
    setIsCallActive(true);
    
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          console.log('⏰ 5-minute limit reached, ending call...');
          handleEndCall();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Stop timer
  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsCallActive(false);
  };

  // Handle session joined
  const handleSessionJoined = () => {
    console.log('✅ Zoom UI Toolkit session joined successfully');
    setIsJoined(true);
    startTimer();
    
    toast({
      title: '📞 Video Call Started',
      description: 'You have joined the video call. 5-minute timer active.',
    });

    // Notify other participant if this is the caller
    if (!isIncomingCall && recipientId) {
      socket.emit('video-call-joined', {
        sessionId,
        callerId: user?._id,
        recipientId
      });
    }
  };

  // Handle session closed
  const handleSessionClosed = () => {
    console.log('📞 Zoom UI Toolkit session closed');
    setIsJoined(false);
    stopTimer();
    setTimeLeft(300);
    
    // Clean up UI Toolkit components
    if (sessionContainerRef.current) {
      uitoolkit.hideAllComponents();
    }

    toast({
      title: '📞 Video Call Ended',
      description: 'The video call has ended. Recording sent to Wali for review.',
    });

    // Notify other participant
    if (recipientId) {
      socket.emit('video-call-ended', {
        sessionId,
        callerId: user?._id,
        recipientId
      });
    }

    if (onCallEnd) {
      onCallEnd();
    }
  };

  // Handle manual call end
  const handleEndCall = () => {
    console.log('📞 Ending video call manually...');
    stopTimer();
    
    if (sessionContainerRef.current) {
      uitoolkit.closeSession(sessionContainerRef.current);
    }
  };

  // Join session with UI Toolkit
  const joinSession = async () => {
    if (!sessionContainerRef.current) {
      console.error('❌ Session container not found');
      return;
    }

    try {
      console.log('🚀 Joining Zoom session with UI Toolkit...');
      
      // Get JWT token from backend
      const response = await fetch('http://localhost:5000/api/zoom/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sessionId,
          userRole: 1,
          recipientId
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get Zoom session token');
      }

      const sessionData = await response.json();
      
      // Configure UI Toolkit session with exact format expected by Zoom
      const config = {
        videoSDKJWT: sessionData.signature,
        sessionName: sessionId,
        userName: user ? `${user.fname} ${user.lname}` : 'User',
        sessionPasscode: sessionData.sessionKey || '',
        features: ['preview', 'video', 'audio', 'settings', 'users', 'chat', 'share'] as OldUIkitFeature[],
        options: {
          init: {
            enforceMultipleVideos: false
          }
        }
      };

      console.log('🎯 UI Toolkit config:', config);

      // Join session with UI Toolkit
      await uitoolkit.joinSession(sessionContainerRef.current, config);
      
      // Set up event listeners
      uitoolkit.onSessionJoined(handleSessionJoined);
      uitoolkit.onSessionClosed(handleSessionClosed);

    } catch (error) {
      console.error('❌ Error joining Zoom session:', error);
      toast({
        title: '❌ Video Call Failed',
        description: 'Failed to join the video call. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Initialize session on component mount
  useEffect(() => {
    joinSession();

    // Cleanup on unmount
    return () => {
      stopTimer();
      if (sessionContainerRef.current) {
        uitoolkit.closeSession(sessionContainerRef.current);
      }
      
      // Remove event listeners
      uitoolkit.offSessionJoined(handleSessionJoined);
      uitoolkit.offSessionClosed(handleSessionClosed);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Enhanced Header with Islamic Compliance and Timer */}
      <div className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white p-4 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-6">
          {/* Timer Display */}
          <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
            <Clock className="h-5 w-5" />
            <span className="font-mono text-xl font-bold">
              {formatTime(timeLeft)}
            </span>
          </div>
          
          {/* Islamic Compliance Badges */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm bg-white/10 rounded-lg px-3 py-1">
              <Shield className="h-4 w-4" />
              <span>Islamic Compliant</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm bg-white/10 rounded-lg px-3 py-1">
              <Flag className="h-4 w-4" />
              <span>Wali Supervised</span>
            </div>

            {isJoined && (
              <div className="flex items-center gap-2 text-sm bg-green-500/30 rounded-lg px-3 py-1">
                <Users className="h-4 w-4" />
                <span>Connected</span>
              </div>
            )}
          </div>
        </div>

        {/* Call Controls */}
        <div className="flex items-center gap-3">
          {recipientName && (
            <div className="text-right">
              <div className="text-sm opacity-80">Connected with</div>
              <div className="font-semibold">{recipientName}</div>
            </div>
          )}

          <Button
            onClick={handleEndCall}
            variant="destructive"
            size="sm"
            className="bg-red-600 hover:bg-red-700 shadow-lg"
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            End Call
          </Button>
        </div>
      </div>

      {/* Zoom UI Toolkit Container - Full Featured */}
      <div 
        ref={sessionContainerRef}
        className="flex-1 w-full h-full bg-gray-900"
        style={{ minHeight: 'calc(100vh - 140px)' }}
      />

      {/* Enhanced Footer with Islamic Compliance and Features */}
      <div className="bg-gray-900 text-white p-3 border-t border-gray-700">
        <div className="flex items-center justify-between">
          {/* Islamic Compliance Message */}
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              🕌 <strong>Quluub</strong> - Islamic Marriage Platform
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              📹 Powered by Zoom Video SDK UI Toolkit
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              🛡️ Wali Supervision Active
            </span>
          </div>

          {/* Features Available */}
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              ⏱️ 5-minute limit enforced
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              🎥 HD Video & Audio
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              💬 Built-in Chat
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              📱 Screen Share
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoomUIToolkitComplete;
