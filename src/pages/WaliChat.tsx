import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { ArrowLeft, MessageSquare, Users, Shield, Eye } from "lucide-react";

interface ChatMessage {
  message: string;
  sender: string;
  receiver: string;
  timestamp: string;
  status?: string;
}

interface WardInfo {
  fname: string;
  lname: string;
  username: string;
}

const WaliChat = () => {
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [ward, setWard] = useState<string>("");
  const [wardInfo, setWardInfo] = useState<WardInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const endOfDivRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const token = location.pathname.split("/")[2];

  useEffect(() => {
    if (!token) {
      toast({
        title: "Access Denied",
        description: "Invalid or missing access token",
        variant: "destructive",
      });
      navigate("/");
      return;
    }
    
    fetchWaliChat();
  }, [token, navigate]);

  useEffect(() => {
    if (chat.length > 0 && endOfDivRef.current) {
      endOfDivRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat.length]);

  const fetchWaliChat = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/wali/chat-view?token=${token}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch chat data');
      }

      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setChat(data.data);
        setWard(data.ward);
        setWardInfo(data.wardInfo);
      } else {
        setError(data.message || 'Failed to load chat data');
      }
    } catch (error) {
      console.error('Error fetching Wali chat:', error);
      setError('Failed to load chat messages');
      toast({
        title: "Error",
        description: "Failed to load chat messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getParticipants = () => {
    if (chat.length === 0) return { sender: "", receiver: "" };
    return {
      sender: chat[0].sender,
      receiver: chat[0].receiver
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  const participants = getParticipants();

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          
          <div className="flex items-center space-x-2">
            <img 
              src="/logo.png" 
              alt="Quluub" 
              className="h-8 w-8 cursor-pointer"
              onClick={() => navigate("/")}
            />
            <h1 className="text-xl font-bold text-gray-900">Wali Chat Supervision</h1>
          </div>
          
          <div className="w-24" /> {/* Spacer for centering */}
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <span>Supervised Conversation</span>
              <Badge variant="secondary" className="ml-2">
                <Eye className="h-3 w-3 mr-1" />
                Wali View
              </Badge>
            </CardTitle>
            
            {participants.sender && participants.receiver && (
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <div className="flex items-center space-x-1">
                  <Users className="h-4 w-4" />
                  <span>Between: {participants.sender} and {participants.receiver}</span>
                </div>
                {wardInfo && (
                  <div>
                    <span>Ward: {wardInfo.fname} {wardInfo.lname} (@{wardInfo.username})</span>
                  </div>
                )}
              </div>
            )}
          </CardHeader>

          <CardContent>
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <Shield className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Islamic Compliance Notice:</strong> This conversation is being supervised 
                for proper Islamic guidance and oversight. All messages are monitored to ensure 
                halal communication between potential marriage partners.
              </AlertDescription>
            </Alert>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {chat.length > 0 ? (
                <>
                  {chat.map((msg, index) => (
                    <div key={`${msg.timestamp}-${index}`}>
                      <div className={`flex ${msg.sender === ward ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                          msg.sender === ward 
                            ? 'bg-blue-500 text-white rounded-br-none' 
                            : 'bg-gray-200 text-gray-900 rounded-bl-none'
                        }`}>
                          <p className="text-sm">{msg.message}</p>
                          <div className="flex items-center justify-between mt-2 text-xs opacity-75">
                            <span>{msg.sender}</span>
                            <span>{formatTimestamp(msg.timestamp)}</span>
                          </div>
                        </div>
                      </div>
                      {index < chat.length - 1 && <Separator className="my-2" />}
                    </div>
                  ))}
                  <div ref={endOfDivRef} />
                </>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 mb-2">No messages found!</p>
                    <p className="text-sm text-gray-400">
                      This may be because either party withdrew their connection
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {error && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Quluub - Islamic Marriage Platform | Ensuring halal connections with proper supervision
          </p>
        </div>
      </div>
    </div>
  );
};

export default WaliChat;
