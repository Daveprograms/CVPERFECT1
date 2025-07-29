import demoData from './demoData';

export const resumeMock = {
  getResumeHistory: async () => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      feedback_history: demoData.resumeHistory.feedback_history,
      total_resumes: demoData.resumeHistory.feedback_history.length,
      average_score: Math.round(
        demoData.resumeHistory.feedback_history.reduce((acc, res) => acc + res.score, 0) / 
        demoData.resumeHistory.feedback_history.length
      )
    };
  },

  uploadResume: async (file: File) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      resume_id: `res_${Date.now()}`,
      filename: file.name,
      upload_date: new Date().toISOString(),
      analysis_status: 'completed',
      score: Math.floor(Math.random() * 30) + 70, // 70-100
      ats_score: Math.floor(Math.random() * 20) + 80, // 80-100
      message: 'Resume uploaded and analyzed successfully'
    };
  },

  analyzeResume: async (resumeId: string) => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const resume = demoData.resumeHistory.feedback_history.find(r => r.id === resumeId);
    
    return {
      success: true,
      resume_id: resumeId,
      analysis: {
        score: resume?.score || 85,
        ats_score: resume?.ats_score || 90,
        feedback: resume?.feedback || demoData.resumeHistory.feedback_history[0].feedback,
        suggestions: demoData.seoData.seo_check.suggestions,
        keywords_found: demoData.seoData.seo_check.keywords_found,
        keywords_missing: demoData.seoData.seo_check.keywords_missing
      }
    };
  },

  getResumeById: async (resumeId: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    const resume = demoData.resumeHistory.feedback_history.find(r => r.id === resumeId);
    
    if (!resume) {
      throw new Error('Resume not found');
    }
    
    return {
      success: true,
      resume: resume
    };
  },

  deleteResume: async (resumeId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      message: 'Resume deleted successfully'
    };
  },

  downloadResume: async (resumeId: string) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      download_url: `/api/resume/download/${resumeId}`,
      filename: `resume_${resumeId}.pdf`
    };
  }
}; 