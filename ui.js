// ui.js

// --- عناصر تسجيل الدخول ---
export const loginSection = document.getElementById('loginSection');
export const loginForm = document.getElementById('loginForm');
export const loginEmailInput = document.getElementById('usernameInput'); // HTML ID is usernameInput, type is email
export const loginPasswordInput = document.getElementById('passwordInput');
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
export const authStatusEl = document.getElementById('authStatus'); // For global auth messages
export const statusMessageEl = document.getElementById('statusMessage'); // For adahiForm operation messages

// --- أقسام المحتوى الرئيسية ---
// dataEntrySection is the container for adahiForm
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
// export const exportAllToCsvButton = document.getElementById('exportAllToCsvButton'); // Accessed via adminActionsDiv in main.js
// export const exportAllUsersSeparateCsvButton = document.getElementById('exportAllUsersSeparateCsvButton'); // Accessed via adminActionsDiv in main.js

export const sacrificesTableContainer = document.getElementById('sacrificesTableContainer');
export const adminLoadingMessage = document.getElementById('loadingMessage'); // ID in HTML is loadingMessage
export const sacrificesTable = document.getElementById('sacrificesTable');
export const sacrificesTableBody = document.getElementById('sacrificesTableBody');

// --- عناصر واجهة المستخدم للمستخدم العادي (داخل userDataViewSection) ---
export const userLoadingMessage = document.getElementById('userLoadingMessage');
export const userSacrificesTable = document.getElementById('userSacrificesTable');
export const userSacrificesTableBody = document.getElementById('userSacrificesTableBody');


// --- دوال مساعدة للواجهة ---

export function resetAdahiFormToEntryMode(setCurrentEditingDocIdCallback) {
    if (adahiForm) {
        adahiForm.reset(); // This should reset all form fields to their default values in HTML
    }
    if (setCurrentEditingDocIdCallback) {
        setCurrentEditingDocIdCallback(null);
    }
    if (adahiFormSubmitButton) {
        adahiFormSubmitButton.textContent = 'تسجيل البيانات';
    }
    
    // Ensure conditional fields are hidden by default after reset
    // The 'reset()' method on a form should revert radio buttons to their 'checked' attribute in HTML.
    // If 'checked' is on "No", then these should hide. If not, we might need to manually hide.
    if (portionDetailsDiv) portionDetailsDiv.style.display = wantsPortionNoRadio.checked ? 'none' : 'block';
    if (addressFieldDiv) addressFieldDiv.style.display = wantsPortionNoRadio.checked ? 'none' : 'block';
    if (paymentDetailsDiv) paymentDetailsDiv.style.display = paymentDoneNoRadio.checked ? 'none' : 'block';
    if (broughtByOtherNameDiv) broughtByOtherNameDiv.style.display = broughtByOtherNoRadio.checked ? 'none' : 'block';
    
    // Explicitly set radios to default if reset() isn't sufficient or for clarity
    if (wantsToAttendNoRadio) wantsToAttendNoRadio.checked = true;
    if (wantsPortionNoRadio) wantsPortionNoRadio.checked = true;
    if (paymentDoneNoRadio) paymentDoneNoRadio.checked = true;
    if (broughtByOtherNoRadio) broughtByOtherNoRadio.checked = true;

    // Trigger change events to ensure conditional field visibility is updated
    if (wantsPortionNoRadio) wantsPortionNoRadio.dispatchEvent(new Event('change'));
    if (paymentDoneNoRadio) paymentDoneNoRadio.dispatchEvent(new Event('change'));
    if (broughtByOtherNoRadio) broughtByOtherNoRadio.dispatchEvent(new Event('change'));


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

    // Manually trigger change events for radio buttons to update dependent field visibility
    if (wantsPortionYesRadio) wantsPortionYesRadio.dispatchEvent(new Event('change'));
    if (wantsPortionNoRadio && !wantsPortionYesRadio.checked) wantsPortionNoRadio.dispatchEvent(new Event('change'));
    
    if (paymentDoneYesRadio) paymentDoneYesRadio.dispatchEvent(new Event('change'));
    if (paymentDoneNoRadio && !paymentDoneYesRadio.checked) paymentDoneNoRadio.dispatchEvent(new Event('change'));

    if (broughtByOtherYesRadio) broughtByOtherYesRadio.dispatchEvent(new Event('change'));
    if (broughtByOtherNoRadio && !broughtByOtherYesRadio.checked) broughtByOtherNoRadio.dispatchEvent(new Event('change'));


    if (setCurrentEditingDocIdCallback) setCurrentEditingDocIdCallback(docId);
    if (adahiFormSubmitButton) adahiFormSubmitButton.textContent = 'تحديث البيانات';
    
    if (statusMessageEl) {
        statusMessageEl.textContent = `وضع التعديل للسجل (رقم المرجع: ${docId}). قم بالتعديل ثم اضغط "تحديث البيانات".`;
        statusMessageEl.className = ''; // Neutral style
    }
    // Scroll to the form for better UX
    if (adahiForm.scrollIntoView) {
        adahiForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else { // Fallback for older browsers
        window.scrollTo(0, adahiForm.offsetTop - 20);
    }
}

export function formatFirestoreTimestamp(timestamp) {
    if (!timestamp || typeof timestamp.seconds !== 'number') return 'غير متوفر';
    const date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
    try {
        return date.toLocaleString('ar-SA', { // Using ar-SA for a common Arabic locale, adjust if needed
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    } catch (e) { // Fallback for environments that might not support ar-SA well
        console.warn("toLocaleString with ar-SA failed, using default.", e);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    }
}

// Event listeners for conditional field visibility in adahiForm
function setupConditionalField(radioYes, radioNo, conditionalDiv) {
    if (radioYes && radioNo && conditionalDiv) {
        [radioYes, radioNo].forEach(radio => {
            radio.addEventListener('change', () => {
                conditionalDiv.style.display = radioYes.checked ? 'block' : 'none';
            });
        });
        // Initial state based on default checked radio
        conditionalDiv.style.display = radioYes.checked ? 'block' : 'none';
    } else {
        // console.warn("Missing elements for conditional field setup:", 
        //     {radioYes, radioNo, conditionalDiv}
        // );
    }
}

setupConditionalField(wantsPortionYesRadio, wantsPortionNoRadio, portionDetailsDiv);
setupConditionalField(wantsPortionYesRadio, wantsPortionNoRadio, addressFieldDiv); // Address also depends on wantsPortionYes
setupConditionalField(paymentDoneYesRadio, paymentDoneNoRadio, paymentDetailsDiv);
setupConditionalField(broughtByOtherYesRadio, broughtByOtherNoRadio, broughtByOtherNameDiv);

// Initial hide for all conditional divs, in case default checked is 'No' and JS runs after HTML parsing
document.addEventListener('DOMContentLoaded', () => {
    // The setupConditionalField function called above should handle initial state.
    // This is a fallback or explicit setting if needed.
    if (wantsPortionNoRadio && wantsPortionNoRadio.checked) {
        if(portionDetailsDiv) portionDetailsDiv.style.display = 'none';
        if(addressFieldDiv) addressFieldDiv.style.display = 'none';
    }
    if (paymentDoneNoRadio && paymentDoneNoRadio.checked) {
        if(paymentDetailsDiv) paymentDetailsDiv.style.display = 'none';
    }
    if (broughtByOtherNoRadio && broughtByOtherNoRadio.checked) {
        if(broughtByOtherNameDiv) broughtByOtherNameDiv.style.display = 'none';
    }
});
