import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js';
import { getFirestore, collection, addDoc, query, where, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from 'https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js';
import { firebaseConfig } from './config.js';
import { showLoader, hideLoader } from './ui.js';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;
let adminSacrifices = [];
const ADMIN_UID = "AKpJLStGGnRC2Albb8bpZ0KtTGq1"; // UID المسؤول

// ------------------ Event Listeners ------------------
document.getElementById('switchToRegisterLink').addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthSections('register');
});

document.getElementById('switchToLoginLink').addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthSections('login');
});

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    handleLogin();
});

document.getElementById('registrationForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    handleRegistration();
});

document.getElementById('logoutButton').addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('خطأ في تسجيل الخروج:', error);
    }
});

// ------------------ Core Functions ------------------
async function handleLogin() {
    showLoader();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        showStatusMessage('تم تسجيل الدخول بنجاح!', 'success');
    } catch (error) {
        showStatusMessage(`خطأ في تسجيل الدخول: ${error.message}`, 'error');
    } finally {
        hideLoader();
    }
}

async function handleRegistration() {
    showLoader();
    const email = document.getElementById('regEmailInput').value;
    const password = document.getElementById('regPasswordInput').value;
    const confirmPassword = document.getElementById('regConfirmPasswordInput').value;
    const displayName = document.getElementById('regDisplayNameInput').value;

    if (password !== confirmPassword) {
        showStatusMessage('كلمة المرور غير متطابقة!', 'error');
        hideLoader();
        return;
    }

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            displayName: displayName,
            email: email,
            isAdmin: false,
            createdAt: serverTimestamp()
        });
        showStatusMessage('تم إنشاء الحساب بنجاح!', 'success');
    } catch (error) {
        showStatusMessage(`خطأ في التسجيل: ${error.message}`, 'error');
    } finally {
        hideLoader();
    }
}

// ------------------ Export Functions ------------------
window.exportAllToExcel = async () => {
    showLoader();
    try {
        const q = query(collection(db, 'sacrifices'));
        const querySnapshot = await getDocs(q);
        const allData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(allData.map(entry => ({
            'اسم المتبرع': entry.donorName,
            'الأضحية عن': entry.sacrificeFor,
            'حضور': entry.wantsToAttend === 'yes' ? 'نعم' : 'لا',
            'رقم الهاتف': entry.phoneNumber || '',
            'جزء': entry.wantsPortion === 'yes' ? 'نعم' : 'لا',
            'تفاصيل الجزء': entry.portionDetails || '',
            'العنوان': entry.address || '',
            'مدفوع': entry.paymentDone === 'yes' ? 'نعم' : 'لا',
            'رقم الدفتر': entry.receiptBookNumber || '',
            'رقم السند': entry.receiptNumber || '',
            'المساعدة لـ': entry.assistanceFor,
            'بوسيط': entry.broughtByOther === 'yes' ? 'نعم' : 'لا',
            'اسم الوسيط': entry.broughtByOtherName || '',
            'تاريخ التسجيل': entry.timestamp?.seconds 
                ? new Date(entry.timestamp.seconds * 1000).toLocaleDateString('ar-EG')
                : 'غير محدد',
            'الحالة': entry.status === 'pending' ? 'قيد الانتظار' : 'مكتمل'
        })));
        
        XLSX.utils.book_append_sheet(wb, ws, 'البيانات');
        XLSX.writeFile(wb, 'كل_البيانات.xlsx');
    } catch (error) {
        console.error('خطأ التصدير:', error);
        alert('حدث خطأ أثناء التصدير: ' + error.message);
    } finally {
        hideLoader();
    }
}

// ------------------ Admin Functions ------------------
window.updateStatus = async (docId, newStatus) => {
    if (!currentUser || currentUser.uid !== ADMIN_UID) {
        alert('صلاحيات غير كافية!');
        return;
    }
    
    try {
        await updateDoc(doc(db, 'sacrifices', docId), {
            status: newStatus,
            lastEditedBy: ADMIN_UID,
            lastEditedAt: serverTimestamp()
        });
        await loadAdminData();
    } catch (error) {
        console.error('خطأ في التحديث:', error);
    }
}

window.deleteSacrifice = async (docId) => {
    if (!currentUser || currentUser.uid !== ADMIN_UID) {
        alert('صلاحيات غير كافية!');
        return;
    }
    
    if (confirm('هل أنت متأكد من الحذف؟')) {
        try {
            await deleteDoc(doc(db, 'sacrifices', docId));
            await loadAdminData();
        } catch (error) {
            console.error('خطأ في الحذف:', error);
        }
    }
}

// ------------------ Helper Functions ------------------
function toggleAuthSections(section) {
    document.getElementById('loginSection').classList.toggle('hidden-field', section !== 'login');
    document.getElementById('registrationSection').classList.toggle('hidden-field', section !== 'register');
    document.getElementById('switchToLoginLink').classList.toggle('hidden-field', section === 'login');
    document.getElementById('switchToRegisterLink').classList.toggle('hidden-field', section === 'register');
}

function showStatusMessage(message, type) {
    const statusEl = document.getElementById('statusMessage');
    statusEl.textContent = message;
    statusEl.className = type;
}

// ... باقي الدوال كما هي دون تغيير ...
