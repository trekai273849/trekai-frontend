// js/quiz-integration.js

import { QuizManager } from './modules/quizManager.js';

// Initialize quiz manager
const quizManager = new QuizManager();

// Global functions that need to be accessible from HTML
window.selectOption = function(question, value) {
    quizManager.quizAnswers[question] = value;
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
            html += `
                <button class="option-button ${isSelected ? 'selected' : ''}" 
                        onclick="selectOption('${questionKey}', '${option.value}')">
                    ${option.icon ? `<i class="option-icon fas ${option.icon}"></i>` : ''}
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
                      onchange="updateTextAnswer('${questionKey}')"></textarea>
        `;
    }
    
    html += '</div>';
    container.innerHTML = html;
    
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