import { useState, useEffect, useRef, useContext } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { chatService } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { AuthContext } from "@/contexts/AuthContext";
import { ArrowLeft, Video, Send, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import apiClient from "@/lib/api-client";
import socket from "@/lib/socket";

interface Message {
  _id: string;
  senderId: string;
  message: string;
  createdAt: string;
}

const Messages = () => {
  const { user } = useContext(AuthContext);
  const { toast } = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [recipientId, setRecipientId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'answered' | 'declined' | 'missed'>('idle');

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Get conversation id
  const urlParams = new URLSearchParams(location.search);
  const conversationId = urlParams.get("conversation");

  // Helper function to render message content with clickable links
  const renderMessageContent = (message: string) => {
    // Check if message contains video call link (updated for Jitsi)
    const videoCallRegex = /📹 Video call invitation: Join me at (https?:\/\/meet\.jit\.si\/[^\s]+)/;
    const match = message.match(videoCallRegex);
    
    if (match) {
      const url = match[1];
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-blue-600">
            <Video className="h-4 w-4" />
            <span className="font-medium">Video Call Invitation</span>
          </div>
          <Button
            onClick={() => window.open(url, '_blank')}
            variant="outline"
            size="sm"
            className="w-full text-left justify-start gap-2"
          >
            <ExternalLink className="h-4 w-4" />
            Join Video Call
          </Button>
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

  useEffect(() => {
    if (!conversationId) {
      toast({ title: "Error", description: "No conversation ID found", variant: "destructive" });
      return;
    }

    const fetchMessages = async () => {
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

    fetchMessages();

    // Set up polling for new messages
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [conversationId, toast, user]);

  // Listen for call status updates
  useEffect(() => {
    if (!user) return;

    socket.on('call-accepted', ({ roomId }) => {
      console.log('Call accepted for room:', roomId);
      setCallStatus('answered');
      toast({
        title: "Call Accepted",
        description: "The other user accepted your call",
      });
    });

    socket.on('call-declined', ({ roomId }) => {
      console.log('Call declined for room:', roomId);
      setCallStatus('declined');
      toast({
        title: "Call Declined",
        description: "The other user declined your call",
        variant: "destructive",
      });
    });

    socket.on('callStatusUpdate', ({ status }) => {
      console.log('Call status update:', status);
      if (status === 'missed') {
        setCallStatus('missed');
        toast({
          title: "Call Missed",
          description: "The other user didn't answer",
          variant: "destructive",
        });
      }
    });

    return () => {
      socket.off('call-accepted');
      socket.off('call-declined');
      socket.off('callStatusUpdate');
    };
  }, [user, toast]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    } catch (err) {
      console.error("Failed to send message", err);
      toast({ 
        title: "Error", 
        description: "Message not sent. You may need to be matched with this user to send messages.",
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
    
    try {
      setCallStatus('calling');
      console.log('Initiating video call with recipient:', recipientId);
      
      const response = await apiClient.post('/video-call/initiate', {
        recipientId: recipientId
      });
      
      console.log('Video call initiated:', response.data);
      
      toast({
        title: "Call Initiated",
        description: "Video call link sent in chat. You can also join directly.",
      });
      
      // Navigate to video call page or open Jitsi directly
      if (response.data.jitsiRoomUrl) {
        // Open Jitsi directly in a new tab
        window.open(response.data.jitsiRoomUrl, '_blank');
      } else {
        // Fallback to internal video call page
        navigate(`/video-call?room=${response.data.roomId}`);
      }
      
    } catch (error: any) {
      console.error('Error initiating video call:', error);
      setCallStatus('idle');
      toast({
        title: "Call Failed",
        description: error.response?.data?.message || "Failed to initiate video call",
        variant: "destructive",
      });
    }
  };

  const getCallButtonText = () => {
    switch (callStatus) {
      case 'calling': return 'Calling...';
      case 'answered': return 'Call Answered';
      case 'declined': return 'Call Declined';
      case 'missed': return 'Call Missed';
      default: return 'Video Call';
    }
  };

  if (!conversationId) {
    return (
      <div className="flex h-screen bg-gray-100 items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-800 mb-4">No Conversation Selected</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
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
            {callStatus !== 'idle' && (
              <span className={`text-sm px-2 py-1 rounded ${
                callStatus === 'calling' ? 'bg-yellow-100 text-yellow-800' :
                callStatus === 'answered' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {callStatus === 'calling' ? 'Calling...' :
                 callStatus === 'answered' ? 'Answered' :
                 callStatus === 'declined' ? 'Declined' : 'Missed'}
              </span>
            )}
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={startVideoCall}
              className="text-green-600 hover:text-green-700 hover:bg-green-50"
              title="Start Video Call"
              disabled={!recipientId || callStatus === 'calling'}
            >
              <Video className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 p-4 space-y-4 bg-gray-50">
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
            messages.map(msg => {
              const isMine = msg.senderId === user?._id;
              const dateObj = new Date(msg.createdAt);
              const timeLabel = !isNaN(dateObj.getTime())
                ? dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '';

              return (
                <div
                  key={msg._id}
                  className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`
                    ${isMine 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-800 border border-gray-200'
                    } 
                    max-w-xs sm:max-w-md px-4 py-3 rounded-2xl shadow-sm
                  `}> 
                    <div className="text-sm leading-relaxed">
                      {renderMessageContent(msg.message)}
                    </div>
                    {timeLabel && (
                      <div className={`text-xs mt-2 ${isMine ? 'text-blue-100' : 'text-gray-500'}`}>
                        {timeLabel}
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Box */}
        <div className="p-4 border-t bg-white">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder="Type your message..."
              value={messageText}
              onChange={e => setMessageText(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={sending}
            />
            <Button 
              onClick={sendMessage}
              disabled={!messageText.trim() || sending}
              className="rounded-xl px-6 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50"
            >
              {sending ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
          <div className="text-xs text-gray-500 mt-2 text-center">
            Press Enter to send • Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
