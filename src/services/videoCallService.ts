import apiClient from '../lib/api-client';

export interface VideoCallSession {
  signature: string;
  sessionId: string;
  sessionKey: string;
  sdkKey: string;
  userName: string;
  userRole: number;
  callId?: string;
}

export interface CallInvitation {
  type: 'video_call_invitation';
  callerId: string;
  callerName: string;
  recipientId: string;
  sessionId: string;
  callId: string;
  timestamp: string;
}

export interface InvitationResponse {
  success: boolean;
  invitation: CallInvitation;
  message: string;
}

class VideoCallService {
  // Create a new video call session
  async createSession(recipientId?: string): Promise<VideoCallSession> {
    const sessionId = `session_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
    const response = await apiClient.post('/zoom/session', {
      sessionId,
      userRole: 1,
      recipientId
    });
    
    return response.data;
  }

  // Join an existing video call session
  async joinSession(sessionId: string, callId?: string): Promise<VideoCallSession> {
    const response = await apiClient.post('/zoom/join-session', {
      sessionId,
      callId
    });
    
    return response.data;
  }

  // Send video call invitation to a match
  async sendInvitation(recipientId: string, sessionId: string, callId?: string): Promise<InvitationResponse> {
    const response = await apiClient.post('/zoom/send-invitation', {
      recipientId,
      sessionId,
      callId
    });
    
    return response.data;
  }

  // Notify Wali about video call events
  async notifyWali(recipientId: string, action: 'call_started' | 'call_ended', duration: number): Promise<void> {
    await apiClient.post('/zoom/notify-wali', {
      recipientId,
      action,
      duration
    });
  }

  // Generate a unique session ID
  generateSessionId(): string {
    return `session_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
  }

  // Check if user can make video calls (premium check)
  async checkVideoCallPermission(): Promise<boolean> {
    try {
      // This would typically check user's premium status
      // For now, we'll assume the backend handles this
      return true;
    } catch (error) {
      console.error('Error checking video call permission:', error);
      return false;
    }
  }
}

export const videoCallService = new VideoCallService();
export default videoCallService;
