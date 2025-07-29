# CVPerfect Services

This directory contains all the service layer for CVPerfect, including mock data services and real API services.

## 📁 Directory Structure

```
services/
├── mocks/           # Mock data services
│   ├── resumeMock.ts
│   ├── seoMock.ts
│   ├── learningPathMock.ts
│   ├── examsMock.ts
│   ├── applicationsMock.ts
│   ├── autoApplyMock.ts
│   ├── bulkApplyMock.ts
│   ├── watchlistMock.ts
│   └── subscriptionMock.ts
├── api/             # Real API services
│   ├── resumeService.ts
│   ├── seoService.ts
│   ├── learningPathService.ts
│   ├── examsService.ts
│   ├── applicationsService.ts
│   ├── autoApplyService.ts
│   ├── bulkApplyService.ts
│   ├── watchlistService.ts
│   └── subscriptionService.ts
└── README.md        # This file
```

## 🔄 Toggle Between Dummy and Real Data

### Environment Variable

To switch between dummy data and real API calls, set the environment variable:

```bash
# For dummy data (development/demo)
NEXT_PUBLIC_USE_DUMMY_DATA=true

# For real API calls (production)
NEXT_PUBLIC_USE_DUMMY_DATA=false
```

### How It Works

Each service checks the environment variable and automatically switches between:

1. **Dummy Data**: Returns mock data with simulated API delays
2. **Real API**: Makes actual HTTP requests to your backend

### Example Usage

```typescript
import { resumeService } from '@/services/api/resumeService'

// This will automatically use dummy data or real API based on NEXT_PUBLIC_USE_DUMMY_DATA
const resumeHistory = await resumeService.getResumeHistory()
```

## 🎯 Features with Dummy Data

### ✅ Resume AI Feedback
- Resume analysis scores
- ATS compatibility feedback
- Detailed improvement suggestions
- Mock resume history

### ✅ SEO Check (ATS Analysis)
- Keyword optimization analysis
- Format compatibility scores
- Content structure evaluation
- Missing keyword suggestions

### ✅ Learning Path
- Personalized skill development paths
- Certification recommendations
- Progress tracking
- Market demand insights

### ✅ Exam Generation
- Practice exam creation
- Question bank with answers
- Performance analytics
- Custom exam generation

### ✅ Application Tracking
- Job application status tracking
- Interview scheduling
- Offer management
- Application analytics

### ✅ Auto-Apply
- Single job application simulation
- Success/failure rates
- Match score calculations
- Application history

### ✅ Bulk Apply
- Multiple job applications
- Batch processing simulation
- Success rate analytics
- Application summaries

### ✅ Watchlist
- Dream company tracking
- Job alerts
- Company research
- Alert management

### ✅ Subscription
- Plan management
- Usage tracking
- Billing history
- Payment method updates

## 🚀 Development Workflow

### 1. Development with Dummy Data
```bash
# Set environment variable
export NEXT_PUBLIC_USE_DUMMY_DATA=true

# Start development server
npm run dev
```

### 2. Testing with Real API
```bash
# Set environment variable
export NEXT_PUBLIC_USE_DUMMY_DATA=false

# Ensure backend is running
cd backend && python -m uvicorn main:app --reload

# Start frontend
npm run dev
```

### 3. Production Deployment
```bash
# Ensure NEXT_PUBLIC_USE_DUMMY_DATA=false in production
# Deploy with real API endpoints
npm run build
npm start
```

## 📊 Mock Data Structure

All mock data follows the same structure as the real API responses:

- **Consistent Types**: TypeScript interfaces match real API schemas
- **Realistic Data**: Mock data represents realistic scenarios
- **Simulated Delays**: API calls have realistic timing
- **Error Handling**: Simulates both success and failure scenarios

## 🔧 Customization

### Adding New Mock Data

1. Create mock data in `mocks/[feature]Mock.ts`
2. Export the mock function
3. Import in the corresponding service
4. Add conditional logic for dummy vs real data

### Example:
```typescript
// mocks/newFeatureMock.ts
export const getNewFeatureMockData = () => {
  return {
    // Your mock data here
  }
}

// api/newFeatureService.ts
import { getNewFeatureMockData } from '../mocks/newFeatureMock'

class NewFeatureServiceImpl {
  private useDummyData = process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true'

  async getNewFeature() {
    if (this.useDummyData) {
      await new Promise(resolve => setTimeout(resolve, 500))
      return getNewFeatureMockData()
    }
    
    // Real API call
    const response = await fetch('/api/new-feature')
    return response.json()
  }
}
```

## 🎨 UI Integration

The dashboard automatically uses these services and displays:

- **Resume Score Cards**: Show analysis results
- **SEO Score Cards**: Display ATS compatibility
- **Learning Path Sections**: Show skill progress
- **Exam Practice Sections**: Display available exams
- **Application Lists**: Track job applications
- **Auto-Apply Results**: Show application status
- **Watchlist Cards**: Display dream companies
- **Subscription Status**: Show plan and usage

## 🔍 Debugging

### Check Current Mode
```typescript
console.log('Using dummy data:', process.env.NEXT_PUBLIC_USE_DUMMY_DATA === 'true')
```

### View Mock Data
```typescript
import { getResumeMockData } from '@/services/mocks/resumeMock'
console.log('Mock data:', getResumeMockData())
```

### Test Service Switching
```typescript
// This will automatically use dummy or real data
const result = await resumeService.getResumeHistory()
console.log('Service result:', result)
```

## 📝 Notes

- **Environment Variable**: Must be set at build time for Next.js
- **Type Safety**: All services use TypeScript interfaces
- **Error Handling**: Both dummy and real services handle errors consistently
- **Performance**: Dummy data includes realistic delays for testing
- **Scalability**: Easy to add new features following the same pattern

## 🎯 Next Steps

1. **Backend Development**: Implement real API endpoints
2. **Testing**: Add unit tests for services
3. **Integration**: Connect real APIs when ready
4. **Monitoring**: Add error tracking and analytics
5. **Documentation**: Update API documentation 