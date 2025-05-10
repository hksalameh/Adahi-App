// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { firebaseConfig, ADMIN_UID } from './config.js';
import * as authModule from './auth.js';
import * as fsService from './firestoreService.js';
import * as uiGetters from './ui.js'; // <<<--- تغيير اسم الاستيراد
import { getFirestore, collection, query, orderBy, where, getDocs, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = authModule.initializeAuth(); 

let unsubscribeAdminSacrifices = null;
let unsubscribeUserSacrifices = null;
let currentEditingDocId = null;

// --- متغيرات لتخزين عناصر UI بعد تحميل DOM ---
let ui = {}; // <<<--- كائن فارغ سيتم ملؤه لاحقًا

function setCurrentEditingDocId(id) {
    currentEditingDocId = id;
}

document.addEventListener('DOMContentLoaded', () => {
    // console.log("--- DOMContentLoaded in main.js ---");

    // --- تعبئة كائن ui بالعناصر الفعلية من DOM ---
    ui.loginElements = uiGetters.getLoginElements();
    ui.registrationElements = uiGetters.getRegistrationElements();
    ui.toggleLinkElements = uiGetters.getToggleLinkElements();
    ui.commonUIElements = uiGetters.getCommonUIElements();
    ui.dataEntryFormElements = uiGetters.getDataEntryFormElements();
    ui.adminViewElements = uiGetters.getAdminViewElements();
    ui.userDataViewElements = uiGetters.getUserDataViewElements();
    
    // استدعاء إعداد مستمعي الحقول الشرطية من ui.js
    uiGetters.setupConditionalFieldListeners();


    if (ui.commonUIElements.authStatusEl) {
        ui.commonUIElements.authStatusEl.textContent = 'جاري التحميل...';
        ui.commonUIElements.authStatusEl.className = '';
    }

    // Auth form event listeners
    if (ui.loginElements.loginForm && ui.loginElements.loginEmailInput && ui.loginElements.loginPasswordInput && ui.loginElements.rememberMeCheckbox) {
        // console.log("Attaching submit listener to loginForm..."); 
        ui.loginElements.loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); 
            // console.log("--- loginForm SUBMITTED ---"); 
            const email = ui.loginElements.loginEmailInput.value;
            const password = ui.loginElements.loginPasswordInput.value;
            const rememberMe = ui.loginElements.rememberMeCheckbox.checked;
            // console.log(`Email: ${email}, Password: (hidden), RememberMe: ${rememberMe}`); 
            if (!email || !password) {
                if (ui.commonUIElements.authStatusEl) {
                    ui.commonUIElements.authStatusEl.textContent = 'الرجاء إدخال البريد الإلكتروني وكلمة المرور.';
                    ui.commonUIElements.authStatusEl.className = 'error';
                }
                return;
            }
            if (ui.commonUIElements.authStatusEl) {
                ui.commonUIElements.authStatusEl.textContent = 'جاري تسجيل الدخول...';
                ui.commonUIElements.authStatusEl.className = '';
            }
            try {
                await authModule.loginUser(email, password, rememberMe); 
                if (ui.loginElements.loginForm) ui.loginElements.loginForm.reset();
            } catch (error) {
                console.error('Login error inside submit handler:', error); 
                let errorMessage = 'فشل تسجيل الدخول. ';
                 if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                    errorMessage += 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage += 'صيغة البريد الإلكتروني غير صحيحة.';
                } else if (error.code && error.code.startsWith('auth/')) { 
                    errorMessage += `خطأ مصادقة: ${error.message}`;
                } else {
                    errorMessage += error.message; 
                }
                if (ui.commonUIElements.authStatusEl) {
                    ui.commonUIElements.authStatusEl.textContent = errorMessage;
                    ui.commonUIElements.authStatusEl.className = 'error';
                }
            }
        });
    } else {
        console.error("Could not attach submit listener to loginForm. (DOMContentLoaded)"); 
    }

    // Registration form listener
    if (ui.registrationElements.registrationForm && ui.registrationElements.regEmailInput && ui.registrationElements.regPasswordInput && ui.registrationElements.regConfirmPasswordInput && ui.registrationElements.regDisplayNameInput) {
        ui.registrationElements.registrationForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const displayName = ui.registrationElements.regDisplayNameInput.value.trim();
            const email = ui.registrationElements.regEmailInput.value.trim();
            const password = ui.registrationElements.regPasswordInput.value;
            const confirmPassword = ui.registrationElements.regConfirmPasswordInput.value;

            if (!displayName || !email || !password || !confirmPassword) {
                if (ui.commonUIElements.authStatusEl) {
                    ui.commonUIElements.authStatusEl.textContent = 'الرجاء ملء جميع حقول التسجيل.';
                    ui.commonUIElements.authStatusEl.className = 'error';
                } return;
            }
            // ... (بقية التحققات كما هي) ...
            if (password !== confirmPassword) { /* ... */ }
            if (password.length < 6) { /* ... */ }

            if (ui.commonUIElements.authStatusEl) {
                ui.commonUIElements.authStatusEl.textContent = 'جاري إنشاء الحساب...';
                ui.commonUIElements.authStatusEl.className = '';
            }
            try {
                await authModule.registerUser(email, password, displayName);
                if (ui.registrationElements.registrationForm) ui.registrationElements.registrationForm.reset();
            } catch (error) {
                console.error('Registration error inside submit handler:', error);
                // ... (معالجة الخطأ كما هي) ...
            }
        });
    } else {
        console.error("Could not attach submit listener to registrationForm. (DOMContentLoaded)");
    }

    // Toggle links listeners
    if (ui.toggleLinkElements.switchToRegisterLink && ui.toggleLinkElements.switchToLoginLink && ui.loginElements.loginSection && ui.registrationElements.registrationSection && ui.toggleLinkElements.formToggleLinksDiv) {
        ui.toggleLinkElements.switchToRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (ui.loginElements.loginSection) ui.loginElements.loginSection.classList.add('hidden-field');
            // ... (بقية منطق التبديل باستخدام ui.xxxElements.elementName) ...
        });
        ui.toggleLinkElements.switchToLoginLink.addEventListener('click', (e) => {
            // ... (منطق التبديل) ...
        });
    } else {
        console.error("Could not attach click listeners to toggle links. (DOMContentLoaded)");
    }

    // Logout button listener
    if (ui.commonUIElements.logoutButton) {
        ui.commonUIElements.logoutButton.addEventListener('click', async () => {
            // ... (منطق تسجيل الخروج باستخدام ui.commonUIElements.authStatusEl) ...
        });
    } else {
        console.error("ui.commonUIElements.logoutButton not found. (DOMContentLoaded)");
    }

    // Adahi form submit listener
    if (ui.dataEntryFormElements.adahiForm) {
        ui.dataEntryFormElements.adahiForm.addEventListener('submit', async (event) => {
            // ... (منطق إرسال نموذج الأضاحي باستخدام ui.dataEntryFormElements.elementName) ...
        });
    } else {
        console.error("ui.dataEntryFormElements.adahiForm not found. (DOMContentLoaded)");
    }

    // Filter buttons event listeners
    if (ui.adminViewElements.filterAllButton) ui.adminViewElements.filterAllButton.addEventListener('click', () => fetchAndRenderSacrificesForAdmin('all'));
    if (ui.adminViewElements.filterPendingButton) ui.adminViewElements.filterPendingButton.addEventListener('click', () => fetchAndRenderSacrificesForAdmin('pending_entry'));
    if (ui.adminViewElements.filterEnteredButton) ui.adminViewElements.filterEnteredButton.addEventListener('click', () => fetchAndRenderSacrificesForAdmin('entered'));

    // --- Event Listeners for Excel Export Buttons ---
    if (ui.adminViewElements.exportAllToExcelButton) {
        ui.adminViewElements.exportAllToExcelButton.addEventListener('click', async () => {
            // ... (منطق التصدير العام كما هو، مع استخدام ui.commonUIElements.authStatusEl) ...
        });
    } else {
        console.error("ui.adminViewElements.exportAllToExcelButton not found. (DOMContentLoaded)");
    }

    if (ui.adminViewElements.exportAllUsersSeparateExcelButton) {
        ui.adminViewElements.exportAllUsersSeparateExcelButton.addEventListener('click', async () => {
            // ... (منطق تصدير المستخدمين المنفصل كما هو، مع استخدام ui.commonUIElements.authStatusEl) ...
        });
    } else {
        console.error("ui.adminViewElements.exportAllUsersSeparateExcelButton not found. (DOMContentLoaded)");
    }

    // استدعاء onAuthStateChanged مرة واحدة بعد إعداد كل شيء في DOMContentLoaded
    // للتأكد من أن الواجهة يتم تحديثها بناءً على حالة المصادقة الأولية
    // هذا سيتم استدعاؤه تلقائيًا بواسطة Firebase عند التحميل الأولي أيضًا
    // لكننا نضمن أن دوال تحديث الواجهة لدينا ستكون جاهزة
    // ملاحظة: هذا قد يكون فائضًا عن الحاجة إذا كان onAuthStateChanged العام يعمل بشكل صحيح.
    // authModule.onAuthStateChanged(handleAuthStateChange); // تم نقل هذا للخارج

}); // نهاية DOMContentLoaded


// --- دالة لمعالجة تغيير حالة المصادقة (سيتم استدعاؤها بواسطة Firebase) ---
function handleAuthStateChange(user) {
    // console.log("--- handleAuthStateChange Fired ---", user); 

    // التأكد من أن عناصر UI قد تم الحصول عليها (يجب أن تكون كذلك إذا كان هذا بعد DOMContentLoaded)
    if (!ui.loginElements) {
        // console.warn("UI elements not yet initialized in handleAuthStateChange. DOM might not be ready or ui object not populated.");
        // يمكنك محاولة تهيئتها هنا مرة أخرى كإجراء احتياطي، أو تأجيل التحديث
        ui.loginElements = uiGetters.getLoginElements();
        ui.registrationElements = uiGetters.getRegistrationElements();
        ui.toggleLinkElements = uiGetters.getToggleLinkElements();
        ui.commonUIElements = uiGetters.getCommonUIElements();
        ui.dataEntryFormElements = uiGetters.getDataEntryFormElements();
        ui.adminViewElements = uiGetters.getAdminViewElements();
        ui.userDataViewElements = uiGetters.getUserDataViewElements();
    }


    const allMainSections = [
        ui.loginElements.loginSection, ui.registrationElements.registrationSection, 
        ui.toggleLinkElements.formToggleLinksDiv, ui.dataEntryFormElements.dataEntrySection, 
        ui.adminViewElements.adminViewSection, ui.userDataViewElements.userDataViewSection,
        ui.commonUIElements.logoutButton, ui.commonUIElements.hrAfterLogout
    ];

    allMainSections.forEach(el => { 
        if (el) el.classList.add('hidden-field'); 
    });
    
    const exportAllBtn = ui.adminViewElements.exportAllToExcelButton; 
    const exportUsersSepBtn = ui.adminViewElements.exportAllUsersSeparateExcelButton;
    if(exportAllBtn) exportAllBtn.classList.add('hidden-field');
    if(exportUsersSepBtn) exportUsersSepBtn.classList.add('hidden-field');

    if (user) {
        if (ui.commonUIElements.authStatusEl) {
            ui.commonUIElements.authStatusEl.textContent = `مرحباً بك ${user.displayName || user.email}!`;
            ui.commonUIElements.authStatusEl.className = 'success';
        }
        if (ui.commonUIElements.logoutButton) ui.commonUIElements.logoutButton.classList.remove('hidden-field');
        if (ui.commonUIElements.hrAfterLogout) ui.commonUIElements.hrAfterLogout.classList.remove('hidden-field');
        if (ui.dataEntryFormElements.dataEntrySection) ui.dataEntryFormElements.dataEntrySection.classList.remove('hidden-field');

        if (user.uid === ADMIN_UID) {
            if (ui.adminViewElements.adminViewSection) ui.adminViewElements.adminViewSection.classList.remove('hidden-field');
            fetchAndRenderSacrificesForAdmin(); 
            if(exportAllBtn) exportAllBtn.classList.remove('hidden-field');
            if(exportUsersSepBtn) exportUsersSepBtn.classList.remove('hidden-field');
        } else {
            if (ui.userDataViewElements.userDataViewSection) ui.userDataViewElements.userDataViewSection.classList.remove('hidden-field');
            fetchAndRenderSacrificesForUserUI(user.uid); 
        }
        if (ui.dataEntryFormElements.adahiForm) uiGetters.resetAdahiFormToEntryMode(setCurrentEditingDocId);
    } else {
        if (ui.loginElements.loginSection) ui.loginElements.loginSection.classList.remove('hidden-field');
        if (ui.toggleLinkElements.formToggleLinksDiv) ui.toggleLinkElements.formToggleLinksDiv.classList.remove('hidden-field');
        if (ui.toggleLinkElements.switchToLoginLink) ui.toggleLinkElements.switchToLoginLink.classList.add('hidden-field');
        if (ui.toggleLinkElements.switchToRegisterLink) ui.toggleLinkElements.switchToRegisterLink.classList.remove('hidden-field');
        if (ui.registrationElements.registrationSection) ui.registrationElements.registrationSection.classList.add('hidden-field');
        
        if (ui.adminViewElements.sacrificesTableBody) ui.adminViewElements.sacrificesTableBody.innerHTML = '';
        if (ui.userDataViewElements.userSacrificesTableBody) ui.userDataViewElements.userSacrificesTableBody.innerHTML = '';

        const initialAuthMsg = 'يرجى تسجيل الدخول أو إنشاء حساب جديد للمتابعة.';
         if (ui.commonUIElements.authStatusEl) {
            if (ui.commonUIElements.authStatusEl.textContent.includes('مرحباً بك') || 
                ui.commonUIElements.authStatusEl.textContent === 'تم تسجيل الخروج بنجاح.' || 
                ui.commonUIElements.authStatusEl.textContent === 'جاري التحميل...' || 
                ui.commonUIElements.authStatusEl.textContent === '' ||
                !ui.commonUIElements.authStatusEl.classList.contains('error')) { 
                 ui.commonUIElements.authStatusEl.textContent = initialAuthMsg;
                 ui.commonUIElements.authStatusEl.className = '';
            }
        }
        if (ui.dataEntryFormElements.statusMessageEl) { 
            ui.dataEntryFormElements.statusMessageEl.textContent = '';
            ui.dataEntryFormElements.statusMessageEl.className = '';
        }
        if (unsubscribeAdminSacrifices) { unsubscribeAdminSacrifices(); unsubscribeAdminSacrifices = null; }
        if (unsubscribeUserSacrifices) { unsubscribeUserSacrifices(); unsubscribeUserSacrifices = null; }
        currentEditingDocId = null;
    }
}

// ربط مستمع onAuthStateChanged على المستوى العام
authModule.onAuthStateChanged(handleAuthStateChange);


// --- دوال العرض والتحديث للجداول ---
// ... (دوال renderCellValue, renderSacrificesForAdminUI, renderSacrificesForUserUI كما هي، مع التأكد من استخدام ui.xxxElements.elementName) ...
// --- تعريف الدوال التي تم حذفها عن طريق الخطأ ---
// ... (جميع الدوال من fetchAndRender... إلى نهاية دوال التصدير، مع التأكد من أنها تستخدم ui.xxxElements.elementName عند الحاجة) ...
// ... (يجب نسخ ولصق هذه الدوال من الردود السابقة التي كانت تحتوي عليها كاملة) ...
// مثال لتعديل renderSacrificesForAdminUI (يجب تعديل جميع الإشارات إلى ui.sacrificesTableBody etc.)
function renderSacrificesForAdminUI(docsSnapshot) {
    if (!ui.adminViewElements || !ui.adminViewElements.sacrificesTableBody) { return; } // استخدام الكائن المعبأ
    // ... باقي الدالة كما هي
}
// ... (وبالمثل لبقية الدوال)
