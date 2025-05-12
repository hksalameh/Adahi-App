// ui.js

// --- Cache for form elements ---
let formElementsCache = null;

// --- Getters for different UI sections ---

export function getLoginElements() {
    return {
        loginSection: document.getElementById('loginSection'),
        loginTitle: document.getElementById('loginTitle'), // Added
        loginForm: document.getElementById('loginForm'),
        loginEmailInput: document.getElementById('loginEmail'), // Needs to exist in HTML
        loginPasswordInput: document.getElementById('loginPassword'), // Needs to exist in HTML
        rememberMeCheckbox: document.getElementById('rememberMe')
    };
}

export function getRegistrationElements() {
    return {
        registrationSection: document.getElementById('registrationSection'), // Needs to exist in HTML
        registrationTitle: document.getElementById('registrationTitle'), // Needs to exist in HTML
        registrationForm: document.getElementById('registrationForm'),
        regDisplayNameInput: document.getElementById('regDisplayNameInput'), // Needs to exist in HTML
        regEmailInput: document.getElementById('regEmailInput'), // Needs to exist in HTML
        regPasswordInput: document.getElementById('regPasswordInput'), // Needs to exist in HTML
        regConfirmPasswordInput: document.getElementById('regConfirmPasswordInput') // Needs to exist in HTML
    };
}

export function getToggleLinkElements() {
    return {
        formToggleLinksDiv: document.getElementById('formToggleLinks'), // Needs parent div in HTML
        switchToRegisterLink: document.getElementById('switchToRegisterLink'), // Needs to exist in HTML
        switchToLoginLink: document.getElementById('switchToLoginLink') // Needs to exist in HTML
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
        formTitle: document.getElementById('dataEntryTitle'), // Added for Edit/Add mode
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
        broughtByOtherYesRadio: document.getElementById('broughtByOtherYes'), // Added ID in HTML needed
        broughtByOtherNoRadio: document.getElementById('broughtByOtherNo'), // Added ID in HTML needed
        broughtByOtherNameDiv: document.getElementById('broughtByOtherNameDiv'),
        broughtByOtherNameInput: document.getElementById('broughtByOtherName'),
        adahiFormSubmitButton: form ? form.querySelector('button[type="submit"]') : null,
        adahiFormCancelButton: document.getElementById('adahiFormCancelButton'), // Added for cancelling edit
        statusMessageEl: document.getElementById('statusMessage')
    };
}

export function getAdminViewElements() {
    return {
        adminViewSection: document.getElementById('adminViewSection'),
        adminActionsDiv: document.getElementById('adminActions'),
        // Updated filter button IDs to match main.js logic
        filterPendingButton: document.getElementById('filterPending'), // Was filterPendingApproval
        filterEnteredButton: document.getElementById('filterEntered'), // Was filterApproved
        // filterRejectedButton: document.getElementById('filterRejected'), // Removed as main.js uses entered/pending
        filterAllButton: document.getElementById('filterAll'),
        exportButtonsDiv: document.getElementById('exportButtons'), // Added container
        exportAllToExcelButton: document.getElementById('exportAllToExcelButton'),
        exportAllUsersSeparateExcelButton: document.getElementById('exportAllUsersSeparateExcelButton'),
        exportAllToPdfButton: document.getElementById('exportAllToPdfButton'),
        exportAllUsersSeparatePdfButton: document.getElementById('exportAllUsersSeparatePdfButton'),
        // Added Summary elements
        sacrificesSummaryDiv: document.getElementById('sacrificesSummary'),
        summaryGazaEl: document.getElementById('summaryGaza'),
        summarySolidarityEl: document.getElementById('summarySolidarity'), // Added for future use
        summaryRamthaEl: document.getElementById('summaryRamtha'),
        summaryHimselfEl: document.getElementById('summaryHimself'),
        summaryTotalEl: document.getElementById('summaryTotal'),
        hrAfterSummary: document.getElementById('hrAfterSummary'),
        sacrificesTableContainer: document.getElementById('sacrificesTableContainer'),
        adminLoadingMessage: document.getElementById('adminLoadingMessage'), // Needs to exist in HTML
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

/**
 * Caches the form elements for quicker access. Call this once on DOMContentLoaded.
 * @param {object} elements - The object returned by getDataEntryFormElements.
 */
export function cacheFormElements(elements) {
    if (!elements || !elements.adahiForm) {
        console.error("[UI] Attempted to cache invalid form elements.");
        return;
    }
    formElementsCache = elements;
    // console.log("[UI] Form elements cached.");
}

/**
 * Gets the cached form elements.
 * @returns {object} The cached form elements object.
 */
function getFormElements() {
    if (!formElementsCache) {
        console.warn("[UI] Form elements cache was not ready. Fetching directly. Ensure cacheFormElements() is called on DOM ready.");
        formElementsCache = getDataEntryFormElements();
    }
    return formElementsCache;
}

// --- Conditional Field Visibility Logic ---

function updateWantsPortionVisibility() {
    const elements = getFormElements();
    if (elements?.wantsPortionYesRadio && elements.portionDetailsDiv && elements.addressFieldDiv) {
        const show = elements.wantsPortionYesRadio.checked;
        elements.portionDetailsDiv.style.display = show ? 'block' : 'none';
        elements.addressFieldDiv.style.display = show ? 'block' : 'none';
        // console.log(`[UI] Portion fields visibility updated: ${show ? 'visible' : 'hidden'}`);
    } else {
         // console.warn("[UI] Wants Portion elements not found for visibility update.");
    }
}

function updatePaymentDetailsVisibility() {
    const elements = getFormElements();
    if (elements?.paymentDoneYesRadio && elements.paymentDetailsDiv) {
        const show = elements.paymentDoneYesRadio.checked;
        elements.paymentDetailsDiv.style.display = show ? 'block' : 'none';
        // console.log(`[UI] Payment fields visibility updated: ${show ? 'visible' : 'hidden'}`);
    } else {
         // console.warn("[UI] Payment Details elements not found for visibility update.");
    }
}

function updateBroughtByOtherVisibility() {
    const elements = getFormElements();
    if (elements?.broughtByOtherYesRadio && elements.broughtByOtherNameDiv) {
        const show = elements.broughtByOtherYesRadio.checked;
        elements.broughtByOtherNameDiv.style.display = show ? 'block' : 'none';
        // console.log(`[UI] Brought By Other fields visibility updated: ${show ? 'visible' : 'hidden'}`);
    } else {
         // console.warn("[UI] Brought By Other elements not found for visibility update.");
    }
}

function updateAllConditionalFieldsVisibility() {
    // console.log("[UI] Updating all conditional field visibilities...");
    updateWantsPortionVisibility();
    updatePaymentDetailsVisibility();
    updateBroughtByOtherVisibility();
}

// --- Form State Management ---

/**
 * Resets the Adahi form to its default state for entering new data.
 * @param {function} setCurrentEditingDocIdCallback - Callback to set the current editing ID to null.
 */
export function resetAdahiFormToEntryMode(setCurrentEditingDocIdCallback) {
    const elements = getFormElements();
    if (!elements?.adahiForm) {
         console.error("[UI] Adahi form not found for reset.");
         return;
    }

    // console.log("[UI] Resetting Adahi form to entry mode.");
    elements.adahiForm.reset(); // More reliable way to reset form fields

    // Ensure radio defaults are set correctly after reset if needed
    if (elements.wantsToAttendNoRadio) elements.wantsToAttendNoRadio.checked = true;
    if (elements.wantsPortionNoRadio) elements.wantsPortionNoRadio.checked = true;
    if (elements.paymentDoneNoRadio) elements.paymentDoneNoRadio.checked = true;
    if (elements.broughtByOtherNoRadio) elements.broughtByOtherNoRadio.checked = true;
    if (elements.assistanceForSelect) elements.assistanceForSelect.value = 'inside_ramtha'; // Default selection

    if (setCurrentEditingDocIdCallback) {
        setCurrentEditingDocIdCallback(null);
    }

    if (elements.adahiFormSubmitButton) {
        elements.adahiFormSubmitButton.textContent = 'تسجيل البيانات';
        elements.adahiFormSubmitButton.style.backgroundColor = ''; // Reset to default color
    }
    if (elements.adahiFormCancelButton) {
         elements.adahiFormCancelButton.classList.add('hidden-field'); // Hide cancel button
    }
     if (elements.formTitle) {
        elements.formTitle.textContent = 'تسجيل أضحية/تبرع جديد';
    }


    updateAllConditionalFieldsVisibility(); // Ensure dependent fields are hidden correctly

    if (elements.statusMessageEl) {
        elements.statusMessageEl.textContent = '';
        elements.statusMessageEl.className = '';
    }
}

/**
 * Populates the Adahi form with data for editing an existing record.
 * @param {string} docId - The ID of the document being edited.
 * @param {object} data - The data object for the sacrifice record.
 * @param {function} setCurrentEditingDocIdCallback - Callback to set the current editing ID.
 */
export function populateAdahiFormForEdit(docId, data, setCurrentEditingDocIdCallback) {
    const elements = getFormElements();
    if (!elements?.adahiForm) {
        console.error("[UI] Adahi form not found for population.");
        return;
    }
    // console.log(`[UI] Populating Adahi form for edit, Doc ID: ${docId}`);

    // Set text/select values
    if (elements.donorNameInput) elements.donorNameInput.value = data.donorName || '';
    if (elements.sacrificeForInput) elements.sacrificeForInput.value = data.sacrificeFor || '';
    if (elements.phoneNumberInput) elements.phoneNumberInput.value = data.phoneNumber || '';
    if (elements.portionDetailsInput) elements.portionDetailsInput.value = data.portionDetails || '';
    if (elements.addressInput) elements.addressInput.value = data.address || '';
    if (elements.receiptBookNumberInput) elements.receiptBookNumberInput.value = data.receiptBookNumber || '';
    if (elements.receiptNumberInput) elements.receiptNumberInput.value = data.receiptNumber || '';
    if (elements.assistanceForSelect) elements.assistanceForSelect.value = data.assistanceFor || 'inside_ramtha';
    if (elements.broughtByOtherNameInput) elements.broughtByOtherNameInput.value = data.broughtByOtherName || '';

    // Set radio button states
    if (elements.wantsToAttendYesRadio) elements.wantsToAttendYesRadio.checked = data.wantsToAttend === true;
    if (elements.wantsToAttendNoRadio) elements.wantsToAttendNoRadio.checked = data.wantsToAttend !== true; // Check no if not explicitly yes

    if (elements.wantsPortionYesRadio) elements.wantsPortionYesRadio.checked = data.wantsPortion === true;
    if (elements.wantsPortionNoRadio) elements.wantsPortionNoRadio.checked = data.wantsPortion !== true;

    if (elements.paymentDoneYesRadio) elements.paymentDoneYesRadio.checked = data.paymentDone === true;
    if (elements.paymentDoneNoRadio) elements.paymentDoneNoRadio.checked = data.paymentDone !== true;

    if (elements.broughtByOtherYesRadio) elements.broughtByOtherYesRadio.checked = data.broughtByOther === true;
    if (elements.broughtByOtherNoRadio) elements.broughtByOtherNoRadio.checked = data.broughtByOther !== true;


    updateAllConditionalFieldsVisibility(); // Update visibility based on populated radio buttons

    if (setCurrentEditingDocIdCallback) {
        setCurrentEditingDocIdCallback(docId);
    }

    // Update button text and style for edit mode
    if (elements.adahiFormSubmitButton) {
        elements.adahiFormSubmitButton.textContent = 'تحديث البيانات';
        elements.adahiFormSubmitButton.style.backgroundColor = '#e67e22'; // Orange color for update
    }
     if (elements.adahiFormCancelButton) {
         elements.adahiFormCancelButton.classList.remove('hidden-field'); // Show cancel button
    }
     if (elements.formTitle) {
        elements.formTitle.textContent = `تعديل بيانات: ${data.donorName || 'سجل غير مسمى'}`;
    }


    // Update status message and scroll into view
    if (elements.statusMessageEl) {
        elements.statusMessageEl.textContent = `وضع التعديل. قم بالتغييرات المطلوبة ثم اضغط "تحديث البيانات". اضغط "إلغاء" للتراجع.`;
        elements.statusMessageEl.className = 'info'; // Use an info class for styling
    }

    // Scroll form into view for better UX
    if (elements.adahiForm?.scrollIntoView) {
        elements.adahiForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
        // Fallback for older browsers
        window.scrollTo(0, elements.adahiForm.offsetTop - 20);
    }
}


// --- Utility Functions ---

/**
 * Formats a Firestore Timestamp object into a readable Arabic date and time string.
 * @param {Timestamp} timestamp - The Firestore Timestamp object.
 * @returns {string} A formatted date/time string, or an empty string if input is invalid.
 */
export function formatFirestoreTimestamp(timestamp) {
    // Check if timestamp is valid and has seconds property
    if (!timestamp || typeof timestamp.seconds !== 'number') {
        // console.warn("[UI] Invalid timestamp passed to formatFirestoreTimestamp:", timestamp);
        return '';
    }
    try {
        // Convert seconds and nanoseconds (if available) to milliseconds
        const milliseconds = timestamp.seconds * 1000 + (timestamp.nanoseconds ? timestamp.nanoseconds / 1000000 : 0);
        const date = new Date(milliseconds);

        // Check if the date is valid after conversion
        if (isNaN(date.getTime())) {
             // console.warn("[UI] Timestamp resulted in invalid date:", timestamp);
             return 'تاريخ غير صالح';
        }

        // Format using toLocaleString with Arabic locale and options
        return date.toLocaleString('ar-SA', {
            year: 'numeric', month: 'short', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true
        });
    } catch (e) {
        console.error("[UI] Error formatting timestamp:", e, "Timestamp:", timestamp);
        // Fallback to a simpler format if locale formatting fails
        try {
             const date = new Date(timestamp.seconds * 1000);
             return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
        } catch (fallbackError) {
             return 'خطأ في التنسيق';
        }
    }
}

/**
 * Sets up event listeners for conditional fields within the Adahi form.
 * Call this once on DOMContentLoaded after caching form elements.
 */
export function setupConditionalFieldListeners() {
    const elements = getFormElements();
    if (!elements?.adahiForm) {
         console.error("[UI] Cannot setup conditional listeners: Adahi form not found.");
         return;
    }
    // console.log("[UI] Setting up conditional field listeners...");

    // Wants Portion listeners
    if (elements.wantsPortionYesRadio && elements.wantsPortionNoRadio) {
        elements.wantsPortionYesRadio.addEventListener('change', updateWantsPortionVisibility);
        elements.wantsPortionNoRadio.addEventListener('change', updateWantsPortionVisibility);
    } else {
         // console.warn("[UI] Wants Portion radio buttons not found for listener setup.");
    }

    // Payment Done listeners
    if (elements.paymentDoneYesRadio && elements.paymentDoneNoRadio) {
        elements.paymentDoneYesRadio.addEventListener('change', updatePaymentDetailsVisibility);
        elements.paymentDoneNoRadio.addEventListener('change', updatePaymentDetailsVisibility);
    } else {
        // console.warn("[UI] Payment Done radio buttons not found for listener setup.");
    }

    // Brought By Other listeners
    if (elements.broughtByOtherYesRadio && elements.broughtByOtherNoRadio) {
        elements.broughtByOtherYesRadio.addEventListener('change', updateBroughtByOtherVisibility);
        elements.broughtByOtherNoRadio.addEventListener('change', updateBroughtByOtherVisibility);
    } else {
        // console.warn("[UI] Brought By Other radio buttons not found for listener setup.");
    }

    // Initial check in case the page loads with radios pre-checked (e.g., during edit)
    // console.log("[UI] Performing initial check of conditional field visibility.");
    updateAllConditionalFieldsVisibility();
}
