// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { firebaseConfig, ADMIN_UID } from './config.js';
import * as authModule from './auth.js';
import * as fsService from './firestoreService.js';
import * as uiGetters from './ui.js'; 
import { getFirestore, collection, query, orderBy, where, getDocs, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = authModule.initializeAuth(); 

let unsubscribeAdminSacrifices = null;
let unsubscribeUserSacrifices = null;
let currentEditingDocId = null;
let ui = {}; 
let allAdminSacrificesCache = []; 
let domContentLoadedFired = false; 

function setCurrentEditingDocId(id) {
    currentEditingDocId = id;
}

function updateSacrificesSummary() {
    if (!ui.adminViewElements || 
        !ui.adminViewElements.summaryGazaEl ||
        !ui.adminViewElements.summarySolidarityEl ||
        !ui.adminViewElements.summaryRamthaEl ||
        !ui.adminViewElements.summaryHimselfEl ||
        !ui.adminViewElements.summaryTotalEl) {
        return;
    }
    let gazaCount = 0;
    let solidarityCount = 0;
    let ramthaCount = 0;
    let himselfCount = 0;
    allAdminSacrificesCache.forEach(data => {
        switch (data.assistanceFor) {
            case 'gaza_people': gazaCount++; break;
            case 'solidarity_fund': solidarityCount++; break;
            case 'inside_ramtha': ramthaCount++; break;
            case 'for_himself': himselfCount++; break;
        }
    });
    ui.adminViewElements.summaryGazaEl.textContent = gazaCount;
    ui.adminViewElements.summarySolidarityEl.textContent = solidarityCount;
    ui.adminViewElements.summaryRamthaEl.textContent = ramthaCount;
    ui.adminViewElements.summaryHimselfEl.textContent = himselfCount;
    ui.adminViewElements.summaryTotalEl.textContent = allAdminSacrificesCache.length;
}

function renderCellValue(value, isBooleanNoMeansEmpty = false, conditionalEmptyValue = '') {
    if (value === null || typeof value === 'undefined') return '';
    if (isBooleanNoMeansEmpty && value === false) return '';
    if (typeof value === 'boolean') return value ? 'نعم' : (isBooleanNoMeansEmpty ? '' : 'لا');
    if (value === conditionalEmptyValue && conditionalEmptyValue !== '') return '';
    return String(value);
}

function renderSacrificesForAdminUI(docsSnapshot) {
    if (!ui.adminViewElements || !ui.adminViewElements.sacrificesTableBody) { return; }
    ui.adminViewElements.sacrificesTableBody.innerHTML = '';
    allAdminSacrificesCache = []; 
    if (docsSnapshot.empty) {
        if (ui.adminViewElements.adminLoadingMessage) {
            ui.adminViewElements.adminLoadingMessage.textContent = 'لا توجد بيانات لعرضها حاليًا.';
            ui.adminViewElements.adminLoadingMessage.style.display = 'block';
        }
        ui.adminViewElements.sacrificesTableBody.innerHTML = '<tr><td colspan="18">لا توجد بيانات.</td></tr>'; 
        updateSacrificesSummary(); 
        return;
    }
    if (ui.adminViewElements.adminLoadingMessage) ui.adminViewElements.adminLoadingMessage.style.display = 'none';
    let counter = 1;
    docsSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        allAdminSacrificesCache.push(data); 
        const row = ui.adminViewElements.sacrificesTableBody.insertRow();
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
        else if (data.assistanceFor === 'solidarity_fund') assistanceForText = 'صندوق التضامن';
        row.insertCell().textContent = assistanceForText;
        row.insertCell().textContent = renderCellValue(data.enteredBy, false, 'غير معروف'); 
        row.insertCell().textContent = renderCellValue(data.broughtByOther, true); 
        row.insertCell().textContent = data.broughtByOther ? renderCellValue(data.broughtByOtherName, false, 'غير محدد') : '';
        row.insertCell().textContent = data.createdAt ? uiGetters.formatFirestoreTimestamp(data.createdAt) : '';
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
            confirmButton.textContent = 'تأكيد'; confirmButton.className = 'action-button confirm'; confirmButton.title = 'تأكيد الإدخال';
            confirmButton.onclick = async () => { if (confirm("هل أنت متأكد من تأكيد هذا الإدخال؟")) { try { await fsService.updateSacrifice(docSnapshot.id, { status: 'entered', lastEditedBy: adminIdentifier, lastEditedAt: serverTimestamp() }, adminIdentifier); } catch (e) { alert('خطأ في تأكيد الإدخال: ' + e.message); }}};
            actionsCell.appendChild(confirmButton);
        } else if (data.status === 'entered') {
            const revertButton = document.createElement('button');
            revertButton.textContent = "إعادة"; revertButton.className = 'action-button revert'; revertButton.title = "إعادة لـ 'لم تدخل بعد'";
            revertButton.onclick = async () => { if (confirm("هل أنت متأكد من إعادة هذا الإدخال إلى 'لم تدخل بعد'؟")) { try { await fsService.updateSacrifice(docSnapshot.id, { status: 'pending_entry', lastEditedBy: adminIdentifier, lastEditedAt: serverTimestamp() }, adminIdentifier); } catch (e) { alert('خطأ في إعادة الإدخال: ' + e.message); }}};
            actionsCell.appendChild(revertButton);
        }
        const editButton = document.createElement('button');
        editButton.textContent = 'تعديل'; editButton.className = 'action-button edit';
        editButton.onclick = () => uiGetters.populateAdahiFormForEdit(docSnapshot.id, data, setCurrentEditingDocId);
        actionsCell.appendChild(editButton);
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'حذف'; deleteButton.className = 'action-button delete delete-btn';
        deleteButton.onclick = async () => { if (confirm(`هل أنت متأكد من حذف أضحية المتبرع "${data.donorName || 'غير مسمى'}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) { try { await fsService.deleteSacrifice(docSnapshot.id); } catch (e) { alert('خطأ في الحذف: ' + e.message); }}};
        actionsCell.appendChild(deleteButton);
    });
    updateSacrificesSummary(); 
}

function renderSacrificesForUserUI(docsSnapshot) {
    if (!ui.userDataViewElements || !ui.userDataViewElements.userSacrificesTableBody) { return; }
    ui.userDataViewElements.userSacrificesTableBody.innerHTML = '';
    if (docsSnapshot.empty) {
        if (ui.userDataViewElements.userLoadingMessage) {
            ui.userDataViewElements.userLoadingMessage.textContent = 'لم تقم بتسجيل أي أضاحي بعد.';
            ui.userDataViewElements.userLoadingMessage.style.display = 'block';
        }
        ui.userDataViewElements.userSacrificesTableBody.innerHTML = '<tr><td colspan="7">لا توجد أضاحي مسجلة باسمك.</td></tr>';
        return;
    }
    if (ui.userDataViewElements.userLoadingMessage) ui.userDataViewElements.userLoadingMessage.style.display = 'none';
    let counter = 1;
    docsSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const row = ui.userDataViewElements.userSacrificesTableBody.insertRow();
        row.insertCell().textContent = counter++;
        row.insertCell().textContent = renderCellValue(data.donorName);
        row.insertCell().textContent = renderCellValue(data.sacrificeFor);
        row.insertCell().textContent = renderCellValue(data.broughtByOther, true);
        row.insertCell().textContent = data.broughtByOther ? renderCellValue(data.broughtByOtherName, false, 'غير محدد') : '';
        row.insertCell().textContent = data.createdAt ? uiGetters.formatFirestoreTimestamp(data.createdAt) : '';
        let statusText = '';
        if (data.status === 'pending_entry') statusText = 'قيد المراجعة';
        else if (data.status === 'entered') statusText = 'مؤكد';
        row.insertCell().textContent = statusText;
    });
}

async function fetchAndRenderSacrificesForAdmin(filterStatus = 'all') { /* ... كما هي ... */ }
async function fetchAndRenderSacrificesForUserUI(userId) { /* ... كما هي ... */ }


document.addEventListener('DOMContentLoaded', () => {
    ui.loginElements = uiGetters.getLoginElements();
    ui.registrationElements = uiGetters.getRegistrationElements();
    ui.toggleLinkElements = uiGetters.getToggleLinkElements();
    ui.commonUIElements = uiGetters.getCommonUIElements();
    ui.dataEntryFormElements = uiGetters.getDataEntryFormElements();
    ui.adminViewElements = uiGetters.getAdminViewElements();
    ui.userDataViewElements = uiGetters.getUserDataViewElements();
    
    if (ui.dataEntryFormElements) {
        uiGetters.cacheFormElements(ui.dataEntryFormElements);
    }
    uiGetters.setupConditionalFieldListeners();
    domContentLoadedFired = true; 

    if (ui.commonUIElements.authStatusEl) {
        ui.commonUIElements.authStatusEl.textContent = 'جاري التحميل...';
        ui.commonUIElements.authStatusEl.className = '';
    }

    // ... (مستمعو الأحداث للنماذج والأزرار الأخرى كما هم) ...

    // --- التأكد من وجود مستمعي أحداث التصدير ---
    if (ui.adminViewElements.exportAllToExcelButton) {
        ui.adminViewElements.exportAllToExcelButton.addEventListener('click', async () => {
            if (ui.commonUIElements.authStatusEl) {ui.commonUIElements.authStatusEl.textContent = "جاري تجهيز كل البيانات للتصدير (Excel)..."; ui.commonUIElements.authStatusEl.className = '';}
            try {
                const dataToExport = allAdminSacrificesCache.map(data => ({
                    donorName: data.donorName, 
                    sacrificeFor: data.sacrificeFor,
                    wantsToAttend: data.wantsToAttend, 
                    phoneNumber: data.phoneNumber, 
                    portionDetails: data.portionDetails, 
                    address: data.address, 
                    paymentDone: data.paymentDone,
                    receiptBookNumber: data.receiptBookNumber, 
                    receiptNumber: data.receiptNumber,
                    assistanceFor: data.assistanceFor, 
                    broughtByOther: data.broughtByOther,
                    broughtByOtherName: data.broughtByOtherName,
                    createdAt: data.createdAt, 
                    enteredBy: data.enteredBy || ''
                }));
                if (dataToExport.length === 0) {
                    if (ui.commonUIElements.authStatusEl) {ui.commonUIElements.authStatusEl.textContent = "لا توجد بيانات للتصدير."; ui.commonUIElements.authStatusEl.className = 'error';}
                    return;
                }
                const headerKeys_excel = [
                    "donorName", "sacrificeFor", "wantsToAttend", "phoneNumber", 
                    "portionDetails", "address", "paymentDone", "receiptBookNumber", "receiptNumber", 
                    "assistanceFor", "broughtByOther", "broughtByOtherName", "createdAt", "enteredBy"
                ];
                const displayHeaders_excel = [
                    "المتبرع", "الأضحية عن", "حضور؟", "هاتف", 
                    "تفاصيل الجزء", "العنوان", "مدفوع؟", "ر.الدفتر", "ر.السند", 
                    "المساعدة لـ", "بوسيط؟", "اسم الوسيط", "ت.التسجيل", "أدخل بواسطة"
                ];
                exportDataToExcel(dataToExport, headerKeys_excel, displayHeaders_excel, 'كل_بيانات_الاضاحي.xlsx');
                if (ui.commonUIElements.authStatusEl) {ui.commonUIElements.authStatusEl.textContent = "تم تصدير كل البيانات بنجاح (Excel)."; ui.commonUIElements.authStatusEl.className = 'success';}
            } catch (error) { 
                console.error("Error exporting all data to Excel: ", error); 
                if (ui.commonUIElements.authStatusEl) {ui.commonUIElements.authStatusEl.textContent = "خطأ في تصدير كل البيانات (Excel): " + error.message; ui.commonUIElements.authStatusEl.className = 'error';}
            }
        });
    } else {
        console.error("ui.adminViewElements.exportAllToExcelButton not found. (DOMContentLoaded)");
    }

    if (ui.adminViewElements.exportAllUsersSeparateExcelButton) {
        ui.adminViewElements.exportAllUsersSeparateExcelButton.addEventListener('click', async () => {
            if (ui.commonUIElements.authStatusEl) {ui.commonUIElements.authStatusEl.textContent = "جاري تجهيز بيانات كل مدخل (Excel)..."; ui.commonUIElements.authStatusEl.className = '';}
            try {
                if (allAdminSacrificesCache.length === 0) {
                    if (ui.commonUIElements.authStatusEl) {ui.commonUIElements.authStatusEl.textContent = "لا توجد بيانات لتصديرها."; ui.commonUIElements.authStatusEl.className = 'error';}
                    return;
                }
                const dataByUser = {};
                allAdminSacrificesCache.forEach(data => {
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
                        donorName: data.donorName, 
                        sacrificeFor: data.sacrificeFor,
                        wantsToAttend: data.wantsToAttend, 
                        phoneNumber: data.phoneNumber, 
                        portionDetails: data.portionDetails, 
                        address: data.address, 
                        paymentDone: data.paymentDone,
                        receiptBookNumber: data.receiptBookNumber, 
                        receiptNumber: data.receiptNumber,
                        assistanceFor: data.assistanceFor, 
                        broughtByOther: data.broughtByOther,
                        broughtByOtherName: data.broughtByOtherName,
                        createdAt: data.createdAt,
                        enteredBy: data.enteredBy || ''
                    });
                });
                if (Object.keys(dataByUser).length === 0) { 
                    if (ui.commonUIElements.authStatusEl) {ui.commonUIElements.authStatusEl.textContent = "لم يتم العثور على بيانات مجمعة حسب المدخلين."; ui.commonUIElements.authStatusEl.className = 'error';}
                    return; 
                }
                const headerKeys_excel_users = [
                    "donorName", "sacrificeFor", "wantsToAttend", "phoneNumber",
                    "portionDetails", "address", "paymentDone", "receiptBookNumber", "receiptNumber",
                    "assistanceFor", "broughtByOther", "broughtByOtherName", "createdAt", "enteredBy"
                ];
                const displayHeaders_excel_users = [
                    "المتبرع", "الأضحية عن", "حضور؟", "هاتف",
                    "تفاصيل الجزء", "العنوان", "مدفوع؟", "ر.الدفتر", "ر.السند",
                    "المساعدة لـ", "بوسيط؟", "اسم الوسيط", "ت.التسجيل", "أدخل بواسطة"
                ];
                let exportedCount = 0;
                const totalUserGroups = Object.keys(dataByUser).length;
                if (ui.commonUIElements.authStatusEl) {ui.commonUIElements.authStatusEl.textContent = `بدء تصدير ${totalUserGroups} ملف للمدخلين (Excel)...`;}
                for (const groupKey in dataByUser) {
                    if (dataByUser.hasOwnProperty(groupKey)) {
                        const fileNamePart = String(dataByUser[groupKey].name).replace(/[^\p{L}\p{N}_-]/gu, '_');
                        const userDataEntries = dataByUser[groupKey].entries;
                        if (userDataEntries.length > 0) {
                            exportDataToExcel(userDataEntries, headerKeys_excel_users, displayHeaders_excel_users, `بيانات_مدخل_${fileNamePart}.xlsx`);
                            await new Promise(resolve => setTimeout(resolve, 300)); 
                            exportedCount++;
                            if (ui.commonUIElements.authStatusEl) {ui.commonUIElements.authStatusEl.textContent = `تم تصدير ${exportedCount} من ${totalUserGroups} ملف (Excel)...`;}
                        }
                    }
                }
                if (ui.commonUIElements.authStatusEl) {ui.commonUIElements.authStatusEl.textContent = `تم تصدير بيانات ${exportedCount} مدخل بنجاح في ملفات Excel منفصلة.`; ui.commonUIElements.authStatusEl.className = 'success';}
            } catch (error) {
                console.error("Error exporting all users separate data to Excel: ", error);
                let errMessage = "خطأ أثناء تصدير بيانات المدخلين (Excel): " + error.message;
                if (error.code === 'failed-precondition' && error.message.includes('index')) {
                     errMessage = "خطأ: يتطلب هذا التصدير فهرسًا مركبًا في Firebase. يرجى مراجعة إعدادات الفهرسة.";
                }
                if (ui.commonUIElements.authStatusEl) {
                    ui.commonUIElements.authStatusEl.textContent = errMessage;
                    ui.commonUIElements.authStatusEl.className = 'error';
                }
            }
        });
    } else {
        console.error("ui.adminViewElements.exportAllUsersSeparateExcelButton not found. (DOMContentLoaded)");
    }
}); 

function handleAuthStateChange(user) {
    if (!domContentLoadedFired) {
        setTimeout(() => handleAuthStateChange(user), 100); 
        return;
    }
    if (!ui.loginElements || !ui.commonUIElements || !ui.adminViewElements || !ui.registrationElements || !ui.toggleLinkElements || !ui.dataEntryFormElements || !ui.userDataViewElements) { 
        console.error("CRITICAL: UI elements are still not available in handleAuthStateChange.");
        return; 
    }

    const allElementsToManage = [
        ui.loginElements.loginSection, 
        ui.registrationElements.registrationSection, 
        ui.toggleLinkElements.formToggleLinksDiv, 
        ui.dataEntryFormElements.dataEntrySection, 
        ui.adminViewElements.adminViewSection, 
        ui.userDataViewElements.userDataViewSection,
        ui.commonUIElements.logoutButton, // سيتم التحكم به بشكل أدق أدناه
        ui.commonUIElements.hrAfterLogout, // سيتم التحكم به بشكل أدق أدناه
        ui.adminViewElements.sacrificesSummaryDiv, 
        ui.adminViewElements.hrAfterSummary,
        ui.adminViewElements.exportAllToExcelButton, 
        ui.adminViewElements.exportAllUsersSeparateExcelButton
    ];
    allElementsToManage.forEach(el => { if (el) el.classList.add('hidden-field'); });


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
            if (ui.adminViewElements.sacrificesSummaryDiv) ui.adminViewElements.sacrificesSummaryDiv.classList.remove('hidden-field');
            if (ui.adminViewElements.hrAfterSummary) ui.adminViewElements.hrAfterSummary.classList.remove('hidden-field');
            fetchAndRenderSacrificesForAdmin(); 
            if (ui.adminViewElements.exportAllToExcelButton) ui.adminViewElements.exportAllToExcelButton.classList.remove('hidden-field');
            if (ui.adminViewElements.exportAllUsersSeparateExcelButton) ui.adminViewElements.exportAllUsersSeparateExcelButton.classList.remove('hidden-field');
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
        
        // التأكد من إخفاء زر تسجيل الخروج والفاصل عندما لا يكون هناك مستخدم
        if (ui.commonUIElements.logoutButton) ui.commonUIElements.logoutButton.classList.add('hidden-field');
        if (ui.commonUIElements.hrAfterLogout) ui.commonUIElements.hrAfterLogout.classList.add('hidden-field');

        if (ui.adminViewElements && ui.adminViewElements.sacrificesTableBody) ui.adminViewElements.sacrificesTableBody.innerHTML = '';
        if (ui.userDataViewElements && ui.userDataViewElements.userSacrificesTableBody) ui.userDataViewElements.userSacrificesTableBody.innerHTML = '';

        const initialAuthMsg = 'يرجى تسجيل الدخول أو إنشاء حساب جديد للمتابعة.';
         if (ui.commonUIElements.authStatusEl) {
            if (!ui.commonUIElements.authStatusEl.classList.contains('error') || ui.commonUIElements.authStatusEl.textContent.includes('مرحباً بك')) { 
                 ui.commonUIElements.authStatusEl.textContent = initialAuthMsg;
                 ui.commonUIElements.authStatusEl.className = '';
            }
        }
        if (ui.dataEntryFormElements && ui.dataEntryFormElements.statusMessageEl) { 
            ui.dataEntryFormElements.statusMessageEl.textContent = '';
            ui.dataEntryFormElements.statusMessageEl.className = '';
        }
        if (unsubscribeAdminSacrifices) { unsubscribeAdminSacrifices(); unsubscribeAdminSacrifices = null; }
        if (unsubscribeUserSacrifices) { unsubscribeUserSacrifices(); unsubscribeUserSacrifices = null; }
        currentEditingDocId = null;
        allAdminSacrificesCache = []; 
        updateSacrificesSummary(); 
    }
}

authModule.onAuthStateChanged(handleAuthStateChange);

function exportDataToExcel(dataArray, headerKeys, displayHeaders, filename) {
    if (typeof XLSX === 'undefined') {
        console.error("SheetJS (XLSX) library is not loaded!");
        if (ui.commonUIElements && ui.commonUIElements.authStatusEl) { 
            ui.commonUIElements.authStatusEl.textContent = "خطأ: مكتبة تصدير Excel غير محملة.";
            ui.commonUIElements.authStatusEl.className = 'error';
        }
        return;
    }
    const dataForSheet = [displayHeaders];
    dataArray.forEach(obj => {
        const row = headerKeys.map(key => {
            let cellValue = obj[key];
            if ((key === 'createdAt' || key === 'lastEditedAt') && cellValue && typeof cellValue.seconds === 'number') {
                cellValue = uiGetters.formatFirestoreTimestamp(cellValue); 
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
    
    // --- إضافة إعدادات المحاذاة من اليمين إلى اليسار ---
    if(!ws['!props']) ws['!props'] = {};
    ws['!props'].RTL = true;
    // أو طريقة أخرى قد تعمل في بعض إصدارات المكتبة:
    // if(!ws['!view']) ws['!view'] = {};
    // ws['!view'].RTL = true;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "البيانات");
    XLSX.writeFile(wb, filename);
}
