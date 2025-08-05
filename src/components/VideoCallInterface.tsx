import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Video, Phone, PhoneOff, Crown, Shield, Clock, Users, X, Heart, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { VideoCallInvitation as VideoCallInvitationComponent } from './VideoCallInvitation';
import { PeerJSVideoCallModern } from './PeerJSVideoCallModern';
import socket from '@/lib/socket';
import { 
  fetchPendingVideoCallInvitations, 
  updateVideoCallInvitationStatus,
  PendingVideoCallInvitation 
} from '@/services/videoCallPersistence';
import { isPremiumUser } from '@/utils/premiumUtils';
import videoCallService, { type CallInvitation as VideoCallInvitationType } from '@/services/videoCallService';

interface VideoCallInterfaceProps {
  recipientId: string;
  recipientName: string;
  conversationId?: string;
  isOpen: boolean;
  onClose: () => void;
  incomingCall?: any;
  localVideoContainer?: React.RefObject<HTMLDivElement>;
  onRemoteUserAdded?: (userId: string) => void;
  onRemoteUserRemoved?: (userId: string) => void;
  sessionId?: string | null;
}

interface CallInvitation extends VideoCallInvitationType {
  recipientId: string;
  timestamp: string;
}

export const VideoCallInterface: React.FC<VideoCallInterfaceProps> = ({
  recipientId,
  recipientName,
  conversationId,
  isOpen,
  onClose,
  incomingCall,
  localVideoContainer,
  onRemoteUserAdded,
  onRemoteUserRemoved,
  sessionId
}) => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [callState, setCallState] = useState<'idle' | 'calling' | 'incoming' | 'connected'>('idle');
  const [peerJSSessionData, setPeerJSSessionData] = useState<any>(null);
  const [showPeerJSCall, setShowPeerJSCall] = useState(false);
  const [currentInvitation, setCurrentInvitation] = useState<VideoCallInvitationType | null>(null);
  const [isInitiating, setIsInitiating] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<PendingVideoCallInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch and restore pending video call invitations on component mount
  useEffect(() => {
    const restorePendingInvitations = async () => {
      setIsLoading(true);
      if (!user?.id) return;
      
      console.log('🔄 Restoring pending video call invitations...');
      
      try {
        const pending = await fetchPendingVideoCallInvitations();
        setPendingInvitations(pending);
        
        // If there are pending invitations for this user, show the first one
        const relevantInvitation = pending.find(inv => 
          inv.recipientId === user.id && 
          (inv.callerId === recipientId || inv.recipientId === recipientId)
        );
        
        if (relevantInvitation) {
          console.log('📞 Found relevant pending invitation:', relevantInvitation);
          toast({
            title: 'Pending Invitation',
            description: `You have a pending video call invitation from ${relevantInvitation.callerName}.`,
          });
          
          // Restore the invitation state
          const invitationData: VideoCallInvitationType = {
            type: 'video_call_invitation',
            callerId: relevantInvitation.callerId,
            callerName: relevantInvitation.callerName,
            recipientId: relevantInvitation.recipientId,
            sessionId: relevantInvitation.sessionId,
            callId: relevantInvitation.callId || '',
            timestamp: relevantInvitation.createdAt
          };
          setCurrentInvitation(invitationData);
          
          // Set PeerJS session data
          setPeerJSSessionData({
            sessionId: relevantInvitation.sessionId,
            callId: relevantInvitation.callId,
            provider: 'peerjs'
          });
          
          // Show the call interface if user is recipient
          if (relevantInvitation.recipientId === user.id) {
            setCallState('incoming');
            
            toast({
              title: '📞 Incoming Video Call',
              description: `${relevantInvitation.callerName} is calling you`,
              duration: 10000,
            });
          }
        }
      } catch (error) {
        console.error('❌ Error restoring pending invitations:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    restorePendingInvitations();
  }, [user?.id, recipientId]);

  // Handle incoming call from props (from chat message)
  useEffect(() => {
    if (incomingCall) {
      console.log('📞 Processing incoming call from chat message - AUTO STARTING:', incomingCall);
      
      // Create invitation data from incoming call
      const invitationData: VideoCallInvitationType = {
        type: 'video_call_invitation',
        callerId: incomingCall.callerId || '',
        callerName: incomingCall.callerName || 'Unknown User',
        recipientId: user?._id || '',
        sessionId: incomingCall.sessionId || '',
        callId: incomingCall.callId || '',
        timestamp: new Date().toISOString(),
      };
      
      setCurrentInvitation(invitationData);
      
      // For outgoing calls, start PeerJS connection as caller
      // For incoming calls, start PeerJS connection as callee
      if (incomingCall.isOutgoing) {
        console.log('📞 CALLER: Starting outgoing call - will create caller PeerJS connection');
        setCallState('connected');
      } else {
        console.log('📞 CALLEE: Accepting incoming call - will create callee PeerJS connection');
        setCallState('connected'); // Changed from 'incoming' to 'connected' to start PeerJS immediately
      }
      
      setPeerJSSessionData({ 
        sessionId: incomingCall.sessionId, 
        callId: incomingCall.callId || ''
      });
      setShowPeerJSCall(true);
      onClose(); // Close the modal and start video call immediately
      
      toast({
        title: '📞 Joining Video Call',
        description: `Joining call with ${incomingCall.callerName}...`,
      });
    }
  }, [incomingCall, user?._id, onClose]);

  useEffect(() => {
    console.log('🎧 Setting up video call listeners for user:', user?._id);
    console.log('🎧 Socket connected status:', socket.connected);
    console.log('🎧 Socket ID:', socket.id);
    
    // Enhanced debugging for all video call events
    const debugHandler = (eventName: string) => (data: any) => {
      console.log(`🔥 DEBUG: ${eventName} event received:`, data);
      console.log(`🔥 DEBUG: Current user ID: ${user?._id}`);
      console.log(`🔥 DEBUG: Data recipient ID: ${data.recipientId}`);
      console.log(`🔥 DEBUG: Is for me: ${data.recipientId === user?._id}`);
    };
    
    socket.on('video-call-invitation', debugHandler('video-call-invitation'));
    socket.on('video_call_invitation', debugHandler('video_call_invitation'));
    socket.on('new_message', debugHandler('new_message'));
    
    // Listen for incoming video call invitations (backup listener)
    socket.on('video-call-invitation', (data: VideoCallInvitationType) => {
      console.log('🎯 RECIPIENT: Received video call invitation in VideoCallInterface:', data);
      console.log('🎯 RECIPIENT: Current user ID:', user?._id);
      console.log('🎯 RECIPIENT: Invitation recipient ID:', data.recipientId);
      console.log('🎯 RECIPIENT: IDs match:', data.recipientId === user?._id);
      console.log('🎯 RECIPIENT: Full invitation data:', JSON.stringify(data, null, 2));
      
      if (data.recipientId === user?._id) {
        console.log('🎯 RECIPIENT: ✅ Processing incoming video call invitation');
        console.log('🎯 RECIPIENT: Setting call state to incoming');
        console.log('🎯 RECIPIENT: Session ID:', data.sessionId);
        console.log('🎯 RECIPIENT: Call ID:', data.callId);
        
        setCurrentInvitation(data);
        
        // Auto-accept and start PeerJS connection for recipient
        console.log('🎯 RECIPIENT: Auto-accepting call and starting PeerJS connection');
        setCallState('connected');
        setPeerJSSessionData({ 
          sessionId: data.sessionId, 
          callId: data.callId 
        });
        setShowPeerJSCall(true);
        
        console.log('🎯 RECIPIENT: Showing toast notification');
        toast({
          title: '📞 Incoming Video Call',
          description: `${data.callerName} is calling you - Connecting...`,
          duration: 5000,
        });
        
        console.log('🎯 RECIPIENT: Call setup complete, PeerJS will auto-start');
      } else {
        console.log('🎯 RECIPIENT: ❌ Video call invitation not for this user');
      }
    });
    
    // Also listen for new_message events that might contain video call invitations
    socket.on('new_message', (message: any) => {
      console.log('🎯 RECIPIENT: Received new_message:', message.messageType, message);
      
      if (message.messageType === 'video_call_invitation' && message.recipientId === user?._id) {
        console.log('🎯 RECIPIENT: ✅ Video call invitation via new_message detected!');
        console.log('🎯 RECIPIENT: Message data:', JSON.stringify(message, null, 2));
        
        const invitationData: VideoCallInvitationType = {
          type: 'video_call_invitation',
          callerId: message.senderId,
          callerName: message.videoCallData?.callerName || 'Unknown User',
          recipientId: message.recipientId,
          sessionId: message.videoCallData?.sessionId || '',
          callId: message.videoCallData?.callId || '',
          timestamp: message.createdAt || new Date().toISOString(),
        };
        
        console.log('🎯 RECIPIENT: Processed invitation data:', invitationData);
        
        setCurrentInvitation(invitationData);
        setCallState('incoming');
        setPeerJSSessionData({ 
          sessionId: invitationData.sessionId, 
          callId: invitationData.callId 
        });
        
        // Auto-accept and start PeerJS connection for recipient
        console.log('🎯 RECIPIENT: Auto-accepting call and starting PeerJS connection');
        setCallState('connected');
        setShowPeerJSCall(true);
        
        console.log('🎯 RECIPIENT: Showing toast and setting up call interface');
        toast({
          title: '📞 Incoming Video Call',
          description: `${invitationData.callerName} is calling you - Connecting...`,
          duration: 5000,
        });
        
        console.log('🎯 RECIPIENT: Call setup complete via new_message - PeerJS will auto-start');
      } else if (message.messageType === 'video_call_invitation') {
        console.log('🎯 RECIPIENT: Video call invitation not for this user (via new_message)');
        console.log('🎯 RECIPIENT: Message recipient:', message.recipientId, 'Current user:', user?._id);
      }
    });

    // Listen for call acceptance
    socket.on('video-call-accepted', (data) => {
      console.log('✅ Video call accepted:', data);
      if (data.callerId === user?._id) {
        setCallState('connected');
        setShowPeerJSCall(true);
        // Don't close the interface - keep it open for the video call
        
        toast({
          title: '✅ Call Accepted',
          description: `${recipientName} joined the call`,
        });
      }
    });

    // Listen for call decline
    socket.on('video-call-declined', (data) => {
      console.log('❌ Video call declined:', data);
      if (data.callerId === user?._id) {
        setCallState('idle');
        setShowPeerJSCall(false);
        setIsInitiating(false);
        
        toast({
          title: '❌ Call Declined',
          description: `${recipientName} declined the call`,
          variant: 'destructive',
        });
      }
    });

    // Listen for call end
    socket.on('video-call-ended', (data) => {
      console.log('📞 Video call ended:', data);
      handleCallEnd();
    });

    return () => {
      socket.off('video-call-invitation');




      socket.off('video-call-accepted');
      socket.off('video-call-declined');
      socket.off('video-call-ended');
    };
  }, [user?._id, recipientName]);

  const initiateVideoCall = async () => {
    console.log('📞 Initiating video call...');
    console.log('User:', user);
    console.log('Is Premium:', isPremiumUser(user));
    console.log('Recipient ID:', recipientId);
    console.log('Recipient Name:', recipientName);
    console.log('🔌 Socket connected:', socket.connected);
    console.log('🔌 Socket ID:', socket.id);
    
    if (!user) {
      console.log('❌ User is not logged in');
      toast({
        title: 'Authentication Required',
        description: 'Please log in to make video calls.',
        variant: 'destructive',
      });
      return;
    }
    
    // Temporarily bypass premium check for debugging
    if (!isPremiumUser(user)) {
      console.log('⚠️ User is not premium, but proceeding for debugging...');
      toast({
        title: '⚠️ Debug Mode',
        description: 'Bypassing premium check for testing...',
      });
    }

    console.log('✅ User is premium, proceeding with call...');
    setIsInitiating(true);
    setCallState('calling');

    try {
      // Create a PeerJS session ID
      const sessionId = `session_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
      const sessionData = {
        sessionId,
        callId: `call_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
        provider: 'peerjs'
      };
      console.log('🎥 PeerJS video call session created:', sessionData);

      // Create invitation data with the session info
      const invitationData: VideoCallInvitationType = {
        type: 'video_call_invitation',
        callerId: user._id,
        callerName: `${user.fname} ${user.lname}`,
        recipientId,
        sessionId: sessionData.sessionId,
        callId: sessionData.callId || '',
        timestamp: new Date().toISOString(),
      };

      console.log('📡 Sending video call invitation via socket:', invitationData);
      console.log('🔌 Socket connected status:', socket.connected);
      console.log('🆔 Socket ID:', socket.id);
      
      // Function to send invitation when socket is ready
      const sendInvitation = async () => {
        console.log('🚀 SENDING INVITATION - Step 1: Backend API');
        
        // Send invitation via backend API
        try {
          await videoCallService.sendInvitation(recipientId, sessionData.sessionId, sessionData.callId);
          console.log('✅ Invitation sent via backend API');
        } catch (error) {
          console.error('❌ Error sending invitation via API:', error);
        }
        
        console.log('🚀 SENDING INVITATION - Step 2: Socket event');
        socket.emit('send-video-call-invitation', invitationData);
        
        // Also emit as a regular message to ensure it appears in chat
        const chatMessage = {
          senderId: user._id,
          recipientId,
          message: `${user.fname} ${user.lname} is inviting you to a video call`,
          messageType: 'video_call_invitation',
          videoCallData: {
            callerId: user._id,
            callerName: `${user.fname} ${user.lname}`,
            sessionId: invitationData.sessionId,
            callId: invitationData.callId,
            timestamp: invitationData.timestamp,
            status: 'pending'
          },
          createdAt: new Date().toISOString()
        };
        
        console.log('🚀 SENDING INVITATION - Step 3: Chat message');
        console.log('💬 Full chat message data:', JSON.stringify(chatMessage, null, 2));
        socket.emit('new_message', chatMessage);
        console.log('🚀 SENDING INVITATION - Step 4: All events emitted');
        
        // Listen for video call failed event
        socket.on('video-call-failed', (failureData) => {
          console.log('❌ Video call failed:', failureData);
          toast({
            title: '❌ Call Failed',
            description: `${failureData.message}. The recipient may not be online.`,
            variant: 'destructive',
          });
          setCallState('idle');
          setIsInitiating(false);
        });
      };
      
      // If socket is connected, send immediately
      if (socket.connected) {
        await sendInvitation();
      } else {
        console.log('⚠️ Socket not connected, waiting for connection...');
        // Wait for socket to connect, then send
        const onConnect = async () => {
          console.log('✅ Socket connected, sending invitation now');
          await sendInvitation();
          socket.off('connect', onConnect);
        };
        socket.on('connect', onConnect);
        
        // Force reconnect if needed
        if (!socket.connected) {
          socket.connect();
        }
      }
      
      setCurrentInvitation(invitationData);
      
      // Set PeerJS session data first
      setPeerJSSessionData({
        sessionId: sessionData.sessionId,
        callId: sessionData.callId,
        provider: 'peerjs'
      });
      
      // For the CALLER: Start video call immediately
      setShowPeerJSCall(true);
      // Don't close the interface - keep it open for the video call
      console.log('✅ Starting PeerJS video call for caller');

      toast({
        title: '📞 Call Started',
        description: `Calling ${recipientName}... Waiting for them to join.`,
      });

      // Auto-cancel after 30 seconds if no response
      setTimeout(() => {
        if (callState === 'calling') {
          handleDeclineCall();
        }
      }, 30000);

    } catch (error) {
      console.error('Error initiating video call:', error);
      toast({
        title: 'Error',
        description: 'Failed to initiate video call. Please try again.',
        variant: 'destructive',
      });
      setCallState('idle');
      setIsInitiating(false);
    }
  };

  const handleAcceptCall = async () => {
    if (!currentInvitation) return;

    try {
      const pendingInv = pendingInvitations.find(inv => inv.sessionId === currentInvitation.sessionId);
      if (pendingInv) {
        await updateVideoCallInvitationStatus(pendingInv._id, 'accepted');
        setPendingInvitations(prev => prev.filter(inv => inv._id !== pendingInv._id));
      }

      // Send acceptance via socket
      socket.emit('accept-video-call', {
        callerId: currentInvitation.callerId,
        recipientId: user?._id,
        sessionId: currentInvitation.sessionId,
      });

      // For the RECIPIENT: Join the existing video call
      setCallState('connected');
      setPeerJSSessionData({ sessionId: currentInvitation.sessionId, callId: currentInvitation.callId });
      setShowPeerJSCall(true);
      onClose(); // Close the main video call interface modal

      toast({
        title: '✅ Call Accepted',
        description: 'Joining video call...',
      });
    } catch (error) {
      console.error('Error accepting call:', error);
      toast({
        title: 'Error',
        description: 'Failed to accept the call. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleDeclineCall = async () => {
    if (!currentInvitation) return;

    try {
      // Update invitation status in backend
      const pendingInv = pendingInvitations.find(inv => inv.sessionId === currentInvitation.sessionId);
      if (pendingInv) {
        await updateVideoCallInvitationStatus(pendingInv._id, 'declined');
        setPendingInvitations(prev => prev.filter(inv => inv._id !== pendingInv._id));
      }

      // Notify caller that call was declined
      socket.emit('decline-video-call', {
        callerId: currentInvitation.callerId,
        recipientId: user?._id,
        sessionId: currentInvitation.sessionId,
      });

      setCallState('idle');
      setShowPeerJSCall(false);

      toast({
        title: '❌ Call Declined',
        description: 'Video call declined',
      });
    } catch (error) {
      console.error('Error declining call:', error);
      toast({
        title: 'Error',
        description: 'Failed to decline the call. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleCallEnd = () => {
    // Notify other participant
    if (currentInvitation) {
      socket.emit('end-video-call', {
        callerId: currentInvitation.callerId,
        recipientId: currentInvitation.recipientId,
        sessionId: currentInvitation.sessionId,
      });
    }

    setCallState('idle');
    setShowPeerJSCall(false);
    setPeerJSSessionData(null);
    setCurrentInvitation(null);
    setIsInitiating(false);

    toast({
      title: '📞 Call Ended',
      description: 'Video call has ended. Recording sent to Wali for review.',
    });
  };

  const getCallStatusText = () => {
    switch (callState) {
      case 'calling':
        return `Calling ${recipientName}...`;
      case 'incoming':
        return `${currentInvitation?.callerName} is calling...`;
      case 'connected':
        return `Connected with ${recipientName}`;
      default:
        return 'Start a video call';
    }
  };

  const getCallStatusColor = () => {
    switch (callState) {
      case 'calling':
        return 'bg-yellow-100 text-yellow-800';
      case 'incoming':
        return 'bg-green-100 text-green-800';
      case 'connected':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return null;
  }

  return (
    <>
      {/* Video Call Interface Modal */}
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Video className="h-5 w-5 text-blue-500" />
                Video Call
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              </div>
              {callState !== 'idle' && (
                <Badge className={getCallStatusColor()}>
                  {callState === 'connected' && <Users className="h-3 w-3 mr-1" />}
                  {getCallStatusText()}
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Recipient Info */}
            <div className="text-center space-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center">
                <span className="text-xl font-bold text-white">
                  {recipientName.charAt(0).toUpperCase()}
                </span>
              </div>
              <h3 className="text-lg font-semibold">{recipientName}</h3>
            </div>

            {/* Islamic Compliance Notice */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-green-800 text-sm">
                <Shield className="h-4 w-4" />
                <span className="font-medium">Islamic Supervision Active</span>
              </div>
              <p className="text-xs text-green-700 mt-1">
                All video calls are supervised and recorded for compliance purposes.
              </p>
            </div>

            {/* Call Features */}
            <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>5 min limit</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>Wali notified</span>
              </div>
              <div className="flex items-center gap-1">
                <Video className="h-3 w-3" />
                <span>HD quality</span>
              </div>
            </div>

            {/* Call Button */}
            <Button
              onClick={callState === 'connected' ? handleCallEnd : initiateVideoCall}
              disabled={(callState !== 'idle' && callState !== 'connected') || isInitiating}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="lg"
            >
              {callState === 'idle' ? (
                <>
                  <Phone className="h-5 w-5 mr-2" />
                  Start Video Call
                </>
              ) : callState === 'calling' ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Calling {recipientName}...
                </>
              ) : callState === 'connected' ? (
                <>
                  <PhoneOff className="h-5 w-5 mr-2" />
                  End Call
                </>
              ) : (
                <>
                  <Phone className="h-5 w-5 mr-2" />
                  {getCallStatusText()}
                </>
              )}
            </Button>

            {callState !== 'idle' && (
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full"
              >
                Close
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>



      {/* PeerJS Video Call Implementation */}
      {(() => {
        console.log('🔍 PeerJS Call Render Check:', {
          showPeerJSCall,
          peerJSSessionData,
          recipientId,
          recipientName
        });
        return showPeerJSCall && peerJSSessionData ? (
          <PeerJSVideoCallModern
            sessionId={peerJSSessionData.sessionId}
            participantId={recipientId}
            participantName={recipientName}
            onCallEnd={handleCallEnd}
            isVisible={showPeerJSCall}
          />
        ) : null;
      })()}
    </>
  );
};
