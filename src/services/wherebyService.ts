import { toast } from 'react-hot-toast';
import apiClient from '../lib/api-client';
import { chatService } from '../lib/api-client';

export interface WherebyMeetingConfig {
  recipientId: string;
  callerName: string;
  callerAvatar?: string;
}

export interface WherebyMeeting {
  meetingId: string;
  roomUrl: string;
  hostRoomUrl: string;
  endDate: string;
}

export interface WherebyCallData {
  callId: string;
  platform: string;
  meetingId: string;
  roomUrl: string;
  hostRoomUrl: string;
  callerId: string;
  recipientId: string;
  callerName: string;
  recipientName: string;
  timestamp: string;
  status: string;
  endDate: string;
}

export interface WherebyCallbacks {
  onCallStarted?: (callData: WherebyCallData) => void;
  onCallEnded?: (callData: WherebyCallData) => void;
  onParticipantJoined?: (participant: any) => void;
  onParticipantLeft?: (participant: any) => void;
  onRecordingStarted?: () => void;
  onRecordingStopped?: (recordingUrl?: string) => void;
  onError?: (error: any) => void;
}

class WherebyService {
  private currentCall: WherebyCallData | null = null;
  private callbacks: WherebyCallbacks = {};
  private embedElement: HTMLElement | null = null;

  /**
   * Create a new Whereby meeting
   */
  async createMeeting(config: WherebyMeetingConfig): Promise<{ callData: WherebyCallData; meeting: WherebyMeeting }> {
    try {
      console.log('🚀 Creating Whereby meeting...', config);

      // First create the meeting
      const response = await apiClient.post('/whereby/create-meeting', config);

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to create meeting');
      }

      const { callData, meeting } = response.data;
      this.currentCall = callData;
      
      // Send notification to the match
      try {
        // 1. Send push notification
        await apiClient.post('/notifications/send-call-notification', {
          recipientId: config.recipientId,
          callData: {
            meetingUrl: meeting.roomUrl,
            meetingId: meeting.meetingId,
            callerName: config.callerName,
            timestamp: new Date().toISOString()
          }
        });
        console.log('📩 Call notification sent to match');
        
        // 2. Send chat message with call link
        try {
          const callMessage = `📞 Video Call Invitation\n\n${config.callerName} has invited you to a video call.\n\nJoin now: ${meeting.roomUrl}\n\nMeeting ID: ${meeting.meetingId}\n\nThis link will expire in 1 hour.`;
          
          await chatService.sendMessage(config.recipientId, callMessage);
          console.log('💬 Video call link sent to match via chat');
        } catch (chatError) {
          console.error('❌ Failed to send chat message with call link:', chatError);
          // Continue even if chat message fails
        }
      } catch (error) {
        console.error('❌ Failed to send call notification to match:', error);
        // Don't throw the error to avoid disrupting the call flow
      }

      console.log('✅ Whereby meeting created successfully:', {
        meetingId: meeting.meetingId,
        roomUrl: meeting.roomUrl
      });

      toast.success('Professional video call meeting created!');

      return { callData, meeting };

    } catch (error: any) {
      console.error('❌ Error creating Whereby meeting:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create meeting';
      toast.error(`Failed to create meeting: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Embed Whereby meeting in a container element
   */
  embedMeeting(containerElement: HTMLElement, roomUrl: string, options: any = {}): void {
    try {
      // Clear any existing embed
      this.clearEmbed();

      // Create iframe for Whereby meeting
      const iframe = document.createElement('iframe');
      iframe.src = roomUrl;
      iframe.style.width = '100%';
      iframe.style.height = '100%';
      iframe.style.border = 'none';
      iframe.style.borderRadius = '8px';
      iframe.allow = 'camera; microphone; fullscreen; speaker; display-capture';
      iframe.allowFullscreen = true;

      // Add professional styling
      iframe.style.boxShadow = '0 4px 20px rgba(0,0,0,0.1)';
      iframe.style.backgroundColor = '#f8f9fa';

      containerElement.appendChild(iframe);
      this.embedElement = iframe;

      console.log('✅ Whereby meeting embedded successfully');

      // Notify callback
      if (this.callbacks.onCallStarted && this.currentCall) {
        this.callbacks.onCallStarted(this.currentCall);
      }

    } catch (error) {
      console.error('❌ Error embedding Whereby meeting:', error);
      toast.error('Failed to load video call');
      
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
    }
  }

  /**
   * Open Whereby meeting in a new window/tab
   */
  openMeetingInNewWindow(roomUrl: string): Window | null {
    try {
      const meetingWindow = window.open(
        roomUrl,
        'whereby-meeting',
        'width=1200,height=800,scrollbars=yes,resizable=yes'
      );

      if (!meetingWindow) {
        toast.error('Please allow popups to open the video call');
        return null;
      }

      console.log('✅ Whereby meeting opened in new window');

      // Notify callback
      if (this.callbacks.onCallStarted && this.currentCall) {
        this.callbacks.onCallStarted(this.currentCall);
      }

      return meetingWindow;

    } catch (error) {
      console.error('❌ Error opening Whereby meeting:', error);
      toast.error('Failed to open video call');
      
      if (this.callbacks.onError) {
        this.callbacks.onError(error);
      }
      
      return null;
    }
  }

  /**
   * Get meeting details by ID
   */
  async getMeetingDetails(meetingId: string): Promise<any> {
    try {
      const response = await apiClient.get(`/whereby/meeting/${meetingId}`);
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get meeting details');
      }

      return response.data.meeting;

    } catch (error: any) {
      console.error('❌ Error getting meeting details:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to get meeting details';
      toast.error(errorMessage);
      throw error;
    }
  }

  /**
   * Report call recording to Wali (Islamic compliance)
   */
  async reportRecording(recordingUrl?: string): Promise<void> {
    try {
      if (!this.currentCall) {
        console.warn('⚠️ No active call to report recording for');
        return;
      }

      console.log('📹 Reporting Whereby recording to Wali...', {
        callId: this.currentCall.callId,
        recordingUrl: recordingUrl || 'Whereby cloud recording'
      });

      await apiClient.post('/whereby/video-call-recording', {
        callData: this.currentCall,
        recordingUrl,
        platform: 'whereby'
      });

      console.log('✅ Recording reported to Wali successfully');
      toast.success('Call recorded and reported to Wali');

      // Notify callback
      if (this.callbacks.onRecordingStopped) {
        this.callbacks.onRecordingStopped(recordingUrl);
      }

    } catch (error: any) {
      console.error('❌ Error reporting recording:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to report recording';
      toast.error(errorMessage);
    }
  }

  /**
   * End the current call
   */
  endCall(): void {
    try {
      if (this.currentCall) {
        console.log('📞 Ending Whereby call:', this.currentCall.callId);

        // Report recording automatically (Whereby handles cloud recording)
        this.reportRecording();

        // Notify callback
        if (this.callbacks.onCallEnded) {
          this.callbacks.onCallEnded(this.currentCall);
        }

        this.currentCall = null;
      }

      // Clear embed
      this.clearEmbed();

      toast.success('Video call ended');

    } catch (error) {
      console.error('❌ Error ending call:', error);
      toast.error('Error ending call');
    }
  }

  /**
   * Clear embedded meeting
   */
  clearEmbed(): void {
    if (this.embedElement && this.embedElement.parentNode) {
      this.embedElement.parentNode.removeChild(this.embedElement);
      this.embedElement = null;
    }
  }

  /**
   * Set event callbacks
   */
  setCallbacks(callbacks: WherebyCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }

  /**
   * Get current call data
   */
  getCurrentCall(): WherebyCallData | null {
    return this.currentCall;
  }

  /**
   * Check if call is active
   */
  isCallActive(): boolean {
    return this.currentCall !== null;
  }

  /**
   * Generate professional meeting room name
   */
  generateRoomName(callerName: string, recipientName: string): string {
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 6);
    return `quluub-${callerName}-${recipientName}-${timestamp}-${randomId}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
  }

  /**
   * Validate Whereby room URL
   */
  isValidWherebyUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      // Check for current and legacy Whereby domains
      return urlObj.hostname.endsWith('whereby.com') || 
             urlObj.hostname.endsWith('whereby.dev') || 
             urlObj.hostname.endsWith('appear.in');
    } catch {
      return false;
    }
  }

  /**
   * Cleanup service
   */
  cleanup(): void {
    this.endCall();
    this.clearEmbed();
    this.callbacks = {};
    this.currentCall = null;
  }
}

// Global service instance
export const wherebyService = new WherebyService();
export default wherebyService;
