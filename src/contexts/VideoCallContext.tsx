import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { webrtcService, CallData, WebRTCCallbacks } from '../services/webrtcService';
import { recordingService } from '../services/recordingService';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';
import IncomingCallNotification from '../components/VideoCall/IncomingCallNotification';
import VideoCallModal from '../components/VideoCall/VideoCallModal';

interface VideoCallContextType {
  initiateCall: (recipientId: string) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => Promise<void>;
  isInCall: boolean;
  currentCall: CallData | null;
  callDuration: number;
  connectionStatus: 'connecting' | 'connected' | 'disconnected';
  isRecording: boolean;
  recordingBlob: Blob | null;
  showModal: boolean;
  incomingCall: CallData | null;
}

const VideoCallContext = createContext<VideoCallContextType | undefined>(undefined);

export const useVideoCall = () => {
  const context = useContext(VideoCallContext);
  if (!context) {
    throw new Error('useVideoCall must be used within a VideoCallProvider');
  }
  return context;
};

interface VideoCallProviderProps {
  children: ReactNode;
}

// TEMPORARILY DISABLED - Conflicting with PeerJS video calls
// This context was causing immediate call termination
// const VideoCallProvider: React.FC<VideoCallProviderProps> = ({ children }) => {
//   const { user } = useAuth();
//   const [currentCall, setCurrentCall] = useState<CallData | null>(null);
//   const [callDuration, setCallDuration] = useState(0);
//   const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');
//   const [isRecording, setIsRecording] = useState(false);
//   const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
//   const [showIncomingCall, setShowIncomingCall] = useState(false);
//   const [showVideoModal, setShowVideoModal] = useState(false);
//   const [isIncomingCall, setIsIncomingCall] = useState(false);
//   const [incomingCallData, setIncomingCallData] = useState<CallData | null>(null);
//
//   useEffect(() => {
//     if (!user) {
//       console.log('❌ No user found, skipping WebRTC initialization');
//       return;
//     }
//
//     console.log('👤 User found, initializing WebRTC for:', user.fname);
//     
//     // Small delay to ensure token and user data are properly set
//     setTimeout(() => {
//       webrtcService.reinitialize();
//     }, 1000);
//
//     const callbacks: WebRTCCallbacks = {
//       onIncomingCall: (callData: CallData) => {
//         console.log('📞 Incoming call from:', callData.callerName);
//         setIncomingCallData(callData);
//         setShowIncomingCall(true);
//         setIsIncomingCall(true);
//       },
//       onCallAccepted: () => {
//         console.log('✅ Call accepted');
//         setConnectionStatus('connected');
//         setShowIncomingCall(false);
//         setShowVideoModal(true);
//         
//         // Start recording after connection is established
//         setTimeout(async () => {
//           await startRecording();
//         }, 2000);
//       },
//       onCallRejected: () => {
//         console.log('❌ Call rejected');
//         handleCallEnd();
//       },
//       onCallEnded: () => {
//         console.log('📞 Call ended');
//         handleCallEnd();
//       },
//       onCallCancelled: () => {
//         console.log('🚫 Call cancelled');
//         handleCallEnd();
//       },
//       onRemoteStream: (stream: MediaStream) => {
//         console.log('📺 Remote stream received');
//       },
//       onConnectionStateChange: (state: RTCPeerConnectionState) => {
//         console.log('🔗 Connection state:', state);
//         if (state === 'connected') {
//           setConnectionStatus('connected');
//         } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
//           setConnectionStatus('disconnected');
//           handleCallEnd();
//         }
//       }
//     };
//
//     webrtcService.setCallbacks(callbacks);
//
//     return () => {
//       // Cleanup on unmount
//     };
//   }, [user]);
//
//   // Helper function to start recording
//   const startRecording = async () => {
//     try {
//       const localStream = webrtcService.getLocalStream();
//       const remoteStream = webrtcService.getRemoteStream();
//       
//       if (localStream && remoteStream) {
//         const combinedStream = recordingService.createCombinedStream(localStream, remoteStream);
//         await recordingService.startRecording(combinedStream);
//         setIsRecording(true);
//         toast.success('📹 Recording started');
//       }
//     } catch (error) {
//       console.error('Error starting recording:', error);
//       toast.error('Failed to start recording');
//     }
//   };
//
//   // Helper function to upload recording
//   const uploadRecording = async (blob: Blob) => {
//     try {
//       const callId = `${user?.id}-${Date.now()}`;
//       const recordingUrl = await recordingService.uploadRecording(blob, callId);
//       toast.success('📹 Recording sent to Wali');
//       return recordingUrl;
//     } catch (error) {
//       console.error('Error uploading recording:', error);
//       toast.error('Failed to send recording to Wali');
//     }
//   };
//
//   // Handle call end cleanup
//   const handleCallEnd = () => {
//     setCurrentCall(null);
//     setShowIncomingCall(false);
//     setShowVideoModal(false);
//     setIsIncomingCall(false);
//     setIncomingCallData(null);
//     setCallDuration(0);
//     setConnectionStatus('disconnected');
//     setIsRecording(false);
//     setRecordingBlob(null);
//   };
//
//   useEffect(() => {
//     let interval: NodeJS.Timeout;
//     
//     if (showVideoModal && connectionStatus === 'connected') {
//       interval = setInterval(() => {
//         setCallDuration(prev => prev + 1);
//       }, 1000);
//     }
//     
//     return () => {
//       if (interval) clearInterval(interval);
//     };
//   }, [showVideoModal, connectionStatus]);
//
//   const initiateCall = async (recipientId: string) => {
//     if (!user) return;
//     
//     try {
//       const callData: CallData = {
//         callerId: user.id,
//         recipientId,
//         callerName: user.fname,
//         recipientName: 'User',
//         timestamp: new Date().toISOString(),
//         callId: `${user.id}-${recipientId}-${Date.now()}`
//       };
//       
//       await webrtcService.initiateCall(recipientId);
//       setShowVideoModal(true);
//       setConnectionStatus('connecting');
//       setCurrentCall(callData);
//       
//       toast.success('Initiating call...');
//     } catch (error) {
//       console.error('Error initiating call:', error);
//       toast.error('Failed to initiate call');
//     }
//   };
//
//   const acceptCall = async () => {
//     if (!incomingCallData) return;
//     
//     try {
//       await webrtcService.acceptCall();
//       setShowIncomingCall(false);
//       setShowVideoModal(true);
//       setConnectionStatus('connecting');
//       setCurrentCall(incomingCallData);
//       
//       toast.success('Call accepted');
//     } catch (error) {
//       console.error('Error accepting call:', error);
//       toast.error('Failed to accept call');
//     }
//   };
//
//   const rejectCall = () => {
//     webrtcService.rejectCall();
//     handleCallEnd();
//   };
//
//   const endCall = async () => {
//     try {
//       // Stop recording if active
//       if (isRecording) {
//         const blob = await recordingService.stopRecording();
//         if (blob) {
//           setRecordingBlob(blob);
//           await uploadRecording(blob);
//         }
//         setIsRecording(false);
//       }
//
//       await webrtcService.endCall();
//       handleCallEnd();
//       toast.success('Call ended');
//     } catch (error) {
//       console.error('Error ending call:', error);
//       toast.error('Failed to end call');
//     }
//   };
//
//   const contextValue: VideoCallContextType = {
//     initiateCall,
//     acceptCall,
//     rejectCall,
//     endCall,
//     isInCall: connectionStatus === 'connected',
//     currentCall,
//     callDuration,
//     connectionStatus,
//     isRecording,
//     recordingBlob,
//     showModal: showVideoModal,
//     incomingCall: incomingCallData
//   };
//
//   return (
//     <VideoCallContext.Provider value={contextValue}>
//       {children}
//       
//       {showIncomingCall && incomingCallData && (
//         <IncomingCallNotification
//           isVisible={showIncomingCall}
//           callData={incomingCallData}
//           onAccept={acceptCall}
//           onReject={rejectCall}
//         />
//       )}
//       
//       {showVideoModal && currentCall && (
//         <VideoCallModal
//           isOpen={showVideoModal}
//           onClose={handleCallEnd}
//           callData={currentCall}
//           isIncoming={isIncomingCall}
//         />
//       )}
//     </VideoCallContext.Provider>
//   );
// };

// Stub export to prevent import errors - VideoCallProvider is disabled
export const VideoCallProvider: React.FC<VideoCallProviderProps> = ({ children }) => {
  console.log('VideoCallProvider is disabled - using PeerJS instead');
  return <>{children}</>;
};

export default VideoCallProvider;
