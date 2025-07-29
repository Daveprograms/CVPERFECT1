"""
Utils package for CVPerfect backend
"""

try:
    from .file_processing import (
        extract_text_from_file,
        save_uploaded_file,
        cleanup_temp_file,
        get_file_info,
        validate_file_type,
        validate_file_size
    )
except ImportError:
    # Fallback functions if file_processing not available
    def extract_text_from_file(file_path: str) -> str:
        return "File processing not available"
    
    def save_uploaded_file(file) -> str:
        return "/tmp/temp_file"
    
    def cleanup_temp_file(file_path: str) -> bool:
        return True
    
    def get_file_info(file_path: str) -> dict:
        return {}
    
    def validate_file_type(filename: str) -> bool:
        return True
    
    def validate_file_size(size: int, max_size_mb: int = 10) -> bool:
        return True

__all__ = [
    'extract_text_from_file',
    'save_uploaded_file', 
    'cleanup_temp_file',
    'get_file_info',
    'validate_file_type',
    'validate_file_size'
] 