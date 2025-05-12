// auth.js
import {
    getAuth as firebaseGetAuth,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    updateProfile,
    setPersistence,
    browserLocalPersistence,    // For "Remember Me" across sessions
    browserSessionPersistence,  // For remembering only in the current session (default)
    indexedDBLocalPersistence // Fallback persistence if browserLocalPersistence is unavailable
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { getApp, initializeApp, FirebaseError } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { firebaseConfig } from './config.js'; // Ensure config is available if needed for re-initialization

let authInstance = null;

/**
 * Initializes the Firebase Auth instance if it hasn't been already.
 * Assumes Firebase App is initialized elsewhere (e.g., main.js).
 * @returns {Auth} The Firebase Auth instance.
 */
export function initializeAuth() {
    if (!authInstance) {
        try {
            // Try getting the default app first, assuming it's initialized in main.js
            const app = getApp();
            authInstance = firebaseGetAuth(app);
            // console.log("[Auth] Auth instance obtained from existing app.");
        } catch (e) {
            // If no app exists, initialize it here (should ideally be done in main.js)
            if (e instanceof FirebaseError && e.code === 'app/no-app') {
                console.warn("[Auth] Firebase app not found, initializing app within auth module.");
                const app = initializeApp(firebaseConfig);
                authInstance = firebaseGetAuth(app);
            } else {
                console.error("[Auth] Error initializing Firebase Auth:", e);
                throw e; // Rethrow other errors
            }
        }
    }
    return authInstance;
}

/**
 * Gets the initialized Firebase Auth instance.
 * Calls initializeAuth if the instance doesn't exist yet.
 * @returns {Auth} The Firebase Auth instance.
 */
export function getAuthInstance() {
    if (!authInstance) {
        // console.log("[Auth] Auth instance not found in getAuthInstance, initializing...");
        initializeAuth();
    }
    return authInstance;
}

/**
 * Logs in a user with email and password, handling the "Remember Me" persistence.
 * @param {string} email - User's email.
 * @param {string} password - User's password.
 * @param {boolean} rememberMe - If true, use local persistence; otherwise, use session persistence.
 * @returns {Promise<UserCredential>} A Promise resolving with the UserCredential upon successful login.
 */
export async function loginUser(email, password, rememberMe = false) {
    const auth = getAuthInstance();
    if (!auth) throw new Error("Auth not initialized for loginUser.");

    const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    // console.log(`[Auth] Attempting login with persistence: ${rememberMe ? 'LOCAL' : 'SESSION'}`);

    try {
        // Set persistence BEFORE signing in.
        await setPersistence(auth, persistenceType);
        // console.log(`[Auth] Persistence set successfully to ${persistenceType}. Proceeding with signIn...`);
        return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error(`[Auth] Error during setPersistence or signInWithEmailAndPassword (Persistence: ${persistenceType}):`, error);
        // Handle environments where local persistence might not be supported (e.g., private browsing)
        if (error.code === 'auth/operation-not-supported-in-this-environment' || error.code === 'auth/unsupported-persistence-type') {
             console.warn("[Auth] Browser/Local persistence not supported or failed, trying IndexedDB persistence...");
             try {
                 await setPersistence(auth, indexedDBLocalPersistence);
                 console.log("[Auth] Persistence set successfully to IndexedDB. Proceeding with signIn...");
                 return await signInWithEmailAndPassword(auth, email, password);
             } catch(fallbackError) {
                 console.error("[Auth] IndexedDB persistence also failed, falling back to session persistence for login:", fallbackError);
                  // Fallback to session persistence if IndexedDB also fails
                 await setPersistence(auth, browserSessionPersistence);
                 return await signInWithEmailAndPassword(auth, email, password);
             }
        }
        // Rethrow other errors (like wrong password, user not found)
        throw error;
    }
}

/**
 * Signs out the current user.
 * @returns {Promise<void>} A Promise resolving when sign-out is complete.
 */
export function handleSignOut() {
    const auth = getAuthInstance();
    if (!auth) {
        console.error("Auth not initialized for handleSignOut.");
        return Promise.reject(new Error("Auth not initialized"));
    }
    // console.log("[Auth] Attempting sign out.");
    return signOut(auth);
}

/**
 * Registers an observer for changes to the user's sign-in state.
 * @param {function(User|null)} callback - The callback function to execute when the auth state changes. It receives the user object or null.
 * @returns {function} An unsubscribe function to remove the observer.
 */
export function onAuthStateChanged(callback) {
    const auth = getAuthInstance();
    if (!auth) {
        console.warn("[Auth] Auth not initialized for onAuthStateChanged. Returning no-op unsubscribe.");
        // Return a function that does nothing, as we can't subscribe yet.
        // The UI update logic should handle the initial state.
        return () => {};
    }
    // console.log("[Auth] Setting up onAuthStateChanged listener.");
    return firebaseOnAuthStateChanged(auth, callback);
}

/**
 * Registers a new user with email, password, and display name.
 * Sets the user's display name upon successful registration.
 * Uses the default persistence set for the Firebase project (usually session).
 * @param {string} email - User's email.
 * @param {string} password - User's password (must be >= 6 characters).
 * @param {string} displayName - User's display name.
 * @returns {Promise<UserCredential>} A Promise resolving with the UserCredential upon successful registration and profile update.
 */
export async function registerUser(email, password, displayName) {
    const auth = getAuthInstance();
    if (!auth) throw new Error("Auth not initialized for registerUser.");

    if (!displayName) {
        console.warn("[Auth] Display name is missing during registration.");
        // Consider throwing an error or providing a default if displayName is mandatory
         // throw new Error("Display name is required for registration.");
    }

    try {
        // console.log(`[Auth] Attempting to register user: ${email}`);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // console.log(`[Auth] User registered successfully: ${userCredential.user.uid}`);

        // Set the display name
        if (userCredential?.user && displayName) {
            try {
                await updateProfile(userCredential.user, {
                    displayName: displayName
                });
                // console.log(`[Auth] User profile updated with displayName: ${displayName}`);
            } catch (profileError) {
                // Log the error but don't necessarily fail the whole registration
                console.error("[Auth] Error updating user profile after registration:", profileError);
                // Optionally rethrow or handle this error based on requirements
            }
        } else if (!displayName) {
            // console.warn("[Auth] DisplayName was not provided, profile not updated with it.");
        }

        return userCredential; // Return the credential object
    } catch (error) {
        console.error("[Auth] Error during createUserWithEmailAndPassword:", error);
        throw error; // Rethrow the error for the caller to handle
    }
}
