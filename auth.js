// auth.js
import { 
    getAuth as firebaseGetAuth,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged as firebaseOnAuthStateChanged,
    updateProfile
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { getApp, FirebaseError } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";

let authInstance = null;

export function initializeAuth() {
    if (!authInstance) {
        try {
            const app = getApp(); // Attempt to get the default app
            authInstance = firebaseGetAuth(app);
        } catch (e) {
            // Check if it's the specific "no-app" error
            if (e instanceof FirebaseError && e.code === 'app/no-app') {
                console.error("Firebase app has not been initialized. Call initializeApp() in main.js first.", e);
                // Potentially, you could try to initialize a default app here if config is available,
                // but it's better practice to ensure main.js does it first.
            } else {
                console.error("Error initializing Firebase Auth:", e);
            }
            // To prevent further errors, authInstance remains null or you could throw
        }
    }
    return authInstance;
}

export function getAuthInstance() {
    if (!authInstance) {
        // This will ensure it's initialized if called directly before other functions
        // or if main.js hasn't called initializeAuth explicitly yet (though it should)
        initializeAuth(); 
    }
    if (!authInstance) {
        // If still not initialized (e.g. initializeApp was never called in main)
        // console.error("Auth instance is still null after attempting initialization.");
        // throw new Error("Firebase Auth is not initialized. Ensure initializeApp() is called in main.js and then initializeAuth().");
    }
    return authInstance;
}


export function loginUser(email, password) {
    const auth = getAuthInstance();
    if (!auth) throw new Error("Auth not initialized for loginUser. Call initializeAuth() from main.js after initializeApp().");
    return signInWithEmailAndPassword(auth, email, password);
}

export function handleSignOut() {
    const auth = getAuthInstance();
    if (!auth) throw new Error("Auth not initialized for handleSignOut. Call initializeAuth() from main.js after initializeApp().");
    return signOut(auth);
}

export function onAuthStateChanged(callback) {
    const auth = getAuthInstance();
    if (!auth) {
        console.warn("Auth not initialized for onAuthStateChanged. Returning no-op unsubscribe.");
        return () => {}; 
    }
    return firebaseOnAuthStateChanged(auth, callback);
}

export async function registerUser(email, password, displayName) {
    const auth = getAuthInstance();
    if (!auth) throw new Error("Auth not initialized for registerUser. Call initializeAuth() from main.js after initializeApp().");
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        if (userCredential && userCredential.user && displayName) {
            try {
                await updateProfile(userCredential.user, {
                    displayName: displayName
                });
                // console.log("User profile updated with displayName:", displayName);
            } catch (profileError) {
                console.error("Error updating user profile:", profileError);
            }
        } else if (!displayName) {
            // console.warn("DisplayName was not provided for new user, profile not updated with it.");
        }
        return userCredential;
    } catch (error) {
        // console.error("Error during createUserWithEmailAndPassword:", error);
        throw error; 
    }
}
