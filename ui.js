// ui.js

// --- (عناصر الواجهة كما هي من الرد السابق، تأكد أن IDs هذه صحيحة) ---
export const loginSection = document.getElementById('loginSection');
// ... (بقية تعريفات العناصر) ...
export const wantsPortionYesRadio = document.getElementById('wantsPortionYes');
export const wantsPortionNoRadio = document.getElementById('wantsPortionNo');
export const portionDetailsDiv = document.getElementById('portionDetailsDiv');
export const addressFieldDiv = document.getElementById('addressFieldDiv');

export const paymentDoneYesRadio = document.getElementById('paymentDoneYes');
export const paymentDoneNoRadio = document.getElementById('paymentDoneNo');
export const paymentDetailsDiv = document.getElementById('paymentDetailsDiv');

export const broughtByOtherYesRadio = document.getElementById('broughtByOtherYes');
export const broughtByOtherNoRadio = document.getElementById('broughtByOtherNo');
export const broughtByOtherNameDiv = document.getElementById('broughtByOtherNameDiv');

// --- (بقية عناصر الواجهة) ---
export const adahiForm = document.getElementById('adahiForm');
// ... الخ

// --- دوال مساعدة للواجهة ---

// دالة مبسطة للتحقق من wantsPortion
function updateWantsPortionVisibility() {
    if (wantsPortionYesRadio && portionDetailsDiv && addressFieldDiv) {
        const show = wantsPortionYesRadio.checked;
        // console.log(`wantsPortionYes checked: ${show}`);
        portionDetailsDiv.style.display = show ? 'block' : 'none';
        addressFieldDiv.style.display = show ? 'block' : 'none';
        // console.log(`portionDetailsDiv display: ${portionDetailsDiv.style.display}`);
        // console.log(`addressFieldDiv display: ${addressFieldDiv.style.display}`);
    } else {
        // console.error("Missing elements for wantsPortion visibility control.");
    }
}

function updatePaymentDetailsVisibility() {
    if (paymentDoneYesRadio && paymentDetailsDiv) {
        const show = paymentDoneYesRadio.checked;
        paymentDetailsDiv.style.display = show ? 'block' : 'none';
    }
}

function updateBroughtByOtherVisibility() {
    if (broughtByOtherYesRadio && broughtByOtherNameDiv) {
        const show = broughtByOtherYesRadio.checked;
        broughtByOtherNameDiv.style.display = show ? 'block' : 'none';
    }
}

// دالة شاملة لتحديث جميع الحقول الشرطية
function updateAllConditionalFieldsVisibility() {
    updateWantsPortionVisibility();
    updatePaymentDetailsVisibility();
    updateBroughtByOtherVisibility();
}


export function resetAdahiFormToEntryMode(setCurrentEditingDocIdCallback) {
    if (adahiForm) { // فقط إذا كان النموذج موجودًا
        // إعادة تعيين حقول الإدخال النصية والمناطق النصية والقوائم المنسدلة
        if (document.getElementById('donorName')) document.getElementById('donorName').value = '';
        if (document.getElementById('sacrificeFor')) document.getElementById('sacrificeFor').value = '';
        if (document.getElementById('phoneNumber')) document.getElementById('phoneNumber').value = '';
        if (document.getElementById('portionDetails')) document.getElementById('portionDetails').value = '';
        if (document.getElementById('address')) document.getElementById('address').value = '';
        if (document.getElementById('receiptBookNumber')) document.getElementById('receiptBookNumber').value = '';
        if (document.getElementById('receiptNumber')) document.getElementById('receiptNumber').value = '';
        if (document.getElementById('broughtByOtherName')) document.getElementById('broughtByOtherName').value = '';
        if (document.getElementById('assistanceFor')) document.getElementById('assistanceFor').value = 'inside_ramtha';

        // إعادة تعيين أزرار الراديو إلى "لا" أو القيمة الافتراضية
        if (wantsToAttendNoRadio) wantsToAttendNoRadio.checked = true;
        if (wantsPortionNoRadio) wantsPortionNoRadio.checked = true;
        if (paymentDoneNoRadio) paymentDoneNoRadio.checked = true;
        if (broughtByOtherNoRadio) broughtByOtherNoRadio.checked = true;
    }
    
    if (setCurrentEditingDocIdCallback) {
        setCurrentEditingDocIdCallback(null);
    }
    if (adahiForm && adahiForm.querySelector('button[type="submit"]')) { // تأكد من وجود زر الإرسال
        adahiForm.querySelector('button[type="submit"]').textContent = 'تسجيل البيانات';
    }
    
    updateAllConditionalFieldsVisibility(); // تحديث رؤية الحقول بعد إعادة التعيين اليدوي

    const statusMessageEl = document.getElementById('statusMessage');
    if (statusMessageEl) {
        statusMessageEl.textContent = '';
        statusMessageEl.className = '';
    }
}

export function populateAdahiFormForEdit(docId, data, setCurrentEditingDocIdCallback) {
    const adahiForm = document.getElementById('adahiForm');
    if (!adahiForm) return;

    // ... (نفس منطق ملء الحقول من الرد السابق) ...
    if (document.getElementById('donorName')) document.getElementById('donorName').value = data.donorName || '';
    if (document.getElementById('sacrificeFor')) document.getElementById('sacrificeFor').value = data.sacrificeFor || '';
    
    const wantsToAttendYesRadio = document.getElementById('wantsToAttendYes');
    const wantsToAttendNoRadio = document.getElementById('wantsToAttendNo');
    if (wantsToAttendYesRadio) wantsToAttendYesRadio.checked = data.wantsToAttend === true;
    if (wantsToAttendNoRadio) wantsToAttendNoRadio.checked = data.wantsToAttend === false || typeof data.wantsToAttend === 'undefined';
    
    if (document.getElementById('phoneNumber')) document.getElementById('phoneNumber').value = data.phoneNumber || '';
    
    const wantsPortionYesRadio = document.getElementById('wantsPortionYes');
    const wantsPortionNoRadio = document.getElementById('wantsPortionNo');
    if (wantsPortionYesRadio) wantsPortionYesRadio.checked = data.wantsPortion === true;
    if (wantsPortionNoRadio) wantsPortionNoRadio.checked = data.wantsPortion === false || typeof data.wantsPortion === 'undefined';
    
    if (document.getElementById('portionDetails')) document.getElementById('portionDetails').value = data.portionDetails || '';
    if (document.getElementById('address')) document.getElementById('address').value = data.address || '';
    
    const paymentDoneYesRadio = document.getElementById('paymentDoneYes');
    const paymentDoneNoRadio = document.getElementById('paymentDoneNo');
    if (paymentDoneYesRadio) paymentDoneYesRadio.checked = data.paymentDone === true;
    if (paymentDoneNoRadio) paymentDoneNoRadio.checked = data.paymentDone === false || typeof data.paymentDone === 'undefined';
    
    if (document.getElementById('receiptBookNumber')) document.getElementById('receiptBookNumber').value = data.receiptBookNumber || '';
    if (document.getElementById('receiptNumber')) document.getElementById('receiptNumber').value = data.receiptNumber || '';
    if (document.getElementById('assistanceFor')) document.getElementById('assistanceFor').value = data.assistanceFor || 'inside_ramtha';
    
    const broughtByOtherYesRadio = document.getElementById('broughtByOtherYes');
    const broughtByOtherNoRadio = document.getElementById('broughtByOtherNo');
    if (broughtByOtherYesRadio) broughtByOtherYesRadio.checked = data.broughtByOther === true;
    if (broughtByOtherNoRadio) broughtByOtherNoRadio.checked = data.broughtByOther === false || typeof data.broughtByOther === 'undefined';
    if (document.getElementById('broughtByOtherName')) document.getElementById('broughtByOtherName').value = data.broughtByOtherName || '';


    updateAllConditionalFieldsVisibility(); // تحديث الرؤية بعد ملء النموذج

    if (setCurrentEditingDocIdCallback) setCurrentEditingDocIdCallback(docId);
    const submitButton = adahiForm.querySelector('button[type="submit"]');
    if (submitButton) submitButton.textContent = 'تحديث البيانات';
    
    const statusMessageEl = document.getElementById('statusMessage');
    if (statusMessageEl) {
        statusMessageEl.textContent = `وضع التعديل للسجل (رقم المرجع: ${docId}). قم بالتعديل ثم اضغط "تحديث البيانات".`;
        statusMessageEl.className = '';
    }
    if (adahiForm.scrollIntoView) {
        adahiForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else { 
        window.scrollTo(0, adahiForm.offsetTop - 20);
    }
}

export function formatFirestoreTimestamp(timestamp) {
    // ... (نفس الدالة) ...
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

// التأكد من ربط مستمعي الأحداث بشكل صحيح
function setupRadioListeners() {
    // console.log("Setting up radio listeners...");
    const wantsPortionRadios = [wantsPortionYesRadio, wantsPortionNoRadio];
    wantsPortionRadios.forEach(radio => {
        if (radio) radio.addEventListener('change', updateWantsPortionVisibility);
        // else console.warn("A wantsPortion radio button is missing in setupRadioListeners");
    });

    const paymentDoneRadios = [paymentDoneYesRadio, paymentDoneNoRadio];
    paymentDoneRadios.forEach(radio => {
        if (radio) radio.addEventListener('change', updatePaymentDetailsVisibility);
    });

    const broughtByOtherRadios = [broughtByOtherYesRadio, broughtByOtherNoRadio];
    broughtByOtherRadios.forEach(radio => {
        if (radio) radio.addEventListener('change', updateBroughtByOtherVisibility);
    });
}


// استدعاء إعداد المستمعين و تحديث الرؤية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    // console.log("DOM Loaded in ui.js");
    setupRadioListeners(); // إعداد المستمعين
    updateAllConditionalFieldsVisibility(); // تحديث الرؤية الأولية
});

// إعادة تصدير العناصر التي قد تكون غير معرفة في النطاق العام إذا تم استخدامها مباشرة
// من الأفضل دائمًا استخدام ui.elementName من main.js
// لكن هذا كإجراء احتياطي إذا كان هناك استدعاء مباشر في مكان ما
export { 
    loginSection, loginForm, loginEmailInput, loginPasswordInput, rememberMeCheckbox,
    logoutButton, hrAfterLogout, registrationSection, registrationForm, regDisplayNameInput,
    regEmailInput, regPasswordInput, regConfirmPasswordInput, formToggleLinksDiv,
    switchToRegisterLink, switchToLoginLink, authStatusEl, statusMessageEl,
    dataEntrySection, adminViewSection, userDataViewSection, adahiForm, donorNameInput,
    sacrificeForInput, wantsToAttendYesRadio, wantsToAttendNoRadio, phoneNumberInput,
    // wantsPortionYesRadio, wantsPortionNoRadio, // Already exported
    // portionDetailsDiv, portionDetailsInput, addressFieldDiv, addressInput, // Already exported
    // paymentDoneYesRadio, paymentDoneNoRadio, paymentDetailsDiv, // Already exported
    receiptBookNumberInput, receiptNumberInput, assistanceForSelect,
    // broughtByOtherYesRadio, broughtByOtherNoRadio, // Already exported
    // broughtByOtherNameDiv, broughtByOtherNameInput, // Already exported
    adahiFormSubmitButton, adminActionsDiv, filterPendingButton, filterEnteredButton,
    filterAllButton, exportAllToExcelButton, exportAllUsersSeparateExcelButton,
    sacrificesTableContainer, adminLoadingMessage, sacrificesTable, sacrificesTableBody,
    userLoadingMessage, userSacrificesTable, userSacrificesTableBody
};
