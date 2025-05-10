// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { firebaseConfig, ADMIN_UID } from './config.js';
import { auth, onAuthStateChanged, loginUser, handleSignOut } from './auth.js';
import * as fsService from './firestoreService.js'; // يحتوي الآن على updateSacrifice المُعدلة
import * as ui from './ui.js';
import { getFirestore, collection, query, orderBy, where, getDocs, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig); // تهيئة واحدة هنا كافية إذا لم تتم في الملفات الأخرى
const db = getFirestore(app);


let unsubscribeAdminSacrifices = null;
let unsubscribeUserSacrifices = null;
let currentEditingDocId = null;

function setCurrentEditingDocId(id) {
    currentEditingDocId = id;
}

// ... (مستمعو أحداث واجهة المستخدم كما هم) ...
// ... (معالج نموذج تسجيل الدخول كما هو) ...
// ... (معالج تسجيل الخروج كما هو) ...
// ... (onAuthStateChanged كما هو مع رسالة الترحيب "مرحباً بك") ...


// --- معالجة نموذج إضافة/تعديل الأضاحي ---
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

        let editorIdentifier = currentUser.displayName || currentUser.email;

        if (currentEditingDocId) { // وضع التعديل
            ui.statusMessageEl.textContent = 'جاري التحديث...'; ui.statusMessageEl.className = '';
            try {
                // editorIdentifier هنا يمثل المسؤول الذي يعدل
                await fsService.updateSacrifice(currentEditingDocId, adahiDataToSave, editorIdentifier);
                ui.statusMessageEl.textContent = 'تم التحديث بنجاح!'; ui.statusMessageEl.className = 'success';
                ui.resetAdahiFormToEntryMode(setCurrentEditingDocId);
            } catch (e) { ui.statusMessageEl.textContent = 'خطأ تحديث: ' + e.message; ui.statusMessageEl.className = 'error';}
        } else { // وضع الإضافة
            ui.statusMessageEl.textContent = 'جاري الحفظ...'; ui.statusMessageEl.className = '';
            adahiDataToSave.userId = currentUser.uid;
            adahiDataToSave.status = 'pending_entry';
            adahiDataToSave.createdAt = serverTimestamp();
            adahiDataToSave.enteredBy = editorIdentifier; // هذا هو المستخدم الذي أدخل البيانات أول مرة

            try {
                const docRefDb = await fsService.addSacrifice(adahiDataToSave); // addSacrifice لا تحتاج editorIdentifier
                ui.statusMessageEl.textContent = 'تم الحفظ بنجاح! مرجع: ' + docRefDb.id; ui.statusMessageEl.className = 'success';
                ui.resetAdahiFormToEntryMode(setCurrentEditingDocId);
            } catch (e) { ui.statusMessageEl.textContent = 'خطأ حفظ: ' + e.message; ui.statusMessageEl.className = 'error';}
        }
    });
}

// --- دوال العرض والتحديث للجداول ---
function renderSacrificesForAdminUI(docs) {
    ui.sacrificesTableBody.innerHTML = '';
    if (docs.empty) { ui.adminLoadingMessage.textContent = 'لا توجد بيانات.'; ui.adminLoadingMessage.style.display = 'block'; ui.sacrificesTableBody.innerHTML = '<tr><td colspan="17">لا توجد بيانات.</td></tr>'; return; }
    ui.adminLoadingMessage.style.display = 'none'; let counter = 1;
    docs.forEach((docSnapshot) => {
        const data = docSnapshot.data(); const row = ui.sacrificesTableBody.insertRow();
        // ... (نفس كود ملء الخلايا كما في الرد السابق) ...
        // لا نعرض enteredBy و lastEditedBy في الجدول لتجنب اتساعه، لكنها ستكون في التصدير
        // ...
        const actionsCell = row.insertCell();
        if (data.status === 'pending_entry') {
            const confirmButton = document.createElement('button'); confirmButton.textContent = 'تأكيد الإدخال';
            confirmButton.onclick = () => {
                const adminIdentifier = auth.currentUser ? (auth.currentUser.displayName || auth.currentUser.email) : 'مسؤول';
                fsService.updateSacrifice(docSnapshot.id, { status: 'entered' }, adminIdentifier); // تمرير اسم المسؤول
            }; actionsCell.appendChild(confirmButton);
        } else if (data.status === 'entered') {
            const revertButton = document.createElement('button'); revertButton.textContent = "إعادة لـ 'لم تدخل بعد'";
            revertButton.style.backgroundColor = '#f39c12';
            revertButton.onclick = () => {
                const adminIdentifier = auth.currentUser ? (auth.currentUser.displayName || auth.currentUser.email) : 'مسؤول';
                fsService.updateSacrifice(docSnapshot.id, { status: 'pending_entry' }, adminIdentifier); // تمرير اسم المسؤول
            }; actionsCell.appendChild(revertButton);
        }
        const editButton = document.createElement('button'); editButton.textContent = 'تعديل'; editButton.style.backgroundColor = '#5dade2'; editButton.style.marginLeft = '5px';
        editButton.onclick = () => ui.populateAdahiFormForEdit(docSnapshot.id, data, setCurrentEditingDocId);
        actionsCell.appendChild(editButton);
        // ... (زر الحذف كما هو) ...
    });
}

// ... (fetchAndRenderSacrificesForAdmin, فلاتر المسؤول, renderSacrificesForUserUI, fetchAndRenderSacrificesForUserUI كما هي) ...

// --- CSV Export Functions and Listeners (مُعدلة لتشمل الحقول الجديدة) ---
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
                else if (obj[key] === 'approved' || obj[key] === 'pending_approval' || obj[key] === 'rejected') cell = `(${obj[key]}) غير مستخدم`;
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
        ui.statusMessageEl.textContent = "جاري تجهيز البيانات..."; ui.statusMessageEl.className = '';
        try {
            const q = query(collection(db, "sacrifices"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
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
                    status: data.status, userId: data.userId,
                    enteredBy: data.enteredBy || '', // الحقل الجديد
                    lastEditedBy: data.lastEditedBy || '' // الحقل الجديد
                });
            });
            const headerKeys = ["docId", "donorName", "sacrificeFor", "wantsToAttend", "phoneNumber", "wantsPortion", "portionDetails", "address", "paymentDone", "receiptBookNumber", "receiptNumber", "assistanceFor", "broughtByOther", "broughtByOtherName", "createdAt", "status", "userId", "enteredBy", "lastEditedBy"];
            const displayHeaders = ["معرف السجل", "اسم المتبرع", "الأضحية عن", "يريد الحضور", "رقم الهاتف", "يريد جزءًا", "تفاصيل الجزء", "العنوان", "تم الدفع", "رقم الدفتر", "رقم السند", "لمن المساعدة", "أحضرت بواسطة آخر", "اسم الوسيط", "تاريخ التسجيل", "الحالة", "معرف المستخدم", "أدخل بواسطة", "آخر تعديل بواسطة"];
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
                    createdAt: data.createdAt ? ui.formatFirestoreTimestamp(data.createdAt) : '', status: data.status,
                    enteredBy: data.enteredBy || '', // الحقل الجديد
                    lastEditedBy: data.lastEditedBy || '' // الحقل الجديد
                });
            });
            if (Object.keys(dataByUser).length === 0) { ui.statusMessageEl.textContent = "لم يتم العثور على بيانات مع معرفات مستخدمين صالحة."; ui.statusMessageEl.className = 'error'; return; }
            const headerKeys = ["docId", "donorName", "sacrificeFor", "wantsToAttend", "phoneNumber", "wantsPortion", "portionDetails", "address", "paymentDone", "receiptBookNumber", "receiptNumber", "assistanceFor", "broughtByOther", "broughtByOtherName", "createdAt", "status", "enteredBy", "lastEditedBy"];
            const displayHeaders = ["معرف السجل", "اسم المتبرع", "الأضحية عن", "يريد الحضور", "رقم الهاتف", "يريد جزءًا", "تفاصيل الجزء", "العنوان", "تم الدفع", "رقم الدفتر", "رقم السند", "لمن المساعدة", "أحضرت بواسطة آخر", "اسم الوسيط", "تاريخ التسجيل", "الحالة", "أدخل بواسطة", "آخر تعديل بواسطة"];
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

// ... (DOMContentLoaded listener كما هو) ...
