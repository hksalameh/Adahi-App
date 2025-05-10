// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js"; // Keep for other initializations if any
import { firebaseConfig, ADMIN_UID } from './config.js';
import { auth, onAuthStateChanged, loginUser, handleSignOut } from './auth.js';
import * as fsService from './firestoreService.js';
import * as ui from './ui.js';
import { serverTimestamp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";


// const app = initializeApp(firebaseConfig); // Already initialized in auth.js and firestoreService.js

let unsubscribeAdminSacrifices = null;
let unsubscribeUserSacrifices = null;
let currentEditingDocId = null;

function setCurrentEditingDocId(id) {
    currentEditingDocId = id;
}

// --- UI Event Listeners ---
ui.wantsPortionYesRadio.addEventListener('change', function() { if (this.checked) { ui.portionDetailsDiv.style.display = 'block'; ui.addressFieldDiv.style.display = 'block';} else { ui.portionDetailsDiv.style.display = 'none'; ui.addressFieldDiv.style.display = 'none'; ui.portionDetailsInput.value = ''; ui.addressInput.value = '';}});
ui.wantsPortionNoRadio.addEventListener('change', function() { if (this.checked) { ui.portionDetailsDiv.style.display = 'none'; ui.addressFieldDiv.style.display = 'none'; ui.portionDetailsInput.value = ''; ui.addressInput.value = '';}});
ui.paymentDoneYesRadio.addEventListener('change', function() { if (this.checked) { ui.paymentDetailsDiv.style.display = 'block';} else { ui.paymentDetailsDiv.style.display = 'none'; ui.receiptBookNumberInput.value = ''; ui.receiptNumberInput.value = '';}});
ui.paymentDoneNoRadio.addEventListener('change', function() { if (this.checked) { ui.paymentDetailsDiv.style.display = 'none'; ui.receiptBookNumberInput.value = ''; ui.receiptNumberInput.value = '';}});
ui.broughtByOtherYesRadio.addEventListener('change', function() { if (this.checked) { ui.broughtByOtherNameDiv.style.display = 'block'; } else { ui.broughtByOtherNameDiv.style.display = 'none'; ui.broughtByOtherNameInput.value = '';}});
ui.broughtByOtherNoRadio.addEventListener('change', function() { if (this.checked) { ui.broughtByOtherNameDiv.style.display = 'none'; ui.broughtByOtherNameInput.value = ''; }});

const loginFormEl = document.getElementById('loginForm');
if (loginFormEl) {
    loginFormEl.addEventListener('submit', async (e) => {
        e.preventDefault();
        ui.authStatusEl.textContent = 'جاري التحقق...'; ui.authStatusEl.className = '';
        const usernameOrEmail = document.getElementById('usernameInput').value;
        const password = document.getElementById('passwordInput').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        try {
            await loginUser(usernameOrEmail, password, rememberMe);
            // onAuthStateChanged handles UI update
        } catch (error) {
            console.error("Login error in main.js:", error);
            ui.authStatusEl.textContent = error.message || 'فشل تسجيل الدخول.';
            ui.authStatusEl.className = 'error';
        }
    });
}

if (ui.logoutButton) {
    ui.logoutButton.addEventListener('click', async () => {
        const result = await handleSignOut();
        if (!result.success) {
            ui.authStatusEl.textContent = `خطأ في الخروج: ${result.error}`;
            ui.authStatusEl.className = 'error';
        }
        // onAuthStateChanged handles UI update
    });
}

onAuthStateChanged(auth, async (user) => {
    if (unsubscribeAdminSacrifices) unsubscribeAdminSacrifices();
    if (unsubscribeUserSacrifices) unsubscribeUserSacrifices();
    currentEditingDocId = null; // Reset editing state on auth change

    if (user) {
        ui.showAuthenticatedView(user.uid === ADMIN_UID);
        if (user.uid === ADMIN_UID) {
            fetchAndRenderSacrificesForAdmin(null);
        } else {
            fetchAndRenderSacrificesForUserUI(user.uid);
        }
    } else {
        ui.showLoginView();
    }
});

if (ui.adahiForm) {
    ui.adahiForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const currentUser = auth.currentUser;
        if (!currentUser) { ui.statusMessageEl.textContent = 'يجب تسجيل الدخول.'; ui.statusMessageEl.className = 'error'; return; }
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
        if (currentEditingDocId) {
            ui.statusMessageEl.textContent = 'جاري التحديث...'; ui.statusMessageEl.className = '';
            try {
                await fsService.updateSacrifice(currentEditingDocId, { ...adahiDataToSave, lastUpdatedAt: serverTimestamp() });
                ui.statusMessageEl.textContent = 'تم التحديث بنجاح!'; ui.statusMessageEl.className = 'success';
                ui.resetAdahiFormToEntryMode(setCurrentEditingDocId);
            } catch (e) { ui.statusMessageEl.textContent = 'خطأ تحديث: ' + e.message; ui.statusMessageEl.className = 'error';}
        } else {
            ui.statusMessageEl.textContent = 'جاري الحفظ...'; ui.statusMessageEl.className = '';
            adahiDataToSave.userId = currentUser.uid;
            adahiDataToSave.status = 'pending_entry';
            adahiDataToSave.createdAt = serverTimestamp();
            try {
                const docRefDb = await fsService.addSacrifice(adahiDataToSave);
                ui.statusMessageEl.textContent = 'تم الحفظ بنجاح! مرجع: ' + docRefDb.id; ui.statusMessageEl.className = 'success';
                ui.resetAdahiFormToEntryMode(setCurrentEditingDocId);
            } catch (e) { ui.statusMessageEl.textContent = 'خطأ حفظ: ' + e.message; ui.statusMessageEl.className = 'error';}
        }
    });
}

function renderSacrificesForAdminUI(docs) {
    ui.sacrificesTableBody.innerHTML = '';
    if (docs.empty) { ui.adminLoadingMessage.textContent = 'لا توجد بيانات.'; ui.adminLoadingMessage.style.display = 'block'; ui.sacrificesTableBody.innerHTML = '<tr><td colspan="17">لا توجد بيانات.</td></tr>'; return; }
    ui.adminLoadingMessage.style.display = 'none'; let counter = 1;
    docs.forEach((docSnapshot) => {
        const data = docSnapshot.data(); const row = ui.sacrificesTableBody.insertRow();
        row.insertCell().textContent = counter++; row.insertCell().textContent = data.donorName || '';
        row.insertCell().textContent = data.sacrificeFor || ''; row.insertCell().textContent = data.wantsToAttend ? 'نعم' : 'لا';
        row.insertCell().textContent = data.phoneNumber || ''; row.insertCell().textContent = data.wantsPortion ? 'نعم' : 'لا';
        row.insertCell().textContent = data.portionDetails || ''; row.insertCell().textContent = data.address || '';
        row.insertCell().textContent = data.paymentDone ? 'نعم' : 'لا'; row.insertCell().textContent = data.receiptBookNumber || '';
        row.insertCell().textContent = data.receiptNumber || '';
        row.insertCell().textContent = data.assistanceFor ? (data.assistanceFor === 'inside_ramtha' ? 'داخل الرمثا' : data.assistanceFor === 'gaza_people' ? 'لأهل غزة' : data.assistanceFor === 'for_himself' ? 'لنفسه' : data.assistanceFor) : '';
        row.insertCell().textContent = data.broughtByOther ? 'نعم' : 'لا'; row.insertCell().textContent = data.broughtByOtherName || '';
        row.insertCell().textContent = ui.formatFirestoreTimestamp(data.createdAt);
        let statusText = data.status;
        if (data.status === 'pending_entry') { statusText = 'لم تدخل بعد'; }
        else if (data.status === 'entered') { statusText = 'تم الإدخال'; }
        else if (data.status === 'approved' || data.status === 'pending_approval' || data.status === 'rejected') { statusText = `(${statusText}) غير مستخدم`;}
        row.insertCell().textContent = statusText;
        const actionsCell = row.insertCell();
        if (data.status === 'pending_entry') {
            const confirmButton = document.createElement('button'); confirmButton.textContent = 'تأكيد الإدخال';
            confirmButton.onclick = () => fsService.updateSacrifice(docSnapshot.id, { status: 'entered', lastUpdatedAt: serverTimestamp() }); actionsCell.appendChild(confirmButton);
        } else if (data.status === 'entered') {
            const revertButton = document.createElement('button'); revertButton.textContent = "إعادة لـ 'لم تدخل بعد'";
            revertButton.style.backgroundColor = '#f39c12';
            revertButton.onclick = () => { fsService.updateSacrifice(docSnapshot.id, { status: 'pending_entry', lastUpdatedAt: serverTimestamp() }); }; actionsCell.appendChild(revertButton);
        }
        const editButton = document.createElement('button'); editButton.textContent = 'تعديل'; editButton.style.backgroundColor = '#5dade2'; editButton.style.marginLeft = '5px';
        editButton.onclick = () => ui.populateAdahiFormForEdit(docSnapshot.id, data, setCurrentEditingDocId);
        actionsCell.appendChild(editButton);
        const deleteBtn = document.createElement('button'); deleteBtn.textContent = 'حذف'; deleteBtn.className = 'delete-btn'; deleteBtn.style.marginLeft = '5px';
        deleteBtn.onclick = async () => {
            if (confirm(`هل أنت متأكد من حذف: ${data.donorName || 'هذا السجل'}؟`)) {
                try {
                    await fsService.deleteSacrifice(docSnapshot.id);
                    ui.statusMessageEl.textContent = `تم حذف "${data.donorName || 'هذا السجل'}" بنجاح.`; ui.statusMessageEl.className = 'success';
                    setTimeout(() => { ui.statusMessageEl.textContent = ''; ui.statusMessageEl.className = ''; }, 3000);
                } catch (error) { alert('خطأ حذف: ' + error.message); ui.statusMessageEl.textContent = 'خطأ حذف.'; ui.statusMessageEl.className = 'error'; }
            }
        };
        actionsCell.appendChild(deleteBtn);
    });
}

function fetchAndRenderSacrificesForAdmin(statusFilter = null) {
    ui.adminLoadingMessage.textContent = 'جاري تحميل البيانات...'; ui.adminLoadingMessage.style.display = 'block'; ui.sacrificesTableBody.innerHTML = '';
    if (unsubscribeAdminSacrifices) unsubscribeAdminSacrifices();
    unsubscribeAdminSacrifices = fsService.getSacrificesForAdmin(statusFilter,
        (querySnapshot) => { renderSacrificesForAdminUI(querySnapshot); },
        (error) => { console.error("Error fetching admin docs:", error); ui.sacrificesTableBody.innerHTML = `<tr><td colspan="17">خطأ تحميل البيانات.</td></tr>`; }
    );
}

document.getElementById('filterPending').addEventListener('click', () => fetchAndRenderSacrificesForAdmin('pending_entry'));
document.getElementById('filterEntered').addEventListener('click', () => fetchAndRenderSacrificesForAdmin('entered'));
document.getElementById('filterAll').addEventListener('click', () => fetchAndRenderSacrificesForAdmin(null));

function renderSacrificesForUserUI(docs) {
    ui.userSacrificesTableBody.innerHTML = '';
    if (docs.empty) { ui.userLoadingMessage.textContent = 'لا توجد تسجيلات.'; ui.userLoadingMessage.style.display = 'block'; ui.userSacrificesTableBody.innerHTML = '<tr><td colspan="7">لا توجد تسجيلات.</td></tr>'; return; }
    ui.userLoadingMessage.style.display = 'none'; let counter = 1;
    docs.forEach((docSnapshot) => {
        const data = docSnapshot.data(); const row = ui.userSacrificesTableBody.insertRow();
        row.insertCell().textContent = counter++; row.insertCell().textContent = data.donorName || '';
        row.insertCell().textContent = data.sacrificeFor || '';
        row.insertCell().textContent = data.broughtByOther ? 'نعم' : 'لا'; row.insertCell().textContent = data.broughtByOtherName || '';
        row.insertCell().textContent = ui.formatFirestoreTimestamp(data.createdAt);
        let statusText = data.status;
        if (data.status === 'pending_entry') { statusText = 'لم تدخل بعد'; }
        else if (data.status === 'entered') { statusText = 'تم الإدخال'; }
        else if (data.status === 'approved' || data.status === 'pending_approval' || data.status === 'rejected') { statusText = `(${statusText}) غير مستخدم`;}
        row.insertCell().textContent = statusText;
    });
}

function fetchAndRenderSacrificesForUserUI(userId) {
    ui.userLoadingMessage.textContent = 'جاري تحميل تسجيلاتك...'; ui.userLoadingMessage.style.display = 'block'; ui.userSacrificesTableBody.innerHTML = '';
    if (unsubscribeUserSacrifices) unsubscribeUserSacrifices();
    unsubscribeUserSacrifices = fsService.getSacrificesForUser(userId,
        (querySnapshot) => { renderSacrificesForUserUI(querySnapshot); },
        (error) => { console.error("Error fetching user docs:", error); ui.userSacrificesTableBody.innerHTML = `<tr><td colspan="7">خطأ تحميل.</td></tr>`; }
    );
}

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
                if (cell === 'pending_entry') cell = 'لم تدخل بعد';
                else if (cell === 'entered') cell = 'تم الإدخال';
                else if (cell === 'approved' || cell === 'pending_approval' || cell === 'rejected') cell = `(${cell}) غير مستخدم`;
            } else if (key === 'assistanceFor') {
                if (cell === 'inside_ramtha') cell = 'داخل الرمثا';
                else if (cell === 'gaza_people') cell = 'لأهل غزة';
                else if (cell === 'for_himself') cell = 'لنفسه';
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
        ui.statusMessageEl.textContent = "جاري تجهيز البيانات..."; ui.statusMessageEl.className = '';
        try {
            const querySnapshot = await getDocs(query(fsService.collection(db, "sacrifices"), fsService.orderBy("createdAt", "desc"))); // استخدم fsService.collection و fsService.orderBy
            if (querySnapshot.empty) { ui.statusMessageEl.textContent = "لا توجد بيانات."; ui.statusMessageEl.className = 'error'; return; }
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
                    status: data.status, userId: data.userId
                });
            });
            const headerKeys = ["docId", "donorName", "sacrificeFor", "wantsToAttend", "phoneNumber", "wantsPortion", "portionDetails", "address", "paymentDone", "receiptBookNumber", "receiptNumber", "assistanceFor", "broughtByOther", "broughtByOtherName", "createdAt", "status", "userId"];
            const displayHeaders = ["معرف السجل", "اسم المتبرع", "الأضحية عن", "يريد الحضور", "رقم الهاتف", "يريد جزءًا", "تفاصيل الجزء", "العنوان", "تم الدفع", "رقم الدفتر", "رقم السند", "لمن المساعدة", "أحضرت بواسطة آخر", "اسم الوسيط", "تاريخ التسجيل", "الحالة", "معرف المستخدم"];
            const csvContent = convertToCSV(allData, headerKeys, displayHeaders);
            downloadCSV(csvContent, 'كل_بيانات_الاضاحي.csv');
            ui.statusMessageEl.textContent = "تم التصدير بنجاح."; ui.statusMessageEl.className = 'success';
        } catch (error) { console.error("Error exporting all data: ", error); ui.statusMessageEl.textContent = "خطأ تصدير: " + error.message; ui.statusMessageEl.className = 'error'; }
    });
}

const exportAllUsersSeparateCsvButtonEl = document.getElementById('exportAllUsersSeparateCsvButton');
if (exportAllUsersSeparateCsvButtonEl) {
    exportAllUsersSeparateCsvButtonEl.addEventListener('click', async () => {
        ui.statusMessageEl.textContent = "جاري تجهيز بيانات كل مستخدم..."; ui.statusMessageEl.className = '';
        try {
            const querySnapshot = await fsService.getAllSacrificesForExport();
            if (querySnapshot.empty) { ui.statusMessageEl.textContent = "لا توجد بيانات لتصديرها."; ui.statusMessageEl.className = 'error'; return; }
            const dataByUser = {};
            querySnapshot.forEach(doc => {
                const data = doc.data();
                if (!data.userId) return;
                if (!dataByUser[data.userId]) { dataByUser[data.userId] = []; }
                dataByUser[data.userId].push({
                    docId: doc.id, donorName: data.donorName, sacrificeFor: data.sacrificeFor,
                    wantsToAttend: data.wantsToAttend, phoneNumber: data.phoneNumber, wantsPortion: data.wantsPortion,
                    portionDetails: data.portionDetails, address: data.address, paymentDone: data.paymentDone,
                    receiptBookNumber: data.receiptBookNumber, receiptNumber: data.receiptNumber,
                    assistanceFor: data.assistanceFor, broughtByOther: data.broughtByOther,
                    broughtByOtherName: data.broughtByOtherName,
                    createdAt: data.createdAt ? ui.formatFirestoreTimestamp(data.createdAt) : '', status: data.status
                });
            });
            if (Object.keys(dataByUser).length === 0) { ui.statusMessageEl.textContent = "لم يتم العثور على بيانات مع معرفات مستخدمين صالحة."; ui.statusMessageEl.className = 'error'; return; }
            const headerKeys = ["docId", "donorName", "sacrificeFor", "wantsToAttend", "phoneNumber", "wantsPortion", "portionDetails", "address", "paymentDone", "receiptBookNumber", "receiptNumber", "assistanceFor", "broughtByOther", "broughtByOtherName", "createdAt", "status"];
            const displayHeaders = ["معرف السجل", "اسم المتبرع", "الأضحية عن", "يريد الحضور", "رقم الهاتف", "يريد جزءًا", "تفاصيل الجزء", "العنوان", "تم الدفع", "رقم الدفتر", "رقم السند", "لمن المساعدة", "أحضرت بواسطة آخر", "اسم الوسيط", "تاريخ التسجيل", "الحالة"];
            let exportedCount = 0;
            ui.statusMessageEl.textContent = `بدء تصدير ${Object.keys(dataByUser).length} ملف...`;
            for (const userId in dataByUser) {
                if (dataByUser.hasOwnProperty(userId)) {
                    const userData = dataByUser[userId];
                    const csvContent = convertToCSV(userData, headerKeys, displayHeaders);
                    await new Promise(resolve => setTimeout(resolve, 300));
                    downloadCSV(csvContent, `بيانات_مستخدم_${userId}.csv`);
                    exportedCount++;
                    ui.statusMessageEl.textContent = `تم تصدير ${exportedCount} من ${Object.keys(dataByUser).length} ملف...`;
                }
            }
            ui.statusMessageEl.textContent = `تم تصدير بيانات ${exportedCount} مستخدم بنجاح في ملفات منفصلة.`; ui.statusMessageEl.className = 'success';
        } catch (error) {
            console.error("Error exporting all users separate data: ", error);
            if (error.code === 'failed-precondition' && error.message.includes('index')) {
                 ui.statusMessageEl.textContent = "خطأ: يتطلب هذا التصدير فهرسًا مركبًا. يرجى التحقق من Firebase Console: sacrifices -> userId (ASC), createdAt (DESC).";
            } else { ui.statusMessageEl.textContent = "خطأ أثناء تصدير بيانات المستخدمين: " + error.message; }
            ui.statusMessageEl.className = 'error';
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {
    ui.resetAdahiFormToEntryMode(setCurrentEditingDocId); // تمرير الدالة لتعيين الحالة
    ui.wantsPortionNoRadio.dispatchEvent(new Event('change'));
    ui.paymentDoneNoRadio.dispatchEvent(new Event('change'));
    ui.broughtByOtherNoRadio.dispatchEvent(new Event('change'));
});
