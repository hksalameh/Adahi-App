export function showLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'block';
    
    // تعطيل أزرار التصدير أثناء التحميل
    const exportButtons = document.querySelectorAll('[id^="export"]');
    exportButtons.forEach(btn => {
        btn.innerHTML = '<div class="loader"></div> جاري المعالجة...';
        btn.disabled = true;
    });
}

export function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
    
    // إعادة تفعيل أزرار التصدير
    const exportButtons = document.querySelectorAll('[id^="export"]');
    exportButtons.forEach(btn => {
        btn.innerHTML = btn.id.includes('Separate') ? 
            'تصدير لكل مستخدم (ملفات منفصلة)' : 
            'تصدير كل البيانات';
        btn.disabled = false;
    });
}

// ... (جميع دوال الواجهة الأخرى مكتوبة بالكامل هنا) ...
