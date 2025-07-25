
import { useEffect, useState, useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { VideoCallProvider } from "@/contexts/VideoCallContext";
import VideoCallRoom from "@/components/VideoCall/VideoCallRoom";

// Components
import PrivateRoute from "@/components/PrivateRoute";
import AdminRoute from "@/components/AdminRoute";
import VideoCallNotificationModal from "@/components/VideoCallNotificationModal";

// Pages
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import GoogleCallback from "@/pages/GoogleCallback";
import AdminLogin from "@/pages/AdminLogin";
import AdminSignup from "@/pages/AdminSignup";
import Dashboard from "@/pages/Dashboard";
import Browse from "@/pages/Browse";
import Messages from "@/pages/Messages";
import Profile from "@/pages/Profile";
import Settings from "@/pages/Settings";
import VideoCallZoom from "@/pages/VideoCallZoom";
import VideoCallTest from "@/pages/VideoCallTest";
import AdminDashboard from "@/pages/AdminDashboard";
import Search from "@/pages/Search";
import Notifications from "@/pages/Notifications";
import WaliChat from "@/pages/WaliChat";
import ValidateEmail from "@/pages/ValidateEmail";
import ResetPassword from "@/pages/ResetPassword";
import NotFound from "@/pages/NotFound";
import Alerts from "@/pages/Alerts";
import UserProfilePage from "@/pages/admin/UserProfilePage";

// Socket
import { io, Socket } from "socket.io-client";



// App Component
export const queryClient = new QueryClient();

function App() {
  const navigate = useNavigate();
    const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [incomingCall, setIncomingCall] = useState<{
    callerName: string;
    callerImage?: string;
    roomId: string;
  } | null>(null);

  // Setup socket connection when user is authenticated
  useEffect(() => {
    if (!user?._id) {
      if (socket) {
        console.log('Disconnecting socket - no user');
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    console.log('Setting up socket connection for user:', user._id);

        const socketUrl = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace('/api', '');

    const newSocket = io(socketUrl, {
      query: { userId: user._id },
      transports: ["websocket"],
      withCredentials: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    setSocket(newSocket);

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      console.log('User ID set to:', user._id);
      
      // Join notifications room
      newSocket.emit('joinNotifications', user._id);
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
    });

    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      // Re-join notifications room after reconnection
      newSocket.emit('joinNotifications', user._id);
    });

    // Debug ping to test connection
    newSocket.emit('debug-ping', { userId: user._id, timestamp: Date.now() });

    // Handle debug responses
    newSocket.on('debug-pong', (data) => {
      console.log('Debug pong received:', data);
    });

    // Handle incoming video call notifications (multiple methods)
    newSocket.on('newNotification', (data) => {
      console.log('Received notification:', data);
      if (data.type === 'video_call') {
        console.log('Video call notification received');
        setIncomingCall({
          callerName: data.message.replace('Incoming video call from ', ''),
          callerImage: '',
          roomId: data.relatedId,
        });
      }
    });

    // Direct video call events
    newSocket.on('video-call-incoming', ({ from, roomId, callerImage }) => {
      console.log('Direct video call notification from:', from, 'Room:', roomId);
      setIncomingCall({
        callerName: from || 'Someone',
        callerImage: callerImage || '',
        roomId: roomId,
      });
    });

    // Broadcast notifications (fallback method)
    newSocket.on('video-call-notification-broadcast', ({ targetUserId, from, roomId, callerImage }) => {
      console.log('Broadcast video call notification - Target:', targetUserId, 'From:', from);
      if (targetUserId === user._id) {
        console.log('This broadcast notification is for me!');
        setIncomingCall({
          callerName: from || 'Someone',
          callerImage: callerImage || '',
          roomId: roomId,
        });
      }
    });

    return () => {
      console.log('Cleaning up socket connection');
      newSocket.disconnect();
    };
  }, [user]);

  const handleAcceptCall = () => {
    if (incomingCall?.roomId && socket) {
      console.log('Accepting call for room:', incomingCall.roomId);
      socket.emit("accept-call", { roomId: incomingCall.roomId });
      navigate(`/video-call?room=${incomingCall.roomId}`);
      setIncomingCall(null);
    }
  };

  const handleDeclineCall = () => {
    if (incomingCall?.roomId && socket) {
      console.log('Declining call for room:', incomingCall.roomId);
      socket.emit("decline-call", { roomId: incomingCall.roomId });
    }
    setIncomingCall(null);
  };

  return (
    <VideoCallProvider>
      <div className="min-h-screen bg-background">
        <Routes>
        {/* Public routes */}
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/auth/google/callback" element={<GoogleCallback />} />
        <Route path="/validate-email" element={<ValidateEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/wali-chat/:token" element={<WaliChat />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/signup" element={<AdminSignup />} />

        {/* Private video call routes - authentication required */}
        <Route path="/video-call" element={<PrivateRoute element={<VideoCallZoom />} />} />
        <Route path="/video-call/:callId" element={<PrivateRoute element={<VideoCallRoom />} />} />
        <Route path="/video-call-test" element={<PrivateRoute element={<VideoCallTest />} />} />

        {/* User routes */}
        <Route path="/dashboard" element={<PrivateRoute element={<Dashboard />} />} />
        <Route path="/search" element={<PrivateRoute element={<Search />} />} />
        <Route path="/messages" element={<PrivateRoute element={<Messages />} />} />
        <Route path="/profile" element={<PrivateRoute element={<Profile />} />} />
        <Route path="/profile/:userId" element={<PrivateRoute element={<Profile />} />} />
        <Route path="/settings" element={<PrivateRoute element={<Settings />} />} />
        <Route path="/notifications" element={<PrivateRoute element={<Notifications />} />} />
        <Route path="/alerts" element={<PrivateRoute element={<Alerts />} />} />

        {/* Admin routes */}
                <Route path="/admin" element={<AdminRoute element={<AdminDashboard />} />} />
        <Route path="/admin/user/:userId" element={<AdminRoute element={<UserProfilePage />} />} />

          {/* 404 fallback */}
          <Route path="*" element={<NotFound />} />
        </Routes>

      {/* Incoming video call modal */}
      <VideoCallNotificationModal
        isOpen={!!incomingCall}
        callerName={incomingCall?.callerName || ""}
        callerImage={incomingCall?.callerImage}
        roomId={incomingCall?.roomId || ""}
        onClose={() => setIncomingCall(null)}
        onAccept={handleAcceptCall}
        onDecline={handleDeclineCall}
      />

        <Toaster />
      </div>
    </VideoCallProvider>
  );
}

export default App;
