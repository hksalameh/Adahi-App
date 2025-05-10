// auth.js
import { 
    getAuth as firebaseGetAuth,
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged as firebaseOnAuthStateChanged,
    updateProfile,
    setPersistence,             // <<<--- استيراد setPersistence
    browserLocalPersistence,    // <<<--- استيراد browserLocalPersistence (للتذكر عبر الجلسات)
    browserSessionPersistence   // <<<--- استيراد browserSessionPersistence (للتذكر في الجلسة الحالية فقط)
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { getApp, FirebaseError } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";

let authInstance = null;

export function initializeAuth() {
    if (!authInstance) {
        try {
            const app = getApp(); 
            authInstance = firebaseGetAuth(app);
        } catch (e) {
            if (e instanceof FirebaseError && e.code === 'app/no-app') {
                console.error("Firebase app has not been initialized. Call initializeApp() in main.js first.", e);
            } else {
                console.error("Error initializing Firebase Auth:", e);
            }
        }
    }
    return authInstance;
}

export function getAuthInstance() {
    if (!authInstance) {
        initializeAuth(); 
    }
    return authInstance;
}

// --- دالة تسجيل الدخول مع ميزة "تذكرني" ---
export async function loginUser(email, password, rememberMe = false) { // إضافة معامل rememberMe
    const auth = getAuthInstance();
    if (!auth) throw new Error("Auth not initialized for loginUser.");

    // تحديد نوع استمرار الجلسة بناءً على "تذكرني"
    const persistenceType = rememberMe ? browserLocalPersistence : browserSessionPersistence;

    try {
        // تعيين نوع استمرار الجلسة *قبل* تسجيل الدخول
        await setPersistence(auth, persistenceType);
        // console.log(`Persistence set to: ${rememberMe ? 'LOCAL' : 'SESSION'}`);
        return await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        console.error(`Error during login with persistence ${persistenceType}:`, error);
        // إذا فشل تعيين الاستمرارية، حاول تسجيل الدخول بالافتراضي (الجلسة)
        if (error.code === 'auth/operation-not-supported-in-this-environment') {
            console.warn("Local persistence not supported, falling back to session persistence for login.");
            await setPersistence(auth, browserSessionPersistence);
            return signInWithEmailAndPassword(auth, email, password);
        }
        throw error; // أعد رمي الخطأ الأصلي إذا لم يكن متعلقًا بالاستمرارية
    }
}

export function handleSignOut() {
    const auth = getAuthInstance();
    if (!auth) throw new Error("Auth not initialized for handleSignOut.");
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
    if (!auth) throw new Error("Auth not initialized for registerUser.");
    try {
        // عند التسجيل، عادةً ما يتم تعيين الاستمرارية الافتراضية للمشروع
        // أو يمكنك تعيينها هنا أيضًا إذا أردت سلوكًا محددًا للتسجيل
        // await setPersistence(auth, browserLocalPersistence); // مثال: جعل المستخدمين المسجلين حديثًا "متذكرين"

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
