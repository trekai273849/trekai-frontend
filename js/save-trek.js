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
            // Ensure we have the full path
            let imagePath = match[1];
            // If it's a relative path, make sure it starts with /
            if (!imagePath.startsWith('http') && !imagePath.startsWith('/')) {
                imagePath = '/' + imagePath;
            }
            return imagePath;
        }
    }
    
    // Fallback: construct based on trek ID
    if (window.trekData) {
        const trekId = window.trekData._id || window.trekData.slug;
        if (trekId) {
            return `/images/treks/covers/${trekId}.jpg`;
        }
    }
    
    return null;
}

// Function to save trek
async function saveTrek(user) {
    try {
        const token = await user.getIdToken();
        
        // Get the trek image
        const trekImage = getTrekImage();
        const trekId = window.trekData._id || window.trekData.slug || 'unknown';
        
        // Prepare the itinerary data - matching the EXACT backend structure
        const itineraryData = {
            title: window.trekData.name,
            location: window.trekData.region || window.trekData.country || 'Unknown',
            content: `# ${window.trekData.name}\n\n${window.trekData.summary || ''}\n\n## Trek Details\n- **Duration:** ${window.trekData.duration?.recommended_days || 'N/A'} days\n- **Distance:** ${window.trekData.distance_km || 'N/A'} km\n- **Max Elevation:** ${window.trekData.max_elevation_m || 'N/A'} m\n- **Difficulty:** ${window.trekData.difficulty || 'N/A'}\n\n*This is a saved popular trek. View the trek page for the complete itinerary.*`,
            filters: {
                accommodation: 'teahouse',
                difficulty: window.trekData.difficulty || 'moderate',
                altitude: window.trekData.max_elevation_m > 4000 ? 'high' : (window.trekData.max_elevation_m > 3000 ? 'moderate' : 'low'),
                technical: 'no'
            },
            comments: `Popular trek saved from: ${window.trekData.name}. Trek ID: ${trekId}. Image: ${trekImage || `/images/treks/covers/${trekId}.jpg`}.`,
            // Add type to help with identification
            type: 'popular-trek',
            trekId: trekId,
            // Include trek details for easier display in my-itineraries
            trekDetails: {
                region: window.trekData.region,
                duration: window.trekData.duration?.recommended_days,
                distance: window.trekData.distance_km,
                maxElevation: window.trekData.max_elevation_m
            }
        };
        
        // Log the data being sent for debugging
        console.log('Sending itinerary data:', itineraryData);
        console.log('Trek image path:', trekImage);
        
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
                <path d="M9 11l3 3L22 4"></path>
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"></path>
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
        
        // Check if this trek is already saved by looking at the comments field
        return itineraries.some(itinerary => {
            // Check if comments contain the trek ID
            if (itinerary.comments && itinerary.comments.includes(`Trek ID: ${trekId}`)) {
                return true;
            }
            // Also check type and trekId fields if they exist
            return itinerary.type === 'popular-trek' && 
                   (itinerary.trekId === trekId || itinerary.trekId === window.trekData?._id);
        });
    } catch (error) {
        console.error('Error checking saved status:', error);
        return false;
    }
}

// Initialize save functionality
document.addEventListener('DOMContentLoaded', function() {
    const saveButton = document.querySelector('[data-save-trek]');
    if (!saveButton || !window.trekData) {
        console.log('Save button or trek data not found');
        return;
    }
    
    let currentUser = null;
    
    // Monitor auth state
    onAuthStateChanged(auth, async (user) => {
        currentUser = user;
        
        if (user && window.trekData) {
            // Check if already saved
            const trekId = window.trekData._id || window.trekData.slug;
            const isSaved = await checkIfTrekSaved(user, trekId);
            updateButtonState(saveButton, isSaved);
        }
    });
    
    // Handle save button click
    saveButton.addEventListener('click', async function(e) {
        e.preventDefault();
        
        if (!currentUser) {
            // Redirect to sign-in page with return URL
            window.location.href = '/sign-up.html?redirect=' + encodeURIComponent(window.location.pathname);
            return;
        }
        
        updateButtonState(saveButton, false, true);
        
        try {
            await saveTrek(currentUser);
            updateButtonState(saveButton, true);
            
            // Show success message
            const successMsg = document.createElement('div');
            successMsg.className = 'fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 translate-y-0 z-50';
            successMsg.innerHTML = `
                <div class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                    </svg>
                    Trek saved successfully!
                </div>
            `;
            document.body.appendChild(successMsg);
            
            setTimeout(() => {
                successMsg.style.transform = 'translateY(100px)';
                setTimeout(() => successMsg.remove(), 300);
            }, 3000);
            
        } catch (error) {
            updateButtonState(saveButton, false);
            
            // Show error message
            const errorMsg = document.createElement('div');
            errorMsg.className = 'fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg z-50';
            errorMsg.innerHTML = `
                <div class="flex items-center">
                    <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.293 7.293z" clip-rule="evenodd"/>
                    </svg>
                    Failed to save trek. Please try again.
                </div>
            `;
            document.body.appendChild(errorMsg);
            
            setTimeout(() => errorMsg.remove(), 3000);
        }
    });
});

// Debug function to check current trek data and image
window.debugTrekSave = function() {
    console.log('Trek Data:', window.trekData);
    console.log('Trek Image:', getTrekImage());
    console.log('Trek ID:', window.trekData?._id || window.trekData?.slug);
};