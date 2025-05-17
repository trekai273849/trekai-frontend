// ✅ COMPLETE ENHANCED index.js — With rich content generation
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(express.json());

const allowedOrigins = [
  'https://smarttrails.pro',
  'https://your-frontend.netlify.app',
  'http://localhost:3000',
  'https://feature-test-customize-page--delightful-croquembouche-cafa23.netlify.app'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.get('/', (req, res) => {
  res.send('✅ TrekAI server is running');
});

// Enhanced normalizer function for rich content
function enhancedNormalizeOutput(gptResponse) {
  let output = gptResponse;

  // Make sure day headings are properly formatted with ### prefix
  output = output.replace(/^(\s*Day\s+\d+:)/gm, '### $1');
  
  // Make sure section headings are properly formatted
  const sectionHeaders = [
    'Packing List', 
    'Local Insights', 
    'Practical Information'
  ];
  
  sectionHeaders.forEach(header => {
    if (!output.includes(`### ${header}`)) {
      // Find section and add proper heading if not formatted correctly
      const headerRegex = new RegExp(`(?:^|\\n)(?:\\d+\\.\\s*)?(?:${header})(?:\\s*\\:)?`, 'i');
      const headerMatch = output.match(headerRegex);
      if (headerMatch) {
        output = output.replace(headerMatch[0], `\n\n### ${header}\n`);
      }
    }
  });

  // Process each day section to ensure proper field formatting
  const dayRegex = /### Day \d+:.*?(?=### Day \d+:|### Packing List|### Local Insights|### Practical Information|$)/gs;
  let processedOutput = output;
  let match;
  
  while ((match = dayRegex.exec(output)) !== null) {
    let daySection = match[0];
    const dayHeaderMatch = daySection.match(/(### Day \d+:.*?)(?:\n|$)/);
    
    if (!dayHeaderMatch) continue;
    
    const dayHeader = dayHeaderMatch[0];
    
    // Get section content without the header
    let dayContent = daySection.replace(dayHeader, '').trim();
    
    // Process each expected field if not already formatted with bullet points
    if (!dayContent.match(/\n\s*-\s*Start:/)) {
      // List of all possible fields in enhanced format
      const fields = [
        'Start', 'End', 'Distance', 'Elevation gain/loss', 'Elevation',
        'Terrain', 'Difficulty', 'Highlights', 'Lunch', 'Accommodation',
        'Water sources', 'Tips'
      ];
      
      fields.forEach(field => {
        const fieldRegex = new RegExp(`\\b${field.replace(/\//g, '\\/').replace(/\(/g, '\\(').replace(/\)/g, '\\)')}\\s*:\\s*([^\\n]+)`, 'i');
        const fieldMatch = dayContent.match(fieldRegex);
        
        if (fieldMatch) {
          // Replace the old format with bullet point format
          dayContent = dayContent.replace(
            fieldMatch[0], 
            `\n- ${field}: ${fieldMatch[1].trim()}`
          );
        }
      });
      
      // Replace the day section in the processed output
      const newDaySection = dayHeader + '\n' + dayContent;
      processedOutput = processedOutput.replace(daySection, newDaySection);
    }
  }

  // Process detailed subsections in Packing List, Local Insights, etc.
  const sectionRegex = /### (Packing List|Local Insights|Practical Information)\s*([\s\S]*?)(?=###|$)/g;
  let sectionMatch;
  
  while ((sectionMatch = sectionRegex.exec(processedOutput)) !== null) {
    const sectionName = sectionMatch[1];
    let sectionContent = sectionMatch[2].trim();
    
    // Handle subsection headers (marked with asterisks)
    const subsectionRegex = /\*(.*?):\*/g;
    let formattedContent = sectionContent;
    
    // Format subsection headers to be bold
    formattedContent = formattedContent.replace(subsectionRegex, '*$1:*');
    
    // Ensure each line in the section starts with a bullet point
    const lines = formattedContent.split('\n').map(line => {
      line = line.trim();
      if (line && !line.startsWith('-') && !line.startsWith('*') && !line.startsWith('**')) {
        return `- ${line}`;
      }
      return line;
    });
    
    const newSectionContent = '\n' + lines.join('\n') + '\n\n';
    processedOutput = processedOutput.replace(sectionMatch[0], `### ${sectionName}${newSectionContent}`);
  }
  
  return processedOutput;
}

app.post('/api/start', async (req, res) => {
  const { location } = req.body;
  if (!location) return res.status(400).json({ error: 'Location is required.' });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a trekking guide assistant. Ask helpful follow-up questions to personalize the trek.'
        },
        {
          role: 'user',
          content: `I'm interested in trekking in ${location}.`
        }
      ],
      temperature: 0.7
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();
    res.json({ reply });
  } catch (error) {
    console.error('❌ Error in /api/start:', error);
    res.status(500).send('Failed to generate intro response.');
  }
});

app.post('/api/finalize', async (req, res) => {
  const { location, filters, comments } = req.body;

  if (!location || !filters) {
    return res.status(400).json({ error: 'Location and filters are required.' });
  }

  const dayMatch = location.match(/(\d+)\s*(day|night)/i);
  const dayInfo = dayMatch ? `${dayMatch[1]}-day` : '';

  const filterSummary = `
Location: ${location}
Accommodation: ${filters.accommodation || 'Not specified'}
Difficulty: ${filters.difficulty || 'Not specified'}
Altitude: ${filters.altitude || 'Not specified'}
Technical: ${filters.technical || 'Not specified'}
User Notes: ${comments || 'None'}
`;

  // Enhanced GPT prompt for richer trek itineraries
  const enhancedSystemPrompt = `
You are an expert trekking guide AI specializing in creating detailed, practical itineraries with rich local knowledge.

Your response MUST follow this EXACT format with these enhanced sections:

1. A compelling intro paragraph (2-3 sentences) that captures the essence of the trek and highlights a unique feature.

2. Day-by-day itinerary using this exact format for EACH day:
### Day X: [Descriptive Title with Notable Feature]
- Start: [location, with altitude if relevant]
- End: [location, with altitude if relevant]
- Distance: [X km (X miles)] - mention if it's mostly uphill/downhill/flat
- Elevation gain/loss: [X m (X ft)]
- Terrain: [brief description e.g., rocky paths, forest trails, alpine meadows, etc.]
- Difficulty: [Easy/Moderate/Challenging] with brief explanation why
- Highlights: [2-3 specific points of interest, landmarks, or views]
- Lunch: [specific recommendation with local specialties if applicable]
- Accommodation: [specific name if known, with brief description]
- Water sources: [information about water availability on trail]
- Tips: [practical advice specific to this day's trek]

3. A detailed packing list section with categories:
### Packing List
*Essentials:*
- [item with brief explanation if needed]
- [item]

*Clothing:*
- [specific clothing recommendations for this trek's conditions]
- [item]

*Trek-Specific Gear:*
- [items particularly important for this region/trek]
- [item]

*Documentation:*
- [permits, maps, or documentation needed]
- [item]

4. A comprehensive local insights section:
### Local Insights
*Cultural Considerations:*
- [specific cultural practices or etiquette for the region]
- [insight]

*Safety Information:*
- [region-specific safety tips, wildlife awareness, weather patterns]
- [insight]

*Local Food & Specialties:*
- [regional dishes or foods worth trying]
- [insight]

*Language Tips:*
- [2-3 useful phrases in local language if relevant]
- [insight]

5. A practical information section:
### Practical Information
*Best Time to Visit:*
- [specific months or seasons with brief weather patterns]

*Getting There:*
- [practical transportation options to starting point]

*Permits & Regulations:*
- [any required permits, fees, or regulations]

*Emergency Contacts:*
- [nearest medical facilities or emergency numbers]

CRITICAL FORMATTING RULES:
- Use "### Day X:" format for EVERY day header
- Use bullet points (single hyphen) for ALL data points within each day
- ALWAYS include ALL sections (intro, all days, packing list, local insights, practical info)
- Use the EXACT format shown above including all field names
- ALWAYS include all fields for every day, with specific, actionable information
- Focus on providing SPECIFIC details rather than generic advice
- Include regional specialties, cultural insights, and location-specific information
- Mention actual place names, trail features, and local terminology when possible
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: enhancedSystemPrompt
        },
        {
          role: 'user',
          content: `
Here are the trek preferences:

${filterSummary}

If the user specifies a number of days (e.g. "6-day trek", "10 days in Nepal", etc), generate that number of individual day entries.

Each day MUST follow the exact format specified, with special attention to:
1. Providing SPECIFIC locations, landmarks, and points of interest by name
2. Including practical details about terrain, water sources, and trail conditions
3. Mentioning actual local food specialties and accommodation options
4. Adding region-specific cultural and safety information

For ${location}, include authentic local knowledge about the trails, culture, and environment. 
Make this itinerary highly specific to the region rather than generic trekking advice.

Please generate the full itinerary with proper formatting for each day, plus the enhanced sections.
          `.trim()
        }
      ],
      temperature: 0.7, // Slightly lower temperature for more consistent outputs
      max_tokens: 3000  // Increased token limit for more detailed content
    });

    const reply = completion.choices?.[0]?.message?.content?.trim();

    // Normalize the output before sending it to the client
    const normalizedReply = enhancedNormalizeOutput(reply);

    // Log both original and normalized replies for debugging
    console.log('\n📦 Original GPT Reply:\n', reply);
    console.log('\n📦 Enhanced Normalized GPT Reply:\n', normalizedReply);

    if (!normalizedReply) return res.status(500).json({ error: 'No response from OpenAI' });
    res.json({ reply: normalizedReply });
  } catch (error) {
    console.error('❌ Error in /api/finalize:', error.response?.data || error.message);
    res.status(500).send('Failed to generate final itinerary.');
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));