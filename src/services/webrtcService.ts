import { Socket } from 'socket.io-client';
import socket from '@/lib/socket';

export interface CallData {
  callId: string;
  callerId: string;
  recipientId: string;
  callerName: string;
  callerAvatar?: string;
  recipientName: string;
  recipientAvatar?: string;
  timestamp: string;
  meetingUrl?: string;
  joinLink?: string;
}

export interface WebRTCCallbacks {
  onIncomingCall: (callData: CallData) => void;
  onCallAccepted: () => void;
  onCallRejected: () => void;
  onCallEnded: () => void;
  onCallCancelled: () => void;
  onRemoteStream: (stream: MediaStream) => void;
  onConnectionStateChange: (state: RTCPeerConnectionState) => void;
}

class WebRTCService {
  private socket: Socket | null = null;
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callbacks: WebRTCCallbacks | null = null;
  private currentCallData: CallData | null = null;
  private isInitiator = false;

  // STUN servers for NAT traversal
  private readonly iceServers = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' }
  ];

  constructor() {
    this.initializeSocket();
  }

  // Public method to reinitialize socket (useful after login)
  public reinitialize(): void {
    console.log('🔄 Reinitializing WebRTC service...');
    this.initializeSocket();
  }

  private initializeSocket() {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      console.warn('⚠️ No token or user found, cannot initialize WebRTC socket listeners. Token:', !!token, 'User:', !!userStr);
      return;
    }

    let user;
    try {
      user = JSON.parse(userStr);
    } catch (e) {
      console.error('❌ Failed to parse user data:', e);
      return;
    }

    if (!user || !user._id) {
      console.warn(' Invalid user data, cannot initialize WebRTC socket listeners');
      return;
    }

    console.log(' Setting up WebRTC Socket.IO listeners on centralized socket for user:', user.fname);
    
    // Use the centralized socket instance
    this.socket = socket;
    
    // Clean up existing listeners
    if (this.socket) {
      this.socket.off('webrtc-offer');
      this.socket.off('webrtc-answer');
      this.socket.off('webrtc-ice-candidate');
      this.socket.off('webrtc-call-ended');
      this.socket.off('webrtc-call-cancelled');
      this.socket.off('webrtc-call-accepted');
      this.socket.off('webrtc-call-rejected');
    }

    try {
      console.log(' Setting up WebRTC event listeners on centralized socket');
      this.setupSocketListeners();
    } catch (error) {
      console.error(' Failed to initialize WebRTC socket listeners:', error);
    }
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    // WebRTC event handlers (using centralized socket)
    this.socket.on('connect', () => {
      console.log(' WebRTC listeners ready on centralized socket:', this.socket?.id);
    });

    // Socket connection events
    this.socket.on('connect', () => {
      console.log(' Socket.IO connected:', this.socket?.id);
      
      // Join user to their room for receiving calls
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData._id) {
        console.log(' Joining room for user:', userData._id);
        this.socket?.emit('join', userData._id);
      } else {
        console.warn(' No user data found, cannot join room');
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error(' Socket.IO connection error:', error);
    });

    this.socket.on('disconnect', (reason) => {
      console.log(' Socket.IO disconnected:', reason);
    });

    // Incoming call offer
    this.socket.on('video-call-offer', async (data) => {
      console.log(' Received video call offer:', data);
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      const callId = data.callId || Date.now().toString();
      const meetingUrl = this.generateMeetingUrl(callId);
      
      this.currentCallData = {
        callId,
        callerId: data.callerId,
        recipientId: userData._id,
        callerName: data.callerName,
        callerAvatar: data.callerAvatar,
        recipientName: `${userData.fname} ${userData.lname}`,
        recipientAvatar: userData.profilePicture,
        timestamp: new Date().toISOString(),
        meetingUrl,
        joinLink: meetingUrl
      };
      
      if (this.callbacks?.onIncomingCall) {
        this.callbacks.onIncomingCall(this.currentCallData);
      }

      // Set up peer connection for receiving call
      await this.createPeerConnection();
      await this.peerConnection?.setRemoteDescription(new RTCSessionDescription(data.offer));
    });

    // Call answer received
    this.socket.on('video-call-answer', async (data) => {
      console.log(' Received video call answer:', data);
      if (this.peerConnection && data.answer) {
        await this.peerConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
        if (this.callbacks?.onCallAccepted) {
          this.callbacks.onCallAccepted();
        }
      }
    });

    // ICE candidate received
    this.socket.on('ice-candidate', (data) => {
      console.log(' Received ICE candidate');
      if (this.peerConnection && data.candidate) {
        this.peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
      }
    });

    // Join link received
    this.socket.on('join-link-received', (data) => {
      console.log(' Join link received:', data.meetingUrl);
      if (this.currentCallData) {
        this.currentCallData.meetingUrl = data.meetingUrl;
        this.currentCallData.joinLink = data.meetingUrl;
      }
    });

    // Join link sent confirmation
    this.socket.on('join-link-sent', (data) => {
      console.log(' Join link sent successfully to:', data.recipientId);
    });

    // Call rejected
    this.socket.on('video-call-rejected', () => {
      console.log(' Call was rejected');
      this.cleanup();
      if (this.callbacks?.onCallRejected) {
        this.callbacks.onCallRejected();
      }
    });

    // Call ended
    this.socket.on('video-call-ended', () => {
      console.log(' Call was ended');
      this.cleanup();
      if (this.callbacks?.onCallEnded) {
        this.callbacks.onCallEnded();
      }
    });

    // Call cancelled
    this.socket.on('video-call-cancelled', () => {
      console.log(' Call was cancelled');
      this.cleanup();
      if (this.callbacks?.onCallCancelled) {
        this.callbacks.onCallCancelled();
      }
    });
  }

  public setCallbacks(callbacks: WebRTCCallbacks) {
    this.callbacks = callbacks;
  }

  public async initiateCall(recipientId: string): Promise<CallData | null> {
    try {
      // Get user media first
      await this.getUserMedia();
      
      // Create peer connection
      await this.createPeerConnection();
      
      // Add local stream to peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection?.addTrack(track, this.localStream!);
        });
      }

      // Create offer
      const offer = await this.peerConnection!.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true
      });
      
      await this.peerConnection!.setLocalDescription(offer);

      // Get call data from backend
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiUrl}/chats/initiate-video-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ recipientId })
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message);
      }

      this.currentCallData = result.callData;
      this.isInitiator = true;

      // Send offer through socket
      this.socket?.emit('video-call-offer', {
        offer,
        callerId: result.callData.callerId,
        recipientId,
        callerName: result.callData.callerName,
        callerAvatar: result.callData.callerAvatar
      });

      return result.callData;
    } catch (error) {
      console.error('Error initiating call:', error);
      this.cleanup();
      throw error;
    }
  }

  public async acceptCall(): Promise<void> {
    try {
      if (!this.peerConnection || !this.currentCallData) {
        throw new Error('No active call to accept');
      }

      // Get user media
      await this.getUserMedia();
      
      // Add local stream to peer connection
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          this.peerConnection?.addTrack(track, this.localStream!);
        });
      }

      // Create answer
      const answer = await this.peerConnection.createAnswer();
      await this.peerConnection.setLocalDescription(answer);

      // Send answer through socket
      this.socket?.emit('video-call-answer', {
        answer,
        callerId: this.currentCallData.callerId,
        recipientId: this.currentCallData.recipientId
      });

    } catch (error) {
      console.error('Error accepting call:', error);
      this.rejectCall();
      throw error;
    }
  }

  public rejectCall(): void {
    if (this.currentCallData) {
      this.socket?.emit('video-call-reject', {
        callerId: this.currentCallData.callerId,
        recipientId: this.currentCallData.recipientId
      });
    }
    this.cleanup();
  }

  public endCall(): void {
    if (this.currentCallData) {
      const recipientId = this.isInitiator 
        ? this.currentCallData.recipientId 
        : this.currentCallData.callerId;
      
      this.socket?.emit('video-call-end', {
        userId: this.isInitiator ? this.currentCallData.callerId : this.currentCallData.recipientId,
        recipientId
      });
    }
    this.cleanup();
  }

  public cancelCall(): void {
    if (this.currentCallData) {
      this.socket?.emit('video-call-cancel', {
        callerId: this.currentCallData.callerId,
        recipientId: this.currentCallData.recipientId
      });
    }
    this.cleanup();
  }

  private async createPeerConnection(): Promise<void> {
    this.peerConnection = new RTCPeerConnection({
      iceServers: this.iceServers
    });

    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate && this.currentCallData) {
        const recipientId = this.isInitiator 
          ? this.currentCallData.recipientId 
          : this.currentCallData.callerId;
        
        this.socket?.emit('ice-candidate', {
          candidate: event.candidate,
          senderId: this.isInitiator ? this.currentCallData.callerId : this.currentCallData.recipientId,
          recipientId
        });
      }
    };

    // Handle remote stream
    this.peerConnection.ontrack = (event) => {
      console.log('Received remote stream');
      this.remoteStream = event.streams[0];
      if (this.callbacks?.onRemoteStream) {
        this.callbacks.onRemoteStream(this.remoteStream);
      }
    };

    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      const state = this.peerConnection?.connectionState;
      console.log('Connection state changed:', state);
      if (this.callbacks?.onConnectionStateChange && state) {
        this.callbacks.onConnectionStateChange(state);
      }
      
      if (state === 'failed' || state === 'disconnected' || state === 'closed') {
        this.cleanup();
      }
    };
  }

  private async getUserMedia(): Promise<void> {
    try {
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });
    } catch (error) {
      console.error('Error getting user media:', error);
      throw new Error('Unable to access camera and microphone');
    }
  }

  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  public toggleVideo(): boolean {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        return videoTrack.enabled;
      }
    }
    return false;
  }

  public toggleAudio(): boolean {
    if (this.localStream) {
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        return audioTrack.enabled;
      }
    }
    return false;
  }

  private cleanup(): void {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Reset state
    this.remoteStream = null;
    this.currentCallData = null;
    this.isInitiator = false;
  }



  // Generate meeting URL for the call
  public generateMeetingUrl(callId: string): string {
    const baseUrl = window.location.origin;
    return `${baseUrl}/video-call/${callId}`;
  }

  // Send join link to participant
  public sendJoinLink(recipientId: string, meetingUrl: string): void {
    if (this.socket && this.currentCallData) {
      this.socket.emit('send-join-link', {
        callId: this.currentCallData.callId,
        recipientId,
        meetingUrl,
        senderName: this.currentCallData.callerName
      });
      console.log('📤 Join link sent to participant:', meetingUrl);
    }
  }

  // Get current call data
  public getCurrentCallData(): CallData | null {
    return this.currentCallData;
  }

  public disconnect(): void {
    this.cleanup();
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const webrtcService = new WebRTCService();
export default webrtcService;


