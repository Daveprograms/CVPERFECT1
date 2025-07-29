import demoData from './demoData';

export const autoApplyMock = {
  getAutoApplyStats: async () => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      success: true,
      ...demoData.autoApplyStats
    };
  },

  startAutoApply: async (settings: {
    min_match_score: number;
    max_applications_per_day: number;
    preferred_locations: string[];
    excluded_companies: string[];
  }) => {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      campaign_id: `campaign_${Date.now()}`,
      settings: settings,
      status: 'active',
      message: 'Auto apply campaign started successfully'
    };
  },

  pauseAutoApply: async (campaignId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      campaign_id: campaignId,
      status: 'paused',
      message: 'Auto apply campaign paused successfully'
    };
  },

  getActiveCampaigns: async () => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      success: true,
      campaigns: [
        {
          id: 'campaign_001',
          name: 'Tech Companies Campaign',
          status: 'active',
          applications_sent: 45,
          interviews_generated: 8,
          success_rate: 78,
          created_date: '2024-01-15T10:00:00Z'
        }
      ]
    };
  }
}; 