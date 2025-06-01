// Authentication helper functions
import { auth } from './firebase.js';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.11.0/firebase-auth.js";

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