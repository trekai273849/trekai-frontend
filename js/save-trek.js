// js/save-trek.js
import { auth } from './auth/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Function to generate a basic itinerary content for popular treks
function generateTrekContent(trekData) {
    return `# ${trekData.name}

${trekData.summary}

## Trek Overview
- **Duration**: ${trekData.duration?.recommended_days || 'N/A'} days
- **Distance**: ${trekData.distance_km || 'N/A'} km
- **Max Elevation**: ${trekData.max_elevation_m || 'N/A'} m
- **Difficulty**: ${trekData.difficulty || 'N/A'}
- **Region**: ${trekData.region || 'N/A'}
- **Country**: ${trekData.country || 'N/A'}

## Important Information
This is a popular trek saved from our collection. Visit the original trek page for detailed day-by-day itinerary, maps, and latest information.

Trek ID: ${trekData._id}
`;
}

// Function to save trek to user's itineraries
async function saveTrekToItineraries(trekData) {
    const user = auth.currentUser;
    
    if (!user) {
        // User not signed in - show auth modal
        showAuthModal();
        return;
    }
    
    try {
        // Get fresh token
        const token = await user.getIdToken(true);
        
        // Prepare the itinerary data matching your backend schema
        const itineraryData = {
            title: trekData.name,
            location: `${trekData.region}, ${trekData.country}`,
            filters: {
                difficulty: trekData.difficulty || 'moderate',
                accommodation: 'varied', // You can extract this from trek data if available
                technical: ['challenging', 'very challenging'].includes(trekData.difficulty) ? 'yes' : 'no',
                altitude: trekData.max_elevation_m > 4000 ? 'high' : 'moderate'
            },
            comments: `Popular trek: ${trekData.name}`,
            content: generateTrekContent(trekData),
            // Additional fields for popular treks
            type: 'popular-trek',
            trekId: trekData._id,
            trekDetails: {
                country: trekData.country,
                region: trekData.region,
                maxElevation: trekData.max_elevation_m,
                distance: trekData.distance_km,
                summary: trekData.summary,
                duration: trekData.duration?.recommended_days
            }
        };
        
        // Make API request to save itinerary using your existing endpoint
        const response = await fetch('https://trekai-api-staging.onrender.com/api/itineraries', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(itineraryData)
        });
        
        if (!response.ok) {
            // Check for duplicate save
            if (response.status === 409 || response.status === 400) {
                const error = await response.json();
                if (error.message?.includes('duplicate') || error.message?.includes('already')) {
                    showAlreadySavedMessage();
                    return;
                }
            }
            throw new Error(`Failed to save trek: ${response.status}`);
        }
        
        const savedItinerary = await response.json();
        return savedItinerary;
        
    } catch (error) {
        console.error('Error saving trek:', error);
        throw error;
    }
}

// Function to show auth modal
function showAuthModal() {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    modal.innerHTML = `
        <div class="bg-white rounded-lg p-8 max-w-md mx-4">
            <h2 class="text-2xl font-bold mb-4">Sign in to Save Treks</h2>
            <p class="text-gray-600 mb-6">Create a free account to save your favorite treks and access them anytime!</p>
            <div class="flex gap-4">
                <a href="/sign-up.html" class="flex-1 bg-blue-600 text-white text-center py-3 px-4 rounded-lg hover:bg-blue-700 transition">
                    Sign Up
                </a>
                <button onclick="this.closest('.fixed').remove()" class="flex-1 bg-gray-200 text-gray-800 py-3 px-4 rounded-lg hover:bg-gray-300 transition">
                    Cancel
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

// Function to show already saved message
function showAlreadySavedMessage() {
    const saveButton = document.querySelector('[data-save-trek]');
    if (saveButton) {
        saveButton.innerHTML = `
            <svg class="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Already in My Trips
        `;
        saveButton.disabled = true;
        saveButton.className = saveButton.className.replace('hover:bg-gray-100', 'opacity-75');
    }
}

// Function to show save status
function showSaveStatus(button, status) {
    const originalContent = button.innerHTML;
    const originalClasses = button.className;
    
    if (status === 'saving') {
        button.innerHTML = `
            <svg class="animate-spin h-4 w-4 inline mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Saving...
        `;
        button.disabled = true;
    } else if (status === 'success') {
        button.innerHTML = `
            <svg class="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Saved to My Trips!
        `;
        button.className = button.className.replace('bg-white', 'bg-green-100').replace('text-gray-700', 'text-green-700');
        
        // Show success notification
        showSuccessNotification();
        
        // Update button to show it's saved
        setTimeout(() => {
            button.innerHTML = `
                <svg class="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Saved to My Trips
            `;
            button.disabled = true;
            button.className = originalClasses.replace('hover:bg-gray-100', 'opacity-75');
        }, 2000);
    } else if (status === 'error') {
        button.innerHTML = `
            <svg class="h-4 w-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            Failed to save
        `;
        button.className = button.className.replace('bg-white', 'bg-red-100').replace('text-gray-700', 'text-red-700');
        
        // Reset after 3 seconds
        setTimeout(() => {
            button.innerHTML = originalContent;
            button.className = originalClasses;
            button.disabled = false;
        }, 3000);
    }
}

// Function to show success notification
function showSuccessNotification() {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-green-100 text-green-800 px-6 py-4 rounded-lg shadow-lg z-50 transform transition-all duration-300 translate-x-full';
    notification.innerHTML = `
        <div class="flex items-center">
            <svg class="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <div>
                <p class="font-semibold">Trek saved successfully!</p>
                <p class="text-sm mt-1">
                    <a href="/my-itineraries.html" class="underline hover:text-green-900">View in My Trips</a>
                </p>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Remove after 5 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Initialize save functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Find the save button
    const saveButton = document.querySelector('[data-save-trek]');
    
    if (saveButton) {
        // Get trek data from the page
        const trekData = window.trekData || {};
        
        saveButton.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Show saving status
            showSaveStatus(saveButton, 'saving');
            
            try {
                await saveTrekToItineraries(trekData);
                showSaveStatus(saveButton, 'success');
            } catch (error) {
                console.error('Save error:', error);
                showSaveStatus(saveButton, 'error');
                
                // If it's an auth error, show the auth modal
                if (error.message.includes('auth') || error.message.includes('401')) {
                    showAuthModal();
                }
            }
        });
    }
    
    // Check if trek is already saved on auth state change
    onAuthStateChanged(auth, async (user) => {
        if (user && saveButton && window.trekData?._id) {
            try {
                const token = await user.getIdToken();
                const response = await fetch('https://trekai-api-staging.onrender.com/api/itineraries', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    const itineraries = await response.json();
                    
                    // Check if this trek is already saved
                    const isSaved = itineraries.some(itinerary => 
                        itinerary.trekId === window.trekData._id
                    );
                    
                    if (isSaved) {
                        showAlreadySavedMessage();
                    }
                }
            } catch (error) {
                console.error('Error checking saved status:', error);
            }
        }
    });
});

// Export functions for use in other modules
export { saveTrekToItineraries };