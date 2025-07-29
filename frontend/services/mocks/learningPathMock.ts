import demoData from './demoData';

export const learningPathMock = {
  getLearningPath: async () => {
    await new Promise(resolve => setTimeout(resolve, 700));
    
    return {
      success: true,
      learning_path: demoData.learningPath.learning_path
    };
  },

  updateSkillProgress: async (skillName: string, newProgress: number) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      success: true,
      skill_name: skillName,
      new_progress: newProgress,
      message: 'Skill progress updated successfully'
    };
  },

  getRecommendations: async () => {
    await new Promise(resolve => setTimeout(resolve, 600));
    
    return {
      success: true,
      recommendations: demoData.learningPath.learning_path.recommendations
    };
  },

  startLearningModule: async (skillName: string) => {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      success: true,
      skill_name: skillName,
      module_started: true,
      estimated_completion: '2 weeks',
      message: 'Learning module started successfully'
    };
  }
}; 