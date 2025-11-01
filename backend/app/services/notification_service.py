"""
Parent Notification Service
"""
from typing import Dict, Set
from fastapi import WebSocket
from app.models.alert import SafetyAlert
from app.utils.logger import setup_logger

logger = setup_logger(__name__)


class NotificationService:
    """
    Service for managing real-time parent notifications via WebSocket
    """

    def __init__(self):
        # Store active WebSocket connections by parent_id
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, parent_id: str, websocket: WebSocket):
        """
        Register a new WebSocket connection for a parent

        Args:
            parent_id: Parent's unique ID
            websocket: WebSocket connection
        """
        await websocket.accept()

        if parent_id not in self.active_connections:
            self.active_connections[parent_id] = set()

        self.active_connections[parent_id].add(websocket)
        print(f"Parent {parent_id} connected via WebSocket")

    def disconnect(self, parent_id: str, websocket: WebSocket):
        """
        Remove a WebSocket connection

        Args:
            parent_id: Parent's unique ID
            websocket: WebSocket connection to remove
        """
        if parent_id in self.active_connections:
            self.active_connections[parent_id].discard(websocket)

            # Clean up empty sets
            if not self.active_connections[parent_id]:
                del self.active_connections[parent_id]

        print(f"Parent {parent_id} disconnected from WebSocket")

    async def notify_parent(self, parent_id: str, alert: SafetyAlert):
        """
        Send an alert to a parent via all their active WebSocket connections

        Args:
            parent_id: Parent's unique ID
            alert: SafetyAlert to send
        """
        if parent_id not in self.active_connections:
            print(f"No active connections for parent {parent_id}")
            return

        # Prepare alert message
        alert_message = {
            "type": "alert",
            "level": alert.level.value,
            "message": alert.message,
            "context": alert.context,
            "timestamp": alert.timestamp.isoformat(),
            "requires_action": alert.requires_action
        }

        # Send to all active connections for this parent
        disconnected = set()

        for websocket in self.active_connections[parent_id]:
            try:
                await websocket.send_json(alert_message)
            except Exception as e:
                print(f"Error sending to WebSocket: {e}")
                disconnected.add(websocket)

        # Clean up disconnected sockets
        for ws in disconnected:
            self.disconnect(parent_id, ws)

    async def send_activity_update(self, parent_id: str, activity_data: Dict):
        """
        Send an activity update to parent

        Args:
            parent_id: Parent's unique ID
            activity_data: Activity information
        """
        if parent_id not in self.active_connections:
            return

        message = {
            "type": "activity_update",
            **activity_data
        }

        disconnected = set()

        for websocket in self.active_connections[parent_id]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"Error sending activity update: {e}")
                disconnected.add(websocket)

        for ws in disconnected:
            self.disconnect(parent_id, ws)

    async def send_session_update(self, parent_id: str, session_data: Dict):
        """
        Send a session update to parent

        Args:
            parent_id: Parent's unique ID
            session_data: Session information
        """
        if parent_id not in self.active_connections:
            return

        message = {
            "type": "session_update",
            **session_data
        }

        disconnected = set()

        for websocket in self.active_connections[parent_id]:
            try:
                await websocket.send_json(message)
            except Exception as e:
                print(f"Error sending session update: {e}")
                disconnected.add(websocket)

        for ws in disconnected:
            self.disconnect(parent_id, ws)

    def is_parent_connected(self, parent_id: str) -> bool:
        """
        Check if a parent has any active connections

        Args:
            parent_id: Parent's unique ID

        Returns:
            True if parent has active connections
        """
        return parent_id in self.active_connections and len(self.active_connections[parent_id]) > 0


# Global notification service instance
notification_service = NotificationService()
