class RecordingService {
  private mediaRecorder: MediaRecorder | null = null;
  private recordedChunks: Blob[] = [];
  private isRecording = false;

  async startRecording(stream: MediaStream): Promise<void> {
    try {
      // Create MediaRecorder with the combined stream
      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm;codecs=vp9,opus'
      });

      this.recordedChunks = [];
      this.isRecording = true;

      // Handle data available event
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          this.recordedChunks.push(event.data);
        }
      };

      // Handle recording stop event
      this.mediaRecorder.onstop = () => {
        console.log('📹 Recording stopped, chunks:', this.recordedChunks.length);
      };

      // Start recording
      this.mediaRecorder.start(1000); // Collect data every second
      console.log('📹 Recording started');
    } catch (error) {
      console.error('❌ Error starting recording:', error);
      throw error;
    }
  }

  async stopRecording(): Promise<Blob | null> {
    return new Promise((resolve) => {
      if (!this.mediaRecorder || !this.isRecording) {
        resolve(null);
        return;
      }

      this.mediaRecorder.onstop = () => {
        const recordingBlob = new Blob(this.recordedChunks, {
          type: 'video/webm'
        });
        
        this.isRecording = false;
        this.recordedChunks = [];
        console.log('📹 Recording stopped, blob size:', recordingBlob.size);
        resolve(recordingBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  async uploadRecording(recordingBlob: Blob, callId: string): Promise<string> {
    try {
      const formData = new FormData();
      formData.append('recording', recordingBlob, `call-${callId}-${Date.now()}.webm`);
      formData.append('callId', callId);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/video-call/upload-recording`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to upload recording');
      }

      const result = await response.json();
      console.log('📹 Recording uploaded successfully:', result.recordingUrl);
      return result.recordingUrl;
    } catch (error) {
      console.error('❌ Error uploading recording:', error);
      throw error;
    }
  }

  getRecordingStatus(): boolean {
    return this.isRecording;
  }

  // Create a combined stream from local and remote streams for recording
  createCombinedStream(localStream: MediaStream, remoteStream: MediaStream): MediaStream {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = 1280;
    canvas.height = 720;

    const localVideo = document.createElement('video');
    const remoteVideo = document.createElement('video');
    
    localVideo.srcObject = localStream;
    remoteVideo.srcObject = remoteStream;
    
    localVideo.play();
    remoteVideo.play();

    // Draw both videos on canvas
    const drawFrame = () => {
      if (this.isRecording) {
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw remote video (main)
        if (remoteVideo.videoWidth > 0) {
          ctx.drawImage(remoteVideo, 0, 0, canvas.width, canvas.height);
        }

        // Draw local video (picture-in-picture)
        if (localVideo.videoWidth > 0) {
          const pipWidth = canvas.width * 0.25;
          const pipHeight = canvas.height * 0.25;
          const pipX = canvas.width - pipWidth - 20;
          const pipY = 20;
          
          ctx.drawImage(localVideo, pipX, pipY, pipWidth, pipHeight);
          
          // Add border to PiP
          ctx.strokeStyle = '#fff';
          ctx.lineWidth = 2;
          ctx.strokeRect(pipX, pipY, pipWidth, pipHeight);
        }

        requestAnimationFrame(drawFrame);
      }
    };

    // Start drawing when both videos are ready
    Promise.all([
      new Promise(resolve => localVideo.onloadedmetadata = resolve),
      new Promise(resolve => remoteVideo.onloadedmetadata = resolve)
    ]).then(() => {
      drawFrame();
    });

    // Get stream from canvas
    const canvasStream = canvas.captureStream(30); // 30 FPS
    
    // Add audio from both streams
    const audioTracks = [
      ...localStream.getAudioTracks(),
      ...remoteStream.getAudioTracks()
    ];
    
    audioTracks.forEach(track => {
      canvasStream.addTrack(track);
    });

    return canvasStream;
  }
}

export const recordingService = new RecordingService();
