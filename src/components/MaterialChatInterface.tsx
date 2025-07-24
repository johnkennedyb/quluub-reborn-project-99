
import React, { useState, useRef, useEffect } from "react";
import { Paper, Box, Stack, Typography } from "@mui/material";
import { Button, Empty, Space, Input, message, Modal } from "antd";
import { FlagOutlined } from "@ant-design/icons";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation } from "@tanstack/react-query";
import { chatService } from "@/lib/api-client";
import VideoCallLinkButton from "@/components/VideoCall/VideoCallLinkButton";

interface ChatMessage {
  id: string;
  message: string;
  sender: string;
  receiver: string;
  timestamp: string;
  status: string | null;
}

interface MaterialChatInterfaceProps {
  setChatCount?: (count: number) => void;
}

const MaterialChatInterface: React.FC<MaterialChatInterfaceProps> = ({ setChatCount }) => {
  const [msg, setMsg] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const endOfDivRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const location = useLocation();
  
  // Get userId from URL
  const userId = location.pathname.split("/")[2] || new URLSearchParams(location.search).get('userId');

  // Define plan limits
  const currentUserPlan = user?.plan || 'freemium';
  const planLimits = {
    freemium: { messageAllowance: 10, wordCountPerMessage: 20 },
    premium: { messageAllowance: 50, wordCountPerMessage: 100 }
  };

  const { messageAllowance, wordCountPerMessage } = planLimits[currentUserPlan as keyof typeof planLimits] || planLimits.freemium;

  useEffect(() => {
    if (setChatCount && user) {
      const sentMessagesCount = chat.filter((msg) => msg.sender === user.username).length;
      setChatCount(messageAllowance - sentMessagesCount);
    }

    if (chat.length > 0 && endOfDivRef.current) {
      endOfDivRef.current.scrollIntoView({ behavior: "smooth" });

      // Mark received messages as read
      const unreadIds = chat
        .filter(({ receiver, status }) => 
          receiver === user?.username && status === null
        )
        .map(({ id }) => id);

      if (unreadIds.length > 0) {
        readMutation.mutate({ ids: unreadIds });
      }
    }
  }, [chat.length, messageAllowance, setChatCount, user]);

  const { refetch } = useQuery({
    queryKey: ["chat", userId],
    queryFn: async () => {
      const data = await chatService.getChat(userId!);
      if (Array.isArray(data)) {
        setChat(data);
      }
      return data;
    },
    enabled: !!userId,
    refetchInterval: 60000, // 1 minute
  });

  const mutation = useMutation({
    mutationFn: () => chatService.addChat(userId!, msg),
    onSuccess: () => {
      setMsg("");
      refetch();
    },
  });

  const readMutation = useMutation({
    mutationFn: (data: { ids: string[] }) => chatService.updateChat(data.ids),
    onSuccess: () => {},
    onError: (error) => {
      console.error("Error marking messages as read:", error);
    },
  });

  const reportMutation = useMutation({
    mutationFn: async (reportData: { reportedUserId: string; reason: string; type: string }) => {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reportData)
      });
      if (!response.ok) throw new Error('Failed to submit report');
      return response.json();
    },
    onSuccess: () => {
      message.success('Report submitted successfully');
      setShowReportModal(false);
      setReportReason('');
    },
    onError: (error) => {
      message.error('Failed to submit report');
      console.error('Report error:', error);
    },
  });

  const sentMessagesCount = chat.filter((msg) => msg.sender === user?.username).length;
  const hasMetOrExceededPlan = sentMessagesCount >= messageAllowance;
  const hasMetOrExceededWordCountPerMessage = msg.split(" ").length >= wordCountPerMessage;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (hasMetOrExceededWordCountPerMessage || hasMetOrExceededPlan) {
      message.config({ maxCount: 1 });
      message.error(
        hasMetOrExceededWordCountPerMessage
          ? `You have a max of ${wordCountPerMessage} words per message, please make it concise`
          : `You have a maximum of ${messageAllowance} messages`
      );
    }
    setMsg(e.target.value);
  };

  const handleSend = () => {
    if (msg.length >= 5 && !hasMetOrExceededPlan && !hasMetOrExceededWordCountPerMessage) {
      mutation.mutate();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  const handleReport = () => {
    if (!reportReason.trim()) {
      message.error('Please provide a reason for reporting');
      return;
    }
    reportMutation.mutate({
      reportedUserId: userId!,
      reason: reportReason,
      type: 'chat'
    });
  };

  if (!userId) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="h6" color="error">
          No user selected for chat
        </Typography>
      </Box>
    );
  }

  return (
    <Stack spacing={2} sx={{ height: "100%", minHeight: "500px" }}>
      <Box
        sx={{
          height: "90%",
          display: "flex",
          flexDirection: "column",
          overflow: "auto",
          scrollbarWidth: "none",
          gap: "20px",
          padding: "10px",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
        }}
      >
        {chat.length > 0 ? (
          <>
            {chat.map(({ message: msgContent, sender, timestamp, status }, ind) => (
              <Paper
                key={`${timestamp}-${msgContent}-${ind}`}
                elevation={1}
                sx={{
                  width: "45%",
                  alignSelf: sender === user?.username ? "flex-end" : "flex-start",
                  padding: "15px 20px",
                  borderRadius: sender === user?.username 
                    ? "20px 20px 5px 20px" 
                    : "20px 20px 20px 5px",
                  backgroundColor: sender === user?.username ? "#75c0f9" : "#ffffff",
                  color: sender === user?.username ? "#ffffff" : "#333333",
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
                }}
                ref={ind === chat.length - 1 ? endOfDivRef : null}
              >
                <Typography variant="body1" sx={{ wordBreak: "break-word" }}>
                  {msgContent}
                </Typography>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <Typography variant="caption" sx={{ 
                    opacity: 0.7,
                    fontSize: "0.7rem"
                  }}>
                    {new Date(timestamp).toLocaleTimeString([], { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </Typography>
                  {status === null && sender !== user?.username && (
                    <Typography variant="caption" sx={{ 
                      color: "#4caf50", 
                      fontWeight: "bold",
                      fontSize: "0.7rem"
                    }}>
                      New
                    </Typography>
                  )}
                </Box>
              </Paper>
            ))}
          </>
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={`Please send a message to begin conversation`}
            style={{ 
              margin: "auto",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              height: "100%"
            }}
          />
        )}
      </Box>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <VideoCallLinkButton 
          recipientId={userId!}
          recipientName="User"
        />
        <Button
          icon={<FlagOutlined />}
          onClick={() => setShowReportModal(true)}
          style={{
            borderRadius: "20px",
            height: "45px",
            backgroundColor: "#ff4d4f",
            borderColor: "#ff4d4f",
            color: "white"
          }}
          title="Report User"
        />
        <Modal
          title="Report User"
          open={showReportModal}
          onOk={handleReport}
          onCancel={() => {
            setShowReportModal(false);
            setReportReason('');
          }}
          confirmLoading={reportMutation.isPending}
        >
          <Input.TextArea
            placeholder="Please describe the reason for reporting this user..."
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            rows={4}
          />
        </Modal>
        <Space.Compact style={{ width: "100%" }}>
          <Input
            placeholder="Type a message..."
            value={msg}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            disabled={hasMetOrExceededPlan}
            status={hasMetOrExceededWordCountPerMessage ? "error" : ""}
            style={{ 
              borderRadius: "20px",
              height: "45px",
              fontSize: "14px"
            }}
          />
          <Button
            type="primary"
            onClick={handleSend}
            disabled={
              msg.length < 5 ||
              hasMetOrExceededPlan ||
              hasMetOrExceededWordCountPerMessage ||
              mutation.isPending
            }
            loading={mutation.isPending}
            style={{
              borderRadius: "20px",
              height: "45px",
              backgroundColor: "#75c0f9",
              borderColor: "#75c0f9"
            }}
          >
            Send
          </Button>
        </Space.Compact>
      </div>

      {(hasMetOrExceededWordCountPerMessage || hasMetOrExceededPlan) && (
        <Typography
          color="error"
          variant="caption"
          display="block"
          style={{ textAlign: "center", padding: "8px" }}
        >
          {hasMetOrExceededWordCountPerMessage
            ? `You have a max of ${wordCountPerMessage} words per message, please make it concise`
            : hasMetOrExceededPlan
            ? `You have a maximum of ${messageAllowance} messages`
            : ""}
        </Typography>
      )}
    </Stack>
  );
};

export default MaterialChatInterface;
