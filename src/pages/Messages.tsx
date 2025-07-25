import { useState, useEffect, useRef, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { chatService } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ArrowLeft, Video, Send, ExternalLink, Crown, Flag, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/api-client";
import socket from "@/lib/socket";
import { isPremiumUser, hasFeatureAccess, getUpgradeMessage, PREMIUM_FEATURES } from "@/utils/premiumUtils";
import ZoomVideoCall from "@/components/ZoomVideoCall";

interface Message {
  _id: string;
  senderId: string;
  message: string;
  createdAt: string;
  messageType?: string;
  videoCallData?: {
    meetingId?: string;
    roomUrl: string;
    hostRoomUrl?: string;
    roomName: string;
    startDate?: string;
    endDate?: string;
    senderName: string;
    receiverName: string;
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
  const [sending, setSending] = useState(false);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [showZoomCall, setShowZoomCall] = useState(false);
  const [recipientName, setRecipientName] = useState<string>("");
  
  // Task #29: Message counter state
  const [messageLimit, setMessageLimit] = useState(10); // Default limit for free users
  const [messagesUsed, setMessagesUsed] = useState(0);
  const [wordCount, setWordCount] = useState(0);
  const maxWordsPerMessage = 100; // Word limit per message

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Get conversation id or user id for new conversations
  const urlParams = new URLSearchParams(location.search);
  const conversationId = urlParams.get("conversation");
  const targetUserId = urlParams.get("user");

  // Helper function to render message content with clickable links
  const renderMessageContent = (message: string, messageType?: string, videoCallData?: any) => {
    // Check if this is a video call invitation message
    if (messageType === 'video_call_invitation' && videoCallData) {
      return (
        <div className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 text-green-700">
            <Video className="h-5 w-5" />
            <span className="font-semibold">Whereby Video Call Invitation</span>
            <Crown className="h-4 w-4 text-yellow-500" />
          </div>
          <div className="text-sm text-gray-700">
            <p className="font-medium">{videoCallData.roomName}</p>
            <p className="text-xs text-gray-500 mt-1">
              From: {videoCallData.senderName} • To: {videoCallData.receiverName}
            </p>
            {videoCallData.startDate && (
              <p className="text-xs text-gray-500">
                Started: {(() => {
                  try {
                    const date = new Date(videoCallData.startDate);
                    return isNaN(date.getTime()) ? 'Just now' : date.toLocaleString();
                  } catch {
                    return 'Just now';
                  }
                })()}
              </p>
            )}
          </div>
          <Button
            onClick={() => window.open(videoCallData.roomUrl, '_blank')}
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

  // Socket listeners for messages only (video call functionality removed)
  useEffect(() => {
    if (!user) return;

    // Only message-related socket listeners remain
    // Video call socket listeners have been removed

    return () => {
      // Cleanup any remaining socket listeners if needed
    };
  }, [user]);

  // fetchMessages is already called in the main useEffect above

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket || !user?._id) return;

    // Listen for video call invitations
    const handleVideoCallInvitation = (data: any) => {
      if (data.receiverId === user._id || data.senderId === user._id) {
        // Show toast notification for incoming video call
        if (data.receiverId === user._id) {
          toast({
            title: "📞 Incoming Video Call!",
            description: `${data.senderName} is inviting you to a video call`,
            action: (
              <Button 
                size="sm" 
                onClick={() => window.open(data.roomUrl, '_blank')}
                className="bg-green-600 hover:bg-green-700"
              >
                Join Call
              </Button>
            ),
          });
        }
        
        // Add the video call invitation message directly instead of refetching all messages
        if (data.chat && (data.chat.senderId === user._id || data.chat.receiverId === user._id)) {
          setMessages(prev => [...prev, data.chat]);
          scrollToBottom();
        }
      }
    };

    // Listen for new messages
    const handleNewMessage = (data: any) => {
      if (data.conversationId === conversationId || 
          (data.message && (data.message.senderId === user._id || data.message.receiverId === user._id))) {
        setMessages(prev => {
          // Prevent duplicate messages
          const messageExists = prev.some(msg => msg._id === data.message._id);
          if (messageExists) return prev;
          return [...prev, data.message];
        });
        scrollToBottom();
      }
    };

    socket.on('video_call_invitation', handleVideoCallInvitation);
    socket.on('new_message', handleNewMessage);

    return () => {
      socket.off('video_call_invitation', handleVideoCallInvitation);
      socket.off('new_message', handleNewMessage);
    };
  }, [socket, user?._id, conversationId]);

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

  const sendMessage = async () => {
    if (!messageText.trim() || !conversationId || sending) return;
    
    try {
      setSending(true);
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
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startVideoCall = async () => {
    if (!recipientId) {
      toast({ title: "Error", description: "Cannot identify the other user for video call", variant: "destructive" });
      return;
    }
    
    // Check if user has video call access
    if (!hasFeatureAccess(user, 'VIDEO_CALLS')) {
      toast({
        title: "Premium Feature",
        description: getUpgradeMessage('VIDEO_CALLS'),
        variant: "destructive",
      });
      // Redirect to upgrade page
      navigate('/upgrade');
      return;
    }
    
    // Removed old video call functionality
    // Now using Zoom only
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
        <div className="p-4 border-b bg-white flex items-center justify-between shadow-sm">
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5 text-gray-700" />
            </Button>
            <h2 className="ml-4 text-lg font-medium text-gray-800">Chat</h2>
          </div>
          <div className="flex items-center gap-2">
            {/* View Profile Button */}
            {recipientId && (
              <Button
                onClick={() => navigate(`/profile/${recipientId}`)}
                variant="outline"
                size="sm"
                className="border-gray-300 hover:bg-gray-50"
              >
                <User className="w-4 h-4 mr-2" />
                View Profile
              </Button>
            )}
            
            {/* Video Call Button */}
            {recipientId && isPremiumUser(user) && (
              <Button
                onClick={async () => {
                  try {
                    // Send chat notification to match about video call invitation
                    await chatService.sendMessage({
                      conversationId: conversationId!,
                      message: `🎥 ${user?.firstName || 'Someone'} is inviting you to a video call. Click the video call button to join!`,
                      messageType: 'video_call_invitation'
                    });
                    
                    toast({
                      title: "Video Call Invitation Sent",
                      description: `${recipientName} has been notified about the video call invitation.`,
                      variant: "default"
                    });
                    
                    // Start the video call
                    setShowZoomCall(true);
                  } catch (error) {
                    console.error('Error sending video call invitation:', error);
                    toast({
                      title: "Invitation Failed",
                      description: "Failed to send video call invitation. Starting call anyway...",
                      variant: "destructive"
                    });
                    setShowZoomCall(true);
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                size="sm"
              >
                <Video className="w-4 h-4 mr-2" />
                Video Call
                <Crown className="w-3 h-3 ml-1 text-yellow-400" />
              </Button>
            )}
            {recipientId && !isPremiumUser(user) && (
              <Button
                onClick={() => {
                  toast({
                    title: "Premium Feature",
                    description: "Video calling is available for Premium users only. Upgrade to access this feature.",
                    variant: "destructive"
                  });
                }}
                variant="outline"
                size="sm"
              >
                <Video className="w-4 h-4 mr-2" />
                Video Call
                <Crown className="w-3 h-3 ml-1 text-yellow-400" />
              </Button>
            )}
            

          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 p-4 space-y-4 bg-gray-50 overflow-y-auto">
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
            messages.map((msg) => {
            if (msg.messageType === 'video-call-invitation' || msg.message?.includes('🎥 Professional Video Call Invitation:')) {
              const urlRegex = /(https?:\/\/[^\s]+)/;
              const match = msg.message.match(urlRegex);
              const meetingUrl = match ? match[0] : '#';
              const senderName = (msg.senderId === user?._id ? 'You' : 'Someone');

              return (
                <div key={msg._id} className="flex justify-end my-2">
                  <div className="bg-indigo-100 dark:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 max-w-md text-center shadow-md">
                    <div className="flex items-center justify-center mb-2">
                      <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center mr-2">
                        <span className="text-white text-lg">🎥</span>
                      </div>
                      <p className="text-md font-semibold text-indigo-800 dark:text-indigo-200">Professional Video Call</p>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{senderName} has invited you to a video call.</p>
                    <a href={meetingUrl} target="_blank" rel="noopener noreferrer" className="inline-block w-full">
                      <button className="w-full bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50">
                        Join Call
                      </button>
                    </a>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg._id}
                className={`flex ${
                  msg.senderId === user?._id ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
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
            )}
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="p-4 border-t bg-white">
          {/* Task #29: Message counter display */}
          <div className="flex justify-between items-center mb-2 text-xs text-gray-500">
            <span>
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
              className="flex-1"
              disabled={sending || messagesUsed >= messageLimit}
            />
            <Button 
              onClick={sendMessage} 
              disabled={!messageText.trim() || sending}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Zoom Video Call Component */}
      {showZoomCall && recipientId && (
        <ZoomVideoCall
          participantId={recipientId}
          participantName={recipientName || "Chat Partner"}
          onCallEnd={() => {
            setShowZoomCall(false);
            toast({
              title: "📞 Call Ended",
              description: "Video call has ended. Recording sent to Wali for review."
            });
          }}
        />
      )}
    </div>
  );
};

export default Messages;