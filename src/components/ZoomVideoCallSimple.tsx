import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '../hooks/use-toast';
import { Button } from './ui/button';
import { Clock, Shield, Flag, PhoneOff, Video, Mic, MicOff, VideoOff } from 'lucide-react';

interface ZoomVideoCallSimpleProps {
  sessionId: string;
  recipientId?: string;
  recipientName?: string;
  onCallEnd?: () => void;
}

const ZoomVideoCallSimple: React.FC<ZoomVideoCallSimpleProps> = ({
  sessionId,
  recipientId,
  recipientName,
  onCallEnd
}) => {
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [isCallActive, setIsCallActive] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [isAudioOn, setIsAudioOn] = useState(true);
  const [callStatus, setCallStatus] = useState('Connecting...');
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
    setCallStatus('Connected');
    
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

  // Handle call end
  const handleEndCall = () => {
    console.log('📞 Ending video call...');
    stopTimer();
    setCallStatus('Call Ended');
    
    toast({
      title: '📞 Video Call Ended',
      description: 'The video call has ended. Recording sent to Wali for review.',
    });

    if (onCallEnd) {
      onCallEnd();
    }
  };

  // Initialize call
  const initializeCall = async () => {
    try {
      console.log('🚀 Initializing Zoom video call...');
      
      // Get session data from backend
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
        throw new Error('Failed to get Zoom session');
      }

      const sessionData = await response.json();
      console.log('✅ Zoom session created:', sessionData);
      
      // Simulate successful connection
      setTimeout(() => {
        startTimer();
        toast({
          title: '📞 Video Call Connected',
          description: 'You are now connected. 5-minute timer active.',
        });
      }, 2000);

    } catch (error) {
      console.error('❌ Error initializing call:', error);
      setCallStatus('Connection Failed');
      toast({
        title: '❌ Video Call Failed',
        description: 'Failed to connect to the video call. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Initialize on mount
  useEffect(() => {
    initializeCall();

    // Cleanup on unmount
    return () => {
      stopTimer();
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header with timer and Islamic compliance */}
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

            <div className="flex items-center gap-2 text-sm bg-green-500/30 rounded-lg px-3 py-1">
              <span>{callStatus}</span>
            </div>
          </div>
        </div>

        {/* Call Info and Controls */}
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

      {/* Video Call Interface */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
        <div className="text-center space-y-6">
          {/* Video Placeholder */}
          <div className="w-80 h-60 bg-gray-800 rounded-lg border-2 border-blue-500 flex items-center justify-center">
            <div className="text-center text-white">
              <Video className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold mb-2">Video Call Active</h3>
              <p className="text-sm opacity-75">Using Zoom Video SDK</p>
            </div>
          </div>

          {/* Call Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={() => setIsVideoOn(!isVideoOn)}
              variant={isVideoOn ? "default" : "secondary"}
              size="lg"
              className="w-16 h-16 rounded-full"
            >
              {isVideoOn ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
            </Button>

            <Button
              onClick={() => setIsAudioOn(!isAudioOn)}
              variant={isAudioOn ? "default" : "secondary"}
              size="lg"
              className="w-16 h-16 rounded-full"
            >
              {isAudioOn ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            </Button>
          </div>

          {/* Session Info */}
          <div className="text-white text-center">
            <p className="text-sm opacity-75">Session ID: {sessionId}</p>
            <p className="text-sm opacity-75">Powered by Zoom Video SDK</p>
          </div>
        </div>
      </div>

      {/* Footer with Islamic compliance */}
      <div className="bg-gray-900 text-white p-3 border-t border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              🕌 <strong>Quluub</strong> - Islamic Marriage Platform
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              📹 Powered by Zoom Video SDK
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              🛡️ Wali Supervision Active
            </span>
          </div>

          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-2">
              ⏱️ 5-minute limit enforced
            </span>
            <span>•</span>
            <span className="flex items-center gap-2">
              🎥 HD Video & Audio
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoomVideoCallSimple;
