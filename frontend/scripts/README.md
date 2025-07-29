# Google Careers Scraper

A Playwright-based scraper for Google Careers that finds internships and new grad positions.

## Features

- 🔍 **Scrapes Google Careers** for job listings
- 🎯 **Filters by job type**: internships or new grad positions
- 📊 **Tracks new jobs** by comparing with previous runs
- 💾 **Saves to JSON** for easy processing
- 🚀 **CLI support** with command-line arguments

## Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npm run install-browsers
```

## Usage

### Basic Usage

```bash
# Scrape internships (default)
npm run scrape

# Scrape new grad positions
npm run scrape:new-grad

# Or use CLI directly
node google-careers-scraper.js --type=intern
node google-careers-scraper.js --type=new-grad
```

### Job Types

- `intern` - Internships and student positions
- `new-grad` - New graduate and entry-level positions

### Output Files

- `google_jobs.json` - Current scraped jobs
- `google_jobs_previous.json` - Previous run for comparison

## Example Output

```json
[
  {
    "id": "software-engineering-intern-mountain-view-ca",
    "title": "Software Engineering Intern",
    "location": "Mountain View, CA",
    "category": "Software Engineering",
    "url": "https://careers.google.com/jobs/results/123456/",
    "scrapedAt": "2024-01-15T10:30:00.000Z",
    "company": "Google"
  }
]
```

## Features

### 🔍 Smart Filtering
- Filters jobs by keywords in titles
- Intern: "intern", "internship", "student"
- New Grad: "new grad", "new graduate", "entry level", "recent graduate"

### 📊 New Job Detection
- Compares with previous run
- Logs only new jobs found
- Shows "✅ No new jobs found" if none

### 🚀 Auto-scrolling
- Automatically scrolls to load more jobs
- Handles dynamic content loading
- Robust error handling

### 🛡️ Anti-detection
- Custom user agent
- Realistic delays
- Error recovery

## Error Handling

The scraper includes comprehensive error handling:
- Network timeouts
- Missing elements
- Invalid selectors
- File I/O errors

## Development

### Adding New Job Types

```javascript
const JOB_TYPES = {
  intern: ['intern', 'internship', 'student'],
  'new-grad': ['new grad', 'new graduate', 'entry level', 'recent graduate'],
  // Add your custom type
  'senior': ['senior', 'lead', 'principal']
};
```

### Customizing Selectors

Update the `extractJobInfo` method to match Google's current HTML structure:

```javascript
async extractJobInfo(card) {
  const titleElement = await card.$('[data-testid="job-title"]');
  // Add your custom selectors here
}
```

## Troubleshooting

### Common Issues

1. **No jobs found**: Google may have changed their HTML structure
2. **Timeout errors**: Network issues or slow loading
3. **Browser crashes**: Memory issues with large job lists

### Solutions

- Update selectors if Google changes their site
- Increase timeout values for slow connections
- Reduce scroll attempts for memory optimization

## License

MIT License - feel free to use and modify! 