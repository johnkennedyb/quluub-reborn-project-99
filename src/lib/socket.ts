
import { io } from "socket.io-client";

const getSocketUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl.replace('/api', '');
  }
  return 'http://localhost:5000';
};

// Create socket connection with proper configuration
const createSocket = (userId?: string) => {
  const socketUrl = getSocketUrl();
  console.log('Creating socket connection to:', socketUrl, 'for user:', userId);
  
  return io(socketUrl, {
    query: { userId: userId || '' },
    transports: ['polling', 'websocket'], // Start with polling, then upgrade to websocket
    withCredentials: false, // Disable credentials for local development
    autoConnect: false, // We'll connect manually when user is available
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 10, // Increase attempts
    timeout: 30000, // 30 second timeout
    forceNew: false,
    upgrade: true, // Allow transport upgrades
    rememberUpgrade: false, // Don't remember failed upgrades
  });
};

export { createSocket };

// Default socket instance (will be replaced in App.tsx)
const socket = createSocket();
export default socket;
