"""
File processing: PDF and DOCX text extraction for resume upload and Gemini analysis.

PDF: PyPDF2 reads all pages first; if the result is empty or very short, PyMuPDF (fitz)
is used as a fallback (better for some encodings / layouts / non-standard PDFs).

DOCX: python-docx — paragraphs, tables (deduped cells), and runs inside paragraphs.
"""

import logging
import os
import re
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# Minimum characters to trust PyPDF2 alone; below this we try PyMuPDF
_PDF_TRY_FALLBACK_UNDER = 120
# Log preview length (task: validate non-empty content for operators)
_EXTRACT_PREVIEW_LEN = 500


def _log_extract_preview(label: str, text: str, file_path: str) -> None:
    """Log length and first N chars so operators can verify real content (not binary)."""
    snippet = (text or "")[:_EXTRACT_PREVIEW_LEN]
    safe = snippet.replace("\n", "\\n")
    logger.info(
        "[resume_extract_preview] %s path=%s len=%s first_%s_chars=%r",
        label,
        file_path,
        len(text or ""),
        _EXTRACT_PREVIEW_LEN,
        safe,
    )


def extract_text_from_file(file_path: str) -> str:
    """
    Extract text from uploaded file based on extension.
    Returns cleaned plain text suitable for storage and LLM prompts (never raw binary).
    """
    try:
        file_ext = Path(file_path).suffix.lower()

        if file_ext == ".pdf":
            return extract_text_from_pdf(file_path)
        if file_ext == ".doc":
            raise ValueError(
                "Legacy Word .doc is not supported. Please save as .docx or export as PDF."
            )
        if file_ext in (".docx",):
            return extract_text_from_docx(file_path)
        if file_ext == ".txt":
            return extract_text_from_txt(file_path)

        raise ValueError(f"Unsupported file type: {file_ext}")
    except Exception as e:
        logger.error("Failed to extract text from %s: %s", file_path, e)
        raise


def _extract_pdf_pypdf2(file_path: str) -> str:
    import PyPDF2

    parts: List[str] = []
    with open(file_path, "rb") as f:
        reader = PyPDF2.PdfReader(f, strict=False)
        for page_num in range(len(reader.pages)):
            page = reader.pages[page_num]
            try:
                t = page.extract_text() or ""
            except Exception as ex:
                logger.warning("PyPDF2 page %s extract failed: %s", page_num, ex)
                t = ""
            parts.append(t)
    # Keep page boundaries — helps headings / sections survive cleaning
    return "\n\n".join(parts)


def _extract_pdf_pymupdf(file_path: str) -> str:
    """Fallback extractor; often succeeds when PyPDF2 returns little or no text."""
    try:
        import fitz  # PyMuPDF

        parts: List[str] = []
        with fitz.open(file_path) as doc:
            for page in doc:
                parts.append(page.get_text() or "")
        return "\n\n".join(parts)
    except ImportError:
        logger.warning("PyMuPDF not installed; skipping PDF fallback")
        return ""
    except Exception as e:
        logger.warning("PyMuPDF extraction failed: %s", e)
        return ""


def extract_text_from_pdf(file_path: str) -> str:
    """
    Extract text from every PDF page (PyPDF2), then PyMuPDF if the result is too thin.
    """
    primary = _extract_pdf_pypdf2(file_path)
    primary_clean = clean_extracted_text(primary)

    if len(primary_clean.strip()) < _PDF_TRY_FALLBACK_UNDER:
        fallback_raw = _extract_pdf_pymupdf(file_path)
        fallback_clean = clean_extracted_text(fallback_raw)
        if len(fallback_clean.strip()) > len(primary_clean.strip()):
            logger.info(
                "PDF: using PyMuPDF result (%s chars) over PyPDF2 (%s chars)",
                len(fallback_clean),
                len(primary_clean),
            )
            extracted = fallback_clean
        else:
            extracted = primary_clean
    else:
        extracted = primary_clean

    if not extracted.strip():
        logger.warning("No text extracted from PDF: %s", file_path)
        return ""

    logger.info("PDF extracted %s characters from %s", len(extracted), file_path)
    _log_extract_preview("pdf", extracted, file_path)
    return extracted


def _paragraph_full_text(paragraph) -> str:
    """Join all runs in a paragraph (python-docx sometimes splits styling per run)."""
    try:
        return "".join(run.text for run in paragraph.runs) or (paragraph.text or "")
    except Exception:
        return paragraph.text or ""


def extract_text_from_docx(file_path: str) -> str:
    """
    Extract from body in document order: paragraphs (all runs) and tables (deduped cells).
    """
    from docx import Document
    from docx.oxml.table import CT_Tbl
    from docx.oxml.text.paragraph import CT_P
    from docx.table import Table
    from docx.text.paragraph import Paragraph

    doc = Document(file_path)
    text_content: List[str] = []
    body_el = doc.element.body
    body_parent = doc._body

    for child in body_el.iterchildren():
        if isinstance(child, CT_P):
            p = Paragraph(child, body_parent)
            line = _paragraph_full_text(p).strip()
            if line:
                text_content.append(line)
        elif isinstance(child, CT_Tbl):
            tbl = Table(child, body_parent)
            for row in tbl.rows:
                seen_cell_text: Optional[str] = None
                for cell in row.cells:
                    ct = " ".join(
                        _paragraph_full_text(para).strip()
                        for para in cell.paragraphs
                    ).strip()
                    if not ct:
                        continue
                    if ct == seen_cell_text:
                        continue
                    seen_cell_text = ct
                    text_content.append(ct)

    extracted_text = "\n\n".join(text_content)

    if not extracted_text.strip():
        logger.warning("No text extracted from DOCX: %s", file_path)
        return ""

    cleaned = clean_extracted_text(extracted_text)
    logger.info("DOCX extracted %s characters from %s", len(cleaned), file_path)
    _log_extract_preview("docx", cleaned, file_path)
    return cleaned


def extract_text_from_txt(file_path: str) -> str:
    try:
        with open(file_path, "r", encoding="utf-8") as file:
            content = file.read()
    except UnicodeDecodeError:
        with open(file_path, "r", encoding="latin-1") as file:
            content = file.read()
        logger.info("Read TXT with latin-1 encoding")

    cleaned = clean_extracted_text(content)
    logger.info("TXT read %s characters", len(cleaned))
    _log_extract_preview("txt", cleaned, file_path)
    return cleaned


def clean_extracted_text(text: str) -> str:
    """
    Normalize whitespace without destroying line breaks (critical for resumes).

    Previous implementation used re.sub(r'\\s+', ' ', ...) which collapsed *all*
    newlines into spaces and hurt structure and readability for the LLM.
    """
    if not text:
        return ""

    text = text.replace("\r\n", "\n").replace("\r", "\n")
    lines: List[str] = []
    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue
        # Only collapse spaces/tabs within a single line
        line = re.sub(r"[ \t]+", " ", line)
        lines.append(line)

    cleaned = "\n".join(lines)
    cleaned = re.sub(r"\n{3,}", "\n\n", cleaned)
    return cleaned.strip()


def save_uploaded_file(uploaded_file, upload_dir: str = "uploads") -> str:
    try:
        os.makedirs(upload_dir, exist_ok=True)
        file_extension = Path(uploaded_file.filename).suffix
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join(upload_dir, unique_filename)

        # Starlette / FastAPI UploadFile
        file_obj = getattr(uploaded_file, "file", None)
        if file_obj is not None:
            content = file_obj.read()
        else:
            content = uploaded_file.read()

        with open(file_path, "wb") as buffer:
            buffer.write(content)

        logger.info("File saved: %s (%s bytes)", file_path, len(content))
        return file_path
    except Exception as e:
        logger.error("Failed to save uploaded file: %s", e)
        raise


def validate_file_type(filename: str) -> bool:
    allowed_extensions = {".pdf", ".doc", ".docx", ".txt"}
    return Path(filename).suffix.lower() in allowed_extensions


def validate_file_size(file_size: int, max_size_mb: int = 10) -> bool:
    return file_size <= max_size_mb * 1024 * 1024


def get_file_info(file_path: str) -> Dict[str, Any]:
    try:
        file_stat = os.stat(file_path)
        return {
            "filename": Path(file_path).name,
            "file_type": Path(file_path).suffix.lower(),
            "file_size": file_stat.st_size,
            "created_at": file_stat.st_ctime,
            "modified_at": file_stat.st_mtime,
        }
    except Exception as e:
        logger.error("get_file_info failed: %s", e)
        return {}


def cleanup_temp_file(file_path: str) -> bool:
    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            logger.info("Cleaned up temp file: %s", file_path)
            return True
        return False
    except Exception as e:
        logger.error("cleanup_temp_file failed: %s", e)
        return False


def extract_resume_sections(text: str) -> Dict[str, str]:
    sections = {
        "contact_info": "",
        "summary": "",
        "experience": "",
        "education": "",
        "skills": "",
        "projects": "",
        "certifications": "",
    }

    section_patterns = {
        "experience": r"(experience|work history|employment|professional experience)",
        "education": r"(education|academic background|qualifications)",
        "skills": r"(skills|technical skills|competencies|technologies)",
        "projects": r"(projects|portfolio|personal projects)",
        "certifications": r"(certifications|certificates|licenses)",
        "summary": r"(summary|objective|profile|about me)",
    }

    email_pattern = r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b"
    phone_pattern = r"(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}"

    emails = re.findall(email_pattern, text)
    phones = re.findall(phone_pattern, text)
    if emails or phones:
        contact_parts: List[str] = []
        contact_parts.extend(emails)
        for phone in phones:
            contact_parts.append(
                phone[0] + phone[1] if isinstance(phone, tuple) else str(phone)
            )
        sections["contact_info"] = "\n".join(contact_parts)

    lines = text.split("\n")
    current_section: Optional[str] = None
    section_content: List[str] = []

    for line in lines:
        line_clean = line.strip()
        if not line_clean:
            continue
        found_section = None
        for section_name, pattern in section_patterns.items():
            if re.search(pattern, line_clean.lower()):
                found_section = section_name
                break
        if found_section:
            if current_section and section_content:
                sections[current_section] = "\n".join(section_content)
            current_section = found_section
            section_content = []
        elif current_section:
            section_content.append(line_clean)

    if current_section and section_content:
        sections[current_section] = "\n".join(section_content)

    for key in sections:
        sections[key] = sections[key].strip()

    return sections


if __name__ == "__main__":
    sample_file = "sample_resume.pdf"
    if os.path.exists(sample_file):
        t = extract_text_from_file(sample_file)
        print(f"Extracted {len(t)} characters")
    else:
        print("No sample file found")
