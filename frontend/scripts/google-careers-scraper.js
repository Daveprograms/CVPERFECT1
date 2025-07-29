const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Configuration
const GOOGLE_CAREERS_URL = 'https://careers.google.com/jobs/results/';
const OUTPUT_FILE = 'google_jobs.json';
const PREVIOUS_FILE = 'google_jobs_previous.json';

// Job type filters
const JOB_TYPES = {
  intern: ['intern', 'internship', 'student'],
  'new-grad': ['new grad', 'new graduate', 'entry level', 'recent graduate']
};

class GoogleCareersScraper {
  constructor() {
    this.browser = null;
    this.page = null;
    this.jobs = [];
  }

  async init() {
    this.browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    this.page = await this.browser.newPage();
    
    // Set user agent to avoid detection
    await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
  }

  async scrapeJobs(jobType = 'intern') {
    console.log(`🔍 Scraping Google Careers for ${jobType} positions...`);
    
    try {
      await this.page.goto(GOOGLE_CAREERS_URL, { waitUntil: 'networkidle' });
      
      // Wait for job cards to load
      await this.page.waitForSelector('[data-testid="job-card"]', { timeout: 10000 });
      
      // Scroll to load more jobs
      await this.autoScroll();
      
      // Extract job information
      const jobCards = await this.page.$$('[data-testid="job-card"]');
      console.log(`📋 Found ${jobCards.length} job cards`);
      
      for (const card of jobCards) {
        try {
          const jobInfo = await this.extractJobInfo(card);
          if (jobInfo && this.isRelevantJob(jobInfo.title, jobType)) {
            this.jobs.push(jobInfo);
          }
        } catch (error) {
          console.warn('⚠️ Error extracting job info:', error.message);
        }
      }
      
      console.log(`✅ Successfully scraped ${this.jobs.length} relevant jobs`);
      
    } catch (error) {
      console.error('❌ Error scraping jobs:', error.message);
      throw error;
    }
  }

  async autoScroll() {
    console.log('📜 Auto-scrolling to load more jobs...');
    
    let previousHeight = 0;
    let scrollAttempts = 0;
    const maxScrollAttempts = 10;
    
    while (scrollAttempts < maxScrollAttempts) {
      const currentHeight = await this.page.evaluate('document.body.scrollHeight');
      
      if (currentHeight === previousHeight) {
        scrollAttempts++;
      } else {
        scrollAttempts = 0;
      }
      
      await this.page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
      await this.page.waitForTimeout(2000);
      
      previousHeight = currentHeight;
    }
  }

  async extractJobInfo(card) {
    try {
      // Extract job title
      const titleElement = await card.$('[data-testid="job-title"]');
      const title = titleElement ? await titleElement.textContent() : null;
      
      // Extract job URL
      const linkElement = await card.$('a[href*="/jobs/"]');
      const url = linkElement ? await linkElement.getAttribute('href') : null;
      const fullUrl = url ? `https://careers.google.com${url}` : null;
      
      // Extract location
      const locationElement = await card.$('[data-testid="job-location"]');
      const location = locationElement ? await locationElement.textContent() : 'Remote';
      
      // Extract job type/category
      const categoryElement = await card.$('[data-testid="job-category"]');
      const category = categoryElement ? await categoryElement.textContent() : 'Software Engineering';
      
      if (!title || !fullUrl) {
        return null;
      }
      
      return {
        id: this.generateJobId(title, location),
        title: title.trim(),
        location: location.trim(),
        category: category.trim(),
        url: fullUrl,
        scrapedAt: new Date().toISOString(),
        company: 'Google'
      };
      
    } catch (error) {
      console.warn('⚠️ Error extracting job info from card:', error.message);
      return null;
    }
  }

  generateJobId(title, location) {
    return `${title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${location.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  }

  isRelevantJob(title, jobType) {
    if (!title) return false;
    
    const keywords = JOB_TYPES[jobType] || JOB_TYPES.intern;
    const titleLower = title.toLowerCase();
    
    return keywords.some(keyword => titleLower.includes(keyword));
  }

  async saveJobs() {
    const outputPath = path.join(__dirname, OUTPUT_FILE);
    const previousPath = path.join(__dirname, PREVIOUS_FILE);
    
    // Save current jobs
    fs.writeFileSync(outputPath, JSON.stringify(this.jobs, null, 2));
    console.log(`💾 Saved ${this.jobs.length} jobs to ${OUTPUT_FILE}`);
    
    // Check for new jobs
    let previousJobs = [];
    if (fs.existsSync(previousPath)) {
      try {
        previousJobs = JSON.parse(fs.readFileSync(previousPath, 'utf8'));
      } catch (error) {
        console.warn('⚠️ Error reading previous jobs file:', error.message);
      }
    }
    
    const newJobs = this.jobs.filter(job => 
      !previousJobs.some(prevJob => prevJob.id === job.id)
    );
    
    if (newJobs.length > 0) {
      console.log(`🆕 Found ${newJobs.length} new jobs:`);
      newJobs.forEach(job => {
        console.log(`  • ${job.title} - ${job.location}`);
      });
    } else {
      console.log('✅ No new jobs found.');
    }
    
    // Save current jobs as previous for next run
    fs.writeFileSync(previousPath, JSON.stringify(this.jobs, null, 2));
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// CLI support
function parseArguments() {
  const args = process.argv.slice(2);
  const options = {};
  
  for (const arg of args) {
    if (arg.startsWith('--type=')) {
      options.jobType = arg.split('=')[1];
    }
  }
  
  return options;
}

// Main execution
async function main() {
  const options = parseArguments();
  const jobType = options.jobType || 'intern';
  
  if (!JOB_TYPES[jobType]) {
    console.error(`❌ Invalid job type: ${jobType}`);
    console.log('Available types:', Object.keys(JOB_TYPES).join(', '));
    process.exit(1);
  }
  
  const scraper = new GoogleCareersScraper();
  
  try {
    console.log(`🚀 Starting Google Careers scraper for ${jobType} positions...`);
    
    await scraper.init();
    await scraper.scrapeJobs(jobType);
    await scraper.saveJobs();
    
    console.log('✅ Scraping completed successfully!');
    
  } catch (error) {
    console.error('❌ Scraping failed:', error.message);
    process.exit(1);
  } finally {
    await scraper.close();
  }
}

// Export for use as module
module.exports = { GoogleCareersScraper, JOB_TYPES };

// Run if called directly
if (require.main === module) {
  main();
} 