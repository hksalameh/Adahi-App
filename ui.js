// ui.js

// --- (عناصر الواجهة كما هي) ---
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
// ... (بقية تعريفات العناصر) ...


// --- دوال مساعدة للواجهة ---
let cachedFormElements = null; 
function getFormElements() {
    if (!cachedFormElements) {
        // console.log("[UI_LOG] Caching form elements in ui.js");
        // استدعاء getDataEntryFormElements() التي يجب أن تُصدر وتُعرف في هذا الملف أيضًا
        // إذا لم تكن كذلك، يجب تعديلها لتستخدم العناصر المعرفة أعلاه.
        // للتبسيط الآن، سنفترض أن العناصر أعلاه هي التي تستخدمها الدوال مباشرة.
        // هذا الجزء يحتاج لمراجعة بناءً على كامل ملف ui.js الذي لديك.
        // إذا كانت getDataEntryFormElements معرفة ومصدرة، يمكن استخدامها.
        // وإلا، نستخدم المتغيرات المعرفة مباشرة في هذا النطاق.
        cachedFormElements = { // مثال مبسط
            wantsPortionYesRadio, wantsPortionNoRadio, portionDetailsDiv, addressFieldDiv,
            paymentDoneYesRadio, paymentDoneNoRadio, paymentDetailsDiv,
            broughtByOtherYesRadio, broughtByOtherNoRadio, broughtByOtherNameDiv,
            // أضف باقي عناصر النموذج هنا إذا كانت reset/populate تستخدم cachedFormElements
            donorNameInput: document.getElementById('donorName'),
            sacrificeForInput: document.getElementById('sacrificeFor'),
            phoneNumberInput: document.getElementById('phoneNumber'),
            portionDetailsInput: document.getElementById('portionDetails'),
            addressInput: document.getElementById('address'),
            receiptBookNumberInput: document.getElementById('receiptBookNumber'),
            receiptNumberInput: document.getElementById('receiptNumber'),
            broughtByOtherNameInput: document.getElementById('broughtByOtherName'),
            assistanceForSelect: document.getElementById('assistanceFor'),
            wantsToAttendNoRadio: document.getElementById('wantsToAttendNo'),
            paymentDoneNoRadio: document.getElementById('paymentDoneNo'), // تأكد من وجوده
            statusMessageEl: document.getElementById('statusMessage'),
            adahiForm: document.getElementById('adahiForm'),
            adahiFormSubmitButton: document.getElementById('adahiForm') ? document.getElementById('adahiForm').querySelector('button[type="submit"]') : null
        };
    }
    return cachedFormElements;
}


function updateWantsPortionVisibility() {
    const elements = getFormElements();
    if (elements.wantsPortionYesRadio && elements.portionDetailsDiv && elements.addressFieldDiv) {
        const show = elements.wantsPortionYesRadio.checked;
        console.log(`  [UI_LOG] updateWantsPortionVisibility: wantsPortionYes is checked: ${show}`);
        elements.portionDetailsDiv.style.display = show ? 'block' : 'none';
        elements.addressFieldDiv.style.display = show ? 'block' : 'none';
        console.log(`  [UI_LOG] portionDetailsDiv display set to: ${elements.portionDetailsDiv.style.display}`);
        console.log(`  [UI_LOG] addressFieldDiv display set to: ${elements.addressFieldDiv.style.display}`);
    }
}

function updatePaymentDetailsVisibility() {
    const elements = getFormElements();
    if (elements.paymentDoneYesRadio && elements.paymentDetailsDiv) {
        const show = elements.paymentDoneYesRadio.checked;
        console.log(`  [UI_LOG] updatePaymentDetailsVisibility: paymentDoneYes is checked: ${show}`);
        elements.paymentDetailsDiv.style.display = show ? 'block' : 'none';
        console.log(`  [UI_LOG] paymentDetailsDiv display set to: ${elements.paymentDetailsDiv.style.display}`);
    }
}

function updateBroughtByOtherVisibility() {
    const elements = getFormElements();
    if (elements.broughtByOtherYesRadio && elements.broughtByOtherNameDiv) {
        const show = elements.broughtByOtherYesRadio.checked;
        console.log(`  [UI_LOG] updateBroughtByOtherVisibility: broughtByOtherYes is checked: ${show}`);
        elements.broughtByOtherNameDiv.style.display = show ? 'block' : 'none';
        console.log(`  [UI_LOG] broughtByOtherNameDiv display set to: ${elements.broughtByOtherNameDiv.style.display}`);
    }
}

function updateAllConditionalFieldsVisibility() {
    console.log("[UI_LOG] updateAllConditionalFieldsVisibility called");
    updateWantsPortionVisibility();
    updatePaymentDetailsVisibility();
    updateBroughtByOtherVisibility();
}

// --- (دوال resetAdahiFormToEntryMode, populateAdahiFormForEdit, formatFirestoreTimestamp كما هي، مع التأكد من استخدام getFormElements()) ---
export function resetAdahiFormToEntryMode(setCurrentEditingDocIdCallback) {
    const elements = getFormElements();
    if (elements.adahiForm) { 
        if (elements.donorNameInput) elements.donorNameInput.value = '';
        // ... (بقية التعيينات كما في الرد السابق) ...
        if (elements.wantsPortionNoRadio) elements.wantsPortionNoRadio.checked = true; // تأكد من هذا
        if (elements.paymentDoneNoRadio) elements.paymentDoneNoRadio.checked = true;   // تأكد من هذا
        if (elements.broughtByOtherNoRadio) elements.broughtByOtherNoRadio.checked = true; // تأكد من هذا
    }
    if (setCurrentEditingDocIdCallback) setCurrentEditingDocIdCallback(null);
    if (elements.adahiFormSubmitButton) elements.adahiFormSubmitButton.textContent = 'تسجيل البيانات';
    updateAllConditionalFieldsVisibility();
    if (elements.statusMessageEl) { elements.statusMessageEl.textContent = ''; elements.statusMessageEl.className = '';}
}
// ... (populateAdahiFormForEdit بنفس طريقة استخدام elements)

export function formatFirestoreTimestamp(timestamp) { /* ... كما هي ... */ }

export function setupConditionalFieldListeners() {
    console.log("[UI_LOG] --- setupConditionalFieldListeners called from ui.js ---");
    const elements = getFormElements(); 

    if (elements.wantsPortionYesRadio && elements.wantsPortionNoRadio) {
        [elements.wantsPortionYesRadio, elements.wantsPortionNoRadio].forEach(radio => {
            if (radio) {
                radio.addEventListener('change', () => {
                    console.log(`[UI_LOG] EVENT: ${radio.id} CHANGED. Checked: ${radio.checked}`);
                    updateWantsPortionVisibility();
                });
            }
        });
    }

    if (elements.paymentDoneYesRadio && elements.paymentDoneNoRadio) {
        [elements.paymentDoneYesRadio, elements.paymentDoneNoRadio].forEach(radio => {
            if (radio) {
                radio.addEventListener('change', () => {
                    console.log(`[UI_LOG] EVENT: ${radio.id} CHANGED. Checked: ${radio.checked}`);
                    updatePaymentDetailsVisibility();
                });
            }
        });
    }

    if (elements.broughtByOtherYesRadio && elements.broughtByOtherNoRadio) {
        [elements.broughtByOtherYesRadio, elements.broughtByOtherNoRadio].forEach(radio => {
            if (radio) {
                radio.addEventListener('change', () => {
                    console.log(`[UI_LOG] EVENT: ${radio.id} CHANGED. Checked: ${radio.checked}`);
                    updateBroughtByOtherVisibility();
                });
            }
        });
    }
    
    console.log("[UI_LOG] Initial call to updateAllConditionalFieldsVisibility from setupConditionalFieldListeners in ui.js");
    updateAllConditionalFieldsVisibility(); 
}

// --- دوال تصدير العناصر لـ main.js ---
// (هذه الدوال يجب أن تكون موجودة إذا كان main.js يستدعيها)
// إذا كان main.js يستخدم cachedFormElements أو getFormElements، فلا حاجة لتصدير كل عنصر على حدة.
// الهيكل الحالي في main.js يستدعي uiGetters.getXxxElements()، لذا يجب أن تكون هذه الدوال مصدرة.
// يجب أن يكون ملف ui.js الذي أرسلته سابقًا (والذي يحتوي على دوال getXxxElements) هو الصحيح.
// سأفترض أنك تستخدم النسخة التي تحتوي على دوال getXxxElements.
export * from './ui_getters.js'; // إذا فصلت دوال getXxxElements في ملف آخر
// أو إذا كانت في نفس الملف:
// export { getLoginElements, getRegistrationElements, ...الخ };
// ولكن الرد السابق الذي أرسلته أنت لم يكن يحتوي على هذه الصادرات، بل تعريف مباشر للعناصر.
// هذا الكود يفترض أن العناصر معرفة مباشرة في بداية الملف كما في ردك الأخير.
// للتوضيح: إذا كان main.js يستخدم uiGetters.getLoginElements()، فإن ui.js يجب أن يصدر getLoginElements.
// إذا كان ui.js يعرف export const loginForm = ... ، فإن main.js يستخدم ui.loginForm.
// بناءً على آخر main.js أرسلته أنت، فإنه يستخدم uiGetters.getXxxElements()
// لذا يجب أن يكون ui.js مهيكلاً كما في الردود التي قدمتها سابقًا مع دوال getXxxElements مصدرة.
// سأفترض أنك ستستخدم النسخة الكاملة من ui.js التي أرسلتها لك في الرد الذي كان عنوانه:
// "تمام، أنا في انتظار محتوى ملف ui.js الذي ستقوم بإرساله الآن."
// حيث كانت دوال getXxxElements معرفة ومصدرة.
// إذا كنت تستخدم ui.js حيث يتم تعريف العناصر مباشرة (مثل export const wantsPortionYesRadio = ...)،
// فيجب تعديل `getFormElements` هنا لاستخدام هذه المتغيرات المصدرة مباشرة.
