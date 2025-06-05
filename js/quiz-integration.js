// js/quiz-integration.js

import { QuizManager } from './modules/quizManager.js';

// Initialize quiz manager
const quizManager = new QuizManager();

// Autocomplete state
let autocompleteTimeout = null;
let selectedSuggestionIndex = -1;

// Global functions that need to be accessible from HTML
window.selectOption = function(question, value) {
    quizManager.quizAnswers[question] = value;
    
    // Special handling for trek-type selection
    if (question === 'trek-type') {
        // Regenerate questions based on the selection
        if (value === 'day-hike') {
            // Remove trek-length and accommodation from remaining questions
            const currentIndex = quizManager.questionsToShow.indexOf('trek-type');
            const remainingQuestions = quizManager.questionsToShow.slice(currentIndex + 1);
            
            // Filter out trek-length and accommodation
            const filteredQuestions = remainingQuestions.filter(q => 
                q !== 'trek-length' && q !== 'accommodation'
            );
            
            // Update the questions array
            quizManager.questionsToShow = [
                ...quizManager.questionsToShow.slice(0, currentIndex + 1),
                ...filteredQuestions
            ];
        } else if (value === 'multi-day') {
            // Make sure trek-length and accommodation are included if they were removed
            const currentIndex = quizManager.questionsToShow.indexOf('trek-type');
            const remainingQuestions = quizManager.questionsToShow.slice(currentIndex + 1);
            
            // Check if trek-length is missing and should be added
            if (!remainingQuestions.includes('trek-length') && 
                !quizManager.parsedData.duration &&
                quizManager.questionTemplates['trek-length']) {
                remainingQuestions.unshift('trek-length');
            }
            
            // Check if accommodation is missing and should be added
            if (!remainingQuestions.includes('accommodation') && 
                !quizManager.parsedData.accommodation &&
                quizManager.questionTemplates['accommodation']) {
                // Find appropriate position for accommodation (after difficulty, before season)
                const difficultyIndex = remainingQuestions.indexOf('difficulty');
                const seasonIndex = remainingQuestions.indexOf('season');
                
                if (difficultyIndex !== -1 && seasonIndex !== -1) {
                    remainingQuestions.splice(difficultyIndex + 1, 0, 'accommodation');
                } else if (difficultyIndex !== -1) {
                    remainingQuestions.splice(difficultyIndex + 1, 0, 'accommodation');
                } else {
                    // Add before interests
                    const interestsIndex = remainingQuestions.indexOf('interests');
                    if (interestsIndex !== -1) {
                        remainingQuestions.splice(interestsIndex, 0, 'accommodation');
                    } else {
                        remainingQuestions.push('accommodation');
                    }
                }
            }
            
            // Update the questions array
            quizManager.questionsToShow = [
                ...quizManager.questionsToShow.slice(0, currentIndex + 1),
                ...remainingQuestions
            ];
        }
    }
    
    setTimeout(nextQuestion, 300);
};

window.toggleInterest = function(value) {
    if (!quizManager.quizAnswers.interests) quizManager.quizAnswers.interests = [];
    const index = quizManager.quizAnswers.interests.indexOf(value);
    if (index > -1) {
        quizManager.quizAnswers.interests.splice(index, 1);
    } else {
        quizManager.quizAnswers.interests.push(value);
    }
    renderQuestion();
};

window.updateTextAnswer = function(question) {
    const textarea = document.getElementById('detailsInput');
    quizManager.quizAnswers[question] = textarea.value;
};

// Location-specific functions
window.updateLocationAnswer = function(question) {
    const input = document.getElementById('locationInput');
    const value = input.value.trim();
    
    if (value) {
        // Parse the location to see if we recognize it
        const locationResult = quizManager.locationParser.parseLocation(value);
        quizManager.quizAnswers[question] = value;
        
        // Show a subtle indicator if we recognized the location
        if (locationResult.region) {
            input.classList.add('recognized');
            showLocationRecognition(locationResult);
        } else {
            input.classList.remove('recognized');
            hideSuggestions();
        }
    } else {
        input.classList.remove('recognized');
        hideSuggestions();
    }
};

window.handleLocationInput = function(event) {
    const value = event.target.value;
    
    // Clear previous timeout
    clearTimeout(autocompleteTimeout);
    
    // Reset suggestion selection
    selectedSuggestionIndex = -1;
    
    if (value.length >= 2) {
        // Debounce autocomplete
        autocompleteTimeout = setTimeout(() => {
            showAutocompleteSuggestions(value);
        }, 200);
    } else {
        hideSuggestions();
    }
    
    // Update the answer
    updateLocationAnswer('location');
};

window.handleLocationKeydown = function(event) {
    const suggestionsContainer = document.getElementById('locationSuggestions');
    const suggestions = suggestionsContainer.querySelectorAll('.suggestion-item');
    
    if (event.key === 'Enter') {
        event.preventDefault();
        if (selectedSuggestionIndex >= 0 && suggestions[selectedSuggestionIndex]) {
            // Select the highlighted suggestion
            selectLocationSuggestion(suggestions[selectedSuggestionIndex].dataset.value);
        } else {
            // Just go to next question with current value
            const value = event.target.value.trim();
            if (value) {
                nextQuestion();
            }
        }
    } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (suggestions.length > 0) {
            selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
            updateSuggestionHighlight(suggestions);
        }
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (suggestions.length > 0) {
            selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, -1);
            updateSuggestionHighlight(suggestions);
        }
    } else if (event.key === 'Escape') {
        hideSuggestions();
        selectedSuggestionIndex = -1;
    }
};

window.selectSurpriseMe = function(question) {
    quizManager.quizAnswers[question] = 'anywhere';
    document.getElementById('locationInput').value = '';
    document.getElementById('locationInput').classList.remove('recognized');
    hideSuggestions();
    renderQuestion(); // Re-render to show selected state
    setTimeout(nextQuestion, 300);
};

window.selectTrendingDestination = function(destination) {
    document.getElementById('locationInput').value = destination;
    updateLocationAnswer('location');
    hideSuggestions();
    // Small delay for visual feedback
    setTimeout(nextQuestion, 200);
};

window.selectLocationSuggestion = function(value) {
    document.getElementById('locationInput').value = value;
    updateLocationAnswer('location');
    hideSuggestions();
    // Small delay for visual feedback
    setTimeout(nextQuestion, 200);
};

window.nextQuestion = function() {
    if (quizManager.currentQuestion < quizManager.questionsToShow.length - 1) {
        quizManager.currentQuestion++;
        renderQuestion();
    } else {
        submitQuiz();
    }
};

window.previousQuestion = function() {
    if (quizManager.currentQuestion > 0) {
        quizManager.currentQuestion--;
        renderQuestion();
    }
};

window.closeQuizModal = function() {
    document.getElementById('quizModal').classList.remove('active');
    document.body.style.overflow = 'auto';
};

// Helper functions
function showAutocompleteSuggestions(input) {
    const suggestions = quizManager.getLocationSuggestions(input);
    const container = document.getElementById('locationSuggestions');
    
    if (suggestions.length > 0) {
        let html = '<div class="suggestions-dropdown">';
        suggestions.forEach((suggestion, index) => {
            // Remove icons from dropdown suggestions
            html += `
                <div class="suggestion-item ${index === selectedSuggestionIndex ? 'highlighted' : ''}" 
                     data-value="${suggestion.value}"
                     onmouseover="highlightSuggestion(${index})"
                     onclick="selectLocationSuggestion('${suggestion.value}')">
                    <span>${suggestion.display}</span>
                </div>
            `;
        });
        html += '</div>';
        container.innerHTML = html;
        container.style.display = 'block';
    } else {
        hideSuggestions();
    }
}

window.highlightSuggestion = function(index) {
    selectedSuggestionIndex = index;
    const suggestions = document.querySelectorAll('.suggestion-item');
    updateSuggestionHighlight(suggestions);
};

function updateSuggestionHighlight(suggestions) {
    suggestions.forEach((item, index) => {
        if (index === selectedSuggestionIndex) {
            item.classList.add('highlighted');
        } else {
            item.classList.remove('highlighted');
        }
    });
}

function hideSuggestions() {
    const container = document.getElementById('locationSuggestions');
    container.style.display = 'none';
    container.innerHTML = '';
}

function showLocationRecognition(locationResult) {
    const suggestionsDiv = document.getElementById('locationSuggestions');
    let message = '';
    
    if (locationResult.specificArea) {
        message = `✓ Found ${locationResult.specificArea}`;
    } else if (locationResult.city) {
        message = `✓ Found ${locationResult.city}, ${locationResult.country}`;
    } else if (locationResult.state) {
        message = `✓ Found ${locationResult.state}, ${locationResult.country}`;
    } else if (locationResult.country) {
        message = `✓ Found ${locationResult.country}`;
    } else if (locationResult.region) {
        const regionNames = {
            'europe': 'Europe',
            'asia': 'Asia',
            'americas': 'The Americas',
            'oceania': 'Oceania',
            'africa': 'Africa'
        };
        message = `✓ Found in ${regionNames[locationResult.region] || locationResult.region}`;
    } else if (locationResult.originalInput) {
        message = `✓ Will search for treks near "${locationResult.originalInput}"`;
    }
    
    if (message) {
        suggestionsDiv.innerHTML = `<div class="recognition-message">${message}</div>`;
        suggestionsDiv.style.display = 'block';
    }
}

// Render current question
function renderQuestion() {
    const container = document.getElementById('questionContainer');
    const questionKey = quizManager.questionsToShow[quizManager.currentQuestion];
    const question = quizManager.questionTemplates[questionKey];
    
    if (!question) return;
    
    let html = `
        <div class="question-slide active">
            <h3 class="text-xl font-semibold mb-4">${question.title}</h3>
    `;
    
    if (question.type === 'single') {
        html += '<div class="options-grid">';
        question.options.forEach(option => {
            const isSelected = quizManager.quizAnswers[questionKey] === option.value;
            // Determine icon color class based on value
            let iconColorClass = '';
            if (option.value === 'day-hike') iconColorClass = 'icon-dayhike';
            else if (option.value === 'multi-day') iconColorClass = 'icon-multiday';
            else if (option.value === '3-5' || option.value === '6-8' || option.value === '9-14' || option.value === '15+') iconColorClass = 'icon-calendar';
            else if (option.value === 'spring') iconColorClass = 'icon-spring';
            else if (option.value === 'summer') iconColorClass = 'icon-summer';
            else if (option.value === 'autumn') iconColorClass = 'icon-autumn';
            else if (option.value === 'winter') iconColorClass = 'icon-winter';
            else if (option.value === 'easy') iconColorClass = 'icon-easy';
            else if (option.value === 'moderate') iconColorClass = 'icon-moderate';
            else if (option.value === 'challenging') iconColorClass = 'icon-challenging';
            else if (option.value === 'any') iconColorClass = 'icon-globe';
            else if (option.value === 'europe' || option.value === 'asia' || option.value === 'americas' || option.value === 'oceania') iconColorClass = 'icon-mountain';
            else if (option.value === 'africa') iconColorClass = 'icon-tree';
            else if (option.value === 'camping') iconColorClass = 'icon-camping';
            else if (option.value === 'huts') iconColorClass = 'icon-huts';
            else if (option.value === 'lodges') iconColorClass = 'icon-bed';
            else if (option.value === 'mixed') iconColorClass = 'icon-mixed';
            
            html += `
                <button class="option-button ${isSelected ? 'selected' : ''}" 
                        onclick="selectOption('${questionKey}', '${option.value}')">
                    ${option.icon ? `<i class="option-icon fas ${option.icon} ${iconColorClass}"></i>` : ''}
                    <div class="option-content">
                        <div class="option-title">${option.title}</div>
                        ${option.description ? `<div class="option-description">${option.description}</div>` : ''}
                    </div>
                </button>
            `;
        });
        html += '</div>';
    } else if (question.type === 'multi') {
        html += '<div class="interests-grid">';
        question.options.forEach(option => {
            const isSelected = (quizManager.quizAnswers[questionKey] || []).includes(option.value);
            html += `
                <button class="interest-button ${isSelected ? 'selected' : ''}" 
                        onclick="toggleInterest('${option.value}')">
                    <i class="fas ${option.icon}"></i>
                    <span>${option.title}</span>
                </button>
            `;
        });
        html += '</div>';
    } else if (question.type === 'text') {
        html += `
            <textarea class="text-input" 
                      id="detailsInput" 
                      placeholder="Share any other preferences: budget, group size, must-see places, fitness level, dietary needs, or special interests..."
                      onchange="updateTextAnswer('${questionKey}')">${quizManager.quizAnswers[questionKey] || ''}</textarea>
        `;
    } else if (question.type === 'location-input') {
        const randomExample = question.examples[Math.floor(Math.random() * question.examples.length)];
        const currentValue = quizManager.quizAnswers[questionKey] || '';
        const isAnywhere = currentValue === 'anywhere';
        
        html += `
            <div class="location-input-container">
                <input 
                    type="text" 
                    id="locationInput" 
                    class="location-text-input" 
                    placeholder="${question.placeholder}"
                    value="${isAnywhere ? '' : currentValue}"
                    oninput="handleLocationInput(event)"
                    onkeydown="handleLocationKeydown(event)"
                    onfocus="handleLocationInput(event)"
                />
                <div class="location-helper-text">
                    <i class="fas fa-lightbulb text-gray-400"></i>
                    <span>Try "${randomExample}" or be as specific as you like</span>
                </div>
                
                <div id="locationSuggestions" class="location-suggestions"></div>
                
                <div class="divider-with-text">
                    <span>OR</span>
                </div>
                
                <button 
                    class="surprise-me-button ${isAnywhere ? 'selected' : ''}"
                    onclick="selectSurpriseMe('${questionKey}')"
                >
                    <i class="fas fa-globe-americas"></i>
                    <span>${question.surpriseText}</span>
                    <i class="fas fa-sparkles"></i>
                </button>
                
                ${question.trendingDestinations ? `
                    <div class="trending-destinations">
                        <span class="trending-label">Trending:</span>
                        ${question.trendingDestinations.map(dest => `
                            <button class="trend-tag" onclick="selectTrendingDestination('${dest}')">
                                ${dest}
                            </button>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
    // Focus on location input if it's a location question
    if (question.type === 'location-input') {
        setTimeout(() => {
            const input = document.getElementById('locationInput');
            if (input) input.focus();
        }, 100);
    }
    
    // Update navigation
    updateNavigation();
    updateProgress();
}

function updateNavigation() {
    const backBtn = document.getElementById('backBtn');
    const nextBtn = document.getElementById('nextBtn');
    
    backBtn.style.visibility = quizManager.currentQuestion === 0 ? 'hidden' : 'visible';
    
    const isLastQuestion = quizManager.currentQuestion === quizManager.questionsToShow.length - 1;
    if (isLastQuestion) {
        nextBtn.innerHTML = '<i class="fas fa-sparkles"></i> Generate Itinerary';
        nextBtn.classList.add('generate');
    } else {
        nextBtn.innerHTML = 'Next <i class="fas fa-arrow-right"></i>';
        nextBtn.classList.remove('generate');
    }
}

function updateProgress() {
    const progress = ((quizManager.currentQuestion + 1) / quizManager.questionsToShow.length) * 100;
    document.getElementById('progressBar').style.width = `${progress}%`;
}

function openQuizModal() {
    document.getElementById('quizModal').classList.add('active');
    document.body.style.overflow = 'hidden';
    renderQuestion();
}

function submitQuiz() {
    const combinedData = quizManager.getCombinedData();
    
    // Store in localStorage
    localStorage.setItem('quizData', JSON.stringify(combinedData));
    localStorage.setItem('userLocation', quizManager.originalInput);
    
    // Navigate to customize page
    window.location.href = 'customize.html';
}

// Form submission handler
document.getElementById("itinerary-form").addEventListener("submit", function (e) {
    e.preventDefault();
    
    const userInput = document.getElementById("user-input").value.trim();
    const result = quizManager.initializeQuiz(userInput);
    
    // Display parsed information if any
    if (result.parsedData.locationDetails && result.parsedData.locationDetails.city) {
        console.log('Detected location:', result.parsedData.locationDetails);
    }
    
    if (result.needsQuiz) {
        openQuizModal();
    } else {
        // All information captured - go directly to results
        submitQuiz();
    }
});

// Close modal on backdrop click
document.getElementById('quizModal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeQuizModal();
    }
});

// Escape key to close modal
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && document.getElementById('quizModal').classList.contains('active')) {
        closeQuizModal();
    }
});