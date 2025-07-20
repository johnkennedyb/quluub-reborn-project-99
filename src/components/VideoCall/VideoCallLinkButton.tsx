import React from 'react';
import { Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface VideoCallLinkButtonProps {
  recipientId: string;
  recipientName: string;
  onSendMessage?: (message: string, type: 'video-call-link') => void;
}

const VideoCallLinkButton: React.FC<VideoCallLinkButtonProps> = ({
  recipientId,
  recipientName
}) => {
  const navigate = useNavigate();

  const handleVideoCall = () => {
    navigate(`/video-call?recipient=${recipientId}`);
  };

  return (
    <Button
      onClick={handleVideoCall}
      variant="ghost"
      size="icon"
      className="text-blue-600 hover:bg-blue-50"
      title={`Start video call with ${recipientName}`}
    >
      <Video size={18} />
    </Button>
  );
};

export default VideoCallLinkButton;
