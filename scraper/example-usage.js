#!/usr/bin/env node

/**
 * Example usage of the JavaSpecialists.eu scraper
 *
 * This script demonstrates how to use the scraper to extract
 * course and training data and generate content files.
 */

const { JavaSpecialistsScraper } = require('./scraper');
const { ContentGenerator } = require('./generate-content');

async function exampleUsage() {
  console.log('🚀 JavaSpecialists.eu Scraper Example');
  console.log('=====================================\n');

  // Example 1: Scrape course data
  console.log('📚 Scraping course data...');
  const scraper = new JavaSpecialistsScraper({
    type: 'courses',
    output: './output',
    verbose: true
  });

  try {
    const courses = await scraper.scrapeAllCourses();
    console.log(`✅ Scraped ${courses.length} courses`);

    // Example 2: Generate content files
    console.log('\n📝 Generating content files...');
    const generator = new ContentGenerator();
    generator.generateCourses('./output/courses.json');

    console.log('✅ Content generation completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Review generated files in ../src/content/');
    console.log('2. Update payment links and scheduling URLs');
    console.log('3. Customize course descriptions and outlines');
    console.log('4. Test the website build');

  } catch (error) {
    console.error('❌ Example failed:', error.message);
  }
}

// Example data structure for testing
const exampleCourseData = {
  title: 'Example Flutter Course',
  description: 'Learn Flutter development from scratch',
  price: 99,
  level: 'beginner',
  duration: '4 hours',
  outline: [
    'Introduction to Flutter',
    'Building your first app',
    'State management',
    'Testing and deployment'
  ]
};

const exampleTrainingData = {
  title: 'Flutter Architecture Workshop',
  description: 'Advanced Flutter architecture patterns',
  duration: '2 days',
  mode: 'hybrid',
  schedule: 'By arrangement',
  outline: [
    'Clean Architecture principles',
    'State management patterns',
    'Testing strategies',
    'Performance optimization'
  ]
};

// Run example if this file is executed directly
if (require.main === module) {
  exampleUsage();
}

module.exports = {
  exampleUsage,
  exampleCourseData,
  exampleTrainingData
};