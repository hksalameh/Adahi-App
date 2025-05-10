import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { 
    getFirestore, 
    collection, 
    addDoc, 
    query, 
    where, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    serverTimestamp,
    setDoc 
} from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { firebaseConfig } from './config.js';
import { showLoader, hideLoader, setupConditionalFieldListeners, resetAdahiFormToEntryMode } from './ui.js';

// التهيئة
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const ADMIN_UID = "AKpJLStGGnRC2Albb8bpZ0KtTGq1";

// المتغيرات العامة
let currentUser = null;
let adminSacrifices = [];
let currentFilter = 'all';

// --------------------- Event Listeners ---------------------
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupConditionalFieldListeners();
});

function setupEventListeners() {
    // الروابط والنماذج
    document.getElementById('switchToRegisterLink').addEventListener('click', toggleAuthForms);
    document.getElementById('switchToLoginLink').addEventListener('click', toggleAuthForms);
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('registrationForm').addEventListener('submit', handleRegistration);
    document.getElementById('logoutButton').addEventListener('click', handleLogout);
    
    // الأزرار الإدارية
    document.getElementById('filterPending').addEventListener('click', () => applyFilter('pending'));
    document.getElementById('filterEntered').addEventListener('click', () => applyFilter('entered'));
    document.getElementById('filterAll').addEventListener('click', () => applyFilter('all'));
    document.getElementById('exportAllToExcelButton').addEventListener('click', exportAllToExcel);
    document.getElementById('exportAllUsersSeparateExcelButton').addEventListener('click', exportUsersSeparate);
    
    // مصادقة المستخدم
    onAuthStateChanged(auth, handleAuthStateChange);
}

// --------------------- Core Functions ---------------------
async function handleLogin(e) {
    e.preventDefault();
    showLoader();
    try {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        await signInWithEmailAndPassword(auth, email, password);
        showStatus('تم تسجيل الدخول بنجاح', 'success');
    } catch (error) {
        showStatus(`خطأ في التسجيل: ${error.message}`, 'error');
    } finally {
        hideLoader();
    }
}

async function handleRegistration(e) {
    e.preventDefault();
    showLoader();
    try {
        const email = document.getElementById('regEmailInput').value;
        const password = document.getElementById('regPasswordInput').value;
        const displayName = document.getElementById('regDisplayNameInput').value;
        
        // إنشاء المستخدم وإعداد البيانات
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            displayName,
            email,
            isAdmin: false,
            createdAt: serverTimestamp()
        });
        showStatus('تم إنشاء الحساب بنجاح', 'success');
        toggleAuthForms();
    } catch (error) {
        showStatus(`خطأ في التسجيل: ${error.message}`, 'error');
    } finally {
        hideLoader();
    }
}

async function handleAuthStateChange(user) {
    if (user) {
        // جلب بيانات المستخدم
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        currentUser = {
            uid: user.uid,
            email: user.email,
            isAdmin: userDoc.exists() ? userDoc.data().isAdmin : false
        };
        
        // تحديث الواجهة
        updateUIForUser();
        if (currentUser.isAdmin) {
            await loadAdminData();
            document.getElementById('adminViewSection').classList.remove('hidden-field');
        }
    } else {
        // إعادة التعيين عند تسجيل الخروج
        currentUser = null;
        resetUI();
    }
}

// --------------------- Admin Functions ---------------------
window.updateStatus = async (docId, newStatus) => {
    if (!currentUser?.isAdmin) return;
    
    try {
        await updateDoc(doc(db, 'sacrifices', docId), {
            status: newStatus,
            lastEditedBy: currentUser.uid,
            lastEditedAt: serverTimestamp()
        });
        await loadAdminData();
    } catch (error) {
        console.error('فشل في تحديث الحالة:', error);
    }
};

window.deleteSacrifice = async (docId) => {
    if (!currentUser?.isAdmin) return;
    
    if (confirm('هل أنت متأكد من الحذف؟')) {
        try {
            await deleteDoc(doc(db, 'sacrifices', docId));
            await loadAdminData();
        } catch (error) {
            console.error('فشل في الحذف:', error);
        }
    }
};

// --------------------- Helper Functions ---------------------
function updateUIForUser() {
    // إظهار/إخفاء الأقسام حسب الصلاحيات
    const isAdmin = currentUser?.isAdmin;
    document.querySelectorAll('.admin-only').forEach(el => el.style.display = isAdmin ? 'block' : 'none');
    document.getElementById('dataEntrySection').classList.remove('hidden-field');
    document.getElementById('logoutButton').classList.remove('hidden-field');
}

function resetUI() {
    // إعادة تعيين الواجهة
    document.getElementById('adminViewSection').classList.add('hidden-field');
    document.getElementById('dataEntrySection').classList.add('hidden-field');
    document.getElementById('logoutButton').classList.add('hidden-field');
    resetAdahiFormToEntryMode();
}

async function loadAdminData() {
    try {
        const q = query(collection(db, 'sacrifices'));
        const snapshot = await getDocs(q);
        adminSacrifices = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderAdminTable();
        updateSummary();
    } catch (error) {
        console.error('فشل في تحميل البيانات:', error);
    }
}

function renderAdminTable() {
    const tbody = document.getElementById('sacrificesTableBody');
    tbody.innerHTML = adminSacrifices.map((sacrifice, index) => `
        <tr>
            <td>${index + 1}</td>
            <td>${sacrifice.donorName}</td>
            <td>${sacrifice.sacrificeFor}</td>
            <!-- ... (جميع الأعمدة الأخرى) ... -->
            <td>
                ${sacrifice.status === 'pending' ? 
                    `<button class="confirm" onclick="updateStatus('${sacrifice.id}', 'entered')">تم الإدخال</button>` : 
                    `<button class="revert" onclick="updateStatus('${sacrifice.id}', 'pending')">تراجع</button>`}
                <button class="edit" onclick="editSacrifice('${sacrifice.id}')">تعديل</button>
                <button class="delete-btn" onclick="deleteSacrifice('${sacrifice.id}')">حذف</button>
            </td>
        </tr>
    `).join('');
}

// ... (جميع الدوال الأخرى مكتوبة بالكامل هنا) ...
