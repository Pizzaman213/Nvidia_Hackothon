/**
 * Emergency Call Service
 *
 * Provides multiple ways to contact emergency contact:
 * 1. Direct device call (tel: protocol) - uses phone's native dialer
 * 2. WebRTC voice chat - in-app voice conversation
 * 3. WebSocket signaling - for WebRTC connection setup
 */

import { logger, LogCategory } from '../utils/logger';

export interface CallStatus {
  isActive: boolean;
  isConnecting: boolean;
  duration: number;
  error: string | null;
}

export interface EmergencyCallOptions {
  emergencyContact: string;
  childName: string;
  sessionId: string;
  reason?: string;
}

class EmergencyCallService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private ws: WebSocket | null = null;
  private callStartTime: number | null = null;
  private callTimer: NodeJS.Timeout | null = null;

  private statusCallback: ((status: CallStatus) => void) | null = null;
  private remoteStreamCallback: ((stream: MediaStream) => void) | null = null;

  constructor() {
    logger.info(LogCategory.VOICE, 'Emergency call service initialized');
  }

  /**
   * Method 1: Direct Device Call
   * Uses tel: protocol to trigger phone's native dialer
   * This is the FASTEST method - instant!
   */
  makeDirectCall(phoneNumber: string, childName: string): void {
    logger.info(LogCategory.VOICE, `Initiating direct device call to ${phoneNumber}`);

    // Format phone number (remove all non-digits except +)
    const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');

    // Create tel: URL
    const telUrl = `tel:${cleanNumber}`;

    // On mobile devices, this will open the phone dialer
    // On desktop, it may open Skype/FaceTime if installed
    window.location.href = telUrl;

    logger.info(LogCategory.VOICE, `Direct call initiated: ${telUrl}`);

    // Also show a fallback link in case the automatic redirect doesn't work
    this.showCallFallback(cleanNumber, childName);
  }

  /**
   * Show a clickable fallback if automatic dialing doesn't work
   */
  private showCallFallback(phoneNumber: string, childName: string): void {
    const message = `If the call didn't start automatically, click here to call: ${phoneNumber}`;

    // Create a temporary overlay with call button
    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 24px;
      border-radius: 12px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      text-align: center;
      max-width: 90%;
    `;

    overlay.innerHTML = `
      <h2 style="color: #ef4444; margin: 0 0 16px 0;">🚨 Emergency Call</h2>
      <p style="margin: 0 0 20px 0; color: #374151;">${message}</p>
      <a
        href="tel:${phoneNumber}"
        style="
          display: inline-block;
          background: #ef4444;
          color: white;
          padding: 16px 32px;
          border-radius: 8px;
          text-decoration: none;
          font-weight: bold;
          font-size: 18px;
          margin-bottom: 12px;
        "
      >
        📞 Call ${phoneNumber}
      </a>
      <br>
      <button
        id="closeCallOverlay"
        style="
          background: #9ca3af;
          color: white;
          padding: 8px 24px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          margin-top: 8px;
        "
      >
        Close
      </button>
    `;

    document.body.appendChild(overlay);

    // Remove overlay after 10 seconds or when close button clicked
    const closeBtn = document.getElementById('closeCallOverlay');
    const removeOverlay = () => {
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    };

    closeBtn?.addEventListener('click', removeOverlay);
    setTimeout(removeOverlay, 10000);
  }

  /**
   * Method 2: WebRTC Voice Chat
   * Enables in-app voice conversation with emergency contact
   */
  async startVoiceChat(options: EmergencyCallOptions): Promise<void> {
    try {
      logger.info(LogCategory.VOICE, 'Starting WebRTC voice chat', options);

      this.updateStatus({ isConnecting: true, isActive: false, duration: 0, error: null });

      // Get microphone access
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: false,
      });

      logger.info(LogCategory.VOICE, 'Microphone access granted');

      // Create WebRTC peer connection
      this.peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ],
      });

      // Add local stream to peer connection
      this.localStream.getTracks().forEach(track => {
        this.peerConnection!.addTrack(track, this.localStream!);
      });

      // Handle incoming remote stream
      this.peerConnection.ontrack = (event) => {
        logger.info(LogCategory.VOICE, 'Received remote stream');
        this.remoteStream = event.streams[0];
        if (this.remoteStreamCallback) {
          this.remoteStreamCallback(this.remoteStream);
        }
      };

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate && this.ws) {
          this.ws.send(JSON.stringify({
            type: 'ice-candidate',
            candidate: event.candidate,
            sessionId: options.sessionId,
          }));
        }
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState;
        logger.info(LogCategory.VOICE, `Connection state: ${state}`);

        if (state === 'connected') {
          this.onCallConnected();
        } else if (state === 'disconnected' || state === 'failed' || state === 'closed') {
          this.endVoiceChat();
        }
      };

      // Connect to signaling server
      await this.connectSignaling(options);

      // Create offer
      const offer = await this.peerConnection.createOffer();
      await this.peerConnection.setLocalDescription(offer);

      // Send offer to signaling server
      if (this.ws) {
        this.ws.send(JSON.stringify({
          type: 'offer',
          offer: offer,
          sessionId: options.sessionId,
          emergencyContact: options.emergencyContact,
          childName: options.childName,
          reason: options.reason,
        }));
      }

      logger.info(LogCategory.VOICE, 'WebRTC offer sent');

    } catch (error) {
      logger.error(LogCategory.VOICE, 'Failed to start voice chat', error as Error);
      this.updateStatus({
        isConnecting: false,
        isActive: false,
        duration: 0,
        error: error instanceof Error ? error.message : 'Failed to start call'
      });
      throw error;
    }
  }

  /**
   * Connect to WebSocket signaling server
   */
  private async connectSignaling(options: EmergencyCallOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000';
      this.ws = new WebSocket(`${wsUrl}/ws/emergency-call/${options.sessionId}`);

      this.ws.onopen = () => {
        logger.info(LogCategory.VOICE, 'WebSocket signaling connected');
        resolve();
      };

      this.ws.onerror = (error) => {
        logger.error(LogCategory.VOICE, 'WebSocket error', error as any);
        reject(new Error('Failed to connect to signaling server'));
      };

      this.ws.onmessage = async (event) => {
        const message = JSON.parse(event.data);
        await this.handleSignalingMessage(message);
      };

      this.ws.onclose = () => {
        logger.info(LogCategory.VOICE, 'WebSocket signaling closed');
      };
    });
  }

  /**
   * Handle incoming signaling messages
   */
  private async handleSignalingMessage(message: any): Promise<void> {
    try {
      switch (message.type) {
        case 'answer':
          if (this.peerConnection) {
            await this.peerConnection.setRemoteDescription(
              new RTCSessionDescription(message.answer)
            );
            logger.info(LogCategory.VOICE, 'Remote description set');
          }
          break;

        case 'ice-candidate':
          if (this.peerConnection && message.candidate) {
            await this.peerConnection.addIceCandidate(
              new RTCIceCandidate(message.candidate)
            );
            logger.info(LogCategory.VOICE, 'ICE candidate added');
          }
          break;

        case 'call-rejected':
          logger.warn(LogCategory.VOICE, 'Call was rejected by remote party');
          this.updateStatus({
            isConnecting: false,
            isActive: false,
            duration: 0,
            error: 'Call was rejected',
          });
          this.endVoiceChat();
          break;

        default:
          logger.warn(LogCategory.VOICE, 'Unknown signaling message type', message.type);
      }
    } catch (error) {
      logger.error(LogCategory.VOICE, 'Error handling signaling message', error as Error);
    }
  }

  /**
   * Called when call is successfully connected
   */
  private onCallConnected(): void {
    logger.info(LogCategory.VOICE, 'Voice call connected');
    this.callStartTime = Date.now();

    this.updateStatus({
      isConnecting: false,
      isActive: true,
      duration: 0,
      error: null,
    });

    // Start call duration timer
    this.callTimer = setInterval(() => {
      if (this.callStartTime) {
        const duration = Math.floor((Date.now() - this.callStartTime) / 1000);
        this.updateStatus({
          isConnecting: false,
          isActive: true,
          duration,
          error: null,
        });
      }
    }, 1000);
  }

  /**
   * End the voice chat
   */
  endVoiceChat(): void {
    logger.info(LogCategory.VOICE, 'Ending voice chat');

    // Stop call timer
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }

    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // Close WebSocket
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.remoteStream = null;
    this.callStartTime = null;

    this.updateStatus({
      isConnecting: false,
      isActive: false,
      duration: 0,
      error: null,
    });
  }

  /**
   * Mute/unmute local microphone
   */
  toggleMute(): boolean {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      logger.info(LogCategory.VOICE, `Microphone ${audioTrack.enabled ? 'unmuted' : 'muted'}`);
      return !audioTrack.enabled; // Return true if muted
    }

    return false;
  }

  /**
   * Check if microphone is muted
   */
  isMuted(): boolean {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    return audioTrack ? !audioTrack.enabled : false;
  }

  /**
   * Set callback for status updates
   */
  onStatusChange(callback: (status: CallStatus) => void): void {
    this.statusCallback = callback;
  }

  /**
   * Set callback for remote stream
   */
  onRemoteStream(callback: (stream: MediaStream) => void): void {
    this.remoteStreamCallback = callback;
  }

  /**
   * Update call status
   */
  private updateStatus(status: CallStatus): void {
    if (this.statusCallback) {
      this.statusCallback(status);
    }
  }

  /**
   * Get current call status
   */
  getStatus(): CallStatus {
    const duration = this.callStartTime
      ? Math.floor((Date.now() - this.callStartTime) / 1000)
      : 0;

    return {
      isActive: this.peerConnection?.connectionState === 'connected',
      isConnecting: this.peerConnection?.connectionState === 'connecting',
      duration,
      error: null,
    };
  }
}

// Export singleton instance
export const emergencyCallService = new EmergencyCallService();
