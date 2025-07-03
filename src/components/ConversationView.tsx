import { useState, useRef, useEffect } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Send, Video, Phone, Smile, Mic } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import VideoCall from "./VideoCall";
import apiClient from "../lib/api-client";
import { useNavigate } from "react-router-dom";
import { useToast } from "../hooks/use-toast";

export interface Contact {
  id: string;
  name: string;
  photoUrl: string;
  online?: boolean;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  timestamp: string;
}

interface ConversationViewProps {
  contact: Contact;
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  sendingMessage?: boolean;
  userPlan?: string;
}

const ConversationView = ({
  contact,
  messages,
  currentUserId,
  onSendMessage,
  sendingMessage = false,
  userPlan = 'free',
}: ConversationViewProps) => {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !sendingMessage) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const startVideoCall = async () => {
    try {
      const response = await apiClient.post('/video-call/initiate', { 
        recipientId: contact.id 
      });
      
      toast({
        title: "Call Initiated",
        description: "Starting video call with Daily.co...",
      });
      
      navigate(`/video-call?room=${response.data.roomId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate video call. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-[#075e54] text-white shadow-sm">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={contact.photoUrl} alt={contact.name} />
            <AvatarFallback className="bg-gray-300 text-gray-700">
              {contact.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-medium">{contact.name}</h3>
            <p className="text-xs text-gray-200">
              {contact.online ? "online" : "last seen recently"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={() => {/* Voice call */}}
          >
            <Phone className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            className="text-white hover:bg-white/20"
            onClick={startVideoCall}
          >
            <Video className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-[#e5ddd5] space-y-2">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            <div className="text-center">
              <div className="text-6xl mb-4">💬</div>
              <p className="text-lg font-medium">Start your conversation</p>
              <p className="text-sm">Send a message to begin chatting</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.senderId === currentUserId ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[70%] rounded-lg px-3 py-2 shadow-sm relative ${msg.senderId === currentUserId ? "bg-[#dcf8c6]" : "bg-white"}`}>
                <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                <div className="flex items-center justify-end gap-1 mt-1">
                  <span className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-[#f0f0f0] border-t">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <div className="flex-1 relative bg-white rounded-full">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type a message"
              className="min-h-[48px] max-h-[120px] resize-none rounded-full border-none focus:ring-0 px-4 py-3 pr-20"
              disabled={sendingMessage}
              rows={1}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" className="p-1">
                <Smile className="h-5 w-5 text-gray-500" />
              </Button>
            </div>
          </div>
          <Button type="submit" size="icon" className="bg-[#128c7e] hover:bg-[#075e54] rounded-full w-12 h-12" disabled={!message.trim() || sendingMessage}>
            {sendingMessage ? <Mic className="h-6 w-6 text-white animate-pulse" /> : <Send className="h-6 w-6 text-white" />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ConversationView;
