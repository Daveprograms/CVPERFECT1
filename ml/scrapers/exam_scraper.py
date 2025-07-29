"""
Exam Content Scraper
Scrapes real exam questions from forums, repositories, and online sources
Falls back to existing Gemini AI when scraping is insufficient
"""

import logging
import asyncio
import aiohttp
import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from urllib.parse import quote_plus, urljoin
from bs4 import BeautifulSoup
from ..utils.text_processing import clean_text, extract_keywords

logger = logging.getLogger(__name__)


@dataclass
class ExamQuestion:
    """Real exam question data structure"""
    id: str
    question: str
    category: str
    difficulty: str
    source: str
    source_url: str
    options: List[str] = None
    correct_answer: str = None
    explanation: str = None
    tags: List[str] = None


class ExamContentScraper:
    """
    Scrapes real exam questions from various sources
    Uses AI fallback with existing Gemini integration
    """
    
    def __init__(self, gemini_service=None):
        self.session = None
        self.gemini_service = gemini_service
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
        
        # Real sources for different types of questions
        self.question_sources = {
            'technical': [
                'https://leetcode.com/problems/',
                'https://stackoverflow.com/questions/',
                'https://github.com/search?q={topic}+interview+questions',
                'https://www.hackerrank.com/domains/',
                'https://www.geeksforgeeks.org/{topic}-interview-questions/'
            ],
            'behavioral': [
                'https://www.glassdoor.com/Interview/{company}-Interview-Questions-E{id}.htm',
                'https://www.indeed.com/career-advice/interviewing/behavioral-interview-questions',
                'https://reddit.com/r/cscareerquestions/search?q={topic}+interview'
            ],
            'industry': [
                'https://www.coursera.org/learn/{topic}/quiz/',
                'https://www.edx.org/learn/{topic}',
                'https://docs.{topic}.com/tutorials/',
                'https://github.com/topics/{topic}-interview'
            ]
        }
    
    async def __aenter__(self):
        """Async context manager entry"""
        self.session = aiohttp.ClientSession(
            headers=self.headers,
            timeout=aiohttp.ClientTimeout(total=30)
        )
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        if self.session:
            await self.session.close()
    
    async def scrape_real_questions(
        self, 
        topic: str, 
        question_type: str = 'technical',
        max_questions: int = 20
    ) -> List[ExamQuestion]:
        """
        Scrape real exam questions from various sources
        """
        try:
            logger.info(f"Scraping real {question_type} questions for topic: {topic}")
            
            scraped_questions = []
            
            # Get sources for the question type
            sources = self.question_sources.get(question_type, self.question_sources['technical'])
            
            for source_template in sources[:3]:  # Limit to 3 sources per type
                try:
                    # Format source URL with topic
                    source_url = source_template.format(
                        topic=quote_plus(topic.lower().replace(' ', '-')),
                        company=topic,
                        id='123'  # Placeholder for company ID
                    )
                    
                    questions = await self._scrape_source(source_url, topic, question_type)
                    scraped_questions.extend(questions)
                    
                    if len(scraped_questions) >= max_questions:
                        break
                    
                    # Rate limiting
                    await asyncio.sleep(2)
                    
                except Exception as e:
                    logger.error(f"Failed to scrape {source_template}: {str(e)}")
                    continue
            
            # Remove duplicates
            unique_questions = self._deduplicate_questions(scraped_questions)
            
            logger.info(f"Scraped {len(unique_questions)} real questions for {topic}")
            return unique_questions[:max_questions]
            
        except Exception as e:
            logger.error(f"Real question scraping failed for {topic}: {str(e)}")
            return []
    
    async def _scrape_source(
        self, 
        source_url: str, 
        topic: str, 
        question_type: str
    ) -> List[ExamQuestion]:
        """Scrape questions from a specific source"""
        
        try:
            # Determine scraping strategy based on source
            if 'github.com' in source_url:
                return await self._scrape_github(source_url, topic, question_type)
            elif 'stackoverflow.com' in source_url:
                return await self._scrape_stackoverflow(source_url, topic, question_type)
            elif 'leetcode.com' in source_url:
                return await self._scrape_leetcode(source_url, topic, question_type)
            elif 'reddit.com' in source_url:
                return await self._scrape_reddit(source_url, topic, question_type)
            else:
                return await self._scrape_generic(source_url, topic, question_type)
                
        except Exception as e:
            logger.error(f"Source scraping failed for {source_url}: {str(e)}")
            return []
    
    async def _scrape_github(self, url: str, topic: str, question_type: str) -> List[ExamQuestion]:
        """Scrape questions from GitHub repositories"""
        
        try:
            # Search GitHub for interview question repositories
            search_url = f"https://api.github.com/search/repositories?q={topic}+interview+questions"
            
            async with self.session.get(search_url) as response:
                if response.status != 200:
                    return []
                
                data = await response.json()
                repositories = data.get('items', [])[:5]  # Top 5 repos
                
                questions = []
                for repo in repositories:
                    try:
                        # Get repository contents
                        contents_url = repo['contents_url'].replace('{+path}', '')
                        
                        async with self.session.get(contents_url) as content_response:
                            if content_response.status == 200:
                                contents = await content_response.json()
                                
                                # Look for README or question files
                                for item in contents:
                                    if item['name'].lower() in ['readme.md', 'questions.md', 'interview.md']:
                                        file_questions = await self._extract_questions_from_markdown(
                                            item['download_url'], topic, question_type, repo['html_url']
                                        )
                                        questions.extend(file_questions)
                        
                        if len(questions) >= 10:  # Limit per repo
                            break
                            
                    except Exception as e:
                        logger.error(f"Failed to process GitHub repo {repo['name']}: {str(e)}")
                        continue
                
                return questions
                
        except Exception as e:
            logger.error(f"GitHub scraping failed: {str(e)}")
            return []
    
    async def _scrape_stackoverflow(self, url: str, topic: str, question_type: str) -> List[ExamQuestion]:
        """Scrape questions from Stack Overflow"""
        
        try:
            # Use Stack Overflow API for better results
            api_url = f"https://api.stackexchange.com/2.3/search/advanced"
            params = {
                'order': 'desc',
                'sort': 'votes',
                'q': f"{topic} interview questions",
                'site': 'stackoverflow',
                'pagesize': 10
            }
            
            async with self.session.get(api_url, params=params) as response:
                if response.status != 200:
                    return []
                
                data = await response.json()
                stackoverflow_questions = data.get('items', [])
                
                questions = []
                for so_question in stackoverflow_questions:
                    try:
                        question = ExamQuestion(
                            id=f"so_{so_question['question_id']}",
                            question=so_question['title'],
                            category=question_type,
                            difficulty='medium',
                            source='Stack Overflow',
                            source_url=so_question['link'],
                            tags=so_question.get('tags', [])
                        )
                        questions.append(question)
                        
                    except Exception as e:
                        logger.error(f"Failed to process SO question: {str(e)}")
                        continue
                
                return questions
                
        except Exception as e:
            logger.error(f"Stack Overflow scraping failed: {str(e)}")
            return []
    
    async def _scrape_leetcode(self, url: str, topic: str, question_type: str) -> List[ExamQuestion]:
        """Scrape questions from LeetCode (public data only)"""
        
        try:
            # LeetCode has rate limiting, so we'll use a conservative approach
            search_terms = topic.lower().split()
            questions = []
            
            # Common LeetCode problem patterns related to the topic
            problem_patterns = {
                'python': ['two-sum', 'reverse-linked-list', 'valid-parentheses'],
                'javascript': ['two-sum', 'palindrome-number', 'roman-to-integer'],
                'algorithm': ['binary-search', 'merge-sorted-arrays', 'maximum-subarray'],
                'data-structure': ['implement-stack', 'binary-tree', 'linked-list-cycle']
            }
            
            # Get relevant problems based on topic
            relevant_problems = []
            for term in search_terms:
                if term in problem_patterns:
                    relevant_problems.extend(problem_patterns[term])
            
            if not relevant_problems:
                relevant_problems = problem_patterns['algorithm']  # Default
            
            for problem_slug in relevant_problems[:5]:
                try:
                    question = ExamQuestion(
                        id=f"leetcode_{problem_slug}",
                        question=f"Solve the {problem_slug.replace('-', ' ').title()} problem",
                        category='technical',
                        difficulty='medium',
                        source='LeetCode',
                        source_url=f"https://leetcode.com/problems/{problem_slug}/",
                        tags=[topic.lower()]
                    )
                    questions.append(question)
                    
                except Exception as e:
                    logger.error(f"Failed to create LeetCode question: {str(e)}")
                    continue
            
            return questions
            
        except Exception as e:
            logger.error(f"LeetCode scraping failed: {str(e)}")
            return []
    
    async def _scrape_reddit(self, url: str, topic: str, question_type: str) -> List[ExamQuestion]:
        """Scrape questions from Reddit (using public RSS)"""
        
        try:
            # Use Reddit RSS feed for public access
            search_url = f"https://www.reddit.com/r/cscareerquestions/search.rss?q={topic}+interview&sort=top&t=year"
            
            async with self.session.get(search_url) as response:
                if response.status != 200:
                    return []
                
                content = await response.text()
                
                # Parse RSS/XML content
                soup = BeautifulSoup(content, 'xml')
                entries = soup.find_all('entry')
                
                questions = []
                for entry in entries[:10]:  # Limit to 10 entries
                    try:
                        title = entry.find('title').text
                        link = entry.find('link')['href']
                        content_elem = entry.find('content')
                        content_text = content_elem.text if content_elem else ""
                        
                        # Extract question if it looks like an interview question
                        if any(keyword in title.lower() for keyword in ['interview', 'question', 'ask', 'how to']):
                            question = ExamQuestion(
                                id=f"reddit_{hash(title)}",
                                question=title,
                                category=question_type,
                                difficulty='varies',
                                source='Reddit',
                                source_url=link,
                                explanation=clean_text(content_text)[:200] if content_text else None
                            )
                            questions.append(question)
                        
                    except Exception as e:
                        logger.error(f"Failed to process Reddit entry: {str(e)}")
                        continue
                
                return questions
                
        except Exception as e:
            logger.error(f"Reddit scraping failed: {str(e)}")
            return []
    
    async def _scrape_generic(self, url: str, topic: str, question_type: str) -> List[ExamQuestion]:
        """Generic scraping for other sources"""
        
        try:
            async with self.session.get(url) as response:
                if response.status != 200:
                    return []
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Look for question patterns in text
                text = soup.get_text()
                questions = self._extract_questions_from_text(text, topic, question_type, url)
                
                return questions
                
        except Exception as e:
            logger.error(f"Generic scraping failed for {url}: {str(e)}")
            return []
    
    async def _extract_questions_from_markdown(
        self, 
        file_url: str, 
        topic: str, 
        question_type: str, 
        source_url: str
    ) -> List[ExamQuestion]:
        """Extract questions from markdown files"""
        
        try:
            async with self.session.get(file_url) as response:
                if response.status != 200:
                    return []
                
                markdown_content = await response.text()
                
                # Parse markdown for questions
                questions = []
                lines = markdown_content.split('\n')
                
                current_question = None
                current_section = None
                
                for line in lines:
                    line = line.strip()
                    
                    # Detect question patterns
                    if re.match(r'^#+\s+', line) or line.endswith('?'):
                        if current_question:
                            questions.append(current_question)
                        
                        question_text = re.sub(r'^#+\s+', '', line)
                        
                        current_question = ExamQuestion(
                            id=f"github_{hash(question_text)}",
                            question=question_text,
                            category=question_type,
                            difficulty='medium',
                            source='GitHub',
                            source_url=source_url
                        )
                    
                    elif current_question and line.startswith('- ') and '?' in line:
                        # This might be a sub-question or option
                        if not current_question.options:
                            current_question.options = []
                        current_question.options.append(line[2:])
                
                # Add the last question
                if current_question:
                    questions.append(current_question)
                
                return questions[:10]  # Limit per file
                
        except Exception as e:
            logger.error(f"Markdown extraction failed: {str(e)}")
            return []
    
    def _extract_questions_from_text(
        self, 
        text: str, 
        topic: str, 
        question_type: str, 
        source_url: str
    ) -> List[ExamQuestion]:
        """Extract questions from plain text"""
        
        questions = []
        
        # Question patterns
        question_patterns = [
            r'(?:Q\d*[:\.]?\s*)?([^?\n]{10,100}\?)',
            r'(?:Question\s*\d*[:\.]?\s*)([^?\n]{10,100}\?)',
            r'(?:^\d+\.\s*)([^?\n]{10,100}\?)',
        ]
        
        question_id = 0
        for pattern in question_patterns:
            matches = re.finditer(pattern, text, re.MULTILINE)
            
            for match in matches:
                question_text = match.group(1).strip()
                
                if len(question_text) > 15 and topic.lower() in question_text.lower():
                    question_id += 1
                    
                    question = ExamQuestion(
                        id=f"scraped_{question_id}_{hash(question_text)}",
                        question=question_text,
                        category=question_type,
                        difficulty='medium',
                        source='Web Scrape',
                        source_url=source_url
                    )
                    questions.append(question)
                
                if len(questions) >= 5:  # Limit per text source
                    break
        
        return questions
    
    def _deduplicate_questions(self, questions: List[ExamQuestion]) -> List[ExamQuestion]:
        """Remove duplicate questions based on similarity"""
        
        unique_questions = []
        seen_questions = set()
        
        for question in questions:
            # Create a normalized version for comparison
            normalized = re.sub(r'\W+', ' ', question.question.lower()).strip()
            
            if normalized not in seen_questions and len(normalized) > 10:
                seen_questions.add(normalized)
                unique_questions.append(question)
        
        return unique_questions
    
    async def generate_ai_fallback(
        self, 
        topic: str, 
        question_type: str = 'technical',
        num_questions: int = 10,
        difficulty: str = 'medium'
    ) -> List[ExamQuestion]:
        """
        Generate questions using existing Gemini integration as fallback
        """
        if not self.gemini_service:
            logger.error("No Gemini service available for AI fallback")
            return []
        
        try:
            logger.info(f"Generating AI fallback questions for {topic}")
            
            # Create prompt for question generation
            prompt = f"""
            Generate {num_questions} {question_type} {difficulty} level interview questions about {topic}.
            
            Provide a JSON response with this structure:
            {{
                "questions": [
                    {{
                        "question": "question_text",
                        "category": "{question_type}",
                        "difficulty": "{difficulty}",
                        "options": ["option1", "option2", "option3", "option4"],
                        "correct_answer": "correct_option",
                        "explanation": "explanation_text",
                        "tags": ["tag1", "tag2"]
                    }}
                ]
            }}
            
            Make questions practical, relevant, and interview-appropriate.
            """
            
            response = self.gemini_service.model.generate_content(prompt)
            response_text = response.text.strip()
            
            # Parse JSON response
            import json
            json_match = re.search(r'\{.*\}', response_text, re.DOTALL)
            
            if json_match:
                data = json.loads(json_match.group(0))
                ai_questions = []
                
                for i, q_data in enumerate(data.get('questions', [])):
                    question = ExamQuestion(
                        id=f"ai_generated_{topic}_{i}",
                        question=q_data.get('question', ''),
                        category=q_data.get('category', question_type),
                        difficulty=q_data.get('difficulty', difficulty),
                        source='AI Generated (Gemini)',
                        source_url='',
                        options=q_data.get('options'),
                        correct_answer=q_data.get('correct_answer'),
                        explanation=q_data.get('explanation'),
                        tags=q_data.get('tags', [topic])
                    )
                    ai_questions.append(question)
                
                logger.info(f"Generated {len(ai_questions)} AI fallback questions")
                return ai_questions
            else:
                logger.error("Failed to parse AI response")
                return []
                
        except Exception as e:
            logger.error(f"AI fallback generation failed: {str(e)}")
            return []
    
    async def get_exam_questions(
        self, 
        topic: str, 
        question_type: str = 'technical',
        max_questions: int = 15,
        min_scraped: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Get exam questions: scrape real sources first, then AI fallback if needed
        """
        try:
            # First, try to scrape real questions
            scraped_questions = await self.scrape_real_questions(topic, question_type, max_questions)
            
            # If we don't have enough real questions, use AI fallback
            if len(scraped_questions) < min_scraped:
                needed_questions = max_questions - len(scraped_questions)
                ai_questions = await self.generate_ai_fallback(
                    topic, question_type, needed_questions
                )
                scraped_questions.extend(ai_questions)
            
            # Convert to dictionaries
            questions_data = []
            for q in scraped_questions[:max_questions]:
                questions_data.append({
                    'id': q.id,
                    'question': q.question,
                    'category': q.category,
                    'difficulty': q.difficulty,
                    'source': q.source,
                    'source_url': q.source_url,
                    'options': q.options,
                    'correct_answer': q.correct_answer,
                    'explanation': q.explanation,
                    'tags': q.tags or [topic]
                })
            
            logger.info(f"Retrieved {len(questions_data)} total questions for {topic}")
            return questions_data
            
        except Exception as e:
            logger.error(f"Exam question retrieval failed: {str(e)}")
            return []


# Example usage
async def get_practice_questions(topic: str, question_type: str = 'technical') -> List[Dict[str, Any]]:
    """
    Get practice questions for a topic
    """
    from backend.app.services.gemini_service import gemini_service
    
    async with ExamContentScraper(gemini_service) as scraper:
        questions = await scraper.get_exam_questions(topic, question_type)
        return questions 