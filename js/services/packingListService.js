// packingListService.js

export class AdaptivePackingListGenerator {
    // ✅ FIX: Reverted to the original generic constructor
    constructor(basicInputs, advancedInputs) {
        this.basic = basicInputs;
        this.advanced = advancedInputs;
        this.items = {};
        this.inputDepth = this._calculateInputDepth();
    }

    // NEW: Internal mapper to translate quiz data into the format the generator needs
    _mapQuizDataToInputs(quizData) {
        // --- Basic Inputs Mapping ---
        const tripStyleMapping = {
            '1-3': 'camping-short',
            '4-7': 'hut-trek',
            '8+': 'expedition',
            'day-hike': 'day'
        };

        // This mapping is an example; you might need to adjust based on your quiz's location/terrain values
        const terrainMapping = {
            'mountains': 'alpine',
            'forest': 'forest',
            'coast': 'coastal',
            'desert': 'desert',
            'jungle': 'jungle',
            'any': 'alpine' // Default for 'surprise me' or 'any'
        };
        
        const weatherMapping = {
            'spring': 'sunny-cold',
            'summer': 'sunny-warm',
            'autumn': 'rainy',
            'winter': 'snow'
        };

        const basic = {
            tripStyle: tripStyleMapping[quizData.length] || tripStyleMapping[quizData.trekType] || 'camping-short',
            terrain: terrainMapping[quizData.terrain] || 'alpine', // Default to alpine if no match
            weather: weatherMapping[quizData.season] || 'sunny-cold',
            specialNeeds: quizData.interests || []
        };

        // --- Advanced Inputs (derived from basic quiz data) ---
        const advanced = {
            temperature: { specified: false, dayHigh: null, nightLow: null },
            elevation: { specified: false, start: null, max: null, camp: null },
            physical: { specified: false, dailyDistance: '', elevationGain: '' },
            logistics: { specified: false, waterSources: '', resupplyFreq: '' },
            accommodation: { 
                types: quizData.accommodation ? [quizData.accommodation] : [],
                specified: !!quizData.accommodation
            },
            activities: {
                photography: (quizData.interests || []).includes('photography'),
                wildlife: (quizData.interests || []).includes('wildlife'),
                scrambling: (quizData.interests || []).includes('scrambling'),
                swimming: (quizData.interests || []).includes('swimming'),
                stargazing: (quizData.interests || []).includes('stargazing'),
                specified: (quizData.interests || []).length > 0
            },
            group: { specified: false, size: '', experience: '' },
            preferences: { specified: false, ultralight: false, comfort: false, safety: false, minimalist: false },
            context: ''
        };

        return { basic, advanced };
    }

    _calculateInputDepth() {
        let depth = 0;
        let maxDepth = 3; // Start with the 3 basic inputs
        
        if (this.basic.tripStyle) depth++;
        if (this.basic.terrain) depth++;
        if (this.basic.weather) depth++;
        
        // Dynamically count potential advanced categories
        Object.values(this.advanced).forEach(category => {
            if (typeof category === 'object' && category !== null && 'specified' in category) {
                maxDepth++;
                if (category.specified) {
                    depth++;
                }
            }
        });
        
        const percentage = maxDepth > 0 ? Math.round((depth / maxDepth) * 100) : 0;
        let level = 'basic';
        if (percentage > 75) {
            level = 'detailed';
        } else if (percentage > 40) {
            level = 'intermediate';
        }

        return { score: depth, percentage, level };
    }

    generate() {
        this.addBaseItems();
        
        if (this.inputDepth.level !== 'basic') {
            this.applyAdvancedAdjustments();
        }
        
        return this.categorizeAndAnnotate();
    }

    addBaseItems() {
        const duration = this.getTripDuration();
        
        const categories = ['clothing', 'footwear', 'camping', 'navigation', 'safety', 'personal', 'food', 'optional'];
        categories.forEach(cat => { this.items[cat] = []; });
        
        this.addClothing(duration);
        this.addFootwear(duration);
        this.addCampingGear(duration);
        this.addNavigationTools();
        this.addSafetyEquipment(duration);
        this.addPersonalCare(duration);
        this.addFood(duration);
        this.addOptionalItems(duration);
    }

    getTripDuration() {
        const durations = {
            'day': { days: 1, type: 'day' },
            'camping-short': { days: 3, type: 'camping' },
            'hut-trek': { days: 5, type: 'hut' },
            'expedition': { days: 10, type: 'expedition' }
        };
        return durations[this.basic.tripStyle] || { days: 1, type: 'day' };
    }

    addClothing(duration) {
        const isDetailed = this.inputDepth.level !== 'basic';
        
        if (isDetailed && this.advanced?.temperature?.specified) {
            const weight = this.calculateBaseLayerWeight();
            this.items.clothing.push({
                name: `Base layer top (${weight}weight)`,
                quantity: Math.min(Math.floor(duration.days / 2) + 1, 3),
                priority: 'essential',
                notes: `For temps: ${this.advanced.temperature.nightLow}°C to ${this.advanced.temperature.dayHigh}°C`
            });
        } else {
            this.items.clothing.push({
                name: 'Base layer top and bottom',
                quantity: isDetailed ? `${Math.min(Math.floor(duration.days / 2) + 1, 3)} sets` : 'As needed',
                priority: 'essential'
            });
        }
        
        this.items.clothing.push(
            { name: 'Trekking pants', quantity: duration.days > 3 ? 2 : 1, priority: 'essential' },
            { name: 'Quick-dry t-shirts', quantity: Math.min(duration.days + 1, 4), priority: 'essential' },
            { name: 'Underwear', quantity: duration.days + 2, priority: 'essential' },
            { name: 'Trekking socks', quantity: duration.days + 2, priority: 'essential' }
        );
        
        this.addWeatherClothing();
    }

    calculateBaseLayerWeight() {
        const avgTemp = (this.advanced.temperature.dayHigh + this.advanced.temperature.nightLow) / 2;
        if (avgTemp > 20) return 'ultra-light';
        if (avgTemp > 10) return 'light';
        if (avgTemp > 0) return 'mid';
        if (avgTemp > -10) return 'heavy';
        return 'expedition';
    }

    addWeatherClothing() {
        const weatherItems = {
            'sunny-warm': [
                { name: 'Sun hat with brim', priority: 'essential' },
                { name: 'Lightweight long-sleeve shirt (UV protection)', priority: 'important' },
                { name: 'Shorts', quantity: 2, priority: 'important' }
            ],
            'sunny-cold': [
                { name: 'Fleece jacket', priority: 'essential' },
                { name: 'Softshell jacket', priority: 'essential' },
                { name: 'Warm gloves', priority: 'essential' },
                { name: 'Beanie/warm hat', priority: 'essential' }
            ],
            'rainy': [
                { name: 'Rain jacket (waterproof)', priority: 'essential' },
                { name: 'Rain pants', priority: 'essential' },
                { name: 'Pack rain cover', priority: 'essential' },
                { name: 'Waterproof gloves', priority: 'important' }
            ],
            'snow': [
                { name: 'Insulated jacket', priority: 'essential' },
                { name: 'Fleece mid-layer', priority: 'essential' },
                { name: 'Thermal underwear', quantity: 2, priority: 'essential' },
                { name: 'Winter gloves + liner', priority: 'essential' },
                { name: 'Balaclava', priority: 'essential' }
            ]
        };
        const items = weatherItems[this.basic.weather] || [];
        items.forEach(item => this.items.clothing.push(item));
    }

    addFootwear(duration) {
        this.items.footwear.push({ name: 'Trekking boots (broken in)', priority: 'essential' });
        if (duration.days > 1) {
            this.items.footwear.push({ name: 'Camp shoes/sandals', priority: 'important' });
        }
        if (this.basic.specialNeeds.includes('river-crossing')) {
            this.items.footwear.push({ name: 'Water shoes for crossings', priority: 'essential' });
        }
        if (this.basic.terrain === 'glacier' || this.basic.weather === 'snow') {
            this.items.footwear.push({ name: 'Gaiters', priority: 'essential' });
        }
    }

    addCampingGear(duration) {
        const packSize = duration.days === 1 ? '20-30L daypack' :
                       duration.days <= 3 ? '40-50L backpack' :
                       duration.days <= 7 ? '60-70L backpack' :
                       '70-85L expedition pack';
        this.items.camping.push({ name: packSize, priority: 'essential' });
        if (duration.type === 'camping' || duration.type === 'expedition' || this.basic.accommodation === 'camping') {
            this.items.camping.push(
                { name: 'Tent (weather appropriate)', priority: 'essential' },
                { name: 'Sleeping bag', priority: 'essential', notes: this.getSleepingBagNotes() },
                { name: 'Sleeping pad', priority: 'essential' }
            );
        } else if (duration.type === 'hut' || this.basic.accommodation === 'huts') {
            this.items.camping.push(
                { name: 'Sleeping bag liner', priority: 'essential' },
                { name: 'Travel pillow', priority: 'nice-to-have' }
            );
        }
    }

    getSleepingBagNotes() {
        if (this.advanced.temperature.specified) {
            const rating = this.advanced.temperature.nightLow - 10;
            return `Rated to ${rating}°C`;
        }
        const ratings = {
            'sunny-warm': '10°C rating',
            'sunny-cold': '0°C rating',
            'rainy': '5°C rating',
            'snow': '-10°C or lower'
        };
        return ratings[this.basic.weather] || 'Season appropriate';
    }

    addNavigationTools() {
        this.items.navigation = [
            { name: 'Map and compass', priority: 'essential' },
            { name: 'GPS device or smartphone', priority: 'essential' },
            { name: 'Headlamp + extra batteries', priority: 'essential' },
            { name: 'Power bank', priority: 'important' }
        ];
        if (this.basic.specialNeeds.includes('remote-area')) {
            this.items.navigation.push({
                name: 'Satellite communicator',
                priority: 'essential',
                notes: 'For emergency communication'
            });
        }
    }

    addSafetyEquipment(duration) {
        this.items.safety = [
            { name: 'First aid kit', priority: 'essential' },
            { name: 'Personal medications', priority: 'essential' },
            { name: 'Sunscreen (SPF 50+)', priority: 'essential' },
            { name: 'Water bottles/hydration system', priority: 'essential', quantity: '3L capacity' },
            { name: 'Water purification', priority: 'essential' },
            { name: 'Emergency whistle', priority: 'essential' },
            { name: 'Multi-tool', priority: 'important' }
        ];
        if (this.advanced.elevation.specified && this.advanced.elevation.max > 3000) {
            this.items.safety.push({
                name: 'Altitude medication',
                priority: 'important',
                notes: `Max elevation: ${this.advanced.elevation.max}m`
            });
        }
        if (this.basic.specialNeeds.includes('scrambling') || (this.advanced.activities.specified && this.advanced.activities.scrambling)) {
            this.items.safety.push(
                { name: 'Climbing harness', priority: 'essential' },
                { name: 'Dynamic rope (30m)', priority: 'essential' },
                { name: 'Helmet', priority: 'essential' }
            );
        }
    }

    addPersonalCare(duration) {
        this.items.personal = [
            { name: 'Toiletries', priority: 'essential' },
            { name: 'Toilet paper + trowel', priority: 'essential' },
            { name: 'Hand sanitizer', priority: 'essential' },
            { name: 'Quick-dry towel', priority: 'important' }
        ];
        if (duration.days > 3) {
            this.items.personal.push({ name: 'Wet wipes', priority: 'important', quantity: 'Large pack' });
        }
    }

    addFood(duration) {
        if (this.basic.specialNeeds.includes('self-cooking') || duration.type === 'camping' || this.basic.accommodation === 'camping') {
             this.items.food.push(
                { name: 'Camping stove + fuel', priority: 'essential' },
                { name: 'Cookware set', priority: 'essential' }
            );
            this.items.food.push(
                { name: 'Breakfast items', quantity: `${duration.days + 1} days`, priority: 'essential' },
                { name: 'Lunch + snacks', quantity: `${duration.days + 1} days`, priority: 'essential' },
                { name: 'Dinner items', quantity: `${duration.days} days`, priority: 'essential' },
                { name: 'Emergency food', priority: 'important' }
            );
        } else {
            this.items.food = [
                { name: 'Trail snacks', priority: 'essential' },
                { name: 'Energy bars', priority: 'important' }
            ];
        }
        this.items.food.push({ name: 'Electrolyte powder', priority: 'important' });
    }

    addOptionalItems(duration) {
        this.items.optional = [{ name: 'Trekking poles', priority: 'nice-to-have' }];
        if (this.basic.specialNeeds.includes('photography') || (this.advanced.activities.specified && this.advanced.activities.photography)) {
            this.items.optional.push(
                { name: 'Camera protection', priority: 'important' },
                { name: 'Extra batteries/memory cards', priority: 'essential' },
                { name: 'Lens cleaning kit', priority: 'important' }
            );
        }
        if (duration.days > 3) {
            this.items.optional.push({ name: 'Entertainment (book/cards)', priority: 'nice-to-have' });
        }
    }

    applyAdvancedAdjustments() {
        if (this.advanced.temperature.specified) this.applyTemperatureAdjustments();
        if (this.advanced.physical.specified) this.applyPhysicalAdjustments();
        if (this.advanced.logistics.specified) this.applyLogisticsAdjustments();
        if (this.advanced.preferences.specified) this.applyPreferenceFilters();
    }

    applyTemperatureAdjustments() {
        const tempRange = this.advanced.temperature.dayHigh - this.advanced.temperature.nightLow;
        if (tempRange > 20) {
            this.items.clothing.push({ name: 'Versatile mid-layer (full-zip)', priority: 'essential', notes: `Temp range: ${tempRange}°C variation` });
        }
        if (this.advanced.temperature.nightLow < -10) {
            this.items.clothing.push({ name: 'Expedition parka', priority: 'essential', notes: `For ${this.advanced.temperature.nightLow}°C nights` });
        }
    }

    applyPhysicalAdjustments() {
        if (this.advanced.physical.dailyDistance === 'extreme' || this.advanced.physical.elevationGain === 'extreme') {
            this.items.personal.push({ name: 'Sports tape/blister kit', priority: 'essential', notes: 'High mileage protection' });
            this.items.food.forEach(item => {
                if (item.name.includes('snacks')) {
                    item.quantity = 'Extra portions';
                    item.notes = 'High calorie needs';
                }
            });
        }
    }

    applyLogisticsAdjustments() {
        if (this.advanced.logistics.waterSources === 'scarce' || this.advanced.logistics.waterSources === 'limited') {
            const waterItem = this.items.safety.find(item => item.name.includes('Water bottles'));
            if (waterItem) {
                waterItem.quantity = '5L+ capacity';
                waterItem.notes = 'Limited water sources';
            }
        }
        if (this.advanced.logistics.resupplyFreq === 'none') {
            this.items.food.forEach(item => {
                if (item.quantity) {
                    item.priority = 'essential';
                    item.notes = 'No resupply available';
                }
            });
        }
    }

    applyPreferenceFilters() {
        const prefs = this.advanced.preferences;
        if (prefs.ultralight) {
            Object.keys(this.items).forEach(category => {
                this.items[category].forEach(item => {
                    if (item.priority === 'nice-to-have') item.priority = 'optional';
                    if (item.name.includes('pack')) item.notes = (item.notes || '') + ' Consider ultralight version';
                });
            });
        }
        if (prefs.safety) {
            this.items.safety.push({ name: 'Backup navigation (maps/compass)', priority: 'important', notes: 'Redundancy for safety' });
        }
        if (prefs.minimalist) {
            Object.keys(this.items).forEach(category => {
                this.items[category] = this.items[category].filter(item => item.priority === 'essential' || item.priority === 'important');
            });
        }
    }

    categorizeAndAnnotate() {
        const totalItems = Object.values(this.items).flat().length;
        const specificityNotes = this.generateSpecificityNotes();
        return {
            items: this.items,
            metadata: {
                inputDepth: this.inputDepth,
                customizationLevel: this.getCustomizationLevel(),
                specificityNotes: specificityNotes,
                totalItems: totalItems
            }
        };
    }

    getCustomizationLevel() {
        const depth = this.inputDepth.percentage;
        if (depth < 30) return 'Generic recommendations';
        if (depth < 60) return 'Moderately customized';
        if (depth < 80) return 'Highly specific';
        return 'Ultra-specific to your conditions';
    }

    generateSpecificityNotes() {
        const notes = [];
        if (this.advanced.temperature.specified) {
            notes.push(`Optimized for ${this.advanced.temperature.nightLow}°C to ${this.advanced.temperature.dayHigh}°C`);
        }
        if (this.advanced.elevation.specified && this.advanced.elevation.max) {
            notes.push(`Adjusted for elevations up to ${this.advanced.elevation.max}m`);
        }
        if (this.advanced.physical.specified) {
            notes.push(`Configured for ${this.advanced.physical.dailyDistance || 'moderate'} daily distances`);
        }
        if (this.advanced.preferences.specified) {
            const activePrefs = Object.entries(this.advanced.preferences)
                .filter(([key, value]) => value && key !== 'specified')
                .map(([key]) => key);
            if (activePrefs.length > 0) {
                notes.push(`Filtered for: ${activePrefs.join(', ')} approach`);
            }
        }
        return notes;
    }
}