// Import Firebase auth
import { auth } from './auth/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Function to get trek image from the page
function getTrekImage() {
    // Try to get the image from the hero section
    const heroBg = document.querySelector('.hero-bg');
    if (heroBg) {
        const bgImage = window.getComputedStyle(heroBg).backgroundImage;
        // Extract URL from background-image CSS property
        const match = bgImage.match(/url\(['"]?(.+?)['"]?\)/);
        if (match && match[1]) {
            return match[1];
        }
    }
    
    // Fallback: try to construct based on trek slug if available
    if (window.trekData && window.trekData.slug) {
        return `/images/treks/covers/${window.trekData.slug}.jpg`;
    }
    
    return null;
}

// Function to save trek
async function saveTrek(user) {
    try {
        const token = await user.getIdToken();
        
        // Get the trek image
        const trekImage = getTrekImage();
        
        // Prepare the itinerary data - matching the expected API format
        const itineraryData = {
            type: 'popular-trek',
            trekId: window.trekData._id || window.trekData.slug,
            title: window.trekData.name,
            trekName: window.trekData.name, // Include as backup
            trekImage: trekImage, // Include the trek image
            location: window.trekData.region || window.trekData.country || 'Unknown',
            days: window.trekData.duration?.recommended_days || window.trekData.duration?.min_days || 1,
            startDate: new Date().toISOString(), // Add a default start date
            endDate: new Date(Date.now() + (window.trekData.duration?.recommended_days || 10) * 24 * 60 * 60 * 1000).toISOString(), // Calculate end date
            filters: {
                difficulty: window.trekData.difficulty || 'moderate',
                accommodation: 'teahouse', // Default for popular treks
                technical: 'no' // Default for popular treks
            },
            trekDetails: {
                duration: window.trekData.duration?.recommended_days || window.trekData.duration?.min_days,
                distance: window.trekData.distance_km,
                maxElevation: window.trekData.max_elevation_m,
                country: window.trekData.country,
                region: window.trekData.region,
                summary: window.trekData.summary
            },
            // Add a basic itinerary array - this might be required by the API
            itinerary: [{
                day: 1,
                title: 'View full trek details',
                activities: [`See complete ${window.trekData.name} itinerary`],
                accommodation: 'As per trek details',
                meals: ['As per trek details'],
                distance: 'See trek details',
                duration: 'See trek details'
            }]
        };
        
        // Log the data being sent for debugging
        console.log('Sending itinerary data:', itineraryData);
        
        const response = await fetch('https://trekai-api-staging.onrender.com/api/itineraries', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(itineraryData)
        });
        
        if (!response.ok) {
            // Try to get error details from response
            let errorMessage = 'Failed to save trek';
            try {
                const errorData = await response.json();
                errorMessage = errorData.message || errorData.error || errorMessage;
                console.error('API Error:', errorData);
            } catch (e) {
                console.error('Failed to parse error response');
            }
            throw new Error(errorMessage);
        }
        
        return true;
    } catch (error) {
        console.error('Error saving trek:', error);
        throw error;
    }
}

// Function to update button state
function updateButtonState(button, isSaved, isLoading = false) {
    if (isLoading) {
        button.innerHTML = `
            <svg class="w-5 h-5 mr-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
            <span class="text-lg">Saving...</span>
        `;
        button.disabled = true;
    } else if (isSaved) {
        button.innerHTML = `
            <svg class="w-5 h-5 mr-3 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span class="text-lg">Saved to My Trips</span>
        `;
        button.classList.remove('hover:border-green-600', 'hover:text-green-700', 'hover:bg-green-50');
        button.classList.add('bg-green-50', 'text-green-700', 'border-green-600', 'cursor-default');
        button.disabled = true;
    } else {
        button.innerHTML = `
            <svg class="w-5 h-5 mr-3 text-gray-500 group-hover:text-green-600 transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path>
            </svg>
            <span class="text-lg">Save to My Trips</span>
        `;
        button.disabled = false;
    }
}

// Check if trek is already saved
async function checkIfTrekSaved(user, trekId) {
    try {
        const token = await user.getIdToken();
        const response = await fetch('https://trekai-api-staging.onrender.com/api/itineraries', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) return false;
        
        const data = await response.json();
        const itineraries = data.itineraries || data;
        
        return itineraries.some(itinerary => 
            itinerary.type === 'popular-trek' && 
            (itinerary.trekId === trekId || itinerary.trekId === window.trekData?._id)
        );
    } catch (error) {
        console.error('Error checking saved status:', error);
        return false;
    }
}

// Initialize save functionality
document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.querySelector('[data-save-trek]');
    if (!saveButton || !window.trekData) return;
    
    let currentUser = null;
    
    // Monitor auth state
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        
        if (user && window.trekData) {
            // Check if already saved
            const isSaved = await checkIfTrekSaved(user, window.trekData._id || window.trekData.slug);
            updateButtonState(saveButton, isSaved);
        }
    });
    
    // Handle save button click
    saveButton.addEventListener('click', async function(e) {
        e.preventDefault();
        
        if (!currentUser) {
            // Redirect to sign-in page
            window.location.href = '/sign-up.html?redirect=' + encodeURIComponent(window.location.pathname);
            return;
        }
        
        updateButtonState(saveButton, false, true);
        
        try {
            await saveTrek(currentUser);
            updateButtonState(saveButton, true);
            
            // Show success message
            const successMsg = document.createElement('div');
            successMsg.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-y-0';
            successMsg.textContent = 'Trek saved successfully!';
            document.body.appendChild(successMsg);
            
            setTimeout(() => {
                successMsg.style.transform = 'translateY(100px)';
                setTimeout(() => successMsg.remove(), 300);
            }, 3000);
            
        } catch (error) {
            updateButtonState(saveButton, false);
            
            // Show error message
            const errorMsg = document.createElement('div');
            errorMsg.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg';
            errorMsg.textContent = 'Failed to save trek. Please try again.';
            document.body.appendChild(errorMsg);
            
            setTimeout(() => errorMsg.remove(), 3000);
        }
    });
});