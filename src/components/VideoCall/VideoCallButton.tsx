import React, { useState } from 'react';
import { Video, Crown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ZoomVideoCall } from '../ZoomVideoCall';
import { useAuth } from '@/contexts/AuthContext';
import { isPremiumUser, hasFeatureAccess, getUpgradeMessage, PREMIUM_FEATURES } from '@/utils/premiumUtils';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface VideoCallButtonProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  onCallInitiated?: (meetingUrl: string) => void;
  variant?: 'default' | 'professional' | 'compact';
  disabled?: boolean;
}

const VideoCallButton: React.FC<VideoCallButtonProps> = ({
  recipientId,
  recipientName,
  recipientAvatar,
  onCallInitiated,
  variant = 'default',
  disabled = false
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  const handleVideoCallClick = () => {
    if (!user) {
      toast.error('Please log in to start a video call');
      return;
    }

    // Check if user has video call access
    if (!hasFeatureAccess(user, 'VIDEO_CALLS')) {
      toast.error(getUpgradeMessage('VIDEO_CALLS'));
      navigate('/upgrade');
      return;
    }

    setShowModal(true);
  };

  const getButtonVariant = () => {
    switch (variant) {
      case 'compact':
        return 'outline';
      case 'professional':
        return 'default';
      default:
        return 'default';
    }
  };

  const getButtonSize = () => {
    return variant === 'compact' ? 'sm' : 'default';
  };

  return (
    <>
      <Button
        onClick={handleVideoCallClick}
        disabled={disabled}
        variant={getButtonVariant()}
        size={getButtonSize()}
        className={`flex items-center gap-2 ${
          variant === 'professional' 
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' 
            : ''
        }`}
      >
        <Video className={variant === 'compact' ? 'w-4 h-4' : 'w-5 h-5'} />
        {variant !== 'compact' && (
          <>
            <span>Video Call</span>
            <Crown className="w-4 h-4 text-yellow-500" />
          </>
        )}
      </Button>

      {showModal && (
        <ZoomVideoCall
          participantId={recipientId}
          participantName={recipientName}
          onCallEnd={() => {
            setShowModal(false);
            toast.success('Video call ended');
          }}
        />
      )}
    </>
  );
};

export default VideoCallButton;