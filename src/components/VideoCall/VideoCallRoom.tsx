import React, { useEffect, useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { Phone, PhoneOff, Mic, MicOff, Video, VideoOff, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { webrtcService } from '@/services/webrtcService';
import { recordingService } from '@/services/recordingService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'react-hot-toast';

const VideoCallRoom: React.FC = () => {
  const { callId } = useParams<{ callId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const callerId = searchParams.get('caller');
  const recipientId = searchParams.get('recipient');
  
  const [isInCall, setIsInCall] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const callStartTimeRef = useRef<number | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!user || !callId || !callerId || !recipientId) {
      toast.error('Invalid video call link');
      navigate('/');
      return;
    }

    // Check if user is authorized to join this call
    if (user._id !== callerId && user._id !== recipientId) {
      toast.error('You are not authorized to join this call');
      navigate('/');
      return;
    }

    initializeCall();

    return () => {
      cleanup();
    };
  }, [callId, callerId, recipientId, user, navigate]);

  const initializeCall = async () => {
    try {
      setIsConnecting(true);
      setConnectionStatus('connecting');

      // Set up WebRTC callbacks
      webrtcService.setCallbacks({
        onIncomingCall: () => {},
        onCallAccepted: () => {
          setConnectionStatus('connected');
          setIsInCall(true);
          startCallTimer();
          startRecording();
        },
        onCallRejected: () => {
          toast.error('Call was rejected');
          navigate('/');
        },
        onCallEnded: () => {
          handleEndCall();
        },
        onCallCancelled: () => {
          toast.error('Call was cancelled');
          navigate('/');
        },
        onRemoteStream: (stream: MediaStream) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = stream;
          }
        },
        onConnectionStateChange: (state: RTCPeerConnectionState) => {
          console.log('Connection state:', state);
          if (state === 'connected') {
            setConnectionStatus('connected');
          } else if (state === 'disconnected' || state === 'failed') {
            setConnectionStatus('disconnected');
          }
        }
      });

      // Determine if this user is the caller or recipient
      const isInitiator = user._id === callerId;
      
      if (isInitiator) {
        // Caller initiates the call
        const recipientUser = await fetchUserById(recipientId);
        if (recipientUser) {
          await webrtcService.initiateCall(recipientId);
          toast.success('Calling...');
        }
      } else {
        // Recipient waits for call
        toast.success('Waiting for caller to connect...');
      }

      // Get local stream and display it
      const localStream = webrtcService.getLocalStream();
      if (localStream && localVideoRef.current) {
        localVideoRef.current.srcObject = localStream;
      }

    } catch (error) {
      console.error('Error initializing call:', error);
      toast.error('Failed to initialize video call');
      navigate('/');
    } finally {
      setIsConnecting(false);
    }
  };

  const fetchUserById = async (userId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Error fetching user:', error);
      return null;
    }
  };

  const startCallTimer = () => {
    callStartTimeRef.current = Date.now();
    durationIntervalRef.current = setInterval(() => {
      if (callStartTimeRef.current) {
        const duration = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
        setCallDuration(duration);
      }
    }, 1000);
  };

  const startRecording = async () => {
    try {
      const localStream = webrtcService.getLocalStream();
      const remoteStream = webrtcService.getRemoteStream();
      
      if (localStream && remoteStream) {
        const combinedStream = recordingService.createCombinedStream(localStream, remoteStream);
        await recordingService.startRecording(combinedStream);
        setIsRecording(true);
        toast.success('📹 Recording started');
      }
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  };

  const handleEndCall = async () => {
    try {
      if (isRecording) {
        const recordingBlob = await recordingService.stopRecording();
        if (recordingBlob && callId) {
          await recordingService.uploadRecording(recordingBlob, callId);
          toast.success('📹 Recording uploaded and sent to Wali');
        }
        setIsRecording(false);
      }

      await webrtcService.endCall();
      cleanup();
      navigate('/');
      
    } catch (error) {
      console.error('Error ending call:', error);
      navigate('/');
    }
  };

  const cleanup = () => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    setIsInCall(false);
    setConnectionStatus('disconnected');
    setCallDuration(0);
  };

  const toggleVideo = () => {
    const enabled = webrtcService.toggleVideo();
    setIsVideoEnabled(enabled);
  };

  const toggleAudio = () => {
    const enabled = webrtcService.toggleAudio();
    setIsAudioEnabled(enabled);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Users className="text-white" size={24} />
          <div className="text-white">
            <h1 className="text-lg font-semibold">Video Call</h1>
            <p className="text-sm text-gray-300">
              {connectionStatus === 'connected' ? `Duration: ${formatDuration(callDuration)}` : 
               connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </p>
          </div>
        </div>
        
        {isRecording && (
          <div className="flex items-center gap-2 text-red-400">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm">Recording</span>
          </div>
        )}
      </div>

      {/* Video Area */}
      <div className="flex-1 relative">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover bg-gray-800"
        />
        
        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute top-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden border-2 border-white">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        </div>

        {/* Connection Status Overlay */}
        {connectionStatus !== 'connected' && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <Card className="p-6 text-center">
              <div className="text-lg font-semibold mb-2">
                {isConnecting ? 'Connecting...' : 'Waiting for connection'}
              </div>
              <div className="text-gray-600">
                {isConnecting ? 'Setting up video call...' : 'Please wait for the other participant to join'}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-4 flex justify-center gap-4">
        <Button
          onClick={toggleAudio}
          variant={isAudioEnabled ? "default" : "destructive"}
          size="lg"
          className="rounded-full w-12 h-12"
        >
          {isAudioEnabled ? <Mic size={20} /> : <MicOff size={20} />}
        </Button>
        
        <Button
          onClick={toggleVideo}
          variant={isVideoEnabled ? "default" : "destructive"}
          size="lg"
          className="rounded-full w-12 h-12"
        >
          {isVideoEnabled ? <Video size={20} /> : <VideoOff size={20} />}
        </Button>
        
        <Button
          onClick={handleEndCall}
          variant="destructive"
          size="lg"
          className="rounded-full w-12 h-12"
        >
          <PhoneOff size={20} />
        </Button>
      </div>
    </div>
  );
};

export default VideoCallRoom;
