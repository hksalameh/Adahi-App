// firestoreService.js
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, where, doc, updateDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { firebaseConfig } from './config.js';

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const SACRIFICES_COLLECTION = "sacrifices";

export async function addSacrifice(data) {
    return await addDoc(collection(db, SACRIFICES_COLLECTION), data);
}

// تعديل: إضافة adminIdentifier لتخزين من قام بالتحديث (للحالة أو التعديل الكامل)
export async function updateSacrifice(docId, dataToUpdate, editorIdentifier = null) {
    const docRef = doc(db, SACRIFICES_COLLECTION, docId);
    const finalData = { ...dataToUpdate, lastUpdatedAt: serverTimestamp() };
    if (editorIdentifier) {
        finalData.lastEditedBy = editorIdentifier;
    }
    return await updateDoc(docRef, finalData);
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
    const q = query(collection(db, SACRIFICES_COLLECTION), orderBy("userId"), orderBy("createdAt", "desc"));
    return await getDocs(q);
}
