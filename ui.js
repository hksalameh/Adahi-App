// ui.js

// --- عناصر تسجيل الدخول ---
export const loginSection = document.getElementById('loginSection');
export const loginForm = document.getElementById('loginForm');
export const loginEmailInput = document.getElementById('loginEmail'); 
export const loginPasswordInput = document.getElementById('loginPassword');
export const rememberMeCheckbox = document.getElementById('rememberMe'); 
export const logoutButton = document.getElementById('logoutButton');
export const hrAfterLogout = document.getElementById('hrAfterLogout');

// --- عناصر التسجيل ---
export const registrationSection = document.getElementById('registrationSection');
export const registrationForm = document.getElementById('registrationForm');
export const regDisplayNameInput = document.getElementById('regDisplayNameInput');
export const regEmailInput = document.getElementById('regEmailInput');
export const regPasswordInput = document.getElementById('regPasswordInput');
export const regConfirmPasswordInput = document.getElementById('regConfirmPasswordInput');

// --- روابط التبديل بين النماذج ---
export const formToggleLinksDiv = document.getElementById('formToggleLinks');
export const switchToRegisterLink = document.getElementById('switchToRegisterLink');
export const switchToLoginLink = document.getElementById('switchToLoginLink');

// --- رسائل الحالة ---
export const authStatusEl = document.getElementById('authStatus'); 
export const statusMessageEl = document.getElementById('statusMessage');

// --- أقسام المحتوى الرئيسية ---
export const dataEntrySection = document.getElementById('dataEntrySection'); 
export const adminViewSection = document.getElementById('adminViewSection');
export const userDataViewSection = document.getElementById('userDataViewSection');

// --- نموذج إضافة/تعديل الأضاحي (داخل dataEntrySection) ---
export const adahiForm = document.getElementById('adahiForm');
export const donorNameInput = document.getElementById('donorName');
export const sacrificeForInput = document.getElementById('sacrificeFor');
export const wantsToAttendYesRadio = document.getElementById('wantsToAttendYes');
export const wantsToAttendNoRadio = document.getElementById('wantsToAttendNo');
export const phoneNumberInput = document.getElementById('phoneNumber');
export const wantsPortionYesRadio = document.getElementById('wantsPortionYes');
export const wantsPortionNoRadio = document.getElementById('wantsPortionNo');
export const portionDetailsDiv = document.getElementById('portionDetailsDiv');
export const portionDetailsInput = document.getElementById('portionDetails');
export const addressFieldDiv = document.getElementById('addressFieldDiv');
export const addressInput = document.getElementById('address');
export const paymentDoneYesRadio = document.getElementById('paymentDoneYes');
export const paymentDoneNoRadio = document.getElementById('paymentDoneNo');
export const paymentDetailsDiv = document.getElementById('paymentDetailsDiv');
export const receiptBookNumberInput = document.getElementById('receiptBookNumber');
export const receiptNumberInput = document.getElementById('receiptNumber');
export const assistanceForSelect = document.getElementById('assistanceFor');
export const broughtByOtherYesRadio = document.getElementById('broughtByOtherYes');
export const broughtByOtherNoRadio = document.getElementById('broughtByOtherNo');
export const broughtByOtherNameDiv = document.getElementById('broughtByOtherNameDiv');
export const broughtByOtherNameInput = document.getElementById('broughtByOtherName');
export const adahiFormSubmitButton = adahiForm ? adahiForm.querySelector('button[type="submit"]') : null;


// --- عناصر واجهة المستخدم للمسؤول (داخل adminViewSection) ---
export const adminActionsDiv = document.getElementById('adminActions');
export const filterPendingButton = document.getElementById('filterPending');
export const filterEnteredButton = document.getElementById('filterEntered');
export const filterAllButton = document.getElementById('filterAll');
export const exportAllToExcelButton = document.getElementById('exportAllToExcelButton'); 
export const exportAllUsersSeparateExcelButton = document.getElementById('exportAllUsersSeparateExcelButton'); 

export const sacrificesTableContainer = document.getElementById('sacrificesTableContainer');
export const adminLoadingMessage = document.getElementById('adminLoadingMessage'); 
export const sacrificesTable = document.getElementById('sacrificesTable');
export const sacrificesTableBody = document.getElementById('sacrificesTableBody');

// --- عناصر واجهة المستخدم للمستخدم العادي (داخل userDataViewSection) ---
export const userLoadingMessage = document.getElementById('userLoadingMessage');
export const userSacrificesTable = document.getElementById('userSacrificesTable');
export const userSacrificesTableBody = document.getElementById('userSacrificesTableBody');


// --- دوال مساعدة للواجهة ---

// دالة مساعدة لتحديث رؤية الحقول الشرطية
function updateConditionalFieldsVisibility() {
    if (wantsPortionYesRadio && portionDetailsDiv && addressFieldDiv) {
        const displayPortion = wantsPortionYesRadio.checked ? 'block' : 'none';
        portionDetailsDiv.style.display = displayPortion;
        addressFieldDiv.style.display = displayPortion;
    }
    if (paymentDoneYesRadio && paymentDetailsDiv) {
        paymentDetailsDiv.style.display = paymentDoneYesRadio.checked ? 'block' : 'none';
    }
    if (broughtByOtherYesRadio && broughtByOtherNameDiv) {
        broughtByOtherNameDiv.style.display = broughtByOtherYesRadio.checked ? 'block' : 'none';
    }
}


export function resetAdahiFormToEntryMode(setCurrentEditingDocIdCallback) {
    if (adahiForm) {
        adahiForm.reset(); 
        // بعد reset، تأكد من أن أزرار الراديو "لا" هي المحددة افتراضيًا إذا كان هذا هو السلوك المطلوب
        if (wantsToAttendNoRadio) wantsToAttendNoRadio.checked = true;
        if (wantsPortionNoRadio) wantsPortionNoRadio.checked = true;
        if (paymentDoneNoRadio) paymentDoneNoRadio.checked = true;
        if (broughtByOtherNoRadio) broughtByOtherNoRadio.checked = true;
    }
    if (setCurrentEditingDocIdCallback) {
        setCurrentEditingDocIdCallback(null);
    }
    if (adahiFormSubmitButton) {
        adahiFormSubmitButton.textContent = 'تسجيل البيانات';
    }
    
    updateConditionalFieldsVisibility(); // استدعاء الدالة لتحديث الرؤية

    if (statusMessageEl) {
        statusMessageEl.textContent = '';
        statusMessageEl.className = '';
    }
}

export function populateAdahiFormForEdit(docId, data, setCurrentEditingDocIdCallback) {
    if (!adahiForm) return;

    if (donorNameInput) donorNameInput.value = data.donorName || '';
    if (sacrificeForInput) sacrificeForInput.value = data.sacrificeFor || '';
    
    if (wantsToAttendYesRadio) wantsToAttendYesRadio.checked = data.wantsToAttend === true;
    if (wantsToAttendNoRadio) wantsToAttendNoRadio.checked = data.wantsToAttend === false || typeof data.wantsToAttend === 'undefined';
    
    if (phoneNumberInput) phoneNumberInput.value = data.phoneNumber || '';
    
    if (wantsPortionYesRadio) wantsPortionYesRadio.checked = data.wantsPortion === true;
    if (wantsPortionNoRadio) wantsPortionNoRadio.checked = data.wantsPortion === false || typeof data.wantsPortion === 'undefined';
    
    if (portionDetailsInput) portionDetailsInput.value = data.portionDetails || '';
    if (addressInput) addressInput.value = data.address || '';
    
    if (paymentDoneYesRadio) paymentDoneYesRadio.checked = data.paymentDone === true;
    if (paymentDoneNoRadio) paymentDoneNoRadio.checked = data.paymentDone === false || typeof data.paymentDone === 'undefined';
    
    if (receiptBookNumberInput) receiptBookNumberInput.value = data.receiptBookNumber || '';
    if (receiptNumberInput) receiptNumberInput.value = data.receiptNumber || '';
    if (assistanceForSelect) assistanceForSelect.value = data.assistanceFor || 'inside_ramtha';
    
    if (broughtByOtherYesRadio) broughtByOtherYesRadio.checked = data.broughtByOther === true;
    if (broughtByOtherNoRadio) broughtByOtherNoRadio.checked = data.broughtByOther === false || typeof data.broughtByOther === 'undefined';
    if (broughtByOtherNameInput) broughtByOtherNameInput.value = data.broughtByOtherName || '';

    updateConditionalFieldsVisibility(); // استدعاء الدالة لتحديث الرؤية

    if (setCurrentEditingDocIdCallback) setCurrentEditingDocIdCallback(docId);
    if (adahiFormSubmitButton) adahiFormSubmitButton.textContent = 'تحديث البيانات';
    
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
    if (!timestamp || typeof timestamp.seconds !== 'number') return ''; 
    const date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
    try {
        return date.toLocaleString('ar-SA', { 
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    } catch (e) { 
        console.warn("toLocaleString with ar-SA failed, using default.", e);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
}

// مستمعو الأحداث لإظهار/إخفاء الحقول الشرطية في نموذج الإضافة
// يتم استدعاؤها عند تغيير أي من أزرار الراديو ذات الصلة
if (wantsPortionYesRadio && wantsPortionNoRadio) {
    [wantsPortionYesRadio, wantsPortionNoRadio].forEach(radio => {
        radio.addEventListener('change', updateConditionalFieldsVisibility);
    });
}
if (paymentDoneYesRadio && paymentDoneNoRadio) {
    [paymentDoneYesRadio, paymentDoneNoRadio].forEach(radio => {
        radio.addEventListener('change', updateConditionalFieldsVisibility);
    });
}
if (broughtByOtherYesRadio && broughtByOtherNoRadio) {
    [broughtByOtherYesRadio, broughtByOtherNoRadio].forEach(radio => {
        radio.addEventListener('change', updateConditionalFieldsVisibility);
    });
}

// التأكد من الحالة الأولية عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    updateConditionalFieldsVisibility();
});
