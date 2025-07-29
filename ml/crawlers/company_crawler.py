"""
Company Career Page Crawler
Crawls real company career pages and filters jobs using ML
"""

import logging
import asyncio
import aiohttp
from typing import List, Dict, Any, Optional
from dataclasses import dataclass
from urllib.parse import urljoin, urlparse
import re
from bs4 import BeautifulSoup
from ..utils.text_processing import clean_text, extract_keywords

logger = logging.getLogger(__name__)


@dataclass
class JobPosting:
    """Real job posting data structure"""
    id: str
    title: str
    company: str
    location: str
    description: str
    requirements: List[str]
    url: str
    posted_date: Optional[str] = None
    salary_range: Optional[str] = None
    employment_type: Optional[str] = None
    department: Optional[str] = None
    experience_level: Optional[str] = None


class CompanyCrawler:
    """
    Crawls real company career pages for job postings
    Processes actual job data, not mock data
    """
    
    def __init__(self, gemini_service=None):
        self.session = None
        self.gemini_service = gemini_service
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
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
    
    async def crawl_company_careers(self, company_url: str) -> List[JobPosting]:
        """
        Crawl real company career pages for job postings
        """
        try:
            logger.info(f"Starting crawl of company careers: {company_url}")
            
            # Detect career page patterns
            career_urls = await self._find_career_pages(company_url)
            
            all_jobs = []
            for career_url in career_urls:
                try:
                    jobs = await self._crawl_career_page(career_url)
                    all_jobs.extend(jobs)
                    
                    # Respect rate limiting
                    await asyncio.sleep(1)
                    
                except Exception as e:
                    logger.error(f"Failed to crawl {career_url}: {str(e)}")
                    continue
            
            logger.info(f"Crawled {len(all_jobs)} job postings from {company_url}")
            return all_jobs
            
        except Exception as e:
            logger.error(f"Company crawl failed for {company_url}: {str(e)}")
            return []
    
    async def _find_career_pages(self, company_url: str) -> List[str]:
        """Find career/jobs pages on company website"""
        
        try:
            async with self.session.get(company_url) as response:
                if response.status != 200:
                    logger.warning(f"Failed to access {company_url}: {response.status}")
                    return []
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Common career page patterns
                career_patterns = [
                    'careers', 'jobs', 'employment', 'opportunities', 
                    'join-us', 'work-with-us', 'hiring', 'positions'
                ]
                
                career_urls = set()
                
                # Find links containing career-related keywords
                for link in soup.find_all('a', href=True):
                    href = link['href'].lower()
                    link_text = link.get_text().lower()
                    
                    # Check if link or text contains career keywords
                    if any(pattern in href or pattern in link_text for pattern in career_patterns):
                        full_url = urljoin(company_url, link['href'])
                        career_urls.add(full_url)
                
                # Common career page URL patterns
                base_domain = urlparse(company_url).netloc
                common_career_urls = [
                    f"https://{base_domain}/careers",
                    f"https://{base_domain}/jobs",
                    f"https://{base_domain}/employment",
                    f"https://{base_domain}/join-us",
                    f"https://careers.{base_domain}",
                    f"https://jobs.{base_domain}"
                ]
                
                for url in common_career_urls:
                    career_urls.add(url)
                
                logger.info(f"Found {len(career_urls)} potential career pages for {company_url}")
                return list(career_urls)
                
        except Exception as e:
            logger.error(f"Failed to find career pages for {company_url}: {str(e)}")
            return []
    
    async def _crawl_career_page(self, career_url: str) -> List[JobPosting]:
        """Crawl individual career page for job listings"""
        
        try:
            async with self.session.get(career_url) as response:
                if response.status != 200:
                    return []
                
                html = await response.text()
                soup = BeautifulSoup(html, 'html.parser')
                
                # Extract company name from domain
                company_name = self._extract_company_name(career_url)
                
                # Try different job listing selectors
                job_selectors = [
                    '.job-listing', '.job-item', '.position', '.opening',
                    '[class*="job"]', '[class*="position"]', '[class*="career"]',
                    'article', '.card', '.listing'
                ]
                
                jobs = []
                for selector in job_selectors:
                    job_elements = soup.select(selector)
                    
                    if job_elements:
                        logger.info(f"Found {len(job_elements)} job elements with selector '{selector}'")
                        
                        for element in job_elements:
                            job = await self._extract_job_from_element(element, company_name, career_url)
                            if job:
                                jobs.append(job)
                        
                        # If we found jobs with this selector, use them
                        if jobs:
                            break
                
                # If no structured jobs found, try extracting from text
                if not jobs:
                    jobs = await self._extract_jobs_from_text(soup, company_name, career_url)
                
                logger.info(f"Extracted {len(jobs)} jobs from {career_url}")
                return jobs
                
        except Exception as e:
            logger.error(f"Failed to crawl career page {career_url}: {str(e)}")
            return []
    
    async def _extract_job_from_element(
        self, 
        element, 
        company_name: str, 
        base_url: str
    ) -> Optional[JobPosting]:
        """Extract job posting from HTML element"""
        
        try:
            # Extract job title
            title_selectors = ['h1', 'h2', 'h3', '.title', '.job-title', '[class*="title"]']
            title = None
            for selector in title_selectors:
                title_elem = element.select_one(selector)
                if title_elem:
                    title = title_elem.get_text().strip()
                    break
            
            if not title:
                return None
            
            # Extract location
            location_patterns = [
                r'location[:\-\s]*([^,\n]+)',
                r'([A-Za-z\s]+,\s*[A-Z]{2,})',  # City, State pattern
                r'(Remote|On-site|Hybrid)',
            ]
            
            location = "Not specified"
            element_text = element.get_text()
            for pattern in location_patterns:
                match = re.search(pattern, element_text, re.IGNORECASE)
                if match:
                    location = match.group(1).strip()
                    break
            
            # Extract description
            description_elem = element.select_one('.description, .summary, .content, p')
            description = description_elem.get_text().strip() if description_elem else element.get_text()[:500]
            
            # Extract requirements
            requirements = self._extract_requirements_from_text(element_text)
            
            # Extract job URL
            link_elem = element.select_one('a[href]')
            job_url = urljoin(base_url, link_elem['href']) if link_elem else base_url
            
            # Generate unique ID
            job_id = f"{company_name}_{hash(title + location)}".replace(' ', '_').lower()
            
            job = JobPosting(
                id=job_id,
                title=title,
                company=company_name,
                location=location,
                description=clean_text(description),
                requirements=requirements,
                url=job_url
            )
            
            return job
            
        except Exception as e:
            logger.error(f"Failed to extract job from element: {str(e)}")
            return None
    
    async def _extract_jobs_from_text(
        self, 
        soup: BeautifulSoup, 
        company_name: str, 
        career_url: str
    ) -> List[JobPosting]:
        """Extract jobs from page text when no structured data is available"""
        
        try:
            # Get all text content
            page_text = soup.get_text()
            
            # Look for job title patterns
            job_title_patterns = [
                r'(?:position|role|job)[:*\s]*([^\n,]+(?:engineer|developer|manager|analyst|specialist|coordinator|director|lead|senior|junior))',
                r'((?:senior|junior|lead|principal)\s+[^\n,]+)',
                r'([A-Z][a-z]+\s+(?:Engineer|Developer|Manager|Analyst|Specialist|Coordinator|Director))',
            ]
            
            found_jobs = []
            job_titles = set()
            
            for pattern in job_title_patterns:
                matches = re.finditer(pattern, page_text, re.IGNORECASE)
                for match in matches:
                    title = match.group(1).strip()
                    
                    # Skip if already found or too generic
                    if title.lower() in job_titles or len(title) < 5:
                        continue
                    
                    job_titles.add(title.lower())
                    
                    # Extract surrounding context for description
                    start = max(0, match.start() - 200)
                    end = min(len(page_text), match.end() + 300)
                    context = page_text[start:end]
                    
                    # Generate job posting
                    job_id = f"{company_name}_{hash(title)}".replace(' ', '_').lower()
                    
                    job = JobPosting(
                        id=job_id,
                        title=title,
                        company=company_name,
                        location="See job posting",
                        description=clean_text(context),
                        requirements=self._extract_requirements_from_text(context),
                        url=career_url
                    )
                    
                    found_jobs.append(job)
            
            return found_jobs[:10]  # Limit to 10 jobs per page
            
        except Exception as e:
            logger.error(f"Failed to extract jobs from text: {str(e)}")
            return []
    
    def _extract_requirements_from_text(self, text: str) -> List[str]:
        """Extract job requirements from text"""
        
        requirements = []
        
        # Common requirement patterns
        requirement_patterns = [
            r'(?:require[sd]?|must have|should have|looking for)[:\s]*([^\n.]+)',
            r'(?:experience with|knowledge of|proficiency in)[:\s]*([^\n.]+)',
            r'(?:skills?)[:\s]*([^\n.]+)',
            r'([0-9]+\+?\s*years?\s+(?:of\s+)?experience)',
        ]
        
        for pattern in requirement_patterns:
            matches = re.finditer(pattern, text, re.IGNORECASE)
            for match in matches:
                req = match.group(1).strip()
                if len(req) > 10 and len(req) < 100:  # Reasonable length
                    requirements.append(req)
        
        # Extract technology keywords
        tech_keywords = extract_keywords(text.lower(), max_keywords=20)
        tech_requirements = [kw for kw in tech_keywords if self._is_tech_keyword(kw)]
        requirements.extend(tech_requirements)
        
        return list(set(requirements))[:10]  # Remove duplicates and limit
    
    def _is_tech_keyword(self, keyword: str) -> bool:
        """Check if keyword is technology-related"""
        
        tech_patterns = [
            r'(?:python|java|javascript|react|angular|vue|node)',
            r'(?:sql|database|mysql|postgresql|mongodb)',
            r'(?:aws|azure|cloud|docker|kubernetes)',
            r'(?:api|rest|graphql|microservices)',
            r'(?:git|github|ci/cd|devops)',
            r'(?:machine learning|ai|data science|analytics)',
        ]
        
        return any(re.search(pattern, keyword, re.IGNORECASE) for pattern in tech_patterns)
    
    def _extract_company_name(self, url: str) -> str:
        """Extract company name from URL"""
        
        domain = urlparse(url).netloc
        
        # Remove common prefixes
        domain = re.sub(r'^(www\.|careers\.|jobs\.)', '', domain)
        
        # Extract main domain part
        parts = domain.split('.')
        if len(parts) >= 2:
            company_name = parts[0]
        else:
            company_name = domain
        
        # Capitalize and clean
        company_name = company_name.replace('-', ' ').replace('_', ' ').title()
        
        return company_name
    
    async def filter_jobs_with_ml(
        self, 
        jobs: List[JobPosting], 
        user_resume: str,
        target_skills: List[str] = None
    ) -> List[Dict[str, Any]]:
        """
        Filter and rank jobs using existing Gemini integration
        """
        if not self.gemini_service:
            logger.warning("No Gemini service available for ML filtering")
            return [self._job_to_dict(job) for job in jobs]
        
        try:
            filtered_jobs = []
            
            for job in jobs:
                try:
                    # Analyze job compatibility using existing Gemini
                    compatibility = await self.gemini_service.analyze_job_compatibility(
                        user_resume, 
                        f"Job Title: {job.title}\nCompany: {job.company}\nLocation: {job.location}\n"
                        f"Description: {job.description}\nRequirements: {', '.join(job.requirements)}"
                    )
                    
                    job_dict = self._job_to_dict(job)
                    job_dict['ml_analysis'] = {
                        'compatibility_score': compatibility.get('compatibility_score', 0),
                        'matching_skills': compatibility.get('matching_skills', []),
                        'missing_skills': compatibility.get('missing_skills', []),
                        'recommendation': compatibility.get('recommendation', 'review'),
                        'key_strengths': compatibility.get('key_strengths', [])
                    }
                    
                    filtered_jobs.append(job_dict)
                    
                    # Rate limiting for API calls
                    await asyncio.sleep(0.5)
                    
                except Exception as e:
                    logger.error(f"ML filtering failed for job {job.title}: {str(e)}")
                    # Include job without ML analysis
                    job_dict = self._job_to_dict(job)
                    job_dict['ml_analysis'] = {'compatibility_score': 50, 'error': 'Analysis unavailable'}
                    filtered_jobs.append(job_dict)
            
            # Sort by compatibility score
            filtered_jobs.sort(key=lambda x: x['ml_analysis'].get('compatibility_score', 0), reverse=True)
            
            logger.info(f"ML filtered and ranked {len(filtered_jobs)} jobs")
            return filtered_jobs
            
        except Exception as e:
            logger.error(f"ML job filtering failed: {str(e)}")
            return [self._job_to_dict(job) for job in jobs]
    
    def _job_to_dict(self, job: JobPosting) -> Dict[str, Any]:
        """Convert JobPosting to dictionary"""
        return {
            'id': job.id,
            'title': job.title,
            'company': job.company,
            'location': job.location,
            'description': job.description,
            'requirements': job.requirements,
            'url': job.url,
            'posted_date': job.posted_date,
            'salary_range': job.salary_range,
            'employment_type': job.employment_type,
            'department': job.department,
            'experience_level': job.experience_level
        }


# Example usage
async def crawl_company_jobs(company_url: str, user_resume: str = None) -> List[Dict[str, Any]]:
    """
    Crawl company jobs and optionally filter with ML
    """
    from backend.app.services.gemini_service import gemini_service
    
    async with CompanyCrawler(gemini_service) as crawler:
        # Crawl real job postings
        jobs = await crawler.crawl_company_careers(company_url)
        
        if user_resume and jobs:
            # Filter with ML using existing Gemini integration
            filtered_jobs = await crawler.filter_jobs_with_ml(jobs, user_resume)
            return filtered_jobs
        else:
            return [crawler._job_to_dict(job) for job in jobs] 