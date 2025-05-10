// ui.js

// --- عناصر الواجهة الرئيسية ---
export const loginSection = document.getElementById('loginSection');
export const dataEntrySection = document.getElementById('dataEntrySection');
export const adminViewSection = document.getElementById('adminViewSection');
export const userDataViewSection = document.getElementById('userDataViewSection');
export const logoutButton = document.getElementById('logoutButton');
export const hrAfterLogout = document.getElementById('hrAfterLogout');
export const authStatusEl = document.getElementById('authStatus'); // تم تغيير الاسم لتجنب التعارض
export const statusMessageEl = document.getElementById('statusMessage'); // تم تغيير الاسم

// --- عناصر نموذج الإضافة/التعديل ---
export const adahiForm = document.getElementById('adahiForm');
export const dataEntrySectionH2 = dataEntrySection.querySelector('h2');
export const adahiFormSubmitButton = adahiForm.querySelector('button[type="submit"]');
export const portionDetailsDiv = document.getElementById('portionDetailsDiv');
export const addressFieldDiv = document.getElementById('addressFieldDiv');
export const paymentDetailsDiv = document.getElementById('paymentDetailsDiv');
export const broughtByOtherNameDiv = document.getElementById('broughtByOtherNameDiv');
export const donorNameInput = document.getElementById('donorName');
export const sacrificeForInput = document.getElementById('sacrificeFor');
export const wantsToAttendYesRadio = document.getElementById('wantsToAttendYes');
export const wantsToAttendNoRadio = document.getElementById('wantsToAttendNo');
export const phoneNumberInput = document.getElementById('phoneNumber');
export const wantsPortionYesRadio = document.getElementById('wantsPortionYes');
export const wantsPortionNoRadio = document.getElementById('wantsPortionNo');
export const portionDetailsInput = document.getElementById('portionDetails');
export const addressInput = document.getElementById('address');
export const paymentDoneYesRadio = document.getElementById('paymentDoneYes');
export const paymentDoneNoRadio = document.getElementById('paymentDoneNo');
export const receiptBookNumberInput = document.getElementById('receiptBookNumber');
export const receiptNumberInput = document.getElementById('receiptNumber');
export const assistanceForSelect = document.getElementById('assistanceFor');
export const broughtByOtherYesRadio = document.getElementById('broughtByOtherYes');
export const broughtByOtherNoRadio = document.getElementById('broughtByOtherNo');
export const broughtByOtherNameInput = document.getElementById('broughtByOtherName');


// --- عناصر جدول المسؤول ---
export const sacrificesTableBody = document.getElementById('sacrificesTableBody');
export const adminLoadingMessage = document.getElementById('loadingMessage'); // تم تغيير الاسم

// --- عناصر جدول المستخدم ---
export const userSacrificesTableBody = document.getElementById('userSacrificesTableBody');
export const userLoadingMessage = document.getElementById('userLoadingMessage');


// --- دوال تحديث الواجهة ---
export function showLoginView() {
    loginSection.style.display = 'block';
    dataEntrySection.style.display = 'none';
    adminViewSection.style.display = 'none';
    userDataViewSection.style.display = 'none';
    logoutButton.style.display = 'none';
    hrAfterLogout.style.display = 'none';
    authStatusEl.textContent = 'يرجى تسجيل الدخول للوصول.';
    authStatusEl.className = '';
    if (sacrificesTableBody) sacrificesTableBody.innerHTML = '';
    if (userSacrificesTableBody) userSacrificesTableBody.innerHTML = '';
}

export function showAuthenticatedView(isAdmin) {
    authStatusEl.textContent = `مرحباً بك`; // رسالة ترحيب موحدة
    authStatusEl.className = 'success';
    loginSection.style.display = 'none';
    logoutButton.style.display = 'inline-block';
    hrAfterLogout.style.display = 'block';
    dataEntrySection.style.display = 'block';
    resetAdahiFormToEntryMode(); // التأكد من أن النموذج في وضع الإضافة

    if (isAdmin) {
        adminViewSection.style.display = 'block';
        userDataViewSection.style.display = 'none';
    } else {
        adminViewSection.style.display = 'none';
        userDataViewSection.style.display = 'block';
    }
}

export function resetAdahiFormToEntryMode(editingDocIdState) {
    adahiForm.reset();
    if (editingDocIdState) editingDocIdState.current = null; // إذا تم تمرير كائن لتخزين الحالة
    dataEntrySectionH2.textContent = 'تسجيل أضحية/تبرع جديد';
    adahiFormSubmitButton.textContent = 'تسجيل البيانات';
    adahiFormSubmitButton.style.backgroundColor = '#27ae60';
    portionDetailsDiv.style.display = 'none'; addressFieldDiv.style.display = 'none';
    paymentDetailsDiv.style.display = 'none'; broughtByOtherNameDiv.style.display = 'none';
    wantsToAttendNoRadio.checked = true;
    wantsPortionNoRadio.checked = true;
    paymentDoneNoRadio.checked = true;
    broughtByOtherNoRadio.checked = true;
    const cancelButton = adahiForm.querySelector('#cancelEditButton');
    if (cancelButton) { cancelButton.style.display = 'none'; }
}

export function populateAdahiFormForEdit(docId, data, editingDocIdState) {
    if (editingDocIdState) editingDocIdState.current = docId;
    dataEntrySectionH2.textContent = 'تعديل بيانات الأضحية';
    adahiFormSubmitButton.textContent = 'حفظ التعديلات';
    adahiFormSubmitButton.style.backgroundColor = '#f39c12';

    donorNameInput.value = data.donorName || '';
    sacrificeForInput.value = data.sacrificeFor || '';
    data.wantsToAttend ? wantsToAttendYesRadio.checked = true : wantsToAttendNoRadio.checked = true;
    phoneNumberInput.value = data.phoneNumber || '';

    data.wantsPortion ? wantsPortionYesRadio.checked = true : wantsPortionNoRadio.checked = true;
    wantsPortionYesRadio.dispatchEvent(new Event('change')); // لتحديث واجهة المستخدم
    if (data.wantsPortion) { portionDetailsInput.value = data.portionDetails || ''; addressInput.value = data.address || '';}

    data.paymentDone ? paymentDoneYesRadio.checked = true : paymentDoneNoRadio.checked = true;
    paymentDoneYesRadio.dispatchEvent(new Event('change'));
    if (data.paymentDone) { receiptBookNumberInput.value = data.receiptBookNumber || ''; receiptNumberInput.value = data.receiptNumber || '';}
    
    assistanceForSelect.value = data.assistanceFor || 'inside_ramtha';

    data.broughtByOther ? broughtByOtherYesRadio.checked = true : broughtByOtherNoRadio.checked = true;
    broughtByOtherYesRadio.dispatchEvent(new Event('change'));
    if (data.broughtByOther) { broughtByOtherNameInput.value = data.broughtByOtherName || '';}

    let cancelButton = adahiForm.querySelector('#cancelEditButton');
    if (!cancelButton) {
        cancelButton = document.createElement('button'); cancelButton.type = 'button'; cancelButton.id = 'cancelEditButton';
        cancelButton.textContent = 'إلغاء التعديل'; cancelButton.style.backgroundColor = '#e74c3c'; cancelButton.style.marginRight = '10px';
        cancelButton.onclick = () => resetAdahiFormToEntryMode(editingDocIdState);
        adahiFormSubmitButton.parentNode.insertBefore(cancelButton, adahiFormSubmitButton);
    }
    cancelButton.style.display = 'inline-block';
    dataEntrySection.scrollIntoView({ behavior: 'smooth' });
    statusMessageEl.textContent = `جاري تعديل: ${data.donorName || 'سجل'}. مرجع: ${docId}`;
    statusMessageEl.className = '';
}

export function formatFirestoreTimestamp(timestamp) {
    if (!timestamp || !timestamp.toDate) { return 'غير متوفر'; }
    const date = timestamp.toDate();
    return date.toLocaleString('ar-EG', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ... (سيتم إضافة دوال عرض الجداول هنا لاحقًا، أو يمكن تركها في main.js إذا كانت تعتمد بشكل كبير على دوال Firestore)
