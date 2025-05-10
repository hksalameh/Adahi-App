// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { firebaseConfig, ADMIN_UID } from './config.js';
import * as authModule from './auth.js';
import * as fsService from './firestoreService.js';
import * as ui from './ui.js'; // يتم استيراد ui.js هنا
import { getFirestore, collection, query, orderBy, where, getDocs, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

// تهيئة Firebase تتم خارج DOMContentLoaded لأنها لا تعتمد على DOM
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = authModule.initializeAuth(); 

let unsubscribeAdminSacrifices = null;
let unsubscribeUserSacrifices = null;
let currentEditingDocId = null;

function setCurrentEditingDocId(id) {
    currentEditingDocId = id;
}

// --- كل المنطق الذي يعتمد على عناصر UI يتم نقله إلى DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
    // console.log("--- DOMContentLoaded in main.js ---");

    // الآن يمكننا الوصول إلى عناصر ui بأمان
    // console.log("--- UI Elements Check inside DOMContentLoaded ---");
    // console.log("ui.loginForm:", ui.loginForm);
    // console.log("ui.logoutButton:", ui.logoutButton);
    // ... (يمكنك إضافة المزيد من التحققات هنا إذا أردت)

    if (ui.authStatusEl) {
        ui.authStatusEl.textContent = 'جاري التحميل...';
        ui.authStatusEl.className = '';
    }

    // Auth form event listeners
    if (ui.loginForm && ui.loginEmailInput && ui.loginPasswordInput && ui.rememberMeCheckbox) {
        // console.log("Attaching submit listener to loginForm..."); 
        ui.loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); 
            // console.log("--- loginForm SUBMITTED ---"); 
            const email = ui.loginEmailInput.value;
            const password = ui.loginPasswordInput.value;
            const rememberMe = ui.rememberMeCheckbox.checked;
            // console.log(`Email: ${email}, Password: (hidden), RememberMe: ${rememberMe}`); 
            if (!email || !password) {
                if (ui.authStatusEl) {
                    ui.authStatusEl.textContent = 'الرجاء إدخال البريد الإلكتروني وكلمة المرور.';
                    ui.authStatusEl.className = 'error';
                }
                return;
            }
            if (ui.authStatusEl) {
                ui.authStatusEl.textContent = 'جاري تسجيل الدخول...';
                ui.authStatusEl.className = '';
            }
            try {
                await authModule.loginUser(email, password, rememberMe); 
                if (ui.loginForm) ui.loginForm.reset();
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
                if (ui.authStatusEl) {
                    ui.authStatusEl.textContent = errorMessage;
                    ui.authStatusEl.className = 'error';
                }
            }
        });
    } else {
        console.error("Could not attach submit listener to loginForm. (DOMContentLoaded)"); 
    }

    // Registration form listener
    if (ui.registrationForm && ui.regEmailInput && ui.regPasswordInput && ui.regConfirmPasswordInput && ui.regDisplayNameInput) {
        ui.registrationForm.addEventListener('submit', async (event) => {
            // ... (منطق التسجيل كما هو) ...
            event.preventDefault();
            const displayName = ui.regDisplayNameInput.value.trim();
            const email = ui.regEmailInput.value.trim();
            const password = ui.regPasswordInput.value;
            const confirmPassword = ui.regConfirmPasswordInput.value;

            if (!displayName || !email || !password || !confirmPassword) {
                if (ui.authStatusEl) {
                    ui.authStatusEl.textContent = 'الرجاء ملء جميع حقول التسجيل.';
                    ui.authStatusEl.className = 'error';
                }
                return;
            }
            if (password !== confirmPassword) {
                if (ui.authStatusEl) {
                    ui.authStatusEl.textContent = 'كلمتا المرور غير متطابقتين.';
                    ui.authStatusEl.className = 'error';
                }
                return;
            }
            if (password.length < 6) {
                if (ui.authStatusEl) {
                    ui.authStatusEl.textContent = 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.';
                    ui.authStatusEl.className = 'error';
                }
                return;
            }

            if (ui.authStatusEl) {
                ui.authStatusEl.textContent = 'جاري إنشاء الحساب...';
                ui.authStatusEl.className = '';
            }

            try {
                const userCredential = await authModule.registerUser(email, password, displayName);
                if (ui.registrationForm) ui.registrationForm.reset();
            } catch (error) {
                console.error('Registration error inside submit handler:', error);
                let errorMessage = 'فشل إنشاء الحساب. ';
                if (error.code === 'auth/email-already-in-use') {
                    errorMessage += 'هذا البريد الإلكتروني مسجل بالفعل.';
                } else if (error.code === 'auth/weak-password') {
                    errorMessage += 'كلمة المرور ضعيفة جدًا.';
                } else if (error.code === 'auth/invalid-email') {
                    errorMessage += 'صيغة البريد الإلكتروني غير صحيحة.';
                } else {
                    errorMessage += error.message; 
                }
                if (ui.authStatusEl) {
                    ui.authStatusEl.textContent = errorMessage;
                    ui.authStatusEl.className = 'error';
                }
            }
        });
    } else {
        console.error("Could not attach submit listener to registrationForm. (DOMContentLoaded)");
    }

    // Toggle links listeners
    if (ui.switchToRegisterLink && ui.switchToLoginLink && ui.loginSection && ui.registrationSection && ui.formToggleLinksDiv) {
        ui.switchToRegisterLink.addEventListener('click', (e) => {
            // ... (منطق التبديل كما هو) ...
            e.preventDefault();
            if (ui.loginSection) ui.loginSection.classList.add('hidden-field');
            if (ui.registrationSection) ui.registrationSection.classList.remove('hidden-field');
            if (ui.switchToRegisterLink) ui.switchToRegisterLink.classList.add('hidden-field');
            if (ui.switchToLoginLink) ui.switchToLoginLink.classList.remove('hidden-field');
            if (ui.authStatusEl) { ui.authStatusEl.textContent = 'قم بإنشاء حساب جديد أو سجل دخولك إذا كان لديك حساب بالفعل.'; ui.authStatusEl.className = ''; }
            if (ui.loginForm) ui.loginForm.reset();
            if (ui.registrationForm) ui.registrationForm.reset();
        });
        ui.switchToLoginLink.addEventListener('click', (e) => {
            // ... (منطق التبديل كما هو) ...
            e.preventDefault();
            if (ui.registrationSection) ui.registrationSection.classList.add('hidden-field');
            if (ui.loginSection) ui.loginSection.classList.remove('hidden-field');
            if (ui.switchToLoginLink) ui.switchToLoginLink.classList.add('hidden-field');
            if (ui.switchToRegisterLink) ui.switchToRegisterLink.classList.remove('hidden-field');
            if (ui.authStatusEl) { ui.authStatusEl.textContent = 'سجل دخولك أو قم بإنشاء حساب جديد.'; ui.authStatusEl.className = ''; }
            if (ui.loginForm) ui.loginForm.reset();
            if (ui.registrationForm) ui.registrationForm.reset();
        });
    } else {
        console.error("Could not attach click listeners to toggle links. (DOMContentLoaded)");
    }

    // Logout button listener
    if (ui.logoutButton) {
        ui.logoutButton.addEventListener('click', async () => {
            // ... (منطق تسجيل الخروج كما هو) ...
            if (ui.authStatusEl) {
                ui.authStatusEl.textContent = 'جاري تسجيل الخروج...';
                ui.authStatusEl.className = '';
            }
            try {
                await authModule.handleSignOut();
                if (ui.authStatusEl) {
                    ui.authStatusEl.textContent = 'تم تسجيل الخروج بنجاح.';
                    ui.authStatusEl.className = 'success';
                }
                setTimeout(() => {
                     if (ui.authStatusEl && ui.authStatusEl.textContent === 'تم تسجيل الخروج بنجاح.') {
                        ui.authStatusEl.textContent = 'يرجى تسجيل الدخول أو إنشاء حساب جديد للمتابعة.';
                        ui.authStatusEl.className = '';
                     }
                }, 2000);
            } catch (error) {
                console.error('Logout error:', error);
                if (ui.authStatusEl) {
                    ui.authStatusEl.textContent = 'خطأ في تسجيل الخروج: ' + error.message;
                    ui.authStatusEl.className = 'error';
                }
            }
        });
    } else {
        console.error("ui.logoutButton not found. (DOMContentLoaded)");
    }

    // Adahi form submit listener
    if (ui.adahiForm) {
        ui.adahiForm.addEventListener('submit', async (event) => {
            // ... (منطق إرسال نموذج الأضاحي كما هو) ...
             event.preventDefault();
            const authService = authModule.getAuthInstance(); 
            if (!authService || !authService.currentUser) {
                if(ui.statusMessageEl) {ui.statusMessageEl.textContent = 'يجب تسجيل الدخول أولاً لإضافة أو تعديل البيانات.'; ui.statusMessageEl.className = 'error';}
                return; 
            }
            const currentUser = authService.currentUser;
            const editorIdentifier = currentUser.displayName || currentUser.email;

            const adahiDataToSave = {
                donorName: ui.donorNameInput.value, 
                sacrificeFor: ui.sacrificeForInput.value,
                wantsToAttend: ui.wantsToAttendYesRadio.checked, 
                phoneNumber: ui.phoneNumberInput.value,
                wantsPortion: ui.wantsPortionYesRadio.checked,
                portionDetails: ui.wantsPortionYesRadio.checked ? ui.portionDetailsInput.value : '',
                address: ui.wantsPortionYesRadio.checked ? ui.addressInput.value : '',
                paymentDone: ui.paymentDoneYesRadio.checked,
                receiptBookNumber: ui.paymentDoneYesRadio.checked ? ui.receiptBookNumberInput.value : '',
                receiptNumber: ui.paymentDoneYesRadio.checked ? ui.receiptNumberInput.value : '',
                assistanceFor: ui.assistanceForSelect.value,
                broughtByOther: ui.broughtByOtherYesRadio.checked,
                broughtByOtherName: ui.broughtByOtherYesRadio.checked ? ui.broughtByOtherNameInput.value : '',
            };
            
            if (currentEditingDocId) {
                if(ui.statusMessageEl) {ui.statusMessageEl.textContent = 'جاري تحديث البيانات...'; ui.statusMessageEl.className = '';}
                adahiDataToSave.lastEditedBy = editorIdentifier;
                adahiDataToSave.lastEditedAt = serverTimestamp();
                try {
                    await fsService.updateSacrifice(currentEditingDocId, adahiDataToSave, editorIdentifier);
                    if(ui.statusMessageEl) {ui.statusMessageEl.textContent = 'تم تحديث البيانات بنجاح!'; ui.statusMessageEl.className = 'success';}
                    ui.resetAdahiFormToEntryMode(setCurrentEditingDocId);
                } catch (e) { 
                    console.error("Update error:", e);
                    if(ui.statusMessageEl) {ui.statusMessageEl.textContent = 'خطأ في تحديث البيانات: ' + e.message; ui.statusMessageEl.className = 'error';}
                }
            } else {
                if(ui.statusMessageEl) {ui.statusMessageEl.textContent = 'جاري حفظ البيانات...'; ui.statusMessageEl.className = '';}
                adahiDataToSave.userId = currentUser.uid;
                adahiDataToSave.enteredBy = editorIdentifier;
                adahiDataToSave.status = 'pending_entry';
                adahiDataToSave.createdAt = serverTimestamp();

                try {
                    const docRefDb = await fsService.addSacrifice(adahiDataToSave);
                    if(ui.statusMessageEl) {ui.statusMessageEl.textContent = 'تم حفظ البيانات بنجاح! رقم المرجع: ' + docRefDb.id; ui.statusMessageEl.className = 'success';}
                    ui.resetAdahiFormToEntryMode(setCurrentEditingDocId);
                } catch (e) { 
                    console.error("Add error:", e);
                    if(ui.statusMessageEl) {ui.statusMessageEl.textContent = 'خطأ في حفظ البيانات: ' + e.message; ui.statusMessageEl.className = 'error';}
                }
            }
        });
    } else {
        console.error("ui.adahiForm not found. (DOMContentLoaded)");
    }

    // Filter buttons event listeners
    if (ui.filterAllButton) ui.filterAllButton.addEventListener('click', () => fetchAndRenderSacrificesForAdmin('all'));
    if (ui.filterPendingButton) ui.filterPendingButton.addEventListener('click', () => fetchAndRenderSacrificesForAdmin('pending_entry'));
    if (ui.filterEnteredButton) ui.filterEnteredButton.addEventListener('click', () => fetchAndRenderSacrificesForAdmin('entered'));

    // --- Event Listeners for Excel Export Buttons ---
    if (ui.exportAllToExcelButton) {
        ui.exportAllToExcelButton.addEventListener('click', async () => {
            // ... (منطق التصدير العام كما هو) ...
        });
    } else {
        console.error("ui.exportAllToExcelButton not found. (DOMContentLoaded)");
    }

    if (ui.exportAllUsersSeparateExcelButton) {
        ui.exportAllUsersSeparateExcelButton.addEventListener('click', async () => {
            // ... (منطق تصدير المستخدمين المنفصل كما هو) ...
        });
    } else {
        console.error("ui.exportAllUsersSeparateExcelButton not found. (DOMContentLoaded)");
    }


    // onAuthStateChanged يجب أن يكون خارج DOMContentLoaded ليستمع للتغييرات فورًا
    // لكن تحديثات الواجهة بداخله يجب أن تتحقق من وجود العناصر
    // console.log("Setting up onAuthStateChanged listener (already set up globally)...");

}); // نهاية DOMContentLoaded


// onAuthStateChanged يتم ربطه مرة واحدة على المستوى العام
// console.log("Setting up onAuthStateChanged listener globally...");
authModule.onAuthStateChanged((user) => {
    // console.log("--- onAuthStateChanged Fired ---"); 
    // ... (منطق onAuthStateChanged كما هو من الردود السابقة مع التأكد من أن fetchAndRender... يتم استدعاؤها) ...
    const allMainSections = [
        ui.loginSection, ui.registrationSection, ui.formToggleLinksDiv,
        ui.dataEntrySection, ui.adminViewSection, ui.userDataViewSection,
        ui.logoutButton, ui.hrAfterLogout
    ];
    allMainSections.forEach(el => { 
        if (el) {
            el.classList.add('hidden-field'); 
        }
    });
    const exportAllBtn = ui.exportAllToExcelButton; 
    const exportUsersSepBtn = ui.exportAllUsersSeparateExcelButton;
    if(exportAllBtn) exportAllBtn.classList.add('hidden-field');
    if(exportUsersSepBtn) exportUsersSepBtn.classList.add('hidden-field');

    if (user) {
        if (ui.authStatusEl) {
            ui.authStatusEl.textContent = `مرحباً بك ${user.displayName || user.email}!`;
            ui.authStatusEl.className = 'success';
        }
        if (ui.logoutButton) ui.logoutButton.classList.remove('hidden-field');
        if (ui.hrAfterLogout) ui.hrAfterLogout.classList.remove('hidden-field');
        if (ui.dataEntrySection) ui.dataEntrySection.classList.remove('hidden-field');
        if (user.uid === ADMIN_UID) {
            if (ui.adminViewSection) ui.adminViewSection.classList.remove('hidden-field');
            fetchAndRenderSacrificesForAdmin(); 
            if(exportAllBtn) exportAllBtn.classList.remove('hidden-field');
            if(exportUsersSepBtn) exportUsersSepBtn.classList.remove('hidden-field');
        } else {
            if (ui.userDataViewSection) ui.userDataViewSection.classList.remove('hidden-field');
            fetchAndRenderSacrificesForUserUI(user.uid); 
        }
        if (ui.adahiForm) ui.resetAdahiFormToEntryMode(setCurrentEditingDocId);
    } else {
        if (ui.loginSection) ui.loginSection.classList.remove('hidden-field');
        if (ui.formToggleLinksDiv) ui.formToggleLinksDiv.classList.remove('hidden-field');
        if (ui.switchToLoginLink) ui.switchToLoginLink.classList.add('hidden-field');
        if (ui.switchToRegisterLink) ui.switchToRegisterLink.classList.remove('hidden-field');
        if (ui.registrationSection) ui.registrationSection.classList.add('hidden-field');
        if (ui.sacrificesTableBody) ui.sacrificesTableBody.innerHTML = '';
        if (ui.userSacrificesTableBody) ui.userSacrificesTableBody.innerHTML = '';
        const initialAuthMsg = 'يرجى تسجيل الدخول أو إنشاء حساب جديد للمتابعة.';
         if (ui.authStatusEl) {
            if (ui.authStatusEl.textContent.includes('مرحباً بك') || 
                ui.authStatusEl.textContent === 'تم تسجيل الخروج بنجاح.' || 
                ui.authStatusEl.textContent === 'جاري التحميل...' || 
                ui.authStatusEl.textContent === '' ||
                !ui.authStatusEl.classList.contains('error')) { 
                 ui.authStatusEl.textContent = initialAuthMsg;
                 ui.authStatusEl.className = '';
            }
        }
        if (ui.statusMessageEl) { 
            ui.statusMessageEl.textContent = '';
            ui.statusMessageEl.className = '';
        }
        if (unsubscribeAdminSacrifices) { unsubscribeAdminSacrifices(); unsubscribeAdminSacrifices = null; }
        if (unsubscribeUserSacrifices) { unsubscribeUserSacrifices(); unsubscribeUserSacrifices = null; }
        currentEditingDocId = null;
    }
});

// --- دوال العرض والتحديث للجداول ---
// ... (دوال renderCellValue, renderSacrificesForAdminUI, renderSacrificesForUserUI كما هي) ...
// --- تعريف الدوال التي تم حذفها عن طريق الخطأ ---
function renderCellValue(value, isBooleanNoMeansEmpty = false, conditionalEmptyValue = '') {
    if (value === null || typeof value === 'undefined') return '';
    if (isBooleanNoMeansEmpty && value === false) return '';
    if (typeof value === 'boolean') return value ? 'نعم' : (isBooleanNoMeansEmpty ? '' : 'لا');
    if (value === conditionalEmptyValue && conditionalEmptyValue !== '') return '';
    return String(value);
}

function renderSacrificesForAdminUI(docsSnapshot) {
    if (!ui.sacrificesTableBody) { return; }
    ui.sacrificesTableBody.innerHTML = '';
    if (docsSnapshot.empty) {
        if (ui.adminLoadingMessage) {
            ui.adminLoadingMessage.textContent = 'لا توجد بيانات لعرضها حاليًا.';
            ui.adminLoadingMessage.style.display = 'block';
        }
        ui.sacrificesTableBody.innerHTML = '<tr><td colspan="18">لا توجد بيانات.</td></tr>'; 
        return;
    }
    if (ui.adminLoadingMessage) ui.adminLoadingMessage.style.display = 'none';
    let counter = 1;
    docsSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const row = ui.sacrificesTableBody.insertRow();
        row.insertCell().textContent = counter++;
        row.insertCell().textContent = renderCellValue(data.donorName);
        row.insertCell().textContent = renderCellValue(data.sacrificeFor);
        row.insertCell().textContent = renderCellValue(data.wantsToAttend, true); 
        row.insertCell().textContent = renderCellValue(data.phoneNumber);
        row.insertCell().textContent = renderCellValue(data.wantsPortion, true); 
        row.insertCell().textContent = data.wantsPortion ? renderCellValue(data.portionDetails, false, 'غير محدد') : '';
        row.insertCell().textContent = data.wantsPortion ? renderCellValue(data.address, false, 'غير محدد') : '';
        row.insertCell().textContent = renderCellValue(data.paymentDone, true); 
        row.insertCell().textContent = data.paymentDone ? renderCellValue(data.receiptBookNumber, false, 'غير محدد') : '';
        row.insertCell().textContent = data.paymentDone ? renderCellValue(data.receiptNumber, false, 'غير محدد') : '';
        let assistanceForText = '';
        if (data.assistanceFor === 'inside_ramtha') assistanceForText = 'داخل الرمثا';
        else if (data.assistanceFor === 'gaza_people') assistanceForText = 'لأهل غزة';
        else if (data.assistanceFor === 'for_himself') assistanceForText = 'لنفسه';
        row.insertCell().textContent = assistanceForText;
        row.insertCell().textContent = renderCellValue(data.enteredBy, false, 'غير معروف'); 
        row.insertCell().textContent = renderCellValue(data.broughtByOther, true); 
        row.insertCell().textContent = data.broughtByOther ? renderCellValue(data.broughtByOtherName, false, 'غير محدد') : '';
        row.insertCell().textContent = data.createdAt ? ui.formatFirestoreTimestamp(data.createdAt) : '';
        let statusText = ''; 
        if (data.status === 'pending_entry') statusText = 'لم تدخل بعد';
        else if (data.status === 'entered') statusText = 'تم الإدخال';
        row.insertCell().textContent = statusText;
        const actionsCell = row.insertCell();
        actionsCell.style.whiteSpace = 'nowrap';
        const authService = authModule.getAuthInstance();
        const currentAdminUser = authService ? authService.currentUser : null;
        const adminIdentifier = currentAdminUser ? (currentAdminUser.displayName || currentAdminUser.email) : 'مسؤول النظام';
        if (data.status === 'pending_entry') {
            const confirmButton = document.createElement('button');
            confirmButton.textContent = 'تأكيد';
            confirmButton.className = 'action-button confirm';
            confirmButton.title = 'تأكيد الإدخال';
            confirmButton.onclick = async () => {
                if (confirm("هل أنت متأكد من تأكيد هذا الإدخال؟")) {
                    try {
                        await fsService.updateSacrifice(docSnapshot.id, { status: 'entered', lastEditedBy: adminIdentifier, lastEditedAt: serverTimestamp() }, adminIdentifier);
                    } catch (e) { alert('خطأ في تأكيد الإدخال: ' + e.message); }
                }
            };
            actionsCell.appendChild(confirmButton);
        } else if (data.status === 'entered') {
            const revertButton = document.createElement('button');
            revertButton.textContent = "إعادة";
            revertButton.className = 'action-button revert';
            revertButton.title = "إعادة لـ 'لم تدخل بعد'";
            revertButton.onclick = async () => {
                 if (confirm("هل أنت متأكد من إعادة هذا الإدخال إلى 'لم تدخل بعد'؟")) {
                    try {
                        await fsService.updateSacrifice(docSnapshot.id, { status: 'pending_entry', lastEditedBy: adminIdentifier, lastEditedAt: serverTimestamp() }, adminIdentifier);
                    } catch (e) { alert('خطأ في إعادة الإدخال: ' + e.message); }
                }
            };
            actionsCell.appendChild(revertButton);
        }
        const editButton = document.createElement('button');
        editButton.textContent = 'تعديل';
        editButton.className = 'action-button edit';
        editButton.onclick = () => ui.populateAdahiFormForEdit(docSnapshot.id, data, setCurrentEditingDocId);
        actionsCell.appendChild(editButton);
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'حذف';
        deleteButton.className = 'action-button delete delete-btn';
        deleteButton.onclick = async () => {
            if (confirm(`هل أنت متأكد من حذف أضحية المتبرع "${data.donorName || 'غير مسمى'}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
                try {
                    await fsService.deleteSacrifice(docSnapshot.id);
                } catch (e) { alert('خطأ في الحذف: ' + e.message); }
            }
        };
        actionsCell.appendChild(deleteButton);
    });
}

function renderSacrificesForUserUI(docsSnapshot) {
    if (!ui.userSacrificesTableBody) { return; }
    ui.userSacrificesTableBody.innerHTML = '';
    if (docsSnapshot.empty) {
        if (ui.userLoadingMessage) {
            ui.userLoadingMessage.textContent = 'لم تقم بتسجيل أي أضاحي بعد.';
            ui.userLoadingMessage.style.display = 'block';
        }
        ui.userSacrificesTableBody.innerHTML = '<tr><td colspan="7">لا توجد أضاحي مسجلة باسمك.</td></tr>';
        return;
    }
    if (ui.userLoadingMessage) ui.userLoadingMessage.style.display = 'none';
    let counter = 1;
    docsSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const row = ui.userSacrificesTableBody.insertRow();
        row.insertCell().textContent = counter++;
        row.insertCell().textContent = renderCellValue(data.donorName);
        row.insertCell().textContent = renderCellValue(data.sacrificeFor);
        row.insertCell().textContent = renderCellValue(data.broughtByOther, true);
        row.insertCell().textContent = data.broughtByOther ? renderCellValue(data.broughtByOtherName, false, 'غير محدد') : '';
        row.insertCell().textContent = data.createdAt ? ui.formatFirestoreTimestamp(data.createdAt) : '';
        let statusText = '';
        if (data.status === 'pending_entry') statusText = 'قيد المراجعة';
        else if (data.status === 'entered') statusText = 'مؤكد';
        row.insertCell().textContent = statusText;
    });
}

async function fetchAndRenderSacrificesForAdmin(filterStatus = 'all') {
    const authService = authModule.getAuthInstance();
    if (!authService || !authService.currentUser || authService.currentUser.uid !== ADMIN_UID) return;
    if (ui.adminLoadingMessage) {
        ui.adminLoadingMessage.style.display = 'block';
        ui.adminLoadingMessage.textContent = 'جاري تحميل بيانات المسؤول...';
    }
    if (unsubscribeAdminSacrifices) unsubscribeAdminSacrifices();
    const sacrificesCol = collection(db, "sacrifices");
    let q;
    if (filterStatus === 'all') {
        q = query(sacrificesCol, orderBy("createdAt", "desc"));
    } else {
        q = query(sacrificesCol, where("status", "==", filterStatus), orderBy("createdAt", "desc"));
    }
    unsubscribeAdminSacrifices = onSnapshot(q, (querySnapshot) => {
        renderSacrificesForAdminUI(querySnapshot);
        if (ui.adminLoadingMessage && !querySnapshot.empty) {
            ui.adminLoadingMessage.style.display = 'none';
        } else if (querySnapshot.empty && ui.adminLoadingMessage) {
            ui.adminLoadingMessage.textContent = 'لا توجد بيانات تطابق الفلتر الحالي.';
            ui.adminLoadingMessage.style.display = 'block';
        }
    }, (error) => {
        console.error("Error fetching admin sacrifices with onSnapshot: ", error);
        if (ui.adminLoadingMessage) ui.adminLoadingMessage.textContent = 'خطأ في تحميل بيانات المسؤول: ' + error.message;
        if (ui.sacrificesTableBody) ui.sacrificesTableBody.innerHTML = `<tr><td colspan="18">خطأ في تحميل البيانات.</td></tr>`;
    });
}

async function fetchAndRenderSacrificesForUserUI(userId) {
    if (!userId) return;
    if (ui.userLoadingMessage) {
        ui.userLoadingMessage.style.display = 'block';
        ui.userLoadingMessage.textContent = 'جاري تحميل أضاحيك المسجلة...';
    }
    if (unsubscribeUserSacrifices) unsubscribeUserSacrifices();
    const sacrificesCol = collection(db, "sacrifices");
    const q = query(sacrificesCol, where("userId", "==", userId), orderBy("createdAt", "desc"));
    unsubscribeUserSacrifices = onSnapshot(q, (querySnapshot) => {
        renderSacrificesForUserUI(querySnapshot);
         if (ui.userLoadingMessage && !querySnapshot.empty) {
            ui.userLoadingMessage.style.display = 'none';
        } else if (querySnapshot.empty && ui.userLoadingMessage) {
            ui.userLoadingMessage.textContent = 'لم تقم بتسجيل أي أضاحي بعد.';
            ui.userLoadingMessage.style.display = 'block';
        }
    }, (error) => {
        console.error("Error fetching user sacrifices with onSnapshot: ", error);
        if (ui.userLoadingMessage) ui.userLoadingMessage.textContent = 'خطأ في تحميل الأضاحي: ' + error.message;
        if (ui.userSacrificesTableBody) ui.userSacrificesTableBody.innerHTML = `<tr><td colspan="7">خطأ في تحميل البيانات.</td></tr>`;
    });
}


// --- Excel Export Functions ---
// ... (دوال exportDataToExcel كما هي) ...
function exportDataToExcel(dataArray, headerKeys, displayHeaders, filename) {
    if (typeof XLSX === 'undefined') {
        console.error("SheetJS (XLSX) library is not loaded!");
        if (ui.authStatusEl) {
            ui.authStatusEl.textContent = "خطأ: مكتبة تصدير Excel غير محملة.";
            ui.authStatusEl.className = 'error';
        }
        return;
    }
    const dataForSheet = [displayHeaders];
    dataArray.forEach(obj => {
        const row = headerKeys.map(key => {
            let cellValue = obj[key];
            if ((key === 'createdAt' || key === 'lastEditedAt') && cellValue && typeof cellValue.seconds === 'number') {
                cellValue = ui.formatFirestoreTimestamp(cellValue);
            } else if (typeof cellValue === 'boolean') {
                cellValue = cellValue ? 'نعم' : ''; 
            } else if (cellValue === null || typeof cellValue === 'undefined') {
                cellValue = '';
            }
            return cellValue;
        });
        dataForSheet.push(row);
    });
    const ws = XLSX.utils.aoa_to_sheet(dataForSheet);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "البيانات");
    XLSX.writeFile(wb, filename);
}
