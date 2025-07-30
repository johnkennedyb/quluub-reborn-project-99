import Peer, { MediaConnection } from 'peerjs';
import { io, Socket } from 'socket.io-client';

export interface PeerCallData {
  callerId: string;
  callerName: string;
  recipientId: string;
  recipientName: string;
  peerId: string;
  sessionId: string;
}

export interface PeerJSServiceConfig {
  userId: string;
  userName: string;
  onIncomingCall?: (callData: PeerCallData) => void;
  onCallConnected?: () => void;
  onCallEnded?: () => void;
  onError?: (error: any) => void;
}

class PeerJSService {
  private peer: Peer | null = null;
  private socket: Socket | null = null;
  private config: PeerJSServiceConfig | null = null;
  private currentCall: MediaConnection | null = null;
  private localStream: MediaStream | null = null;

  // Initialize PeerJS service
  async initialize(config: PeerJSServiceConfig): Promise<string> {
    this.config = config;
    
    try {
      // Create unique peer ID
      const peerId = `${config.userId}_${Date.now()}`;
      
      // Initialize PeerJS
      this.peer = new Peer(peerId, {
        host: 'peerjs-server.herokuapp.com',
        port: 443,
        path: '/',
        secure: true,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
        }
      });

      // Set up PeerJS event listeners
      this.setupPeerEventListeners();

      // Initialize Socket.IO for signaling
      await this.initializeSocket();

      return peerId;
    } catch (error) {
      console.error('❌ Failed to initialize PeerJS service:', error);
      this.config?.onError?.(error);
      throw error;
    }
  }

  // Set up PeerJS event listeners
  private setupPeerEventListeners() {
    if (!this.peer) return;

    this.peer.on('open', (id) => {
      console.log('✅ PeerJS connection opened with ID:', id);
    });

    this.peer.on('error', (error) => {
      console.error('❌ PeerJS error:', error);
      this.config?.onError?.(error);
    });

    this.peer.on('call', (call) => {
      console.log('📞 Incoming call received from:', call.peer);
      this.handleIncomingCall(call);
    });

    this.peer.on('connection', (conn) => {
      console.log('🔗 Data connection established with:', conn.peer);
    });
  }

  // Initialize Socket.IO for signaling
  private async initializeSocket(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        this.socket = io(apiUrl, {
          transports: ['websocket', 'polling']
        });

        this.socket.on('connect', () => {
          console.log('✅ Socket.IO connected for PeerJS signaling');
          
          // Join user room for signaling
          this.socket?.emit('join-room', this.config?.userId);
          resolve();
        });

        this.socket.on('disconnect', () => {
          console.log('🔌 Socket.IO disconnected');
        });

        this.socket.on('peer-call-invitation', (data: PeerCallData) => {
          console.log('📞 Received peer call invitation:', data);
          this.config?.onIncomingCall?.(data);
        });

        this.socket.on('peer-call-ended', () => {
          console.log('📞 Remote peer ended the call');
          this.endCall();
        });

        this.socket.on('connect_error', (error) => {
          console.error('❌ Socket.IO connection error:', error);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  }

  // Get local media stream
  async getLocalStream(): Promise<MediaStream> {
    try {
      if (this.localStream) {
        return this.localStream;
      }

      console.log('🎥 Getting local media stream...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      this.localStream = stream;
      console.log('✅ Local media stream obtained');
      return stream;
    } catch (error) {
      console.error('❌ Failed to get local media stream:', error);
      throw error;
    }
  }

  // Make outgoing call
  async makeCall(recipientPeerId: string): Promise<MediaConnection> {
    try {
      if (!this.peer) {
        throw new Error('PeerJS not initialized');
      }

      console.log('📞 Making call to peer:', recipientPeerId);
      
      // Get local stream
      const localStream = await this.getLocalStream();
      
      // Make the call
      const call = this.peer.call(recipientPeerId, localStream);
      this.currentCall = call;

      // Set up call event listeners
      this.setupCallEventListeners(call);

      return call;
    } catch (error) {
      console.error('❌ Failed to make call:', error);
      throw error;
    }
  }

  // Handle incoming call
  private async handleIncomingCall(call: MediaConnection) {
    try {
      console.log('📞 Handling incoming call...');
      
      // Get local stream
      const localStream = await this.getLocalStream();
      
      // Answer the call
      call.answer(localStream);
      this.currentCall = call;

      // Set up call event listeners
      this.setupCallEventListeners(call);

    } catch (error) {
      console.error('❌ Failed to handle incoming call:', error);
      this.config?.onError?.(error);
    }
  }

  // Set up call event listeners
  private setupCallEventListeners(call: MediaConnection) {
    call.on('stream', (remoteStream) => {
      console.log('📺 Received remote stream');
      this.config?.onCallConnected?.();
      
      // Emit custom event with remote stream
      const event = new CustomEvent('peerjs-remote-stream', {
        detail: { stream: remoteStream }
      });
      window.dispatchEvent(event);
    });

    call.on('close', () => {
      console.log('📞 Call closed');
      this.endCall();
    });

    call.on('error', (error) => {
      console.error('❌ Call error:', error);
      this.config?.onError?.(error);
      this.endCall();
    });
  }

  // Send call invitation via signaling
  async sendCallInvitation(callData: PeerCallData): Promise<void> {
    if (!this.socket) {
      throw new Error('Socket.IO not connected');
    }

    console.log('📤 Sending call invitation via signaling:', callData);
    this.socket.emit('send-peer-call-invitation', callData);
  }

  // End current call
  endCall(): void {
    console.log('📞 Ending call...');

    // Close current call
    if (this.currentCall) {
      this.currentCall.close();
      this.currentCall = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log('✅ Stopped track:', track.kind);
      });
      this.localStream = null;
    }

    // Notify via socket
    if (this.socket) {
      this.socket.emit('peer-call-ended');
    }

    // Emit custom event
    const event = new CustomEvent('peerjs-call-ended');
    window.dispatchEvent(event);

    this.config?.onCallEnded?.();
  }

  // Toggle video
  toggleVideo(): boolean {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      console.log('📹 Video toggled:', videoTrack.enabled ? 'ON' : 'OFF');
      return videoTrack.enabled;
    }
    return false;
  }

  // Toggle audio
  toggleAudio(): boolean {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      console.log('🔊 Audio toggled:', audioTrack.enabled ? 'ON' : 'OFF');
      return audioTrack.enabled;
    }
    return false;
  }

  // Get current peer ID
  getPeerId(): string | null {
    return this.peer?.id || null;
  }

  // Check if call is active
  isCallActive(): boolean {
    return this.currentCall !== null;
  }

  // Destroy service
  destroy(): void {
    console.log('🧹 Destroying PeerJS service...');

    this.endCall();

    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    this.config = null;
  }
}

// Export singleton instance
export const peerJSService = new PeerJSService();
export default peerJSService;
