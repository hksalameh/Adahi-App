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

// Console warnings for missing UI elements (as before)
// ... (لا تغيير هنا)

// Auth form event listeners (login, registration, toggle) (as before)
// ... (لا تغيير هنا)

// Logout button event listener (as before)
// ... (لا تغيير هنا)

// onAuthStateChanged (as before, ensure displayName is used for greeting)
authModule.onAuthStateChanged((user) => {
    // ... (نفس منطق إظهار/إخفاء العناصر ورسالة الترحيب)
    if (user) {
        if (ui.authStatusEl) {
            ui.authStatusEl.textContent = `مرحباً بك ${user.displayName || user.email}!`;
            ui.authStatusEl.className = 'success';
        }
        // ... (باقي منطق المستخدم المسجل)
    } else {
        // ... (باقي منطق المستخدم غير المسجل)
    }
});


// Adahi form submit listener (as before, ensure enteredBy and lastEditedBy use displayName)
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
            adahiDataToSave.enteredBy = editorIdentifier; // اسم المستخدم المدخل
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
}

// --- دوال العرض والتحديث للجداول ---
function renderSacrificesForAdminUI(docsSnapshot) {
    if (!ui.sacrificesTableBody) { return; }
    ui.sacrificesTableBody.innerHTML = '';
    if (docsSnapshot.empty) {
        if (ui.adminLoadingMessage) {
            ui.adminLoadingMessage.textContent = 'لا توجد بيانات لعرضها حاليًا.';
            ui.adminLoadingMessage.style.display = 'block';
        }
        // إذا أضفت عمود "أدخل بواسطة" في HTML، غيّر colspan إلى 18
        ui.sacrificesTableBody.innerHTML = '<tr><td colspan="18">لا توجد بيانات.</td></tr>'; 
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
        
        // *** العمود الجديد: أدخل بواسطة ***
        row.insertCell().textContent = data.enteredBy || 'غير معروف'; 

        row.insertCell().textContent = data.wantsToAttend ? 'نعم' : 'لا';
        row.insertCell().textContent = data.phoneNumber || 'لا يوجد';
        row.insertCell().textContent = data.wantsPortion ? 'نعم' : 'لا'; // هذا سيبقى للعرض في الجدول
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
        let statusText = data.status || ''; // هذا سيبقى للعرض في الجدول
        if (data.status === 'pending_entry') statusText = 'لم تدخل بعد';
        else if (data.status === 'entered') statusText = 'تم الإدخال';
        row.insertCell().textContent = statusText;
        
        const actionsCell = row.insertCell();
        actionsCell.style.whiteSpace = 'nowrap';
        const authService = authModule.getAuthInstance();
        const currentAdminUser = authService ? authService.currentUser : null;
        const adminIdentifier = currentAdminUser ? (currentAdminUser.displayName || currentAdminUser.email) : 'مسؤول النظام';

        // ... (أزرار الإجراءات كما هي)
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

// renderSacrificesForUserUI (لا تغيير كبير هنا، إلا إذا أردت إضافة عمود "أدخل بواسطة" وهو سيكون دائمًا اسم المستخدم الحالي)
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
        let statusText = data.status; // هذا سيبقى للعرض في جدول المستخدم
        if (data.status === 'pending_entry') statusText = 'قيد المراجعة';
        else if (data.status === 'entered') statusText = 'مؤكد';
        row.insertCell().textContent = statusText;
    });
}

// fetchAndRenderSacrificesForAdmin, fetchAndRenderSacrificesForUserUI (as before)
// ... (لا تغيير هنا)

// Filter buttons event listeners (as before)
// ... (لا تغيير هنا)

// downloadCSV, convertToCSV (as before, convertToCSV will use the new headerKeys)
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
            // لا حاجة لتعديل هنا بخصوص الحقول المحذوفة، لأن headerKeys ستكون محدثة
            else if (key === 'assistanceFor') { // هذا مثال، أي تنسيق خاص آخر يبقى
                if (obj[key] === 'inside_ramtha') cell = 'داخل الرمثا';
                else if (obj[key] === 'gaza_people') cell = 'لأهل غزة';
                else if (obj[key] === 'for_himself') cell = 'لنفسه';
            } else if (key === 'createdAt' /* || key === 'lastEditedAt' */) { // lastEditedAt محذوف من التصدير
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


// --- CSV Export Functions and Listeners (Modified for specific columns) ---
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
                    //  docId: doc.id, // محذوف
                    donorName: data.donorName, 
                    sacrificeFor: data.sacrificeFor,
                    wantsToAttend: data.wantsToAttend, 
                    phoneNumber: data.phoneNumber, 
                    // wantsPortion: data.wantsPortion, // محذوف
                    portionDetails: data.portionDetails, 
                    address: data.address, 
                    paymentDone: data.paymentDone,
                    receiptBookNumber: data.receiptBookNumber, 
                    receiptNumber: data.receiptNumber,
                    assistanceFor: data.assistanceFor, 
                    broughtByOther: data.broughtByOther,
                    broughtByOtherName: data.broughtByOtherName,
                    createdAt: data.createdAt, 
                    // status: data.status, // محذوف
                    // userId: data.userId, // محذوف
                    enteredBy: data.enteredBy || '',
                    // lastEditedBy: data.lastEditedBy || '', // محذوف
                    // lastEditedAt: data.lastEditedAt // محذوف
                });
            });
            // *** تعديل الأعمدة هنا ***
            const headerKeys = [
                "donorName", "sacrificeFor", "wantsToAttend", "phoneNumber", 
                "portionDetails", "address", "paymentDone", "receiptBookNumber", "receiptNumber", 
                "assistanceFor", "broughtByOther", "broughtByOtherName", "createdAt", "enteredBy"
            ];
            const displayHeaders = [
                "المتبرع", "الأضحية عن", "حضور؟", "هاتف", 
                "تفاصيل الجزء", "العنوان", "مدفوع؟", "ر.الدفتر", "ر.السند", 
                "المساعدة لـ", "بوسيط؟", "اسم الوسيط", "ت.التسجيل", "أدخل بواسطة"
            ];
            const csvContent = convertToCSV(allData, headerKeys, displayHeaders);
            downloadCSV(csvContent, 'كل_بيانات_الاضاحي_المعدلة.csv');
            if (ui.authStatusEl) {ui.authStatusEl.textContent = "تم تصدير كل البيانات بنجاح (بأعمدة معدلة)."; ui.authStatusEl.className = 'success';}
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
                    //  docId: doc.id, // محذوف
                    donorName: data.donorName, 
                    sacrificeFor: data.sacrificeFor,
                    wantsToAttend: data.wantsToAttend, 
                    phoneNumber: data.phoneNumber, 
                    // wantsPortion: data.wantsPortion, // محذوف
                    portionDetails: data.portionDetails, 
                    address: data.address, 
                    paymentDone: data.paymentDone,
                    receiptBookNumber: data.receiptBookNumber, 
                    receiptNumber: data.receiptNumber,
                    assistanceFor: data.assistanceFor, 
                    broughtByOther: data.broughtByOther,
                    broughtByOtherName: data.broughtByOtherName,
                    createdAt: data.createdAt,
                    // status: data.status, // محذوف
                    // userId: data.userId, // محذوف
                    enteredBy: data.enteredBy || '',
                    // lastEditedBy: data.lastEditedBy || '', // محذوف
                    // lastEditedAt: data.lastEditedAt // محذوف
                });
            });

            if (Object.keys(dataByUser).length === 0) { 
                if (ui.authStatusEl) {ui.authStatusEl.textContent = "لم يتم العثور على بيانات مجمعة حسب المدخلين."; ui.authStatusEl.className = 'error';}
                return; 
            }
            
            // *** تعديل الأعمدة هنا أيضًا ***
            const headerKeys = [
                "donorName", "sacrificeFor", "wantsToAttend", "phoneNumber",
                "portionDetails", "address", "paymentDone", "receiptBookNumber", "receiptNumber",
                "assistanceFor", "broughtByOther", "broughtByOtherName", "createdAt", "enteredBy"
            ];
            const displayHeaders = [
                "المتبرع", "الأضحية عن", "حضور؟", "هاتف",
                "تفاصيل الجزء", "العنوان", "مدفوع؟", "ر.الدفتر", "ر.السند",
                "المساعدة لـ", "بوسيط؟", "اسم الوسيط", "ت.التسجيل", "أدخل بواسطة"
            ];
                        
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
                        downloadCSV(csvContent, `بيانات_مدخل_${fileNamePart}_المعدلة.csv`);
                        exportedCount++;
                        if (ui.authStatusEl) {ui.authStatusEl.textContent = `تم تصدير ${exportedCount} من ${totalUserGroups} ملف...`;}
                    }
                }
            }
            if (ui.authStatusEl) {ui.authStatusEl.textContent = `تم تصدير بيانات ${exportedCount} مدخل بنجاح في ملفات منفصلة (بأعمدة معدلة).`; ui.authStatusEl.className = 'success';}
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

// DOMContentLoaded listener (as before)
document.addEventListener('DOMContentLoaded', () => {
    // console.log("DOM fully loaded and parsed. main.js is active.");
    if (ui.authStatusEl) {
        ui.authStatusEl.textContent = 'جاري التحميل...';
        ui.authStatusEl.className = '';
    }
});
