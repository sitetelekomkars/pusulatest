async function openShiftArea(tab) {
    const wrap = document.getElementById('shift-fullscreen');
    if (!wrap) return;
    wrap.style.display = 'flex';
    document.body.classList.add('fs-open');
    document.body.style.overflow = 'hidden';

    const av = document.getElementById('shift-side-avatar');
    const nm = document.getElementById('shift-side-name');
    const rl = document.getElementById('shift-side-role');
    if (av) av.innerText = (currentUser || 'U').trim().slice(0, 1).toUpperCase();
    if (nm) nm.innerText = currentUser || 'Kullanıcı';
    if (rl) rl.innerText = isAdminMode ? 'Yönetici' : 'Temsilci';

    await loadShiftData();
    switchShiftTab(tab || 'plan');
}

function closeFullShift() {
    const wrap = document.getElementById('shift-fullscreen');
    if (wrap) wrap.style.display = 'none';
    document.body.classList.remove('fs-open');
    document.body.style.overflow = '';
}

function switchShiftTab(tab) {
    document.querySelectorAll('#shift-fullscreen .q-nav-item').forEach(i => i.classList.remove('active'));
    const nav = document.querySelector(`#shift-fullscreen .q-nav-item[data-shift-tab="${tab}"]`);
    if (nav) nav.classList.add('active');

    document.querySelectorAll('#shift-fullscreen .q-view-section').forEach(s => s.classList.remove('active'));
    const view = document.getElementById(`shift-view-${tab}`);
    if (view) view.classList.add('active');
}

async function loadShiftData() {
    try {
        const data = await apiCall("getShiftData");
        renderShiftData(data.shifts || {});
    } catch (e) {
        console.error(e);
        Swal.fire('Hata', e.message || 'Vardiya verileri alınırken bir hata oluştu.', 'error');
    }
}

function renderShiftData(shifts) {
    const weekLabelEl = document.getElementById('shift-week-label');
    if (weekLabelEl) { weekLabelEl.textContent = formatWeekLabel(shifts.weekLabel || ''); }

    const myPlanEl = document.getElementById('shift-plan-my');
    if (myPlanEl) {
        const myRow = shifts.myRow;
        const headers = shifts.headers || [];
        if (myRow && headers.length) {
            const cellsHtml = headers.map((h, idx) => {
                const v = (myRow.cells || [])[idx] || '';
                return `<div class="shift-day"><div class="shift-day-date">${formatShiftDate(h)}</div><div class="shift-day-slot">${escapeHtml(v)}</div></div>`;
            }).join('');
            myPlanEl.innerHTML = `<div class="shift-card-header">Benim Vardiyam</div><div class="shift-card-body">${cellsHtml}</div>`;
        } else {
            myPlanEl.innerHTML = '<p style="color:#666;">Vardiya tablosunda adınız bulunamadı.</p>';
        }
    }

    const tableWrap = document.getElementById('shift-plan-table');
    if (tableWrap) {
        const headers = shifts.headers || [];
        const rows = shifts.rows || [];
        if (!headers.length || !rows.length) {
            tableWrap.innerHTML = '<p style="color:#666;">Vardiya tablosu henüz hazırlanmadı.</p>';
        } else {
            let html = '<table class="shift-table"><thead><tr><th>Temsilci</th>';
            headers.forEach(h => { html += `<th>${formatShiftDate(h)}</th>`; });
            html += '</tr></thead><tbody>';
            rows.forEach(r => {
                html += '<tr><td>${escapeHtml(r.name)}</td>';
                headers.forEach((h, idx) => { html += `<td>${escapeHtml((r.cells || [])[idx] || '')}</td>`; });
                html += '</tr>';
            });
            html += '</tbody></table>';
            tableWrap.innerHTML = html;
        }
    }

    const listEl = document.getElementById('shift-requests-list');
    if (listEl) {
        const reqs = shifts.myRequests || [];
        if (!reqs.length) {
            listEl.innerHTML = '<p style="color:#666;">Henüz oluşturulmuş vardiya talebin yok.</p>';
        } else {
            listEl.innerHTML = reqs.map(r => `
                <div class="shift-request-item">
                    <div class="shift-request-top"><span class="shift-request-date">${escapeHtml(r.date || '')}</span><span class="shift-request-status">${escapeHtml(r.status || 'Açık')}</span></div>
                    <div class="shift-request-body">
                        <div><strong>Tür:</strong> ${escapeHtml(r.type || '')}</div>
                        <div><strong>Mevcut:</strong> ${escapeHtml(r.current || '')}</div>
                        <div><strong>Talep Edilen:</strong> ${escapeHtml(r.requested || '')}</div>
                        ${r.friend ? `<div><strong>Arkadaş:</strong> ${escapeHtml(r.friend || '')}</div>` : ''}
                        ${r.friendShift ? `<div><strong>Arkadaş Vardiyası:</strong> ${escapeHtml(r.friendShift || '')}</div>` : ''}
                        ${r.note ? `<div><strong>Not:</strong> ${escapeHtml(r.note || '')}</div>` : ''}
                    </div>
                    <div class="shift-request-footer">${escapeHtml(r.timestamp || '')}</div>
                </div>`).join('');
        }
    }
}

async function submitShiftRequest(evt) {
    if (evt) evt.preventDefault();
    const date = document.getElementById('shift-req-date').value;
    const type = document.getElementById('shift-req-type').value;
    const current = document.getElementById('shift-req-current').value;
    const requested = document.getElementById('shift-req-requested').value;
    const friend = document.getElementById('shift-req-friend').value;
    const friendShift = document.getElementById('shift-req-friend-shift').value;
    const note = document.getElementById('shift-req-note').value;

    if (!date || !requested) { Swal.fire('Uyarı', 'Tarih ve talep edilen vardiya alanları zorunludur.', 'warning'); return; }

    try {
        await apiCall("submitShiftRequest", {
            date, type, current, requested, friend, friendShift, note,
            week: document.getElementById('shift-week-label') ? document.getElementById('shift-week-label').textContent : ''
        });
        Swal.fire({ icon: 'success', title: 'Kaydedildi', timer: 1500, showConfirmButton: false });
        const form = document.getElementById('shift-request-form');
        if (form) form.reset();
        await loadShiftData();
    } catch (e) {
        Swal.fire('Hata', e.message || 'Talep kaydedilemedi.', 'error');
    }
}
