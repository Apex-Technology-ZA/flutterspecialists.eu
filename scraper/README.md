# JavaSpecialists.eu Scraper

A Node.js tool to scrape course and training data from JavaSpecialists.eu website.

## Features

- **Course Discovery**: Automatically find and catalog all available courses
- **Detail Extraction**: Scrape detailed course information including:
  - Course titles and descriptions
  - Pricing information
  - Course outlines and curriculum
  - Prerequisites
  - Training formats and schedules
- **Structured Output**: Generate JSON data compatible with FlutterSpecialists.eu content collections

## Installation

```bash
cd scraper
npm install
```

## Usage

### Scrape All Content
```bash
npm run scrape
```

### Scrape Only Courses
```bash
npm run scrape:courses
```

### Scrape Only Trainings
```bash
npm run scrape:trainings
```

### Custom Options
```bash
node scraper.js --type courses --output ./custom-output --verbose
```

## Output

The scraper generates JSON files in the specified output directory:

- `courses.json` - Self-study course data
- `trainings.json` - Classroom and remote training data

## Data Structure

### Course Data
```json
{
  "title": "Course Title",
  "description": "Course description",
  "price": 149.00,
  "level": "intermediate",
  "duration": "4 hours",
  "outline": [
    "Topic 1",
    "Topic 2",
    "Topic 3"
  ],
  "url": "/courses/course-slug"
}
```

### Training Data
```json
{
  "title": "Training Workshop",
  "description": "Workshop description",
  "duration": "2 days",
  "mode": "hybrid",
  "schedule": "By arrangement",
  "outline": [
    "Day 1: Fundamentals",
    "Day 2: Advanced Topics"
  ],
  "calendlyLink": "https://calendly.com/...",
  "url": "/courses/training-slug"
}
```

## Integration with FlutterSpecialists.eu

The scraped data can be used to generate Astro content collection files:

1. Run the scraper to generate JSON data
2. Use the content generator script to create `.md` files
3. Copy generated files to `src/content/courses/` and `src/content/trainings/`

## Rate Limiting & Ethics

- Includes delays between requests to respect server resources
- Only scrapes publicly available information
- Respects robots.txt and terms of service
- Use responsibly and in accordance with website policies

## Development

To extend the scraper:

1. **Add URL Discovery**: Expand `COURSE_URLS` and `TRAINING_URLS` arrays
2. **Improve Selectors**: Update CSS selectors in extraction methods
3. **Add Data Processing**: Enhance data cleaning and formatting
4. **Error Handling**: Add retry logic and better error recovery

## License

MIT License - Use responsibly and in accordance with JavaSpecialists.eu terms of service.