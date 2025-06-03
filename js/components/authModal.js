// js/components/authModal.js
import { signUp, signIn, resetPassword, signInWithGoogle, signInWithFacebook, handleRedirectResult } from '../auth/auth.js';
import { auth } from '../auth/firebase.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

let modalInjected = false;

// Custom messages for different contexts
const contextMessages = {
  saveItinerary: {
    title: "🏔️ Save Your Adventure Seamlessly",
    message: "Sign up to save your custom itineraries and access them anytime, anywhere. Your trek details will be waiting for you!"
  },
  default: {
    title: "🏔️ Start Your Adventure",
    message: "Join thousands of adventurers discovering amazing trails around the world"
  }
};

export function injectAuthModal() {
  if (modalInjected) return;
  
  const modalHTML = `
    <style>
      :root {
        --primary: #16a34a;
        --primary-dark: #15803d;
        --text-dark: #1f2937;
        --text-light: #6b7280;
        --bg-light: #f3f4f6;
        --white: #FFFFFF;
        --google-blue: #4285f4;
        --facebook-blue: #1877f2;
      }

      /* Modal Overlay */
      .auth-modal-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.6);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        backdrop-filter: blur(4px);
        opacity: 0;
        visibility: hidden;
        transition: opacity 0.3s ease, visibility 0.3s ease;
      }

      .auth-modal-overlay.active {
        opacity: 1;
        visibility: visible;
      }

      /* Modal Container */
      .auth-modal {
        background: rgba(255, 255, 255, 0.95);
        backdrop-filter: blur(10px);
        border-radius: 24px;
        padding: 0;
        max-width: 800px;
        width: 90%;
        max-height: 90vh;
        overflow: hidden;
        position: relative;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
        border: 1px solid rgba(255, 255, 255, 0.2);
        transform: scale(0.9) translateY(20px);
        transition: transform 0.3s ease;
        display: flex;
      }

      .auth-modal-overlay.active .auth-modal {
        transform: scale(1) translateY(0);
      }

      /* Close Button */
      .auth-close-button {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 32px;
        height: 32px;
        border: none;
        background: rgba(243, 244, 246, 0.8);
        border-radius: 50%;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        color: var(--text-light);
        z-index: 10;
      }

      .auth-close-button:hover {
        background: #e5e7eb;
        transform: scale(1.1);
      }

      /* Left Panel - Form */
      .auth-form-panel {
        flex: 1;
        padding: 40px;
        overflow-y: auto;
      }

      /* Right Panel - Visual */
      .auth-visual-panel {
        flex: 0.8;
        background: linear-gradient(135deg, #e6f7ed 0%, #d1f2e1 100%);
        padding: 40px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        border-left: 1px solid #e5e7eb;
      }

      /* Logo Section */
      .auth-modal-logo {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 32px;
      }

      .auth-logo-icon {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, var(--primary), var(--primary-dark));
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 8px rgba(21, 128, 61, 0.2);
      }

      .auth-logo-text {
        font-size: 24px;
        font-weight: 700;
        color: var(--text-dark);
      }

      /* Tabs */
      .auth-tabs {
        display: flex;
        background: var(--bg-light);
        border-radius: 12px;
        padding: 4px;
        margin-bottom: 24px;
        transition: all 0.3s ease;
      }

      .auth-tabs.hidden {
        display: none;
      }

      .auth-tab {
        flex: 1;
        padding: 12px 16px;
        border: none;
        background: transparent;
        border-radius: 8px;
        font-weight: 600;
        font-size: 14px;
        color: var(--text-light);
        cursor: pointer;
        transition: all 0.2s ease;
        font-family: inherit;
      }

      .auth-tab.active {
        background: white;
        color: var(--text-dark);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      /* OAuth Buttons */
      .auth-oauth-section {
        margin-bottom: 24px;
      }

      .auth-oauth-button {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        margin-bottom: 12px;
        background: white;
        font-family: inherit;
      }

      .auth-oauth-button:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
      }

      .auth-oauth-button.google {
        border-color: var(--google-blue);
        color: var(--google-blue);
      }

      .auth-oauth-button.google:hover {
        background: rgba(66, 133, 244, 0.05);
      }

      .auth-oauth-button.facebook {
        border-color: var(--facebook-blue);
        color: var(--facebook-blue);
      }

      .auth-oauth-button.facebook:hover {
        background: rgba(24, 119, 242, 0.05);
      }

      /* Divider */
      .auth-divider {
        display: flex;
        align-items: center;
        margin: 24px 0;
      }

      .auth-divider-line {
        flex: 1;
        height: 1px;
        background: #e5e7eb;
      }

      .auth-divider-text {
        padding: 0 16px;
        font-size: 13px;
        color: var(--text-light);
        font-weight: 500;
      }

      /* Form Elements */
      .auth-form-group {
        margin-bottom: 20px;
      }

      .auth-form-label {
        display: block;
        font-size: 14px;
        font-weight: 600;
        color: #374151;
        margin-bottom: 8px;
      }

      .auth-form-input {
        width: 100%;
        padding: 12px 16px;
        border: 2px solid #e5e7eb;
        border-radius: 12px;
        font-size: 15px;
        background: #fafafa;
        transition: all 0.2s ease;
        box-sizing: border-box;
        font-family: inherit;
      }

      .auth-form-input:focus {
        outline: none;
        border-color: var(--primary);
        background: white;
        box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
      }

      /* Password Field with Toggle */
      .auth-password-field {
        position: relative;
      }

      .auth-password-toggle {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        color: var(--text-light);
        cursor: pointer;
        padding: 4px;
      }

      .auth-password-toggle:hover {
        color: var(--text-dark);
      }

      /* Forgot Password Link */
      .auth-forgot-password {
        text-align: right;
        margin-top: -12px;
        margin-bottom: 20px;
      }

      .auth-forgot-password a {
        font-size: 14px;
        color: var(--primary);
        text-decoration: none;
        font-weight: 500;
      }

      .auth-forgot-password a:hover {
        text-decoration: underline;
      }

      /* Buttons */
      .auth-submit-button {
        width: 100%;
        padding: 14px;
        background: linear-gradient(135deg, var(--primary), var(--primary-dark));
        color: white;
        border: none;
        border-radius: 12px;
        font-size: 16px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s ease;
        box-shadow: 0 4px 12px rgba(21, 128, 61, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-family: inherit;
      }

      .auth-submit-button:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 6px 16px rgba(21, 128, 61, 0.4);
      }

      .auth-submit-button:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      /* Back Button */
      .auth-back-button {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--primary);
        font-size: 14px;
        font-weight: 500;
        text-decoration: none;
        margin-bottom: 24px;
        transition: all 0.2s ease;
      }

      .auth-back-button:hover {
        transform: translateX(-2px);
      }

      /* Messages */
      .auth-message {
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 20px;
        font-size: 14px;
        text-align: center;
        display: none;
      }

      .auth-message.show {
        display: block;
        animation: slideIn 0.3s ease;
      }

      @keyframes slideIn {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }

      .auth-error-message {
        background: #fee2e2;
        color: #b91c1c;
      }

      .auth-success-message {
        background: #dcfce7;
        color: var(--primary-dark);
      }

      /* Visual Panel Content */
      .auth-visual-icon {
        width: 120px;
        height: 120px;
        background: white;
        border-radius: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 24px;
        box-shadow: 0 8px 24px rgba(21, 128, 61, 0.15);
      }

      .auth-visual-title {
        font-size: 24px;
        font-weight: 700;
        color: var(--text-dark);
        margin-bottom: 16px;
      }

      .auth-visual-description {
        font-size: 16px;
        color: var(--text-light);
        line-height: 1.6;
        margin-bottom: 32px;
      }

      .auth-benefit-list {
        text-align: left;
        width: 100%;
        max-width: 300px;
      }

      .auth-benefit-item {
        display: flex;
        align-items: flex-start;
        margin-bottom: 16px;
        font-size: 14px;
        color: #166534;
      }

      .auth-benefit-item:before {
        content: "✓";
        color: var(--primary);
        font-weight: bold;
        margin-right: 10px;
        font-size: 16px;
      }

      /* Terms Text */
      .auth-terms-text {
        font-size: 13px;
        color: var(--text-light);
        text-align: center;
        margin-top: 24px;
        line-height: 1.5;
      }

      .auth-terms-text a {
        color: var(--primary);
        text-decoration: none;
        font-weight: 600;
      }

      .auth-terms-text a:hover {
        text-decoration: underline;
      }

      /* Loading State */
      .auth-loading {
        opacity: 0.7;
        pointer-events: none;
      }

      .auth-spinner {
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid transparent;
        border-top-color: currentColor;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* Responsive */
      @media (max-width: 768px) {
        .auth-modal {
          flex-direction: column;
          max-width: 480px;
          max-height: 85vh;
        }

        .auth-visual-panel {
          display: none;
        }

        .auth-form-panel {
          padding: 30px 20px;
        }
      }

      /* Hide elements */
      .auth-hidden {
        display: none !important;
      }

      /* Form styling */
      .auth-form {
        display: block;
      }

      .auth-form.auth-hidden {
        display: none;
      }
    </style>

    <!-- Authentication Modal -->
    <div class="auth-modal-overlay" id="auth-modal">
      <div class="auth-modal">
        <button class="auth-close-button" onclick="window.closeAuthModal()" aria-label="Close">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <!-- Form Panel -->
        <div class="auth-form-panel">
          <!-- Logo -->
          <div class="auth-modal-logo">
            <div class="auth-logo-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
                <path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22l-9-12z"/>
              </svg>
            </div>
            <div class="auth-logo-text">Smart Trails</div>
          </div>

          <!-- Auth Forms Container -->
          <div id="auth-forms">
            <!-- Tabs (hidden for password reset) -->
            <div class="auth-tabs" id="auth-tabs">
              <button class="auth-tab active" onclick="window.switchAuthTab('signup')">Create Account</button>
              <button class="auth-tab" onclick="window.switchAuthTab('login')">Welcome Back</button>
            </div>

            <!-- Messages -->
            <div id="auth-error-message" class="auth-message auth-error-message"></div>
            <div id="auth-success-message" class="auth-message auth-success-message"></div>

            <!-- Sign Up Form -->
            <form id="auth-signup-form" class="auth-form">
              <!-- OAuth Section -->
              <div class="auth-oauth-section">
                <button type="button" class="auth-oauth-button google" onclick="window.handleGoogleSignIn()">
                  <svg width="20" height="20" viewBox="0 0 488 512">
                    <path fill="#4285F4" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
                  </svg>
                  Continue with Google
                </button>
                
                <button type="button" class="auth-oauth-button facebook" onclick="window.handleFacebookSignIn()">
                  <svg width="20" height="20" viewBox="0 0 320 512">
                    <path fill="#1877F2" d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/>
                  </svg>
                  Continue with Facebook
                </button>
              </div>

              <!-- Divider -->
              <div class="auth-divider">
                <div class="auth-divider-line"></div>
                <div class="auth-divider-text">or</div>
                <div class="auth-divider-line"></div>
              </div>

              <div class="auth-form-group">
                <label class="auth-form-label" for="auth-signup-email">Email Address</label>
                <input type="email" id="auth-signup-email" class="auth-form-input" placeholder="your@email.com" required />
              </div>
              
              <div class="auth-form-group">
                <label class="auth-form-label" for="auth-signup-password">Create Password</label>
                <div class="auth-password-field">
                  <input type="password" id="auth-signup-password" class="auth-form-input" placeholder="At least 6 characters" required />
                  <button type="button" class="auth-password-toggle" onclick="window.toggleAuthPassword('auth-signup-password')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                </div>
              </div>
              
              <button type="submit" class="auth-submit-button">
                🚀 Join Our Community
              </button>
            </form>

            <!-- Login Form -->
            <form id="auth-login-form" class="auth-form auth-hidden">
              <!-- OAuth Section -->
              <div class="auth-oauth-section">
                <button type="button" class="auth-oauth-button google" onclick="window.handleGoogleSignIn()">
                  <svg width="20" height="20" viewBox="0 0 488 512">
                    <path fill="#4285F4" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"/>
                  </svg>
                  Continue with Google
                </button>
                
                <button type="button" class="auth-oauth-button facebook" onclick="window.handleFacebookSignIn()">
                  <svg width="20" height="20" viewBox="0 0 320 512">
                    <path fill="#1877F2" d="M279.14 288l14.22-92.66h-88.91v-60.13c0-25.35 12.42-50.06 52.24-50.06h40.42V6.26S260.43 0 225.36 0c-73.22 0-121.08 44.38-121.08 124.72v70.62H22.89V288h81.39v224h100.17V288z"/>
                  </svg>
                  Continue with Facebook
                </button>
              </div>

              <!-- Divider -->
              <div class="auth-divider">
                <div class="auth-divider-line"></div>
                <div class="auth-divider-text">or</div>
                <div class="auth-divider-line"></div>
              </div>

              <div class="auth-form-group">
                <label class="auth-form-label" for="auth-login-email">Email Address</label>
                <input type="email" id="auth-login-email" class="auth-form-input" placeholder="your@email.com" required />
              </div>
              
              <div class="auth-form-group">
                <label class="auth-form-label" for="auth-login-password">Password</label>
                <div class="auth-password-field">
                  <input type="password" id="auth-login-password" class="auth-form-input" placeholder="Enter your password" required />
                  <button type="button" class="auth-password-toggle" onclick="window.toggleAuthPassword('auth-login-password')">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                      <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                  </button>
                </div>
              </div>

              <div class="auth-forgot-password">
                <a href="#" onclick="window.showAuthResetForm(event)">Forgot password?</a>
              </div>
              
              <button type="submit" class="auth-submit-button">
                🏠 Welcome Back
              </button>
            </form>

            <!-- Password Reset Form -->
            <form id="auth-reset-form" class="auth-form auth-hidden">
              <a href="#" class="auth-back-button" onclick="window.backToAuthLogin(event)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                Back to login
              </a>

              <h2 style="font-size: 24px; font-weight: 700; color: var(--text-dark); margin-bottom: 12px;">
                Reset Your Password
              </h2>
              <p style="font-size: 15px; color: var(--text-light); margin-bottom: 24px;">
                Enter your email address and we'll send you instructions to reset your password.
              </p>

              <div class="auth-form-group">
                <label class="auth-form-label" for="auth-reset-email">Email Address</label>
                <input type="email" id="auth-reset-email" class="auth-form-input" placeholder="your@email.com" required />
              </div>
              
              <button type="submit" class="auth-submit-button">
                📧 Send Reset Instructions
              </button>
            </form>
          </div>

          <!-- Terms Text -->
          <p class="auth-terms-text">
            By joining, you agree to our <a href="#">Terms of Service</a> and 
            <a href="#">Privacy Policy</a>. We promise to keep your data safe! 🔒
          </p>
        </div>

        <!-- Visual Panel -->
        <div class="auth-visual-panel">
          <div class="auth-visual-icon">
            <svg width="80" height="80" viewBox="0 0 24 24" fill="var(--primary)">
              <path d="M14 6l-3.75 5 2.85 3.8-1.6 1.2C9.81 13.75 7 10 7 10l-6 8h22l-9-12z"/>
            </svg>
          </div>
          <h3 class="auth-visual-title" id="auth-visual-title">Start Your Adventure</h3>
          <p class="auth-visual-description" id="auth-visual-description">
            Join thousands of adventurers discovering amazing trails around the world
          </p>
          <div class="auth-benefit-list">
            <div class="auth-benefit-item">Personalized trail recommendations</div>
            <div class="auth-benefit-item">Detailed gear lists and local insights</div>
            <div class="auth-benefit-item">Save and organize your itineraries</div>
            <div class="auth-benefit-item">Connect with fellow adventurers</div>
          </div>
        </div>
      </div>
    </div>
  `;
  
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  modalInjected = true;
  
  // Setup global functions
  setupGlobalFunctions();
  
  // Setup form handlers
  setupFormHandlers();
  
  // Check for OAuth redirect result on page load
  checkOAuthRedirect();
}

function setupGlobalFunctions() {
  // Modal Management
  window.closeAuthModal = function() {
    const modal = document.getElementById('auth-modal');
    modal.classList.remove('active');
    
    // Reset to signup tab after closing
    setTimeout(() => {
      window.switchAuthTab('signup');
      hideAllMessages();
    }, 300);
  };

  // Tab Switching
  window.switchAuthTab = function(tab) {
    const signupForm = document.getElementById('auth-signup-form');
    const loginForm = document.getElementById('auth-login-form');
    const resetForm = document.getElementById('auth-reset-form');
    const authTabs = document.getElementById('auth-tabs');
    
    // Hide all forms
    signupForm.classList.add('auth-hidden');
    loginForm.classList.add('auth-hidden');
    resetForm.classList.add('auth-hidden');
    authTabs.classList.remove('auth-hidden');
    
    // Show selected form
    if (tab === 'signup') {
      signupForm.classList.remove('auth-hidden');
      document.querySelectorAll('.auth-tab')[0].classList.add('active');
      document.querySelectorAll('.auth-tab')[1].classList.remove('active');
    } else if (tab === 'login') {
      loginForm.classList.remove('auth-hidden');
      document.querySelectorAll('.auth-tab')[1].classList.add('active');
      document.querySelectorAll('.auth-tab')[0].classList.remove('active');
    }
    
    hideAllMessages();
  };

  // Show Reset Form
  window.showAuthResetForm = function(event) {
    event.preventDefault();
    
    const authTabs = document.getElementById('auth-tabs');
    const resetForm = document.getElementById('auth-reset-form');
    const loginForm = document.getElementById('auth-login-form');
    
    authTabs.classList.add('auth-hidden');
    loginForm.classList.add('auth-hidden');
    resetForm.classList.remove('auth-hidden');
    
    // Pre-fill email if user already entered it in login
    const loginEmail = document.getElementById('auth-login-email').value;
    if (loginEmail) {
      document.getElementById('auth-reset-email').value = loginEmail;
    }
    
    hideAllMessages();
  };

  // Back to Login
  window.backToAuthLogin = function(event) {
    event.preventDefault();
    window.switchAuthTab('login');
  };

  // Password Toggle
  window.toggleAuthPassword = function(fieldId) {
    const field = document.getElementById(fieldId);
    const button = field.nextElementSibling;
    
    if (field.type === 'password') {
      field.type = 'text';
      button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
          <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      `;
    } else {
      field.type = 'password';
      button.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      `;
    }
  };

  // Google Sign In Handler
  window.handleGoogleSignIn = async function() {
    hideAllMessages();
    showInfo('Signing in with Google...');
    
    try {
      const result = await signInWithGoogle();
      
      if (result.pending) {
        // Redirect flow initiated, page will reload
        return;
      }
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      await handleOAuthSuccess(result.user);
    } catch (error) {
      console.error('Google sign-in error:', error);
      showError(getOAuthFriendlyError(error));
    }
  };

  // Facebook Sign In Handler
  window.handleFacebookSignIn = async function() {
    hideAllMessages();
    showInfo('Signing in with Facebook...');
    
    try {
      const result = await signInWithFacebook();
      
      if (result.pending) {
        // Redirect flow initiated, page will reload
        return;
      }
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      await handleOAuthSuccess(result.user);
    } catch (error) {
      console.error('Facebook sign-in error:', error);
      showError(getOAuthFriendlyError(error));
    }
  };
}

// Check for OAuth redirect result on page load
async function checkOAuthRedirect() {
  try {
    const result = await handleRedirectResult();
    if (result.success && result.user) {
      // Show modal with success message
      const modal = document.getElementById('auth-modal');
      if (modal) {
        modal.classList.add('active');
        await handleOAuthSuccess(result.user);
      }
    }
  } catch (error) {
    console.error('OAuth redirect error:', error);
  }
}

// Handle successful OAuth authentication
async function handleOAuthSuccess(user) {
  // Wait for auth state to be established
  await new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        unsubscribe();
        resolve(user);
      }
    });
  });
  
  // Check for and save any pending itinerary
  const savedItinerary = await savePendingItinerary(user);
  
  if (savedItinerary) {
    showSuccess('🎉 Welcome! Your trek has been saved.');
    setTimeout(() => {
      window.location.href = `view-itinerary.html?id=${savedItinerary._id || savedItinerary.id}`;
    }, 2000);
  } else {
    showSuccess('🎉 Welcome to Smart Trails!');
    setTimeout(() => {
      window.closeAuthModal();
      window.location.reload();
    }, 1500);
  }
}

// OAuth-specific error messages
function getOAuthFriendlyError(error) {
  const errorCode = error.message || error.code;
  
  const errorMap = {
    'popup-closed-by-user': 'Sign-in cancelled. Please try again.',
    'auth/popup-blocked': 'Pop-up blocked. Please allow pop-ups for this site.',
    'auth/cancelled-popup-request': 'Another sign-in is in progress.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/account-exists-with-different-credential': 'An account already exists with the same email address.',
    'auth/user-cancelled': 'Sign-in cancelled.'
  };
  
  // Check for partial matches
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorCode.includes(key.replace('auth/', ''))) {
      return value;
    }
  }
  
  return 'Sign-in failed. Please try again.';
}

function setupFormHandlers() {
  // Form Submissions
  document.getElementById('auth-signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAllMessages();
    setLoading('auth-signup-form', true);
    
    const email = document.getElementById('auth-signup-email').value;
    const password = document.getElementById('auth-signup-password').value;
    
    try {
      const result = await signUp(email, password);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Wait for auth state to be established
      await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            unsubscribe();
            resolve(user);
          }
        });
      });
      
      // Check for and save any pending itinerary
      const savedItinerary = await savePendingItinerary(result.user);
      
      if (savedItinerary) {
        showSuccess('🎉 Account created and your trek has been saved!');
        setTimeout(() => {
          window.location.href = `view-itinerary.html?id=${savedItinerary._id || savedItinerary.id}`;
        }, 2000);
      } else {
        // Check if there was a pending itinerary that couldn't be saved
        const hasPendingItinerary = localStorage.getItem('pendingItinerary');
        if (hasPendingItinerary) {
          showSuccess('🎉 Welcome to Smart Trails! Please save your itinerary from the customize page.');
          setTimeout(() => {
            window.location.href = 'customize.html';
          }, 2000);
        } else {
          showSuccess('🎉 Welcome to Smart Trails! Your account has been created.');
          setTimeout(() => {
            window.location.href = 'customize.html';
          }, 2000);
        }
      }
      
    } catch (error) {
      console.error('Signup error:', error);
      showError(getUserFriendlyError(error));
    } finally {
      setLoading('auth-signup-form', false);
    }
  });

  document.getElementById('auth-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAllMessages();
    setLoading('auth-login-form', true);
    
    const email = document.getElementById('auth-login-email').value;
    const password = document.getElementById('auth-login-password').value;
    
    try {
      const result = await signIn(email, password);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      // Wait for auth state to be established
      await new Promise((resolve) => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
            unsubscribe();
            resolve(user);
          }
        });
      });
      
      // Check for and save any pending itinerary
      const savedItinerary = await savePendingItinerary(result.user);
      
      if (savedItinerary) {
        showSuccess('🎉 Welcome back! Your trek has been saved.');
        setTimeout(() => {
          window.location.href = `view-itinerary.html?id=${savedItinerary._id || savedItinerary.id}`;
        }, 2000);
      } else {
        showSuccess('🎉 Welcome back!');
        setTimeout(() => {
          window.closeAuthModal();
          window.location.reload();
        }, 1500);
      }
      
    } catch (error) {
      console.error('Login error:', error);
      showError(getUserFriendlyError(error));
    } finally {
      setLoading('auth-login-form', false);
    }
  });

  document.getElementById('auth-reset-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAllMessages();
    setLoading('auth-reset-form', true);
    
    const email = document.getElementById('auth-reset-email').value;
    
    try {
      const result = await resetPassword(email);
      
      if (!result.success) {
        throw new Error(result.error);
      }
      
      showSuccess('📧 Password reset instructions sent! Check your email.');
      
      // Clear the form
      document.getElementById('auth-reset-email').value = '';
      
      // Go back to login after delay
      setTimeout(() => {
        window.switchAuthTab('login');
      }, 3000);
    } catch (error) {
      console.error('Reset error:', error);
      showError(getUserFriendlyError(error));
    } finally {
      setLoading('auth-reset-form', false);
    }
  });

  // Close modal when clicking outside
  document.getElementById('auth-modal').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
      window.closeAuthModal();
    }
  });

  // Close modal with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.getElementById('auth-modal').classList.contains('active')) {
      window.closeAuthModal();
    }
  });
}

// Helper Functions
function showError(message) {
  const errorDiv = document.getElementById('auth-error-message');
  errorDiv.textContent = message;
  errorDiv.classList.add('show');
  document.getElementById('auth-success-message').classList.remove('show');
}

function showSuccess(message) {
  const successDiv = document.getElementById('auth-success-message');
  successDiv.textContent = message;
  successDiv.classList.add('show');
  document.getElementById('auth-error-message').classList.remove('show');
}

function showInfo(message) {
  const successDiv = document.getElementById('auth-success-message');
  successDiv.textContent = message;
  successDiv.classList.add('show');
  document.getElementById('auth-error-message').classList.remove('show');
}

function hideAllMessages() {
  document.getElementById('auth-error-message').classList.remove('show');
  document.getElementById('auth-success-message').classList.remove('show');
}

function setLoading(formId, loading) {
  const form = document.getElementById(formId);
  const button = form.querySelector('.auth-submit-button');
  
  if (loading) {
    form.classList.add('auth-loading');
    const originalText = button.innerHTML;
    button.dataset.originalText = originalText;
    button.innerHTML = '<span class="auth-spinner"></span> Processing...';
    button.disabled = true;
  } else {
    form.classList.remove('auth-loading');
    button.innerHTML = button.dataset.originalText;
    button.disabled = false;
  }
}

function getUserFriendlyError(error) {
  const errorCode = error.message || error.code;
  
  const errorMap = {
    'auth/email-already-in-use': 'This email is already registered. Try logging in instead.',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/invalid-email': 'Please enter a valid email address',
    'auth/user-not-found': 'No account found with this email address',
    'auth/wrong-password': 'Incorrect password. Please try again or reset your password.',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later',
    'auth/network-request-failed': 'Network error. Please check your connection'
  };
  
  // Check for partial matches
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorCode.includes(key.replace('auth/', ''))) {
      return value;
    }
  }
  
  return 'Something went wrong. Please try again.';
}

// UPDATED savePendingItinerary function with better error handling for new users
async function savePendingItinerary(user) {
  const pendingItinerary = localStorage.getItem('pendingItinerary');
  if (!pendingItinerary) return null;
  
  try {
    // Add a small delay for new users to ensure backend sync
    if (user.metadata && user.metadata.creationTime === user.metadata.lastSignInTime) {
      // This is a new user - wait a bit for backend to sync
      console.log('New user detected - waiting for backend sync...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Force token refresh to ensure it's valid
    const token = await user.getIdToken(true); // true forces refresh
    const itineraryData = JSON.parse(pendingItinerary);
    
    const response = await fetch('https://trekai-api.onrender.com/api/itineraries', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(itineraryData)
    });
    
    if (!response.ok) {
      // If it's a new user and we get 401, don't throw - just return null
      if (response.status === 401 && user.metadata && 
          user.metadata.creationTime === user.metadata.lastSignInTime) {
        console.log('New user - skipping immediate itinerary save (backend may not be synced yet)');
        // Keep the pending itinerary for later
        return null;
      }
      
      // For existing users or other errors, log but don't throw
      console.error(`Failed to save itinerary: ${response.status}`);
      
      // Try to get error details
      try {
        const errorData = await response.json();
        console.error('API Error details:', errorData);
      } catch (e) {
        console.error('Could not parse error response');
      }
      
      return null;
    }
    
    const savedItinerary = await response.json();
    
    // Clear the pending data only on success
    localStorage.removeItem('pendingItinerary');
    localStorage.removeItem('returnToCustomize');
    
    return savedItinerary;
  } catch (error) {
    console.error('Error saving pending itinerary:', error);
    
    // For new users, don't treat this as a critical error
    if (user.metadata && user.metadata.creationTime === user.metadata.lastSignInTime) {
      console.log('Keeping pending itinerary for new user to save later');
      // Keep the pending itinerary for later
      return null;
    }
    
    // For existing users, still return null instead of throwing
    return null;
  }
}

// Main export function
export function showAuthModal(mode = 'signup', context = 'default') {
  injectAuthModal();
  
  const modal = document.getElementById('auth-modal');
  
  // Update the visual panel content based on context
  if (context === 'saveItinerary' || window.location.pathname.includes('customize')) {
    const titleEl = document.getElementById('auth-visual-title');
    const descEl = document.getElementById('auth-visual-description');
    
    titleEl.textContent = contextMessages.saveItinerary.title;
    descEl.textContent = contextMessages.saveItinerary.message;
  } else {
    const titleEl = document.getElementById('auth-visual-title');
    const descEl = document.getElementById('auth-visual-description');
    
    titleEl.textContent = contextMessages.default.title;
    descEl.textContent = contextMessages.default.message;
  }
  
  modal.classList.add('active');
  
  if (mode === 'reset') {
    window.showAuthResetForm(new Event('click'));
  } else {
    window.switchAuthTab(mode);
  }
}