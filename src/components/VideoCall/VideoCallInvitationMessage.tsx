import React from 'react';
import { Button } from '@/components/ui/button';
import { Video } from 'lucide-react';

interface VideoCallInvitationMessageProps {
  onJoinCall: () => void;
  onDeclineCall: () => void;
  callerName: string;
}

const VideoCallInvitationMessage: React.FC<VideoCallInvitationMessageProps> = ({ onJoinCall, onDeclineCall, callerName }) => {
  return (
    <div className="p-4 my-2 rounded-lg bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center space-x-4">
        <div className="p-2 bg-green-500 rounded-full">
          <Video className="w-6 h-6 text-white" />
        </div>
        <div>
          <p className="font-semibold">{callerName} started a video call.</p>
          <p className="text-sm text-muted-foreground">Click to join the call.</p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <Button onClick={onJoinCall} className="flex-1 bg-green-600 hover:bg-green-700">
          Accept Call
        </Button>
        <Button onClick={onDeclineCall} variant="outline" className="flex-1">
          Decline
        </Button>
      </div>
    </div>
  );
};

export default VideoCallInvitationMessage;
