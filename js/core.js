function formatWeekLabel(raw) {
    try {
        if (!raw) return '';
        const s = String(raw);
        const parts = s.split('-');
        if (parts.length >= 2) {
            const startStr = parts[0].trim();
            const endStr = parts[1].trim();
            const d1 = new Date(startStr);
            const d2 = new Date(endStr);
            if (!isNaN(d1) && !isNaN(d2)) {
                const sameMonth = d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
                if (sameMonth) {
                    const day1 = d1.toLocaleDateString('tr-TR', { day: '2-digit' });
                    const day2 = d2.toLocaleDateString('tr-TR', { day: '2-digit' });
                    const monthYear = d1.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
                    return `${day1} - ${day2} ${monthYear}`;
                } else {
                    const full1 = d1.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
                    const full2 = d2.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
                    return `${full1} - ${full2}`;
                }
            }
        }
    } catch (e) { }
    return raw || '';
}

function formatShiftDate(d) {
    try {
        const dt = new Date(d);
        if (!isNaN(dt)) {
            return dt.toLocaleDateString('tr-TR', { weekday: 'short', day: '2-digit', month: '2-digit' });
        }
    } catch (e) { }
    return d;
}

function showGlobalError(message) {
    try { console.warn("[Pusula]", message); } catch (e) { }
    try {
        const role = localStorage.getItem("sSportRole") || "";
        if (role === "admin" || role === "locadmin") {
            Swal.fire({ toast: true, position: 'bottom-end', icon: 'warning', title: String(message || 'Uyarı'), showConfirmButton: false, timer: 2500 });
        }
    } catch (e) { }
}

async function apiCall(action, payload = {}) {
    const username = (typeof currentUser !== "undefined" && currentUser) ? currentUser : (localStorage.getItem("sSportUser") || "");
    const token = (typeof getToken === "function" ? getToken() : localStorage.getItem("sSportToken")) || "";
    const ip = (typeof globalUserIP !== "undefined" ? globalUserIP : "") || "";

    const res = await fetch(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action, username, token, ip, ...payload })
    });
    const json = await res.json();
    if (json.result !== "success") throw new Error(json.message || json.error || "API error");
    return json;
}

if (typeof Swal === "undefined") {
    window.Swal = {
        fire: (a, b, c) => { try { alert((a && a.title) || a || b || c || ""); } catch (e) { } },
    };
}

function normalizeRole(v) {
    return String(v || '').trim().toLowerCase();
}

function normalizeGroup(v) {
    if (!v) return "";
    let s = String(v).trim().toLowerCase()
        .replace(/i̇/g, 'i').replace(/ı/g, 'i')
        .replace(/ş/g, 's').replace(/ğ/g, 'g')
        .replace(/ü/g, 'u').replace(/ö/g, 'o')
        .replace(/ç/g, 'c');
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function normalizeList(v) {
    if (!v) return [];
    return String(v).split(',').map(s => s.trim()).filter(Boolean);
}

function getToken() { return localStorage.getItem("sSportToken"); }

function formatDateToDDMMYYYY(dateString) {
    if (!dateString) return 'N/A';
    if (dateString.match(/^\d{2}\.\d{2}\.\d{4}/)) { return dateString.split(' ')[0]; }
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) { return dateString; }
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    } catch (e) { return dateString; }
}

function processImageUrl(url) {
    if (!url) return '';
    try {
        let id = '';
        const m = url.match(/\/d\/([-\w]+)/) || url.match(/id=([-\w]+)/);
        if (m && m[1]) id = m[1];
        if (id && url.includes('drive.google.com')) {
            return 'https://drive.google.com/thumbnail?id=' + id + '&sz=w1000';
        }
    } catch (e) { }
    return url;
}

function parseDateTRToTS(s) {
    try {
        if (!s) return 0;
        const clean = String(s).split(' ')[0];
        if (clean.includes('.')) {
            const parts = clean.split('.');
            if (parts.length >= 3) {
                const dd = parseInt(parts[0], 10);
                const mm = parseInt(parts[1], 10);
                const yy = parseInt(parts[2], 10);
                const d = new Date(yy, mm - 1, dd);
                return d.getTime() || 0;
            }
        }
        const d = new Date(s);
        return d.getTime() || 0;
    } catch (e) { return 0; }
}

function isNew(dateStr) {
    if (!dateStr) return false;
    let date;
    if (dateStr.indexOf('.') > -1) {
        const cleanDate = dateStr.split(' ')[0];
        const parts = cleanDate.split('.');
        date = new Date(parts[2], parts[1] - 1, parts[0]);
    } else {
        date = new Date(dateStr);
    }
    if (isNaN(date.getTime())) return false;
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
}

function getCategorySelectHtml(currentCategory, id) {
    let options = VALID_CATEGORIES.map(cat => `<option value="${cat}" ${cat === currentCategory ? 'selected' : ''}>${cat}</option>`).join('');
    if (currentCategory && !VALID_CATEGORIES.includes(currentCategory)) {
        options = `<option value="${currentCategory}" selected>${currentCategory} (Hata)</option>` + options;
    }
    return `<select id="${id}" class="swal2-input" style="width:100%; margin-top:5px;">${options}</select>`;
}

function escapeForJsString(text) {
    if (!text) return "";
    return text.toString().replace(/\\/g, '\\\\').replace(/'/g, '\\\'').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '');
}

function copyScriptContent(encodedText) {
    const text = decodeURIComponent(encodedText);
    copyText(text);
}

function copyText(t) {
    const textarea = document.createElement('textarea');
    textarea.value = t.replace(/\\n/g, '\n');
    document.body.appendChild(textarea);
    textarea.select();
    try {
        document.execCommand('copy');
        Swal.fire({ icon: 'success', title: 'Kopyalandı', toast: true, position: 'top-end', showConfirmButton: false, timer: 1500 });
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Kopyalanamadı', text: 'Lütfen manuel kopyalayın.', toast: true, position: 'top-end', showConfirmButton: false, timer: 2500 });
    }
    document.body.removeChild(textarea);
}

function escapeHtml(str) {
    return String(str ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function dlog(...args) {
    try { if (DEBUG) console.log(...args); } catch (e) { }
}

function safeLocalStorageSet(key, value, maxBytes = 4 * 1024 * 1024) {
    try {
        const str = JSON.stringify(value);
        if (str.length * 2 > maxBytes) {
            try { Swal.fire('Uyarı', 'Veri çok büyük, kaydedilemedi', 'warning'); } catch (e) { }
            return false;
        }
        localStorage.setItem(key, str);
        return true;
    } catch (e) {
        if (e && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
            try { Swal.fire('Hata', 'Depolama alanı dolu', 'error'); } catch (x) { }
        } else {
            dlog('[safeLocalStorageSet]', e);
        }
        return false;
    }
}

function safeLocalStorageGet(key, fallback = null) {
    try {
        const raw = localStorage.getItem(key);
        if (raw == null) return fallback;
        return JSON.parse(raw);
    } catch (e) {
        return fallback;
    }
}

const storage = {
    set: (k, v) => safeLocalStorageSet(k, v),
    get: (k, fb = null) => safeLocalStorageGet(k, fb),
    del: (k) => { try { localStorage.removeItem(k); } catch (e) { } }
};

window.addEventListener('error', function (e) {
    try { if (typeof isAdminMode !== "undefined" && (isAdminMode || isLocAdmin)) dlog('[Global Error]', e && (e.error || e.message) ? (e.error || e.message) : e); } catch (_) { }
    try { if (typeof showGlobalError === 'function') showGlobalError('Beklenmeyen hata: ' + (e && e.message ? e.message : 'Bilinmeyen')); } catch (_) { }
});

window.addEventListener('unhandledrejection', function (e) {
    try { if (typeof isAdminMode !== "undefined" && (isAdminMode || isLocAdmin)) dlog('[Unhandled Promise]', e && e.reason ? e.reason : e); } catch (_) { }
    try { if (typeof showGlobalError === 'function') showGlobalError('Beklenmeyen hata: ' + (e && e.reason && e.reason.message ? e.reason.message : 'Bilinmeyen')); } catch (_) { }
});
