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
    <div id="mobile-menu" class="md:hidden hidden bg-gradient-to-b from-green-800 to-green-900 border-t border-green-600 shadow-lg backdrop-blur-sm">
      <div class="container mx-auto px-4 py-4">
        <ul class="space-y-1" id="mobile-menu-list">
          <li>
            <a href="index.html" class="flex items-center py-3 px-4 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200 group">
              <svg class="w-5 h-5 mr-3 text-green-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
              </svg>
              <span class="font-medium group-hover:text-white transition-colors">Home</span>
            </a>
          </li>
          <li>
            <a href="my-itineraries.html" class="flex items-center py-3 px-4 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200 group">
              <svg class="w-5 h-5 mr-3 text-green-300 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <span class="font-medium group-hover:text-white transition-colors">My Itineraries</span>
            </a>
          </li>
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

  // Helper function for smooth menu animation
  window.toggleMobileMenu = () => {
    const mobileMenu = document.getElementById('mobile-menu');
    if (!mobileMenu) return false;
    
    const isHidden = mobileMenu.classList.contains('hidden');
    
    if (isHidden) {
      // Show menu with animation
      mobileMenu.classList.remove('hidden');
      mobileMenu.style.maxHeight = '0px';
      mobileMenu.style.opacity = '0';
      mobileMenu.style.transform = 'translateY(-10px)';
      
      // Trigger animation
      requestAnimationFrame(() => {
        mobileMenu.style.transition = 'all 0.3s ease-out';
        mobileMenu.style.maxHeight = '400px';
        mobileMenu.style.opacity = '1';
        mobileMenu.style.transform = 'translateY(0)';
      });
    } else {
      // Hide menu with animation
      mobileMenu.style.transition = 'all 0.2s ease-in';
      mobileMenu.style.maxHeight = '0px';
      mobileMenu.style.opacity = '0';
      mobileMenu.style.transform = 'translateY(-10px)';
      
      setTimeout(() => {
        mobileMenu.classList.add('hidden');
        mobileMenu.style.transition = '';
        mobileMenu.style.maxHeight = '';
        mobileMenu.style.opacity = '';
        mobileMenu.style.transform = '';
      }, 200);
    }
    
    return !isHidden; // Return new state (true if now hidden)
  };

  // Mobile menu toggle functionality
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  
  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      const nowHidden = window.toggleMobileMenu();
      
      // Update hamburger icon
      const icon = mobileMenuToggle.querySelector('svg');
      if (nowHidden) {
        // Hamburger icon
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>';
      } else {
        // X icon
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
      }
    });
  }

  // Function to update mobile menu with user info
  function updateMobileMenuForUser(user) {
    const mobileMenuList = document.getElementById('mobile-menu-list');
    
    // Remove existing user info if present
    const existingUserInfo = mobileMenuList.querySelector('#mobile-user-info');
    if (existingUserInfo) {
      existingUserInfo.remove();
    }
    
    if (user) {
      // Add user info section to mobile menu
      const userInfoHtml = `
        <li id="mobile-user-info" class="border-t border-green-700 pt-3 mt-3">
          <div class="px-4 py-2">
            <div class="flex items-center space-x-3 mb-3">
              <div class="w-10 h-10 bg-white text-green-900 rounded-full flex items-center justify-center font-semibold">
                ${user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p class="text-sm text-green-200">Signed in as:</p>
                <p class="text-sm font-medium text-white truncate">${user.email}</p>
              </div>
            </div>
            <button id="mobile-sign-out" class="flex items-center w-full py-3 px-4 rounded-lg hover:bg-white hover:bg-opacity-10 transition-all duration-200 group text-red-300 hover:text-red-200">
              <svg class="w-5 h-5 mr-3 text-red-400 group-hover:text-red-300 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
              </svg>
              <span class="font-medium group-hover:text-red-200 transition-colors">Sign Out</span>
            </button>
          </div>
        </li>
      `;
      
      mobileMenuList.insertAdjacentHTML('beforeend', userInfoHtml);
      
      // Add sign out functionality for mobile
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

      // Mobile signed-in state - hide the auth button completely
      mobileAuthButton.style.display = 'none';
      
      // Update mobile menu with user info
      updateMobileMenuForUser(user);
      
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
      mobileAuthButton.style.display = 'block';
      
      // Remove user info from mobile menu
      updateMobileMenuForUser(null);
    }
  });
});