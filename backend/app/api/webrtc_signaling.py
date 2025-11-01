"""
WebRTC Signaling API for Emergency Voice Calls

Handles WebRTC signaling for peer-to-peer voice calls between
child and emergency contact.
"""

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import Dict, Optional
import json

from app.utils.logger import setup_logger

logger = setup_logger(__name__)
router = APIRouter(prefix="/ws/emergency-call", tags=["webrtc"])


class WebRTCSignalingService:
    """
    WebRTC signaling service for emergency calls

    Manages WebSocket connections and relays WebRTC signaling messages
    between child and emergency contact (parent).
    """

    def __init__(self):
        # session_id -> {child: WebSocket, parent: WebSocket}
        self.active_calls: Dict[str, Dict[str, WebSocket]] = {}

        # Track all connected peers
        self.connections: Dict[str, Dict[str, WebSocket]] = {}

    async def connect_child(self, session_id: str, websocket: WebSocket):
        """Register child's WebSocket for a call"""
        await websocket.accept()

        if session_id not in self.connections:
            self.connections[session_id] = {}

        self.connections[session_id]['child'] = websocket
        logger.info(f"Child connected to emergency call: {session_id}")

    async def connect_parent(self, session_id: str, websocket: WebSocket):
        """Register parent's WebSocket for receiving call"""
        await websocket.accept()

        if session_id not in self.connections:
            self.connections[session_id] = {}

        self.connections[session_id]['parent'] = websocket
        logger.info(f"Parent connected to emergency call: {session_id}")

    def disconnect(self, session_id: str, role: str):
        """Remove WebSocket connection"""
        if session_id in self.connections:
            if role in self.connections[session_id]:
                del self.connections[session_id][role]
                logger.info(f"{role.capitalize()} disconnected from call: {session_id}")

            # Clean up empty sessions
            if not self.connections[session_id]:
                del self.connections[session_id]
                logger.info(f"Call session cleaned up: {session_id}")

    async def relay_message(self, session_id: str, from_role: str, message: dict):
        """
        Relay WebRTC signaling message from one peer to another

        Args:
            session_id: Session identifier
            from_role: 'child' or 'parent'
            message: WebRTC signaling message (offer, answer, ice-candidate)
        """
        # Determine recipient
        to_role = 'parent' if from_role == 'child' else 'child'

        if session_id not in self.connections:
            logger.warning(f"No active call session: {session_id}")
            return

        if to_role not in self.connections[session_id]:
            logger.warning(f"{to_role.capitalize()} not connected for session: {session_id}")
            return

        # Relay message to the other peer
        try:
            recipient_ws = self.connections[session_id][to_role]
            await recipient_ws.send_json(message)
            logger.debug(f"Relayed {message.get('type', 'unknown')} from {from_role} to {to_role}")
        except Exception as e:
            logger.error(f"Failed to relay message: {e}")


# Global signaling service instance
signaling_service = WebRTCSignalingService()


@router.websocket("/{session_id}")
async def webrtc_signaling_endpoint(websocket: WebSocket, session_id: str):
    """
    WebSocket endpoint for WebRTC signaling

    Children connect here to initiate emergency calls
    Parents can connect to receive calls

    Messages:
    - offer: WebRTC offer from caller
    - answer: WebRTC answer from callee
    - ice-candidate: ICE candidates for NAT traversal
    """

    # Accept connection first
    await websocket.accept()
    logger.info(f"WebSocket connection initiated for session: {session_id}")

    role: Optional[str] = None  # Will be determined from first message

    try:
        while True:
            # Receive message
            data = await websocket.receive_text()
            message = json.loads(data)

            message_type = message.get('type')
            logger.debug(f"Received WebRTC message: {message_type} for session {session_id}")

            # Determine role from first message
            if role is None:
                # Child sends 'offer' first
                # Parent sends 'answer' first (or can be explicitly set)
                if message_type == 'offer':
                    role = 'child'
                    await signaling_service.connect_child(session_id, websocket)
                elif message_type == 'answer':
                    role = 'parent'
                    await signaling_service.connect_parent(session_id, websocket)
                elif 'role' in message:
                    # Explicit role specification
                    role = message['role']
                    if role == 'child':
                        await signaling_service.connect_child(session_id, websocket)
                    else:
                        await signaling_service.connect_parent(session_id, websocket)

            # Relay signaling messages (only if role is determined)
            if role and message_type in ['offer', 'answer', 'ice-candidate']:
                await signaling_service.relay_message(session_id, role, message)

            # Handle call control messages
            elif message_type == 'call-ended':
                logger.info(f"Call ended by {role} for session {session_id}")
                # Notify the other peer
                other_role = 'parent' if role == 'child' else 'child'
                if session_id in signaling_service.connections and other_role in signaling_service.connections[session_id]:
                    try:
                        await signaling_service.connections[session_id][other_role].send_json({
                            'type': 'call-ended',
                            'reason': 'Peer ended call'
                        })
                    except:
                        pass
                break

            elif message_type == 'heartbeat':
                # Keep-alive ping/pong
                await websocket.send_json({'type': 'heartbeat-ack'})

            else:
                logger.warning(f"Unknown message type: {message_type}")

    except WebSocketDisconnect:
        logger.info(f"WebSocket disconnected for session {session_id}")

    except Exception as e:
        logger.error(f"WebSocket error for session {session_id}: {e}", exc_info=True)

    finally:
        # Clean up connection
        if role:
            signaling_service.disconnect(session_id, role)
