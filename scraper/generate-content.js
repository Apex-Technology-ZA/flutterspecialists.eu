#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Content Generator for FlutterSpecialists.eu
 *
 * Takes scraped JSON data from JavaSpecialists.eu and generates
 * Astro content collection markdown files.
 */

class ContentGenerator {
  constructor() {
    this.outputDir = '../src/content';
  }

  /**
   * Generate course markdown files from scraped data
   */
  generateCourses(scrapedDataPath) {
    console.log('Generating course content files...');

    if (!fs.existsSync(scrapedDataPath)) {
      console.error(`Scraped data file not found: ${scrapedDataPath}`);
      return;
    }

    const coursesData = JSON.parse(fs.readFileSync(scrapedDataPath, 'utf8'));
    const coursesDir = path.join(this.outputDir, 'courses');

    // Ensure courses directory exists
    if (!fs.existsSync(coursesDir)) {
      fs.mkdirSync(coursesDir, { recursive: true });
    }

    coursesData.forEach((course, index) => {
      const slug = this.generateSlug(course.title);
      const filename = `${slug}.md`;
      const filepath = path.join(coursesDir, filename);

      const markdown = this.generateCourseMarkdown(course, slug);
      fs.writeFileSync(filepath, markdown);

      console.log(`Generated course: ${filename}`);
    });

    console.log(`Generated ${coursesData.length} course files`);
  }

  /**
   * Generate training markdown files from scraped data
   */
  generateTrainings(scrapedDataPath) {
    console.log('Generating training content files...');

    if (!fs.existsSync(scrapedDataPath)) {
      console.error(`Scraped data file not found: ${scrapedDataPath}`);
      return;
    }

    const trainingsData = JSON.parse(fs.readFileSync(scrapedDataPath, 'utf8'));
    const trainingsDir = path.join(this.outputDir, 'trainings');

    // Ensure trainings directory exists
    if (!fs.existsSync(trainingsDir)) {
      fs.mkdirSync(trainingsDir, { recursive: true });
    }

    trainingsData.forEach((training, index) => {
      const slug = this.generateSlug(training.title);
      const filename = `${slug}.md`;
      const filepath = path.join(trainingsDir, filename);

      const markdown = this.generateTrainingMarkdown(training, slug);
      fs.writeFileSync(filepath, markdown);

      console.log(`Generated training: ${filename}`);
    });

    console.log(`Generated ${trainingsData.length} training files`);
  }

  /**
   * Generate markdown content for a course
   */
  generateCourseMarkdown(course, slug) {
    const frontmatter = {
      title: course.title,
      description: course.description || 'Course description',
      price: course.price || 99,
      level: course.level || 'intermediate',
      duration: course.duration || '4 hours',
      heroImage: '/og-default.svg',
      outline: course.outline || ['Course outline'],
      paymentLink: `https://buy.stripe.com/test_${slug}`,
      draft: false
    };

    const markdown = `---
title: ${frontmatter.title}
description: ${frontmatter.description}
price: ${frontmatter.price}
level: ${frontmatter.level}
duration: "${frontmatter.duration}"
heroImage: ${frontmatter.heroImage}
outline:${frontmatter.outline.map(item => `\n  - "${item}"`).join('')}
paymentLink: ${frontmatter.paymentLink}
draft: ${frontmatter.draft}
---

${course.description || 'Course content will be updated based on scraped data.'}
`;

    return markdown;
  }

  /**
   * Generate markdown content for a training
   */
  generateTrainingMarkdown(training, slug) {
    const frontmatter = {
      title: training.title,
      description: training.description || 'Training description',
      duration: training.duration || '2 days',
      mode: training.mode || 'hybrid',
      schedule: training.schedule || 'By arrangement',
      heroImage: '/og-default.svg',
      outline: training.outline || ['Training outline'],
      calendlyLink: `https://calendly.com/your-calendly/${slug}`,
      draft: false
    };

    const markdown = `---
title: ${frontmatter.title}
description: ${frontmatter.description}
duration: "${frontmatter.duration}"
mode: ${frontmatter.mode}
schedule: "${frontmatter.schedule}"
heroImage: ${frontmatter.heroImage}
outline:${frontmatter.outline.map(item => `\n  - "${item}"`).join('')}
calendlyLink: ${frontmatter.calendlyLink}
draft: ${frontmatter.draft}
---

${training.description || 'Training content will be updated based on scraped data.'}
`;

    return markdown;
  }

  /**
   * Generate URL-friendly slug from title
   */
  generateSlug(title) {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  /**
   * Main generation function
   */
  generate() {
    console.log('Starting content generation...');

    try {
      // Generate courses
      this.generateCourses('./output/courses.json');

      // Generate trainings
      this.generateTrainings('./output/trainings.json');

      console.log('Content generation completed successfully!');
      console.log('Generated files are ready to copy to src/content/');
    } catch (error) {
      console.error('Content generation failed:', error.message);
      process.exit(1);
    }
  }
}

// CLI usage
if (require.main === module) {
  const generator = new ContentGenerator();
  generator.generate();
}

module.exports = ContentGenerator;