"""
Centralized logging configuration for AI Babysitter Backend
"""
import logging
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional, Any
import json

from app.config import settings


class JSONFormatter(logging.Formatter):
    """Custom JSON formatter for structured logging"""

    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }

        # Add exception info if present
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)

        # Add extra fields if present
        extra_data = getattr(record, "extra_data", None)
        if extra_data:
            log_data["extra"] = extra_data

        return json.dumps(log_data)


def setup_logger(
    name: str,
    level: Optional[str] = None,
    log_to_file: Optional[bool] = None,
    log_to_console: Optional[bool] = None
) -> logging.Logger:
    """
    Set up a logger with consistent formatting

    Args:
        name: Logger name (usually __name__)
        level: Log level (DEBUG, INFO, WARNING, ERROR, CRITICAL) - overrides config
        log_to_file: Whether to log to file - overrides config
        log_to_console: Whether to log to console - overrides config

    Returns:
        Configured logger instance
    """
    # Check if logging is disabled globally
    if not settings.logging_enabled:
        logger = logging.getLogger(name)
        logger.addHandler(logging.NullHandler())
        return logger

    logger = logging.getLogger(name)

    # Use config settings or provided overrides
    _log_to_file = log_to_file if log_to_file is not None else settings.log_to_file
    _log_to_console = log_to_console if log_to_console is not None else settings.log_to_console

    # Set log level from config or parameter
    if level:
        log_level = getattr(logging, level.upper())
    elif settings.log_level:
        log_level = getattr(logging, settings.log_level.upper(), logging.INFO)
    else:
        log_level = logging.DEBUG if settings.debug else logging.INFO

    logger.setLevel(log_level)

    # Avoid duplicate handlers
    if logger.handlers:
        return logger

    # Console handler
    if _log_to_console:
        console_handler = logging.StreamHandler(sys.stdout)
        console_handler.setLevel(log_level)

        # Use simple format for console
        console_format = logging.Formatter(
            fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
            datefmt="%Y-%m-%d %H:%M:%S"
        )
        console_handler.setFormatter(console_format)
        logger.addHandler(console_handler)

    # File handler
    if _log_to_file:
        log_dir = Path("./logs")
        log_dir.mkdir(exist_ok=True)

        # Main log file
        file_handler = logging.FileHandler(log_dir / "app.log")
        file_handler.setLevel(log_level)

        # Use format from config (json or text)
        if settings.log_format.lower() == "json":
            # JSON format for production/parsing
            file_format = JSONFormatter()
        else:
            # Human-readable text format
            file_format = logging.Formatter(
                fmt="%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d | %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S"
            )

        file_handler.setFormatter(file_format)
        logger.addHandler(file_handler)

        # Error log file
        error_handler = logging.FileHandler(log_dir / "error.log")
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(file_format)
        logger.addHandler(error_handler)

    return logger


def log_api_call(
    logger: logging.Logger,
    endpoint: str,
    method: str,
    **kwargs
):
    """
    Log an API call with structured data

    Args:
        logger: Logger instance
        endpoint: API endpoint path
        method: HTTP method
        **kwargs: Additional data to log
    """
    extra_data = {
        "endpoint": endpoint,
        "method": method,
        **kwargs
    }

    logger.info(
        f"{method} {endpoint}",
        extra={"extra_data": extra_data}
    )


def log_service_call(
    logger: logging.Logger,
    service: str,
    operation: str,
    **kwargs
):
    """
    Log a service layer call

    Args:
        logger: Logger instance
        service: Service name (e.g., "llm_service", "vision_service")
        operation: Operation name (e.g., "generate", "analyze")
        **kwargs: Additional data to log
    """
    extra_data = {
        "service": service,
        "operation": operation,
        **kwargs
    }

    logger.info(
        f"{service}.{operation}",
        extra={"extra_data": extra_data}
    )


def log_error(
    logger: logging.Logger,
    error: Exception,
    context: str = "",
    **kwargs
):
    """
    Log an error with context

    Args:
        logger: Logger instance
        error: Exception object
        context: Context description
        **kwargs: Additional data to log
    """
    extra_data = {
        "error_type": type(error).__name__,
        "error_message": str(error),
        "context": context,
        **kwargs
    }

    logger.error(
        f"Error in {context}: {str(error)}",
        exc_info=True,
        extra={"extra_data": extra_data}
    )


def log_safety_alert(
    logger: logging.Logger,
    alert_level: str,
    message: str,
    session_id: str,
    **kwargs
):
    """
    Log a safety alert

    Args:
        logger: Logger instance
        alert_level: Alert severity level
        message: Alert message
        session_id: Session ID
        **kwargs: Additional data
    """
    extra_data = {
        "alert_level": alert_level,
        "session_id": session_id,
        "alert_type": "safety",
        **kwargs
    }

    # Use ERROR level for urgent/emergency alerts
    if alert_level in ["urgent", "emergency"]:
        logger.error(
            f"SAFETY ALERT [{alert_level.upper()}]: {message}",
            extra={"extra_data": extra_data}
        )
    else:
        logger.warning(
            f"Safety alert [{alert_level}]: {message}",
            extra={"extra_data": extra_data}
        )


# Create default logger
default_logger = setup_logger("ai_babysitter")
