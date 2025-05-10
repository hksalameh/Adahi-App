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
let domReady = false; 

function setCurrentEditingDocId(id) {
    currentEditingDocId = id;
}

// --- تعريف دالة updateUIVisibility في بداية الملف ---
function updateUIVisibility(user) {
    if (!domReady || !ui.loginElements || !ui.commonUIElements || !ui.adminViewElements || !ui.registrationElements || !ui.toggleLinkElements || !ui.dataEntryFormElements || !ui.userDataViewElements) { 
        if (!domReady) {
            setTimeout(() => updateUIVisibility(user), 100); 
        }
        return; 
    }

    const allElementsToManage = [
        ui.loginElements.loginSection, 
        ui.registrationElements.registrationSection, 
        ui.toggleLinkElements.formToggleLinksDiv, 
        ui.dataEntryFormElements.dataEntrySection, 
        ui.adminViewElements.adminViewSection, 
        ui.userDataViewElements.userDataViewSection,
        ui.commonUIElements.logoutButton, 
        ui.commonUIElements.hrAfterLogout,
        ui.adminViewElements.sacrificesSummaryDiv, 
        ui.adminViewElements.hrAfterSummary,
        ui.adminViewElements.exportAllToExcelButton, 
        ui.adminViewElements.exportAllUsersSeparateExcelButton,
        ui.adminViewElements.exportAllToPdfButton, 
        ui.adminViewElements.exportAllUsersSeparatePdfButton
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
            if (ui.adminViewElements.exportAllToPdfButton) ui.adminViewElements.exportAllToPdfButton.classList.remove('hidden-field');
            if (ui.adminViewElements.exportAllUsersSeparatePdfButton) ui.adminViewElements.exportAllUsersSeparatePdfButton.classList.remove('hidden-field');
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

function updateSacrificesSummary() {
    if (!domReady || !ui.adminViewElements || !ui.adminViewElements.summaryGazaEl) return;
    let gazaCount = 0, solidarityCount = 0, ramthaCount = 0, himselfCount = 0;
    allAdminSacrificesCache.forEach(data => {
        switch (data.assistanceFor) {
            case 'gaza_people': gazaCount++; break;
            case 'solidarity_fund': solidarityCount++; break;
            case 'inside_ramtha': ramthaCount++; break;
            case 'for_himself': himselfCount++; break;
        }
    });
    if (ui.adminViewElements.summaryGazaEl) ui.adminViewElements.summaryGazaEl.textContent = gazaCount;
    if (ui.adminViewElements.summarySolidarityEl) ui.adminViewElements.summarySolidarityEl.textContent = solidarityCount;
    if (ui.adminViewElements.summaryRamthaEl) ui.adminViewElements.summaryRamthaEl.textContent = ramthaCount;
    if (ui.adminViewElements.summaryHimselfEl) ui.adminViewElements.summaryHimselfEl.textContent = himselfCount;
    if (ui.adminViewElements.summaryTotalEl) ui.adminViewElements.summaryTotalEl.textContent = allAdminSacrificesCache.length;
}

function renderCellValue(value, isBooleanNoMeansEmpty = false, conditionalEmptyValue = '') {
    if (value === null || typeof value === 'undefined') return '';
    if (isBooleanNoMeansEmpty && value === false) return '';
    if (typeof value === 'boolean') return value ? 'نعم' : (isBooleanNoMeansEmpty ? '' : 'لا');
    if (value === conditionalEmptyValue && conditionalEmptyValue !== '') return '';
    return String(value);
}

function renderSacrificesForAdminUI(docsSnapshot) {
    if (!domReady ||!ui.adminViewElements || !ui.adminViewElements.sacrificesTableBody) { return; }
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
    if (!domReady || !ui.userDataViewElements || !ui.userDataViewElements.userSacrificesTableBody) { return; }
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

async function fetchAndRenderSacrificesForAdmin(filterStatus = 'all') {
    const authService = authModule.getAuthInstance();
    if (!authService || !authService.currentUser || authService.currentUser.uid !== ADMIN_UID) return;
    if (domReady && ui.adminViewElements && ui.adminViewElements.adminLoadingMessage) { 
        ui.adminViewElements.adminLoadingMessage.style.display = 'block';
        ui.adminViewElements.adminLoadingMessage.textContent = 'جاري تحميل بيانات المسؤول...';
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
    }, (error) => {
        console.error("Error fetching admin sacrifices with onSnapshot: ", error);
        if (domReady && ui.adminViewElements && ui.adminViewElements.adminLoadingMessage) ui.adminViewElements.adminLoadingMessage.textContent = 'خطأ في تحميل بيانات المسؤول: ' + error.message;
        if (domReady && ui.adminViewElements && ui.adminViewElements.sacrificesTableBody) ui.adminViewElements.sacrificesTableBody.innerHTML = `<tr><td colspan="18">خطأ في تحميل البيانات.</td></tr>`;
    });
}

async function fetchAndRenderSacrificesForUserUI(userId) {
    if (!userId) return;
    if (domReady && ui.userDataViewElements && ui.userDataViewElements.userLoadingMessage) { 
        ui.userDataViewElements.userLoadingMessage.style.display = 'block';
        ui.userDataViewElements.userLoadingMessage.textContent = 'جاري تحميل أضاحيك المسجلة...';
    }
    if (unsubscribeUserSacrifices) unsubscribeUserSacrifices();
    const sacrificesCol = collection(db, "sacrifices");
    const q = query(sacrificesCol, where("userId", "==", userId), orderBy("createdAt", "desc"));
    unsubscribeUserSacrifices = onSnapshot(q, (querySnapshot) => {
        renderSacrificesForUserUI(querySnapshot);
         if (domReady && ui.userDataViewElements && ui.userDataViewElements.userLoadingMessage && !querySnapshot.empty) {
            ui.userDataViewElements.userLoadingMessage.style.display = 'none';
        } else if (querySnapshot.empty && domReady && ui.userDataViewElements && ui.userDataViewElements.userLoadingMessage) {
            ui.userDataViewElements.userLoadingMessage.textContent = 'لم تقم بتسجيل أي أضاحي بعد.';
            ui.userDataViewElements.userLoadingMessage.style.display = 'block';
        }
    }, (error) => {
        console.error("Error fetching user sacrifices with onSnapshot: ", error);
        if (domReady && ui.userDataViewElements && ui.userDataViewElements.userLoadingMessage) ui.userDataViewElements.userLoadingMessage.textContent = 'خطأ في تحميل الأضاحي: ' + error.message;
        if (domReady && ui.userDataViewElements && ui.userDataViewElements.userSacrificesTableBody) ui.userDataViewElements.userSacrificesTableBody.innerHTML = `<tr><td colspan="7">خطأ في تحميل البيانات.</td></tr>`;
    });
}

function exportDataToExcel(dataArray, headerKeys, displayHeaders, filename) {
    if (typeof XLSX === 'undefined') {
        console.error("SheetJS (XLSX) library is not loaded!");
        if (domReady && ui.commonUIElements && ui.commonUIElements.authStatusEl) { 
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
    if(!ws['!props']) ws['!props'] = {};
    ws['!props'].RTL = true; 
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "البيانات");
    XLSX.writeFile(wb, filename);
}

function exportDataToPDF(dataArray, headerKeys, displayHeaders, filename, title = "تقرير الأضاحي") {
    if (typeof window.jspdf === 'undefined') {
        console.error("jsPDF library is not loaded!");
        if (domReady && ui.commonUIElements && ui.commonUIElements.authStatusEl) {
            ui.commonUIElements.authStatusEl.textContent = "خطأ: مكتبة تصدير PDF غير محملة.";
            ui.commonUIElements.authStatusEl.className = 'error';
        }
        return;
    }
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
    doc.setFont("helvetica", "normal"); 
    const head = [displayHeaders.map(h => h)];
    const body = dataArray.map(obj => 
        headerKeys.map(key => {
            let cellValue = obj[key];
            if ((key === 'createdAt' || key === 'lastEditedAt') && cellValue && typeof cellValue.seconds === 'number') {
                cellValue = uiGetters.formatFirestoreTimestamp(cellValue); 
            } else if (typeof cellValue === 'boolean') {
                cellValue = cellValue ? 'نعم' : ''; 
            } else if (cellValue === null || typeof cellValue === 'undefined') {
                cellValue = '';
            }
            return String(cellValue); 
        })
    );
    doc.setFontSize(18);
    doc.text(title, doc.internal.pageSize.getWidth() / 2, 40, { align: 'center' });
    if (doc.autoTable) {
        doc.autoTable({
            head: head, body: body, startY: 60, theme: 'striped', 
            styles: { font: "helvetica", halign: 'right', fontSize: 8, cellPadding: 3,},
            headStyles: { fillColor: [22, 160, 133], textColor: 255, fontStyle: 'bold', halign: 'center'},
            didDrawPage: function (data) {
                doc.setFontSize(10);
                doc.text('صفحة ' + doc.internal.getNumberOfPages(), data.settings.margin.left, doc.internal.pageSize.getHeight() - 10);
            },
        });
    } else {
        console.error("jsPDF-AutoTable plugin is not loaded!");
        doc.text("jsPDF-AutoTable plugin is required to render tables correctly.", 20, 80);
    }
    doc.save(filename);
}


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
    domReady = true; 

    if (ui.commonUIElements.authStatusEl) {
        ui.commonUIElements.authStatusEl.textContent = 'جاري التحميل...';
        ui.commonUIElements.authStatusEl.className = '';
    }

    const authService = authModule.getAuthInstance();
    if (authService) {
        updateUIVisibility(authService.currentUser); 
    }

    // Auth form event listeners
    if (ui.loginElements.loginForm && ui.loginElements.loginEmailInput && ui.loginElements.loginPasswordInput && ui.loginElements.rememberMeCheckbox) {
        ui.loginElements.loginForm.addEventListener('submit', async (event) => {
            event.preventDefault(); 
            const email = ui.loginElements.loginEmailInput.value;
            const password = ui.loginElements.loginPasswordInput.value;
            const rememberMe = ui.loginElements.rememberMeCheckbox.checked;
            if (!email || !password) {
                if (ui.commonUIElements.authStatusEl) {
                    ui.commonUIElements.authStatusEl.textContent = 'الرجاء إدخال البريد الإلكتروني وكلمة المرور.';
                    ui.commonUIElements.authStatusEl.className = 'error';
                } return;
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
            if (password !== confirmPassword) {
                if (ui.commonUIElements.authStatusEl) {
                    ui.commonUIElements.authStatusEl.textContent = 'كلمتا المرور غير متطابقتين.';
                    ui.commonUIElements.authStatusEl.className = 'error';
                } return;
            }
            if (password.length < 6) {
                if (ui.commonUIElements.authStatusEl) {
                    ui.commonUIElements.authStatusEl.textContent = 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.';
                    ui.commonUIElements.authStatusEl.className = 'error';
                } return;
            }
            if (ui.commonUIElements.authStatusEl) {
                ui.commonUIElements.authStatusEl.textContent = 'جاري إنشاء الحساب...';
                ui.commonUIElements.authStatusEl.className = '';
            }
            try {
                await authModule.registerUser(email, password, displayName);
                if (ui.registrationElements.registrationForm) ui.registrationElements.registrationForm.reset();
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
                if (ui.commonUIElements.authStatusEl) {
                    ui.commonUIElements.authStatusEl.textContent = errorMessage;
                    ui.commonUIElements.authStatusEl.className = 'error';
                }
            }
        });
    } else {
        console.error("Could not attach submit listener to registrationForm. (DOMContentLoaded)");
    }

    if (ui.toggleLinkElements.switchToRegisterLink && ui.toggleLinkElements.switchToLoginLink && ui.loginElements.loginSection && ui.registrationElements.registrationSection && ui.toggleLinkElements.formToggleLinksDiv) {
        ui.toggleLinkElements.switchToRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (ui.loginElements.loginSection) ui.loginElements.loginSection.classList.add('hidden-field');
            if (ui.registrationElements.registrationSection) ui.registrationElements.registrationSection.classList.remove('hidden-field');
            if (ui.toggleLinkElements.switchToRegisterLink) ui.toggleLinkElements.switchToRegisterLink.classList.add('hidden-field');
            if (ui.toggleLinkElements.switchToLoginLink) ui.toggleLinkElements.switchToLoginLink.classList.remove('hidden-field');
            if (ui.commonUIElements.authStatusEl) { ui.commonUIElements.authStatusEl.textContent = 'قم بإنشاء حساب جديد أو سجل دخولك إذا كان لديك حساب بالفعل.'; ui.commonUIElements.authStatusEl.className = ''; }
            if (ui.loginElements.loginForm) ui.loginElements.loginForm.reset();
            if (ui.registrationElements.registrationForm) ui.registrationElements.registrationForm.reset();
            if (ui.commonUIElements.logoutButton) ui.commonUIElements.logoutButton.classList.add('hidden-field');
            if (ui.commonUIElements.hrAfterLogout) ui.commonUIElements.hrAfterLogout.classList.add('hidden-field');
        });
        ui.toggleLinkElements.switchToLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            if (ui.registrationElements.registrationSection) ui.registrationElements.registrationSection.classList.add('hidden-field');
            if (ui.loginElements.loginSection) ui.loginElements.loginSection.classList.remove('hidden-field');
            if (ui.toggleLinkElements.switchToLoginLink) ui.toggleLinkElements.switchToLoginLink.classList.add('hidden-field');
            if (ui.toggleLinkElements.switchToRegisterLink) ui.toggleLinkElements.switchToRegisterLink.classList.remove('hidden-field');
            if (ui.commonUIElements.authStatusEl) { ui.commonUIElements.authStatusEl.textContent = 'سجل دخولك أو قم بإنشاء حساب جديد.'; ui.commonUIElements.authStatusEl.className = ''; }
            if (ui.loginElements.loginForm) ui.loginElements.loginForm.reset();
            if (ui.registrationElements.registrationForm) ui.registrationElements.registrationForm.reset();
            if (ui.commonUIElements.logoutButton) ui.commonUIElements.logoutButton.classList.add('hidden-field');
            if (ui.commonUIElements.hrAfterLogout) ui.commonUIElements.hrAfterLogout.classList.add('hidden-field');
        });
    } else {
        console.error("Could not attach click listeners to toggle links. (DOMContentLoaded)");
    }

    if (ui.commonUIElements.logoutButton) {
        ui.commonUIElements.logoutButton.addEventListener('click', async () => {
            if (ui.commonUIElements.authStatusEl) {
                ui.commonUIElements.authStatusEl.textContent = 'جاري تسجيل الخروج...';
                ui.commonUIElements.authStatusEl.className = '';
            }
            try {
                await authModule.handleSignOut();
            } catch (error) {
                console.error('Logout error:', error);
                if (ui.commonUIElements.authStatusEl) {
                    ui.commonUIElements.authStatusEl.textContent = 'خطأ في تسجيل الخروج: ' + error.message;
                    ui.commonUIElements.authStatusEl.className = 'error';
                }
            }
        });
    } else {
        console.error("ui.commonUIElements.logoutButton not found. (DOMContentLoaded)");
    }

    if (ui.dataEntryFormElements.adahiForm) {
        ui.dataEntryFormElements.adahiForm.addEventListener('submit', async (event) => {
            event.preventDefault();
            const authService = authModule.getAuthInstance(); 
            if (!authService || !authService.currentUser) {
                if(ui.dataEntryFormElements.statusMessageEl) {ui.dataEntryFormElements.statusMessageEl.textContent = 'يجب تسجيل الدخول أولاً لإضافة أو تعديل البيانات.'; ui.dataEntryFormElements.statusMessageEl.className = 'error';}
                return; 
            }
            const currentUser = authService.currentUser;
            const editorIdentifier = currentUser.displayName || currentUser.email;

            const adahiDataToSave = {
                donorName: ui.dataEntryFormElements.donorNameInput.value, 
                sacrificeFor: ui.dataEntryFormElements.sacrificeForInput.value,
                wantsToAttend: ui.dataEntryFormElements.wantsToAttendYesRadio.checked, 
                phoneNumber: ui.dataEntryFormElements.phoneNumberInput.value,
                wantsPortion: ui.dataEntryFormElements.wantsPortionYesRadio.checked,
                portionDetails: ui.dataEntryFormElements.wantsPortionYesRadio.checked ? ui.dataEntryFormElements.portionDetailsInput.value : '',
                address: ui.dataEntryFormElements.wantsPortionYesRadio.checked ? ui.dataEntryFormElements.addressInput.value : '',
                paymentDone: ui.dataEntryFormElements.paymentDoneYesRadio.checked,
                receiptBookNumber: ui.dataEntryFormElements.paymentDoneYesRadio.checked ? ui.dataEntryFormElements.receiptBookNumberInput.value : '',
                receiptNumber: ui.dataEntryFormElements.paymentDoneYesRadio.checked ? ui.dataEntryFormElements.receiptNumberInput.value : '',
                assistanceFor: ui.dataEntryFormElements.assistanceForSelect.value,
                broughtByOther: ui.dataEntryFormElements.broughtByOtherYesRadio.checked,
                broughtByOtherName: ui.dataEntryFormElements.broughtByOtherYesRadio.checked ? ui.dataEntryFormElements.broughtByOtherNameInput.value : '',
            };
            
            if (currentEditingDocId) {
                if(ui.dataEntryFormElements.statusMessageEl) {ui.dataEntryFormElements.statusMessageEl.textContent = 'جاري تحديث البيانات...'; ui.dataEntryFormElements.statusMessageEl.className = '';}
                adahiDataToSave.lastEditedBy = editorIdentifier;
                adahiDataToSave.lastEditedAt = serverTimestamp();
                try {
                    await fsService.updateSacrifice(currentEditingDocId, adahiDataToSave, editorIdentifier);
                    if(ui.dataEntryFormElements.statusMessageEl) {ui.dataEntryFormElements.statusMessageEl.textContent = 'تم تحديث البيانات بنجاح!'; ui.dataEntryFormElements.statusMessageEl.className = 'success';}
                    uiGetters.resetAdahiFormToEntryMode(setCurrentEditingDocId);
                } catch (e) { 
                    console.error("Update error:", e);
                    if(ui.dataEntryFormElements.statusMessageEl) {ui.dataEntryFormElements.statusMessageEl.textContent = 'خطأ في تحديث البيانات: ' + e.message; ui.dataEntryFormElements.statusMessageEl.className = 'error';}
                }
            } else {
                if(ui.dataEntryFormElements.statusMessageEl) {ui.dataEntryFormElements.statusMessageEl.textContent = 'جاري حفظ البيانات...'; ui.dataEntryFormElements.statusMessageEl.className = '';}
                adahiDataToSave.userId = currentUser.uid;
                adahiDataToSave.enteredBy = editorIdentifier;
                adahiDataToSave.status = 'pending_entry';
                adahiDataToSave.createdAt = serverTimestamp();

                try {
                    const docRefDb = await fsService.addSacrifice(adahiDataToSave);
                    if(ui.dataEntryFormElements.statusMessageEl) {ui.dataEntryFormElements.statusMessageEl.textContent = 'تم حفظ البيانات بنجاح! رقم المرجع: ' + docRefDb.id; ui.dataEntryFormElements.statusMessageEl.className = 'success';}
                    uiGetters.resetAdahiFormToEntryMode(setCurrentEditingDocId);
                } catch (e) { 
                    console.error("Add error:", e);
                    if(ui.dataEntryFormElements.statusMessageEl) {ui.dataEntryFormElements.statusMessageEl.textContent = 'خطأ في حفظ البيانات: ' + e.message; ui.dataEntryFormElements.statusMessageEl.className = 'error';}
                }
            }
        });
    } else {
        console.error("ui.dataEntryFormElements.adahiForm not found. (DOMContentLoaded)");
    }

    if (ui.adminViewElements.filterAllButton) ui.adminViewElements.filterAllButton.addEventListener('click', () => fetchAndRenderSacrificesForAdmin('all'));
    if (ui.adminViewElements.filterPendingButton) ui.adminViewElements.filterPendingButton.addEventListener('click', () => fetchAndRenderSacrificesForAdmin('pending_entry'));
    if (ui.adminViewElements.filterEnteredButton) ui.adminViewElements.filterEnteredButton.addEventListener('click', () => fetchAndRenderSacrificesForAdmin('entered'));

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

    if (ui.adminViewElements.exportAllToPdfButton) {
        ui.adminViewElements.exportAllToPdfButton.addEventListener('click', async () => {
            if (ui.commonUIElements.authStatusEl) {ui.commonUIElements.authStatusEl.textContent = "جاري تجهيز كل البيانات للتصدير (PDF)..."; ui.commonUIElements.authStatusEl.className = '';}
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
                const headerKeys_pdf = [
                    "donorName", "sacrificeFor", "wantsToAttend", "phoneNumber", 
                    "portionDetails", "address", "paymentDone", "receiptBookNumber", "receiptNumber", 
                    "assistanceFor", "broughtByOther", "broughtByOtherName", "createdAt", "enteredBy"
                ];
                const displayHeaders_pdf = [
                    "المتبرع", "الأضحية عن", "حضور؟", "هاتف", 
                    "تفاصيل الجزء", "العنوان", "مدفوع؟", "ر.الدفتر", "ر.السند", 
                    "المساعدة لـ", "بوسيط؟", "اسم الوسيط", "ت.التسجيل", "أدخل بواسطة"
                ];
                await exportDataToPDF(dataToExport, headerKeys_pdf, displayHeaders_pdf, 'كل_بيانات_الاضاحي.pdf', 'تقرير كل بيانات الأضاحي');
                if (ui.commonUIElements.authStatusEl) {ui.commonUIElements.authStatusEl.textContent = "تم تصدير كل البيانات بنجاح (PDF)."; ui.commonUIElements.authStatusEl.className = 'success';}
            } catch (error) { 
                console.error("Error exporting all data to PDF: ", error); 
                if (ui.commonUIElements.authStatusEl) {ui.commonUIElements.authStatusEl.textContent = "خطأ في تصدير كل البيانات (PDF): " + error.message; ui.commonUIElements.authStatusEl.className = 'error';}
            }
        });
    } else {
        console.error("ui.adminViewElements.exportAllToPdfButton not found. (DOMContentLoaded)");
    }

    if (ui.adminViewElements.exportAllUsersSeparatePdfButton) {
        ui.adminViewElements.exportAllUsersSeparatePdfButton.addEventListener('click', async () => {
            if (ui.commonUIElements.authStatusEl) {ui.commonUIElements.authStatusEl.textContent = "جاري تجهيز بيانات كل مدخل (PDF)..."; ui.commonUIElements.authStatusEl.className = '';}
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
                const headerKeys_pdf_users = [
                    "donorName", "sacrificeFor", "wantsToAttend", "phoneNumber",
                    "portionDetails", "address", "paymentDone", "receiptBookNumber", "receiptNumber",
                    "assistanceFor", "broughtByOther", "broughtByOtherName", "createdAt", "enteredBy"
                ];
                const displayHeaders_pdf_users = [
                    "المتبرع", "الأضحية عن", "حضور؟", "هاتف",
                    "تفاصيل الجزء", "العنوان", "مدفوع؟", "ر.الدفتر", "ر.السند",
                    "المساعدة لـ", "بوسيط؟", "اسم الوسيط", "ت.التسجيل", "أدخل بواسطة"
                ];
                let exportedCount = 0;
                const totalUserGroups = Object.keys(dataByUser).length;
                if (ui.commonUIElements.authStatusEl) {ui.commonUIElements.authStatusEl.textContent = `بدء تصدير ${totalUserGroups} ملف للمدخلين (PDF)...`;}
                for (const groupKey in dataByUser) {
                    if (dataByUser.hasOwnProperty(groupKey)) {
                        const fileNamePart = String(dataByUser[groupKey].name).replace(/[^\p{L}\p{N}_-]/gu, '_');
                        const userDataEntries = dataByUser[groupKey].entries;
                        if (userDataEntries.length > 0) {
                            await exportDataToPDF(userDataEntries, headerKeys_pdf_users, displayHeaders_pdf_users, `بيانات_مدخل_${fileNamePart}.pdf`, `تقرير المدخل: ${dataByUser[groupKey].name}`);
                            await new Promise(resolve => setTimeout(resolve, 300)); 
                            exportedCount++;
                            if (ui.commonUIElements.authStatusEl) {ui.commonUIElements.authStatusEl.textContent = `تم تصدير ${exportedCount} من ${totalUserGroups} ملف (PDF)...`;}
                        }
                    }
                }
                if (ui.commonUIElements.authStatusEl) {ui.commonUIElements.authStatusEl.textContent = `تم تصدير بيانات ${exportedCount} مدخل بنجاح في ملفات PDF منفصلة.`; ui.commonUIElements.authStatusEl.className = 'success';}
            } catch (error) {
                console.error("Error exporting all users separate data to PDF: ", error);
                let errMessage = "خطأ أثناء تصدير بيانات المدخلين (PDF): " + error.message;
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
        console.error("ui.adminViewElements.exportAllUsersSeparatePdfButton not found. (DOMContentLoaded)");
    }
}); 

authModule.onAuthStateChanged(updateUIVisibility);
