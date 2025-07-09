
export interface ZoomMeetingOptions {
  topic: string;
  duration: number; // in minutes
  hostEmail: string;
  participantEmails: string[];
  password?: string;
}

export interface ZoomMeeting {
  id: string;
  topic: string;
  joinUrl: string;
  password?: string;
  startTime: string;
  duration: number;
  hostId: string;
}

export const createZoomMeeting = async (options: ZoomMeetingOptions): Promise<ZoomMeeting> => {
  const zoomApiKey = import.meta.env.VITE_ZOOM_API_KEY;
  const zoomApiSecret = import.meta.env.VITE_ZOOM_API_SECRET;
  
  if (!zoomApiKey || !zoomApiSecret) {
    throw new Error('Zoom API credentials not configured');
  }

  try {
    // In a real implementation, you would make a request to your backend
    // which would handle the Zoom API authentication and meeting creation
    const response = await fetch('/api/video-calls/create-zoom-meeting', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(options),
    });

    if (!response.ok) {
      throw new Error('Failed to create Zoom meeting');
    }

    const meeting = await response.json();
    return meeting;
  } catch (error) {
    console.error('Error creating Zoom meeting:', error);
    throw error;
  }
};

export const joinZoomMeeting = (meetingId: string, password?: string) => {
  const zoomWebSDK = (window as any).ZoomMtg;
  
  if (!zoomWebSDK) {
    throw new Error('Zoom Web SDK not loaded');
  }

  zoomWebSDK.init({
    leaveUrl: window.location.origin,
    success: () => {
      zoomWebSDK.join({
        meetingNumber: meetingId,
        userName: 'User',
        signature: '', // This would be generated on your backend
        apiKey: import.meta.env.VITE_ZOOM_API_KEY,
        userEmail: '',
        passWord: password || '',
        success: () => {
          console.log('Joined Zoom meeting successfully');
        },
        error: (error: any) => {
          console.error('Error joining Zoom meeting:', error);
        }
      });
    },
    error: (error: any) => {
      console.error('Error initializing Zoom SDK:', error);
    }
  });
};

export const getZoomMeetingUsage = async (): Promise<{ 
  totalMinutes: number; 
  costPerMinute: number; 
  totalCost: number; 
}> => {
  try {
    const response = await fetch('/api/video-calls/usage', {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get usage data');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting Zoom usage:', error);
    throw error;
  }
};
