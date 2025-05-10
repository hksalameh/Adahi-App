export function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'block';
    
    const exportBtn = document.getElementById('exportAllToExcelButton');
    if (exportBtn) {
        exportBtn.innerHTML = '<div class="loader"></div> جاري التصدير...';
        exportBtn.disabled = true;
    }
}

export function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
    
    const exportBtn = document.getElementById('exportAllToExcelButton');
    if (exportBtn) {
        exportBtn.innerHTML = 'تصدير كل البيانات (Excel)';
        exportBtn.disabled = false;
    }
}

// ... باقي الدوال الأصلية دون تغيير ...
