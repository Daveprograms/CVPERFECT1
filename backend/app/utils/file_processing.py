"""
File Processing Utilities
Real PDF and DOCX text extraction for resume processing
"""

import logging
import os
import tempfile
from typing import Optional, Dict, Any
from pathlib import Path

logger = logging.getLogger(__name__)


def extract_text_from_file(file_path: str) -> str:
    """
    Extract text from uploaded file based on file type
    Processes REAL file content, not mock data
    """
    try:
        file_ext = Path(file_path).suffix.lower()
        
        if file_ext == '.pdf':
            return extract_text_from_pdf(file_path)
        elif file_ext in ['.doc', '.docx']:
            return extract_text_from_docx(file_path)
        elif file_ext == '.txt':
            return extract_text_from_txt(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")
            
    except Exception as e:
        logger.error(f"Failed to extract text from {file_path}: {str(e)}")
        raise


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract real text content from PDF files using PyPDF2
    """
    try:
        import PyPDF2
        
        text_content = []
        
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            
            # Extract text from each page
            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                
                if text.strip():  # Only add non-empty pages
                    text_content.append(text)
        
        extracted_text = '\n\n'.join(text_content)
        
        if not extracted_text.strip():
            logger.warning(f"No text extracted from PDF: {file_path}")
            return ""
        
        logger.info(f"Successfully extracted {len(extracted_text)} characters from PDF")
        return clean_extracted_text(extracted_text)
        
    except ImportError:
        logger.error("PyPDF2 not installed. Install with: pip install PyPDF2")
        raise
    except Exception as e:
        logger.error(f"PDF extraction failed: {str(e)}")
        raise


def extract_text_from_docx(file_path: str) -> str:
    """
    Extract real text content from DOCX files using python-docx
    """
    try:
        from docx import Document
        
        doc = Document(file_path)
        text_content = []
        
        # Extract text from paragraphs
        for paragraph in doc.paragraphs:
            if paragraph.text.strip():
                text_content.append(paragraph.text)
        
        # Extract text from tables
        for table in doc.tables:
            for row in table.rows:
                for cell in row.cells:
                    if cell.text.strip():
                        text_content.append(cell.text)
        
        extracted_text = '\n\n'.join(text_content)
        
        if not extracted_text.strip():
            logger.warning(f"No text extracted from DOCX: {file_path}")
            return ""
        
        logger.info(f"Successfully extracted {len(extracted_text)} characters from DOCX")
        return clean_extracted_text(extracted_text)
        
    except ImportError:
        logger.error("python-docx not installed. Install with: pip install python-docx")
        raise
    except Exception as e:
        logger.error(f"DOCX extraction failed: {str(e)}")
        raise


def extract_text_from_txt(file_path: str) -> str:
    """
    Extract text content from plain text files
    """
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        
        logger.info(f"Successfully read {len(content)} characters from TXT file")
        return clean_extracted_text(content)
        
    except UnicodeDecodeError:
        # Try with different encoding
        try:
            with open(file_path, 'r', encoding='latin-1') as file:
                content = file.read()
            logger.info("Successfully read TXT file with latin-1 encoding")
            return clean_extracted_text(content)
        except Exception as e:
            logger.error(f"Failed to read TXT file with multiple encodings: {str(e)}")
            raise
    except Exception as e:
        logger.error(f"TXT extraction failed: {str(e)}")
        raise


def clean_extracted_text(text: str) -> str:
    """
    Clean and normalize extracted text content
    """
    if not text:
        return ""
    
    # Remove excessive whitespace
    lines = [line.strip() for line in text.split('\n')]
    lines = [line for line in lines if line]  # Remove empty lines
    
    # Join with single newlines
    cleaned_text = '\n'.join(lines)
    
    # Remove multiple consecutive spaces
    import re
    cleaned_text = re.sub(r'\s+', ' ', cleaned_text)
    
    # Remove excessive newlines (more than 2 consecutive)
    cleaned_text = re.sub(r'\n{3,}', '\n\n', cleaned_text)
    
    return cleaned_text.strip()


def save_uploaded_file(uploaded_file, upload_dir: str = "uploads") -> str:
    """
    Save uploaded file to disk and return file path
    Creates real file for processing
    """
    try:
        # Create upload directory if it doesn't exist
        os.makedirs(upload_dir, exist_ok=True)
        
        # Generate unique filename
        import uuid
        file_extension = Path(uploaded_file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file to disk
        with open(file_path, "wb") as buffer:
            content = uploaded_file.file.read()
            buffer.write(content)
        
        logger.info(f"File saved: {file_path} ({len(content)} bytes)")
        return file_path
        
    except Exception as e:
        logger.error(f"Failed to save uploaded file: {str(e)}")
        raise


def validate_file_type(filename: str) -> bool:
    """
    Validate if file type is supported for resume processing
    """
    allowed_extensions = {'.pdf', '.doc', '.docx', '.txt'}
    file_extension = Path(filename).suffix.lower()
    return file_extension in allowed_extensions


def validate_file_size(file_size: int, max_size_mb: int = 10) -> bool:
    """
    Validate file size is within limits
    """
    max_size_bytes = max_size_mb * 1024 * 1024
    return file_size <= max_size_bytes


def get_file_info(file_path: str) -> Dict[str, Any]:
    """
    Get information about a file
    """
    try:
        file_stat = os.stat(file_path)
        file_extension = Path(file_path).suffix.lower()
        
        return {
            "filename": Path(file_path).name,
            "file_type": file_extension,
            "file_size": file_stat.st_size,
            "created_at": file_stat.st_ctime,
            "modified_at": file_stat.st_mtime
        }
    except Exception as e:
        logger.error(f"Failed to get file info for {file_path}: {str(e)}")
        return {}


def cleanup_temp_file(file_path: str) -> bool:
    """
    Clean up temporary files after processing
    """
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info(f"Cleaned up temp file: {file_path}")
            return True
        return False
    except Exception as e:
        logger.error(f"Failed to cleanup temp file {file_path}: {str(e)}")
        return False


def extract_resume_sections(text: str) -> Dict[str, str]:
    """
    Extract common resume sections from text
    Returns real parsed sections, not mock data
    """
    import re
    
    sections = {
        "contact_info": "",
        "summary": "", 
        "experience": "",
        "education": "",
        "skills": "",
        "projects": "",
        "certifications": ""
    }
    
    text_lower = text.lower()
    
    # Define section patterns
    section_patterns = {
        "experience": r"(experience|work history|employment|professional experience)",
        "education": r"(education|academic background|qualifications)",
        "skills": r"(skills|technical skills|competencies|technologies)",
        "projects": r"(projects|portfolio|personal projects)",
        "certifications": r"(certifications|certificates|licenses)",
        "summary": r"(summary|objective|profile|about me)"
    }
    
    # Extract contact information (basic patterns)
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    phone_pattern = r'(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}'
    
    emails = re.findall(email_pattern, text)
    phones = re.findall(phone_pattern, text)
    
    if emails or phones:
        contact_parts = []
        if emails:
            contact_parts.extend(emails)
        if phones:
            contact_parts.extend([phone[0] + phone[1] if isinstance(phone, tuple) else phone for phone in phones])
        sections["contact_info"] = "\n".join(contact_parts)
    
    # Split text into lines for section detection
    lines = text.split('\n')
    current_section = None
    section_content = []
    
    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
            
        # Check if line is a section header
        found_section = None
        for section_name, pattern in section_patterns.items():
            if re.search(pattern, line_clean.lower()):
                found_section = section_name
                break
        
        if found_section:
            # Save previous section content
            if current_section and section_content:
                sections[current_section] = '\n'.join(section_content)
            
            # Start new section
            current_section = found_section
            section_content = []
        elif current_section:
            section_content.append(line_clean)
    
    # Save last section
    if current_section and section_content:
        sections[current_section] = '\n'.join(section_content)
    
    # Clean up sections
    for key in sections:
        sections[key] = sections[key].strip()
    
    return sections


# Example usage for testing (development only)
if __name__ == "__main__":
    # This is for development testing only
    # Production should not have main execution
    sample_file = "sample_resume.pdf"
    if os.path.exists(sample_file):
        try:
            text = extract_text_from_file(sample_file)
            print(f"Extracted {len(text)} characters")
            
            sections = extract_resume_sections(text)
            for section, content in sections.items():
                if content:
                    print(f"\n{section.upper()}:")
                    print(content[:200] + "..." if len(content) > 200 else content)
        except Exception as e:
            print(f"Error: {e}")
    else:
        print("No sample file found for testing") 