// firestoreService.js
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, where, doc, updateDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { firebaseConfig } from './config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SACRIFICES_COLLECTION = "sacrifices";

// --- عمليات الأضاحي ---
export async function addSacrifice(data) {
    return await addDoc(collection(db, SACRIFICES_COLLECTION), data);
}

export async function updateSacrifice(docId, data) {
    const docRef = doc(db, SACRIFICES_COLLECTION, docId);
    return await updateDoc(docRef, data);
}

export async function deleteSacrifice(docId) {
    const docRef = doc(db, SACRIFICES_COLLECTION, docId);
    return await deleteDoc(docRef);
}

export function getSacrificesForAdmin(statusFilter, callback, errorCallback) {
    let q;
    if (statusFilter) {
        q = query(collection(db, SACRIFICES_COLLECTION), where("status", "==", statusFilter), orderBy("createdAt", "desc"));
    } else {
        q = query(collection(db, SACRIFICES_COLLECTION), orderBy("createdAt", "desc"));
    }
    return onSnapshot(q, callback, errorCallback); // onSnapshot يرجع دالة إلغاء الاشتراك
}

export function getSacrificesForUser(userId, callback, errorCallback) {
    const q = query(collection(db, SACRIFICES_COLLECTION), where("userId", "==", userId), orderBy("createdAt", "desc"));
    return onSnapshot(q, callback, errorCallback); // onSnapshot يرجع دالة إلغاء الاشتراك
}

export async function getAllSacrificesForExport() {
    const q = query(collection(db, SACRIFICES_COLLECTION), orderBy("userId"), orderBy("createdAt", "desc")); // لفرز المستخدمين
    return await getDocs(q);
}

// --- (يمكن إضافة عمليات أخرى هنا إذا لزم الأمر) ---
