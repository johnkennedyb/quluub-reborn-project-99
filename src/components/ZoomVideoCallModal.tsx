import React, { useState } from 'react';
import { X, Phone, Shield } from 'lucide-react';
import { ZoomVideoCall } from './ZoomVideoCall';

interface ZoomVideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  participantId: string;
  participantName: string;
}

const ZoomVideoCallModal: React.FC<ZoomVideoCallModalProps> = ({
  isOpen,
  onClose,
  participantId,
  participantName,
}) => {
  const [callActive, setCallActive] = useState(false);

  const handleStartCall = () => {
    setCallActive(true);
  };

  const handleEndCallAndCloseModal = () => {
    setCallActive(false);
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 backdrop-blur-sm">
      <div className="relative w-full h-full max-w-4xl max-h-[90vh] bg-gray-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">
            {callActive ? `In call with ${participantName}` : 'Premium Video Call'}
          </h2>
          <button
            onClick={handleEndCallAndCloseModal}
            className="p-2 text-gray-400 bg-red-600 rounded-full hover:bg-red-700 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow w-full h-full bg-gray-900">
          {callActive ? (
            <ZoomVideoCall
              participantId={participantId}
              participantName={participantName}
              onCallEnd={handleEndCallAndCloseModal}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center text-white">
              <div className="mb-6">
                <img
                  src={`https://ui-avatars.com/api/?name=${participantName.replace(/\s/g, '+')}&background=random&size=128&color=fff`}
                  alt={participantName}
                  className="w-32 h-32 rounded-full border-4 border-blue-500 shadow-lg"
                />
              </div>
              <h3 className="text-3xl font-bold mb-2">Start a video call with {participantName}?</h3>
              <p className="text-gray-300 mb-8">Click the button below to begin the premium, supervised video call.</p>
              
              <button
                onClick={handleStartCall}
                className="flex items-center justify-center space-x-3 px-8 py-4 text-lg font-semibold text-white bg-green-500 rounded-full shadow-lg hover:bg-green-600 transition-all duration-200 transform hover:scale-105"
              >
                <Phone className="w-6 h-6" />
                <span>Start Video Call</span>
              </button>
              
              <div className="mt-8 text-center max-w-sm">
                <div className="flex items-center justify-center space-x-2 mb-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  <span className="text-sm font-medium text-green-300">Wali Supervised</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  This call has a 5-minute duration limit and is recorded for Islamic supervision and compliance monitoring.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ZoomVideoCallModal;
