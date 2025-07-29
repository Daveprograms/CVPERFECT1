"""
Real Data Service
Manages real vs test data sources with feature flags
Ensures production always uses real data
"""

import logging
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from ..core.config import settings
from ..models.user import User
from ..models.resume import Resume, ResumeAnalysis
from ..utils.file_processing import extract_text_from_file

logger = logging.getLogger(__name__)


class RealDataService:
    """
    Service to ensure all data operations use real sources in production
    Feature flags allow mock data only for isolated testing
    """
    
    def __init__(self, db: Session, use_real_data: bool = None):
        self.db = db
        # Default to real data in production, configurable for testing
        self.use_real_data = use_real_data if use_real_data is not None else settings.USE_REAL_DATA
        
        if not self.use_real_data:
            logger.warning("Mock data mode enabled - should only be used for testing!")
    
    async def process_uploaded_resume(
        self, 
        file_path: str, 
        user_id: str, 
        filename: str
    ) -> Dict[str, Any]:
        """
        Process uploaded resume file with REAL content extraction
        """
        if self.use_real_data:
            # Production: Extract real text from uploaded file
            try:
                extracted_text = extract_text_from_file(file_path)
                
                if not extracted_text.strip():
                    raise ValueError("No text content found in uploaded file")
                
                # Save to database with real extracted content
                resume = Resume(
                    user_id=user_id,
                    filename=filename,
                    content=extracted_text,
                    file_type=file_path.split('.')[-1].lower(),
                    processing_status="completed"
                )
                
                self.db.add(resume)
                self.db.commit()
                self.db.refresh(resume)
                
                logger.info(f"Real resume processed: {len(extracted_text)} characters extracted")
                
                return {
                    "resume_id": resume.id,
                    "content": extracted_text,
                    "character_count": len(extracted_text),
                    "processing_status": "completed"
                }
                
            except Exception as e:
                logger.error(f"Real resume processing failed: {str(e)}")
                raise
        else:
            # Testing only: Mock data for isolated tests
            logger.warning("Using mock resume data - testing mode only!")
            return self._get_mock_resume_data(user_id, filename)
    
    def get_user_analytics(self, user_id: str) -> Dict[str, Any]:
        """
        Get real user analytics from database
        """
        if self.use_real_data:
            # Production: Query real database records
            try:
                # Get real resume count
                resume_count = self.db.query(Resume).filter(
                    Resume.user_id == user_id
                ).count()
                
                # Get real average score
                avg_score_result = self.db.query(
                    self.db.func.avg(ResumeAnalysis.overall_score)
                ).join(Resume).filter(
                    Resume.user_id == user_id
                ).scalar()
                
                avg_score = float(avg_score_result) if avg_score_result else 0.0
                
                # Get real improvement over time
                recent_analyses = self.db.query(ResumeAnalysis).join(Resume).filter(
                    Resume.user_id == user_id
                ).order_by(ResumeAnalysis.created_at.desc()).limit(5).all()
                
                improvement_trend = []
                if recent_analyses:
                    scores = [analysis.overall_score for analysis in reversed(recent_analyses)]
                    improvement_trend = scores
                
                logger.info(f"Real analytics for user {user_id}: {resume_count} resumes, {avg_score:.1f} avg score")
                
                return {
                    "total_resumes": resume_count,
                    "average_score": round(avg_score, 1),
                    "improvement_trend": improvement_trend,
                    "last_activity": recent_analyses[0].created_at.isoformat() if recent_analyses else None,
                    "data_source": "real_database"
                }
                
            except Exception as e:
                logger.error(f"Real analytics query failed: {str(e)}")
                raise
        else:
            # Testing only: Mock analytics
            logger.warning("Using mock analytics data - testing mode only!")
            return self._get_mock_analytics_data(user_id)
    
    def get_user_resumes(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Get real user resumes from database
        """
        if self.use_real_data:
            # Production: Query real database records
            try:
                resumes = self.db.query(Resume).filter(
                    Resume.user_id == user_id
                ).order_by(Resume.upload_date.desc()).all()
                
                resume_data = []
                for resume in resumes:
                    # Get latest analysis if available
                    latest_analysis = self.db.query(ResumeAnalysis).filter(
                        ResumeAnalysis.resume_id == resume.id
                    ).order_by(ResumeAnalysis.created_at.desc()).first()
                    
                    resume_dict = {
                        "id": resume.id,
                        "filename": resume.filename,
                        "upload_date": resume.upload_date.isoformat(),
                        "file_type": resume.file_type,
                        "content_preview": resume.content[:200] + "..." if len(resume.content) > 200 else resume.content,
                        "character_count": len(resume.content),
                        "latest_score": latest_analysis.overall_score if latest_analysis else None,
                        "analysis_count": self.db.query(ResumeAnalysis).filter(
                            ResumeAnalysis.resume_id == resume.id
                        ).count()
                    }
                    resume_data.append(resume_dict)
                
                logger.info(f"Retrieved {len(resume_data)} real resumes for user {user_id}")
                return resume_data
                
            except Exception as e:
                logger.error(f"Real resume query failed: {str(e)}")
                raise
        else:
            # Testing only: Mock resume data
            logger.warning("Using mock resume data - testing mode only!")
            return self._get_mock_resumes_data(user_id)
    
    def get_resume_analysis_history(self, resume_id: str) -> List[Dict[str, Any]]:
        """
        Get real analysis history for a resume
        """
        if self.use_real_data:
            # Production: Query real analysis records
            try:
                analyses = self.db.query(ResumeAnalysis).filter(
                    ResumeAnalysis.resume_id == resume_id
                ).order_by(ResumeAnalysis.created_at.desc()).all()
                
                analysis_data = []
                for analysis in analyses:
                    analysis_dict = {
                        "id": analysis.id,
                        "created_at": analysis.created_at.isoformat(),
                        "overall_score": analysis.overall_score,
                        "ats_score": analysis.ats_score,
                        "strengths_count": len(analysis.strengths) if analysis.strengths else 0,
                        "recommendations_count": len(analysis.recommendations) if analysis.recommendations else 0,
                        "has_feedback": bool(analysis.analysis_data)
                    }
                    analysis_data.append(analysis_dict)
                
                logger.info(f"Retrieved {len(analysis_data)} real analyses for resume {resume_id}")
                return analysis_data
                
            except Exception as e:
                logger.error(f"Real analysis history query failed: {str(e)}")
                raise
        else:
            # Testing only: Mock analysis data
            logger.warning("Using mock analysis data - testing mode only!")
            return self._get_mock_analysis_data(resume_id)
    
    # Mock data methods (TESTING ONLY)
    def _get_mock_resume_data(self, user_id: str, filename: str) -> Dict[str, Any]:
        """Mock resume data for testing only"""
        return {
            "resume_id": "test_resume_123",
            "content": "Mock Resume Content\n\nExperience:\n- Software Developer\n\nSkills:\n- Python, JavaScript",
            "character_count": 85,
            "processing_status": "completed",
            "data_source": "mock_testing"
        }
    
    def _get_mock_analytics_data(self, user_id: str) -> Dict[str, Any]:
        """Mock analytics data for testing only"""
        return {
            "total_resumes": 3,
            "average_score": 78.5,
            "improvement_trend": [65, 72, 78, 82, 85],
            "last_activity": "2023-12-01T10:00:00Z",
            "data_source": "mock_testing"
        }
    
    def _get_mock_resumes_data(self, user_id: str) -> List[Dict[str, Any]]:
        """Mock resumes data for testing only"""
        return [
            {
                "id": "mock_resume_1",
                "filename": "mock_resume.pdf",
                "upload_date": "2023-12-01T10:00:00Z",
                "file_type": "pdf",
                "content_preview": "Mock resume content for testing...",
                "character_count": 1250,
                "latest_score": 85,
                "analysis_count": 2,
                "data_source": "mock_testing"
            }
        ]
    
    def _get_mock_analysis_data(self, resume_id: str) -> List[Dict[str, Any]]:
        """Mock analysis data for testing only"""
        return [
            {
                "id": "mock_analysis_1",
                "created_at": "2023-12-01T10:00:00Z",
                "overall_score": 85,
                "ats_score": 78,
                "strengths_count": 3,
                "recommendations_count": 5,
                "has_feedback": True,
                "data_source": "mock_testing"
            }
        ]


class DataSourceValidator:
    """
    Validate that production is using real data sources
    """
    
    @staticmethod
    def validate_production_config():
        """
        Validate production configuration uses real data
        """
        if settings.ENVIRONMENT == "production":
            if not settings.USE_REAL_DATA:
                raise ValueError("Production must use real data! Set USE_REAL_DATA=true")
            
            if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY.startswith("test"):
                raise ValueError("Production must use real Gemini API key!")
            
            logger.info("✅ Production configuration validated - using real data sources")
        else:
            logger.info(f"Environment: {settings.ENVIRONMENT} - real data validation skipped")
    
    @staticmethod
    def log_data_source_usage(service: RealDataService, operation: str):
        """
        Log data source being used for operation
        """
        source = "REAL_DATA" if service.use_real_data else "MOCK_DATA"
        logger.info(f"[{source}] {operation}")
        
        if not service.use_real_data and settings.ENVIRONMENT == "production":
            logger.error(f"❌ PRODUCTION ERROR: Mock data used for {operation}")
            raise ValueError(f"Production cannot use mock data for {operation}")


# Example usage in routes
def get_data_service(db: Session) -> RealDataService:
    """
    Factory function to get data service with proper configuration
    """
    # Validate production configuration
    DataSourceValidator.validate_production_config()
    
    # Return service configured for current environment
    return RealDataService(db, use_real_data=settings.USE_REAL_DATA) 