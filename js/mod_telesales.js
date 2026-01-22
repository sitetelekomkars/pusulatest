let telesalesOffers = [];
let telesalesScriptsLoaded = false;

async function maybeLoadTelesalesScriptsFromSheet() {
    if (telesalesScriptsLoaded) return;
    telesalesScriptsLoaded = true;
    try {
        const ov = JSON.parse(localStorage.getItem('telesalesScriptsOverride') || '[]');
        if (Array.isArray(ov) && ov.length) return;
    } catch (e) { }
    try {
        const d = await apiCall('getTelesalesScripts');
        const loaded = d.data || d.items || [];
        if (Array.isArray(loaded) && loaded.length) {
            window.salesScripts = loaded.map(s => ({
                id: s.id || s.ID || s.Id || '',
                title: s.title || s.Başlık || s.Baslik || s.Script || s['Script Başlığı'] || 'Script',
                text: s.text || s.Metin || s['Script Metni'] || s.content || ''
            })).filter(x => x.text);
        }
    } catch (e) { }
}

async function syncTelesalesScriptsToSheet(arr) {
    try { await apiCall('saveTelesalesScripts', { scripts: arr || [] }); } catch (e) { }
}

async function openTelesalesArea() {
    try {
        const perm = (typeof menuPermissions !== "undefined" && menuPermissions) ? menuPermissions["telesales"] : null;
        if (perm && !isAllowedByPerm(perm)) { Swal.fire("Yetkisiz", "TeleSatış ekranına erişimin yok.", "warning"); return; }
    } catch (e) { }

    const wrap = document.getElementById('telesales-fullscreen');
    if (!wrap) return;
    wrap.style.display = 'flex';
    document.body.classList.add('fs-open');
    document.body.style.overflow = 'hidden';

    const av = document.getElementById('t-side-avatar');
    const nm = document.getElementById('t-side-name');
    const rl = document.getElementById('t-side-role');
    if (av) av.innerText = (currentUser || 'U').trim().slice(0, 1).toUpperCase();
    if (nm) nm.innerText = currentUser || 'Kullanıcı';
    if (rl) rl.innerText = isAdminMode ? 'Admin' : 'Temsilci';

    if (telesalesOffers.length === 0) {
        try {
            const d = await apiCall("getTelesalesOffers");
            const loaded = d.data || d.items || [];
            telesalesOffers = (Array.isArray(loaded) && loaded.length)
                ? loaded.map(o => ({
                    segment: o.segment || o.Segment || o.SEGMENT || '',
                    title: o.title || o.Başlık || o.Baslik || o.Teklif || o['Teklif Adı'] || '',
                    desc: o.desc || o.Açıklama || o.Aciklama || o.Detay || '',
                    note: o.note || o.Not || '',
                    image: o.image || o.Image || o.Görsel || '',
                    example: o.example || o.Örnek || '',
                    tips: o.tips || o.İpucu || '',
                    objection: o.objection || o.Itiraz || '',
                    reply: o.reply || o.Cevap || ''
                }))
                : (Array.isArray(window.telesalesOffersFromSheet) ? window.telesalesOffersFromSheet : []);
        } catch (e) { }
    }

    renderTelesalesDataOffers();
    await maybeLoadTelesalesScriptsFromSheet();
    renderTelesalesScripts();
    switchTelesalesTab('data');
}

function closeFullTelesales() {
    const wrap = document.getElementById('telesales-fullscreen');
    if (wrap) wrap.style.display = 'none';
    document.body.classList.remove('fs-open');
    document.body.style.overflow = '';
}

function switchTelesalesTab(tab) {
    document.querySelectorAll('#telesales-fullscreen .q-nav-item').forEach(i => i.classList.remove('active'));
    document.querySelectorAll('#telesales-fullscreen .q-nav-item').forEach(i => {
        if ((i.getAttribute('onclick') || '').includes(`"${tab}"`)) i.classList.add('active');
    });
    document.querySelectorAll('#telesales-fullscreen .q-view-section').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(`t-view-${tab}`);
    if (el) el.classList.add('active');
}

function renderTelesalesDataOffers() {
    const grid = document.getElementById('t-data-grid');
    if (!grid) return;
    const q = (document.getElementById('t-data-search')?.value || '').toLowerCase();
    const list = (telesalesOffers || []).filter(o => {
        const hay = `${o.title || ''} ${o.desc || ''} ${o.segment || ''}`.toLowerCase();
        return !q || hay.includes(q);
    });

    const bar = (isAdminMode && isEditingActive) ? `<div style="grid-column:1/-1;display:flex;gap:10px;margin:6px 0 12px;"><button class="x-btn x-btn-admin" onclick="addTelesalesOffer()"><i class="fas fa-plus"></i> Teklif Ekle</button></div>` : '';
    const cnt = document.getElementById('t-data-count');
    if (cnt) cnt.innerText = `${list.length} kayıt`;

    if (list.length === 0) { grid.innerHTML = bar + '<div style="opacity:.7;padding:20px;grid-column:1/-1">Sonuç bulunamadı.</div>'; return; }

    grid.innerHTML = bar + list.map((o, idx) => {
        const imgHtml = o.image ? `<div style="height:120px;overflow:hidden;border-radius:6px;margin-bottom:8px;"><img src="${processImageUrl(o.image)}" style="width:100%;height:100%;object-fit:cover;"></div>` : '';
        return `
        <div class="q-training-card" onclick="showTelesalesOfferDetail(${idx})" style="cursor:pointer">
          ${imgHtml}
          <div class="t-training-head">
            <div style="min-width:0"><div class="q-item-title" style="font-size:1.02rem">${escapeHtml(o.title || 'Teklif')}</div></div>
            <div class="t-training-badge">${escapeHtml(o.segment || '')}</div>
          </div>
          <div class="t-training-desc" style="white-space: pre-line">${escapeHtml((o.desc || '').slice(0, 140))}${o.desc && o.desc.length > 140 ? '...' : ''}</div>
          ${(isAdminMode && isEditingActive) ? `<div style="margin-top:12px;display:flex;gap:10px"><button class="x-btn x-btn-admin" onclick="event.stopPropagation(); editTelesalesOffer(${idx});">Düzenle</button><button class="x-btn x-btn-admin" onclick="event.stopPropagation(); deleteTelesalesOffer(${idx});">Sil</button></div>` : ''}
        </div>`;
    }).join('');
}

function showTelesalesOfferDetail(idx) {
    const o = (telesalesOffers || [])[idx];
    if (!o) return;
    const imgHtml = o.image ? `<img src="${processImageUrl(o.image)}" style="max-width:100%;border-radius:6px;margin-bottom:15px;">` : '';
    Swal.fire({
        title: escapeHtml(o.title || ''),
        html: `<div style="text-align:left;line-height:1.6">${imgHtml}<div style="margin-bottom:10px"><b>Segment:</b> ${escapeHtml(o.segment || '-')}</div>${o.note ? `<div style="margin-bottom:10px;background:#fff3cd;padding:8px;border-radius:4px;border-left:4px solid #ffc107;white-space: pre-line"><b>Not:</b> ${escapeHtml(o.note)}</div>` : ''}<div style="white-space: pre-line">${escapeHtml(o.desc || 'Detay yok.')}</div>${o.detail ? `<hr><div style="font-size:0.9rem;color:#666;white-space: pre-line">${escapeHtml(o.detail)}</div>` : ''}</div>`,
        showCloseButton: true, showConfirmButton: false, width: '720px', background: '#f8f9fa'
    });
}

function renderTelesalesScripts() {
    const area = document.getElementById('t-scripts-grid');
    if (!area) return;
    let list = (salesScripts || []);
    try {
        const ov = JSON.parse(localStorage.getItem('telesalesScriptsOverride') || '[]');
        if (Array.isArray(ov) && ov.length) list = ov;
    } catch (e) { }

    const bar = (isAdminMode && isEditingActive) ? `<div style="display:flex;gap:10px;margin:6px 0 12px;"><button class="x-btn x-btn-admin" onclick="addTelesalesScript()"><i class="fas fa-plus"></i> Script Ekle</button></div>` : '';
    if (list.length === 0) { area.innerHTML = bar + '<div style="padding:16px;opacity:.7">Script bulunamadı.</div>'; return; }

    area.innerHTML = bar + list.map((s, i) => `
      <div class="news-item" style="border-left-color:#10b981;cursor:pointer" onclick="copyText('${escapeForJsString(s.text || '')}')">
        <span class="news-title">${escapeHtml(s.title || 'Script')}</span>
        <div class="news-desc" style="white-space:pre-line">${escapeHtml(s.text || '')}</div>
        <div style="display:flex;gap:10px;align-items:center;justify-content:space-between;margin-top:10px">
          <div class="news-tag" style="background:rgba(16,185,129,.08);color:#10b981;border:1px solid rgba(16,185,129,.25)">Tıkla & Kopyala</div>
          ${(isAdminMode && isEditingActive) ? `<div style="display:flex;gap:8px"><button class="x-btn x-btn-admin" onclick="event.stopPropagation(); editTelesalesScript(${i});"><i class="fas fa-pen"></i></button><button class="x-btn x-btn-admin" onclick="event.stopPropagation(); deleteTelesalesScript(${i});"><i class="fas fa-trash"></i></button></div>` : ''}
        </div>
      </div>`).join('');
}

function getTelesalesScriptsStore() {
    try {
        const ov = JSON.parse(localStorage.getItem('telesalesScriptsOverride') || '[]');
        if (Array.isArray(ov) && ov.length) return ov;
    } catch (e) { }
    return (salesScripts || []);
}

function saveTelesalesScriptsStore(arr) { localStorage.setItem('telesalesScriptsOverride', JSON.stringify(arr || [])); }

function addTelesalesScript() {
    Swal.fire({
        title: "Script Ekle",
        html: `<input id="ts-title" class="swal2-input" placeholder="Başlık"><textarea id="ts-text" class="swal2-textarea" placeholder="Script metni"></textarea>`,
        showCancelButton: true, confirmButtonText: "Ekle", preConfirm: () => {
            const title = (document.getElementById('ts-title').value || '').trim();
            const text = (document.getElementById('ts-text').value || '').trim();
            if (!text) return Swal.showValidationMessage("Script metni zorunlu");
            return { id: 'local_' + Date.now(), title: title || 'Script', text };
        }
    }).then(res => {
        if (res.isConfirmed) {
            const arr = getTelesalesScriptsStore(); arr.unshift(res.value);
            saveTelesalesScriptsStore(arr); syncTelesalesScriptsToSheet(arr); renderTelesalesScripts();
        }
    });
}

function editTelesalesScript(idx) {
    const arr = getTelesalesScriptsStore(); const s = arr[idx]; if (!s) return;
    Swal.fire({
        title: "Script Düzenle",
        html: `<input id="ts-title" class="swal2-input" value="${escapeHtml(s.title)}"><textarea id="ts-text" class="swal2-textarea">${escapeHtml(s.text)}</textarea>`,
        showCancelButton: true, confirmButtonText: "Kaydet", preConfirm: () => {
            const title = (document.getElementById('ts-title').value || '').trim();
            const text = (document.getElementById('ts-text').value || '').trim();
            if (!text) return Swal.showValidationMessage("Script metni zorunlu");
            return { ...s, title: title || 'Script', text };
        }
    }).then(res => {
        if (res.isConfirmed) { arr[idx] = res.value; saveTelesalesScriptsStore(arr); syncTelesalesScriptsToSheet(arr); renderTelesalesScripts(); }
    });
}

function deleteTelesalesScript(idx) {
    Swal.fire({ title: "Silinsin mi?", icon: "warning", showCancelButton: true }).then(res => {
        if (res.isConfirmed) {
            const arr = getTelesalesScriptsStore().filter((_, i) => i !== idx);
            saveTelesalesScriptsStore(arr); syncTelesalesScriptsToSheet(arr); renderTelesalesScripts();
        }
    });
}

async function addTelesalesOffer() {
    const { value: v } = await Swal.fire({
        title: "Teklif Ekle",
        html: `<input id="to-title" class="swal2-input" placeholder="Başlık"><input id="to-seg" class="swal2-input" placeholder="Segment"><textarea id="to-desc" class="swal2-textarea" placeholder="Açıklama"></textarea>`,
        showCancelButton: true, confirmButtonText: "Ekle", preConfirm: () => ({ title: document.getElementById('to-title').value, segment: document.getElementById('to-seg').value, desc: document.getElementById('to-desc').value })
    });
    if (v) {
        telesalesOffers.unshift(v);
        await apiCall('saveAllTelesalesOffers', { offers: telesalesOffers });
        renderTelesalesDataOffers();
    }
}

async function editTelesalesOffer(idx) {
    const o = telesalesOffers[idx]; if (!o) return;
    const { value: v } = await Swal.fire({
        title: "Teklifi Düzenle",
        html: `<input id="to-title" class="swal2-input" value="${escapeHtml(o.title)}"><input id="to-seg" class="swal2-input" value="${escapeHtml(o.segment)}"><textarea id="to-desc" class="swal2-textarea">${escapeHtml(o.desc)}</textarea>`,
        showCancelButton: true, confirmButtonText: "Kaydet", preConfirm: () => ({ ...o, title: document.getElementById('to-title').value, segment: document.getElementById('to-seg').value, desc: document.getElementById('to-desc').value })
    });
    if (v) {
        telesalesOffers[idx] = v;
        await apiCall('saveAllTelesalesOffers', { offers: telesalesOffers });
        renderTelesalesDataOffers();
    }
}

function deleteTelesalesOffer(idx) {
    Swal.fire({ title: "Silinsin mi?", icon: "warning", showCancelButton: true }).then(async res => {
        if (res.isConfirmed) {
            telesalesOffers.splice(idx, 1);
            await apiCall('saveAllTelesalesOffers', { offers: telesalesOffers });
            renderTelesalesDataOffers();
        }
    });
}
