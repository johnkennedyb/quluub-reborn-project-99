import React, { useEffect, useRef, useState } from 'react';
import uitoolkit from '@zoom/videosdk-ui-toolkit';
import '@zoom/videosdk-ui-toolkit/dist/videosdk-ui-toolkit.css';
import { useToast } from '../hooks/use-toast';
import { Button } from './ui/button';
import { Clock, Phone, PhoneOff, Shield, Flag } from 'lucide-react';

interface ZoomUIToolkitProps {
  sessionId: string;
  userName: string;
  userRole?: number;
  onSessionJoined?: () => void;
  onSessionClosed?: () => void;
  onCallEnd?: () => void;
}

const ZoomUIToolkit: React.FC<ZoomUIToolkitProps> = ({
  sessionId,
  userName,
  userRole = 1,
  onSessionJoined,
  onSessionClosed,
  onCallEnd
}) => {
  const { toast } = useToast();
  const sessionContainerRef = useRef<HTMLDivElement>(null);
  const [isJoined, setIsJoined] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes in seconds
  const [isCallActive, setIsCallActive] = useState(false);
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

    if (onSessionJoined) {
      onSessionJoined();
    }
  };

  // Handle session closed
  const handleSessionClosed = () => {
    console.log('📞 Zoom UI Toolkit session closed');
    setIsJoined(false);
    stopTimer();
    setTimeLeft(300); // Reset timer
    
    // Clean up UI Toolkit components
    if (sessionContainerRef.current) {
      uitoolkit.hideAllComponents();
    }

    toast({
      title: '📞 Video Call Ended',
      description: 'The video call has ended.',
    });

    if (onSessionClosed) {
      onSessionClosed();
    }
  };

  // Handle manual call end
  const handleEndCall = () => {
    console.log('📞 Ending video call manually...');
    stopTimer();
    
    if (sessionContainerRef.current) {
      uitoolkit.closeSession(sessionContainerRef.current);
    }

    if (onCallEnd) {
      onCallEnd();
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
      const response = await fetch('/api/zoom/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          sessionId,
          userRole
        })
      });

      if (!response.ok) {
        throw new Error('Failed to get Zoom session token');
      }

      const sessionData = await response.json();
      
      // Configure UI Toolkit session
      const config = {
        videoSDKJWT: sessionData.signature,
        sessionName: sessionId,
        userName: userName,
        sessionPasscode: sessionData.sessionKey || '',
        features: [
          'preview',
          'video',
          'audio',
          'settings',
          'users',
          'chat',
          'leave',
          'virtualBackground',
          'footer',
          'header'
        ]
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
      {/* Header with timer and Islamic compliance */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            <span className="font-mono text-lg">
              {formatTime(timeLeft)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Shield className="h-4 w-4" />
            <span>Islamic Compliant</span>
          </div>
          
          <div className="flex items-center gap-2 text-sm">
            <Flag className="h-4 w-4" />
            <span>Wali Supervised</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleEndCall}
            variant="destructive"
            size="sm"
            className="bg-red-600 hover:bg-red-700"
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            End Call
          </Button>
        </div>
      </div>

      {/* Zoom UI Toolkit Container */}
      <div 
        ref={sessionContainerRef}
        className="flex-1 w-full h-full"
        style={{ minHeight: 'calc(100vh - 80px)' }}
      />

      {/* Footer with Islamic compliance message */}
      <div className="bg-gray-800 text-white p-2 text-center text-sm">
        <div className="flex items-center justify-center gap-4">
          <span>🕌 Islamic Marriage Platform</span>
          <span>•</span>
          <span>📹 Powered by Zoom</span>
          <span>•</span>
          <span>🛡️ Wali Supervision Active</span>
          <span>•</span>
          <span>⏱️ 5-minute limit enforced</span>
        </div>
      </div>
    </div>
  );
};

export default ZoomUIToolkit;
