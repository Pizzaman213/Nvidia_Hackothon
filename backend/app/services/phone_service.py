"""
Phone Service for Emergency Calling
Supports Twilio for making phone calls to parents
"""
import os
import logging
from typing import Dict, Any, Optional
from app.config import settings
from app.utils.logger import setup_logger

logger = setup_logger(__name__)

logger = logging.getLogger(__name__)


class PhoneService:
    """Service for handling emergency phone calls"""

    def __init__(self):
        self.twilio_account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.twilio_auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.twilio_phone_number = os.getenv("TWILIO_PHONE_NUMBER")
        self.twilio_enabled = bool(self.twilio_account_sid and self.twilio_auth_token and self.twilio_phone_number)

        if self.twilio_enabled:
            try:
                from twilio.rest import Client
                self.client = Client(self.twilio_account_sid, self.twilio_auth_token)
                logger.info("✓ Twilio phone service initialized")
            except ImportError:
                logger.warning("Twilio library not installed. Run: pip install twilio")
                self.twilio_enabled = False
            except Exception as e:
                logger.error(f"Failed to initialize Twilio client: {e}")
                self.twilio_enabled = False
        else:
            logger.warning("Twilio credentials not configured. Emergency calling disabled.")
            self.client = None

    async def make_emergency_call(
        self,
        to_phone_number: str,
        child_name: str,
        reason: str = "Emergency button pressed"
    ) -> Dict[str, Any]:
        """
        Make an emergency call to a parent

        Args:
            to_phone_number: Parent's phone number
            child_name: Name of the child
            reason: Reason for the call

        Returns:
            Dict with call status and details
        """
        if not self.twilio_enabled:
            return {
                "success": False,
                "error": "Phone service not configured. Please add Twilio credentials to .env",
                "call_sid": None
            }

        if not to_phone_number:
            return {
                "success": False,
                "error": "No emergency contact phone number configured",
                "call_sid": None
            }

        # Format phone number (ensure it has country code)
        formatted_number = self._format_phone_number(to_phone_number)

        try:
            # Create TwiML for the call message
            twiml_message = f"""
            <Response>
                <Say voice="alice">
                    This is an urgent message from AI Babysitter.
                    {child_name} has pressed the emergency button.
                    Reason: {reason}.
                    Please check on {child_name} immediately.
                    This message will repeat.
                </Say>
                <Pause length="2"/>
                <Say voice="alice">
                    {child_name} has pressed the emergency button.
                    Please check on {child_name} immediately.
                </Say>
            </Response>
            """

            # Make the call
            call = self.client.calls.create(
                to=formatted_number,
                from_=self.twilio_phone_number,
                twiml=twiml_message,
                status_callback_method='POST',
                status_callback_event=['initiated', 'ringing', 'answered', 'completed']
            )

            logger.info(f"Emergency call initiated to {formatted_number} for {child_name}. Call SID: {call.sid}")

            return {
                "success": True,
                "call_sid": call.sid,
                "status": call.status,
                "to_number": formatted_number,
                "error": None
            }

        except Exception as e:
            logger.error(f"Failed to make emergency call: {e}")
            return {
                "success": False,
                "error": str(e),
                "call_sid": None
            }

    async def send_emergency_sms(
        self,
        to_phone_number: str,
        child_name: str,
        reason: str = "Emergency button pressed"
    ) -> Dict[str, Any]:
        """
        Send an emergency SMS to a parent

        Args:
            to_phone_number: Parent's phone number
            child_name: Name of the child
            reason: Reason for the SMS

        Returns:
            Dict with SMS status and details
        """
        if not self.twilio_enabled:
            return {
                "success": False,
                "error": "Phone service not configured. Please add Twilio credentials to .env",
                "message_sid": None
            }

        if not to_phone_number:
            return {
                "success": False,
                "error": "No emergency contact phone number configured",
                "message_sid": None
            }

        formatted_number = self._format_phone_number(to_phone_number)

        try:
            message = self.client.messages.create(
                to=formatted_number,
                from_=self.twilio_phone_number,
                body=f"🚨 EMERGENCY ALERT from AI Babysitter\n\n{child_name} has pressed the emergency button.\n\nReason: {reason}\n\nPlease check on {child_name} immediately!"
            )

            logger.info(f"Emergency SMS sent to {formatted_number} for {child_name}. Message SID: {message.sid}")

            return {
                "success": True,
                "message_sid": message.sid,
                "status": message.status,
                "to_number": formatted_number,
                "error": None
            }

        except Exception as e:
            logger.error(f"Failed to send emergency SMS: {e}")
            return {
                "success": False,
                "error": str(e),
                "message_sid": None
            }

    def _format_phone_number(self, phone_number: str) -> str:
        """
        Format phone number to E.164 format

        Args:
            phone_number: Phone number in various formats

        Returns:
            Formatted phone number with country code
        """
        # Remove all non-digit characters
        digits = ''.join(filter(str.isdigit, phone_number))

        # If it's a 10-digit US number, add +1
        if len(digits) == 10:
            return f"+1{digits}"

        # If it already has country code, just add +
        if len(digits) == 11 and digits[0] == '1':
            return f"+{digits}"

        # If it starts with +, return as is
        if phone_number.startswith('+'):
            return phone_number

        # Otherwise, assume US and add +1
        return f"+1{digits}"

    def validate_phone_number(self, phone_number: str) -> Dict[str, Any]:
        """
        Validate a phone number format

        Args:
            phone_number: Phone number to validate

        Returns:
            Dict with validation result
        """
        if not phone_number:
            return {
                "valid": False,
                "error": "Phone number is required"
            }

        # Remove all non-digit characters
        digits = ''.join(filter(str.isdigit, phone_number))

        # Check if it's a valid length (10 digits for US, 11 with country code)
        if len(digits) not in [10, 11]:
            return {
                "valid": False,
                "error": "Phone number must be 10 or 11 digits"
            }

        # Format the number
        formatted = self._format_phone_number(phone_number)

        return {
            "valid": True,
            "formatted": formatted,
            "error": None
        }

    def get_call_status(self, call_sid: str) -> Dict[str, Any]:
        """
        Get the status of a call

        Args:
            call_sid: Twilio call SID

        Returns:
            Dict with call status
        """
        if not self.twilio_enabled:
            return {
                "success": False,
                "error": "Phone service not configured"
            }

        try:
            call = self.client.calls(call_sid).fetch()
            return {
                "success": True,
                "status": call.status,
                "duration": call.duration,
                "error": None
            }
        except Exception as e:
            logger.error(f"Failed to get call status: {e}")
            return {
                "success": False,
                "error": str(e)
            }


# Global instance
phone_service = PhoneService()
