import demoData from './demoData';

export const bulkApplyMock = {
  getBulkApplyStats: async () => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      success: true,
      ...demoData.bulkApplyStats
    };
  },

  startBulkApply: async (settings: {
    companies: string[];
    job_titles: string[];
    batch_size: number;
    delay_between_applications: number;
  }) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      batch_id: `batch_${Date.now()}`,
      settings: settings,
      status: 'active',
      message: 'Bulk apply campaign started successfully'
    };
  },

  getBatchResults: async (batchId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      batch_id: batchId,
      results: [
        {
          company: 'Tech Startup Alpha',
          position: 'Senior React Developer',
          status: 'success',
          match_score: 89,
          applied_date: '2024-01-20T09:00:00Z'
        },
        {
          company: 'Innovation Corp',
          position: 'Full Stack Engineer',
          status: 'success',
          match_score: 85,
          applied_date: '2024-01-20T09:15:00Z'
        }
      ]
    };
  }
}; 