import { createContext, useContext, useState, useEffect } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "./AuthContext"; // Assuming you use this
import { useNavigate } from "react-router-dom";

interface CallerInfo {
  roomId: string;
  callerName: string;
  callerImage?: string;
}

interface CallContextValue {
  isModalOpen: boolean;
  callerInfo: CallerInfo | null;
  acceptCall: () => void;
  declineCall: () => void;
}

const CallContext = createContext<CallContextValue | undefined>(undefined);

export const CallProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [callerInfo, setCallerInfo] = useState<CallerInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user?._id) return;

    const newSocket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
      query: { userId: user._id },
      transports: ["websocket"],
    });

    setSocket(newSocket);

    newSocket.on("video-call-incoming", ({ from, roomId }) => {
      setCallerInfo({
        roomId,
        callerName: "Someone", // optional: fetch user info with `from`
        callerImage: "", // set dynamically if available
      });
      setIsModalOpen(true);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const acceptCall = () => {
    if (callerInfo?.roomId) {
      navigate(`/video-call?room=${callerInfo.roomId}`);
    }
    setIsModalOpen(false);
  };

  const declineCall = () => {
    setIsModalOpen(false);
    setCallerInfo(null);
    // Optionally emit a decline signal
  };

  return (
    <CallContext.Provider value={{ isModalOpen, callerInfo, acceptCall, declineCall }}>
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) throw new Error("useCall must be used within a CallProvider");
  return context;
};
