// Authentication helper functions
import { auth } from './firebase.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

// Initialize providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Configure Facebook provider
facebookProvider.addScope('email');
facebookProvider.addScope('public_profile');

// Sign up function
export async function signUp(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Signup error:", error);
    return { success: false, error: error.message };
  }
}

// Sign in function
export async function signIn(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error) {
    console.error("Login error:", error);
    return { success: false, error: error.message };
  }
}

// Google Sign In
export async function signInWithGoogle() {
  try {
    // Use popup for desktop, redirect for mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Mobile: Use redirect
      await signInWithRedirect(auth, googleProvider);
      // The result will be handled when the page reloads
      return { success: true, pending: true };
    } else {
      // Desktop: Use popup
      const result = await signInWithPopup(auth, googleProvider);
      return { success: true, user: result.user };
    }
  } catch (error) {
    console.error("Google sign-in error:", error);
    return { success: false, error: error.message };
  }
}

// Facebook Sign In
export async function signInWithFacebook() {
  try {
    // Use popup for desktop, redirect for mobile
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Mobile: Use redirect
      await signInWithRedirect(auth, facebookProvider);
      // The result will be handled when the page reloads
      return { success: true, pending: true };
    } else {
      // Desktop: Use popup
      const result = await signInWithPopup(auth, facebookProvider);
      return { success: true, user: result.user };
    }
  } catch (error) {
    console.error("Facebook sign-in error:", error);
    return { success: false, error: error.message };
  }
}

// Handle redirect result (for mobile OAuth)
export async function handleRedirectResult() {
  try {
    const result = await getRedirectResult(auth);
    if (result) {
      return { success: true, user: result.user };
    }
    return { success: false, user: null };
  } catch (error) {
    console.error("Redirect result error:", error);
    return { success: false, error: error.message };
  }
}

// Sign out function
export async function logOut() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    console.error("Logout error:", error);
    return { success: false, error: error.message };
  }
}

// Password reset function
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    console.error("Password reset error:", error);
    return { success: false, error: error.message };
  }
}

// Check if user is logged in
export function getCurrentUser() {
  return auth.currentUser;
}