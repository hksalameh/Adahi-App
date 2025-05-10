// auth.js
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged as firebaseOnAuthStateChanged,
    updateProfile // استيراد updateProfile
} from "https://www.gstatic.com/firebasejs/11.7.1/firebase-auth.js";

// لا حاجة لـ initializeApp هنا إذا تم في main.js
// const app = initializeApp(firebaseConfig); // تأكد أن هذا السطر غير موجود أو معلّق إذا firebaseConfig غير معرّف هنا

export const auth = getAuth(); // إذا كان app مُهيأ في مكان آخر, getAuth() تعمل بدونه. إذا لم يكن, تحتاج getAuth(app)

export function loginUser(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}

export function handleSignOut() {
    return signOut(auth);
}

export function onAuthStateChanged(callback) {
    // التأكد من أن auth مُهيأ قبل استخدامه
    if (!auth) {
        console.error("Firebase Auth instance is not initialized in auth.js.");
        // يمكنك إرجاع دالة فارغة أو التعامل مع الخطأ بطريقة أخرى
        return () => {}; 
    }
    return firebaseOnAuthStateChanged(auth, callback);
}

// --- دالة تسجيل مستخدم جديد ---
export async function registerUser(email, password, displayName) {
    if (!auth) {
        console.error("Firebase Auth instance is not initialized. Cannot register user.");
        throw new Error("Firebase Auth not initialized.");
    }
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        // بعد إنشاء المستخدم بنجاح، قم بتحديث ملفه الشخصي بالاسم المعروض
        // تأكد أن userCredential و userCredential.user موجودان
        if (userCredential && userCredential.user && displayName) {
            try {
                await updateProfile(userCredential.user, {
                    displayName: displayName
                });
                console.log("User profile updated with displayName:", displayName);
            } catch (profileError) {
                console.error("Error updating user profile:", profileError);
                // يمكنك اختيار عدم رمي الخطأ هنا إذا كان تحديث الملف الشخصي ثانويًا
                // أو رميه إذا كان حرجًا
                // throw profileError; 
            }
        } else if (!displayName) {
            console.warn("DisplayName was not provided for new user, profile not updated with it.");
        }
        return userCredential; // يحتوي على userCredential.user
    } catch (error) {
        console.error("Error during createUserWithEmailAndPassword:", error);
        // أعد رمي الخطأ ليتم التعامل معه في main.js أو أي مكان يستدعي هذه الدالة
        throw error; 
    }
}
