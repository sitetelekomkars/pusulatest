function updateGlobalAuthFlags() {
    activeRole = getMyRole();
    isLocAdmin = (activeRole === 'locadmin');
    isAdminMode = hasPermission('canEdit') || isLocAdmin;
}

function hasPermission(permKey) {
    try {
        const perms = JSON.parse(localStorage.getItem("sSportPerms") || "{}");
        return !!perms[permKey];
    } catch (e) { return false; }
}

function getMyRole() { return localStorage.getItem("sSportRole") || ""; }
function getMyGroup() { return localStorage.getItem("sSportGroup") || ""; }

function checkSession() {
    const savedUser = localStorage.getItem("sSportUser");
    const savedToken = localStorage.getItem("sSportToken");
    const savedRole = localStorage.getItem("sSportRole");
    const savedGroup = localStorage.getItem("sSportGroup");

    const todayKey = new Date().toISOString().slice(0, 10);
    const sessionDay = localStorage.getItem("sSportSessionDay") || "";
    const loginAt = parseInt(localStorage.getItem("sSportLoginAt") || "0", 10);
    const maxAgeMs = 12 * 60 * 60 * 1000;

    if (savedUser && savedToken) {
        const isOtherDay = (!sessionDay || sessionDay !== todayKey);
        const isTooOld = (!loginAt || (Date.now() - loginAt) > maxAgeMs);

        if (isOtherDay || isTooOld) {
            try { logout(); } catch (e) {
                localStorage.removeItem("sSportUser");
                localStorage.removeItem("sSportToken");
                localStorage.removeItem("sSportRole");
                localStorage.removeItem("sSportGroup");
                localStorage.removeItem("sSportSessionDay");
                localStorage.removeItem("sSportLoginAt");
            }
            return;
        }

        currentUser = savedUser;
        document.getElementById("login-screen").style.display = "none";
        document.getElementById("user-display").innerText = currentUser;
        setHomeWelcomeUser(currentUser);

        checkAdmin(savedRole);

        if (localStorage.getItem("sSportForceChange") === "true") {
            changePasswordPopup(true);
            return;
        }

        try {
            if (savedGroup) {
                const el = document.getElementById("t-side-role"); if (el) el.textContent = savedGroup;
                const el2 = document.getElementById("tech-side-role"); if (el2) el2.textContent = savedGroup;
            }
        } catch (e) { }

        startSessionTimer();

        try { loadHomeBlocks(); } catch (e) { }
        try { loadPermissionsOnStartup(); } catch (e) { }
        if (BAKIM_MODU) {
            document.getElementById("maintenance-screen").style.display = "flex";
        } else {
            document.getElementById("main-app").style.display = "block";
            loadContentData();
            loadWizardData();
            loadTechWizardData();
        }
    }
}

function enterBas(e) { if (e.key === "Enter") girisYap(); }

async function girisYap() {
    const uName = document.getElementById("usernameInput").value.trim();
    const uPass = document.getElementById("passInput").value.trim();
    const loadingMsg = document.getElementById("loading-msg");
    const errorMsg = document.getElementById("error-msg");
    if (!uName || !uPass) { errorMsg.innerText = "Lütfen bilgileri giriniz."; errorMsg.style.display = "block"; return; }

    loadingMsg.style.display = "block";
    loadingMsg.innerText = "Doğrulanıyor...";
    errorMsg.style.display = "none";
    document.querySelector('.login-btn').disabled = true;

    if (!globalUserIP) {
        try {
            const ipResponse = await fetch('https://ipapi.co/json/');
            const ipData = await ipResponse.json();
            globalUserIP = `${ipData.ip} [${ipData.city || '-'}, ${ipData.region || '-'}]`;
        } catch (e) {
            globalUserIP = "";
        }
    }

    const hashedPass = CryptoJS.SHA256(uPass).toString();
    fetch(SCRIPT_URL, {
        method: 'POST',
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({ action: "login", username: uName, password: hashedPass, ip: globalUserIP || "" })
    }).then(response => response.json())
        .then(data => {
            loadingMsg.style.display = "none";
            document.querySelector('.login-btn').disabled = false;

            if (data.result === "success") {
                currentUser = data.username;
                localStorage.setItem("sSportUser", currentUser);
                localStorage.setItem("sSportToken", data.token);
                localStorage.setItem("sSportRole", data.role);
                if (data.group) localStorage.setItem("sSportGroup", data.group);
                localStorage.setItem("sSportSessionDay", new Date().toISOString().slice(0, 10));
                localStorage.setItem("sSportLoginAt", String(Date.now()));

                if (data.permissions) {
                    localStorage.setItem("sSportPerms", JSON.stringify(data.permissions));
                } else {
                    localStorage.setItem("sSportPerms", "{}");
                }
                updateGlobalAuthFlags();

                if (data.forceChange === true) {
                    localStorage.setItem("sSportForceChange", "true");
                    Swal.fire({
                        icon: 'warning', title: ' ⚠️  Güvenlik Uyarısı',
                        text: 'İlk girişiniz. Lütfen şifrenizi değiştirin.',
                        allowOutsideClick: false, allowEscapeKey: false, confirmButtonText: 'Şifremi Değiştir'
                    }).then(() => { changePasswordPopup(true); });
                } else {
                    localStorage.removeItem("sSportForceChange");
                    document.getElementById("login-screen").style.display = "none";
                    document.getElementById("user-display").innerText = currentUser;
                    setHomeWelcomeUser(currentUser);
                    checkAdmin(data.role);
                    startSessionTimer();

                    if (BAKIM_MODU) {
                        document.getElementById("maintenance-screen").style.display = "flex";
                    } else {
                        document.getElementById("main-app").style.display = "block";
                        loadPermissionsOnStartup().then(() => {
                            loadHomeBlocks();
                            loadContentData();
                            loadWizardData();
                            loadTechWizardData();
                        });
                    }
                }
            } else {
                errorMsg.innerText = data.message || "Hatalı giriş!";
                errorMsg.style.display = "block";
            }
        }).catch(error => {
            loadingMsg.style.display = "none";
            document.querySelector('.login-btn').disabled = false;
            errorMsg.innerText = "Bağlantı sorunu veya sunucu hatası! Lütfen internetinizi kontrol edip sayfayı yenileyin.";
            errorMsg.style.display = "block";
            console.error("Login error:", error);
        });
}

function checkAdmin(role) {
    const addCardDropdown = document.getElementById('dropdownAddCard');
    const imageDropdown = document.getElementById('dropdownImage');
    const quickEditDropdown = document.getElementById('dropdownQuickEdit');

    activeRole = role;
    updateGlobalAuthFlags();
    isEditingActive = false;
    document.body.classList.remove('editing');

    if (isAdminMode) {
        if (addCardDropdown) addCardDropdown.style.display = 'flex';
        if (imageDropdown) imageDropdown.style.display = 'flex';
        if (quickEditDropdown) {
            quickEditDropdown.style.display = 'flex';
            const perms = document.getElementById('dropdownPerms');
            if (perms) perms.style.display = 'flex';
            const activeUsersBtn = document.getElementById('dropdownActiveUsers');
            if (activeUsersBtn) activeUsersBtn.style.display = 'flex';
            quickEditDropdown.innerHTML = '<i class="fas fa-pen" style="color:var(--secondary);"></i> Düzenlemeyi Aç';
            quickEditDropdown.classList.remove('active');
        }
    } else {
        if (addCardDropdown) addCardDropdown.style.display = 'none';
        if (imageDropdown) imageDropdown.style.display = 'none';
        if (quickEditDropdown) quickEditDropdown.style.display = 'none';
        const perms = document.getElementById('dropdownPerms');
        if (perms) perms.style.display = 'none';
        const activeUsersBtn = document.getElementById('dropdownActiveUsers');
        if (activeUsersBtn) activeUsersBtn.style.display = 'none';
    }

    try { applyPermissionsToUI(); } catch (e) { }
}

function logout() {
    currentUser = ""; isAdminMode = false; isEditingActive = false;
    try { document.getElementById("user-display").innerText = "Misafir"; } catch (e) { }
    setHomeWelcomeUser("Misafir");
    document.body.classList.remove('editing');
    localStorage.removeItem("sSportUser");
    localStorage.removeItem("sSportToken");
    localStorage.removeItem("sSportRole");
    localStorage.removeItem("sSportGroup");
    localStorage.removeItem("sSportSessionDay");
    localStorage.removeItem("sSportLoginAt");
    localStorage.removeItem("sSportForceChange");
    localStorage.removeItem("sSportPerms");
    if (sessionTimeout) clearTimeout(sessionTimeout);
    document.getElementById("main-app").style.display = "none";
    document.getElementById("login-screen").style.display = "flex";
    document.getElementById("passInput").value = "";
    document.getElementById("usernameInput").value = "";
    document.getElementById("error-msg").style.display = "none";

    document.getElementById('quality-fullscreen').style.display = 'none';
    try { document.getElementById('tech-fullscreen').style.display = 'none'; } catch (e) { }
    try { document.getElementById('telesales-fullscreen').style.display = 'none'; } catch (e) { }
}

function startSessionTimer() {
    if (sessionTimeout) clearTimeout(sessionTimeout);
    sessionTimeout = setTimeout(() => {
        Swal.fire({ icon: 'warning', title: 'Oturum Süresi Doldu', text: 'Güvenlik nedeniyle otomatik çıkış yapıldı.', confirmButtonText: 'Tamam' }).then(() => { logout(); });
    }, 28800000);
}

function openUserMenu() { toggleUserDropdown(); }

async function changePasswordPopup(isMandatory = false) {
    const { value: formValues } = await Swal.fire({
        title: isMandatory ? 'Yeni Şifre Belirleyin' : 'Şifre Değiştir',
        html: `${isMandatory ? '<p style="font-size:0.9rem; color:#d32f2f;">İlk giriş şifrenizi değiştirmeden devam edemezsiniz.</p>' : ''}<input id="swal-old-pass" type="password" class="swal2-input" placeholder="Eski Şifre (Mevcut)"><input id="swal-new-pass" type="password" class="swal2-input" placeholder="Yeni Şifre">`,
        focusConfirm: false, showCancelButton: !isMandatory, allowOutsideClick: !isMandatory, allowEscapeKey: !isMandatory,
        confirmButtonText: 'Değiştir', cancelButtonText: 'İptal',
        preConfirm: () => {
            const o = document.getElementById('swal-old-pass').value;
            const n = document.getElementById('swal-new-pass').value;
            if (!o || !n) { Swal.showValidationMessage('Alanlar boş bırakılamaz'); }
            return [o, n]
        }
    });
    if (formValues) {
        Swal.fire({ title: 'İşleniyor...', didOpen: () => { Swal.showLoading() } });
        fetch(SCRIPT_URL, {
            method: 'POST',
            headers: { "Content-Type": "text/plain;charset=utf-8" },
            body: JSON.stringify({
                action: "changePassword", username: currentUser,
                oldPass: CryptoJS.SHA256(formValues[0]).toString(),
                newPass: CryptoJS.SHA256(formValues[1]).toString(),
                token: getToken()
            })
        }).then(response => response.json()).then(data => {
            if (data.result === "success") {
                localStorage.removeItem("sSportForceChange");
                Swal.fire('Başarılı!', 'Şifreniz güncellendi. Yeniden giriş yapınız.', 'success').then(() => { logout(); });
            } else {
                Swal.fire('Hata', data.message || 'İşlem başarısız.', 'error').then(() => { if (isMandatory) changePasswordPopup(true); });
            }
        }).catch(err => { Swal.fire('Hata', 'Sunucu hatası.', 'error'); if (isMandatory) changePasswordPopup(true); });
    } else if (isMandatory) { changePasswordPopup(true); }
}

async function openActiveUsersPanel() {
    try {
        Swal.fire({ title: 'Yükleniyor...', didOpen: () => { Swal.showLoading() } });
        const res = await apiCall("getActiveUsers", {});
        if (!res || res.result !== "success") {
            Swal.fire("Hata", "Aktif kullanıcılar yüklenemedi", "error");
            return;
        }
        const users = res.users || [];
        if (users.length === 0) {
            Swal.fire({ title: "👥 Aktif Kullanıcılar", html: '<p style="color:#999;padding:20px">Şu an aktif kullanıcı yok.</p>', confirmButtonText: 'Tamam' });
            return;
        }
        const rowsHtml = users.map((u, idx) => {
            return `
                <tr style="border-bottom:1px solid #eee">
                    <td style="padding:12px;text-align:center">${idx + 1}</td>
                    <td style="padding:12px;font-weight:600">${escapeHtml(u.username)}</td>
                    <td style="padding:12px;text-align:center">
                        <span style="display:inline-block;padding:4px 8px;border-radius:4px;font-size:0.85rem;background:${u.role === 'admin' ? '#4caf50' : u.role === 'locadmin' ? '#2196f3' : u.role === 'qusers' ? '#ff9800' : '#9e9e9e'};color:#fff">${escapeHtml(u.role)}</span>
                    </td>
                    <td style="padding:12px;font-size:0.9rem">${escapeHtml(u.group || '-')}</td>
                    <td style="padding:12px;font-size:0.85rem;color:#666">${escapeHtml(u.loginTime || '-')}</td>
                    <td style="padding:12px;font-size:0.85rem;color:#666">${escapeHtml(u.ip || '-')}</td>
                    <td style="padding:12px;text-align:center">
                        <button onclick="kickUser('${escapeForJsString(u.username)}', '${escapeForJsString(u.token)}')" style="padding:6px 12px;background:#d32f2f;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:0.85rem" title="Kullanıcıyı sistemden at"><i class="fas fa-sign-out-alt"></i> Çıkart</button>
                    </td>
                </tr>`;
        }).join('');
        const tableHtml = `
            <div style="max-height:500px;overflow:auto;border:1px solid rgba(0,0,0,.08);border-radius:12px">
                <table style="width:100%;border-collapse:collapse">
                    <thead style="position:sticky;top:0;background:#f7f7f7;z-index:1">
                        <tr><th style="padding:12px;text-align:center">#</th><th style="padding:12px;text-align:left">Kullanıcı</th><th style="padding:12px;text-align:center">Rol</th><th style="padding:12px;text-align:left">Grup</th><th style="padding:12px;text-align:left">Giriş Zamanı</th><th style="padding:12px;text-align:left">IP Adresi</th><th style="padding:12px;text-align:center">İşlem</th></tr>
                    </thead>
                    <tbody>${rowsHtml}</tbody>
                </table>
            </div>
            <div style="margin-top:15px;padding:10px;background:#e3f2fd;border-radius:8px;font-size:0.9rem;color:#1976d2"><i class="fas fa-info-circle"></i> Toplam <strong>${users.length}</strong> aktif kullanıcı</div>`;
        Swal.fire({ title: "👥 Aktif Kullanıcılar", html: tableHtml, width: 1000, showConfirmButton: true, confirmButtonText: "Kapat" });
    } catch (e) { Swal.fire("Hata", "Bir hata oluştu: " + e.message, "error"); }
}

async function kickUser(username, token) {
    const result = await Swal.fire({ title: 'Emin misiniz?', html: `<strong>${username}</strong> kullanıcısını sistemden çıkartmak istediğinizden emin misiniz?`, icon: 'warning', showCancelButton: true, confirmButtonText: 'Evet, Çıkart', cancelButtonText: 'Vazgeç', confirmButtonColor: '#d32f2f' });
    if (!result.isConfirmed) return;
    try {
        Swal.fire({ title: 'İşleniyor...', didOpen: () => { Swal.showLoading() } });
        const res = await apiCall("kickUser", { targetUsername: username, targetToken: token });
        if (res && res.result === "success") {
            Swal.fire({ icon: 'success', title: 'Başarılı', text: `${username} sistemden çıkartıldı.`, timer: 2000 }).then(() => { openActiveUsersPanel(); });
        } else { Swal.fire("Hata", res.message || "Kullanıcı çıkartılamadı", "error"); }
    } catch (e) { Swal.fire("Hata", "Bir hata oluştu: " + e.message, "error"); }
}

let allRolePermissions = [];

async function openMenuPermissions() {
    try {
        Swal.fire({ title: 'Yetkiler Yükleniyor...', didOpen: () => { Swal.showLoading() } });
        const res = await apiCall("getRolePermissions", {});
        if (!res || res.result !== "success") {
            Swal.fire("Hata", "Yetki listesi alınamadı.", "error");
            return;
        }
        allRolePermissions = res.permissions || [];
        const roles = res.groups || ["admin", "qusers", "users"];
        let activeTabIndex = 0;

        const renderRbacContent = (roleIndex) => {
            const role = roles[roleIndex];
            const rolePerms = allRolePermissions.filter(p => p.role === role);
            const pageLabels = {
                home: "Ana Sayfa", search: "Arama Çubuğu", news: "Duyurular", tech: "Teknik Sayfası",
                persuasion: "İkna Sayfası", campaign: "Kampanya Sayfası", info: "Bilgi Sayfası",
                broadcast: "Yayın Akışı", guide: "Spor Rehberi", return: "İade Asistanı",
                telesales: "TeleSatış", game: "Oyun Merkezi", quality: "Kalite Paneli", shift: "Vardiyam"
            };
            const discoveredPages = [];
            const processedKeys = new Set();
            document.querySelectorAll('[data-menu-key]').forEach(el => {
                const key = el.getAttribute('data-menu-key');
                if (!processedKeys.has(key)) {
                    discoveredPages.push({ key: key, label: pageLabels[key] || (el.textContent.trim().replace(/\s+/g, ' ') || key), perms: ["View"] });
                    processedKeys.add(key);
                }
            });
            discoveredPages.sort((a, b) => a.label.localeCompare(b.label, 'tr'));

            const resources = [
                {
                    cat: "Genel Yetkiler", items: [
                        { key: "EditMode", label: "Düzenleme Modunu Açma", perms: ["Execute"] },
                        { key: "AddContent", label: "Yeni İçerik Ekleme", perms: ["Execute"] },
                        { key: "ImageUpload", label: "Görsel Yükleme", perms: ["Execute"] },
                        { key: "Reports", label: "Rapor Çekme (Dışa Aktar)", perms: ["Execute"] },
                        { key: "RbacAdmin", label: "Yetki Yönetimi", perms: ["Execute"] },
                        { key: "ActiveUsers", label: "Aktif Kullanıcılar", perms: ["Execute"] }
                    ]
                },
                { cat: "Sayfa Erişimi", items: discoveredPages },
                {
                    cat: "Kalite Yönetimi", items: [
                        { key: "Evaluation", label: "Değerlendirme Yapma", perms: ["Execute"] },
                        { key: "Feedback", label: "Geri Bildirim Ekleme", perms: ["Execute"] },
                        { key: "Training", label: "Eğitim Atama", perms: ["Execute"] }
                    ]
                }
            ];

            let html = `
                <div class="rbac-container">
                    <div class="rbac-header">
                        <div style="font-weight:700;color:var(--primary)"><i class="fas fa-user-shield"></i> <span style="text-transform:capitalize">${role}</span> Rolü Yetki Tanımları</div>
                        <div class="rbac-info-box"><i class="fas fa-info-circle"></i> LocAdmin her zaman tam yetkilidir.</div>
                    </div>
                    <div class="rbac-role-selector">
                        ${roles.map((r, i) => `<button class="rbac-role-btn ${i === roleIndex ? 'active' : ''}" onclick="window.switchRbacRole(${i})">${r.toUpperCase()}</button>`).join('')}
                    </div>
                    <div class="rbac-table-wrapper">
                        <table class="rbac-table">
                            <thead><tr><th style="text-align:left">Kaynak / Yetki Alanı</th><th style="text-align:center">Durum</th></tr></thead>
                            <tbody>${resources.map(cat => `<tr class="rbac-category-row"><td colspan="2">${cat.cat}</td></tr>${cat.items.map(item => {
                const isEnabled = rolePerms.some(p => p.resource === item.key && p.value === true);
                const safeRole = role.replace(/'/g, "\\'");
                return `<tr><td class="rbac-resource-name">${item.label}</td><td style="text-align:center"><label class="rbac-switch"><input type="checkbox" id="perm_${roleIndex}_${item.key}" ${isEnabled ? 'checked' : ''} onchange="window.toggleRbacPerm('${safeRole}', '${item.key}', this.checked)"><span class="rbac-slider"></span></label></td></tr>`;
            }).join('')}`).join('')}</tbody>
                        </table>
                    </div>
                </div>`;
            return html;
        };

        window.switchRbacRole = (idx) => { activeTabIndex = idx; Swal.update({ html: renderRbacContent(idx) }); };
        window.toggleRbacPerm = (role, resource, val) => {
            const idx = allRolePermissions.findIndex(p => p.role === role && p.resource === resource);
            if (idx > -1) { allRolePermissions[idx].value = val; }
            else { allRolePermissions.push({ role, resource, permission: "All", value: val }); }
        };

        Swal.fire({
            title: "🛡️ Gelişmiş Yetki Yönetimi", html: renderRbacContent(0), width: 800, showCancelButton: true, cancelButtonText: "Vazgeç", confirmButtonText: "Değişiklikleri Kaydet", confirmButtonColor: "var(--success)",
            preConfirm: async () => {
                const results = [];
                roles.forEach(r => { results.push({ role: r, perms: allRolePermissions.filter(p => p.role === r).map(p => ({ resource: p.resource, permission: p.permission || "All", value: p.value })) }); });
                try {
                    Swal.showLoading();
                    for (const resObj of results) { await apiCall("setRolePermissions", resObj); }
                    return true;
                } catch (e) { Swal.showValidationMessage(`Kayıt hatası: ${e.message}`); }
            }
        }).then((result) => { if (result.isConfirmed) { Swal.fire("Başarılı", "Tüm yetkiler güncellendi. Kullanıcıların etkilenmesi için sayfayı yenilemeleri gerekebilir.", "success"); } });
    } catch (e) { Swal.fire("Hata", "Bir hata oluştu: " + e.message, "error"); }
}

function hasPerm(resource, permission = "All") {
    const rawRole = (getMyRole() || "").trim().toLowerCase();
    const rawGroup = (localStorage.getItem("sSportGroup") || "").trim().toLowerCase();
    function clean(str) { return String(str || "").toLowerCase().replace(/i̇/g, 'i').replace(/ı/g, 'i').replace(/ş/g, 's').replace(/ğ/g, 'g').replace(/ü/g, 'u').replace(/ö/g, 'o').replace(/ç/g, 'c').trim(); }
    const cRole = clean(rawRole);
    const cGroup = clean(rawGroup);
    if (cRole === "locadmin" || cGroup === "locadmin") return true;
    if (cGroup && cGroup !== "" && cGroup !== "all") {
        const groupPerm = allRolePermissions.find(p => clean(p.role) === cGroup && (p.resource === resource || p.resource === "All") && (p.permission === permission || p.permission === "All"));
        if (groupPerm) return groupPerm.value;
    }
    const rolePerm = allRolePermissions.find(p => clean(p.role) === cRole && (p.resource === resource || p.resource === "All") && (p.permission === permission || p.permission === "All"));
    return rolePerm ? rolePerm.value : false;
}

async function loadPermissionsOnStartup() {
    if (!currentUser) return;
    try {
        const res = await apiCall("getRolePermissions", {});
        if (res && res.result === "success") {
            allRolePermissions = res.permissions || [];
            applyPermissionsToUI();
            if (!hasPerm("home", "View")) {
                const landingPages = [
                    { key: "quality", action: openQualityArea },
                    { key: "tech", action: () => openTechArea('wizard') },
                    { key: "shift", action: () => filterCategory(null, "shift") },
                    { key: "news", action: openNews },
                    { key: "broadcast", action: openBroadcastFlow },
                    { key: "telesales", action: () => filterCategory(null, "Telesatış") },
                    { key: "persuasion", action: () => filterCategory(null, "İkna") },
                    { key: "campaign", action: () => filterCategory(null, "Kampanya") },
                    { key: "info", action: () => filterCategory(null, "Bilgi") }
                ];
                for (const page of landingPages) { if (hasPerm(page.key, "View")) { page.action(); break; } }
            }
        }
    } catch (e) { }
}

function applyPermissionsToUI() {
    const role = getMyRole();
    if (role === "locadmin") return;

    const editBtn = document.getElementById('dropdownQuickEdit');
    if (editBtn && !hasPerm("EditMode")) editBtn.style.display = 'none';

    const addCardBtn = document.getElementById('dropdownAddCard');
    if (addCardBtn && !hasPerm("AddContent")) addCardBtn.style.display = 'none';

    const imageBtn = document.getElementById('dropdownImage');
    if (imageBtn && !hasPerm("ImageUpload")) imageBtn.style.display = 'none';

    document.querySelectorAll('.admin-btn').forEach(btn => { if (!hasPerm("Reports")) btn.style.display = 'none'; });

    const permsBtn = document.getElementById('dropdownPerms');
    if (permsBtn && !hasPerm("RbacAdmin")) permsBtn.style.display = 'none';

    const activeUsersBtn = document.getElementById('dropdownActiveUsers');
    if (activeUsersBtn && !hasPerm("ActiveUsers")) activeUsersBtn.style.display = 'none';

    const menuMap = {
        "home": "home", "search": "search", "tech": "tech", "telesales": "telesales",
        "persuasion": "persuasion", "campaign": "campaign", "info": "info", "news": "news",
        "quality": "quality", "shift": "shift", "broadcast": "broadcast", "guide": "guide",
        "return": "return", "game": "game"
    };

    Object.keys(menuMap).forEach(key => {
        document.querySelectorAll(`[data-menu-key="${key}"]`).forEach(el => { el.style.display = hasPerm(menuMap[key], "View") ? '' : 'none'; });
        document.querySelectorAll(`[data-shortcut-key="${key}"]`).forEach(sc => { sc.style.display = hasPerm(menuMap[key], "View") ? '' : 'none'; });
    });

    try { if (typeof currentCategory !== "undefined" && currentCategory === 'home') renderHomePanels(); } catch (e) { }
    checkQualityNotifications();
}
