# Application Constants
APP_NAME = "CVPerfect"
API_VERSION = "v1"
API_PREFIX = f"/api/{API_VERSION}"

# Subscription Types
class SubscriptionType:
    FREE = "free"
    PRO_MONTHLY = "pro_monthly"
    PRO_YEARLY = "pro_yearly"
    ENTERPRISE = "enterprise"

# Feature Limits
FREE_LIMITS = {
    "resume_uploads": 3,
    "ai_analysis": 5,
    "cover_letters": 2,
    "learning_paths": 1,
    "practice_exams": 1
}

PRO_LIMITS = {
    "resume_uploads": -1,  # Unlimited
    "ai_analysis": -1,
    "cover_letters": -1,
    "learning_paths": -1,
    "practice_exams": -1
}

# AI Models
class AIModels:
    GEMINI = "gemini-1.5-flash"
GEMINI_VISION = "gemini-1.5-flash-exp"

# File Types
ALLOWED_FILE_TYPES = {'.pdf', '.doc', '.docx', '.txt'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB

# Email Templates
class EmailTemplates:
    WELCOME = "welcome"
    PASSWORD_RESET = "password_reset"
    SUBSCRIPTION_CREATED = "subscription_created"
    SUBSCRIPTION_CANCELLED = "subscription_cancelled"

# Job Application Status
class ApplicationStatus:
    DRAFT = "draft"
    SUBMITTED = "submitted" 
    UNDER_REVIEW = "under_review"
    INTERVIEWED = "interviewed"
    REJECTED = "rejected"
    ACCEPTED = "accepted"

# Resume Analysis Categories
class AnalysisCategories:
    TECHNICAL_SKILLS = "technical_skills"
    EXPERIENCE = "experience"
    EDUCATION = "education"
    ACHIEVEMENTS = "achievements"
    FORMATTING = "formatting"
    ATS_COMPATIBILITY = "ats_compatibility" 