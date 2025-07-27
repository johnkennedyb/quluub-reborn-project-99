import apiClient from './api-client';

export interface ZoomMeeting {
  id: string;
  topic: string;
  start_url: string;
  join_url: string;
  password?: string;
  start_time: string;
  duration: number;
}

export interface CreateMeetingRequest {
  topic: string;
  duration?: number;
  start_time?: string;
  password?: string;
  waiting_room?: boolean;
  join_before_host?: boolean;
}

export const zoomService = {
  // Create a new Zoom meeting
  createMeeting: async (meetingData: CreateMeetingRequest): Promise<ZoomMeeting> => {
    try {
      const response = await apiClient.post('/zoom/create-meeting', meetingData);
      return response.data;
    } catch (error) {
      console.error('Error creating Zoom meeting:', error);
      throw error;
    }
  },

  // Get meeting details
  getMeeting: async (meetingId: string): Promise<ZoomMeeting> => {
    try {
      const response = await apiClient.get(`/zoom/meeting/${meetingId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting Zoom meeting:', error);
      throw error;
    }
  },

  // Delete a meeting
  deleteMeeting: async (meetingId: string): Promise<void> => {
    try {
      await apiClient.delete(`/zoom/meeting/${meetingId}`);
    } catch (error) {
      console.error('Error deleting Zoom meeting:', error);
      throw error;
    }
  },

  // Send video call invitation via chat
  sendVideoCallInvitation: async (userId: string, meetingData: ZoomMeeting): Promise<void> => {
    try {
      const invitationMessage = `📹 Video call invitation: ${meetingData.topic}
      
Join the meeting: ${meetingData.join_url}
${meetingData.password ? `Meeting Password: ${meetingData.password}` : ''}
Meeting ID: ${meetingData.id}
      
This is a premium feature. Upgrade to Pro to enjoy unlimited video calls!`;

      await apiClient.post('/chat/send-message', {
        userId,
        message: invitationMessage,
        messageType: 'video_call_invitation',
        meetingData: {
          meetingId: meetingData.id,
          joinUrl: meetingData.join_url,
          password: meetingData.password
        }
      });
    } catch (error) {
      console.error('Error sending video call invitation:', error);
      throw error;
    }
  }
};

export default zoomService;
