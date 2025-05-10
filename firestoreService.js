// firestoreService.js
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, where, doc, updateDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { firebaseConfig } from './config.js';

const app = initializeApp(firebaseConfig); // تهيئة Firebase مرة واحدة هنا
const db = getFirestore(app);

const SACRIFICES_COLLECTION = "sacrifices";

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
    return onSnapshot(q, callback, errorCallback);
}

export function getSacrificesForUser(userId, callback, errorCallback) {
    const q = query(collection(db, SACRIFICES_COLLECTION), where("userId", "==", userId), orderBy("createdAt", "desc"));
    return onSnapshot(q, callback, errorCallback);
}

export async function getAllSacrificesForExport() {
    // هذا الاستعلام قد يتطلب فهرسًا مركبًا: userId (تصاعدي), createdAt (تنازلي)
    const q = query(collection(db, SACRIFICES_COLLECTION), orderBy("userId"), orderBy("createdAt", "desc"));
    return await getDocs(q);
}
