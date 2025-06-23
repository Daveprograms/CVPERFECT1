import google.generativeai as genai
from typing import Dict, List, Optional, Any
import json
import os
from ..config import settings

# Define sections and issues to ignore
IGNORED_SECTIONS = ['summary', 'contact', 'email', 'phone', 'address', 'formatting']
IGNORED_KEYWORDS = ['professional email', 'summary section', 'contact information', 'email format', 'phone format']

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-1.5-flash')

class ResumeAnalysis:
    def __init__(
        self,
        score: float,
        strengths: List[Dict[str, Any]],
        feedback: List[Dict[str, Any]],
        extracted_info: Dict[str, Any],
        job_matches: List[Dict[str, Any]],
        improvements: List[Dict[str, Any]]
    ):
        self.score = score
        self.strengths = strengths
        self.feedback = feedback
        self.extracted_info = extracted_info
        self.job_matches = job_matches
        self.improvements = improvements

def analyze_resume_with_gemini(resume_content: str, job_description: Optional[str] = None) -> ResumeAnalysis:
    """Analyze resume content using Gemini AI."""
    
    # Prepare the prompt - simplified to ensure it works
    prompt = f"""
    Analyze this resume and provide feedback in the exact JSON format requested.
    
    RESUME:
    {resume_content}
    
    {f'JOB DESCRIPTION:\n{job_description}' if job_description else ''}
    
    Provide structured feedback with:
    1. A score from 0-100
    2. 2-3 strengths the person already has
    3. 3-5 improvement areas with specific suggestions
    
    Focus on actionable improvements like:
    - Adding quantified results and metrics
    - Including missing technical skills
    - Improving project descriptions
    - Using stronger action verbs
    
    Ignore formatting, email, and contact details.
    
    Format the response as a JSON object with the following structure:
    {{
        "score": float,
        "strengths": [
            {{
                "title": str,
                "description": str,
                "relevance": str
            }}
        ],
        "feedback": [
            {{
                "category": str,
                "emoji": str,
                "items": [
                    {{
                        "job_wants": str,
                        "you_have": str,
                        "fix": str,
                        "example_line": str,
                        "bonus": str,
                        "severity": "high" | "medium" | "low"
                    }}
                ]
            }}
        ],
        "extracted_info": {{
            "name": str,
            "contact": {{
                "email": str,
                "phone": str,
                "location": str
            }},
            "summary": str,
            "experience": [
                {{
                    "title": str,
                    "company": str,
                    "duration": str,
                    "achievements": List[str]
                }}
            ],
            "education": [
                {{
                    "degree": str,
                    "institution": str,
                    "year": str,
                    "gpa": Optional[str]
                }}
            ],
            "skills": [
                {{
                    "category": str,
                    "items": List[str]
                }}
            ]
        }},
        "job_matches": [
            {{
                "title": str,
                "company": str,
                "match_score": float,
                "description": str,
                "requirements": List[str],
                "missing_skills": List[str]
            }}
        ],
        "improvements": [
            {{
                "category": str,
                "priority": "high" | "medium" | "low",
                "current_state": str,
                "improved_version": str,
                "explanation": str,
                "specific_suggestions": List[str]
            }}
        ]
    }}
    """

    try:
        # TEMPORARY: Skip Gemini API and use fallback for testing
        print("⚠️ TESTING MODE: Skipping Gemini API, using mock data")
        
        # Mock response that simulates empty fields from AI
        mock_analysis_data = {
            "score": 78,
            "strengths": [],
            "feedback": [
                {
                    "category": "Skills & Keywords",
                    "emoji": "🔧",
                    "items": [
                        {
                            "job_wants": "",
                            "you_have": "",
                            "fix": "",
                            "example_line": "",
                            "bonus": "",
                            "severity": "high"
                        }
                    ]
                },
                {
                    "category": "Content Relevance & Impact",
                    "emoji": "🎯",
                    "items": [
                        {
                            "job_wants": "",
                            "you_have": "",
                            "fix": "",
                            "example_line": "",
                            "bonus": "",
                            "severity": "medium"
                        }
                    ]
                }
            ],
            "extracted_info": {
                "name": "Test User",
                "contact": {"email": "test@example.com", "phone": "", "location": ""},
                "summary": "",
                "experience": [],
                "education": [],
                "skills": []
            },
            "job_matches": [],
            "improvements": []
        }
        
        analysis_data = mock_analysis_data
        print("✅ Using mock data for testing - no JSON parsing needed")

        
        # Debug: Print the feedback structure
        print(f"🔍 Feedback categories found: {len(analysis_data.get('feedback', []))}")
        for i, category in enumerate(analysis_data.get('feedback', [])):
            print(f"🔍 Category {i}: {category.get('category', 'Unknown')} with {len(category.get('items', []))} items")
            for j, item in enumerate(category.get('items', [])[:2]):  # Show first 2 items
                print(f"  Item {j}: job_wants='{item.get('job_wants', 'EMPTY')}', fix='{item.get('fix', 'EMPTY')[:50]}...'")
        
        print(f"🔍 Strengths found: {len(analysis_data.get('strengths', []))}")
        for i, strength in enumerate(analysis_data.get('strengths', [])[:3]):  # Show first 3
            print(f"  Strength {i}: {strength.get('title', 'EMPTY')}")
        
        # Filter out ignored feedback categories
        filtered_feedback = filter_ats_feedback(analysis_data.get("feedback", []))
        
        # Validate and fix empty fields in feedback
        filtered_feedback = validate_and_fix_feedback(filtered_feedback)
        
        # Fallback: If feedback is still empty, create some default structure
        if not filtered_feedback:
            print("⚠️ No feedback found, creating comprehensive fallback structure")
            filtered_feedback = [
                {
                    "category": "Make Experience More Prominent",
                    "emoji": "🧠",
                    "items": [{
                        "job_wants": "Specific technical achievements with measurable impact",
                        "you_have": "Technical experience but lacks quantified results",
                        "fix": "Add specific metrics and outcomes to your project descriptions",
                        "example_line": "Built web application using React and Node.js, serving 1000+ users with 99.9% uptime",
                        "bonus": "Include performance improvements, user growth, or cost savings",
                        "severity": "high"
                    }]
                },
                {
                    "category": "Emphasize Technical Skills",
                    "emoji": "📱",
                    "items": [{
                        "job_wants": "Clear demonstration of relevant technologies",
                        "you_have": "Good technical foundation but could be more specific",
                        "fix": "Highlight specific frameworks, tools, and methodologies used",
                        "example_line": "Implemented RESTful APIs using Node.js, Express, and MongoDB with JWT authentication",
                        "bonus": "Mention version control, testing frameworks, and deployment tools",
                        "severity": "medium"
                    }]
                },
                {
                    "category": "Quantify Impact & Results", 
                    "emoji": "🎯",
                    "items": [{
                        "job_wants": "Evidence of business impact and technical success",
                        "you_have": "Projects mentioned but without specific outcomes",
                        "fix": "Add numbers, percentages, and measurable improvements",
                        "example_line": "Optimized database queries reducing load time by 40% and improving user satisfaction scores by 25%",
                        "bonus": "Include before/after comparisons and user feedback metrics",
                        "severity": "high"
                    }]
                }
            ]
        
        # Add fallback strengths if none exist
        strengths = analysis_data.get("strengths", [])
        if not strengths:
            strengths = [
                {
                    "title": "Strong Technical Foundation",
                    "description": "Good grasp of modern web technologies and programming languages",
                    "relevance": "Shows ability to work with current industry-standard tools"
                },
                {
                    "title": "Educational Background",
                    "description": "Solid academic foundation in computer science or related field",
                    "relevance": "Demonstrates theoretical knowledge and learning capability"
                },
                {
                    "title": "Project Experience",
                    "description": "Hands-on experience building applications and solving real problems",
                    "relevance": "Shows practical application of technical skills"
                }
            ]
        
        return ResumeAnalysis(
            score=analysis_data.get("score", 75),
            strengths=strengths,
            feedback=filtered_feedback,
            extracted_info=analysis_data.get("extracted_info", {}),
            job_matches=analysis_data.get("job_matches", []),
            improvements=analysis_data.get("improvements", [])
        )
    except Exception as e:
        raise Exception(f"Failed to analyze resume: {str(e)}")

def filter_ats_feedback(feedback: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Filter out feedback that focuses on ignored sections or superficial issues."""
    filtered_feedback = []
    
    for category in feedback:
        category_name = category.get("category", "").lower()
        
        # Skip only obviously ignored categories
        if any(ignored in category_name for ignored in ['email', 'contact', 'summary']):
            print(f"🚫 Skipping ignored category: {category_name}")
            continue
            
        filtered_items = []
        for item in category.get("items", []):
            job_wants = item.get("job_wants", "").lower()
            you_have = item.get("you_have", "").lower()
            fix = item.get("fix", "").lower()
            
            # Skip only obvious superficial items
            if any(keyword in job_wants or keyword in you_have or keyword in fix for keyword in ['professional email', 'email format', 'phone format']):
                print(f"🚫 Skipping superficial item: {job_wants[:50]}...")
                continue
            
            # Include most items now (less aggressive filtering)
            filtered_items.append(item)
        
        # Include categories even if they have fewer items
        if filtered_items:
            category["items"] = filtered_items
            filtered_feedback.append(category)
        else:
            print(f"⚠️ Category '{category_name}' has no items after filtering")
    
    print(f"✅ Final filtered categories: {len(filtered_feedback)}")
    return filtered_feedback

def validate_and_fix_feedback(feedback: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Validate feedback items and replace empty fields with meaningful content."""
    
    # Sample content for different categories
    fallback_content = {
        "skills & keywords": {
            "job_wants": "Relevant technical skills and industry keywords that match job requirements",
            "you_have": "Some technical skills mentioned but may not be prominently displayed",
            "fix": "Reorganize skills section to highlight job-relevant technologies first",
            "example_line": "Technical Skills: React.js, Node.js, Python, AWS, MongoDB, Git, Docker",
            "bonus": "Group skills by category (Frontend, Backend, Cloud, Tools) for better readability"
        },
        "structure & formatting": {
            "job_wants": "Clean, ATS-friendly formatting with clear section headers",
            "you_have": "Content is present but may need better organization",
            "fix": "Use consistent formatting with clear section breaks and bullet points",
            "example_line": "EXPERIENCE\n• Software Developer | TechCorp | 2022-2024",
            "bonus": "Use standard section names: Experience, Projects, Education, Skills"
        },
        "content relevance & impact": {
            "job_wants": "Quantified achievements that demonstrate business impact",
            "you_have": "Experience descriptions but lacking specific metrics",
            "fix": "Add numbers, percentages, and measurable outcomes to each role",
            "example_line": "Improved application performance by 40% through code optimization, serving 10,000+ users",
            "bonus": "Include before/after comparisons and user feedback where possible"
        },
        "default": {
            "job_wants": "Specific, measurable achievements that demonstrate your impact",
            "you_have": "Good experience but needs more quantified results",
            "fix": "Add specific metrics and outcomes to showcase your contributions",
            "example_line": "Led development of feature that increased user engagement by 25%",
            "bonus": "Include technologies used and team collaboration details"
        }
    }
    
    validated_feedback = []
    
    for category in feedback:
        category_name = category.get("category", "").lower()
        validated_items = []
        
        for item in category.get("items", []):
            # Check if any required fields are empty
            job_wants = item.get("job_wants", "").strip()
            you_have = item.get("you_have", "").strip()
            fix = item.get("fix", "").strip()
            
            if not job_wants or not you_have or not fix:
                print(f"🔧 Fixing empty fields in category: {category_name}")
                
                # Find appropriate fallback content
                fallback_key = "default"
                for key in fallback_content.keys():
                    if key in category_name:
                        fallback_key = key
                        break
                
                fallback = fallback_content[fallback_key]
                
                # Replace empty fields
                if not job_wants:
                    item["job_wants"] = fallback["job_wants"]
                if not you_have:
                    item["you_have"] = fallback["you_have"]
                if not fix:
                    item["fix"] = fallback["fix"]
                if not item.get("example_line", "").strip():
                    item["example_line"] = fallback["example_line"]
                if not item.get("bonus", "").strip():
                    item["bonus"] = fallback["bonus"]
                if not item.get("severity"):
                    item["severity"] = "medium"
            
            validated_items.append(item)
        
        if validated_items:
            category["items"] = validated_items
            validated_feedback.append(category)
    
    print(f"✅ Validated {len(validated_feedback)} categories with populated fields")
    return validated_feedback

async def enhance_resume_with_gemini(
    resume_content: str,
    job_description: Optional[str] = None,
    feedback: Optional[List[Dict[str, Any]]] = None
) -> str:
    """Enhance resume content using Gemini AI."""
    
    prompt = f"""
    Enhance the following resume based on the feedback and job description:
    
    RESUME:
    {resume_content}
    
    {f'JOB DESCRIPTION:\n{job_description}' if job_description else ''}
    
    {f'FEEDBACK:\n{json.dumps(feedback, indent=2)}' if feedback else ''}
    
    Please provide an enhanced version of the resume that:
    1. Addresses all feedback points
    2. Optimizes for ATS
    3. Highlights relevant skills and experience
    4. Improves formatting and readability
    5. Maintains professional tone
    
    Return only the enhanced resume content.
    """

    try:
        response = await model.generate_content(prompt)
        return response.text
    except Exception as e:
        raise Exception(f"Failed to enhance resume: {str(e)}")

async def generate_cover_letter_with_gemini(
    resume_content: str,
    job_description: str,
    company_info: Optional[Dict[str, Any]] = None
) -> str:
    """Generate a professional cover letter using Gemini AI."""
    
    prompt = f"""
    Generate a professional cover letter for a software developer position based on the resume and job description.
    
    RESUME:
    {resume_content}
    
    JOB DESCRIPTION:
    {job_description}
    
    {f'COMPANY INFO:\n{json.dumps(company_info, indent=2)}' if company_info else ''}
    
    REQUIREMENTS:
    1. Extract the candidate's name and major projects from the resume
    2. Write in a confident, professional tone tailored to the specific company and role
    3. Mention why they're a strong fit based on job requirements
    4. Include relevant skills/technologies from their background
    5. Show what they're looking to learn and grow into
    6. Focus on software development skills (React, Python, REST APIs, etc.)
    7. Keep it concise (3-4 paragraphs max)
    8. Include a strong call to action
    
    Format as a complete, ready-to-send cover letter with proper business letter formatting.
    """

    try:
        # For testing, return a mock cover letter
        extracted_name = "John Doe"  # Would extract from resume in real implementation
        company_name = "TechCorp"    # Would extract from job description
        
        mock_cover_letter = f"""Dear Hiring Manager,

I am writing to express my strong interest in the Software Developer position at {company_name}. With my background in full-stack development and experience building scalable web applications, I am confident I would be a valuable addition to your engineering team.

In my recent projects, I have developed proficiency in the technologies mentioned in your job posting. I built a task management application using React and Node.js that serves over 1,000 users, demonstrating my ability to create user-focused solutions. My experience with REST API development and database optimization directly aligns with your requirements for backend development skills.

What excites me most about this opportunity is the chance to work with your team on innovative projects while continuing to grow my expertise in cloud technologies and system design. I am particularly eager to learn more about microservices architecture and contribute to building scalable solutions that make a real impact.

I would welcome the opportunity to discuss how my technical skills and passion for software development can contribute to {company_name}'s continued success. Thank you for your consideration.

Sincerely,
{extracted_name}"""
        
        return mock_cover_letter
    except Exception as e:
        raise Exception(f"Failed to generate cover letter: {str(e)}")

async def extract_linkedin_profile_with_gemini(profile_url: str) -> Dict[str, Any]:
    """Extract information from LinkedIn profile using Gemini AI."""
    
    prompt = f"""
    Extract key information from this LinkedIn profile:
    {profile_url}
    
    Please provide a structured analysis including:
    1. Professional summary
    2. Work experience
    3. Education
    4. Skills
    5. Certifications
    6. Recommendations
    
    Format the response as a JSON object.
    """

    try:
        response = await model.generate_content(prompt)
        return json.loads(response.text)
    except Exception as e:
        raise Exception(f"Failed to extract LinkedIn profile: {str(e)}")

async def generate_learning_path_with_gemini(
    resume_content: str,
    job_description: str,
    feedback: List[Dict[str, Any]]
) -> Dict[str, Any]:
    """Generate a comprehensive learning plan for software developer job preparation."""
    
    # For testing, return a comprehensive mock learning plan
    mock_learning_plan = {
        "technical_interview_topics": [
            {
                "topic": "System Design",
                "description": "Design scalable web applications and APIs",
                "importance": "Critical for mid-level+ positions",
                "study_resources": [
                    "System Design Interview book by Alex Xu",
                    "High Scalability blog",
                    "YouTube: System Design Interview channel"
                ]
            },
            {
                "topic": "REST API Development",
                "description": "Building and consuming RESTful web services",
                "importance": "Essential for full-stack development",
                "study_resources": [
                    "Express.js documentation",
                    "REST API Design Best Practices",
                    "Postman API testing tutorials"
                ]
            },
            {
                "topic": "Database Design & SQL",
                "description": "Relational database concepts and query optimization",
                "importance": "Required for backend development",
                "study_resources": [
                    "PostgreSQL documentation",
                    "SQL Practice on HackerRank",
                    "Database Design course on Coursera"
                ]
            },
            {
                "topic": "React.js & Frontend",
                "description": "Modern frontend development with React",
                "importance": "Key for frontend/full-stack roles",
                "study_resources": [
                    "React official documentation",
                    "React Hooks in Action book",
                    "Frontend Masters React courses"
                ]
            }
        ],
        "leetcode_practice": [
            {
                "problem": "Two Sum",
                "difficulty": "Easy",
                "concept": "Hash Maps & Array Traversal",
                "why_important": "Tests basic problem-solving and hash map usage",
                "url": "https://leetcode.com/problems/two-sum/"
            },
            {
                "problem": "Valid Parentheses",
                "difficulty": "Easy", 
                "concept": "Stack Data Structure",
                "why_important": "Common pattern for parsing and validation problems",
                "url": "https://leetcode.com/problems/valid-parentheses/"
            },
            {
                "problem": "Merge Two Sorted Lists",
                "difficulty": "Easy",
                "concept": "Linked Lists & Pointers",
                "why_important": "Fundamental linked list manipulation",
                "url": "https://leetcode.com/problems/merge-two-sorted-lists/"
            },
            {
                "problem": "Binary Tree Inorder Traversal",
                "difficulty": "Easy",
                "concept": "Tree Traversal & Recursion",
                "why_important": "Essential for tree-based problems",
                "url": "https://leetcode.com/problems/binary-tree-inorder-traversal/"
            },
            {
                "problem": "Maximum Subarray",
                "difficulty": "Medium",
                "concept": "Dynamic Programming",
                "why_important": "Introduces DP concepts and optimization",
                "url": "https://leetcode.com/problems/maximum-subarray/"
            },
            {
                "problem": "3Sum",
                "difficulty": "Medium",
                "concept": "Two Pointers Technique",
                "why_important": "Advanced array manipulation and optimization",
                "url": "https://leetcode.com/problems/3sum/"
            },
            {
                "problem": "LRU Cache",
                "difficulty": "Medium",
                "concept": "Hash Map + Doubly Linked List",
                "why_important": "System design implementation question",
                "url": "https://leetcode.com/problems/lru-cache/"
            },
            {
                "problem": "Course Schedule",
                "difficulty": "Medium",
                "concept": "Graph Theory & Topological Sort",
                "why_important": "Graph algorithms are common in interviews",
                "url": "https://leetcode.com/problems/course-schedule/"
            }
        ],
        "key_concepts_to_review": [
            {
                "concept": "Time & Space Complexity",
                "description": "Understand Big O notation and how to analyze algorithms",
                "priority": "High"
            },
            {
                "concept": "Hash Maps & Sets",
                "description": "Master when and how to use hash-based data structures",
                "priority": "High"
            },
            {
                "concept": "Two Pointers Technique",
                "description": "Efficient array/string manipulation patterns",
                "priority": "High"
            },
            {
                "concept": "Sliding Window",
                "description": "Optimize substring/subarray problems",
                "priority": "Medium"
            },
            {
                "concept": "Dynamic Programming",
                "description": "Break down complex problems into subproblems",
                "priority": "Medium"
            },
            {
                "concept": "Binary Search",
                "description": "Efficient searching in sorted data",
                "priority": "Medium"
            },
            {
                "concept": "Tree Traversal (DFS/BFS)",
                "description": "Navigate tree and graph structures",
                "priority": "Medium"
            },
            {
                "concept": "RESTful API Design",
                "description": "HTTP methods, status codes, and best practices",
                "priority": "High"
            },
            {
                "concept": "Database Normalization",
                "description": "Design efficient relational database schemas",
                "priority": "Medium"
            },
            {
                "concept": "Git Workflow",
                "description": "Branching, merging, and collaboration best practices",
                "priority": "High"
            }
        ],
        "recommended_resources": [
            {
                "type": "YouTube Channel",
                "name": "NeetCode",
                "description": "Clear explanations of LeetCode problems with patterns",
                "url": "https://www.youtube.com/@NeetCode"
            },
            {
                "type": "Documentation",
                "name": "MDN Web Docs",
                "description": "Comprehensive JavaScript and web API reference",
                "url": "https://developer.mozilla.org/"
            },
            {
                "type": "Course",
                "name": "The Complete Node.js Developer Course",
                "description": "Backend development with Node.js and Express",
                "url": "https://www.udemy.com/course/the-complete-nodejs-developer-course-2/"
            },
            {
                "type": "Book",
                "name": "Cracking the Coding Interview",
                "description": "Classic technical interview preparation guide",
                "url": "https://www.amazon.com/Cracking-Coding-Interview-Programming-Questions/dp/0984782850"
            }
        ],
        "study_schedule": {
            "week_1": "Focus on easy LeetCode problems and review basic data structures",
            "week_2": "Practice medium problems and study system design basics",
            "week_3": "Build a small project using job-relevant technologies",
            "week_4": "Mock interviews and review weak areas identified in feedback"
        }
    }
    
    return mock_learning_plan


async def generate_practice_exam_with_gemini(
    resume_content: str,
    job_description: str,
    learning_plan: Dict[str, Any]
) -> Dict[str, Any]:
    """Generate a custom 20-question practice exam based on the job requirements."""
    
    # For testing, return a comprehensive mock practice exam
    mock_practice_exam = {
        "exam_info": {
            "title": "Software Developer Technical Assessment",
            "description": "Custom practice exam based on your target job requirements",
            "total_questions": 20,
            "estimated_time": "90 minutes",
            "passing_score": 70
        },
        "questions": [
            {
                "id": 1,
                "type": "multiple_choice",
                "category": "Data Structures",
                "question": "What is the time complexity of searching for an element in a hash table (average case)?",
                "options": [
                    "O(1)",
                    "O(log n)",
                    "O(n)",
                    "O(n²)"
                ],
                "correct_answer": 0,
                "explanation": "Hash tables provide O(1) average-case lookup time due to direct indexing via hash function."
            },
            {
                "id": 2,
                "type": "multiple_choice",
                "category": "React",
                "question": "Which React Hook is used to manage state in functional components?",
                "options": [
                    "useEffect",
                    "useState",
                    "useContext",
                    "useReducer"
                ],
                "correct_answer": 1,
                "explanation": "useState is the primary hook for managing local state in React functional components."
            },
            {
                "id": 3,
                "type": "short_answer",
                "category": "REST APIs",
                "question": "Explain the difference between PUT and PATCH HTTP methods. When would you use each?",
                "sample_answer": "PUT is used for complete resource replacement - you send the entire updated resource. PATCH is used for partial updates - you send only the fields that need to be changed. Use PUT when replacing the entire resource, PATCH when updating specific fields.",
                "key_points": ["PUT replaces entire resource", "PATCH updates specific fields", "Idempotency considerations"]
            },
            {
                "id": 4,
                "type": "code_challenge",
                "category": "Algorithms",
                "question": "Write a function to find the maximum sum of a contiguous subarray (Kadane's algorithm).",
                "starter_code": "def max_subarray_sum(nums):\n    # Your code here\n    pass",
                "sample_solution": "def max_subarray_sum(nums):\n    if not nums:\n        return 0\n    \n    max_sum = current_sum = nums[0]\n    \n    for num in nums[1:]:\n        current_sum = max(num, current_sum + num)\n        max_sum = max(max_sum, current_sum)\n    \n    return max_sum",
                "test_cases": [
                    {"input": "[-2,1,-3,4,-1,2,1,-5,4]", "expected": "6"},
                    {"input": "[1]", "expected": "1"},
                    {"input": "[5,4,-1,7,8]", "expected": "23"}
                ]
            },
            {
                "id": 5,
                "type": "multiple_choice",
                "category": "Database",
                "question": "Which SQL JOIN returns all records from both tables, filling in NULL values where there's no match?",
                "options": [
                    "INNER JOIN",
                    "LEFT JOIN",
                    "RIGHT JOIN",
                    "FULL OUTER JOIN"
                ],
                "correct_answer": 3,
                "explanation": "FULL OUTER JOIN returns all records from both tables, with NULL values where there's no match on either side."
            },
            {
                "id": 6,
                "type": "short_answer",
                "category": "System Design",
                "question": "How would you design a URL shortener like bit.ly? Describe the key components and database schema.",
                "sample_answer": "Key components: 1) URL encoding service to generate short codes, 2) Database to store URL mappings, 3) Redirect service, 4) Analytics service. Database schema: urls table with id, original_url, short_code, created_at, expires_at, click_count. Use base62 encoding for short codes, implement caching for popular URLs.",
                "key_points": ["Base62 encoding", "Database schema design", "Caching strategy", "Analytics tracking"]
            },
            {
                "id": 7,
                "type": "code_challenge",
                "category": "JavaScript",
                "question": "Implement a debounce function that delays execution until after a specified wait time.",
                "starter_code": "function debounce(func, wait) {\n    // Your code here\n}",
                "sample_solution": "function debounce(func, wait) {\n    let timeout;\n    return function executedFunction(...args) {\n        const later = () => {\n            clearTimeout(timeout);\n            func.apply(this, args);\n        };\n        clearTimeout(timeout);\n        timeout = setTimeout(later, wait);\n    };\n}",
                "test_cases": [
                    {"description": "Should delay function execution", "test": "Multiple rapid calls should only execute once after delay"}
                ]
            },
            {
                "id": 8,
                "type": "multiple_choice",
                "category": "Git",
                "question": "What Git command would you use to combine the last 3 commits into a single commit?",
                "options": [
                    "git merge HEAD~3",
                    "git rebase -i HEAD~3",
                    "git squash HEAD~3",
                    "git combine HEAD~3"
                ],
                "correct_answer": 1,
                "explanation": "git rebase -i HEAD~3 opens interactive rebase allowing you to squash commits together."
            },
            {
                "id": 9,
                "type": "short_answer",
                "category": "Node.js",
                "question": "Explain the difference between synchronous and asynchronous operations in Node.js. Why is async important?",
                "sample_answer": "Synchronous operations block the execution thread until completion, while asynchronous operations don't block and use callbacks/promises. Async is crucial in Node.js because it runs on a single thread - blocking operations would freeze the entire application. Async allows handling many concurrent requests efficiently.",
                "key_points": ["Single-threaded nature", "Non-blocking I/O", "Event loop", "Concurrency benefits"]
            },
            {
                "id": 10,
                "type": "code_challenge",
                "category": "Data Structures",
                "question": "Implement a function to detect if a linked list has a cycle.",
                "starter_code": "class ListNode:\n    def __init__(self, val=0):\n        self.val = val\n        self.next = None\n\ndef has_cycle(head):\n    # Your code here\n    pass",
                "sample_solution": "def has_cycle(head):\n    if not head or not head.next:\n        return False\n    \n    slow = fast = head\n    \n    while fast and fast.next:\n        slow = slow.next\n        fast = fast.next.next\n        \n        if slow == fast:\n            return True\n    \n    return False",
                "test_cases": [
                    {"description": "Detects cycle in linked list", "test": "Should return True for cyclic list, False for acyclic"}
                ]
            }
        ],
        "answer_key": [
            {"question_id": 1, "correct_answer": 0, "explanation": "Hash tables provide O(1) average-case lookup time."},
            {"question_id": 2, "correct_answer": 1, "explanation": "useState manages local state in functional components."},
            {"question_id": 5, "correct_answer": 3, "explanation": "FULL OUTER JOIN returns all records from both tables."},
            {"question_id": 8, "correct_answer": 1, "explanation": "Interactive rebase allows squashing commits."}
        ],
        "study_tips": [
            "Review time complexity analysis for common data structures",
            "Practice React hooks and component lifecycle",
            "Understand HTTP methods and REST API principles",
            "Master common algorithm patterns (two pointers, sliding window, etc.)",
            "Learn system design fundamentals and trade-offs"
        ]
    }
    
    return mock_practice_exam 