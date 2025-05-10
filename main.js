// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { firebaseConfig, ADMIN_UID } from './config.js';
import { auth, onAuthStateChanged, loginUser, handleSignOut } from './auth.js';
import * as fsService from './firestoreService.js';
import * as ui from './ui.js';
import { getFirestore, collection, query, orderBy, where, getDocs, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let unsubscribeAdminSacrifices = null;
let unsubscribeUserSacrifices = null;
let currentEditingDocId = null;

function setCurrentEditingDocId(id) {
    currentEditingDocId = id;
}

// --- معالج نموذج تسجيل الدخول ---
if (ui.loginForm) {
    ui.loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = ui.loginEmailInput.value;
        const password = ui.loginPasswordInput.value;
        
        if (!email || !password) {
            if (ui.statusMessageEl) {
                ui.statusMessageEl.textContent = 'الرجاء إدخال البريد الإلكتروني وكلمة المرور.';
                ui.statusMessageEl.className = 'error';
            }
            return;
        }

        if (ui.statusMessageEl) {
            ui.statusMessageEl.textContent = 'جاري تسجيل الدخول...';
            ui.statusMessageEl.className = '';
        }

        try {
            await loginUser(email, password);
            // onAuthStateChanged سيقوم بتحديث الواجهة تلقائياً
            // ui.loginForm.reset(); // يمكنك إلغاء التعليق لإعادة تعيين النموذج
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
            if (ui.statusMessageEl) {
                ui.statusMessageEl.textContent = errorMessage;
                ui.statusMessageEl.className = 'error';
            }
        }
    });
} else {
    console.warn("ui.loginForm (نموذج تسجيل الدخول) لم يتم العثور عليه في ui.js أو index.html. لن تعمل وظيفة تسجيل الدخول.");
}

// --- معالج تسجيل الخروج ---
if (ui.logoutButton) {
    ui.logoutButton.addEventListener('click', async () => {
        if (ui.statusMessageEl) {
            ui.statusMessageEl.textContent = 'جاري تسجيل الخروج...';
            ui.statusMessageEl.className = '';
        }
        try {
            await handleSignOut();
            // onAuthStateChanged سيقوم بتحديث الواجهة تلقائياً
            if (ui.statusMessageEl) {
                ui.statusMessageEl.textContent = 'تم تسجيل الخروج بنجاح.';
                ui.statusMessageEl.className = 'success';
            }
            setTimeout(() => { // مسح الرسالة بعد فترة
                 if (ui.statusMessageEl && ui.statusMessageEl.textContent === 'تم تسجيل الخروج بنجاح.') {
                    ui.statusMessageEl.textContent = 'يرجى تسجيل الدخول للمتابعة.';
                    ui.statusMessageEl.className = '';
                 }
            }, 3000);
        } catch (error) {
            console.error('Logout error:', error);
            if (ui.statusMessageEl) {
                ui.statusMessageEl.textContent = 'خطأ في تسجيل الخروج: ' + error.message;
                ui.statusMessageEl.className = 'error';
            }
        }
    });
} else {
    console.warn("ui.logoutButton (زر تسجيل الخروج) لم يتم العثور عليه. لن تعمل وظيفة تسجيل الخروج.");
}

// --- مراقبة حالة المصادقة وتحديث الواجهة ---
onAuthStateChanged(auth, (user) => {
    if (user) {
        // المستخدم مسجل دخوله
        console.log("User is signed in:", user.uid, user.email);
        if (ui.statusMessageEl) {
            ui.statusMessageEl.textContent = `مرحباً بك ${user.displayName || user.email}!`;
            ui.statusMessageEl.className = 'success';
        }

        if (ui.loginContainer) ui.loginContainer.style.display = 'none';
        if (ui.mainContentContainer) ui.mainContentContainer.style.display = 'block';
        if (ui.logoutButton) ui.logoutButton.style.display = 'inline-block';
        if (ui.adahiFormContainer) ui.adahiFormContainer.style.display = 'block';


        if (user.uid === ADMIN_UID) {
            // واجهة المسؤول
            console.log("Admin user detected.");
            if (ui.adminSection) ui.adminSection.style.display = 'block';
            if (ui.userSection) ui.userSection.style.display = 'none';
            fetchAndRenderSacrificesForAdmin();
            if(ui.exportControls) ui.exportControls.style.display = 'block';
        } else {
            // واجهة المستخدم العادي
            console.log("Regular user detected.");
            if (ui.adminSection) ui.adminSection.style.display = 'none';
            if (ui.userSection) ui.userSection.style.display = 'block';
            fetchAndRenderSacrificesForUserUI(user.uid);
            if(ui.exportControls) ui.exportControls.style.display = 'none';
        }
        ui.resetAdahiFormToEntryMode(setCurrentEditingDocId);

    } else {
        // المستخدم قام بتسجيل الخروج أو لم يسجل دخوله بعد
        console.log("User is signed out.");
        if (ui.loginContainer) ui.loginContainer.style.display = 'block';
        if (ui.mainContentContainer) ui.mainContentContainer.style.display = 'none';
        if (ui.logoutButton) ui.logoutButton.style.display = 'none';
        if (ui.adahiFormContainer) ui.adahiFormContainer.style.display = 'none';
        if (ui.adminSection) ui.adminSection.style.display = 'none';
        if (ui.userSection) ui.userSection.style.display = 'none';
        if (ui.exportControls) ui.exportControls.style.display = 'none';


        if (ui.sacrificesTableBody) ui.sacrificesTableBody.innerHTML = '';
        if (ui.userSacrificesTableBody) ui.userSacrificesTableBody.innerHTML = '';

        if (ui.statusMessageEl && ui.statusMessageEl.textContent.includes('مرحباً بك')) {
             ui.statusMessageEl.textContent = 'يرجى تسجيل الدخول للمتابعة.';
             ui.statusMessageEl.className = '';
        } else if (ui.statusMessageEl && (ui.statusMessageEl.textContent === '' || ui.statusMessageEl.textContent === 'جاري التحميل...')) {
             ui.statusMessageEl.textContent = 'يرجى تسجيل الدخول للمتابعة.';
             ui.statusMessageEl.className = '';
        }


        if (unsubscribeAdminSacrifices) {
            unsubscribeAdminSacrifices();
            unsubscribeAdminSacrifices = null;
        }
        if (unsubscribeUserSacrifices) {
            unsubscribeUserSacrifices();
            unsubscribeUserSacrifices = null;
        }
        currentEditingDocId = null;
    }
});


// --- معالجة نموذج إضافة/تعديل الأضاحي ---
if (ui.adahiForm) {
    ui.adahiForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const currentUser = auth.currentUser;
        if (!currentUser) { 
            if(ui.statusMessageEl) {ui.statusMessageEl.textContent = 'يجب تسجيل الدخول.'; ui.statusMessageEl.className = 'error';}
            return; 
        }

        const adahiDataToSave = {
            donorName: ui.donorNameInput.value, sacrificeFor: ui.sacrificeForInput.value,
            wantsToAttend: ui.wantsToAttendYesRadio.checked, phoneNumber: ui.phoneNumberInput.value,
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

        let editorIdentifier = currentUser.displayName || currentUser.email;

        if (currentEditingDocId) { // وضع التعديل
            if(ui.statusMessageEl) {ui.statusMessageEl.textContent = 'جاري التحديث...'; ui.statusMessageEl.className = '';}
            try {
                await fsService.updateSacrifice(currentEditingDocId, adahiDataToSave, editorIdentifier);
                if(ui.statusMessageEl) {ui.statusMessageEl.textContent = 'تم التحديث بنجاح!'; ui.statusMessageEl.className = 'success';}
                ui.resetAdahiFormToEntryMode(setCurrentEditingDocId);
            } catch (e) { if(ui.statusMessageEl) {ui.statusMessageEl.textContent = 'خطأ تحديث: ' + e.message; ui.statusMessageEl.className = 'error';}}
        } else { // وضع الإضافة
            if(ui.statusMessageEl) {ui.statusMessageEl.textContent = 'جاري الحفظ...'; ui.statusMessageEl.className = '';}
            adahiDataToSave.userId = currentUser.uid;
            adahiDataToSave.status = 'pending_entry';
            adahiDataToSave.createdAt = serverTimestamp();
            adahiDataToSave.enteredBy = editorIdentifier;

            try {
                const docRefDb = await fsService.addSacrifice(adahiDataToSave);
                if(ui.statusMessageEl) {ui.statusMessageEl.textContent = 'تم الحفظ بنجاح! مرجع: ' + docRefDb.id; ui.statusMessageEl.className = 'success';}
                ui.resetAdahiFormToEntryMode(setCurrentEditingDocId);
            } catch (e) { if(ui.statusMessageEl) {ui.statusMessageEl.textContent = 'خطأ حفظ: ' + e.message; ui.statusMessageEl.className = 'error';}}
        }
    });
} else {
    console.warn("ui.adahiForm (نموذج إضافة الأضاحي) لم يتم العثور عليه.");
}

// --- دوال العرض والتحديث للجداول ---
function renderSacrificesForAdminUI(docsSnapshot) {
    if (!ui.sacrificesTableBody) return;
    ui.sacrificesTableBody.innerHTML = '';
    if (docsSnapshot.empty) {
        if (ui.adminLoadingMessage) {
            ui.adminLoadingMessage.textContent = 'لا توجد بيانات لعرضها.';
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
        row.insertCell().textContent = data.phoneNumber || '';
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
        let statusText = data.status || '';
        if (data.status === 'pending_entry') statusText = 'لم تدخل بعد';
        else if (data.status === 'entered') statusText = 'تم الإدخال';
        row.insertCell().textContent = statusText;
        row.insertCell().textContent = data.createdAt ? ui.formatFirestoreTimestamp(data.createdAt) : 'غير متوفر';
        
        const actionsCell = row.insertCell();
        const adminIdentifier = auth.currentUser ? (auth.currentUser.displayName || auth.currentUser.email) : 'مسؤول النظام';

        if (data.status === 'pending_entry') {
            const confirmButton = document.createElement('button');
            confirmButton.textContent = 'تأكيد الإدخال';
            confirmButton.className = 'action-button confirm';
            confirmButton.onclick = async () => {
                if (confirm("هل أنت متأكد من تأكيد هذا الإدخال؟")) {
                    try {
                        await fsService.updateSacrifice(docSnapshot.id, { status: 'entered' }, adminIdentifier);
                    } catch (e) { alert('خطأ في تأكيد الإدخال: ' + e.message); }
                }
            };
            actionsCell.appendChild(confirmButton);
        } else if (data.status === 'entered') {
            const revertButton = document.createElement('button');
            revertButton.textContent = "إعادة لـ 'لم تدخل بعد'";
            revertButton.className = 'action-button revert';
            revertButton.onclick = async () => {
                 if (confirm("هل أنت متأكد من إعادة هذا الإدخال إلى 'لم تدخل بعد'؟")) {
                    try {
                        await fsService.updateSacrifice(docSnapshot.id, { status: 'pending_entry' }, adminIdentifier);
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
        deleteButton.className = 'action-button delete';
        deleteButton.onclick = async () => {
            if (confirm(`هل أنت متأكد من حذف أضحية المتبرع "${data.donorName}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
                try {
                    await fsService.deleteSacrifice(docSnapshot.id);
                } catch (e) { alert('خطأ في الحذف: ' + e.message); }
            }
        };
        actionsCell.appendChild(deleteButton);
    });
}

function renderSacrificesForUserUI(docsSnapshot) {
    if (!ui.userSacrificesTableBody) return;
    ui.userSacrificesTableBody.innerHTML = '';

    if (docsSnapshot.empty) {
        if (ui.userLoadingMessage) {
            ui.userLoadingMessage.textContent = 'لم تقم بتسجيل أي أضاحي بعد.';
            ui.userLoadingMessage.style.display = 'block';
        }
        ui.userSacrificesTableBody.innerHTML = '<tr><td colspan="10">لا توجد أضاحي مسجلة باسمك.</td></tr>';
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
        row.insertCell().textContent = data.wantsToAttend ? 'نعم' : 'لا';
        row.insertCell().textContent = data.phoneNumber || '';
        row.insertCell().textContent = data.wantsPortion ? 'نعم' : 'لا';
        row.insertCell().textContent = data.portionDetails || (data.wantsPortion ? 'غير محدد' : 'لا ينطبق');
        row.insertCell().textContent = data.paymentDone ? 'نعم' : 'لا';
        let statusText = data.status;
        if (data.status === 'pending_entry') statusText = 'لم تدخل بعد (قيد المراجعة)';
        else if (data.status === 'entered') statusText = 'تم الإدخال (مؤكد)';
        row.insertCell().textContent = statusText;
        row.insertCell().textContent = data.createdAt ? ui.formatFirestoreTimestamp(data.createdAt) : '';
    });
}

async function fetchAndRenderSacrificesForAdmin(filterStatus = 'all') {
    if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) return;
    if (ui.adminLoadingMessage) {
        ui.adminLoadingMessage.style.display = 'block';
        ui.adminLoadingMessage.textContent = 'جاري تحميل البيانات...';
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
        if (ui.adminLoadingMessage) ui.adminLoadingMessage.textContent = 'خطأ في تحميل البيانات: ' + error.message;
        if (ui.sacrificesTableBody) ui.sacrificesTableBody.innerHTML = `<tr><td colspan="17">خطأ في تحميل البيانات.</td></tr>`;
    });
}

async function fetchAndRenderSacrificesForUserUI(userId) {
    if (!userId) return;
    if (ui.userLoadingMessage) {
        ui.userLoadingMessage.style.display = 'block';
        ui.userLoadingMessage.textContent = 'جاري تحميل أضاحيك...';
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
        if (ui.userSacrificesTableBody) ui.userSacrificesTableBody.innerHTML = `<tr><td colspan="10">خطأ في تحميل البيانات.</td></tr>`;
    });
}

// --- مستمعو أحداث فلاتر المسؤول ---
if (ui.filterAllButton) {
    ui.filterAllButton.addEventListener('click', () => fetchAndRenderSacrificesForAdmin('all'));
} else { console.warn("ui.filterAllButton not found.");}
if (ui.filterPendingButton) {
    ui.filterPendingButton.addEventListener('click', () => fetchAndRenderSacrificesForAdmin('pending_entry'));
} else { console.warn("ui.filterPendingButton not found.");}
if (ui.filterEnteredButton) {
    ui.filterEnteredButton.addEventListener('click', () => fetchAndRenderSacrificesForAdmin('entered'));
} else { console.warn("ui.filterEnteredButton not found.");}


// --- CSV Export Functions and Listeners ---
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
            let cell = obj[key] === null || obj[key] === undefined ? '' : obj[key];
            if (typeof cell === 'boolean') { cell = cell ? 'نعم' : 'لا'; }
            else if (key === 'status') {
                if (obj[key] === 'pending_entry') cell = 'لم تدخل بعد';
                else if (obj[key] === 'entered') cell = 'تم الإدخال';
            } else if (key === 'assistanceFor') {
                if (obj[key] === 'inside_ramtha') cell = 'داخل الرمثا';
                else if (obj[key] === 'gaza_people') cell = 'لأهل غزة';
                else if (obj[key] === 'for_himself') cell = 'لنفسه';
            }
            if (typeof cell === 'string' && cell.includes(',')) { cell = `"${cell.replace(/"/g, '""')}"`; }
            return cell;
        }).join(','))
    );
    return array.join('\r\n');
}

const exportAllToCsvButtonEl = document.getElementById('exportAllToCsvButton');
if (exportAllToCsvButtonEl) {
    exportAllToCsvButtonEl.addEventListener('click', async () => {
        if (ui.statusMessageEl) {ui.statusMessageEl.textContent = "جاري تجهيز البيانات للتصدير..."; ui.statusMessageEl.className = '';}
        try {
            const q = query(collection(db, "sacrifices"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) { 
                if (ui.statusMessageEl) {ui.statusMessageEl.textContent = "لا توجد بيانات للتصدير."; ui.statusMessageEl.className = 'error';}
                return; 
            }
            const allData = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                allData.push({
                    docId: doc.id, donorName: data.donorName, sacrificeFor: data.sacrificeFor,
                    wantsToAttend: data.wantsToAttend, phoneNumber: data.phoneNumber, wantsPortion: data.wantsPortion,
                    portionDetails: data.portionDetails, address: data.address, paymentDone: data.paymentDone,
                    receiptBookNumber: data.receiptBookNumber, receiptNumber: data.receiptNumber,
                    assistanceFor: data.assistanceFor, broughtByOther: data.broughtByOther,
                    broughtByOtherName: data.broughtByOtherName,
                    createdAt: data.createdAt ? ui.formatFirestoreTimestamp(data.createdAt) : '',
                    status: data.status, userId: data.userId,
                    enteredBy: data.enteredBy || '',
                    lastEditedBy: data.lastEditedBy || ''
                });
            });
            const headerKeys = ["docId", "donorName", "sacrificeFor", "wantsToAttend", "phoneNumber", "wantsPortion", "portionDetails", "address", "paymentDone", "receiptBookNumber", "receiptNumber", "assistanceFor", "broughtByOther", "broughtByOtherName", "createdAt", "status", "userId", "enteredBy", "lastEditedBy"];
            const displayHeaders = ["معرف السجل", "اسم المتبرع", "الأضحية عن", "يريد الحضور", "رقم الهاتف", "يريد جزءًا", "تفاصيل الجزء", "العنوان", "تم الدفع", "رقم الدفتر", "رقم السند", "لمن المساعدة", "أحضرت بواسطة آخر", "اسم الوسيط", "تاريخ التسجيل", "الحالة", "معرف المستخدم", "أدخل بواسطة", "آخر تعديل بواسطة"];
            const csvContent = convertToCSV(allData, headerKeys, displayHeaders);
            downloadCSV(csvContent, 'كل_بيانات_الاضاحي.csv');
            if (ui.statusMessageEl) {ui.statusMessageEl.textContent = "تم التصدير بنجاح."; ui.statusMessageEl.className = 'success';}
        } catch (error) { 
            console.error("Error exporting all data: ", error); 
            if (ui.statusMessageEl) {ui.statusMessageEl.textContent = "خطأ تصدير: " + error.message; ui.statusMessageEl.className = 'error';}
        }
    });
} else { console.warn("exportAllToCsvButtonEl not found.");}

const exportAllUsersSeparateCsvButtonEl = document.getElementById('exportAllUsersSeparateCsvButton');
if (exportAllUsersSeparateCsvButtonEl) {
    exportAllUsersSeparateCsvButtonEl.addEventListener('click', async () => {
        if (ui.statusMessageEl) {ui.statusMessageEl.textContent = "جاري تجهيز بيانات كل مستخدم..."; ui.statusMessageEl.className = '';}
        try {
            const allSacrificesSnapshot = await fsService.getAllSacrificesForExport();
            if (allSacrificesSnapshot.empty) { 
                if (ui.statusMessageEl) {ui.statusMessageEl.textContent = "لا توجد بيانات لتصديرها."; ui.statusMessageEl.className = 'error';}
                return; 
            }
            
            const dataByUser = {};
            allSacrificesSnapshot.forEach(doc => {
                const data = doc.data();
                if (!data.userId) return;
                if (!dataByUser[data.userId]) { 
                    dataByUser[data.userId] = { name: data.enteredBy || data.userId, entries: [] };
                }
                dataByUser[data.userId].entries.push({
                    docId: doc.id, donorName: data.donorName, sacrificeFor: data.sacrificeFor,
                    wantsToAttend: data.wantsToAttend, phoneNumber: data.phoneNumber, wantsPortion: data.wantsPortion,
                    portionDetails: data.portionDetails, address: data.address, paymentDone: data.paymentDone,
                    receiptBookNumber: data.receiptBookNumber, receiptNumber: data.receiptNumber,
                    assistanceFor: data.assistanceFor, broughtByOther: data.broughtByOther,
                    broughtByOtherName: data.broughtByOtherName,
                    createdAt: data.createdAt ? ui.formatFirestoreTimestamp(data.createdAt) : '', status: data.status,
                    enteredBy: data.enteredBy || '', 
                    lastEditedBy: data.lastEditedBy || ''
                });
            });

            if (Object.keys(dataByUser).length === 0) { 
                if (ui.statusMessageEl) {ui.statusMessageEl.textContent = "لم يتم العثور على بيانات مع معرفات مستخدمين صالحة."; ui.statusMessageEl.className = 'error';}
                return; 
            }
            
            const headerKeys = ["docId", "donorName", "sacrificeFor", "wantsToAttend", "phoneNumber", "wantsPortion", "portionDetails", "address", "paymentDone", "receiptBookNumber", "receiptNumber", "assistanceFor", "broughtByOther", "broughtByOtherName", "createdAt", "status", "enteredBy", "lastEditedBy"];
            const displayHeaders = ["معرف السجل", "اسم المتبرع", "الأضحية عن", "يريد الحضور", "رقم الهاتف", "يريد جزءًا", "تفاصيل الجزء", "العنوان", "تم الدفع", "رقم الدفتر", "رقم السند", "لمن المساعدة", "أحضرت بواسطة آخر", "اسم الوسيط", "تاريخ التسجيل", "الحالة", "أدخل بواسطة", "آخر تعديل بواسطة"];
            
            let exportedCount = 0;
            const totalUsers = Object.keys(dataByUser).length;
            if (ui.statusMessageEl) {ui.statusMessageEl.textContent = `بدء تصدير ${totalUsers} ملف...`;}

            for (const userId in dataByUser) {
                if (dataByUser.hasOwnProperty(userId)) {
                    const userNameForFile = String(dataByUser[userId].name).replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_'); // تنظيف اسم المستخدم للملف، مع دعم الحروف العربية
                    const userDataEntries = dataByUser[userId].entries;
                    const csvContent = convertToCSV(userDataEntries, headerKeys, displayHeaders);
                    await new Promise(resolve => setTimeout(resolve, 200));
                    downloadCSV(csvContent, `بيانات_مدخل_${userNameForFile}.csv`);
                    exportedCount++;
                    if (ui.statusMessageEl) {ui.statusMessageEl.textContent = `تم تصدير ${exportedCount} من ${totalUsers} ملف...`;}
                }
            }
            if (ui.statusMessageEl) {ui.statusMessageEl.textContent = `تم تصدير بيانات ${exportedCount} مستخدم بنجاح في ملفات منفصلة.`; ui.statusMessageEl.className = 'success';}
        } catch (error) {
            console.error("Error exporting all users separate data: ", error);
            let errMessage = "خطأ أثناء تصدير بيانات المستخدمين: " + error.message;
            if (error.code === 'failed-precondition' && error.message.includes('index')) {
                 errMessage = "خطأ: يتطلب هذا التصدير فهرسًا مركبًا. يرجى التحقق من Firebase Console: sacrifices -> userId (ASC), createdAt (DESC). أو orderBy enteredBy (ASC), createdAt(DESC)";
            }
            if (ui.statusMessageEl) {
                ui.statusMessageEl.textContent = errMessage;
                ui.statusMessageEl.className = 'error';
            }
        }
    });
} else { console.warn("exportAllUsersSeparateCsvButtonEl not found.");}

// --- مستمع تحميل المحتوى ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed. main.js is active.");
    if (ui.statusMessageEl) {
        ui.statusMessageEl.textContent = 'جاري التحميل...';
        ui.statusMessageEl.className = ''; // بدون ستايل خطأ أو نجاح
    }
    // لا حاجة لتهيئة loginForm هنا بشكل خاص، onAuthStateChanged سيتولى الأمر
});
