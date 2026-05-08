"""
Router modules for the CVPerfect API
"""

from ..core.dependencies import get_current_user
from . import auth, resume

__all__ = ["get_current_user", "auth", "resume"]