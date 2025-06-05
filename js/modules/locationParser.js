// js/modules/locationParser.js

export class LocationParser {
    constructor() {
        // Major cities mapped to their regions
        this.cities = {
            // UK Cities
            'london': { country: 'UK', region: 'europe', aliases: ['greater london'] },
            'edinburgh': { country: 'UK', region: 'europe', aliases: ['edinboro'] },
            'glasgow': { country: 'UK', region: 'europe', aliases: [] },
            'manchester': { country: 'UK', region: 'europe', aliases: [] },
            'birmingham': { country: 'UK', region: 'europe', aliases: [] },
            'liverpool': { country: 'UK', region: 'europe', aliases: [] },
            'bristol': { country: 'UK', region: 'europe', aliases: [] },
            'cardiff': { country: 'UK', region: 'europe', aliases: [] },
            'belfast': { country: 'UK', region: 'europe', aliases: [] },
            'york': { country: 'UK', region: 'europe', aliases: [] },
            'bath': { country: 'UK', region: 'europe', aliases: [] },
            'oxford': { country: 'UK', region: 'europe', aliases: [] },
            'cambridge': { country: 'UK', region: 'europe', aliases: [] },
            
            // Australian Cities
            'sydney': { country: 'Australia', region: 'oceania', aliases: [] },
            'melbourne': { country: 'Australia', region: 'oceania', aliases: [] },
            'brisbane': { country: 'Australia', region: 'oceania', aliases: [] },
            'perth': { country: 'Australia', region: 'oceania', aliases: [] },
            'adelaide': { country: 'Australia', region: 'oceania', aliases: [] },
            'canberra': { country: 'Australia', region: 'oceania', aliases: [] },
            'hobart': { country: 'Australia', region: 'oceania', aliases: [] },
            'darwin': { country: 'Australia', region: 'oceania', aliases: [] },
            'cairns': { country: 'Australia', region: 'oceania', aliases: [] },
            'gold coast': { country: 'Australia', region: 'oceania', aliases: [] },
            
            // New Zealand Cities
            'auckland': { country: 'New Zealand', region: 'oceania', aliases: [] },
            'wellington': { country: 'New Zealand', region: 'oceania', aliases: [] },
            'christchurch': { country: 'New Zealand', region: 'oceania', aliases: [] },
            'queenstown': { country: 'New Zealand', region: 'oceania', aliases: [] },
            'dunedin': { country: 'New Zealand', region: 'oceania', aliases: [] },
            
            // European Cities
            'paris': { country: 'France', region: 'europe', aliases: [] },
            'lyon': { country: 'France', region: 'europe', aliases: [] },
            'marseille': { country: 'France', region: 'europe', aliases: [] },
            'nice': { country: 'France', region: 'europe', aliases: [] },
            'chamonix': { country: 'France', region: 'europe', aliases: [] },
            'berlin': { country: 'Germany', region: 'europe', aliases: [] },
            'munich': { country: 'Germany', region: 'europe', aliases: ['münchen'] },
            'frankfurt': { country: 'Germany', region: 'europe', aliases: [] },
            'hamburg': { country: 'Germany', region: 'europe', aliases: [] },
            'cologne': { country: 'Germany', region: 'europe', aliases: ['köln'] },
            'rome': { country: 'Italy', region: 'europe', aliases: ['roma'] },
            'milan': { country: 'Italy', region: 'europe', aliases: ['milano'] },
            'venice': { country: 'Italy', region: 'europe', aliases: ['venezia'] },
            'florence': { country: 'Italy', region: 'europe', aliases: ['firenze'] },
            'naples': { country: 'Italy', region: 'europe', aliases: ['napoli'] },
            'madrid': { country: 'Spain', region: 'europe', aliases: [] },
            'barcelona': { country: 'Spain', region: 'europe', aliases: [] },
            'seville': { country: 'Spain', region: 'europe', aliases: ['sevilla'] },
            'valencia': { country: 'Spain', region: 'europe', aliases: [] },
            'lisbon': { country: 'Portugal', region: 'europe', aliases: ['lisboa'] },
            'porto': { country: 'Portugal', region: 'europe', aliases: [] },
            'amsterdam': { country: 'Netherlands', region: 'europe', aliases: [] },
            'brussels': { country: 'Belgium', region: 'europe', aliases: ['bruxelles'] },
            'vienna': { country: 'Austria', region: 'europe', aliases: ['wien'] },
            'innsbruck': { country: 'Austria', region: 'europe', aliases: [] },
            'zurich': { country: 'Switzerland', region: 'europe', aliases: ['zürich'] },
            'geneva': { country: 'Switzerland', region: 'europe', aliases: ['genève'] },
            'interlaken': { country: 'Switzerland', region: 'europe', aliases: [] },
            'zermatt': { country: 'Switzerland', region: 'europe', aliases: [] },
            'oslo': { country: 'Norway', region: 'europe', aliases: [] },
            'bergen': { country: 'Norway', region: 'europe', aliases: [] },
            'stockholm': { country: 'Sweden', region: 'europe', aliases: [] },
            'copenhagen': { country: 'Denmark', region: 'europe', aliases: ['københavn'] },
            'helsinki': { country: 'Finland', region: 'europe', aliases: [] },
            'reykjavik': { country: 'Iceland', region: 'europe', aliases: ['reykjavík'] },
            'dublin': { country: 'Ireland', region: 'europe', aliases: [] },
            'prague': { country: 'Czech Republic', region: 'europe', aliases: ['praha'] },
            'budapest': { country: 'Hungary', region: 'europe', aliases: [] },
            'krakow': { country: 'Poland', region: 'europe', aliases: ['kraków'] },
            'warsaw': { country: 'Poland', region: 'europe', aliases: ['warszawa'] },
            'athens': { country: 'Greece', region: 'europe', aliases: [] },
            'ljubljana': { country: 'Slovenia', region: 'europe', aliases: [] },
            
            // North American Cities
            'new york': { country: 'USA', region: 'americas', aliases: ['nyc', 'new york city'] },
            'los angeles': { country: 'USA', region: 'americas', aliases: ['la'] },
            'chicago': { country: 'USA', region: 'americas', aliases: [] },
            'san francisco': { country: 'USA', region: 'americas', aliases: ['sf'] },
            'seattle': { country: 'USA', region: 'americas', aliases: [] },
            'portland': { country: 'USA', region: 'americas', aliases: [] },
            'denver': { country: 'USA', region: 'americas', aliases: [] },
            'salt lake city': { country: 'USA', region: 'americas', aliases: [] },
            'las vegas': { country: 'USA', region: 'americas', aliases: ['vegas'] },
            'phoenix': { country: 'USA', region: 'americas', aliases: [] },
            'austin': { country: 'USA', region: 'americas', aliases: [] },
            'houston': { country: 'USA', region: 'americas', aliases: [] },
            'dallas': { country: 'USA', region: 'americas', aliases: [] },
            'miami': { country: 'USA', region: 'americas', aliases: [] },
            'boston': { country: 'USA', region: 'americas', aliases: [] },
            'washington': { country: 'USA', region: 'americas', aliases: ['washington dc', 'dc'] },
            'atlanta': { country: 'USA', region: 'americas', aliases: [] },
            'nashville': { country: 'USA', region: 'americas', aliases: [] },
            'anchorage': { country: 'USA', region: 'americas', aliases: [] },
            'toronto': { country: 'Canada', region: 'americas', aliases: [] },
            'vancouver': { country: 'Canada', region: 'americas', aliases: [] },
            'montreal': { country: 'Canada', region: 'americas', aliases: ['montréal'] },
            'calgary': { country: 'Canada', region: 'americas', aliases: [] },
            'ottawa': { country: 'Canada', region: 'americas', aliases: [] },
            'quebec city': { country: 'Canada', region: 'americas', aliases: ['québec'] },
            'banff': { country: 'Canada', region: 'americas', aliases: [] },
            'jasper': { country: 'Canada', region: 'americas', aliases: [] },
            
            // South American Cities
            'lima': { country: 'Peru', region: 'americas', aliases: [] },
            'cusco': { country: 'Peru', region: 'americas', aliases: ['cuzco'] },
            'santiago': { country: 'Chile', region: 'americas', aliases: [] },
            'buenos aires': { country: 'Argentina', region: 'americas', aliases: [] },
            'mendoza': { country: 'Argentina', region: 'americas', aliases: [] },
            'bariloche': { country: 'Argentina', region: 'americas', aliases: [] },
            'el calafate': { country: 'Argentina', region: 'americas', aliases: [] },
            'ushuaia': { country: 'Argentina', region: 'americas', aliases: [] },
            'rio de janeiro': { country: 'Brazil', region: 'americas', aliases: ['rio'] },
            'sao paulo': { country: 'Brazil', region: 'americas', aliases: ['são paulo'] },
            'bogota': { country: 'Colombia', region: 'americas', aliases: ['bogotá'] },
            'quito': { country: 'Ecuador', region: 'americas', aliases: [] },
            'la paz': { country: 'Bolivia', region: 'americas', aliases: [] },
            'caracas': { country: 'Venezuela', region: 'americas', aliases: [] },
            
            // Asian Cities
            'tokyo': { country: 'Japan', region: 'asia', aliases: [] },
            'kyoto': { country: 'Japan', region: 'asia', aliases: [] },
            'osaka': { country: 'Japan', region: 'asia', aliases: [] },
            'sapporo': { country: 'Japan', region: 'asia', aliases: [] },
            'seoul': { country: 'South Korea', region: 'asia', aliases: [] },
            'beijing': { country: 'China', region: 'asia', aliases: ['peking'] },
            'shanghai': { country: 'China', region: 'asia', aliases: [] },
            'hong kong': { country: 'China', region: 'asia', aliases: [] },
            'taipei': { country: 'Taiwan', region: 'asia', aliases: [] },
            'singapore': { country: 'Singapore', region: 'asia', aliases: [] },
            'bangkok': { country: 'Thailand', region: 'asia', aliases: [] },
            'chiang mai': { country: 'Thailand', region: 'asia', aliases: [] },
            'kuala lumpur': { country: 'Malaysia', region: 'asia', aliases: ['kl'] },
            'jakarta': { country: 'Indonesia', region: 'asia', aliases: [] },
            'manila': { country: 'Philippines', region: 'asia', aliases: [] },
            'hanoi': { country: 'Vietnam', region: 'asia', aliases: [] },
            'ho chi minh city': { country: 'Vietnam', region: 'asia', aliases: ['saigon'] },
            'phnom penh': { country: 'Cambodia', region: 'asia', aliases: [] },
            'vientiane': { country: 'Laos', region: 'asia', aliases: [] },
            'yangon': { country: 'Myanmar', region: 'asia', aliases: ['rangoon'] },
            'kathmandu': { country: 'Nepal', region: 'asia', aliases: [] },
            'delhi': { country: 'India', region: 'asia', aliases: ['new delhi'] },
            'mumbai': { country: 'India', region: 'asia', aliases: ['bombay'] },
            'bangalore': { country: 'India', region: 'asia', aliases: ['bengaluru'] },
            'kolkata': { country: 'India', region: 'asia', aliases: ['calcutta'] },
            'colombo': { country: 'Sri Lanka', region: 'asia', aliases: [] },
            'islamabad': { country: 'Pakistan', region: 'asia', aliases: [] },
            'karachi': { country: 'Pakistan', region: 'asia', aliases: [] },
            'thimphu': { country: 'Bhutan', region: 'asia', aliases: [] },
            
            // African Cities
            'cairo': { country: 'Egypt', region: 'africa', aliases: [] },
            'marrakech': { country: 'Morocco', region: 'africa', aliases: ['marrakesh'] },
            'casablanca': { country: 'Morocco', region: 'africa', aliases: [] },
            'cape town': { country: 'South Africa', region: 'africa', aliases: [] },
            'johannesburg': { country: 'South Africa', region: 'africa', aliases: ['joburg'] },
            'durban': { country: 'South Africa', region: 'africa', aliases: [] },
            'nairobi': { country: 'Kenya', region: 'africa', aliases: [] },
            'dar es salaam': { country: 'Tanzania', region: 'africa', aliases: [] },
            'arusha': { country: 'Tanzania', region: 'africa', aliases: [] },
            'addis ababa': { country: 'Ethiopia', region: 'africa', aliases: [] },
            'kampala': { country: 'Uganda', region: 'africa', aliases: [] },
            'kigali': { country: 'Rwanda', region: 'africa', aliases: [] },
            'windhoek': { country: 'Namibia', region: 'africa', aliases: [] },
            'gaborone': { country: 'Botswana', region: 'africa', aliases: [] },
            'maputo': { country: 'Mozambique', region: 'africa', aliases: [] },
            'antananarivo': { country: 'Madagascar', region: 'africa', aliases: ['tana'] }
        };
        
        // States/Provinces mapped to their countries
        this.states = {
            // US States
            'california': { country: 'USA', region: 'americas' },
            'colorado': { country: 'USA', region: 'americas' },
            'utah': { country: 'USA', region: 'americas' },
            'arizona': { country: 'USA', region: 'americas' },
            'nevada': { country: 'USA', region: 'americas' },
            'washington': { country: 'USA', region: 'americas' },
            'oregon': { country: 'USA', region: 'americas' },
            'montana': { country: 'USA', region: 'americas' },
            'wyoming': { country: 'USA', region: 'americas' },
            'idaho': { country: 'USA', region: 'americas' },
            'alaska': { country: 'USA', region: 'americas' },
            'hawaii': { country: 'USA', region: 'americas' },
            'new mexico': { country: 'USA', region: 'americas' },
            'texas': { country: 'USA', region: 'americas' },
            'new york': { country: 'USA', region: 'americas' },
            'vermont': { country: 'USA', region: 'americas' },
            'new hampshire': { country: 'USA', region: 'americas' },
            'maine': { country: 'USA', region: 'americas' },
            'north carolina': { country: 'USA', region: 'americas' },
            'tennessee': { country: 'USA', region: 'americas' },
            'virginia': { country: 'USA', region: 'americas' },
            'west virginia': { country: 'USA', region: 'americas' },
            
            // Canadian Provinces
            'british columbia': { country: 'Canada', region: 'americas' },
            'alberta': { country: 'Canada', region: 'americas' },
            'ontario': { country: 'Canada', region: 'americas' },
            'quebec': { country: 'Canada', region: 'americas' },
            'nova scotia': { country: 'Canada', region: 'americas' },
            'newfoundland': { country: 'Canada', region: 'americas' },
            'yukon': { country: 'Canada', region: 'americas' },
            
            // Australian States
            'new south wales': { country: 'Australia', region: 'oceania' },
            'victoria': { country: 'Australia', region: 'oceania' },
            'queensland': { country: 'Australia', region: 'oceania' },
            'western australia': { country: 'Australia', region: 'oceania' },
            'south australia': { country: 'Australia', region: 'oceania' },
            'tasmania': { country: 'Australia', region: 'oceania' },
            'northern territory': { country: 'Australia', region: 'oceania' }
        };
        
        // Location prepositions
        this.locationPrepositions = [
            'near', 'around', 'in', 'at', 'by', 'close to', 'nearby', 
            'outside', 'from', 'within', 'surrounding'
        ];
    }
    
    /**
     * Parse location from input text
     * @param {string} input - User input text
     * @returns {Object} - { region: string|null, city: string|null, country: string|null, isSpecific: boolean }
     */
    parseLocation(input) {
        const lowerInput = input.toLowerCase();
        const result = {
            region: null,
            city: null,
            country: null,
            state: null,
            isSpecific: false
        };
        
        // Check for cities (including aliases)
        for (const [city, data] of Object.entries(this.cities)) {
            if (lowerInput.includes(city)) {
                result.city = city;
                result.country = data.country;
                result.region = data.region;
                result.isSpecific = true;
                return result;
            }
            
            // Check aliases
            for (const alias of data.aliases) {
                if (lowerInput.includes(alias)) {
                    result.city = city;
                    result.country = data.country;
                    result.region = data.region;
                    result.isSpecific = true;
                    return result;
                }
            }
        }
        
        // Check for states/provinces
        for (const [state, data] of Object.entries(this.states)) {
            if (lowerInput.includes(state)) {
                result.state = state;
                result.country = data.country;
                result.region = data.region;
                result.isSpecific = true;
                return result;
            }
        }
        
        // Check if location prepositions are used with any word
        // This helps catch cases like "near [unknown city]"
        for (const prep of this.locationPrepositions) {
            const regex = new RegExp(`${prep}\\s+(\\w+(?:\\s+\\w+)?)`, 'i');
            const match = lowerInput.match(regex);
            if (match) {
                // Even if we don't recognize the city, we know they specified a location
                result.isSpecific = true;
                // Try to extract the location name
                const locationName = match[1];
                // Check if it might be a city we don't have in our database
                if (locationName.length > 2 && !this.isCommonWord(locationName)) {
                    result.city = locationName;
                }
            }
        }
        
        return result;
    }
    
    /**
     * Check if a word is a common word (to filter out false positives)
     */
    isCommonWord(word) {
        const commonWords = [
            'the', 'a', 'an', 'me', 'here', 'there', 'home', 'work',
            'town', 'city', 'place', 'area', 'region', 'country'
        ];
        return commonWords.includes(word.toLowerCase());
    }
    
    /**
     * Fuzzy match helper for location names
     */
    fuzzyMatchLocation(input, target, threshold = 0.8) {
        const distance = this.levenshteinDistance(input.toLowerCase(), target.toLowerCase());
        const maxLen = Math.max(input.length, target.length);
        const similarity = 1 - (distance / maxLen);
        return similarity >= threshold;
    }
    
    /**
     * Levenshtein distance calculation
     */
    levenshteinDistance(a, b) {
        if (a.length === 0) return b.length;
        if (b.length === 0) return a.length;
        
        const matrix = [];
        for (let i = 0; i <= b.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= a.length; j++) {
            matrix[0][j] = j;
        }
        
        for (let i = 1; i <= b.length; i++) {
            for (let j = 1; j <= a.length; j++) {
                if (b.charAt(i - 1) === a.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }
        
        return matrix[b.length][a.length];
    }
}