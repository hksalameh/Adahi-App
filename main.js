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
        editButton.onclick = () => uiGetters.populateAdahiFormForEdit(docSnapshot.id, data, setCurrentEditingDocId);
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

    if (ui.commonUIElements.authStatusEl) {
        ui.commonUIElements.authStatusEl.textContent = 'جاري التحميل...';
        ui.commonUIElements.authStatusEl.className = '';
    }

    // ... (بقية مستمعي الأحداث داخل DOMContentLoaded كما هم) ...
}); 

function handleAuthStateChange(user) {
    if (!ui.loginElements || !ui.commonUIElements || !ui.adminViewElements || !ui.registrationElements || !ui.toggleLinkElements || !ui.dataEntryFormElements || !ui.userDataViewElements) { 
        console.warn("UI elements not fully initialized in handleAuthStateChange. Retrying in 100ms.");
        setTimeout(() => handleAuthStateChange(user), 100); // محاولة بسيطة لإعادة التشغيل إذا لم تكن العناصر جاهزة
        return; 
    }

    // الخطوة 1: إخفاء كل شيء تقريبًا بشكل افتراضي
    const sectionsToHideInitially = [
        ui.dataEntryFormElements.dataEntrySection, 
        ui.adminViewElements.adminViewSection, 
        ui.userDataViewElements.userDataViewSection,
        ui.adminViewElements.sacrificesSummaryDiv, 
        ui.adminViewElements.hrAfterSummary,
        ui.adminViewElements.exportAllToExcelButton, 
        ui.adminViewElements.exportAllUsersSeparateExcelButton
    ];
    sectionsToHideInitially.forEach(el => { if (el) el.classList.add('hidden-field'); });
    
    // إخفاء/إظهار عناصر المصادقة بشكل منفصل
    if (ui.loginElements.loginSection) ui.loginElements.loginSection.classList.add('hidden-field');
    if (ui.registrationElements.registrationSection) ui.registrationElements.registrationSection.classList.add('hidden-field');
    if (ui.toggleLinkElements.formToggleLinksDiv) ui.toggleLinkElements.formToggleLinksDiv.classList.add('hidden-field');
    if (ui.commonUIElements.logoutButton) ui.commonUIElements.logoutButton.classList.add('hidden-field');
    if (ui.commonUIElements.hrAfterLogout) ui.commonUIElements.hrAfterLogout.classList.add('hidden-field');


    if (user) { // المستخدم مسجل دخوله
        if (ui.commonUIElements.authStatusEl) {
            ui.commonUIElements.authStatusEl.textContent = `مرحباً بك ${user.displayName || user.email}!`;
            ui.commonUIElements.authStatusEl.className = 'success';
        }
        // إظهار العناصر الخاصة بالمستخدم المسجل دخوله
        if (ui.commonUIElements.logoutButton) ui.commonUIElements.logoutButton.classList.remove('hidden-field');
        if (ui.commonUIElements.hrAfterLogout) ui.commonUIElements.hrAfterLogout.classList.remove('hidden-field');
        if (ui.dataEntryFormElements.dataEntrySection) ui.dataEntryFormElements.dataEntrySection.classList.remove('hidden-field');

        // لا حاجة لإظهار نماذج تسجيل الدخول/التسجيل أو روابط التبديل

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
    } else { // المستخدم غير مسجل دخوله
        // إظهار نموذج تسجيل الدخول وروابط التبديل فقط
        if (ui.loginElements.loginSection) ui.loginElements.loginSection.classList.remove('hidden-field');
        if (ui.toggleLinkElements.formToggleLinksDiv) ui.toggleLinkElements.formToggleLinksDiv.classList.remove('hidden-field');
        if (ui.toggleLinkElements.switchToLoginLink) ui.toggleLinkElements.switchToLoginLink.classList.add('hidden-field'); 
        if (ui.toggleLinkElements.switchToRegisterLink) ui.toggleLinkElements.switchToRegisterLink.classList.remove('hidden-field'); 
        
        // مسح الجداول
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
    // ... (كما هي)
}
