
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
    transports: ['websocket'],
    withCredentials: true,
    autoConnect: false, // We'll connect manually when user is available
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });
};

export { createSocket };

// Default socket instance (will be replaced in App.tsx)
const socket = createSocket();
export default socket;
