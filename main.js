// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { firebaseConfig, ADMIN_UID } from './config.js';
import * as authModule from './auth.js';
import * as fsService from './firestoreService.js';
import * as ui from './ui.js';
import { getFirestore, collection, query, orderBy, where, getDocs, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = authModule.initializeAuth(); 

let unsubscribeAdminSacrifices = null;
let unsubscribeUserSacrifices = null;
let currentEditingDocId = null;

function setCurrentEditingDocId(id) {
    currentEditingDocId = id;
}

if (!ui.loginForm) console.warn("ui.loginForm لم يتم العثور عليه.");
if (!ui.loginEmailInput) console.warn("ui.loginEmailInput لم يتم العثور عليه.");
if (!ui.loginPasswordInput) console.warn("ui.loginPasswordInput لم يتم العثور عليه.");
if (!ui.logoutButton) console.warn("ui.logoutButton لم يتم العثور عليه.");
if (!ui.authStatusEl) console.warn("ui.authStatusEl لم يتم العثور عليه.");
if (!ui.statusMessageEl) console.warn("ui.statusMessageEl لم يتم العثور عليه.");
if (!ui.loginSection) console.warn("ui.loginSection لم يتم العثور عليه.");
if (!ui.dataEntrySection) console.warn("ui.dataEntrySection لم يتم العثور عليه.");
if (!ui.adminViewSection) console.warn("ui.adminViewSection لم يتم العثور عليه.");
if (!ui.userDataViewSection) console.warn("ui.userDataViewSection لم يتم العثور عليه.");
if (!ui.hrAfterLogout) console.warn("ui.hrAfterLogout لم يتم العثور عليه.");
if (!ui.registrationSection) console.warn("ui.registrationSection لم يتم العثور عليه.");
if (!ui.registrationForm) console.warn("ui.registrationForm لم يتم العثور عليه.");
if (!ui.regDisplayNameInput) console.warn("ui.regDisplayNameInput لم يتم العثور عليه.");
if (!ui.regEmailInput) console.warn("ui.regEmailInput لم يتم العثور عليه.");
if (!ui.regPasswordInput) console.warn("ui.regPasswordInput لم يتم العثور عليه.");
if (!ui.regConfirmPasswordInput) console.warn("ui.regConfirmPasswordInput لم يتم العثور عليه.");
if (!ui.switchToRegisterLink) console.warn("ui.switchToRegisterLink لم يتم العثور عليه.");
if (!ui.switchToLoginLink) console.warn("ui.switchToLoginLink لم يتم العثور عليه.");
if (!ui.formToggleLinksDiv) console.warn("ui.formToggleLinksDiv لم يتم العثور عليه.");

if (ui.loginForm && ui.loginEmailInput && ui.loginPasswordInput) {
    ui.loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = ui.loginEmailInput.value;
        const password = ui.loginPasswordInput.value;
        
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
            await authModule.loginUser(email, password);
            if (ui.loginForm) ui.loginForm.reset();
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'فشل تسجيل الدخول. ';
             if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage += 'البريد الإلكتروني أو كلمة المرور غير صحيحة.';
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
}

if (ui.registrationForm && ui.regEmailInput && ui.regPasswordInput && ui.regConfirmPasswordInput && ui.regDisplayNameInput) {
    ui.registrationForm.addEventListener('submit', async (event) => {
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
            // console.log('User registered successfully:', userCredential.user);
            if (ui.registrationForm) ui.registrationForm.reset();
        } catch (error) {
            console.error('Registration error:', error);
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
}

if (ui.switchToRegisterLink && ui.switchToLoginLink && ui.loginSection && ui.registrationSection && ui.formToggleLinksDiv) {
    ui.switchToRegisterLink.addEventListener('click', (e) => {
        e.preventDefault();
        ui.loginSection.style.display = 'none';
        ui.registrationSection.style.display = 'block';
        ui.switchToRegisterLink.style.display = 'none';
        ui.switchToLoginLink.style.display = 'inline';
        if (ui.authStatusEl) { ui.authStatusEl.textContent = 'قم بإنشاء حساب جديد أو سجل دخولك إذا كان لديك حساب بالفعل.'; ui.authStatusEl.className = ''; }
        if (ui.loginForm) ui.loginForm.reset();
    });

    ui.switchToLoginLink.addEventListener('click', (e) => {
        e.preventDefault();
        ui.registrationSection.style.display = 'none';
        ui.loginSection.style.display = 'block';
        ui.switchToLoginLink.style.display = 'none';
        ui.switchToRegisterLink.style.display = 'inline';
        if (ui.authStatusEl) { ui.authStatusEl.textContent = 'سجل دخولك أو قم بإنشاء حساب جديد.'; ui.authStatusEl.className = ''; }
        if (ui.registrationForm) ui.registrationForm.reset();
    });
}

if (ui.logoutButton) {
    ui.logoutButton.addEventListener('click', async () => {
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
}

authModule.onAuthStateChanged((user) => {
    if (!auth) { 
        console.warn("Auth object in main.js is not ready, onAuthStateChanged might be too early or init failed.");
    }

    if (ui.loginSection) ui.loginSection.style.display = 'none';
    if (ui.registrationSection) ui.registrationSection.style.display = 'none';
    if (ui.formToggleLinksDiv) ui.formToggleLinksDiv.style.display = 'none';
    if (ui.dataEntrySection) ui.dataEntrySection.style.display = 'none';
    if (ui.adminViewSection) ui.adminViewSection.style.display = 'none';
    if (ui.userDataViewSection) ui.userDataViewSection.style.display = 'none';
    if (ui.logoutButton) ui.logoutButton.style.display = 'none';
    if (ui.hrAfterLogout) ui.hrAfterLogout.style.display = 'none';
    
    const exportAllBtn = ui.adminActionsDiv ? ui.adminActionsDiv.querySelector('#exportAllToCsvButton') : null;
    const exportUsersSepBtn = ui.adminActionsDiv ? ui.adminActionsDiv.querySelector('#exportAllUsersSeparateCsvButton') : null;
    if(exportAllBtn) exportAllBtn.style.display = 'none';
    if(exportUsersSepBtn) exportUsersSepBtn.style.display = 'none';

    if (user) {
        // console.log("User is signed in:", user.uid, "| Email:", user.email, "| Display Name:", user.displayName);
        if (ui.authStatusEl) {
            // السطر المطلوب: يعطي الأولوية لـ displayName
            ui.authStatusEl.textContent = `مرحباً بك ${user.displayName || user.email}!`;
            ui.authStatusEl.className = 'success';
        }
        
        if (ui.logoutButton) ui.logoutButton.style.display = 'block';
        if (ui.hrAfterLogout) ui.hrAfterLogout.style.display = 'block';
        if (ui.dataEntrySection) ui.dataEntrySection.style.display = 'block';

        if (user.uid === ADMIN_UID) {
            // console.log("Admin user detected.");
            if (ui.adminViewSection) ui.adminViewSection.style.display = 'block';
            fetchAndRenderSacrificesForAdmin();
            if(exportAllBtn) exportAllBtn.style.display = 'inline-block';
            if(exportUsersSepBtn) exportUsersSepBtn.style.display = 'inline-block';
        } else {
            // console.log("Regular user detected.");
            if (ui.userDataViewSection) ui.userDataViewSection.style.display = 'block';
            fetchAndRenderSacrificesForUserUI(user.uid);
        }
        if (ui.adahiForm) ui.resetAdahiFormToEntryMode(setCurrentEditingDocId);

    } else {
        // console.log("User is signed out.");
        if (ui.loginSection) ui.loginSection.style.display = 'block';
        if (ui.registrationSection) ui.registrationSection.style.display = 'none';
        if (ui.formToggleLinksDiv) ui.formToggleLinksDiv.style.display = 'block';
        if (ui.switchToLoginLink) ui.switchToLoginLink.style.display = 'none';
        if (ui.switchToRegisterLink) ui.switchToRegisterLink.style.display = 'inline';
        
        if (ui.sacrificesTableBody) ui.sacrificesTableBody.innerHTML = '';
        if (ui.userSacrificesTableBody) ui.userSacrificesTableBody.innerHTML = '';

        const initialAuthMsg = 'يرجى تسجيل الدخول أو إنشاء حساب جديد للمتابعة.';
        if (ui.authStatusEl && (ui.authStatusEl.textContent.includes('مرحباً بك') || ui.authStatusEl.textContent === 'تم تسجيل الخروج بنجاح.' || ui.authStatusEl.textContent === 'جاري التحميل...' || ui.authStatusEl.textContent === '')) {
             ui.authStatusEl.textContent = initialAuthMsg;
             ui.authStatusEl.className = '';
        } else if (ui.authStatusEl && !ui.authStatusEl.classList.contains('error')) {
            ui.authStatusEl.textContent = initialAuthMsg;
            ui.authStatusEl.className = '';
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

if (ui.adahiForm) {
    ui.adahiForm.addEventListener('submit', async (event) => {
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
    // console.warn("ui.adahiForm (نموذج إضافة الأضاحي) لم يتم العثور عليه.");
}

function renderSacrificesForAdminUI(docsSnapshot) {
    if (!ui.sacrificesTableBody) { return; }
    ui.sacrificesTableBody.innerHTML = '';
    if (docsSnapshot.empty) {
        if (ui.adminLoadingMessage) {
            ui.adminLoadingMessage.textContent = 'لا توجد بيانات لعرضها حاليًا.';
            ui.adminLoadingMessage.style.display = 'block';
        }
        ui.sacrificesTableBody.innerHTML = '<tr><td colspan="17">لا توجد بيانات.</td></tr>';
        return;
    }
    if (ui.adminLoadingMessage) ui.adminLoadingMessage.style.display = 'none';
    let counter = 1;
    docsSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const row = ui.sacrificesTableBody.insertRow();
        row.insertCell().textContent = counter++;
        row.insertCell().textContent = data.donorName || '';
        row.insertCell().textContent = data.sacrificeFor || '';
        row.insertCell().textContent = data.wantsToAttend ? 'نعم' : 'لا';
        row.insertCell().textContent = data.phoneNumber || 'لا يوجد';
        row.insertCell().textContent = data.wantsPortion ? 'نعم' : 'لا';
        row.insertCell().textContent = data.portionDetails || (data.wantsPortion ? 'غير محدد' : 'لا ينطبق');
        row.insertCell().textContent = data.address || (data.wantsPortion ? 'غير محدد' : 'لا ينطبق');
        row.insertCell().textContent = data.paymentDone ? 'نعم' : 'لا';
        row.insertCell().textContent = data.receiptBookNumber || (data.paymentDone ? 'غير محدد' : 'لا ينطبق');
        row.insertCell().textContent = data.receiptNumber || (data.paymentDone ? 'غير محدد' : 'لا ينطبق');
        let assistanceForText = data.assistanceFor || '';
        if (data.assistanceFor === 'inside_ramtha') assistanceForText = 'داخل الرمثا';
        else if (data.assistanceFor === 'gaza_people') assistanceForText = 'لأهل غزة';
        else if (data.assistanceFor === 'for_himself') assistanceForText = 'لنفسه';
        row.insertCell().textContent = assistanceForText;
        row.insertCell().textContent = data.broughtByOther ? 'نعم' : 'لا';
        row.insertCell().textContent = data.broughtByOtherName || (data.broughtByOther ? 'غير محدد' : 'لا ينطبق');
        row.insertCell().textContent = data.createdAt ? ui.formatFirestoreTimestamp(data.createdAt) : 'غير متوفر';
        let statusText = data.status || '';
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
        row.insertCell().textContent = data.donorName || '';
        row.insertCell().textContent = data.sacrificeFor || '';
        row.insertCell().textContent = data.broughtByOther ? 'نعم' : 'لا';
        row.insertCell().textContent = data.broughtByOtherName || (data.broughtByOther ? 'غير محدد' : 'لا ينطبق');
        row.insertCell().textContent = data.createdAt ? ui.formatFirestoreTimestamp(data.createdAt) : '';
        let statusText = data.status;
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
        if (ui.sacrificesTableBody) ui.sacrificesTableBody.innerHTML = `<tr><td colspan="17">خطأ في تحميل البيانات.</td></tr>`;
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

if (ui.filterAllButton) ui.filterAllButton.addEventListener('click', () => fetchAndRenderSacrificesForAdmin('all'));
if (ui.filterPendingButton) ui.filterPendingButton.addEventListener('click', () => fetchAndRenderSacrificesForAdmin('pending_entry'));
if (ui.filterEnteredButton) ui.filterEnteredButton.addEventListener('click', () => fetchAndRenderSacrificesForAdmin('entered'));

function downloadCSV(csvContent, filename) {
    const blob = new Blob(["\uFEFF"+csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url); link.setAttribute("download", filename);
        link.style.visibility = 'hidden'; document.body.appendChild(link);
        link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    }
}

function convertToCSV(dataArray, headerKeys, displayHeaders) {
    const array = [displayHeaders.join(',')].concat(
        dataArray.map(obj => headerKeys.map(key => {
            let cell = obj[key] === null || typeof obj[key] === 'undefined' ? '' : obj[key];
            if (typeof cell === 'boolean') { cell = cell ? 'نعم' : 'لا'; }
            else if (key === 'status') {
                if (obj[key] === 'pending_entry') cell = 'لم تدخل بعد';
                else if (obj[key] === 'entered') cell = 'تم الإدخال';
            } else if (key === 'assistanceFor') {
                if (obj[key] === 'inside_ramtha') cell = 'داخل الرمثا';
                else if (obj[key] === 'gaza_people') cell = 'لأهل غزة';
                else if (obj[key] === 'for_himself') cell = 'لنفسه';
            } else if (key === 'createdAt' || key === 'lastEditedAt') {
                 if (obj[key] && typeof obj[key].seconds === 'number') {
                    cell = ui.formatFirestoreTimestamp(obj[key]);
                 } else if (obj[key] instanceof Date) { 
                    cell = obj[key].toLocaleString('ar-SA');
                 }
            }
            if (typeof cell === 'string' && cell.includes(',')) { cell = `"${cell.replace(/"/g, '""')}"`; }
            return cell;
        }).join(','))
    );
    return array.join('\r\n');
}

const exportAllToCsvButtonEl = ui.adminActionsDiv ? ui.adminActionsDiv.querySelector('#exportAllToCsvButton') : null;
if (exportAllToCsvButtonEl) {
    exportAllToCsvButtonEl.addEventListener('click', async () => {
        if (ui.authStatusEl) {ui.authStatusEl.textContent = "جاري تجهيز كل البيانات للتصدير..."; ui.authStatusEl.className = '';}
        try {
            const q = query(collection(db, "sacrifices"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) { 
                if (ui.authStatusEl) {ui.authStatusEl.textContent = "لا توجد بيانات للتصدير."; ui.authStatusEl.className = 'error';}
                return; 
            }
            const allData = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                allData.push({
                    docId: doc.id, 
                    donorName: data.donorName, sacrificeFor: data.sacrificeFor,
                    wantsToAttend: data.wantsToAttend, phoneNumber: data.phoneNumber, wantsPortion: data.wantsPortion,
                    portionDetails: data.portionDetails, address: data.address, paymentDone: data.paymentDone,
                    receiptBookNumber: data.receiptBookNumber, receiptNumber: data.receiptNumber,
                    assistanceFor: data.assistanceFor, broughtByOther: data.broughtByOther,
                    broughtByOtherName: data.broughtByOtherName,
                    createdAt: data.createdAt, 
                    status: data.status, userId: data.userId,
                    enteredBy: data.enteredBy || '',
                    lastEditedBy: data.lastEditedBy || '',
                    lastEditedAt: data.lastEditedAt 
                });
            });
            const headerKeys = ["docId", "donorName", "sacrificeFor", "wantsToAttend", "phoneNumber", "wantsPortion", "portionDetails", "address", "paymentDone", "receiptBookNumber", "receiptNumber", "assistanceFor", "broughtByOther", "broughtByOtherName", "createdAt", "status", "userId", "enteredBy", "lastEditedBy", "lastEditedAt"];
            const displayHeaders = ["م.السجل", "المتبرع", "الأضحية عن", "حضور؟", "هاتف", "جزء؟", "تفاصيل الجزء", "العنوان", "مدفوع؟", "ر.الدفتر", "ر.السند", "المساعدة لـ", "بوسيط؟", "اسم الوسيط", "ت.التسجيل", "الحالة", "م.المستخدم", "أدخل بواسطة", "آخر تعديل بواسطة", "تاريخ آخر تعديل"];
            const csvContent = convertToCSV(allData, headerKeys, displayHeaders);
            downloadCSV(csvContent, 'كل_بيانات_الاضاحي.csv');
            if (ui.authStatusEl) {ui.authStatusEl.textContent = "تم تصدير كل البيانات بنجاح."; ui.authStatusEl.className = 'success';}
        } catch (error) { 
            console.error("Error exporting all data: ", error); 
            if (ui.authStatusEl) {ui.authStatusEl.textContent = "خطأ في تصدير كل البيانات: " + error.message; ui.authStatusEl.className = 'error';}
        }
    });
}

const exportAllUsersSeparateCsvButtonEl = ui.adminActionsDiv ? ui.adminActionsDiv.querySelector('#exportAllUsersSeparateCsvButton') : null;
if (exportAllUsersSeparateCsvButtonEl) {
    exportAllUsersSeparateCsvButtonEl.addEventListener('click', async () => {
        if (ui.authStatusEl) {ui.authStatusEl.textContent = "جاري تجهيز بيانات كل مدخل..."; ui.authStatusEl.className = '';}
        try {
            const allSacrificesSnapshot = await fsService.getAllSacrificesForExport();
            if (allSacrificesSnapshot.empty) { 
                if (ui.authStatusEl) {ui.authStatusEl.textContent = "لا توجد بيانات لتصديرها."; ui.authStatusEl.className = 'error';}
                return; 
            }
            
            const dataByUser = {};
            allSacrificesSnapshot.forEach(doc => {
                const data = doc.data();
                const userId = data.userId;
                const userNameForGrouping = data.enteredBy || userId || 'مستخدم_غير_معروف';
                
                const groupKey = userId || 'entries_without_userid';
                
                if (!dataByUser[groupKey]) { 
                    dataByUser[groupKey] = { name: userNameForGrouping, entries: [] };
                }
                
                if (data.enteredBy && data.enteredBy !== userId && dataByUser[groupKey].name === userId) {
                    dataByUser[groupKey].name = data.enteredBy;
                }

                dataByUser[groupKey].entries.push({
                    docId: doc.id, donorName: data.donorName, sacrificeFor: data.sacrificeFor,
                    wantsToAttend: data.wantsToAttend, phoneNumber: data.phoneNumber, wantsPortion: data.wantsPortion,
                    portionDetails: data.portionDetails, address: data.address, paymentDone: data.paymentDone,
                    receiptBookNumber: data.receiptBookNumber, receiptNumber: data.receiptNumber,
                    assistanceFor: data.assistanceFor, broughtByOther: data.broughtByOther,
                    broughtByOtherName: data.broughtByOtherName,
                    createdAt: data.createdAt, status: data.status,
                    enteredBy: data.enteredBy || '', 
                    lastEditedBy: data.lastEditedBy || '',
                    lastEditedAt: data.lastEditedAt
                });
            });

            if (Object.keys(dataByUser).length === 0) { 
                if (ui.authStatusEl) {ui.authStatusEl.textContent = "لم يتم العثور على بيانات مجمعة حسب المدخلين."; ui.authStatusEl.className = 'error';}
                return; 
            }
            
            const headerKeys = ["docId", "donorName", "sacrificeFor", "wantsToAttend", "phoneNumber", "wantsPortion", "portionDetails", "address", "paymentDone", "receiptBookNumber", "receiptNumber", "assistanceFor", "broughtByOther", "broughtByOtherName", "createdAt", "status", "enteredBy", "lastEditedBy", "lastEditedAt"];
            const displayHeaders = ["م.السجل", "المتبرع", "الأضحية عن", "حضور؟", "هاتف", "جزء؟", "تفاصيل الجزء", "العنوان", "مدفوع؟", "ر.الدفتر", "ر.السند", "المساعدة لـ", "بوسيط؟", "اسم الوسيط", "ت.التسجيل", "الحالة", "أدخل بواسطة", "آخر تعديل بواسطة", "تاريخ آخر تعديل"];
            
            let exportedCount = 0;
            const totalUserGroups = Object.keys(dataByUser).length;
            if (ui.authStatusEl) {ui.authStatusEl.textContent = `بدء تصدير ${totalUserGroups} ملف للمدخلين...`;}

            for (const groupKey in dataByUser) {
                if (dataByUser.hasOwnProperty(groupKey)) {
                    const fileNamePart = String(dataByUser[groupKey].name).replace(/[^\p{L}\p{N}_-]/gu, '_');
                    const userDataEntries = dataByUser[groupKey].entries;
                    if (userDataEntries.length > 0) {
                        const csvContent = convertToCSV(userDataEntries, headerKeys, displayHeaders);
                        await new Promise(resolve => setTimeout(resolve, 250));
                        downloadCSV(csvContent, `بيانات_مدخل_${fileNamePart}.csv`);
                        exportedCount++;
                        if (ui.authStatusEl) {ui.authStatusEl.textContent = `تم تصدير ${exportedCount} من ${totalUserGroups} ملف...`;}
                    }
                }
            }
            if (ui.authStatusEl) {ui.authStatusEl.textContent = `تم تصدير بيانات ${exportedCount} مدخل بنجاح في ملفات منفصلة.`; ui.authStatusEl.className = 'success';}
        } catch (error) {
            console.error("Error exporting all users separate data: ", error);
            let errMessage = "خطأ أثناء تصدير بيانات المدخلين: " + error.message;
            if (error.code === 'failed-precondition' && error.message.includes('index')) {
                 errMessage = "خطأ: يتطلب هذا التصدير فهرسًا مركبًا في Firebase. يرجى مراجعة إعدادات الفهرسة.";
            }
            if (ui.authStatusEl) {
                ui.authStatusEl.textContent = errMessage;
                ui.authStatusEl.className = 'error';
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // console.log("DOM fully loaded and parsed. main.js is active.");
    if (ui.authStatusEl) {
        ui.authStatusEl.textContent = 'جاري التحميل...';
        ui.authStatusEl.className = '';
    }
});
