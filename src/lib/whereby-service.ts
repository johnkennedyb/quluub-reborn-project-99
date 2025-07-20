import apiClient from './api-client';

export interface WherebyRoom {
  meetingId: string;
  roomUrl: string;
  hostRoomUrl: string;
  roomName: string;
  startDate: string;
  endDate: string;
}

export interface CreateRoomRequest {
  roomName?: string;
  isLocked?: boolean;
  roomNamePrefix?: string;
  roomNamePattern?: string;
  roomMode?: 'normal' | 'group';
  fields?: string[];
  partnerId?: string;
}

export const wherebyService = {
  // Create a new Whereby room
  createRoom: async (roomData: CreateRoomRequest): Promise<WherebyRoom> => {
    try {
      const response = await apiClient.post('/whereby/create-room', roomData);
      return response.data;
    } catch (error) {
      console.error('Error creating Whereby room:', error);
      throw error;
    }
  },

  // Get room details
  getRoom: async (meetingId: string): Promise<WherebyRoom> => {
    try {
      const response = await apiClient.get(`/whereby/room/${meetingId}`);
      return response.data;
    } catch (error) {
      console.error('Error getting Whereby room:', error);
      throw error;
    }
  },

  // Delete a room
  deleteRoom: async (meetingId: string): Promise<void> => {
    try {
      await apiClient.delete(`/whereby/room/${meetingId}`);
    } catch (error) {
      console.error('Error deleting Whereby room:', error);
      throw error;
    }
  },

  // Send video call invitation via chat
  sendVideoCallInvitation: async (conversationId: string, roomData: WherebyRoom): Promise<void> => {
    try {
      const invitationData = {
        type: 'video_call_invitation',
        roomUrl: roomData.roomUrl,
        hostRoomUrl: roomData.hostRoomUrl,
        roomName: roomData.roomName,
        meetingId: roomData.meetingId,
        startDate: roomData.startDate,
        endDate: roomData.endDate
      };

      await apiClient.post(`/chats/send-invitation/${conversationId}`, invitationData);
    } catch (error) {
      console.error('Error sending video call invitation:', error);
      throw error;
    }
  }
};

export default wherebyService;
