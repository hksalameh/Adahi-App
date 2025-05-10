// ui.js

// --- عناصر الواجهة (يتم تصديرها هنا مباشرة) ---
export const loginSection = document.getElementById('loginSection');
// ... (بقية تعريفات العناصر كما هي) ...

// --- عناصر نموذج الإضافة التي تهمنا الآن ---
export const wantsPortionYesRadio = document.getElementById('wantsPortionYes');
// console.log('wantsPortionYesRadio element:', wantsPortionYesRadio); // تشخيص
export const wantsPortionNoRadio = document.getElementById('wantsPortionNo');
// console.log('wantsPortionNoRadio element:', wantsPortionNoRadio); // تشخيص
export const portionDetailsDiv = document.getElementById('portionDetailsDiv');
// console.log('portionDetailsDiv element:', portionDetailsDiv); // تشخيص
export const addressFieldDiv = document.getElementById('addressFieldDiv');
// console.log('addressFieldDiv element:', addressFieldDiv); // تشخيص

export const paymentDoneYesRadio = document.getElementById('paymentDoneYes');
// console.log('paymentDoneYesRadio element:', paymentDoneYesRadio); // تشخيص
export const paymentDoneNoRadio = document.getElementById('paymentDoneNo');
// console.log('paymentDoneNoRadio element:', paymentDoneNoRadio); // تشخيص
export const paymentDetailsDiv = document.getElementById('paymentDetailsDiv');
// console.log('paymentDetailsDiv element:', paymentDetailsDiv); // تشخيص

export const broughtByOtherYesRadio = document.getElementById('broughtByOtherYes');
// console.log('broughtByOtherYesRadio element:', broughtByOtherYesRadio); // تشخيص
export const broughtByOtherNoRadio = document.getElementById('broughtByOtherNo');
// console.log('broughtByOtherNoRadio element:', broughtByOtherNoRadio); // تشخيص
export const broughtByOtherNameDiv = document.getElementById('broughtByOtherNameDiv');
// console.log('broughtByOtherNameDiv element:', broughtByOtherNameDiv); // تشخيص

// --- (بقية عناصر الواجهة كما هي) ---
export const adahiForm = document.getElementById('adahiForm');
// ... الخ

// --- دوال مساعدة للواجهة ---

function updateWantsPortionVisibility() {
    // console.log('--- updateWantsPortionVisibility called ---');
    if (wantsPortionYesRadio && portionDetailsDiv && addressFieldDiv) {
        const show = wantsPortionYesRadio.checked;
        // console.log(`  wantsPortionYes is checked: ${show}`);
        portionDetailsDiv.style.display = show ? 'block' : 'none';
        addressFieldDiv.style.display = show ? 'block' : 'none';
        // console.log(`  portionDetailsDiv display set to: ${portionDetailsDiv.style.display}`);
        // console.log(`  addressFieldDiv display set to: ${addressFieldDiv.style.display}`);
    } else {
        // console.error('  Missing elements for wantsPortion visibility!');
    }
}

function updatePaymentDetailsVisibility() {
    // console.log('--- updatePaymentDetailsVisibility called ---');
    if (paymentDoneYesRadio && paymentDetailsDiv) {
        const show = paymentDoneYesRadio.checked;
        // console.log(`  paymentDoneYes is checked: ${show}`);
        paymentDetailsDiv.style.display = show ? 'block' : 'none';
        // console.log(`  paymentDetailsDiv display set to: ${paymentDetailsDiv.style.display}`);
    } else {
        // console.error('  Missing elements for paymentDetails visibility!');
    }
}

function updateBroughtByOtherVisibility() {
    // console.log('--- updateBroughtByOtherVisibility called ---');
    if (broughtByOtherYesRadio && broughtByOtherNameDiv) {
        const show = broughtByOtherYesRadio.checked;
        // console.log(`  broughtByOtherYes is checked: ${show}`);
        broughtByOtherNameDiv.style.display = show ? 'block' : 'none';
        // console.log(`  broughtByOtherNameDiv display set to: ${broughtByOtherNameDiv.style.display}`);
    } else {
        // console.error('  Missing elements for broughtByOther visibility!');
    }
}

function updateAllConditionalFieldsVisibility() {
    // console.log('--- updateAllConditionalFieldsVisibility called ---');
    updateWantsPortionVisibility();
    updatePaymentDetailsVisibility();
    updateBroughtByOtherVisibility();
}


export function resetAdahiFormToEntryMode(setCurrentEditingDocIdCallback) {
    const adahiFormElem = document.getElementById('adahiForm'); // استخدام getElementById هنا للتأكيد
    if (adahiFormElem) { 
        // console.log('Resetting Adahi Form...');
        // إعادة تعيين حقول الإدخال النصية والمناطق النصية والقوائم المنسدلة
        const donorNameInputElem = document.getElementById('donorName');
        if (donorNameInputElem) donorNameInputElem.value = '';
        // ... (إعادة تعيين باقي الحقول يدويًا كما في الرد السابق) ...
        const sacrificeForInputElem = document.getElementById('sacrificeFor'); if (sacrificeForInputElem) sacrificeForInputElem.value = '';
        const phoneNumberInputElem = document.getElementById('phoneNumber'); if (phoneNumberInputElem) phoneNumberInputElem.value = '';
        const portionDetailsInputElem = document.getElementById('portionDetails'); if (portionDetailsInputElem) portionDetailsInputElem.value = '';
        const addressInputElem = document.getElementById('address'); if (addressInputElem) addressInputElem.value = '';
        const receiptBookNumberInputElem = document.getElementById('receiptBookNumber'); if (receiptBookNumberInputElem) receiptBookNumberInputElem.value = '';
        const receiptNumberInputElem = document.getElementById('receiptNumber'); if (receiptNumberInputElem) receiptNumberInputElem.value = '';
        const broughtByOtherNameInputElem = document.getElementById('broughtByOtherName'); if (broughtByOtherNameInputElem) broughtByOtherNameInputElem.value = '';
        const assistanceForSelectElem = document.getElementById('assistanceFor'); if (assistanceForSelectElem) assistanceForSelectElem.value = 'inside_ramtha';


        // إعادة تعيين أزرار الراديو إلى "لا" أو القيمة الافتراضية
        if (wantsToAttendNoRadio) wantsToAttendNoRadio.checked = true;
        if (wantsPortionNoRadio) wantsPortionNoRadio.checked = true;
        if (paymentDoneNoRadio) paymentDoneNoRadio.checked = true;
        if (broughtByOtherNoRadio) broughtByOtherNoRadio.checked = true;
    }
    
    if (setCurrentEditingDocIdCallback) {
        setCurrentEditingDocIdCallback(null);
    }
    const adahiFormSubmitButtonElem = adahiFormElem ? adahiFormElem.querySelector('button[type="submit"]') : null;
    if (adahiFormSubmitButtonElem) { 
        adahiFormSubmitButtonElem.textContent = 'تسجيل البيانات';
    }
    
    // console.log('Calling updateAllConditionalFieldsVisibility from resetAdahiFormToEntryMode');
    updateAllConditionalFieldsVisibility(); 

    const statusMessageElElem = document.getElementById('statusMessage');
    if (statusMessageElElem) {
        statusMessageElElem.textContent = '';
        statusMessageElElem.className = '';
    }
}

export function populateAdahiFormForEdit(docId, data, setCurrentEditingDocIdCallback) {
    const adahiFormElem = document.getElementById('adahiForm');
    if (!adahiFormElem) {
        // console.error("adahiForm not found in populateAdahiFormForEdit");
        return;
    }

    // ... (نفس منطق ملء الحقول من الرد السابق باستخدام document.getElementById للتأكيد) ...
    const donorNameInputElem = document.getElementById('donorName'); if (donorNameInputElem) donorNameInputElem.value = data.donorName || '';
    const sacrificeForInputElem = document.getElementById('sacrificeFor'); if (sacrificeForInputElem) sacrificeForInputElem.value = data.sacrificeFor || '';
    // ... (بقية الحقول) ...
    if (wantsToAttendYesRadio) wantsToAttendYesRadio.checked = data.wantsToAttend === true;
    if (wantsToAttendNoRadio) wantsToAttendNoRadio.checked = data.wantsToAttend === false || typeof data.wantsToAttend === 'undefined';
    const phoneNumberInputElem = document.getElementById('phoneNumber'); if (phoneNumberInputElem) phoneNumberInputElem.value = data.phoneNumber || '';
    if (wantsPortionYesRadio) wantsPortionYesRadio.checked = data.wantsPortion === true;
    if (wantsPortionNoRadio) wantsPortionNoRadio.checked = data.wantsPortion === false || typeof data.wantsPortion === 'undefined';
    const portionDetailsInputElem = document.getElementById('portionDetails'); if (portionDetailsInputElem) portionDetailsInputElem.value = data.portionDetails || '';
    const addressInputElem = document.getElementById('address'); if (addressInputElem) addressInputElem.value = data.address || '';
    if (paymentDoneYesRadio) paymentDoneYesRadio.checked = data.paymentDone === true;
    if (paymentDoneNoRadio) paymentDoneNoRadio.checked = data.paymentDone === false || typeof data.paymentDone === 'undefined';
    const receiptBookNumberInputElem = document.getElementById('receiptBookNumber'); if (receiptBookNumberInputElem) receiptBookNumberInputElem.value = data.receiptBookNumber || '';
    const receiptNumberInputElem = document.getElementById('receiptNumber'); if (receiptNumberInputElem) receiptNumberInputElem.value = data.receiptNumber || '';
    const assistanceForSelectElem = document.getElementById('assistanceFor'); if (assistanceForSelectElem) assistanceForSelectElem.value = data.assistanceFor || 'inside_ramtha';
    if (broughtByOtherYesRadio) broughtByOtherYesRadio.checked = data.broughtByOther === true;
    if (broughtByOtherNoRadio) broughtByOtherNoRadio.checked = data.broughtByOther === false || typeof data.broughtByOther === 'undefined';
    const broughtByOtherNameInputElem = document.getElementById('broughtByOtherName'); if (broughtByOtherNameInputElem) broughtByOtherNameInputElem.value = data.broughtByOtherName || '';


    // console.log('Calling updateAllConditionalFieldsVisibility from populateAdahiFormForEdit');
    updateAllConditionalFieldsVisibility();

    if (setCurrentEditingDocIdCallback) setCurrentEditingDocIdCallback(docId);
    const adahiFormSubmitButtonElem = adahiFormElem.querySelector('button[type="submit"]');
    if (adahiFormSubmitButtonElem) adahiFormSubmitButtonElem.textContent = 'تحديث البيانات';
    
    const statusMessageElElem = document.getElementById('statusMessage');
    if (statusMessageElElem) {
        statusMessageElElem.textContent = `وضع التعديل للسجل (رقم المرجع: ${docId}). قم بالتعديل ثم اضغط "تحديث البيانات".`;
        statusMessageElElem.className = '';
    }
    if (adahiFormElem.scrollIntoView) {
        adahiFormElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else { 
        window.scrollTo(0, adahiFormElem.offsetTop - 20);
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

function setupRadioListeners() {
    // console.log("--- Setting up radio listeners ---");
    
    if (wantsPortionYesRadio && wantsPortionNoRadio) {
        // console.log("  Attaching listener to wantsPortionYesRadio");
        wantsPortionYesRadio.addEventListener('change', () => {
            // console.log("wantsPortionYesRadio CHANGED, checked:", wantsPortionYesRadio.checked);
            updateWantsPortionVisibility();
        });
        // console.log("  Attaching listener to wantsPortionNoRadio");
        wantsPortionNoRadio.addEventListener('change', () => {
            // console.log("wantsPortionNoRadio CHANGED, checked:", wantsPortionNoRadio.checked);
            updateWantsPortionVisibility();
        });
    } else {
        // console.warn("  wantsPortion radios not found for listeners!");
    }

    if (paymentDoneYesRadio && paymentDoneNoRadio) {
        // console.log("  Attaching listener to paymentDoneYesRadio");
        paymentDoneYesRadio.addEventListener('change', updatePaymentDetailsVisibility);
        // console.log("  Attaching listener to paymentDoneNoRadio");
        paymentDoneNoRadio.addEventListener('change', updatePaymentDetailsVisibility);
    } else {
        // console.warn("  paymentDone radios not found for listeners!");
    }

    if (broughtByOtherYesRadio && broughtByOtherNoRadio) {
        // console.log("  Attaching listener to broughtByOtherYesRadio");
        broughtByOtherYesRadio.addEventListener('change', updateBroughtByOtherVisibility);
        // console.log("  Attaching listener to broughtByOtherNoRadio");
        broughtByOtherNoRadio.addEventListener('change', updateBroughtByOtherVisibility);
    } else {
        // console.warn("  broughtByOther radios not found for listeners!");
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // console.log("--- DOMContentLoaded in ui.js ---");
    setupRadioListeners();
    // console.log("Initial call to updateAllConditionalFieldsVisibility from DOMContentLoaded");
    updateAllConditionalFieldsVisibility(); 
});
