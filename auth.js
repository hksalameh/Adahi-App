// auth.js
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { firebaseConfig } from './config.js';
import { getFirestore, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig); // تهيئة Firebase مرة واحدة هنا
const auth = getAuth(app);
const db = getFirestore(app);

export { auth, onAuthStateChanged, signOut }; // تصدير لاستخدامهما في main.js

export async function loginUser(usernameOrEmail, password, rememberMe) {
    const persistenceMode = rememberMe ? browserLocalPersistence : browserSessionPersistence;
    await setPersistence(auth, persistenceMode);

    try {
        await signInWithEmailAndPassword(auth, usernameOrEmail, password);
        return { success: true };
    } catch (firstAttemptError) {
        if (firstAttemptError.code === 'auth/invalid-email' || firstAttemptError.code === 'auth/invalid-credential') {
            try {
                const usersMapRef = collection(db, "user_credentials_map");
                const q = query(usersMapRef, where("username", "==", usernameOrEmail));
                const querySnapshot = await getDocs(q);

                if (querySnapshot.empty) {
                    throw new Error('اسم المستخدم أو كلمة المرور غير صحيحة.');
                }
                let foundUserEmail = null;
                querySnapshot.forEach((doc) => { foundUserEmail = doc.data().email; });

                if (foundUserEmail) {
                    if (!foundUserEmail || typeof foundUserEmail !== 'string' || !foundUserEmail.includes('@')) {
                        throw new Error('البريد المرتبط باسم المستخدم غير صالح.');
                    }
                    await signInWithEmailAndPassword(auth, foundUserEmail, password);
                    return { success: true };
                } else {
                    throw new Error('لم يتم العثور على بريد إلكتروني مطابق لاسم المستخدم.');
                }
            } catch (lookupError) {
                let errorMsg = 'خطأ في البحث عن المستخدم أو كلمة المرور.';
                if (lookupError.code === 'auth/invalid-credential') { errorMsg = 'كلمة المرور غير صحيحة لاسم المستخدم المقدم.'; }
                else if (lookupError.code === 'auth/invalid-email') { errorMsg = 'البريد الإلكتروني المرتبط باسم المستخدم غير صالح.'; }
                else if (lookupError.code === 'permission-denied') { errorMsg = 'خطأ في صلاحيات البحث عن المستخدم.'; }
                else if (lookupError.message) { errorMsg = lookupError.message; }
                throw new Error(errorMsg);
            }
        } else {
            throw new Error(firstAttemptError.message || 'خطأ غير متوقع في تسجيل الدخول.');
        }
    }
}

export async function handleSignOut() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error("Error signing out: ", error);
        return { success: false, error: error.message };
    }
}
