// main.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-app.js";
import { firebaseConfig, ADMIN_UID } from './config.js';
import { auth, onAuthStateChanged, loginUser, handleSignOut } from './auth.js';
import * as fsService from './firestoreService.js';
import * as ui from './ui.js'; // يفترض أن ui.js يحتوي على العناصر المحدثة
import { getFirestore, collection, query, orderBy, where, getDocs, serverTimestamp, onSnapshot } from "https://www.gstatic.com/firebasejs/11.7.1/firebase-firestore.js";

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let unsubscribeAdminSacrifices = null;
let unsubscribeUserSacrifices = null;
let currentEditingDocId = null;

function setCurrentEditingDocId(id) {
    currentEditingDocId = id;
}

// التحقق من وجود عناصر UI أساسية عند بدء التشغيل
if (!ui.loginForm) console.warn("ui.loginForm (نموذج تسجيل الدخول) لم يتم العثور عليه.");
if (!ui.loginEmailInput) console.warn("ui.loginEmailInput (حقل البريد/اسم المستخدم) لم يتم العثور عليه.");
if (!ui.loginPasswordInput) console.warn("ui.loginPasswordInput (حقل كلمة المرور) لم يتم العثور عليه.");
if (!ui.logoutButton) console.warn("ui.logoutButton لم يتم العثور عليه.");
if (!ui.authStatusEl) console.warn("ui.authStatusEl (عنصر حالة المصادقة) لم يتم العثور عليه.");
if (!ui.statusMessageEl) console.warn("ui.statusMessageEl (عنصر رسائل العمليات) لم يتم العثور عليه.");
if (!ui.loginSection) console.warn("ui.loginSection لم يتم العثور عليه.");
if (!ui.dataEntrySection) console.warn("ui.dataEntrySection (نموذج الإضافة) لم يتم العثور عليه.");
if (!ui.adminViewSection) console.warn("ui.adminViewSection لم يتم العثور عليه.");
if (!ui.userDataViewSection) console.warn("ui.userDataViewSection لم يتم العثور عليه.");
if (!ui.hrAfterLogout) console.warn("ui.hrAfterLogout لم يتم العثور عليه.");


// --- معالج نموذج تسجيل الدخول ---
if (ui.loginForm && ui.loginEmailInput && ui.loginPasswordInput) {
    ui.loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const email = ui.loginEmailInput.value;
        const password = ui.loginPasswordInput.value;
        
        if (!email || !password) {
            if (ui.authStatusEl) {
                ui.authStatusEl.textContent = 'الرجاء إدخال اسم المستخدم وكلمة المرور.';
                ui.authStatusEl.className = 'error';
            }
            return;
        }

        if (ui.authStatusEl) {
            ui.authStatusEl.textContent = 'جاري تسجيل الدخول...';
            ui.authStatusEl.className = '';
        }

        try {
            await loginUser(email, password);
            // onAuthStateChanged سيقوم بتحديث الواجهة تلقائياً
            if (ui.loginForm) ui.loginForm.reset();
        } catch (error) {
            console.error('Login error:', error);
            let errorMessage = 'فشل تسجيل الدخول. ';
            if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
                errorMessage += 'اسم المستخدم أو كلمة المرور غير صحيحة.';
            } else if (error.code === 'auth/invalid-email') {
                errorMessage += 'صيغة اسم المستخدم (البريد الإلكتروني) غير صحيحة.';
            } else {
                errorMessage += error.message;
            }
            if (ui.authStatusEl) {
                ui.authStatusEl.textContent = errorMessage;
                ui.authStatusEl.className = 'error';
            }
        }
    });
}

// --- معالج تسجيل الخروج ---
if (ui.logoutButton) {
    ui.logoutButton.addEventListener('click', async () => {
        if (ui.authStatusEl) {
            ui.authStatusEl.textContent = 'جاري تسجيل الخروج...';
            ui.authStatusEl.className = '';
        }
        try {
            await handleSignOut();
            // onAuthStateChanged سيقوم بتحديث الواجهة تلقائياً
            if (ui.authStatusEl) {
                ui.authStatusEl.textContent = 'تم تسجيل الخروج بنجاح.';
                ui.authStatusEl.className = 'success';
            }
            setTimeout(() => {
                 if (ui.authStatusEl && ui.authStatusEl.textContent === 'تم تسجيل الخروج بنجاح.') {
                    ui.authStatusEl.textContent = 'يرجى تسجيل الدخول للمتابعة.';
                    ui.authStatusEl.className = '';
                 }
            }, 3000);
        } catch (error) {
            console.error('Logout error:', error);
            if (ui.authStatusEl) {
                ui.authStatusEl.textContent = 'خطأ في تسجيل الخروج: ' + error.message;
                ui.authStatusEl.className = 'error';
            }
        }
    });
}

// --- مراقبة حالة المصادقة وتحديث الواجهة ---
onAuthStateChanged(auth, (user) => {
    // إخفاء كل شيء مبدئياً ثم إظهار ما هو مطلوب
    if (ui.loginSection) ui.loginSection.style.display = 'none';
    if (ui.dataEntrySection) ui.dataEntrySection.style.display = 'none'; // قسم إضافة البيانات العام
    if (ui.adminViewSection) ui.adminViewSection.style.display = 'none';
    if (ui.userDataViewSection) ui.userDataViewSection.style.display = 'none';
    if (ui.logoutButton) ui.logoutButton.style.display = 'none';
    if (ui.hrAfterLogout) ui.hrAfterLogout.style.display = 'none';
    if (ui.adminActionsDiv && ui.adminActionsDiv.querySelector('#exportAllToCsvButton')) { //أزرار التصدير داخل adminActions
        ui.adminActionsDiv.querySelector('#exportAllToCsvButton').style.display = 'none';
        ui.adminActionsDiv.querySelector('#exportAllUsersSeparateCsvButton').style.display = 'none';
    }


    if (user) {
        // المستخدم مسجل دخوله
        console.log("User is signed in:", user.uid, user.email);
        if (ui.authStatusEl) {
            ui.authStatusEl.textContent = `مرحباً بك ${user.displayName || user.email}!`;
            ui.authStatusEl.className = 'success';
        }
        
        if (ui.logoutButton) ui.logoutButton.style.display = 'inline-block';
        if (ui.hrAfterLogout) ui.hrAfterLogout.style.display = 'block';
        if (ui.dataEntrySection) ui.dataEntrySection.style.display = 'block'; // نموذج الإضافة دائمًا ظاهر للمسجلين

        if (user.uid === ADMIN_UID) {
            // واجهة المسؤول
            console.log("Admin user detected.");
            if (ui.adminViewSection) ui.adminViewSection.style.display = 'block';
            fetchAndRenderSacrificesForAdmin();
            if (ui.adminActionsDiv && ui.adminActionsDiv.querySelector('#exportAllToCsvButton')) {
                ui.adminActionsDiv.querySelector('#exportAllToCsvButton').style.display = 'inline-block';
                ui.adminActionsDiv.querySelector('#exportAllUsersSeparateCsvButton').style.display = 'inline-block';
            }
        } else {
            // واجهة المستخدم العادي
            console.log("Regular user detected.");
            if (ui.userDataViewSection) ui.userDataViewSection.style.display = 'block';
            fetchAndRenderSacrificesForUserUI(user.uid);
        }
        if (ui.adahiForm) ui.resetAdahiFormToEntryMode(setCurrentEditingDocId);

    } else {
        // المستخدم قام بتسجيل الخروج أو لم يسجل دخوله بعد
        console.log("User is signed out.");
        if (ui.loginSection) ui.loginSection.style.display = 'block';
        
        if (ui.sacrificesTableBody) ui.sacrificesTableBody.innerHTML = '';
        if (ui.userSacrificesTableBody) ui.userSacrificesTableBody.innerHTML = '';

        if (ui.authStatusEl && (ui.authStatusEl.textContent.includes('مرحباً بك') || ui.authStatusEl.textContent === 'تم تسجيل الخروج بنجاح.' || ui.authStatusEl.textContent === 'جاري التحميل...')) {
             ui.authStatusEl.textContent = 'يرجى تسجيل الدخول للمتابعة.';
             ui.authStatusEl.className = '';
        }
        if (ui.statusMessageEl) { // مسح رسالة العمليات أيضاً
            ui.statusMessageEl.textContent = '';
            ui.statusMessageEl.className = '';
        }


        if (unsubscribeAdminSacrifices) {
            unsubscribeAdminSacrifices();
            unsubscribeAdminSacrifices = null;
        }
        if (unsubscribeUserSacrifices) {
            unsubscribeUserSacrifices();
            unsubscribeUserSacrifices = null;
        }
        currentEditingDocId = null;
    }
});


// --- معالجة نموذج إضافة/تعديل الأضاحي ---
if (ui.adahiForm) {
    ui.adahiForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const currentUser = auth.currentUser;
        if (!currentUser) { 
            if(ui.statusMessageEl) {ui.statusMessageEl.textContent = 'يجب تسجيل الدخول أولاً لإضافة أو تعديل البيانات.'; ui.statusMessageEl.className = 'error';}
            return; 
        }

        const adahiDataToSave = {
            donorName: ui.donorNameInput.value, 
            sacrificeFor: ui.sacrificeForInput.value,
            wantsToAttend: ui.wantsToAttendYesRadio.checked, 
            phoneNumber: ui.phoneNumberInput.value,
            wantsPortion: ui.wantsPortionYesRadio.checked,
            portionDetails: ui.wantsPortionYesRadio.checked ? ui.portionDetailsInput.value : '',
            address: ui.wantsPortionYesRadio.checked ? ui.addressInput.value : '',
            paymentDone: ui.paymentDoneYesRadio.checked,
            receiptBookNumber: ui.paymentDoneYesRadio.checked ? ui.receiptBookNumberInput.value : '',
            receiptNumber: ui.paymentDoneYesRadio.checked ? ui.receiptNumberInput.value : '',
            assistanceFor: ui.assistanceForSelect.value,
            broughtByOther: ui.broughtByOtherYesRadio.checked,
            broughtByOtherName: ui.broughtByOtherYesRadio.checked ? ui.broughtByOtherNameInput.value : '',
        };

        let editorIdentifier = currentUser.displayName || currentUser.email;

        if (currentEditingDocId) { // وضع التعديل
            if(ui.statusMessageEl) {ui.statusMessageEl.textContent = 'جاري تحديث البيانات...'; ui.statusMessageEl.className = '';}
            try {
                await fsService.updateSacrifice(currentEditingDocId, adahiDataToSave, editorIdentifier);
                if(ui.statusMessageEl) {ui.statusMessageEl.textContent = 'تم تحديث البيانات بنجاح!'; ui.statusMessageEl.className = 'success';}
                ui.resetAdahiFormToEntryMode(setCurrentEditingDocId);
            } catch (e) { 
                console.error("Update error:", e);
                if(ui.statusMessageEl) {ui.statusMessageEl.textContent = 'خطأ في تحديث البيانات: ' + e.message; ui.statusMessageEl.className = 'error';}
            }
        } else { // وضع الإضافة
            if(ui.statusMessageEl) {ui.statusMessageEl.textContent = 'جاري حفظ البيانات...'; ui.statusMessageEl.className = '';}
            adahiDataToSave.userId = currentUser.uid;
            adahiDataToSave.status = 'pending_entry';
            adahiDataToSave.createdAt = serverTimestamp();
            adahiDataToSave.enteredBy = editorIdentifier;

            try {
                const docRefDb = await fsService.addSacrifice(adahiDataToSave);
                if(ui.statusMessageEl) {ui.statusMessageEl.textContent = 'تم حفظ البيانات بنجاح! رقم المرجع: ' + docRefDb.id; ui.statusMessageEl.className = 'success';}
                ui.resetAdahiFormToEntryMode(setCurrentEditingDocId);
            } catch (e) { 
                console.error("Add error:", e);
                if(ui.statusMessageEl) {ui.statusMessageEl.textContent = 'خطأ في حفظ البيانات: ' + e.message; ui.statusMessageEl.className = 'error';}
            }
        }
    });
} else {
    console.warn("ui.adahiForm (نموذج إضافة الأضاحي) لم يتم العثور عليه.");
}

// --- دوال العرض والتحديث للجداول ---
function renderSacrificesForAdminUI(docsSnapshot) {
    if (!ui.sacrificesTableBody) { console.warn("sacrificesTableBody not found for admin."); return; }
    ui.sacrificesTableBody.innerHTML = '';
    if (docsSnapshot.empty) {
        if (ui.adminLoadingMessage) {
            ui.adminLoadingMessage.textContent = 'لا توجد بيانات لعرضها حاليًا.';
            ui.adminLoadingMessage.style.display = 'block';
        }
        ui.sacrificesTableBody.innerHTML = '<tr><td colspan="17">لا توجد بيانات.</td></tr>';
        return;
    }
    if (ui.adminLoadingMessage) ui.adminLoadingMessage.style.display = 'none';
    let counter = 1;
    docsSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const row = ui.sacrificesTableBody.insertRow();
        row.insertCell().textContent = counter++;
        row.insertCell().textContent = data.donorName || '';
        row.insertCell().textContent = data.sacrificeFor || '';
        row.insertCell().textContent = data.wantsToAttend ? 'نعم' : 'لا';
        row.insertCell().textContent = data.phoneNumber || 'لا يوجد';
        row.insertCell().textContent = data.wantsPortion ? 'نعم' : 'لا';
        row.insertCell().textContent = data.portionDetails || (data.wantsPortion ? 'غير محدد' : 'لا ينطبق');
        row.insertCell().textContent = data.address || (data.wantsPortion ? 'غير محدد' : 'لا ينطبق');
        row.insertCell().textContent = data.paymentDone ? 'نعم' : 'لا';
        row.insertCell().textContent = data.receiptBookNumber || (data.paymentDone ? 'غير محدد' : 'لا ينطبق');
        row.insertCell().textContent = data.receiptNumber || (data.paymentDone ? 'غير محدد' : 'لا ينطبق');
        let assistanceForText = data.assistanceFor || '';
        if (data.assistanceFor === 'inside_ramtha') assistanceForText = 'داخل الرمثا';
        else if (data.assistanceFor === 'gaza_people') assistanceForText = 'لأهل غزة';
        else if (data.assistanceFor === 'for_himself') assistanceForText = 'لنفسه';
        row.insertCell().textContent = assistanceForText;
        row.insertCell().textContent = data.broughtByOther ? 'نعم' : 'لا';
        row.insertCell().textContent = data.broughtByOtherName || (data.broughtByOther ? 'غير محدد' : 'لا ينطبق');
        row.insertCell().textContent = data.createdAt ? ui.formatFirestoreTimestamp(data.createdAt) : 'غير متوفر';
        let statusText = data.status || '';
        if (data.status === 'pending_entry') statusText = 'لم تدخل بعد';
        else if (data.status === 'entered') statusText = 'تم الإدخال';
        row.insertCell().textContent = statusText;
        
        const actionsCell = row.insertCell();
        actionsCell.style.whiteSpace = 'nowrap'; // لمنع التفاف الأزرار
        const adminIdentifier = auth.currentUser ? (auth.currentUser.displayName || auth.currentUser.email) : 'مسؤول النظام';

        if (data.status === 'pending_entry') {
            const confirmButton = document.createElement('button');
            confirmButton.textContent = 'تأكيد'; // اختصار النص
            confirmButton.className = 'action-button confirm'; // استخدام كلاس للستايل إذا وجد
            confirmButton.title = 'تأكيد الإدخال';
            confirmButton.onclick = async () => {
                if (confirm("هل أنت متأكد من تأكيد هذا الإدخال؟")) {
                    try {
                        await fsService.updateSacrifice(docSnapshot.id, { status: 'entered' }, adminIdentifier);
                    } catch (e) { alert('خطأ في تأكيد الإدخال: ' + e.message); }
                }
            };
            actionsCell.appendChild(confirmButton);
        } else if (data.status === 'entered') {
            const revertButton = document.createElement('button');
            revertButton.textContent = "إعادة"; // اختصار النص
            revertButton.className = 'action-button revert';
            revertButton.title = "إعادة لـ 'لم تدخل بعد'";
            revertButton.onclick = async () => {
                 if (confirm("هل أنت متأكد من إعادة هذا الإدخال إلى 'لم تدخل بعد'؟")) {
                    try {
                        await fsService.updateSacrifice(docSnapshot.id, { status: 'pending_entry' }, adminIdentifier);
                    } catch (e) { alert('خطأ في إعادة الإدخال: ' + e.message); }
                }
            };
            actionsCell.appendChild(revertButton);
        }

        const editButton = document.createElement('button');
        editButton.textContent = 'تعديل';
        editButton.className = 'action-button edit';
        editButton.onclick = () => ui.populateAdahiFormForEdit(docSnapshot.id, data, setCurrentEditingDocId);
        actionsCell.appendChild(editButton);

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'حذف';
        deleteButton.className = 'action-button delete delete-btn'; // delete-btn من CSS
        deleteButton.onclick = async () => {
            if (confirm(`هل أنت متأكد من حذف أضحية المتبرع "${data.donorName || 'غير مسمى'}"؟ هذا الإجراء لا يمكن التراجع عنه.`)) {
                try {
                    await fsService.deleteSacrifice(docSnapshot.id);
                } catch (e) { alert('خطأ في الحذف: ' + e.message); }
            }
        };
        actionsCell.appendChild(deleteButton);
    });
}

function renderSacrificesForUserUI(docsSnapshot) {
    if (!ui.userSacrificesTableBody) { console.warn("userSacrificesTableBody not found for user."); return; }
    ui.userSacrificesTableBody.innerHTML = '';

    if (docsSnapshot.empty) {
        if (ui.userLoadingMessage) {
            ui.userLoadingMessage.textContent = 'لم تقم بتسجيل أي أضاحي بعد.';
            ui.userLoadingMessage.style.display = 'block';
        }
        // لاحظ أن عدد الأعمدة في index.html لجدول المستخدم هو 7
        ui.userSacrificesTableBody.innerHTML = '<tr><td colspan="7">لا توجد أضاحي مسجلة باسمك.</td></tr>';
        return;
    }
    if (ui.userLoadingMessage) ui.userLoadingMessage.style.display = 'none';

    let counter = 1;
    docsSnapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const row = ui.userSacrificesTableBody.insertRow();
        row.insertCell().textContent = counter++;
        row.insertCell().textContent = data.donorName || '';
        row.insertCell().textContent = data.sacrificeFor || '';
        row.insertCell().textContent = data.broughtByOther ? 'نعم' : 'لا'; // تم التعديل ليطابق رؤوس الجدول في HTML
        row.insertCell().textContent = data.broughtByOtherName || (data.broughtByOther ? 'غير محدد' : 'لا ينطبق'); // تم التعديل
        row.insertCell().textContent = data.createdAt ? ui.formatFirestoreTimestamp(data.createdAt) : '';
        let statusText = data.status;
        if (data.status === 'pending_entry') statusText = 'قيد المراجعة';
        else if (data.status === 'entered') statusText = 'مؤكد';
        row.insertCell().textContent = statusText;
    });
}

async function fetchAndRenderSacrificesForAdmin(filterStatus = 'all') {
    if (!auth.currentUser || auth.currentUser.uid !== ADMIN_UID) return;
    if (ui.adminLoadingMessage) {
        ui.adminLoadingMessage.style.display = 'block';
        ui.adminLoadingMessage.textContent = 'جاري تحميل بيانات المسؤول...';
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
        if (ui.adminLoadingMessage && !querySnapshot.empty) {
            ui.adminLoadingMessage.style.display = 'none';
        } else if (querySnapshot.empty && ui.adminLoadingMessage) {
            ui.adminLoadingMessage.textContent = 'لا توجد بيانات تطابق الفلتر الحالي.';
            ui.adminLoadingMessage.style.display = 'block';
        }
    }, (error) => {
        console.error("Error fetching admin sacrifices with onSnapshot: ", error);
        if (ui.adminLoadingMessage) ui.adminLoadingMessage.textContent = 'خطأ في تحميل بيانات المسؤول: ' + error.message;
        if (ui.sacrificesTableBody) ui.sacrificesTableBody.innerHTML = `<tr><td colspan="17">خطأ في تحميل البيانات.</td></tr>`;
    });
}

async function fetchAndRenderSacrificesForUserUI(userId) {
    if (!userId) return;
    if (ui.userLoadingMessage) {
        ui.userLoadingMessage.style.display = 'block';
        ui.userLoadingMessage.textContent = 'جاري تحميل أضاحيك المسجلة...';
    }

    if (unsubscribeUserSacrifices) unsubscribeUserSacrifices();

    const sacrificesCol = collection(db, "sacrifices");
    const q = query(sacrificesCol, where("userId", "==", userId), orderBy("createdAt", "desc"));

    unsubscribeUserSacrifices = onSnapshot(q, (querySnapshot) => {
        renderSacrificesForUserUI(querySnapshot);
         if (ui.userLoadingMessage && !querySnapshot.empty) {
            ui.userLoadingMessage.style.display = 'none';
        } else if (querySnapshot.empty && ui.userLoadingMessage) {
            ui.userLoadingMessage.textContent = 'لم تقم بتسجيل أي أضاحي بعد.';
            ui.userLoadingMessage.style.display = 'block';
        }
    }, (error) => {
        console.error("Error fetching user sacrifices with onSnapshot: ", error);
        if (ui.userLoadingMessage) ui.userLoadingMessage.textContent = 'خطأ في تحميل الأضاحي: ' + error.message;
        if (ui.userSacrificesTableBody) ui.userSacrificesTableBody.innerHTML = `<tr><td colspan="7">خطأ في تحميل البيانات.</td></tr>`;
    });
}

// --- مستمعو أحداث فلاتر المسؤول ---
if (ui.filterAllButton) {
    ui.filterAllButton.addEventListener('click', () => fetchAndRenderSacrificesForAdmin('all'));
} else { console.warn("ui.filterAllButton not found.");}
if (ui.filterPendingButton) {
    ui.filterPendingButton.addEventListener('click', () => fetchAndRenderSacrificesForAdmin('pending_entry'));
} else { console.warn("ui.filterPendingButton not found.");}
if (ui.filterEnteredButton) {
    ui.filterEnteredButton.addEventListener('click', () => fetchAndRenderSacrificesForAdmin('entered'));
} else { console.warn("ui.filterEnteredButton not found.");}


// --- CSV Export Functions and Listeners ---
function downloadCSV(csvContent, filename) {
    const blob = new Blob(["\uFEFF"+csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url); link.setAttribute("download", filename);
        link.style.visibility = 'hidden'; document.body.appendChild(link);
        link.click(); document.body.removeChild(link); URL.revokeObjectURL(url);
    }
}

function convertToCSV(dataArray, headerKeys, displayHeaders) {
    const array = [displayHeaders.join(',')].concat(
        dataArray.map(obj => headerKeys.map(key => {
            let cell = obj[key] === null || obj[key] === undefined ? '' : obj[key];
            if (typeof cell === 'boolean') { cell = cell ? 'نعم' : 'لا'; }
            else if (key === 'status') {
                if (obj[key] === 'pending_entry') cell = 'لم تدخل بعد';
                else if (obj[key] === 'entered') cell = 'تم الإدخال';
            } else if (key === 'assistanceFor') {
                if (obj[key] === 'inside_ramtha') cell = 'داخل الرمثا';
                else if (obj[key] === 'gaza_people') cell = 'لأهل غزة';
                else if (obj[key] === 'for_himself') cell = 'لنفسه';
            }
            if (typeof cell === 'string' && cell.includes(',')) { cell = `"${cell.replace(/"/g, '""')}"`; }
            return cell;
        }).join(','))
    );
    return array.join('\r\n');
}

// أزرار التصدير موجودة داخل adminActionsDiv
const exportAllToCsvButtonEl = ui.adminActionsDiv ? ui.adminActionsDiv.querySelector('#exportAllToCsvButton') : null;
if (exportAllToCsvButtonEl) {
    exportAllToCsvButtonEl.addEventListener('click', async () => {
        if (ui.authStatusEl) {ui.authStatusEl.textContent = "جاري تجهيز البيانات للتصدير..."; ui.authStatusEl.className = '';}
        try {
            const q = query(collection(db, "sacrifices"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            if (querySnapshot.empty) { 
                if (ui.authStatusEl) {ui.authStatusEl.textContent = "لا توجد بيانات للتصدير."; ui.authStatusEl.className = 'error';}
                return; 
            }
            const allData = [];
            querySnapshot.forEach(doc => {
                const data = doc.data();
                allData.push({
                    docId: doc.id, donorName: data.donorName, sacrificeFor: data.sacrificeFor,
                    wantsToAttend: data.wantsToAttend, phoneNumber: data.phoneNumber, wantsPortion: data.wantsPortion,
                    portionDetails: data.portionDetails, address: data.address, paymentDone: data.paymentDone,
                    receiptBookNumber: data.receiptBookNumber, receiptNumber: data.receiptNumber,
                    assistanceFor: data.assistanceFor, broughtByOther: data.broughtByOther,
                    broughtByOtherName: data.broughtByOtherName,
                    createdAt: data.createdAt ? ui.formatFirestoreTimestamp(data.createdAt) : '',
                    status: data.status, userId: data.userId,
                    enteredBy: data.enteredBy || '',
                    lastEditedBy: data.lastEditedBy || ''
                });
            });
            const headerKeys = ["docId", "donorName", "sacrificeFor", "wantsToAttend", "phoneNumber", "wantsPortion", "portionDetails", "address", "paymentDone", "receiptBookNumber", "receiptNumber", "assistanceFor", "broughtByOther", "broughtByOtherName", "createdAt", "status", "userId", "enteredBy", "lastEditedBy"];
            const displayHeaders = ["م.السجل", "المتبرع", "الأضحية عن", "حضور؟", "هاتف", "جزء؟", "تفاصيل الجزء", "العنوان", "مدفوع؟", "ر.الدفتر", "ر.السند", "المساعدة لـ", "بوسيط؟", "اسم الوسيط", "ت.التسجيل", "الحالة", "م.المستخدم", "أدخل بواسطة", "آخر تعديل"];
            const csvContent = convertToCSV(allData, headerKeys, displayHeaders);
            downloadCSV(csvContent, 'كل_بيانات_الاضاحي.csv');
            if (ui.authStatusEl) {ui.authStatusEl.textContent = "تم التصدير بنجاح."; ui.authStatusEl.className = 'success';}
        } catch (error) { 
            console.error("Error exporting all data: ", error); 
            if (ui.authStatusEl) {ui.authStatusEl.textContent = "خطأ في التصدير: " + error.message; ui.authStatusEl.className = 'error';}
        }
    });
} else { console.warn("exportAllToCsvButtonEl not found.");}

const exportAllUsersSeparateCsvButtonEl = ui.adminActionsDiv ? ui.adminActionsDiv.querySelector('#exportAllUsersSeparateCsvButton') : null;
if (exportAllUsersSeparateCsvButtonEl) {
    exportAllUsersSeparateCsvButtonEl.addEventListener('click', async () => {
        if (ui.authStatusEl) {ui.authStatusEl.textContent = "جاري تجهيز بيانات كل مستخدم..."; ui.authStatusEl.className = '';}
        try {
            const allSacrificesSnapshot = await fsService.getAllSacrificesForExport();
            if (allSacrificesSnapshot.empty) { 
                if (ui.authStatusEl) {ui.authStatusEl.textContent = "لا توجد بيانات لتصديرها."; ui.authStatusEl.className = 'error';}
                return; 
            }
            
            const dataByUser = {};
            allSacrificesSnapshot.forEach(doc => {
                const data = doc.data();
                const userIdKey = data.userId || 'unknown_user'; // التعامل مع السجلات التي قد لا تحتوي على userId
                const userName = data.enteredBy || userIdKey; // استخدام اسم المدخل أو معرف المستخدم
                
                if (!dataByUser[userIdKey]) { 
                    dataByUser[userIdKey] = { name: userName, entries: [] };
                }
                dataByUser[userIdKey].entries.push({
                    docId: doc.id, donorName: data.donorName, sacrificeFor: data.sacrificeFor,
                    wantsToAttend: data.wantsToAttend, phoneNumber: data.phoneNumber, wantsPortion: data.wantsPortion,
                    portionDetails: data.portionDetails, address: data.address, paymentDone: data.paymentDone,
                    receiptBookNumber: data.receiptBookNumber, receiptNumber: data.receiptNumber,
                    assistanceFor: data.assistanceFor, broughtByOther: data.broughtByOther,
                    broughtByOtherName: data.broughtByOtherName,
                    createdAt: data.createdAt ? ui.formatFirestoreTimestamp(data.createdAt) : '', status: data.status,
                    enteredBy: data.enteredBy || '', 
                    lastEditedBy: data.lastEditedBy || ''
                });
            });

            if (Object.keys(dataByUser).length === 0) { 
                if (ui.authStatusEl) {ui.authStatusEl.textContent = "لم يتم العثور على بيانات مجمعة حسب المستخدمين."; ui.authStatusEl.className = 'error';}
                return; 
            }
            
            const headerKeys = ["docId", "donorName", "sacrificeFor", "wantsToAttend", "phoneNumber", "wantsPortion", "portionDetails", "address", "paymentDone", "receiptBookNumber", "receiptNumber", "assistanceFor", "broughtByOther", "broughtByOtherName", "createdAt", "status", "enteredBy", "lastEditedBy"];
            const displayHeaders = ["م.السجل", "المتبرع", "الأضحية عن", "حضور؟", "هاتف", "جزء؟", "تفاصيل الجزء", "العنوان", "مدفوع؟", "ر.الدفتر", "ر.السند", "المساعدة لـ", "بوسيط؟", "اسم الوسيط", "ت.التسجيل", "الحالة", "أدخل بواسطة", "آخر تعديل"];
            
            let exportedCount = 0;
            const totalUsers = Object.keys(dataByUser).length;
            if (ui.authStatusEl) {ui.authStatusEl.textContent = `بدء تصدير ${totalUsers} ملف...`;}

            for (const userIdKey in dataByUser) {
                if (dataByUser.hasOwnProperty(userIdKey)) {
                    const userNameForFile = String(dataByUser[userIdKey].name).replace(/[^\p{L}\p{N}_-]/gu, '_'); // تنظيف اسم المستخدم للملف، مع دعم الحروف العالمية والأرقام
                    const userDataEntries = dataByUser[userIdKey].entries;
                    const csvContent = convertToCSV(userDataEntries, headerKeys, displayHeaders);
                    await new Promise(resolve => setTimeout(resolve, 250)); // تأخير بسيط
                    downloadCSV(csvContent, `بيانات_مدخل_${userNameForFile}.csv`);
                    exportedCount++;
                    if (ui.authStatusEl) {ui.authStatusEl.textContent = `تم تصدير ${exportedCount} من ${totalUsers} ملف...`;}
                }
            }
            if (ui.authStatusEl) {ui.authStatusEl.textContent = `تم تصدير بيانات ${exportedCount} مدخل بنجاح في ملفات منفصلة.`; ui.authStatusEl.className = 'success';}
        } catch (error) {
            console.error("Error exporting all users separate data: ", error);
            let errMessage = "خطأ أثناء تصدير بيانات المستخدمين: " + error.message;
            if (error.code === 'failed-precondition' && error.message.includes('index')) {
                 errMessage = "خطأ: يتطلب هذا التصدير فهرسًا مركبًا في Firebase. يرجى مراجعة إعدادات الفهرسة.";
            }
            if (ui.authStatusEl) {
                ui.authStatusEl.textContent = errMessage;
                ui.authStatusEl.className = 'error';
            }
        }
    });
} else { console.warn("exportAllUsersSeparateCsvButtonEl not found.");}

// --- مستمع تحميل المحتوى ---
document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM fully loaded and parsed. main.js is active.");
    if (ui.authStatusEl) {
        ui.authStatusEl.textContent = 'جاري التحميل...'; // يتم تحديثها بواسطة onAuthStateChanged
        ui.authStatusEl.className = '';
    }
    // يتم التحكم في إظهار/إخفاء الأقسام الآن بشكل كامل بواسطة onAuthStateChanged
});
