import demoData from './demoData';

export const applicationsMock = {
  getApplications: async () => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      success: true,
      applications: demoData.applications.applications,
      stats: demoData.applications.stats
    };
  },

  addApplication: async (application: {
    job_title: string;
    company_name: string;
    location?: string;
    salary_range?: string;
    notes?: string;
  }) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newApplication = {
      id: `app_${Date.now()}`,
      ...application,
      status: 'applied',
      applied_date: new Date().toISOString(),
      match_score: Math.floor(Math.random() * 20) + 80 // 80-100
    };
    
    return {
      success: true,
      application: newApplication,
      message: 'Application added successfully'
    };
  },

  updateApplicationStatus: async (applicationId: string, status: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      application_id: applicationId,
      new_status: status,
      message: 'Application status updated successfully'
    };
  },

  getApplicationStats: async () => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      success: true,
      stats: demoData.applications.stats
    };
  },

  getRecentActivity: async () => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      recent_activity: demoData.applications.stats.recent_activity
    };
  }
}; 