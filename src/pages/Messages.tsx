import { useState, useEffect, useRef, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { chatService } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Video, Send, ExternalLink, Crown, Flag, User, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/api-client";
import socket from "@/lib/socket";
import { isPremiumUser, hasFeatureAccess, getUpgradeMessage, PREMIUM_FEATURES } from "@/utils/premiumUtils";
import VideoCallInvitationMessage from '@/components/VideoCall/VideoCallInvitationMessage';
import VideoCallNotificationModal from '@/components/VideoCallNotificationModal';
import { VideoCallInterface } from "@/components/VideoCallInterface";

interface Message {
  _id: string;
  senderId: string;
  recipientId?: string; // Add recipientId for context
  message: string;
  createdAt: string;
  messageType?: 'text' | 'video_call_invitation';
  videoCallData?: {
    callerId: string;
    callerName: string;
    sessionId: string;
    timestamp: string;
    status: 'pending' | 'accepted' | 'declined' | 'ended' | 'missed';
  };
}

const Messages = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [recipientName, setRecipientName] = useState<string>("");
  const [showVideoCallInterface, setShowVideoCallInterface] = useState(false);
  const [invitationOpen, setInvitationOpen] = useState(false);
  const [invitationData, setInvitationData] = useState<{callerName: string; callerId: string; sessionId?: string; callId?: string; message?: string;} | null>(null);
  const [incomingCall, setIncomingCall] = useState<any>(null);
  const [monthlyCallUsage, setMonthlyCallUsage] = useState<{
    remainingSeconds: number;
    formattedRemainingTime: string;
    hasTimeRemaining: boolean;
    totalUsedSeconds: number;
    formattedUsedTime: string;
  } | null>(null);

  // Video call refs and state
  const localVideoRef = useRef<HTMLDivElement>(null);
  const [remoteUserIds, setRemoteUserIds] = useState<string[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  
  // Task #29: Message counter state
  const [messageLimit, setMessageLimit] = useState(10); // Default limit for all users
  const [messagesUsed, setMessagesUsed] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const maxWordsPerMessage = 20; // Word limit per message

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Get conversation id or user id for new conversations
  const urlParams = new URLSearchParams(location.search);
  const conversationId = urlParams.get("conversation");
  const targetUserId = urlParams.get("user");

  // Helper function to render message content with clickable links
  const renderMessageContent = (message: string, messageType?: string, videoCallData?: any) => {
    // Check if this is a video call invitation message
    if (messageType === 'video_call_invitation' && videoCallData) {
      const handleJoinCall = () => {
        console.log('🎯 Joining video call from chat message:', videoCallData);
        setIncomingCall(videoCallData);
      };

      const handleDeclineCall = () => {
        if (videoCallData?.sessionId && socket) {
          console.log('📞 Declining call from chat message for session:', videoCallData.sessionId);
          socket.emit("decline-call", { roomId: videoCallData.sessionId });
        }
        // Optionally, update the message status in the UI
      };

      return (
        <VideoCallInvitationMessage 
          callerName={videoCallData.callerName}
          onJoinCall={handleJoinCall}
          onDeclineCall={handleDeclineCall}
        />
      );
    }
    
    // Check for video call invitation with link in message text
    const videoCallLinkRegex = /🎥 \*\*Video Call Invitation\*\*([\s\S]*?)🔗 \*\*Join Link:\*\* \[([^\]]+)\]\(([^\)]+)\)/;
    const videoCallLinkMatch = message.match(videoCallLinkRegex);
    
    if (videoCallLinkMatch) {
      const senderMatch = message.match(/📞 ([^\n]+) is inviting you/);
      const linkText = videoCallLinkMatch[2];
      const joinUrl = videoCallLinkMatch[3];
      
      // Extract session parameters from URL for direct joining
      const urlParams = new URLSearchParams(joinUrl.split('?')[1]);
      const sessionId = urlParams.get('sessionId');
      const callerId = urlParams.get('callerId');
      const callerName = urlParams.get('callerName');
      
      const handleJoinCall = () => {
        if (sessionId && callerId && callerName) {
          // Set up the incoming call data to join directly
          setIncomingCall({
            sessionId,
            callerId,
            callerName: decodeURIComponent(callerName),
            isOutgoing: false
          });
          
          // Show the video call interface
          setShowVideoCallInterface(true);
        }
      };
      
      return (
        <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700">
            <Video className="h-5 w-5" />
            <span className="font-semibold">Video Call Invitation</span>
            <Crown className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="text-sm text-gray-700">
            {senderMatch && <p className="text-xs text-gray-500 mt-1">{senderMatch[1]} is inviting you to a video call</p>}
          </div>
          <Button
            onClick={handleJoinCall}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
            size="sm"
          >
            <Video className="h-4 w-4" />
            {linkText}
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Premium Feature • quluub Video Call
          </p>
        </div>
      );
    }
    
    // Check for Whereby video call invitation in message text
    const wherebyCallRegex = /🎥 \*\*Video Call Invitation\*\*[\s\S]*?🔗 \*\*Join Link:\*\* (https?:\/\/whereby\.com\/[^\s\n]+)/;
    const wherebyMatch = message.match(wherebyCallRegex);
    
    if (wherebyMatch) {
      const joinUrl = wherebyMatch[1];
      const roomNameMatch = message.match(/🏠 \*\*Room:\*\* ([^\n]+)/);
      const senderMatch = message.match(/📞 ([^\n]+) is inviting you/);
      
      return (
        <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-green-700">
            <Video className="h-5 w-5" />
            <span className="font-semibold">Whereby Video Call Invitation</span>
            <Crown className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="text-sm text-gray-700">
            {roomNameMatch && <p className="font-medium">{roomNameMatch[1]}</p>}
            {senderMatch && <p className="text-xs text-gray-500 mt-1">{senderMatch[1]} is inviting you to a video call</p>}
          </div>
          <Button
            onClick={() => window.open(joinUrl, '_blank')}
            className="w-full bg-green-600 hover:bg-green-700 text-white gap-2"
            size="sm"
          >
            <ExternalLink className="h-4 w-4" />
            Join Whereby Room
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Premium Feature • Powered by Whereby
          </p>
        </div>
      );
    }
    
    // Check if message contains legacy Zoom video call invitation
    const zoomCallRegex = /📹 Video call invitation: ([^\n]+)[\s\S]*?Join the meeting: (https?:\/\/[^\s]+)/;
    const zoomMatch = message.match(zoomCallRegex);
    
    if (zoomMatch) {
      const topic = zoomMatch[1];
      const joinUrl = zoomMatch[2];
      const passwordMatch = message.match(/Meeting Password: ([^\n]+)/);
      const meetingIdMatch = message.match(/Meeting ID: ([^\n]+)/);
      
      return (
        <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 text-blue-700">
            <Video className="h-5 w-5" />
            <span className="font-semibold">Zoom Video Call Invitation</span>
            <Crown className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="text-sm text-gray-700">
            <p className="font-medium">{topic}</p>
            {meetingIdMatch && <p>Meeting ID: {meetingIdMatch[1]}</p>}
            {passwordMatch && <p>Password: {passwordMatch[1]}</p>}
          </div>
          <Button
            onClick={() => window.open(joinUrl, '_blank')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
            size="sm"
          >
            <ExternalLink className="h-4 w-4" />
            Join Zoom Meeting
          </Button>
          <p className="text-xs text-gray-500 text-center">
            Premium Feature • Powered by Zoom
          </p>
        </div>
      );
    }
    
    // Regular message - check for any links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = message.split(urlRegex);
    
    return parts.map((part, index) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const fetchMessages = async () => {
    if (!conversationId) return;
    
    try {
      setLoading(true);
      console.log('Fetching messages for conversation:', conversationId);
      const data = await chatService.getMessages(conversationId);
      console.log('Fetched messages:', data);
      setMessages(data);
      
      // Extract recipient ID from messages
      if (data.length > 0 && user) {
        const otherUserId = data.find((msg: Message) => msg.senderId !== user._id)?.senderId;
        if (otherUserId) {
          setRecipientId(otherUserId);
        }
      }
      
      scrollToBottom();
    } catch (err) {
      console.error("Failed to load messages", err);
      toast({ 
        title: "Error", 
        description: "Could not load messages. You may need to be matched with this user to chat.",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    } else if (targetUserId) {
      createOrFindConversation(targetUserId);
    }
  }, [conversationId, targetUserId]);

  // Fetch monthly usage when recipient is set
  useEffect(() => {
    if (recipientId && user) {
      fetchMonthlyUsage();
    }
  }, [recipientId, user]);

  // Function to create or find conversation with a specific user
  const createOrFindConversation = async (userId: string) => {
    try {
      setLoading(true);
      console.log('Creating/finding conversation with user:', userId);
      
      // Try to find existing conversation or create a new one
      const response = await apiClient.post('/chats/conversations/create-or-find', {
        participantId: userId
      });
      
      if (response.data.conversationId) {
        // Update URL to use conversation ID instead of user ID
        const newUrl = `/messages?conversation=${response.data.conversationId}`;
        window.history.replaceState({}, '', newUrl);
        
        // Set the conversation ID and recipient
        setRecipientId(userId);
        
        // Fetch messages for this conversation
        const data = await chatService.getMessages(response.data.conversationId);
        setMessages(data);
        scrollToBottom();
      }
    } catch (err) {
      console.error("Failed to create/find conversation", err);
      toast({ 
        title: "Error", 
        description: "Could not start conversation. You may need to be matched with this user to chat.",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    } else if (targetUserId) {
      createOrFindConversation(targetUserId);
    } else {
      toast({ title: "Error", description: "No conversation or user ID found", variant: "destructive" });
    }
    // No polling needed since we have real-time socket updates
  }, [conversationId, targetUserId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Listen for real-time message updates via socket (handled by App.tsx)
  useEffect(() => {
    if (!socket || !user?._id || !conversationId) return;

    // Join conversation room for real-time message updates
    socket.emit('join_conversation', conversationId);

    // Listen for new messages in this conversation
    const handleNewMessage = (data: any) => {
      console.log('📨 Received new message:', data);
      
      // Check if message belongs to current conversation
      if (data.conversationId === conversationId) {
        setMessages(prev => {
          // Prevent duplicate messages
          const messageExists = prev.some(msg => msg._id === data._id);
          if (messageExists) return prev;
          
          console.log('✅ Adding message to conversation:', data);
          return [...prev, data];
        });
        scrollToBottom();
      }
    };

    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.emit('leave_conversation', conversationId);
    };
  }, [socket, user, conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Task #29: Update word count when message text changes
  useEffect(() => {
    const words = messageText.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [messageText]);

  // Task #29: Fetch message usage stats
  useEffect(() => {
    const fetchMessageStats = async () => {
      try {
        // This would be an API call to get user's message usage
        // For now, we'll use mock data based on user plan
        const isPremium = isPremiumUser(user);
        setMessageLimit(isPremium ? 1000 : 10);
        // In a real implementation, this would come from the backend
        setMessagesUsed(messages.filter(msg => msg.senderId === user._id).length);
      } catch (error) {
        console.error('Error fetching message stats:', error);
      }
    };

    if (user) {
      fetchMessageStats();
    }
  }, [user, messages]);

  // Fetch monthly video call usage for this match
  const fetchMonthlyUsage = async () => {
    if (!recipientId || !user) return;
    
    try {
      const response = await apiClient.get(`/monthly-usage/video-call/${recipientId}`);
      if (response.data.success) {
        setMonthlyCallUsage(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch monthly usage:', error);
    }
  };

  const handleStartVideoCall = async () => {
    if (!recipientId || !user) return;

    if (!isPremiumUser(user)) {
        toast({
            title: "👑 Premium Feature",
            description: "Video calls are available for Premium users only. Please upgrade your plan.",
            variant: "destructive",
            duration: 5000
        });
        return;
    }

    // Check monthly video call limit
    if (monthlyCallUsage && !monthlyCallUsage.hasTimeRemaining) {
        toast({
            title: "⏰ Monthly Limit Reached",
            description: `You have used all 5 minutes of video call time with this match for this month. Used: ${monthlyCallUsage.formattedUsedTime}/5:00`,
            variant: "destructive",
            duration: 7000
        });
        return;
    }

    const sessionId = crypto.randomUUID();
    const callId = crypto.randomUUID();
    setCurrentSessionId(sessionId);

    console.log('🚀 Starting video call invitation process...');
    const invitationPayload = {
        type: 'video_call_invitation',
        callerId: user._id,
        callerName: `${user.fname} ${user.lname}`,
        callerUsername: user.username,
        recipientId: recipientId,
        sessionId: sessionId,
        callId: callId,
        timestamp: new Date().toISOString(),
        message: `${user.fname} ${user.lname} is inviting you to a video call`
    };

    socket.emit('video_call_invitation', invitationPayload);

    // Send a message with a clickable video call link to the chat log
    try {
        const videoCallLinkMessage = `🎥 **Video Call Invitation**\n\n📞 ${user.fname} ${user.lname} is inviting you to a video call\n\n🔗 **Join Link:** [Click here to join the video call](/video-call?sessionId=${sessionId}&callerId=${user._id}&callerName=${encodeURIComponent(user.fname + ' ' + user.lname)})\n\n_This is a premium feature. Islamic supervision is active._`;
        // Fix: Pass recipientId instead of conversationId - backend expects userId parameter
        await chatService.sendMessage(recipientId, videoCallLinkMessage, 'video_call_invitation', invitationPayload);
    } catch (error) {
        console.error("Failed to send video call message to chat", error);
    }

    setIncomingCall({ 
        ...invitationPayload,
        isOutgoing: true 
    });
    
    setShowVideoCallInterface(true);
    
    toast({
        title: "📞 Video Call Started",
        description: `Invitation sent to ${recipientName}. Waiting for them to join...`,
        duration: 5000
    });
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !conversationId || isSending) return;
    
    try {
      setIsSending(true);
      console.log('Sending message:', messageText);
      const newMsg = await chatService.sendMessage(conversationId, messageText.trim());
      console.log('Message sent:', newMsg);
      
      setMessages(prev => [...prev, newMsg]);
      setMessageText("");
      scrollToBottom();
      
      toast({ title: "Message sent", description: "Your message has been delivered" });
    } catch (err: any) {
      console.error("Failed to send message", err);
      
      // Extract specific error message from API response
      let errorMessage = "Message not sent. Please try again.";
      
      if (err.response?.status === 422) {
        const apiError = err.response.data?.msg || err.response.data?.message;
        console.log('422 Error details:', apiError);
        
        if (apiError === 'plan exceeded') {
          errorMessage = "Message limit reached. Upgrade to premium for more messages or wait for your limit to reset.";
        } else if (apiError === 'wali details required to chat') {
          errorMessage = "Please complete your Wali details in your profile settings before sending messages.";
        } else if (apiError === 'wali email required to chat') {
          errorMessage = "Please add your Wali's email address in your profile settings before sending messages.";
        } else {
          errorMessage = `Message validation failed: ${apiError}`;
        }
      } else if (err.response?.status === 403) {
        errorMessage = "You can only message matched connections. Make sure you're both matched.";
      } else if (err.response?.status === 401) {
        errorMessage = "Please log in again to send messages.";
      }
      
      toast({ 
        title: "Message Failed", 
        description: errorMessage,
        variant: "destructive" 
      });
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // ... (rest of the code remains the same)

  if (!conversationId && !targetUserId) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-800 mb-4">No Conversation Selected</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Show loading state while creating/finding conversation
  if (!conversationId && targetUserId && loading) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-800 mb-4">Starting Conversation...</h2>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <div className="flex-1 flex flex-col bg-white">
        {/* Header */}
        <div className="p-2 sm:p-4 border-b bg-white flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Button>
            <h2 className="ml-2 sm:ml-4 text-base sm:text-lg font-medium text-gray-800">Chat</h2>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            {/* View Profile Button */}
            {recipientId && (
              <Button
                onClick={() => navigate(`/profile/${recipientId}`)}
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-50 hidden sm:flex"
              >
                <User className="w-4 h-4 mr-2" />
                View Profile
              </Button>
            )}
            
            {/* Mobile View Profile Button */}
            {recipientId && (
              <Button
                onClick={() => navigate(`/profile/${recipientId}`)}
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-50 sm:hidden p-2"
              >
                <User className="w-4 h-4" />
              </Button>
            )}
            
            {/* Video Call Button - Premium Feature */}
            {recipientId && (
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleStartVideoCall}
                  className={isPremiumUser(user) ? "bg-blue-600 hover:bg-blue-700 text-white" : "border-yellow-300 text-yellow-700 hover:bg-yellow-50"}
                  variant={isPremiumUser(user) ? "default" : "outline"}
                  size="sm"
                  disabled={monthlyCallUsage && !monthlyCallUsage.hasTimeRemaining}
                >
                  <Video className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Video Call</span>
                  <Crown className="h-3 w-3 ml-1" />
                </Button>
                {/* Monthly usage indicator - beside button */}
                {monthlyCallUsage && (
                  <div className="text-xs text-gray-500 hidden sm:block">
                    <span className={monthlyCallUsage.hasTimeRemaining ? "text-green-600" : "text-red-500"}>
                      {monthlyCallUsage.formattedRemainingTime} left
                    </span>
                    <span className="text-gray-400 ml-1">
                      ({monthlyCallUsage.formattedUsedTime}/5:00)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Video Containers - Show when video call is active */}
        {showVideoCallInterface && (
          <div className="p-2 sm:p-4 bg-gray-900 border-b">
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-4 justify-center">
              {/* Local Video Preview */}
              <div className="relative">
                <div
                  ref={localVideoRef}
                  className="w-full sm:w-64 h-32 sm:h-48 bg-black rounded-lg overflow-hidden border-2 border-blue-500"
                />
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  You ({user?.fname})
                </div>
              </div>
              
              {/* Remote Video Previews */}
              {remoteUserIds.map(uid => (
                <div key={uid} className="relative">
                  <div
                    id={`remote-container-${uid}`}
                    className="w-64 h-48 bg-black rounded-lg overflow-hidden border-2 border-green-500"
                  />
                  <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {recipientName || 'Remote User'}
                  </div>
                </div>
              ))}

              {/* Waiting for participant */}
              {remoteUserIds.length === 0 && (
                <div className="w-full sm:w-64 h-32 sm:h-48 bg-gray-800 rounded-lg border-2 border-dashed border-gray-600 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    <Clock className="w-6 sm:w-8 h-6 sm:h-8 mx-auto mb-2" />
                    <p className="text-xs sm:text-sm font-medium truncate">{recipientName || "Waiting..."}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Chat Window */}
        <div id="message-container" className="flex-1 p-2 sm:p-4 space-y-2 sm:space-y-4 bg-gray-50 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              <span className="ml-2 text-gray-500">Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-gray-500">
                <p className="text-lg mb-2">No messages yet</p>
                <p className="text-sm">Start the conversation by sending a message below</p>
              </div>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={msg._id || `msg-${index}`}
                className={`flex ${
                  msg.senderId === user?._id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[280px] sm:max-w-xs lg:max-w-md px-3 sm:px-4 py-2 rounded-lg ${
                    msg.senderId === user?._id
                      ? "bg-blue-500 text-white"
                      : "bg-white text-gray-800 border"
                  }`}
                >
                  <div className="text-sm">
                    {renderMessageContent(msg.message, msg.messageType, msg.videoCallData)}
                  </div>
                  <div className="text-xs mt-1 opacity-70">
                    {(() => {
                      try {
                        const date = new Date(msg.createdAt);
                        if (isNaN(date.getTime())) {
                          return 'Just now';
                        }
                        return date.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit',
                          hour12: true 
                        });
                      } catch (error) {
                        console.warn('Invalid date format:', msg.createdAt);
                        return 'Just now';
                      }
                    })()}
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-2 sm:p-4 border-t bg-white">
          {/* Task #29: Message counter display */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-2 text-xs text-gray-500 gap-1 sm:gap-0">
            <span className="truncate">
              Messages: {messagesUsed}/{messageLimit} 
              {messageLimit - messagesUsed <= 3 && messageLimit - messagesUsed > 0 && (
                <span className="text-orange-500 ml-1">({messageLimit - messagesUsed} left)</span>
              )}
              {messagesUsed >= messageLimit && (
                <span className="text-red-500 ml-1">(Limit reached)</span>
              )}
            </span>
            <span className={wordCount > maxWordsPerMessage ? "text-red-500" : "text-gray-500"}>
              Words: {wordCount}/{maxWordsPerMessage}
            </span>
          </div>
          <div className="flex gap-2">
            <Input
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="flex-1 text-sm sm:text-base"
              disabled={isSending || messagesUsed >= messageLimit}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!messageText.trim() || isSending}
              className="bg-blue-500 hover:bg-blue-600 px-3 sm:px-4"
              size="sm"
            >
              {isSending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Video Call Interface Popup */}
      {recipientId && (
        <VideoCallInterface
          recipientId={recipientId}
          recipientName={recipientName || "Chat Partner"}
          conversationId={conversationId || undefined}
          isOpen={showVideoCallInterface}
          onClose={() => {
            setShowVideoCallInterface(false);
            setIncomingCall(null);
            setRemoteUserIds([]);
            setCurrentSessionId(null);
          }}
          incomingCall={incomingCall}
          localVideoContainer={localVideoRef}
          onRemoteUserAdded={(userId: string) => {
            console.log('👥 Remote user added:', userId);
            setRemoteUserIds(ids => ids.includes(userId) ? ids : [...ids, userId]);
          }}
          onRemoteUserRemoved={(userId: string) => {
            console.log('👥 Remote user removed:', userId);
            setRemoteUserIds(ids => ids.filter(id => id !== userId));
          }}
          sessionId={currentSessionId}
        />
      )}
    </div>
  );
};

export default Messages;