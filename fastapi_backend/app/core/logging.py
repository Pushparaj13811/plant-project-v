import logging
import logging.config
import sys
import os
from typing import Dict, Any

from app.core.config import settings

# Log levels dictionary for easy configuration
LOG_LEVELS = {
    "debug": logging.DEBUG,
    "info": logging.INFO,
    "warning": logging.WARNING,
    "error": logging.ERROR,
    "critical": logging.CRITICAL,
}

# Default configuration
DEFAULT_LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "format": "%(asctime)s - %(name)s - %(levelname)s - %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "stream": sys.stdout,
            "formatter": "default",
            "level": LOG_LEVELS.get(settings.LOG_LEVEL.lower(), logging.INFO),
        },
        "error_console": {
            "class": "logging.StreamHandler",
            "stream": sys.stderr,
            "formatter": "default",
            "level": logging.ERROR,
        },
    },
    "loggers": {
        "app": {
            "handlers": ["console", "error_console"],
            "level": LOG_LEVELS.get(settings.LOG_LEVEL.lower(), logging.INFO),
            "propagate": False,
        },
        "uvicorn": {
            "handlers": ["console", "error_console"],
            "level": LOG_LEVELS.get(settings.LOG_LEVEL.lower(), logging.INFO),
            "propagate": False,
        },
        "sqlalchemy.engine": {
            "handlers": ["console", "error_console"],
            "level": LOG_LEVELS.get(settings.SQL_LOG_LEVEL.lower(), logging.WARNING),
            "propagate": False,
        },
    },
    "root": {
        "handlers": ["console", "error_console"],
        "level": LOG_LEVELS.get(settings.LOG_LEVEL.lower(), logging.INFO),
    },
}


def setup_logging() -> None:
    """
    Set up logging configuration
    """
    log_config = DEFAULT_LOGGING_CONFIG.copy()
    
    # Add file handler if in production
    if settings.ENVIRONMENT != "development":
        log_directory = settings.LOG_DIR
        os.makedirs(log_directory, exist_ok=True)
        
        # Add file handlers to config
        log_config["handlers"]["file"] = {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": f"{log_directory}/app.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
            "formatter": "default",
            "level": LOG_LEVELS.get(settings.LOG_LEVEL.lower(), logging.INFO),
        }
        log_config["handlers"]["error_file"] = {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": f"{log_directory}/error.log",
            "maxBytes": 10485760,  # 10MB
            "backupCount": 5,
            "formatter": "default",
            "level": logging.ERROR,
        }
        
        # Update loggers to use file handlers
        for logger in log_config["loggers"].values():
            logger["handlers"].extend(["file", "error_file"])
        log_config["root"]["handlers"].extend(["file", "error_file"])
    
    # Configure logging
    logging.config.dictConfig(log_config) 