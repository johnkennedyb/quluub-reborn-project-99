import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, Phone, PhoneOff, Clock, Crown, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';

interface VideoCallInvitationProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  onDecline: () => void;
  callerName: string;
  callerId: string;
  isIncoming: boolean;
  duration?: number;
}

export const VideoCallInvitation: React.FC<VideoCallInvitationProps> = ({
  isOpen,
  onClose,
  onAccept,
  onDecline,
  callerName,
  callerId,
  isIncoming,
  duration = 30
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          // Auto-decline when timer expires
          onDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, onDecline]);

  const formatTime = (seconds: number) => {
    return `${seconds}s`;
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-2 text-xl">
            <Video className="h-6 w-6 text-blue-500" />
            {isIncoming ? 'Incoming Video Call' : 'Outgoing Video Call'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Caller Info */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {callerName.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{callerName}</h3>
              <p className="text-sm text-gray-500">
                {isIncoming ? 'is calling you' : 'Calling...'}
              </p>
            </div>
          </div>

          {/* Premium Features Badge */}
          <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-yellow-600" />
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  Premium Feature
                </Badge>
              </div>
              <div className="text-xs text-gray-600 space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-3 w-3 text-green-600" />
                  <span>Islamic compliance & Wali supervision</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-blue-600" />
                  <span>5-minute duration limit</span>
                </div>
                <div className="flex items-center gap-2">
                  <Video className="h-3 w-3 text-purple-600" />
                  <span>Professional Zoom integration</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timer */}
          {isIncoming && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm">
                <Clock className="h-4 w-4" />
                Auto-decline in {formatTime(timeLeft)}
              </div>
            </div>
          )}

          {/* Islamic Compliance Notice */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="text-xs text-green-800 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Shield className="h-3 w-3" />
                <span className="font-medium">Islamic Supervision Active</span>
              </div>
              <p>This call will be supervised and recorded for compliance purposes.</p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex justify-center gap-4">
          {isIncoming ? (
            <>
              <Button
                onClick={onDecline}
                variant="destructive"
                size="lg"
                className="flex items-center gap-2"
              >
                <PhoneOff className="h-5 w-5" />
                Decline
              </Button>
              <Button
                onClick={onAccept}
                className="bg-green-600 hover:bg-green-700 flex items-center gap-2"
                size="lg"
              >
                <Phone className="h-5 w-5" />
                Accept
              </Button>
            </>
          ) : (
            <Button
              onClick={onDecline}
              variant="destructive"
              size="lg"
              className="flex items-center gap-2"
            >
              <PhoneOff className="h-5 w-5" />
              Cancel Call
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
