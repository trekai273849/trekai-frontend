// js/components/navbar.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD48TPwzdcYiD6AfVgh6PX1P86OQ7qgPHg",
  authDomain: "smarttrailsauth.firebaseapp.com",
  projectId: "smarttrailsauth",
  storageBucket: "smarttrailsauth.firebasestorage.app",
  messagingSenderId: "763807584090",
  appId: "1:763807584090:web:822fb9109f7be5d432ed63",
  measurementId: "G-M6N5V4TDX6"
};

// Initialize Firebase at module level
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Function to generate user initials from email
function getUserInitials(email) {
  if (!email) return "?";
  
  // Split the email at @ and get username part
  const username = email.split('@')[0];
  
  // Check if username contains separators like dots or underscores
  const separators = ['.', '_', '-'];
  let nameParts = [username];
  
  for (const separator of separators) {
    if (username.includes(separator)) {
      nameParts = username.split(separator);
      break;
    }
  }
  
  // Get initials (up to 2 characters)
  return nameParts
    .filter(part => part.length > 0)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join('');
}

// Generate a consistent color based on email
function getAvatarColor(email) {
  if (!email) return "#2F855A"; // Default green
  
  // Simple hash function to generate a number from the email
  const hash = email.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);
  
  // List of colors (tailwind green shades)
  const colors = [
    "#22543D", // green-900
    "#276749", // green-800
    "#2F855A", // green-700
    "#38A169", // green-600
    "#48BB78", // green-500
    "#68D391", // green-400
  ];
  
  // Select color based on hash
  return colors[hash % colors.length];
}

// Main navbar functionality
document.addEventListener('DOMContentLoaded', () => {
  // Create the navbar
  const navbar = document.createElement('div');
  navbar.className = 'bg-green-900 text-white py-4';
  navbar.innerHTML = `
    <div class="container mx-auto flex justify-between items-center px-4">
      <a href="index.html" class="text-xl font-bold">Smart Trails</a>
      <nav id="nav-items">
        <ul class="flex space-x-4 items-center">
          <li><a href="index.html" class="hover:text-green-200">Home</a></li>
          <li><a href="my-itineraries.html" class="hover:text-green-200">My Itineraries</a></li>
          <li id="auth-button"><a href="sign-up.html" class="bg-white text-green-900 px-4 py-2 rounded hover:bg-gray-200">Sign Up</a></li>
        </ul>
      </nav>
    </div>
  `;

  // Get existing header
  const existingHeader = document.querySelector('header');
  
  // Insert navbar before existing header
  if (existingHeader) {
    existingHeader.parentNode.insertBefore(navbar, existingHeader);
  } else {
    document.body.insertBefore(navbar, document.body.firstChild);
  }
  
  // Update auth button based on authentication status
  onAuthStateChanged(auth, (user) => {
    const authButton = document.getElementById('auth-button');
    
    if (user) {
      // User is signed in
      const initials = getUserInitials(user.email);
      const avatarColor = getAvatarColor(user.email);
      
      authButton.innerHTML = `
        <div class="relative group">
          <a href="#" class="flex items-center bg-white text-green-900 px-3 py-1 rounded hover:bg-gray-200">
            <div class="w-8 h-8 rounded-full text-white flex items-center justify-center mr-2 text-sm font-bold" 
                 style="background-color: ${avatarColor}">
              ${initials}
            </div>
            <span>My Account</span>
          </a>
          <div class="absolute right-0 mt-2 w-48 bg-white rounded shadow-lg py-2 hidden group-hover:block z-50">
            <a href="my-itineraries.html" class="block px-4 py-2 text-green-900 hover:bg-gray-100">My Itineraries</a>
            <a href="#" id="sign-out-btn" class="block px-4 py-2 text-red-600 hover:bg-gray-100">Sign Out</a>
          </div>
        </div>
      `;
      
      // Add sign out functionality
      document.getElementById('sign-out-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        signOut(auth)
          .then(() => {
            window.location.reload();
          })
          .catch(error => {
            console.error('Sign out error:', error);
          });
      });
    } else {
      // User is signed out
      authButton.innerHTML = `<a href="sign-up.html" class="bg-white text-green-900 px-4 py-2 rounded hover:bg-gray-200">Sign Up</a>`;
    }
  });
});