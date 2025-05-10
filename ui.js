// ui.js

// --- دوال للحصول على عناصر الواجهة ---
export function getLoginElements() {
    return {
        loginSection: document.getElementById('loginSection'),
        loginForm: document.getElementById('loginForm'),
        loginEmailInput: document.getElementById('loginEmail'),
        loginPasswordInput: document.getElementById('loginPassword'),
        rememberMeCheckbox: document.getElementById('rememberMe')
    };
}

export function getRegistrationElements() {
    return {
        registrationSection: document.getElementById('registrationSection'),
        registrationForm: document.getElementById('registrationForm'),
        regDisplayNameInput: document.getElementById('regDisplayNameInput'),
        regEmailInput: document.getElementById('regEmailInput'),
        regPasswordInput: document.getElementById('regPasswordInput'),
        regConfirmPasswordInput: document.getElementById('regConfirmPasswordInput')
    };
}

export function getToggleLinkElements() {
    return {
        formToggleLinksDiv: document.getElementById('formToggleLinks'),
        switchToRegisterLink: document.getElementById('switchToRegisterLink'),
        switchToLoginLink: document.getElementById('switchToLoginLink')
    };
}

export function getCommonUIElements() {
    return {
        authStatusEl: document.getElementById('authStatus'),
        logoutButton: document.getElementById('logoutButton'),
        hrAfterLogout: document.getElementById('hrAfterLogout')
    };
}

export function getDataEntryFormElements() {
    const form = document.getElementById('adahiForm');
    return {
        dataEntrySection: document.getElementById('dataEntrySection'),
        adahiForm: form,
        donorNameInput: document.getElementById('donorName'),
        sacrificeForInput: document.getElementById('sacrificeFor'),
        wantsToAttendYesRadio: document.getElementById('wantsToAttendYes'),
        wantsToAttendNoRadio: document.getElementById('wantsToAttendNo'),
        phoneNumberInput: document.getElementById('phoneNumber'),
        wantsPortionYesRadio: document.getElementById('wantsPortionYes'),
        wantsPortionNoRadio: document.getElementById('wantsPortionNo'),
        portionDetailsDiv: document.getElementById('portionDetailsDiv'),
        portionDetailsInput: document.getElementById('portionDetails'),
        addressFieldDiv: document.getElementById('addressFieldDiv'),
        addressInput: document.getElementById('address'),
        paymentDoneYesRadio: document.getElementById('paymentDoneYes'),
        paymentDoneNoRadio: document.getElementById('paymentDoneNo'),
        paymentDetailsDiv: document.getElementById('paymentDetailsDiv'),
        receiptBookNumberInput: document.getElementById('receiptBookNumber'),
        receiptNumberInput: document.getElementById('receiptNumber'),
        assistanceForSelect: document.getElementById('assistanceFor'),
        broughtByOtherYesRadio: document.getElementById('broughtByOtherYes'),
        broughtByOtherNoRadio: document.getElementById('broughtByOtherNo'),
        broughtByOtherNameDiv: document.getElementById('broughtByOtherNameDiv'),
        broughtByOtherNameInput: document.getElementById('broughtByOtherName'),
        adahiFormSubmitButton: form ? form.querySelector('button[type="submit"]') : null,
        statusMessageEl: document.getElementById('statusMessage')
    };
}

export function getAdminViewElements() {
    return {
        adminViewSection: document.getElementById('adminViewSection'),
        adminActionsDiv: document.getElementById('adminActions'),
        filterPendingButton: document.getElementById('filterPending'),
        filterEnteredButton: document.getElementById('filterEntered'),
        filterAllButton: document.getElementById('filterAll'),
        exportAllToExcelButton: document.getElementById('exportAllToExcelButton'),
        exportAllUsersSeparateExcelButton: document.getElementById('exportAllUsersSeparateExcelButton'),
        // عناصر قسم المجاميع
        sacrificesSummaryDiv: document.getElementById('sacrificesSummary'),
        summaryGazaEl: document.getElementById('summaryGaza'),
        summarySolidarityEl: document.getElementById('summarySolidarity'),
        summaryRamthaEl: document.getElementById('summaryRamtha'),
        summaryHimselfEl: document.getElementById('summaryHimself'),
        summaryTotalEl: document.getElementById('summaryTotal'),
        hrAfterSummary: document.getElementById('hrAfterSummary'),
        // بقية عناصر قسم المسؤول
        sacrificesTableContainer: document.getElementById('sacrificesTableContainer'),
        adminLoadingMessage: document.getElementById('adminLoadingMessage'),
        sacrificesTable: document.getElementById('sacrificesTable'),
        sacrificesTableBody: document.getElementById('sacrificesTableBody')
    };
}

export function getUserDataViewElements() {
    return {
        userDataViewSection: document.getElementById('userDataViewSection'),
        userLoadingMessage: document.getElementById('userLoadingMessage'),
        userSacrificesTable: document.getElementById('userSacrificesTable'),
        userSacrificesTableBody: document.getElementById('userSacrificesTableBody')
    };
}

// --- دوال مساعدة للواجهة ---
let formElementsCache = null; 
export function cacheFormElements(elements) { // جعلها export ليتمكن main.js من استدعائها
    formElementsCache = elements;
}
function getFormElements() {
    if (!formElementsCache) {
        formElementsCache = getDataEntryFormElements(); 
    }
    return formElementsCache;
}

function updateWantsPortionVisibility() {
    const elements = getFormElements();
    if (elements.wantsPortionYesRadio && elements.portionDetailsDiv && elements.addressFieldDiv) {
        const show = elements.wantsPortionYesRadio.checked;
        elements.portionDetailsDiv.style.display = show ? 'block' : 'none';
        elements.addressFieldDiv.style.display = show ? 'block' : 'none';
    }
}

function updatePaymentDetailsVisibility() {
    const elements = getFormElements();
    if (elements.paymentDoneYesRadio && elements.paymentDetailsDiv) {
        const show = elements.paymentDoneYesRadio.checked;
        elements.paymentDetailsDiv.style.display = show ? 'block' : 'none';
    }
}

function updateBroughtByOtherVisibility() {
    const elements = getFormElements();
    if (elements.broughtByOtherYesRadio && elements.broughtByOtherNameDiv) {
        const show = elements.broughtByOtherYesRadio.checked;
        elements.broughtByOtherNameDiv.style.display = show ? 'block' : 'none';
    }
}

function updateAllConditionalFieldsVisibility() {
    updateWantsPortionVisibility();
    updatePaymentDetailsVisibility();
    updateBroughtByOtherVisibility();
}

export function resetAdahiFormToEntryMode(setCurrentEditingDocIdCallback) {
    const elements = getFormElements();
    if (elements.adahiForm) { 
        if (elements.donorNameInput) elements.donorNameInput.value = '';
        if (elements.sacrificeForInput) elements.sacrificeForInput.value = '';
        if (elements.phoneNumberInput) elements.phoneNumberInput.value = '';
        if (elements.portionDetailsInput) elements.portionDetailsInput.value = '';
        if (elements.addressInput) elements.addressInput.value = '';
        if (elements.receiptBookNumberInput) elements.receiptBookNumberInput.value = '';
        if (elements.receiptNumberInput) elements.receiptNumberInput.value = '';
        if (elements.broughtByOtherNameInput) elements.broughtByOtherNameInput.value = '';
        if (elements.assistanceForSelect) elements.assistanceForSelect.value = 'inside_ramtha';

        if (elements.wantsToAttendNoRadio) elements.wantsToAttendNoRadio.checked = true;
        if (elements.wantsPortionNoRadio) elements.wantsPortionNoRadio.checked = true;
        if (elements.paymentDoneNoRadio) elements.paymentDoneNoRadio.checked = true;   
        if (elements.broughtByOtherNoRadio) elements.broughtByOtherNoRadio.checked = true;
    }
    if (setCurrentEditingDocIdCallback) setCurrentEditingDocIdCallback(null);
    if (elements.adahiFormSubmitButton) elements.adahiFormSubmitButton.textContent = 'تسجيل البيانات';
    
    updateAllConditionalFieldsVisibility();

    if (elements.statusMessageEl) { elements.statusMessageEl.textContent = ''; elements.statusMessageEl.className = '';}
}

export function populateAdahiFormForEdit(docId, data, setCurrentEditingDocIdCallback) {
    const elements = getFormElements();
    if (!elements.adahiForm) return;

    if (elements.donorNameInput) elements.donorNameInput.value = data.donorName || '';
    if (elements.sacrificeForInput) elements.sacrificeForInput.value = data.sacrificeFor || '';
    if (elements.wantsToAttendYesRadio) elements.wantsToAttendYesRadio.checked = data.wantsToAttend === true;
    if (elements.wantsToAttendNoRadio) elements.wantsToAttendNoRadio.checked = data.wantsToAttend === false || typeof data.wantsToAttend === 'undefined';
    if (elements.phoneNumberInput) elements.phoneNumberInput.value = data.phoneNumber || '';
    if (elements.wantsPortionYesRadio) elements.wantsPortionYesRadio.checked = data.wantsPortion === true;
    if (elements.wantsPortionNoRadio) elements.wantsPortionNoRadio.checked = data.wantsPortion === false || typeof data.wantsPortion === 'undefined';
    if (elements.portionDetailsInput) elements.portionDetailsInput.value = data.portionDetails || '';
    if (elements.addressInput) elements.addressInput.value = data.address || '';
    if (elements.paymentDoneYesRadio) elements.paymentDoneYesRadio.checked = data.paymentDone === true;
    if (elements.paymentDoneNoRadio) elements.paymentDoneNoRadio.checked = data.paymentDone === false || typeof data.paymentDone === 'undefined';
    if (elements.receiptBookNumberInput) elements.receiptBookNumberInput.value = data.receiptBookNumber || '';
    if (elements.receiptNumberInput) elements.receiptNumberInput.value = data.receiptNumber || '';
    if (elements.assistanceForSelect) elements.assistanceForSelect.value = data.assistanceFor || 'inside_ramtha';
    if (elements.broughtByOtherYesRadio) elements.broughtByOtherYesRadio.checked = data.broughtByOther === true;
    if (elements.broughtByOtherNoRadio) elements.broughtByOtherNoRadio.checked = data.broughtByOther === false || typeof data.broughtByOther === 'undefined';
    if (elements.broughtByOtherNameInput) elements.broughtByOtherNameInput.value = data.broughtByOtherName || '';

    updateAllConditionalFieldsVisibility(); 

    if (setCurrentEditingDocIdCallback) setCurrentEditingDocIdCallback(docId);
    if (elements.adahiFormSubmitButton) elements.adahiFormSubmitButton.textContent = 'تحديث البيانات';
    
    if (elements.statusMessageEl) {
        elements.statusMessageEl.textContent = `وضع التعديل للسجل (رقم المرجع: ${docId}). قم بالتعديل ثم اضغط "تحديث البيانات".`;
        elements.statusMessageEl.className = '';
    }
    if (elements.adahiForm.scrollIntoView) {
        elements.adahiForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else { 
        window.scrollTo(0, elements.adahiForm.offsetTop - 20);
    }
}

export function formatFirestoreTimestamp(timestamp) {
    if (!timestamp || typeof timestamp.seconds !== 'number') return ''; 
    const date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
    try {
        return date.toLocaleString('ar-SA', { 
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    } catch (e) { 
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
}

export function setupConditionalFieldListeners() {
    const elements = getFormElements(); 

    if (elements.wantsPortionYesRadio && elements.wantsPortionNoRadio) {
        [elements.wantsPortionYesRadio, elements.wantsPortionNoRadio].forEach(radio => {
            if (radio) radio.addEventListener('change', updateWantsPortionVisibility);
        });
    }

    if (elements.paymentDoneYesRadio && elements.paymentDoneNoRadio) {
        [elements.paymentDoneYesRadio, elements.paymentDoneNoRadio].forEach(radio => {
            if (radio) radio.addEventListener('change', updatePaymentDetailsVisibility);
        });
    }

    if (elements.broughtByOtherYesRadio && elements.broughtByOtherNoRadio) {
        [elements.broughtByOtherYesRadio, elements.broughtByOtherNoRadio].forEach(radio => {
            if (radio) radio.addEventListener('change', updateBroughtByOtherVisibility);
        });
    }
    
    updateAllConditionalFieldsVisibility(); 
}
