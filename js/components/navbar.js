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

// Main navbar functionality
document.addEventListener('DOMContentLoaded', () => {
  // Create the navbar with mobile-responsive design
  const navbar = document.createElement('div');
  navbar.className = 'bg-green-900 text-white py-3 md:py-4';
  navbar.innerHTML = `
    <div class="container mx-auto flex justify-between items-center px-3 md:px-4">
      <a href="index.html" class="text-lg md:text-xl font-bold flex-shrink-0">Smart Trails</a>
      
      <!-- Desktop Navigation -->
      <nav id="nav-items" class="hidden md:block">
        <ul class="flex space-x-4 items-center">
          <li><a href="index.html" class="hover:text-green-200 transition-colors">Home</a></li>
          <li><a href="my-itineraries.html" class="hover:text-green-200 transition-colors">My Itineraries</a></li>
          <li id="auth-button"><a href="sign-up.html" class="bg-white text-green-900 px-4 py-2 rounded hover:bg-gray-200 transition-colors whitespace-nowrap">Sign Up</a></li>
        </ul>
      </nav>

      <!-- Mobile Navigation -->
      <div class="md:hidden flex items-center space-x-2">
        <div id="mobile-auth-button">
          <a href="sign-up.html" class="bg-white text-green-900 px-3 py-1.5 rounded text-sm hover:bg-gray-200 transition-colors whitespace-nowrap">Sign Up</a>
        </div>
        <button id="mobile-menu-toggle" class="text-white hover:text-green-200 transition-colors p-1">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
          </svg>
        </button>
      </div>
    </div>

    <!-- Mobile Menu Dropdown -->
    <div id="mobile-menu" class="md:hidden hidden bg-green-800 border-t border-green-700">
      <div class="container mx-auto px-3 py-3">
        <ul class="space-y-2">
          <li><a href="index.html" class="block py-2 hover:text-green-200 transition-colors">Home</a></li>
          <li><a href="my-itineraries.html" class="block py-2 hover:text-green-200 transition-colors">My Itineraries</a></li>
        </ul>
      </div>
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

  // Mobile menu toggle functionality
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
      
      // Update hamburger icon
      const icon = mobileMenuToggle.querySelector('svg');
      if (mobileMenu.classList.contains('hidden')) {
        // Hamburger icon
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>';
      } else {
        // X icon
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
      }
    });
  }
  
  // Update auth button based on authentication status
  onAuthStateChanged(auth, (user) => {
    const authButton = document.getElementById('auth-button');
    const mobileAuthButton = document.getElementById('mobile-auth-button');
    
    if (user) {
      // Desktop signed-in state
      authButton.innerHTML = `
        <div class="relative">
          <button id="user-menu-button" class="w-10 h-10 bg-white text-green-900 rounded-full hover:bg-gray-100 transition-colors duration-200 flex items-center justify-center shadow-sm focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-900">
            <svg class="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="3"></circle>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1 1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
            </svg>
          </button>
          <div id="user-dropdown" class="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 hidden z-50 border border-gray-200">
            <div class="px-4 py-2 border-b border-gray-100">
              <p class="text-sm text-gray-500">Signed in as:</p>
              <p class="text-sm font-medium text-gray-900 truncate">${user.email}</p>
            </div>
            <a href="my-itineraries.html" class="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-50 transition-colors">
              <svg class="w-4 h-4 mr-3 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14,2 14,8 20,8"></polyline>
                <line x1="16" y1="13" x2="8" y2="13"></line>
                <line x1="16" y1="17" x2="8" y2="17"></line>
                <polyline points="10,9 9,9 8,9"></polyline>
              </svg>
              My Itineraries
            </a>
            <button id="sign-out-btn" class="flex items-center w-full px-4 py-3 text-red-600 hover:bg-red-50 transition-colors text-left">
              <svg class="w-4 h-4 mr-3 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16,17 21,12 16,7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      `;

      // Mobile signed-in state
      mobileAuthButton.innerHTML = `
        <button id="mobile-user-button" class="w-8 h-8 bg-white text-green-900 rounded-full hover:bg-gray-100 transition-colors flex items-center justify-center text-sm font-semibold">
          ${user.email.charAt(0).toUpperCase()}
        </button>
      `;
      
      // Add dropdown functionality for desktop
      const userMenuButton = document.getElementById('user-menu-button');
      const userDropdown = document.getElementById('user-dropdown');
      
      if (userMenuButton && userDropdown) {
        userMenuButton.addEventListener('click', (e) => {
          e.stopPropagation();
          userDropdown.classList.toggle('hidden');
        });
        
        document.addEventListener('click', (e) => {
          if (!userMenuButton.contains(e.target) && !userDropdown.contains(e.target)) {
            userDropdown.classList.add('hidden');
          }
        });
        
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            userDropdown.classList.add('hidden');
          }
        });
      }

      // Add mobile user button functionality
      const mobileUserButton = document.getElementById('mobile-user-button');
      if (mobileUserButton) {
        mobileUserButton.addEventListener('click', () => {
          // Toggle mobile menu to show user options
          const mobileMenu = document.getElementById('mobile-menu');
          const mobileMenuList = mobileMenu.querySelector('ul');
          
          // Check if user options are already added
          if (!mobileMenuList.querySelector('#mobile-sign-out')) {
            mobileMenuList.innerHTML += `
              <li class="border-t border-green-700 pt-2 mt-2">
                <div class="text-sm text-green-200 px-2 py-1">${user.email}</div>
              </li>
              <li><button id="mobile-sign-out" class="block w-full text-left py-2 text-red-300 hover:text-red-200 transition-colors">Sign Out</button></li>
            `;
            
            // Add mobile sign out functionality
            document.getElementById('mobile-sign-out')?.addEventListener('click', (e) => {
              e.preventDefault();
              signOut(auth)
                .then(() => {
                  window.location.reload();
                })
                .catch(error => {
                  console.error('Sign out error:', error);
                });
            });
          }
          
          mobileMenu.classList.toggle('hidden');
        });
      }
      
      // Add sign out functionality for desktop
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
      authButton.innerHTML = `<a href="sign-up.html" class="bg-white text-green-900 px-4 py-2 rounded hover:bg-gray-200 transition-colors whitespace-nowrap">Sign Up</a>`;
      mobileAuthButton.innerHTML = `<a href="sign-up.html" class="bg-white text-green-900 px-3 py-1.5 rounded text-sm hover:bg-gray-200 transition-colors whitespace-nowrap">Sign Up</a>`;
    }
  });
});