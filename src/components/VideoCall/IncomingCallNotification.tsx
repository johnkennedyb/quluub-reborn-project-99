import React, { useEffect, useState } from 'react';
import { Phone, PhoneOff, Video } from 'lucide-react';
import { CallData } from '../../services/webrtcService';

interface IncomingCallNotificationProps {
  callData: CallData;
  onAccept: () => void;
  onReject: () => void;
  isVisible: boolean;
}

const IncomingCallNotification: React.FC<IncomingCallNotificationProps> = ({
  callData,
  onAccept,
  onReject,
  isVisible
}) => {
  const [isRinging, setIsRinging] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setIsRinging(true);
      // Play ringtone sound (you can add actual audio file)
      const audio = new Audio('/sounds/ringtone.mp3');
      audio.loop = true;
      audio.play().catch(() => {
        // Handle autoplay restrictions
        console.log('Could not play ringtone due to autoplay restrictions');
      });

      return () => {
        audio.pause();
        audio.currentTime = 0;
      };
    }
  }, [isVisible]);

  if (!isVisible) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50" />
      
      {/* Notification */}
      <div className="fixed top-4 right-4 z-50 bg-white rounded-lg shadow-2xl p-6 w-80 animate-bounce">
        <div className="flex items-center space-x-4">
          {/* Avatar */}
          <div className="relative">
            {callData.callerAvatar ? (
              <img
                src={callData.callerAvatar}
                alt={callData.callerName}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center">
                <span className="text-white text-xl font-semibold">
                  {callData.callerName.charAt(0)}
                </span>
              </div>
            )}
            
            {/* Pulsing ring indicator */}
            {isRinging && (
              <div className="absolute -inset-2 rounded-full border-2 border-blue-500 animate-ping" />
            )}
          </div>

          {/* Call Info */}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 text-lg">
              {callData.callerName}
            </h3>
            <div className="flex items-center space-x-1 text-blue-600">
              <Video className="w-4 h-4" />
              <span className="text-sm">Incoming video call</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-center space-x-4 mt-6">
          <button
            onClick={onReject}
            className="p-3 rounded-full bg-red-500 hover:bg-red-600 transition-colors text-white shadow-lg"
            title="Decline"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
          
          <button
            onClick={onAccept}
            className="p-3 rounded-full bg-green-500 hover:bg-green-600 transition-colors text-white shadow-lg animate-pulse"
            title="Accept"
          >
            <Phone className="w-6 h-6" />
          </button>
        </div>
      </div>
    </>
  );
};

export default IncomingCallNotification;
