#!/usr/bin/env node

const axios = require('axios');
const cheerio = require('cheerio');
const { Command } = require('commander');
const fs = require('fs');
const path = require('path');

const program = new Command();

program
  .name('javaspecialists-scraper')
  .description('Scrape course and training data from JavaSpecialists.eu')
  .version('1.0.0');

program
  .option('-t, --type <type>', 'type of content to scrape (courses, trainings, all)', 'all')
  .option('-o, --output <dir>', 'output directory for scraped data', './output')
  .option('-v, --verbose', 'verbose logging');

program.parse();

const options = program.opts();

// Base URL for JavaSpecialists.eu
const BASE_URL = 'https://javaspecialists.eu';

// Known course URLs (would need to be expanded)
const COURSE_URLS = [
  '/courses/',
  // Add more course URLs as discovered
];

// Known training URLs
const TRAINING_URLS = [
  '/courses/',
  // Add more training URLs as discovered
];

class JavaSpecialistsScraper {
  constructor(options) {
    this.options = options;
    this.outputDir = options.output;
    this.verbose = options.verbose;

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  log(message) {
    if (this.verbose) {
      console.log(`[INFO] ${message}`);
    }
  }

  error(message) {
    console.error(`[ERROR] ${message}`);
  }

  async scrapeCourseList() {
    this.log('Starting course list scraping...');

    try {
      const response = await axios.get(`${BASE_URL}/courses/`);
      const $ = cheerio.load(response.data);

      const courses = [];

      // Look for course listings - this will need to be adapted based on actual HTML structure
      $('.course-item, .course-card, [class*="course"]').each((index, element) => {
        const $elem = $(element);

        const course = {
          title: $elem.find('h2, h3, .title').first().text().trim(),
          description: $elem.find('.description, .summary').first().text().trim(),
          url: $elem.find('a').first().attr('href'),
          price: this.extractPrice($elem),
          level: this.extractLevel($elem),
          duration: this.extractDuration($elem)
        };

        if (course.title) {
          courses.push(course);
          this.log(`Found course: ${course.title}`);
        }
      });

      return courses;
    } catch (error) {
      this.error(`Failed to scrape course list: ${error.message}`);
      return [];
    }
  }

  async scrapeCourseDetails(courseUrl) {
    this.log(`Scraping course details: ${courseUrl}`);

    try {
      const response = await axios.get(`${BASE_URL}${courseUrl}`);
      const $ = cheerio.load(response.data);

      const courseDetails = {
        title: $('h1').first().text().trim(),
        description: $('meta[name="description"]').attr('content') || $('p').first().text().trim(),
        outline: this.extractOutline($),
        pricing: this.extractPricing($),
        prerequisites: this.extractPrerequisites($)
      };

      return courseDetails;
    } catch (error) {
      this.error(`Failed to scrape course details ${courseUrl}: ${error.message}`);
      return null;
    }
  }

  extractPrice($elem) {
    // Look for price patterns
    const priceText = $elem.find('[class*="price"], .price, .cost').first().text();
    const priceMatch = priceText.match(/€?(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    return priceMatch ? parseFloat(priceMatch[1].replace(',', '')) : null;
  }

  extractLevel($elem) {
    const levelText = $elem.find('[class*="level"], .level').first().text().toLowerCase();
    if (levelText.includes('beginner')) return 'beginner';
    if (levelText.includes('intermediate') || levelText.includes('medium')) return 'intermediate';
    if (levelText.includes('advanced') || levelText.includes('expert')) return 'advanced';
    return 'intermediate'; // default
  }

  extractDuration($elem) {
    const durationText = $elem.find('[class*="duration"], .duration, .time').first().text();
    return durationText.trim() || null;
  }

  extractOutline($) {
    const outline = [];

    // Look for outline sections
    $('.outline, .curriculum, .content, [class*="outline"]').each((index, element) => {
      const $section = $(element);

      $section.find('li, .item, .topic').each((i, item) => {
        const text = $(item).text().trim();
        if (text) outline.push(text);
      });
    });

    return outline;
  }

  extractPricing($) {
    const pricing = {};

    // Look for pricing sections
    $('.pricing, [class*="pricing"], [class*="price"]').each((index, element) => {
      const $section = $(element);
      const title = $section.find('h2, h3, .title').first().text().trim();
      const content = $section.text().trim();

      if (title && content) {
        pricing[title] = content;
      }
    });

    return pricing;
  }

  extractPrerequisites($) {
    // Look for prerequisites section
    const $prereq = $('.prerequisites, [class*="prereq"], [class*="requirement"]').first();
    return $prereq.length ? $prereq.text().trim() : null;
  }

  async scrapeAllCourses() {
    this.log('Starting comprehensive course scraping...');

    const courses = await this.scrapeCourseList();
    const detailedCourses = [];

    for (const course of courses) {
      if (course.url) {
        const details = await this.scrapeCourseDetails(course.url);
        if (details) {
          detailedCourses.push({ ...course, ...details });
        }
      }
    }

    return detailedCourses;
  }

  async scrapeAllTrainings() {
    this.log('Starting comprehensive training scraping...');

    // Similar structure to courses but for trainings
    const trainings = await this.scrapeCourseList(); // Reuse for now
    return trainings;
  }

  saveData(data, filename) {
    const filepath = path.join(this.outputDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
    this.log(`Saved data to ${filepath}`);
  }

  async run() {
    this.log(`Starting JavaSpecialists.eu scraper (type: ${this.options.type})`);

    try {
      if (this.options.type === 'courses' || this.options.type === 'all') {
        const courses = await this.scrapeAllCourses();
        this.saveData(courses, 'courses.json');
      }

      if (this.options.type === 'trainings' || this.options.type === 'all') {
        const trainings = await this.scrapeAllTrainings();
        this.saveData(trainings, 'trainings.json');
      }

      this.log('Scraping completed successfully!');
    } catch (error) {
      this.error(`Scraping failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run the scraper
const scraper = new JavaSpecialistsScraper(options);
scraper.run().catch(console.error);