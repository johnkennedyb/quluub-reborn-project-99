import React from 'react';
import WherebyCallButton from './WherebyCallButton';

interface VideoCallButtonProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  onCallInitiated?: (meetingUrl: string) => void;
  variant?: 'default' | 'professional' | 'compact';
  disabled?: boolean;
}

const VideoCallButton: React.FC<VideoCallButtonProps> = (props) => {
  // Use the new professional Whereby button
  const wherebyVariant = props.variant === 'compact' ? 'minimal' : 'primary';
  
  return (
    <WherebyCallButton
      recipientId={props.recipientId}
      recipientName={props.recipientName}
      recipientAvatar={props.recipientAvatar}
      variant={wherebyVariant}
      size="md"
      showText={props.variant !== 'compact'}
      onCallStarted={() => {
        // Whereby handles meeting URL internally
        props.onCallInitiated?.('whereby-professional-call');
      }}
    />
  );
};

export default VideoCallButton;