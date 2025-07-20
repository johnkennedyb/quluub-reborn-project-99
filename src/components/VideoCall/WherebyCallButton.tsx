import React, { useState } from 'react';
import { Video, Phone, Users, Shield, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { wherebyService, WherebyMeetingConfig } from '../../services/wherebyService';
import { useAuth } from '../../contexts/AuthContext';

interface WherebyCallButtonProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  onCallStarted?: () => void;
  onCallEnded?: () => void;
  onError?: (error: any) => void;
}

const WherebyCallButton: React.FC<WherebyCallButtonProps> = ({
  recipientId,
  recipientName,
  recipientAvatar,
  className = '',
  variant = 'primary',
  size = 'md',
  showText = true,
  onCallStarted,
  onCallEnded,
  onError
}) => {
  const { user } = useAuth();
  const [isCreatingCall, setIsCreatingCall] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);

  // Styling variants
  const variants = {
    primary: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl',
    secondary: 'bg-white border-2 border-blue-600 text-blue-600 hover:bg-blue-50 shadow-md hover:shadow-lg',
    minimal: 'bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300'
  };

  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2.5 text-base',
    lg: 'px-6 py-3 text-lg'
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 24
  };

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

      // Create meeting configuration
      const config: WherebyMeetingConfig = {
        recipientId,
        callerName: `${user.fname} ${user.lname}`,
        callerAvatar: user.profile_pic
      };

      // Set up callbacks
      wherebyService.setCallbacks({
        onCallStarted: (callData) => {
          setIsCallActive(true);
          onCallStarted?.();
          toast.success(`Professional video call started with ${recipientName}`);
        },
        onCallEnded: (callData) => {
          setIsCallActive(false);
          onCallEnded?.();
          toast.success('Video call ended');
        },
        onError: (error) => {
          setIsCallActive(false);
          onError?.(error);
        }
      });

      // Create meeting
      const { callData, meeting } = await wherebyService.createMeeting(config);

      // Open meeting in new window
      const meetingWindow = wherebyService.openMeetingInNewWindow(meeting.roomUrl);

      if (meetingWindow) {
        setIsCallActive(true);
        
        // Monitor window close to end call
        const checkClosed = setInterval(() => {
          if (meetingWindow.closed) {
            clearInterval(checkClosed);
            wherebyService.endCall();
            setIsCallActive(false);
          }
        }, 1000);
      }

    } catch (error: any) {
      console.error('❌ Error starting Whereby call:', error);
      toast.error('Failed to start professional video call');
      onError?.(error);
    } finally {
      setIsCreatingCall(false);
    }
  };

  const handleEndCall = () => {
    wherebyService.endCall();
    setIsCallActive(false);
  };

  return (
    <div className="flex flex-col items-center space-y-2">
      {/* Main Call Button */}
      <button
        onClick={isCallActive ? handleEndCall : handleStartCall}
        disabled={isCreatingCall}
        className={`
          ${variants[variant]}
          ${sizes[size]}
          ${className}
          flex items-center space-x-2 rounded-lg font-medium transition-all duration-200
          transform hover:scale-105 active:scale-95
          disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        `}
      >
        {isCreatingCall ? (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            {showText && <span>Creating Call...</span>}
          </>
        ) : isCallActive ? (
          <>
            <Phone size={iconSizes[size]} className="text-red-500" />
            {showText && <span>End Call</span>}
          </>
        ) : (
          <>
            <Video size={iconSizes[size]} />
            {showText && <span>Professional Video Call</span>}
          </>
        )}
      </button>

      {/* Professional Features Badge */}
      <div className="flex items-center space-x-1 text-xs text-gray-600">
        <Shield size={12} className="text-green-600" />

      </div>

      {/* Islamic Compliance Notice */}
      <div className="text-xs text-center text-gray-500 max-w-xs">
        <div className="flex items-center justify-center space-x-1 mb-1">
          <Users size={12} className="text-blue-600" />

        </div>
        <p className="text-[10px] leading-tight">
          All video calls are automatically recorded and reported to Wali for Islamic compliance
        </p>
      </div>

      {/* Call Status Indicator */}
      {isCallActive && (
        <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span>Call Active</span>
          <Clock size={12} />
        </div>
      )}

      {/* Professional Quality Badge */}
      <div className="text-[10px] text-gray-400 text-center">

      </div>
    </div>
  );
};

export default WherebyCallButton;
