// js/modules/quizManager.js

import { LocationParser } from './locationParser.js';

export class QuizManager {
    constructor() {
        this.locationParser = new LocationParser();
        this.currentQuestion = 0;
        this.quizAnswers = {};
        this.parsedData = {};
        this.questionsToShow = [];
        this.originalInput = '';
        
        // Popular destinations for autocomplete
        this.popularDestinations = [
            // Europe
            'Swiss Alps', 'Dolomites', 'Tour du Mont Blanc', 'Chamonix', 'Zermatt',
            'Norway', 'Iceland', 'Scotland', 'Pyrenees', 'Corsica',
            // Americas  
            'Patagonia', 'Peru', 'Inca Trail', 'Colorado', 'Yosemite',
            'Grand Canyon', 'Canadian Rockies', 'Alaska', 'Torres del Paine',
            // Asia
            'Nepal', 'Everest Base Camp', 'Annapurna', 'Japan', 'Japanese Alps',
            'Bhutan', 'Ladakh', 'Kashmir', 'Vietnam', 'Thailand',
            // Oceania
            'New Zealand', 'Milford Track', 'Tasmania', 'Australia', 'Fiji',
            // Africa
            'Kilimanjaro', 'Morocco', 'Atlas Mountains', 'South Africa', 'Kenya'
        ];
        
        // Question templates
        this.questionTemplates = {
            'trek-type': {
                title: "What type of adventure are you planning?",
                type: 'single',
                options: [
                    { value: 'day-hike', icon: 'fa-clock', title: 'Day Hike', description: 'Return to comfort each evening' },
                    { value: 'multi-day', icon: 'fa-tent', title: 'Multi-Day Trek', description: 'Immerse yourself in nature for days' }
                ]
            },
            'trek-length': {
                title: "How many days will you be trekking?",
                type: 'single',
                options: [
                    { value: '3-5', icon: 'fa-calendar-day', title: '3-5 days', description: 'Long weekend escape' },
                    { value: '6-8', icon: 'fa-calendar-week', title: '6-8 days', description: 'Full week adventure' },
                    { value: '9-14', icon: 'fa-calendar-days', title: '9-14 days', description: 'Extended journey' },
                    { value: '15+', icon: 'fa-calendar-plus', title: '15+ days', description: 'Epic expedition' }
                ]
            },
            'location': {
                title: "Where would you like to explore?",
                type: 'location-input',
                placeholder: "Enter a continent, country, region, or city...",
                examples: ["Swiss Alps", "Peru", "New Zealand", "Patagonia", "Iceland", "Colorado"],
                surpriseText: "Surprise me - I'm open to anywhere!",
                trendingDestinations: ["Patagonia", "Dolomites", "Iceland", "Japan Alps", "Torres del Paine"]
            },
            'difficulty': {
                title: "What's your fitness level?",
                type: 'single',
                options: [
                    { value: 'easy', icon: 'fa-smile', title: 'Easy', description: 'Gentle paths, minimal elevation gain' },
                    { value: 'moderate', icon: 'fa-chart-line', title: 'Moderate', description: 'Some challenging sections, good fitness needed' },
                    { value: 'challenging', icon: 'fa-bolt', title: 'Challenging', description: 'Steep terrain, high altitude, excellent fitness' }
                ]
            },
            'accommodation': {
                title: "Where do you want to sleep?",
                type: 'single',
                options: [
                    { value: 'camping', icon: 'fa-campground', title: 'Camping', description: 'Under the stars' },
                    { value: 'huts', icon: 'fa-house', title: 'Mountain Huts', description: 'Basic shelter' },
                    { value: 'lodges', icon: 'fa-bed', title: 'Lodges', description: 'Comfortable stays' },
                    { value: 'mixed', icon: 'fa-layer-group', title: 'Mixed', description: 'Variety of options' }
                ]
            },
            'season': {
                title: "When are you planning to go?",
                type: 'single',
                options: [
                    { value: 'spring', icon: 'fa-seedling', title: 'Spring', description: 'Wildflowers & mild weather' },
                    { value: 'summer', icon: 'fa-sun', title: 'Summer', description: 'Long days & warm weather' },
                    { value: 'autumn', icon: 'fa-leaf', title: 'Autumn', description: 'Fall colors & crisp air' },
                    { value: 'winter', icon: 'fa-snowflake', title: 'Winter', description: 'Snow-covered landscapes' }
                ]
            },
            'interests': {
                title: "What excites you most?",
                type: 'multi',
                options: [
                    { value: 'wildlife', icon: 'fa-binoculars', title: 'Wildlife' },
                    { value: 'photography', icon: 'fa-camera', title: 'Photography' },
                    { value: 'culture', icon: 'fa-landmark', title: 'Culture' },
                    { value: 'solitude', icon: 'fa-person', title: 'Solitude' },
                    { value: 'lakes', icon: 'fa-water', title: 'Lakes & Rivers' },
                    { value: 'forests', icon: 'fa-tree', title: 'Forests' }
                ]
            },
            'details': {
                title: "Anything else we should know?",
                type: 'text'
            }
        };
    }
    
    /**
     * Get autocomplete suggestions for location input
     */
    getLocationSuggestions(input) {
        if (!input || input.length < 2) return [];
        
        const lowerInput = input.toLowerCase();
        const suggestions = [];
        
        // Check popular destinations
        this.popularDestinations.forEach(dest => {
            if (dest.toLowerCase().includes(lowerInput)) {
                suggestions.push({
                    type: 'popular',
                    value: dest,
                    display: dest
                });
            }
        });
        
        // Check cities from location parser
        const cities = Object.keys(this.locationParser.cities);
        cities.forEach(city => {
            if (city.includes(lowerInput) && suggestions.length < 8) {
                const cityData = this.locationParser.cities[city];
                suggestions.push({
                    type: 'city',
                    value: city,
                    display: `${city.charAt(0).toUpperCase() + city.slice(1)}, ${cityData.country}`
                });
            }
        });
        
        // Limit suggestions
        return suggestions.slice(0, 8);
    }
    
    /**
     * Parse user input to extract trek information
     */
    parseUserInput(input) {
        const parsed = {
            trekType: null,
            duration: null,
            location: null,
            locationDetails: null,
            difficulty: null,
            season: null,
            accommodation: null
        };
        
        const lowerInput = input.toLowerCase();
        
        // Parse location using the LocationParser
        const locationResult = this.locationParser.parseLocation(input);
        console.log('Location parsing result:', locationResult); // Debug
        
        if (locationResult.city || locationResult.state || locationResult.country || 
            locationResult.specificArea || locationResult.region) {
            // Store the full location details
            parsed.locationDetails = locationResult;
            
            // Set the location based on specificity
            if (locationResult.city) {
                parsed.location = `${locationResult.city}, ${locationResult.country}`;
            } else if (locationResult.state) {
                parsed.location = `${locationResult.state}, ${locationResult.country}`;
            } else if (locationResult.specificArea) {
                parsed.location = locationResult.specificArea;
            } else if (locationResult.country) {
                parsed.location = locationResult.country;
            } else if (locationResult.region) {
                parsed.location = locationResult.region;
            }
        }
        
        // Duration and trek type detection
        const durationPatterns = [
            { regex: /(\d+)\s*day(?:s)?\s*(?:hike|trek|trip|tour|walk)/i, type: 'days' },
            { regex: /(\d+)\s*night(?:s)?/i, type: 'nights' },
            { regex: /(\d+)\s*week(?:s)?/i, type: 'weeks' },
            { regex: /week[\s-]?long/i, type: 'week' },
            { regex: /fortnight/i, type: 'fortnight' },
            { regex: /month[\s-]?long/i, type: 'month' },
            { regex: /weekend/i, type: 'weekend' },
            { regex: /long weekend/i, type: 'long-weekend' }
        ];
        
        let durationFound = false;
        for (const pattern of durationPatterns) {
            const match = lowerInput.match(pattern.regex);
            if (match) {
                durationFound = true;
                
                if (pattern.type === 'days') {
                    const days = parseInt(match[1]);
                    if (days === 1) {
                        parsed.trekType = 'day-hike';
                    } else {
                        parsed.trekType = 'multi-day';
                        if (days <= 5) parsed.duration = '3-5';
                        else if (days <= 8) parsed.duration = '6-8';
                        else if (days <= 14) parsed.duration = '9-14';
                        else parsed.duration = '15+';
                    }
                } else if (pattern.type === 'nights') {
                    const nights = parseInt(match[1]);
                    parsed.trekType = 'multi-day';
                    const days = nights + 1;
                    if (days <= 5) parsed.duration = '3-5';
                    else if (days <= 8) parsed.duration = '6-8';
                    else if (days <= 14) parsed.duration = '9-14';
                    else parsed.duration = '15+';
                } else if (pattern.type === 'weeks') {
                    const weeks = parseInt(match[1]);
                    parsed.trekType = 'multi-day';
                    if (weeks === 1) parsed.duration = '6-8';
                    else if (weeks === 2) parsed.duration = '9-14';
                    else parsed.duration = '15+';
                } else if (pattern.type === 'week') {
                    parsed.trekType = 'multi-day';
                    parsed.duration = '6-8';
                } else if (pattern.type === 'fortnight') {
                    parsed.trekType = 'multi-day';
                    parsed.duration = '9-14';
                } else if (pattern.type === 'month') {
                    parsed.trekType = 'multi-day';
                    parsed.duration = '15+';
                } else if (pattern.type === 'weekend') {
                    parsed.trekType = 'multi-day';
                    parsed.duration = '3-5';
                } else if (pattern.type === 'long-weekend') {
                    parsed.trekType = 'multi-day';
                    parsed.duration = '3-5';
                }
                break;
            }
        }
        
        // Only check for day hike if no duration was found
        if (!durationFound) {
            if (lowerInput.match(/day\s*(?:hike|trip|trek|tour|walk)/i) && 
                !lowerInput.match(/\d+\s*day/i)) {
                parsed.trekType = 'day-hike';
            }
        }
        
        // Additional country/region detection (fallback for places not in city database)
        const regionPatterns = {
            'europe': ['alps', 'alpine', 'pyrenees', 'dolomites', 'scotland', 'norway', 'iceland', 
                      'corsica', 'tatras', 'carpathians', 'balkans'],
            'asia': ['himalayas', 'nepal', 'tibet', 'ladakh', 'bhutan', 'japan', 'japanese alps'],
            'americas': ['rockies', 'andes', 'patagonia', 'appalachian', 'sierra', 'cascade'],
            'oceania': ['new zealand', 'tasmania', 'australia'],
            'africa': ['kilimanjaro', 'atlas', 'drakensberg', 'simien']
        };
        
        if (!parsed.location) {
            for (const [region, patterns] of Object.entries(regionPatterns)) {
                for (const pattern of patterns) {
                    if (lowerInput.includes(pattern)) {
                        parsed.location = region;
                        break;
                    }
                }
                if (parsed.location) break;
            }
        }
        
        // Difficulty detection
        const difficultyPatterns = {
            easy: ['easy', 'beginner', 'gentle', 'leisurely', 'relaxed', 'simple', 'light', 'casual'],
            moderate: ['moderate', 'intermediate', 'medium', 'average', 'normal'],
            challenging: ['challenging', 'difficult', 'hard', 'strenuous', 'tough', 'demanding', 
                         'advanced', 'expert', 'extreme', 'technical', 'arduous']
        };
        
        for (const [level, patterns] of Object.entries(difficultyPatterns)) {
            for (const pattern of patterns) {
                if (lowerInput.includes(pattern)) {
                    parsed.difficulty = level;
                    break;
                }
            }
            if (parsed.difficulty) break;
        }
        
        // Season detection
        const seasonPatterns = {
            spring: ['spring', 'april', 'may', 'march'],
            summer: ['summer', 'june', 'july', 'august', 'warm season', 'hot season'],
            autumn: ['autumn', 'fall', 'september', 'october', 'november'],
            winter: ['winter', 'december', 'january', 'february', 'cold season', 'snow season']
        };
        
        for (const [season, patterns] of Object.entries(seasonPatterns)) {
            for (const pattern of patterns) {
                if (lowerInput.includes(pattern)) {
                    parsed.season = season;
                    break;
                }
            }
            if (parsed.season) break;
        }
        
        // Accommodation detection
        const accommodationPatterns = {
            camping: ['camping', 'tent', 'camp', 'bivouac', 'wild camping'],
            huts: ['hut', 'refuge', 'rifugio', 'mountain hut', 'alpine hut', 'bothies', 'cabins'],
            lodges: ['lodge', 'hotel', 'guesthouse', 'inn', 'teahouse', 'accommodation', 'stay'],
            mixed: ['mixed accommodation', 'variety of accommodation', 'huts and camping']
        };
        
        for (const [type, patterns] of Object.entries(accommodationPatterns)) {
            for (const pattern of patterns) {
                if (lowerInput.includes(pattern)) {
                    parsed.accommodation = type;
                    break;
                }
            }
            if (parsed.accommodation) break;
        }
        
        console.log('Full parsed data:', parsed); // Debug
        return parsed;
    }
    
    /**
     * Generate dynamic quiz based on parsed data
     */
    generateDynamicQuiz(parsed) {
        const allQuestions = [
            'trek-type',
            'trek-length',
            'location',
            'difficulty',
            'accommodation',
            'season',
            'interests',
            'details'
        ];
        
        // Filter out questions we already have answers for
        const questions = allQuestions.filter(q => {
            if (q === 'trek-type' && parsed.trekType) return false;
            if (q === 'trek-length' && parsed.duration) return false;
            if (q === 'location' && parsed.location) return false;
            if (q === 'difficulty' && parsed.difficulty) return false;
            if (q === 'season' && parsed.season) return false;
            if (q === 'accommodation' && parsed.accommodation) return false;
            return true;
        });
        
        // Skip trek-length if day hike
        if (parsed.trekType === 'day-hike') {
            const lengthIndex = questions.indexOf('trek-length');
            if (lengthIndex > -1) questions.splice(lengthIndex, 1);
            
            // Also skip accommodation for day hikes
            const accomIndex = questions.indexOf('accommodation');
            if (accomIndex > -1) questions.splice(accomIndex, 1);
        }
        
        return questions;
    }
    
    /**
     * Initialize quiz with user input
     */
    initializeQuiz(input) {
        this.originalInput = input;
        this.currentQuestion = 0;
        this.quizAnswers = {};
        
        if (!input) {
            // No input - show full quiz
            this.parsedData = {};
            this.questionsToShow = Object.keys(this.questionTemplates);
        } else {
            // Parse input and show adaptive quiz
            this.parsedData = this.parseUserInput(input);
            this.questionsToShow = this.generateDynamicQuiz(this.parsedData);
        }
        
        return {
            parsedData: this.parsedData,
            questionsToShow: this.questionsToShow,
            needsQuiz: this.questionsToShow.length > 0
        };
    }
    
    /**
     * Get combined data for submission - CRITICAL FIX HERE
     */
    getCombinedData() {
        // Check if we already parsed location from initial input
        let finalLocation = 'any';
        let specificLocation = null;
        let parsedLocationDetails = null;
        
        // First check if location was parsed from initial input
        if (this.parsedData.location || this.parsedData.locationDetails) {
            parsedLocationDetails = this.parsedData.locationDetails || {};
            
            // Use the most specific location available from initial parsing
            if (parsedLocationDetails.city) {
                specificLocation = `${parsedLocationDetails.city}, ${parsedLocationDetails.country}`;
                finalLocation = specificLocation;
            } else if (parsedLocationDetails.state) {
                specificLocation = `${parsedLocationDetails.state}, ${parsedLocationDetails.country}`;
                finalLocation = specificLocation;
            } else if (parsedLocationDetails.specificArea) {
                specificLocation = parsedLocationDetails.specificArea;
                finalLocation = specificLocation;
            } else if (parsedLocationDetails.country) {
                specificLocation = parsedLocationDetails.country;
                finalLocation = specificLocation;
            } else if (this.parsedData.location) {
                finalLocation = this.parsedData.location;
                specificLocation = parsedLocationDetails.originalInput || this.originalInput;
            }
        }
        
        // If user provided location in quiz, use that instead
        const locationAnswer = this.quizAnswers.location;
        if (locationAnswer && locationAnswer !== 'anywhere') {
            if (typeof locationAnswer === 'string') {
                // Parse the user's location input
                parsedLocationDetails = this.locationParser.parseLocation(locationAnswer);
                
                // Use specific location, not just region
                if (parsedLocationDetails.city) {
                    finalLocation = `${parsedLocationDetails.city}, ${parsedLocationDetails.country}`;
                    specificLocation = finalLocation;
                } else if (parsedLocationDetails.state) {
                    finalLocation = `${parsedLocationDetails.state}, ${parsedLocationDetails.country}`;
                    specificLocation = finalLocation;
                } else if (parsedLocationDetails.country) {
                    finalLocation = parsedLocationDetails.country;
                    specificLocation = finalLocation;
                } else if (parsedLocationDetails.specificArea) {
                    finalLocation = parsedLocationDetails.specificArea;
                    specificLocation = finalLocation;
                } else if (parsedLocationDetails.region) {
                    // Only fall back to region if nothing more specific
                    finalLocation = parsedLocationDetails.region;
                    specificLocation = parsedLocationDetails.originalInput || locationAnswer;
                } else {
                    // If parsing completely failed, use the original input
                    finalLocation = locationAnswer;
                    specificLocation = locationAnswer;
                }
            } else {
                // Already parsed
                finalLocation = locationAnswer;
            }
        }
        
        // Debug logging
        console.log('=== LOCATION PROCESSING DEBUG ===');
        console.log('Original Input:', this.originalInput);
        console.log('Parsed Data:', this.parsedData);
        console.log('Location Details:', parsedLocationDetails);
        console.log('Final Location:', finalLocation);
        console.log('Specific Location:', specificLocation);
        console.log('================================');
        
        return {
            originalInput: this.originalInput,
            trekType: this.quizAnswers['trek-type'] || this.parsedData.trekType || 'multi-day',
            trekLength: this.quizAnswers['trek-length'] || this.parsedData.duration || '6-8',
            location: finalLocation,
            specificLocation: specificLocation || finalLocation, // Ensure we always have specific location
            locationDetails: parsedLocationDetails || this.parsedData.locationDetails || {},
            difficulty: this.quizAnswers.difficulty || this.parsedData.difficulty || 'moderate',
            accommodation: this.quizAnswers.accommodation || this.parsedData.accommodation || 'mixed',
            season: this.quizAnswers.season || this.parsedData.season || 'summer',
            interests: this.quizAnswers.interests || [],
            details: this.quizAnswers.details || ''
        };
    }
}