import demoData from './demoData';

export const seoMock = {
  getSEOCheck: async (resumeId: string) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return {
      success: true,
      seo_check: demoData.seoData.seo_check
    };
  },

  optimizeForATS: async (resumeId: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      success: true,
      optimized_resume_id: resumeId,
      improvements_made: [
        'Added missing keywords',
        'Improved formatting',
        'Enhanced action verbs',
        'Optimized section headers'
      ],
      new_ats_score: 95,
      message: 'Resume optimized for ATS successfully'
    };
  },

  getKeywordAnalysis: async (resumeId: string) => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      success: true,
      keywords_found: demoData.seoData.seo_check.keywords_found,
      keywords_missing: demoData.seoData.seo_check.keywords_missing,
      keyword_density: demoData.seoData.seo_check.keyword_density,
      suggestions: demoData.seoData.seo_check.suggestions
    };
  }
}; 