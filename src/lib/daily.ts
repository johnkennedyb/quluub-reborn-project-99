
import DailyIframe from '@daily-co/daily-js';

export interface DailyCallOptions {
  roomName: string;
  userName: string;
  parentNode: HTMLElement;
  onJoined?: () => void;
  onLeft?: () => void;
  onParticipantJoined?: (participant: any) => void;
  onParticipantLeft?: (participant: any) => void;
  onError?: (error: any) => void;
}

export const createDailyCall = async (options: DailyCallOptions) => {
  const {
    roomName,
    userName,
    parentNode,
    onJoined,
    onLeft,
    onParticipantJoined,
    onParticipantLeft,
    onError,
  } = options;

  // Create Daily call frame
  const callFrame = DailyIframe.createFrame(parentNode, {
    iframeStyle: {
      position: 'absolute',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      border: 'none',
    },
    showLeaveButton: true,
    showFullscreenButton: true,
  });

  // Set up event listeners
  callFrame
    .on('joined-meeting', onJoined)
    .on('left-meeting', onLeft)
    .on('participant-joined', onParticipantJoined)
    .on('participant-left', onParticipantLeft)
    .on('error', onError);

  try {
    // Join the room using the room name directly
    await callFrame.join({
      url: `https://quluub.daily.co/${roomName}`,
      userName: userName,
    });

    return callFrame;
  } catch (error) {
    console.error('Error joining Daily call:', error);
    if (onError) onError(error);
    throw error;
  }
};

export const createDailyRoom = async (roomName: string) => {
  const apiKey = import.meta.env.VITE_DAILY_API_KEY;
  
  if (!apiKey) {
    throw new Error('Daily.co API key not configured');
  }

  try {
    const response = await fetch('https://api.daily.co/v1/rooms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        name: roomName,
        properties: {
          max_participants: 2,
          enable_screenshare: true,
          enable_chat: false,
          exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiry
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create room: ${response.statusText}`);
    }

    const room = await response.json();
    return room;
  } catch (error) {
    console.error('Error creating Daily room:', error);
    throw error;
  }
};
