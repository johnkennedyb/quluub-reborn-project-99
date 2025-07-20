import React, { useState, useEffect, useRef } from 'react';
import { X, Maximize2, Minimize2, Phone, Users, Shield, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { wherebyService, WherebyCallData, WherebyMeeting } from '../../services/wherebyService';
import { useAuth } from '../../contexts/AuthContext';

interface WherebyEmbeddedCallProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  isOpen: boolean;
  onClose: () => void;
  onCallStarted?: (callData: WherebyCallData) => void;
  onCallEnded?: (callData: WherebyCallData) => void;
  className?: string;
}

const WherebyEmbeddedCall: React.FC<WherebyEmbeddedCallProps> = ({
  recipientId,
  recipientName,
  recipientAvatar,
  isOpen,
  onClose,
  onCallStarted,
  onCallEnded,
  className = ''
}) => {
  const { user } = useAuth();
  const [isCreatingCall, setIsCreatingCall] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [callData, setCallData] = useState<WherebyCallData | null>(null);
  const [meeting, setMeeting] = useState<WherebyMeeting | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isRecording, setIsRecording] = useState(true); // Whereby auto-records
  
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const callStartTimeRef = useRef<number | null>(null);

  // Call duration timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isCallActive && callStartTimeRef.current) {
      interval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTimeRef.current!) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isCallActive]);

  // Initialize call when component opens
  useEffect(() => {
    if (isOpen && !isCallActive && !isCreatingCall) {
      handleStartCall();
    }
  }, [isOpen]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isCallActive) {
        wherebyService.endCall();
      }
    };
  }, []);

  const handleStartCall = async () => {
    if (!user) {
      toast.error('Please log in to start a video call');
      return;
    }

    if (isCreatingCall || isCallActive) {
      return;
    }

    try {
      setIsCreatingCall(true);

      // Set up callbacks
      wherebyService.setCallbacks({
        onCallStarted: (callData) => {
          setIsCallActive(true);
          setCallData(callData);
          callStartTimeRef.current = Date.now();
          onCallStarted?.(callData);
          toast.success(`Professional video call started with ${recipientName}`);
        },
        onCallEnded: (callData) => {
          setIsCallActive(false);
          setCallData(null);
          callStartTimeRef.current = null;
          setCallDuration(0);
          onCallEnded?.(callData);
          toast.success('Video call ended');
        },
        onError: (error) => {
          setIsCallActive(false);
          setIsCreatingCall(false);
          toast.error('Video call error occurred');
        }
      });

      // Create meeting
      const result = await wherebyService.createMeeting({
        recipientId,
        callerName: `${user.fname} ${user.lname}`,
        callerAvatar: user.profile_pic
      });

      setCallData(result.callData);
      setMeeting(result.meeting);

      // Embed meeting in container
      if (videoContainerRef.current) {
        wherebyService.embedMeeting(videoContainerRef.current, result.meeting.roomUrl);
        setIsCallActive(true);
        callStartTimeRef.current = Date.now();
      }

    } catch (error: any) {
      console.error('❌ Error starting Whereby call:', error);
      toast.error('Failed to start professional video call');
    } finally {
      setIsCreatingCall(false);
    }
  };

  const handleEndCall = () => {
    wherebyService.endCall();
    setIsCallActive(false);
    setCallData(null);
    setMeeting(null);
    callStartTimeRef.current = null;
    setCallDuration(0);
    onClose();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className={`
      fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4
      ${className}
    `}>
      <div className={`
        bg-white rounded-lg shadow-2xl overflow-hidden transition-all duration-300
        ${isFullscreen 
          ? 'w-full h-full' 
          : 'w-full max-w-4xl h-full max-h-[80vh]'
        }
      `}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              {recipientAvatar ? (
                <img 
                  src={recipientAvatar} 
                  alt={recipientName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <Users size={16} />
                </div>
              )}
              <div>
                <h3 className="font-semibold">{recipientName}</h3>
                <div className="flex items-center space-x-2 text-sm text-blue-100">
                  <Shield size={12} />

                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {/* Call Duration */}
            {isCallActive && (
              <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-3 py-1 rounded-full">
                <Clock size={14} />
                <span className="text-sm font-mono">{formatDuration(callDuration)}</span>
              </div>
            )}

            {/* Recording Indicator */}
            {isRecording && (
              <div className="flex items-center space-x-1 bg-red-500 bg-opacity-20 px-2 py-1 rounded-full">
                <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
                <span className="text-xs">REC</span>
              </div>
            )}

            {/* Controls */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              {isFullscreen ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
            </button>

            <button
              onClick={handleEndCall}
              className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Video Container */}
        <div className="flex-1 relative bg-gray-900">
          {isCreatingCall ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Creating Professional Video Call...</h3>
                <p className="text-gray-600">Setting up Whereby meeting with Islamic compliance</p>
              </div>
            </div>
          ) : (
            <div 
              ref={videoContainerRef}
              className="w-full h-full min-h-[400px]"
              style={{ minHeight: isFullscreen ? '70vh' : '400px' }}
            />
          )}
        </div>

        {/* Footer - Islamic Compliance Notice */}
        <div className="bg-gray-50 p-3 border-t">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2 text-gray-600">
              <Users size={14} className="text-blue-600" />

              <span className="text-gray-400">•</span>
              <span>Automatically Recorded</span>
            </div>
            
            <div className="flex items-center space-x-2 text-gray-500">
              <Shield size={14} className="text-green-600" />
              <span>Islamic Compliance Enabled</span>
            </div>
          </div>
          
          <div className="mt-2 text-xs text-gray-500 text-center">
            <span className="font-arabic">بسم الله الرحمن الرحيم</span> • 
            This call is monitored for Islamic compliance and proper conduct
          </div>
        </div>

        {/* Call Controls Overlay */}
        {isCallActive && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center space-x-3 bg-black bg-opacity-70 backdrop-blur-sm px-6 py-3 rounded-full">
              <button
                onClick={handleEndCall}
                className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full transition-colors"
              >
                <Phone size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WherebyEmbeddedCall;
