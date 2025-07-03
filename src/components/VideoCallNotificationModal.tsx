
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, PhoneOff, Video } from 'lucide-react';

interface VideoCallNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  callerName: string;
  callerImage?: string;
  roomId: string;
  onAccept?: () => void;
  onDecline?: () => void;
}

const VideoCallNotificationModal = ({
  isOpen,
  onClose,
  callerName,
  callerImage,
  roomId,
  onAccept,
  onDecline,
}: VideoCallNotificationModalProps) => {
  const [isRinging, setIsRinging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsRinging(true);
      const interval = setInterval(() => {
        setIsRinging(prev => !prev);
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  const handleAccept = () => {
    console.log('Accepting video call for room:', roomId);
    onAccept?.();
  };

  const handleDecline = () => {
    console.log('Declining video call for room:', roomId);
    onDecline?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">Incoming Video Call</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-6 py-4">
          <div className={`relative ${isRinging ? 'animate-pulse' : ''}`}>
            <Avatar className="w-24 h-24 border-4 border-green-500">
              <AvatarImage src={callerImage} alt={callerName} />
              <AvatarFallback className="text-2xl">
                {callerName?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-2">
              <Video className="w-4 h-4 text-white" />
            </div>
          </div>
          
          <div className="text-center">
            <h3 className="text-lg font-semibold">{callerName || 'Someone'}</h3>
            <p className="text-sm text-muted-foreground">is calling you...</p>
          </div>
          
          <div className="flex space-x-4">
            <Button
              variant="destructive"
              size="lg"
              className="rounded-full w-16 h-16"
              onClick={handleDecline}
            >
              <PhoneOff className="w-6 h-6" />
            </Button>
            
            <Button
              variant="default"
              size="lg"
              className="rounded-full w-16 h-16 bg-green-600 hover:bg-green-700"
              onClick={handleAccept}
            >
              <Phone className="w-6 h-6" />
            </Button>
          </div>
          
          <p className="text-xs text-center text-muted-foreground max-w-xs">
            Parents/Wali will be notified of this video call session
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoCallNotificationModal;
