import apiClient from '../lib/api-client';

export interface PendingVideoCallInvitation {
  _id: string;
  conversationId: string;
  callerId: string;
  callerName: string;
  recipientId: string;
  sessionId: string;
  callId: string;
  message: string;
  createdAt: string;
  videoCallData: any;
}

export interface PendingInvitationsResponse {
  success: boolean;
  pendingInvitations: PendingVideoCallInvitation[];
}

/**
 * Fetch pending video call invitations for the current user
 */
export const fetchPendingVideoCallInvitations = async (): Promise<PendingVideoCallInvitation[]> => {
  try {
    console.log('🔍 Fetching pending video call invitations...');
    
    const response = await apiClient.get<PendingInvitationsResponse>('/chats/pending-invitations');
    
    if (response.data.success) {
      console.log(`✅ Found ${response.data.pendingInvitations.length} pending invitations from backend.`);
      
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const validInvitations = response.data.pendingInvitations.filter(invitation => {
        const invitationDate = new Date(invitation.createdAt);
        return invitationDate > twentyFourHoursAgo;
      });

      if (validInvitations.length < response.data.pendingInvitations.length) {
        console.log(`🚮 Filtered out ${response.data.pendingInvitations.length - validInvitations.length} expired invitations.`);
      }

      console.log(`✅ Found ${validInvitations.length} valid (non-expired) pending invitations.`);
      return validInvitations;
    } else {
      console.warn('⚠️ Failed to fetch pending invitations:', response.data);
      return [];
    }
  } catch (error) {
    console.error('❌ Error fetching pending video call invitations:', error);
    return [];
  }
};

/**
 * Mark a video call invitation as accepted/declined in the backend
 */
export const updateVideoCallInvitationStatus = async (
  invitationId: string, 
  status: 'accepted' | 'declined' | 'expired'
): Promise<boolean> => {
  try {
    console.log(`📝 Updating invitation ${invitationId} status to: ${status}`);
    
    const response = await apiClient.patch(`/chats/invitation-status/${invitationId}`, {
      status
    });
    
    if (response.data.success) {
      console.log(`✅ Invitation status updated to: ${status}`);
      return true;
    } else {
      console.warn('⚠️ Failed to update invitation status:', response.data);
      return false;
    }
  } catch (error) {
    console.error('❌ Error updating invitation status:', error);
    return false;
  }
};

/**
 * Store pending invitation in localStorage as backup
 */
export const storePendingInvitationLocally = (invitation: PendingVideoCallInvitation): void => {
  try {
    const existingInvitations = getPendingInvitationsFromStorage();
    const updatedInvitations = [...existingInvitations, invitation];
    
    localStorage.setItem('pendingVideoCallInvitations', JSON.stringify(updatedInvitations));
    console.log('💾 Stored invitation locally:', invitation._id);
  } catch (error) {
    console.error('❌ Error storing invitation locally:', error);
  }
};

/**
 * Get pending invitations from localStorage
 */
export const getPendingInvitationsFromStorage = (): PendingVideoCallInvitation[] => {
  try {
    const stored = localStorage.getItem('pendingVideoCallInvitations');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('❌ Error reading invitations from storage:', error);
    return [];
  }
};

/**
 * Remove invitation from localStorage
 */
export const removePendingInvitationFromStorage = (invitationId: string): void => {
  try {
    const existingInvitations = getPendingInvitationsFromStorage();
    const filteredInvitations = existingInvitations.filter(inv => inv._id !== invitationId);
    
    localStorage.setItem('pendingVideoCallInvitations', JSON.stringify(filteredInvitations));
    console.log('🗑️ Removed invitation from local storage:', invitationId);
  } catch (error) {
    console.error('❌ Error removing invitation from storage:', error);
  }
};

/**
 * Clear all pending invitations from localStorage
 */
export const clearPendingInvitationsFromStorage = (): void => {
  try {
    localStorage.removeItem('pendingVideoCallInvitations');
    console.log('🧹 Cleared all pending invitations from storage');
  } catch (error) {
    console.error('❌ Error clearing invitations from storage:', error);
  }
};
