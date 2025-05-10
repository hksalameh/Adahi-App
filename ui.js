// ui.js

// --- عناصر تسجيل الدخول ---
export const loginSection = document.getElementById('loginSection');
export const loginForm = document.getElementById('loginForm');
// هام: main.js يستخدم loginEmailInput, لذا نوجهه إلى usernameInput من HTML
export const loginEmailInput = document.getElementById('usernameInput'); 
export const loginPasswordInput = document.getElementById('passwordInput');
export const logoutButton = document.getElementById('logoutButton');
export const hrAfterLogout = document.getElementById('hrAfterLogout'); // الفاصل بعد زر الخروج

// --- رسائل الحالة ---
// authStatus مخصص لرسائل حالة المصادقة العامة (تسجيل دخول/خروج)
export const authStatusEl = document.getElementById('authStatus'); 
// statusMessage مخصص لرسائل العمليات (حفظ، خطأ، إلخ) داخل النماذج أو الجداول
export const statusMessageEl = document.getElementById('statusMessage'); 

// --- أقسام المحتوى الرئيسية ---
export const dataEntrySection = document.getElementById('dataEntrySection'); // يحتوي على نموذج إضافة الأضاحي
export const userDataViewSection = document.getElementById('userDataViewSection'); // يحتوي على جدول بيانات المستخدم
export const adminViewSection = document.getElementById('adminViewSection'); // قسم المسؤول

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
export const adminActionsDiv = document.getElementById('adminActions'); // حاوية أزرار الفلترة والتصدير
export const filterPendingButton = document.getElementById('filterPending');
export const filterEnteredButton = document.getElementById('filterEntered');
export const filterAllButton = document.getElementById('filterAll');
// أزرار التصدير يتم الحصول عليها مباشرة في main.js حاليًا، لكن يمكن إضافتها هنا إذا أردت
// export const exportAllToCsvButton = document.getElementById('exportAllToCsvButton');
// export const exportAllUsersSeparateCsvButton = document.getElementById('exportAllUsersSeparateCsvButton');

export const sacrificesTableContainer = document.getElementById('sacrificesTableContainer');
export const adminLoadingMessage = document.getElementById('loadingMessage'); // ID في HTML هو loadingMessage
export const sacrificesTable = document.getElementById('sacrificesTable');
export const sacrificesTableBody = document.getElementById('sacrificesTableBody');

// --- عناصر واجهة المستخدم للمستخدم العادي (داخل userDataViewSection) ---
export const userLoadingMessage = document.getElementById('userLoadingMessage');
export const userSacrificesTable = document.getElementById('userSacrificesTable');
export const userSacrificesTableBody = document.getElementById('userSacrificesTableBody');


// --- دوال مساعدة للواجهة (يمكن نقلها من main.js أو إعادة كتابتها هنا إذا كانت متعلقة بالـ DOM فقط) ---

// دالة لإعادة تعيين نموذج إضافة الأضاحي إلى وضع الإدخال
export function resetAdahiFormToEntryMode(setCurrentEditingDocIdCallback) {
    if (adahiForm) adahiForm.reset();
    if (setCurrentEditingDocIdCallback) setCurrentEditingDocIdCallback(null);
    if (adahiFormSubmitButton) adahiFormSubmitButton.textContent = 'تسجيل البيانات';
    
    // إخفاء الحقول التي تظهر شرطيًا بشكل افتراضي
    if (portionDetailsDiv) portionDetailsDiv.style.display = 'none';
    if (addressFieldDiv) addressFieldDiv.style.display = 'none';
    if (paymentDetailsDiv) paymentDetailsDiv.style.display = 'none';
    if (broughtByOtherNameDiv) broughtByOtherNameDiv.style.display = 'none';

    // التأكد من أن الاختيارات الافتراضية للراديو هي المحددة
    if (wantsToAttendNoRadio) wantsToAttendNoRadio.checked = true;
    if (wantsPortionNoRadio) wantsPortionNoRadio.checked = true;
    if (paymentDoneNoRadio) paymentDoneNoRadio.checked = true;
    if (broughtByOtherNoRadio) broughtByOtherNoRadio.checked = true;

    if (statusMessageEl) {
        statusMessageEl.textContent = '';
        statusMessageEl.className = '';
    }
}

// دالة لملء نموذج الأضاحي للتحرير
export function populateAdahiFormForEdit(docId, data, setCurrentEditingDocIdCallback) {
    if (!adahiForm) return;

    if (donorNameInput) donorNameInput.value = data.donorName || '';
    if (sacrificeForInput) sacrificeForInput.value = data.sacrificeFor || '';
    if (wantsToAttendYesRadio) wantsToAttendYesRadio.checked = data.wantsToAttend === true;
    if (wantsToAttendNoRadio) wantsToAttendNoRadio.checked = data.wantsToAttend === false || data.wantsToAttend === undefined;
    if (phoneNumberInput) phoneNumberInput.value = data.phoneNumber || '';
    if (wantsPortionYesRadio) wantsPortionYesRadio.checked = data.wantsPortion === true;
    if (wantsPortionNoRadio) wantsPortionNoRadio.checked = data.wantsPortion === false || data.wantsPortion === undefined;
    if (portionDetailsInput) portionDetailsInput.value = data.portionDetails || '';
    if (addressInput) addressInput.value = data.address || '';
    if (paymentDoneYesRadio) paymentDoneYesRadio.checked = data.paymentDone === true;
    if (paymentDoneNoRadio) paymentDoneNoRadio.checked = data.paymentDone === false || data.paymentDone === undefined;
    if (receiptBookNumberInput) receiptBookNumberInput.value = data.receiptBookNumber || '';
    if (receiptNumberInput) receiptNumberInput.value = data.receiptNumber || '';
    if (assistanceForSelect) assistanceForSelect.value = data.assistanceFor || 'inside_ramtha';
    if (broughtByOtherYesRadio) broughtByOtherYesRadio.checked = data.broughtByOther === true;
    if (broughtByOtherNoRadio) broughtByOtherNoRadio.checked = data.broughtByOther === false || data.broughtByOther === undefined;
    if (broughtByOtherNameInput) broughtByOtherNameInput.value = data.broughtByOtherName || '';

    // إظهار/إخفاء الحقول الشرطية بناءً على البيانات
    if (portionDetailsDiv) portionDetailsDiv.style.display = wantsPortionYesRadio.checked ? 'block' : 'none';
    if (addressFieldDiv) addressFieldDiv.style.display = wantsPortionYesRadio.checked ? 'block' : 'none';
    if (paymentDetailsDiv) paymentDetailsDiv.style.display = paymentDoneYesRadio.checked ? 'block' : 'none';
    if (broughtByOtherNameDiv) broughtByOtherNameDiv.style.display = broughtByOtherYesRadio.checked ? 'block' : 'none';

    if (setCurrentEditingDocIdCallback) setCurrentEditingDocIdCallback(docId);
    if (adahiFormSubmitButton) adahiFormSubmitButton.textContent = 'تحديث البيانات';
    if (statusMessageEl) {
        statusMessageEl.textContent = `وضع التعديل للسجل: ${docId}`;
        statusMessageEl.className = '';
    }
    window.scrollTo({ top: adahiForm.offsetTop - 20, behavior: 'smooth' }); // للانتقال إلى النموذج
}

// دالة تنسيق الوقت (إذا لم تكن موجودة في main.js بالفعل)
export function formatFirestoreTimestamp(timestamp) {
    if (!timestamp || !timestamp.seconds) return 'غير متوفر';
    const date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
    return date.toLocaleString('ar-EG', {
        year: 'numeric', month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
    });
}

// مستمعو الأحداث لإظهار/إخفاء الحقول الشرطية في نموذج الإضافة
// يجب التأكد من أن هذه العناصر موجودة قبل إضافة المستمعين
if (wantsPortionYesRadio && wantsPortionNoRadio && portionDetailsDiv && addressFieldDiv) {
    [wantsPortionYesRadio, wantsPortionNoRadio].forEach(radio => {
        radio.addEventListener('change', () => {
            const displayValue = wantsPortionYesRadio.checked ? 'block' : 'none';
            portionDetailsDiv.style.display = displayValue;
            addressFieldDiv.style.display = displayValue;
        });
    });
}

if (paymentDoneYesRadio && paymentDoneNoRadio && paymentDetailsDiv) {
    [paymentDoneYesRadio, paymentDoneNoRadio].forEach(radio => {
        radio.addEventListener('change', () => {
            paymentDetailsDiv.style.display = paymentDoneYesRadio.checked ? 'block' : 'none';
        });
    });
}

if (broughtByOtherYesRadio && broughtByOtherNoRadio && broughtByOtherNameDiv) {
    [broughtByOtherYesRadio, broughtByOtherNoRadio].forEach(radio => {
        radio.addEventListener('change', () => {
            broughtByOtherNameDiv.style.display = broughtByOtherYesRadio.checked ? 'block' : 'none';
        });
    });
}

// التهيئة الأولية عند تحميل الصفحة لإخفاء الحقول الشرطية
document.addEventListener('DOMContentLoaded', () => {
    if (portionDetailsDiv) portionDetailsDiv.style.display = 'none';
    if (addressFieldDiv) addressFieldDiv.style.display = 'none';
    if (paymentDetailsDiv) paymentDetailsDiv.style.display = 'none';
    if (broughtByOtherNameDiv) broughtByOtherNameDiv.style.display = 'none';
});
