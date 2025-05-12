// firestoreService.js
import { getFirestore, collection, addDoc, serverTimestamp, onSnapshot, query, orderBy, where, doc, updateDoc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";
import { initializeApp, getApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { firebaseConfig } from './config.js';

// Ensure Firebase is initialized (defensive check)
let db;
try {
    const app = getApp();
    db = getFirestore(app);
} catch (e) {
    console.warn("Firebase app might not have been initialized before firestoreService.js was imported. Initializing now.");
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
}

const SACRIFICES_COLLECTION = "sacrifices";

/**
 * Adds a new sacrifice record to Firestore.
 * Automatically adds createdAt timestamp, userId, userEmail, and default status.
 * @param {object} data - The sacrifice data object (excluding metadata like userId, createdAt, status).
 * @param {string} userId - The UID of the user adding the record.
 * @param {string} enteredBy - Display name or email of the user entering the data.
 * @returns {Promise<DocumentReference>} A Promise resolving with the DocumentReference of the newly added document.
 */
export async function addSacrifice(data, userId, enteredBy) {
    if (!userId || !enteredBy) {
        throw new Error("User ID and Entered By identifier are required to add a sacrifice.");
    }
    const sacrificeData = {
        ...data,
        createdAt: serverTimestamp(),
        userId: userId,
        enteredBy: enteredBy, // Identifier of who entered the data initially
        status: 'pending_entry', // Standardized initial status
        lastEditedBy: null, // Initialize editing fields
        lastEditedAt: null
    };
    return await addDoc(collection(db, SACRIFICES_COLLECTION), sacrificeData);
}


/**
 * Updates an existing sacrifice record in Firestore.
 * @param {string} docId - The ID of the document to update.
 * @param {object} dataToUpdate - An object containing the fields to update.
 * @param {string} editorIdentifier - The display name or email of the admin/user performing the update. Required.
 * @returns {Promise<void>} A Promise resolving when the update is complete.
 */
export async function updateSacrifice(docId, dataToUpdate, editorIdentifier) {
    if (!editorIdentifier) {
        throw new Error("Editor identifier is required to update a sacrifice.");
    }
    const docRef = doc(db, SACRIFICES_COLLECTION, docId);
    const finalData = {
        ...dataToUpdate,
        lastEditedAt: serverTimestamp(),
        lastEditedBy: editorIdentifier // Record who made the last edit
    };
    // Ensure status updates also record the editor explicitly if passed separately
    if (dataToUpdate.status && !finalData.lastEditedBy) {
         finalData.lastEditedBy = editorIdentifier;
    }
    return await updateDoc(docRef, finalData);
}

/**
 * Deletes a sacrifice record from Firestore.
 * @param {string} docId - The ID of the document to delete.
 * @returns {Promise<void>} A Promise resolving when the deletion is complete.
 */
export async function deleteSacrifice(docId) {
    const docRef = doc(db, SACRIFICES_COLLECTION, docId);
    return await deleteDoc(docRef);
}

/**
 * Sets up a real-time listener for sacrifices for the admin view.
 * Can filter by status ('pending_entry', 'entered', or null/undefined for all).
 * @param {'pending_entry' | 'entered' | null | undefined} statusFilter - The status to filter by, or null/undefined for all.
 * @param {function} callback - Function to call with the query snapshot when data changes.
 * @param {function} errorCallback - Function to call if an error occurs.
 * @returns {function} An unsubscribe function to stop listening.
 */
export function getSacrificesForAdmin(statusFilter, callback, errorCallback) {
    let q;
    const sacrificesCol = collection(db, SACRIFICES_COLLECTION);
    if (statusFilter && (statusFilter === 'pending_entry' || statusFilter === 'entered')) {
        q = query(sacrificesCol, where("status", "==", statusFilter), orderBy("createdAt", "desc"));
    } else {
        // Default to showing all, ordered by creation date
        q = query(sacrificesCol, orderBy("createdAt", "desc"));
    }
    // console.log(`[FirestoreService] Setting up admin listener with filter: ${statusFilter || 'all'}`);
    return onSnapshot(q, callback, errorCallback);
}

/**
 * Sets up a real-time listener for sacrifices belonging to a specific user.
 * @param {string} userId - The UID of the user whose records to fetch.
 * @param {function} callback - Function to call with the query snapshot when data changes.
 * @param {function} errorCallback - Function to call if an error occurs.
 * @returns {function} An unsubscribe function to stop listening.
 */
export function getSacrificesForUser(userId, callback, errorCallback) {
    if (!userId) {
        console.error("[FirestoreService] Cannot get sacrifices for user without userId.");
        return () => {}; // Return a no-op unsubscribe function
    }
    const q = query(collection(db, SACRIFICES_COLLECTION), where("userId", "==", userId), orderBy("createdAt", "desc"));
    // console.log(`[FirestoreService] Setting up user listener for UID: ${userId}`);
    return onSnapshot(q, callback, errorCallback);
}

/**
 * Fetches all sacrifice records once for data export purposes.
 * Orders by userId first, then by creation date.
 * @returns {Promise<QuerySnapshot>} A Promise resolving with the query snapshot containing all documents.
 */
export async function getAllSacrificesForExport() {
    // Consider ordering requirements for export. Ordering by user might be useful for separate exports.
    const q = query(collection(db, SACRIFICES_COLLECTION), orderBy("userId"), orderBy("createdAt", "desc"));
    return await getDocs(q);
}
