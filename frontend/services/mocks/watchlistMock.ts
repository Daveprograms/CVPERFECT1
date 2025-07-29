import demoData from './demoData';

export const watchlistMock = {
  getWatchlist: async () => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      success: true,
      dream_companies: demoData.watchlist.dream_companies,
      alerts: demoData.watchlist.alerts
    };
  },

  addCompany: async (company: {
    name: string;
    industry: string;
    location: string;
    website?: string;
  }) => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newCompany = {
      id: `comp_${Date.now()}`,
      ...company,
      current_openings: Math.floor(Math.random() * 20) + 1,
      status: 'watching',
      match_score: Math.floor(Math.random() * 20) + 80,
      last_checked: new Date().toISOString()
    };
    
    return {
      success: true,
      company: newCompany,
      message: 'Company added to watchlist successfully'
    };
  },

  removeCompany: async (companyId: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      company_id: companyId,
      message: 'Company removed from watchlist successfully'
    };
  },

  updateCompanyStatus: async (companyId: string, status: string) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      company_id: companyId,
      new_status: status,
      message: 'Company status updated successfully'
    };
  },

  getAlerts: async () => {
    await new Promise(resolve => setTimeout(resolve, 400));
    
    return {
      success: true,
      alerts: demoData.watchlist.alerts
    };
  }
}; 