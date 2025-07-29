"""
Text Processing Utilities
Common text processing functions used across ML services.
"""

import re
import string
from typing import List, Dict, Optional
import logging
from collections import Counter

# Try to import optional dependencies
try:
    import PyPDF2
    import docx
    HAS_PDF_SUPPORT = True
except ImportError:
    HAS_PDF_SUPPORT = False
    logging.warning("PDF/DOCX processing not available. Install PyPDF2 and python-docx for full functionality.")

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    import nltk
    from nltk.corpus import stopwords
    from nltk.tokenize import word_tokenize, sent_tokenize
    HAS_NLP_SUPPORT = True
    
    # Download required NLTK data
    try:
        nltk.data.find('tokenizers/punkt')
    except LookupError:
        nltk.download('punkt')
    
    try:
        nltk.data.find('corpora/stopwords')
    except LookupError:
        nltk.download('stopwords')
        
except ImportError:
    HAS_NLP_SUPPORT = False
    logging.warning("Advanced NLP features not available. Install scikit-learn and nltk for full functionality.")


def extract_text_from_pdf(file_path: str) -> str:
    """Extract text from PDF file."""
    if not HAS_PDF_SUPPORT:
        raise ImportError("PDF support not available. Install PyPDF2.")
    
    try:
        with open(file_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
        return text
    except Exception as e:
        logging.error(f"Failed to extract text from PDF: {str(e)}")
        return ""


def extract_text_from_docx(file_path: str) -> str:
    """Extract text from DOCX file."""
    if not HAS_PDF_SUPPORT:
        raise ImportError("DOCX support not available. Install python-docx.")
    
    try:
        doc = docx.Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        logging.error(f"Failed to extract text from DOCX: {str(e)}")
        return ""


def clean_text(text: str) -> str:
    """Clean and normalize text for processing."""
    if not text:
        return ""
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove special characters but keep important punctuation
    text = re.sub(r'[^\w\s\.\,\-\(\)\@\#\+\%]', ' ', text)
    
    # Remove excessive punctuation
    text = re.sub(r'[\.]{2,}', '.', text)
    text = re.sub(r'[\-]{2,}', '-', text)
    
    # Normalize case (preserve original case for now)
    text = text.strip()
    
    return text


def extract_keywords(text: str, max_keywords: int = 20) -> List[str]:
    """Extract important keywords from text using TF-IDF or fallback method."""
    if not text:
        return []
    
    if HAS_NLP_SUPPORT:
        return _extract_keywords_tfidf(text, max_keywords)
    else:
        return _extract_keywords_fallback(text, max_keywords)


def _extract_keywords_tfidf(text: str, max_keywords: int = 20) -> List[str]:
    """Extract keywords using TF-IDF vectorization."""
    try:
        # Get English stopwords
        stop_words = set(stopwords.words('english'))
        
        # Add common resume words to stopwords
        resume_stopwords = {
            'experience', 'work', 'job', 'position', 'role', 'company', 'team',
            'project', 'year', 'years', 'month', 'months', 'time', 'good', 'great',
            'excellent', 'strong', 'able', 'ability', 'skill', 'skills', 'knowledge'
        }
        stop_words.update(resume_stopwords)
        
        # Create TF-IDF vectorizer
        vectorizer = TfidfVectorizer(
            max_features=max_keywords * 2,
            stop_words=list(stop_words),
            ngram_range=(1, 2),  # Include bigrams
            min_df=1,
            max_df=0.8
        )
        
        # Fit and transform text
        tfidf_matrix = vectorizer.fit_transform([text])
        feature_names = vectorizer.get_feature_names_out()
        tfidf_scores = tfidf_matrix.toarray()[0]
        
        # Get top keywords
        keyword_scores = list(zip(feature_names, tfidf_scores))
        keyword_scores.sort(key=lambda x: x[1], reverse=True)
        
        return [keyword for keyword, score in keyword_scores[:max_keywords] if score > 0]
        
    except Exception as e:
        logging.error(f"TF-IDF keyword extraction failed: {str(e)}")
        return _extract_keywords_fallback(text, max_keywords)


def _extract_keywords_fallback(text: str, max_keywords: int = 20) -> List[str]:
    """Fallback keyword extraction using word frequency."""
    # Clean and tokenize
    text = clean_text(text.lower())
    words = re.findall(r'\b[a-zA-Z]{3,}\b', text)
    
    # Common stopwords
    stopwords_list = {
        'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
        'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before',
        'after', 'above', 'below', 'between', 'among', 'through', 'during',
        'before', 'after', 'above', 'below', 'between', 'among', 'this', 'that',
        'these', 'those', 'i', 'me', 'my', 'myself', 'we', 'our', 'ours',
        'ourselves', 'you', 'your', 'yours', 'yourself', 'yourselves', 'he',
        'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 'it', 'its',
        'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what',
        'which', 'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is',
        'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had',
        'having', 'do', 'does', 'did', 'doing', 'a', 'an', 'the', 'as', 'if',
        'each', 'how', 'when', 'where', 'why', 'all', 'any', 'both', 'each',
        'few', 'more', 'most', 'other', 'some', 'such', 'only', 'own', 'same',
        'so', 'than', 'too', 'very', 'can', 'will', 'just', 'should', 'now'
    }
    
    # Filter out stopwords and short words
    filtered_words = [word for word in words if word not in stopwords_list and len(word) > 2]
    
    # Count word frequencies
    word_freq = Counter(filtered_words)
    
    # Return most common words
    return [word for word, count in word_freq.most_common(max_keywords)]


def extract_contact_info(text: str) -> Dict[str, Optional[str]]:
    """Extract contact information from resume text."""
    contact_info = {
        'email': None,
        'phone': None,
        'linkedin': None,
        'github': None,
        'website': None
    }
    
    # Email
    email_match = re.search(r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b', text)
    if email_match:
        contact_info['email'] = email_match.group()
    
    # Phone
    phone_patterns = [
        r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',
        r'\(\d{3}\)\s?\d{3}[-.]?\d{4}',
        r'\+1[-.\s]?\d{3}[-.]?\d{3}[-.]?\d{4}'
    ]
    for pattern in phone_patterns:
        phone_match = re.search(pattern, text)
        if phone_match:
            contact_info['phone'] = phone_match.group()
            break
    
    # LinkedIn
    linkedin_match = re.search(r'linkedin\.com/in/[\w-]+', text, re.IGNORECASE)
    if linkedin_match:
        contact_info['linkedin'] = linkedin_match.group()
    
    # GitHub
    github_match = re.search(r'github\.com/[\w-]+', text, re.IGNORECASE)
    if github_match:
        contact_info['github'] = github_match.group()
    
    # Website/Portfolio
    website_match = re.search(r'https?://[\w.-]+\.[a-zA-Z]{2,}', text)
    if website_match and 'linkedin.com' not in website_match.group() and 'github.com' not in website_match.group():
        contact_info['website'] = website_match.group()
    
    return contact_info


def extract_sections(text: str) -> Dict[str, str]:
    """Extract different sections from resume text."""
    sections = {}
    
    # Common section headers
    section_patterns = {
        'summary': r'(summary|profile|objective|about).*?(?=\n\s*[A-Z][A-Z\s]*\n|$)',
        'experience': r'(experience|employment|work history).*?(?=\n\s*[A-Z][A-Z\s]*\n|$)',
        'education': r'(education|academic|qualification).*?(?=\n\s*[A-Z][A-Z\s]*\n|$)',
        'skills': r'(skills|competencies|technologies).*?(?=\n\s*[A-Z][A-Z\s]*\n|$)',
        'projects': r'(projects|portfolio).*?(?=\n\s*[A-Z][A-Z\s]*\n|$)'
    }
    
    for section_name, pattern in section_patterns.items():
        match = re.search(pattern, text, re.IGNORECASE | re.DOTALL)
        if match:
            sections[section_name] = match.group().strip()
    
    return sections


def calculate_text_similarity(text1: str, text2: str) -> float:
    """Calculate similarity between two texts using simple word overlap."""
    if not text1 or not text2:
        return 0.0
    
    # Extract keywords from both texts
    keywords1 = set(extract_keywords(text1.lower(), 50))
    keywords2 = set(extract_keywords(text2.lower(), 50))
    
    if not keywords1 or not keywords2:
        return 0.0
    
    # Calculate Jaccard similarity
    intersection = len(keywords1.intersection(keywords2))
    union = len(keywords1.union(keywords2))
    
    return intersection / union if union > 0 else 0.0


def get_word_count_stats(text: str) -> Dict[str, int]:
    """Get word count statistics for the text."""
    if not text:
        return {'words': 0, 'sentences': 0, 'paragraphs': 0, 'characters': 0}
    
    words = len(text.split())
    sentences = len(re.findall(r'[.!?]+', text))
    paragraphs = len([p for p in text.split('\n\n') if p.strip()])
    characters = len(text)
    
    return {
        'words': words,
        'sentences': sentences,
        'paragraphs': paragraphs,
        'characters': characters
    } 