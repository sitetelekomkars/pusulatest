// ==========================================================
// --- KALİTE PUANLAMA LOGİĞİ: CHAT (BUTON TABANLI) ---
// ==========================================================
window.setButtonScore = function (index, score, max) {
    const row = document.getElementById(`row-${index}`);
    const badge = document.getElementById(`badge-${index}`);
    const noteInput = document.getElementById(`note-${index}`);
    const buttons = row.querySelectorAll('.eval-button');

    buttons.forEach(b => b.classList.remove('active'));
    const activeBtn = row.querySelector('.eval-button[data-score="' + score + '"]');
    if (activeBtn) activeBtn.classList.add('active');

    badge.innerText = score;

    if (score < max) {
        noteInput.style.display = 'block';
        badge.style.background = '#d32f2f';
        row.style.borderColor = '#ffcdd2';
        row.style.background = '#fff5f5';
    } else {
        noteInput.style.display = 'none';
        noteInput.value = '';
        badge.style.background = '#2e7d32';
        row.style.borderColor = '#eee';
        row.style.background = '#fff';
    }
    window.recalcTotalScore();
};

window.recalcTotalScore = function () {
    let currentTotal = 0;
    let maxTotal = 0;
    const scoreBadges = document.querySelectorAll('.score-badge');
    scoreBadges.forEach(b => { currentTotal += parseInt(b.innerText) || 0; });
    const maxScores = document.querySelectorAll('.criteria-row');
    maxScores.forEach(row => { maxTotal += parseInt(row.getAttribute('data-max-score')) || 0; });
    const liveScoreEl = document.getElementById('live-score');
    const ringEl = document.getElementById('score-ring');
    if (liveScoreEl) liveScoreEl.innerText = currentTotal;
    if (ringEl) {
        let color = '#2e7d32';
        let ratio = maxTotal > 0 ? (currentTotal / maxTotal) * 100 : 0;
        if (ratio < 50) color = '#d32f2f';
        else if (ratio < 85) color = '#ed6c02';
        else if (ratio < 95) color = '#fabb00';
        ringEl.style.background = `conic-gradient(${color} ${ratio}%, #444 ${ratio}%)`;
    }
};

// ==========================================================
// --- KALİTE PUANLAMA LOGİĞİ: TELE SATIŞ (SLIDER TABANLI) ---
// ==========================================================
window.updateRowSliderScore = function (index, max) {
    const slider = document.getElementById(`slider-${index}`);
    const badge = document.getElementById(`badge-${index}`);
    const noteInput = document.getElementById(`note-${index}`);
    const row = document.getElementById(`row-${index}`);
    if (!slider) return;
    const val = parseInt(slider.value);
    badge.innerText = val;
    if (val < max) {
        noteInput.style.display = 'block';
        badge.style.background = '#d32f2f';
        row.style.borderColor = '#ffcdd2';
        row.style.background = '#fff5f5';
    } else {
        noteInput.style.display = 'none';
        noteInput.value = '';
        badge.style.background = '#2e7d32';
        row.style.borderColor = '#eee';
        row.style.background = '#fff';
    }
    window.recalcTotalSliderScore();
};

window.recalcTotalSliderScore = function () {
    let currentTotal = 0;
    let maxTotal = 0;
    const sliders = document.querySelectorAll('.slider-input');
    sliders.forEach(s => {
        currentTotal += parseInt(s.value) || 0;
        maxTotal += parseInt(s.getAttribute('max')) || 0;
    });
    const liveScoreEl = document.getElementById('live-score');
    const ringEl = document.getElementById('score-ring');
    if (liveScoreEl) liveScoreEl.innerText = currentTotal;
    if (ringEl) {
        let color = '#2e7d32';
        let ratio = maxTotal > 0 ? (currentTotal / maxTotal) * 100 : 0;
        if (ratio < 50) color = '#d32f2f';
        else if (ratio < 85) color = '#ed6c02';
        else if (ratio < 95) color = '#fabb00';
        ringEl.style.background = `conic-gradient(${color} ${ratio}%, #444 ${ratio}%)`;
    }
};

// ==========================================================
// --- YENİ KALİTE LMS MODÜLÜ (TAM EKRAN ENTEGRASYONU) ---
// ==========================================================
function openQualityArea() {
    const fs = document.getElementById('quality-fullscreen');
    fs.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    populateMonthFilterFull();
    populateDashboardFilters();
    populateFeedbackFilters();

    const activeTab = document.querySelector('.quality-nav-item.active');
    if (activeTab) {
        const tabName = activeTab.getAttribute('onclick').match(/'([^']+)'/)[1];
        switchQualityTab(tabName, activeTab);
    } else {
        const firstTab = document.querySelector('.quality-nav-item');
        if (firstTab) firstTab.click();
    }
}

function closeFullQuality() {
    document.getElementById('quality-fullscreen').style.display = 'none';
    document.body.style.overflow = 'auto';
}

function switchQualityTab(tabName, element) {
    document.querySelectorAll('.quality-nav-item').forEach(el => el.classList.remove('active'));
    element.classList.add('active');
    document.querySelectorAll('.quality-tab-content').forEach(el => el.style.display = 'none');
    const target = document.getElementById(`q-tab-${tabName}`);
    if (target) target.style.display = 'block';

    if (tabName === 'dashboard') loadQualityDashboard();
    else if (tabName === 'evaluations') fetchEvaluationsForAgent();
    else if (tabName === 'feedback') loadFeedbackList();
    else if (tabName === 'training') loadTrainingData();
}

function populateMonthFilterFull() {
    const selects = document.querySelectorAll('#q-dash-month, #q-eval-month, #q-feed-month');
    selects.forEach(select => {
        if (!select) return;
        const currentVal = select.value;
        select.innerHTML = '';
        const d = new Date();
        for (let i = 0; i < 12; i++) {
            const label = d.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' });
            const val = (d.getMonth() + 1).toString().padStart(2, '0') + "." + d.getFullYear();
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = label;
            select.appendChild(opt);
            d.setMonth(d.getMonth() - 1);
        }
        if (currentVal) select.value = currentVal;
    });
}

function populateDashboardFilters() {
    const groupSelect = document.getElementById('q-dash-group');
    if (!groupSelect) return;
    const currentGroup = groupSelect.value;
    groupSelect.innerHTML = '<option value="all">Tüm Gruplar</option>';
    const groups = [...new Set(adminUserList.map(u => u.group).filter(Boolean))].sort();
    groups.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = g;
        groupSelect.appendChild(opt);
    });
    if (currentGroup) groupSelect.value = currentGroup;
    updateDashAgentList();
}

function updateDashAgentList() {
    const groupSelect = document.getElementById('q-dash-group');
    const agentSelect = document.getElementById('q-dash-agent');
    if (!groupSelect || !agentSelect) return;
    const selGroup = groupSelect.value;
    const currentAgent = agentSelect.value;
    agentSelect.innerHTML = '<option value="all">Tüm Temsilciler</option>';
    let filtered = adminUserList;
    if (selGroup !== 'all') filtered = adminUserList.filter(u => u.group === selGroup);
    filtered.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.name;
        opt.textContent = u.name;
        agentSelect.appendChild(opt);
    });
    if (currentAgent) agentSelect.value = currentAgent;
}

function updateDashRingTitle() {
    const titleEl = document.getElementById('q-dash-ring-title');
    const agentSelect = document.getElementById('q-dash-agent');
    const groupSelect = document.getElementById('q-dash-group');
    if (!titleEl) return;
    if (agentSelect && agentSelect.value !== 'all') titleEl.textContent = agentSelect.value;
    else if (groupSelect && groupSelect.value !== 'all') titleEl.textContent = groupSelect.value + ' Ortalaması';
    else titleEl.textContent = 'Genel Ortalama';
}

function renderDashAgentScores(evals) {
    const listEl = document.getElementById('q-dash-agent-scores');
    if (!listEl) return;
    if (!isAdminMode) { listEl.parentElement.style.display = 'none'; return; }
    listEl.parentElement.style.display = 'block';

    const scoresByAgent = {};
    evals.forEach(e => {
        if (!scoresByAgent[e.agent]) scoresByAgent[e.agent] = { total: 0, count: 0 };
        scoresByAgent[e.agent].total += parseFloat(e.score) || 0;
        scoresByAgent[e.agent].count++;
    });

    const agentList = Object.keys(scoresByAgent).map(name => ({
        name,
        avg: (scoresByAgent[name].total / scoresByAgent[name].count).toFixed(1),
        count: scoresByAgent[name].count
    })).sort((a, b) => b.avg - a.avg);

    listEl.innerHTML = agentList.map(a => `
        <div class="dash-agent-row">
            <span class="name">${escapeHtml(a.name)} (${a.count})</span>
            <span class="score" style="color:${a.avg >= 90 ? '#2e7d32' : (a.avg >= 70 ? '#ed6c02' : '#d32f2f')}">${a.avg}</span>
        </div>
    `).join('') || '<div style="padding:10px;color:#999;text-align:center">Veri yok</div>';
}

function deriveChannelFromGroup(group) {
    if (!group) return 'Diğer';
    const g = group.toLowerCase();
    if (g.includes('chat')) return 'Chat';
    if (g.includes('ob')) return 'OB';
    if (g.includes('telesat')) return 'Telesatış';
    return 'Diğer';
}

function safeParseDetails(details) {
    try { return JSON.parse(details); } catch (e) { return []; }
}

function populateFeedbackFilters() {
    const groupSelect = document.getElementById('q-feed-group');
    if (!groupSelect) return;
    groupSelect.innerHTML = '<option value="all">Tüm Gruplar</option>';
    const groups = [...new Set(adminUserList.map(u => u.group).filter(Boolean))].sort();
    groups.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g;
        opt.textContent = g;
        groupSelect.appendChild(opt);
    });
    updateFeedbackAgentList(false);
}

function updateFeedbackAgentList(shouldRefresh = true) {
    const groupSelect = document.getElementById('q-feed-group');
    const agentSelect = document.getElementById('q-feed-agent');
    if (!groupSelect || !agentSelect) return;
    const selGroup = groupSelect.value;
    agentSelect.innerHTML = '<option value="all">Tüm Temsilciler</option>';
    let filtered = adminUserList;
    if (selGroup !== 'all') filtered = adminUserList.filter(u => u.group === selGroup);
    filtered.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.name;
        opt.textContent = u.name;
        agentSelect.appendChild(opt);
    });
    if (shouldRefresh) loadFeedbackList();
}

async function fetchEvaluationsForFeedback() {
    const month = document.getElementById('q-feed-month').value;
    const group = document.getElementById('q-feed-group').value;
    const agent = document.getElementById('q-feed-agent').value;
    try {
        const res = await apiCall("fetchEvaluations", { period: month, targetGroup: group, targetAgent: agent, limit: 1000 });
        return res.result === "success" ? res.evaluations : [];
    } catch (e) { return []; }
}

function refreshFeedbackData() {
    loadFeedbackList();
    fetchFeedbackLogs();
}

function refreshQualityData() {
    const activeTab = document.querySelector('.quality-nav-item.active');
    if (activeTab) activeTab.click();
}

async function fetchEvaluationsForDashboard() {
    const period = document.getElementById('q-dash-month').value;
    const group = document.getElementById('q-dash-group').value;
    const agent = document.getElementById('q-dash-agent').value;
    try {
        const data = await apiCall("fetchEvaluations", { period, targetGroup: group, targetAgent: agent, limit: 1000 });
        return data.result === "success" ? data.evaluations : [];
    } catch (e) { return []; }
}

async function loadQualityDashboard() {
    const ringEl = document.getElementById('q-dash-score-ring');
    const liveEl = document.getElementById('q-dash-live-score');
    if (liveEl) liveEl.textContent = '...';

    updateDashRingTitle();
    const evals = await fetchEvaluationsForDashboard();

    let total = 0;
    evals.forEach(e => total += parseFloat(e.score) || 0);
    const avg = evals.length > 0 ? (total / evals.length).toFixed(1) : 0;

    if (liveEl) liveEl.textContent = avg;
    if (ringEl) {
        let color = '#2e7d32';
        if (avg < 50) color = '#d32f2f';
        else if (avg < 85) color = '#ed6c02';
        else if (avg < 95) color = '#fabb00';
        ringEl.style.background = `conic-gradient(${color} ${avg}%, #f0f2f5 ${avg}%)`;
    }

    renderDashboardCharts(evals);
    renderDashAgentScores(evals);
}

function destroyIfExists(chart) { if (chart) { try { chart.destroy(); } catch (e) { } } }

const valueLabelPlugin = {
    id: 'valueLabelPlugin',
    afterDatasetsDraw(chart, args, pluginOptions) {
        const { ctx, data, chartArea: { top, bottom, left, right, width, height }, scales: { x, y } } = chart;
        ctx.save();
        data.datasets.forEach((dataset, i) => {
            chart.getDatasetMeta(i).data.forEach((datapoint, index) => {
                const val = dataset.data[index];
                if (val === 0 || val === null || val === undefined) return;
                ctx.font = 'bold 10px Inter, sans-serif';
                ctx.fillStyle = '#444';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText(val, datapoint.x, datapoint.y - 5);
            });
        });
        ctx.restore();
    }
};

function renderDashboardCharts(filtered) {
    renderDashboardTrendChart(filtered);
    renderDashboardChannelChart(filtered);
    renderDashboardScoreDistributionChart(filtered);
    renderDashboardGroupAvgChart(filtered);
}

function renderDashboardTrendChart(data) {
    const ctx = document.getElementById('q-dash-trend-chart');
    if (!ctx) return;
    destroyIfExists(dashboardChart);

    const daily = {};
    data.forEach(e => {
        const d = e.date || '';
        if (!daily[d]) daily[d] = { total: 0, count: 0 };
        daily[d].total += parseFloat(e.score) || 0;
        daily[d].count++;
    });

    const labels = Object.keys(daily).sort((a, b) => parseDateTRToTS(a) - parseDateTRToTS(b));
    const points = labels.map(l => (daily[l].total / daily[l].count).toFixed(1));

    dashboardChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels,
            datasets: [{
                label: 'Günlük Ortalama',
                data: points,
                borderColor: '#0e1b42',
                backgroundColor: 'rgba(14, 27, 66, 0.1)',
                tension: 0.3,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#0e1b42'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false }, tooltip: { mode: 'index', intersect: false } },
            scales: { y: { min: 0, max: 100, ticks: { stepSize: 20 } } }
        }
    });
}

function renderDashboardChannelChart(data) {
    const ctx = document.getElementById('q-dash-channel-chart');
    if (!ctx) return;
    destroyIfExists(dashChannelChart);

    const channels = { 'Chat': { t: 0, c: 0 }, 'OB': { t: 0, c: 0 }, 'Telesatış': { t: 0, c: 0 }, 'Diğer': { t: 0, c: 0 } };
    data.forEach(e => {
        const ch = deriveChannelFromGroup(e.group);
        if (channels[ch]) { channels[ch].t += parseFloat(e.score) || 0; channels[ch].c++; }
    });

    const labels = Object.keys(channels).filter(k => channels[k].c > 0);
    const avgs = labels.map(k => (channels[k].t / channels[k].c).toFixed(1));

    dashChannelChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data: avgs,
                backgroundColor: ['#2e7d32', '#1976d2', '#ed6c02', '#9c27b0'],
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { y: { min: 0, max: 100 } }
        },
        plugins: [valueLabelPlugin]
    });
}

function renderDashboardScoreDistributionChart(data) {
    const ctx = document.getElementById('q-dash-score-dist-chart');
    if (!ctx) return;
    destroyIfExists(dashScoreDistChart);

    let ranges = { '90-100': 0, '80-89': 0, '70-79': 0, '50-69': 0, '0-49': 0 };
    data.forEach(e => {
        const s = parseFloat(e.score) || 0;
        if (s >= 90) ranges['90-100']++;
        else if (s >= 80) ranges['80-89']++;
        else if (s >= 70) ranges['70-79']++;
        else if (s >= 50) ranges['50-69']++;
        else ranges['0-49']++;
    });

    dashScoreDistChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(ranges),
            datasets: [{
                data: Object.values(ranges),
                backgroundColor: ['#2e7d32', '#8bc34a', '#ffeb3b', '#ff9800', '#f44336']
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { position: 'right' } }
        }
    });
}

function renderDashboardGroupAvgChart(data) {
    const ctx = document.getElementById('q-dash-group-avg-chart');
    if (!ctx) return;
    destroyIfExists(dashGroupAvgChart);

    const groups = {};
    data.forEach(e => {
        const g = e.group || 'Tanımsız';
        if (!groups[g]) groups[g] = { t: 0, c: 0 };
        groups[g].t += parseFloat(e.score) || 0;
        groups[g].c++;
    });

    const labels = Object.keys(groups).sort();
    const avgs = labels.map(l => (groups[l].t / groups[l].c).toFixed(1));

    dashGroupAvgChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                data: avgs,
                backgroundColor: '#0e1b42',
                borderRadius: 4
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: { x: { min: 0, max: 100 } }
        },
        plugins: [valueLabelPlugin]
    });
}

function loadTrainingData() {
    const listEl = document.getElementById('q-training-list');
    if (listEl) listEl.innerHTML = 'Yükleniyor...';
    apiCall('getTrainings', {}).then(data => {
        trainingData = data.trainings || [];
        if (listEl) {
            if (trainingData.length === 0) { listEl.innerHTML = '<div style="padding:20px;text-align:center;color:#999">Atanmış eğitim bulunamadı.</div>'; return; }
            listEl.innerHTML = trainingData.map(t => {
                const isCompleted = t.status === 'Tamamlandı';
                return `
                    <div class="training-card ${isCompleted ? 'completed' : ''}">
                        <div class="training-info">
                            <div class="training-title">${escapeHtml(t.title)}</div>
                            <div class="training-meta">Atayan: ${escapeHtml(t.assignedBy)} • Tarih: ${escapeHtml(t.assignedAt)}</div>
                        </div>
                        <div class="training-actions">
                            ${isCompleted ? '<span class="status-badge">Tamamlandı</span>' : `<button class="x-btn" onclick="openTrainingLink('${t.id}', '${t.link}')">Eğitime Git</button>`}
                        </div>
                    </div>`;
            }).join('');
        }
    }).catch(() => { if (listEl) listEl.innerHTML = 'Hata oluştu.'; });
}

function openTrainingLink(id, link) {
    window.open(link, '_blank');
    Swal.fire({
        title: 'Eğitimi Tamamladınız mı?',
        text: 'Eğitimi izlediyseniz/okuduysanız tamamlandı olarak işaretleyebilirsiniz.',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Evet, Tamamladım',
        cancelButtonText: 'Daha Sonra'
    }).then(res => { if (res.isConfirmed) completeTraining(id); });
}

function completeTraining(id) {
    apiCall('completeTraining', { trainingId: id }).then(() => {
        Swal.fire('Başarılı', 'Eğitim tamamlandı olarak işaretlendi.', 'success');
        loadTrainingData();
    });
}

async function assignTrainingPopup() {
    if (!isAdminMode) return;
    const { value: formValues } = await Swal.fire({
        title: 'Eğitim Ata',
        html: `
            <div style="text-align:left">
                <label>Eğitim Başlığı</label><input id="tr-title" class="swal2-input" placeholder="Eğitim adı">
                <label>Eğitim Linki</label><input id="tr-link" class="swal2-input" placeholder="Video veya Sunum linki">
                <label>Hedef Temsilci / Grup</label>
                <select id="tr-target" class="swal2-input">
                    <option value="all">Tüm Temsilciler</option>
                    ${[...new Set(adminUserList.map(u => u.group))].map(g => `<option value="group:${g}">${g} Ekibi</option>`).join('')}
                    ${adminUserList.map(u => `<option value="user:${u.name}">${u.name}</option>`).join('')}
                </select>
            </div>`,
        showCancelButton: true,
        confirmButtonText: 'Ata',
        preConfirm: () => {
            const title = document.getElementById('tr-title').value;
            const link = document.getElementById('tr-link').value;
            const target = document.getElementById('tr-target').value;
            if (!title || !link) { Swal.showValidationMessage('Tüm alanları doldurun'); return false; }
            return { title, link, target };
        }
    });
    if (formValues) {
        Swal.fire({ title: 'Atanıyor...', didOpen: () => Swal.showLoading() });
        apiCall('assignTraining', formValues).then(() => {
            Swal.fire('Başarılı', 'Eğitim atandı.', 'success');
            loadTrainingData();
        });
    }
}

async function fetchFeedbackLogs() {
    try {
        const res = await apiCall("fetchFeedbackLogs", {});
        if (res.result === "success") { feedbackLogsData = res.logs || []; }
        return feedbackLogsData;
    } catch (e) { return []; }
}

function formatPeriod(p) {
    if (!p) return "";
    const parts = p.split('.');
    if (parts.length === 2) return `${parts[0]}.${parts[1]}`;
    return p;
}

async function loadFeedbackList() {
    const listEl = document.getElementById('q-feedback-list');
    if (listEl) listEl.innerHTML = 'Yükleniyor...';

    const evals = await fetchEvaluationsForFeedback();
    const logs = await fetchFeedbackLogs();

    if (listEl) {
        if (evals.length === 0 && logs.length === 0) { listEl.innerHTML = '<div style="padding:20px;text-align:center;color:#999">Veri bulunamadı.</div>'; return; }

        let html = '';
        evals.filter(e => e.feedback && e.feedback !== '-').forEach(e => {
            html += `<div class="feedback-card">
                <div class="feedback-type">📍 Değerlendirme FB</div>
                <div class="feedback-title">${escapeHtml(e.agent)} - ${e.date || ''}</div>
                <div class="feedback-content">${escapeHtml(e.feedback)}</div>
                <div class="feedback-footer">Atayan: ${escapeHtml(e.evaluator || 'Admin')} • Tip: ${escapeHtml(e.feedbackType || 'Sözlü')}</div>
            </div>`;
        });

        logs.forEach(l => {
            html += `<div class="feedback-card manual">
                <div class="feedback-type">📝 Manuel FB</div>
                <div class="feedback-title">${escapeHtml(l.agent)} - ${l.date || ''}</div>
                <div class="feedback-content">${escapeHtml(l.content)}</div>
                <div class="feedback-footer">Atayan: ${escapeHtml(l.admin || 'Admin')}</div>
            </div>`;
        });

        listEl.innerHTML = html || '<div style="padding:20px;text-align:center;color:#999">Kriterlere uygun bildirim yok.</div>';
    }
}

async function fetchEvaluationsForAgent(forcedName, silent = false) {
    const listEl = document.getElementById('evaluations-list');
    if (!silent && listEl) listEl.innerHTML = 'Yükleniyor...';
    const groupSelect = document.getElementById('q-admin-group');
    const agentSelect = document.getElementById('q-admin-agent');
    const periodSelect = document.getElementById('q-eval-month');

    let targetAgent = forcedName || currentUser;
    let targetGroup = 'all';
    if (isAdminMode && agentSelect) { targetAgent = forcedName || agentSelect.value; targetGroup = groupSelect ? groupSelect.value : 'all'; }

    const selectedPeriod = periodSelect ? periodSelect.value : null;

    try {
        const data = await apiCall("fetchEvaluations", { targetAgent, targetGroup, period: selectedPeriod, limit: 300 });
        if (data.result === "success") {
            allEvaluationsData = data.evaluations;
            if (silent) return;
            if (listEl) {
                const filtered = allEvaluationsData.filter(e => !String(e.callId).toUpperCase().startsWith('MANUEL-'));
                if (filtered.length === 0) { listEl.innerHTML = '<p style="padding:20px; text-align:center; color:#666;">Kayıt yok.</p>'; return; }

                let buffer = "";
                filtered.forEach((e, idx) => {
                    const color = e.score >= 90 ? '#2e7d32' : (e.score >= 70 ? '#ed6c02' : '#d32f2f');
                    const isSeen = !!e.isSeen;
                    let badge = (!isSeen && !isAdminMode) ? `<span id="badge-new-${idx}" style="background:#ef5350;color:white;padding:2px 8px;border-radius:12px;font-size:0.7rem;font-weight:bold;margin-left:8px;animation:pulse 2s infinite;">YENİ</span>` : '';
                    if (e.status === 'Bekliyor') badge = `<span style="background:#ff9800;color:white;padding:2px 8px;border-radius:12px;font-size:0.7rem;font-weight:bold;margin-left:8px;">Görüş Bekliyor</span>`;

                    buffer += `
                        <div class="evaluation-summary" id="eval-summary-${idx}" style="border-left:4px solid ${color}; padding:15px; margin-bottom:10px; border-radius:8px; background:#fff; cursor:pointer;" onclick="toggleEvaluationDetail(${idx}, '${e.callId}', ${isSeen}, this)">
                            <div style="display:flex; justify-content:space-between; align-items:center;">
                                <div>
                                    <div style="font-weight:700; color:#2c3e50;">${escapeHtml(e.agent)} ${badge}</div>
                                    <div class="eval-date-info">
                                        <span><i class="fas fa-phone"></i> Çağrı: ${e.callDate || 'N/A'}</span>
                                        <span><i class="fas fa-headphones"></i> Dinlenme: ${e.date || 'N/A'}</span>
                                    </div>
                                    <div style="margin-top:5px;"><span class="eval-id-badge" onclick="event.stopPropagation(); copyText('${escapeHtml(e.callId || '')}')"><i class="fas fa-copy"></i> ${escapeHtml(e.callId || '')}</span></div>
                                </div>
                                <div style="text-align:right;">
                                    ${isAdminMode ? `<i class="fas fa-pen" style="font-size:1rem;color:#fabb00;cursor:pointer;margin-right:8px;" onclick="event.stopPropagation(); editEvaluation('${e.callId}')"></i>` : ''}
                                    <span style="font-weight:800; font-size:1.6rem; color:${color};">${e.score}</span>
                                </div>
                            </div>
                            <div class="evaluation-details-content" id="eval-details-${idx}" style="max-height:0; overflow:hidden; transition: max-height 0.3s ease;">
                                <!-- Detaylar dinamik yüklenecek veya burada hazır -->
                                <div style="margin-top:10px; background:#f8f9fa; padding:10px; border-radius:4px;"><strong>Feedback:</strong> ${escapeHtml(e.feedback || '-')}</div>
                                ${e.agentNote ? `<div style="margin-top:10px; background:#fff3e0; padding:10px; border-radius:6px; border-left:4px solid #ff9800;"><strong>Temsilci Notu:</strong> ${escapeHtml(e.agentNote)}</div>` : ''}
                                ${e.managerReply ? `<div style="margin-top:8px; background:#e8f5e9; padding:10px; border-radius:6px; border-left:4px solid #2e7d32;"><strong>Yönetici Cevabı:</strong> ${escapeHtml(e.managerReply)}</div>` : ''}
                                ${!isAdminMode && e.status !== 'Kapatıldı' ? `<div style="margin-top:15px;text-align:right;"><button class="x-btn" style="background:#f57c00;color:white;" onclick="event.stopPropagation(); openAgentNotePopup('${e.callId}', '${color}', true)">💬 Görüş / Not Ekle</button></div>` : ''}
                                ${isAdminMode && e.agentNote && e.status !== 'Kapatıldı' ? `<div style="margin-top:15px;text-align:right;"><button class="x-btn" style="background:#1976d2;color:white;" onclick="event.stopPropagation(); openAdminReplyPopup('${e.callId}', '${escapeHtml(e.agent)}', '${escapeHtml(e.agentNote)}')"> <i class="fas fa-reply"></i> Yanıtla / Kapat</button></div>` : ''}
                            </div>
                        </div>`;
                });
                listEl.innerHTML = buffer;
            }
        }
    } catch (err) { if (!silent && listEl) listEl.innerHTML = 'Hata oluştu.'; }
}

function toggleEvaluationDetail(index, callId, isAlreadySeen, element) {
    const detailEl = document.getElementById(`eval-details-${index}`);
    if (detailEl.style.maxHeight && detailEl.style.maxHeight !== '0px') {
        detailEl.style.maxHeight = '0px';
        detailEl.style.marginTop = '0';
    } else {
        detailEl.style.maxHeight = '2000px';
        detailEl.style.marginTop = '10px';
        if (!isAlreadySeen && callId && !isAdminMode) {
            apiCall("markEvaluationSeen", { callId });
            const badge = document.getElementById(`badge-new-${index}`);
            if (badge) badge.style.display = 'none';
        }
    }
}

async function fetchUserListForAdmin() {
    try {
        const res = await apiCall("getUserList", {});
        if (res.result === "success") {
            adminUserList = res.users.filter(u => {
                const r = String(u.role || '').toLowerCase().trim();
                return (r === 'user' || r === 'qusers') && u.group !== 'Yönetim';
            });
            return adminUserList;
        }
    } catch (e) { }
    return [];
}

async function fetchCriteria(groupName) {
    try {
        const res = await apiCall("getCriteria", { group: groupName });
        return res.result === "success" ? res.criteria : [];
    } catch (e) { return []; }
}

async function logEvaluationPopup() {
    const agentSelect = document.getElementById('q-admin-agent');
    if (!agentSelect || agentSelect.value === 'all') { Swal.fire('Uyarı', 'Lütfen bir temsilci seçiniz.', 'warning'); return; }
    const agentName = agentSelect.value;
    const foundUser = adminUserList.find(u => u.name === agentName);
    const agentGroup = foundUser ? foundUser.group : 'Genel';

    let criteriaGroup = agentGroup;
    const g = agentGroup.toLowerCase();
    if (g.includes('chat') || g === 'ob') criteriaGroup = 'Chat';
    else if (g.includes('telesat')) criteriaGroup = 'Telesatış';

    Swal.fire({ title: 'Hazırlanıyor...', didOpen: () => Swal.showLoading() });
    const criteriaList = await fetchCriteria(criteriaGroup);
    Swal.close();

    const isChat = criteriaGroup === 'Chat';
    const isTelesatis = criteriaGroup === 'Telesatış';

    let criteriaHtml = '<div class="criteria-container">';
    criteriaList.forEach((c, i) => {
        const pts = parseInt(c.points) || 0;
        if (pts === 0) return;
        if (isChat) {
            const mPts = parseInt(c.mediumScore) || 0, bPts = parseInt(c.badScore) || 0;
            criteriaHtml += `<div class="criteria-row" id="row-${i}" data-max-score="${pts}"><div class="criteria-header"><span>${i + 1}. ${c.text}</span><span style="font-size:0.8rem">Max: ${pts}</span></div><div class="criteria-controls"><div class="eval-button-group"><button class="eval-button eval-good active" onclick="setButtonScore(${i}, ${pts}, ${pts})">İyi</button>${mPts > 0 ? `<button class="eval-button eval-medium" onclick="setButtonScore(${i}, ${mPts}, ${pts})">Orta</button>` : ''}${bPts >= 0 ? `<button class="eval-button eval-bad" onclick="setButtonScore(${i}, ${bPts}, ${pts})">Kötü</button>` : ''}</div><span class="score-badge" id="badge-${i}" style="background:#2e7d32">${pts}</span></div><input type="text" id="note-${i}" class="note-input" placeholder="Not..." style="display:none"></div>`;
        } else if (isTelesatis) {
            criteriaHtml += `<div class="criteria-row" id="row-${i}" data-max-score="${pts}"><div class="criteria-header"><span>${i + 1}. ${c.text}</span><span>Max: ${pts}</span></div><div class="criteria-controls" style="display:flex;align-items:center;gap:15px;background:#f9f9f9"><input type="range" class="slider-input" id="slider-${i}" min="0" max="${pts}" value="${pts}" oninput="updateRowSliderScore(${i}, ${pts})" style="flex-grow:1"><span class="score-badge" id="badge-${i}" style="background:#2e7d32">${pts}</span></div><input type="text" id="note-${i}" class="note-input" placeholder="Not..." style="display:none"></div>`;
        }
    });
    criteriaHtml += '</div>';

    const { value: formValues } = await Swal.fire({
        title: 'Değerlendirme Yap',
        html: `
            <div class="eval-modal-wrapper">
                <div class="score-dashboard"><div><div style="font-size:0.9rem">Temsilci</div><div style="font-size:1.2rem;font-weight:bold;color:#fabb00">${agentName}</div></div><div class="score-circle-outer" id="score-ring"><div class="score-circle-inner" id="live-score">100</div></div></div>
                <div class="eval-header-card"><div><label>Call ID *</label><input id="eval-callid" class="swal2-input" placeholder="Call ID"></div><div><label>Tarih</label><input type="date" id="eval-calldate" class="swal2-input" value="${new Date().toISOString().substring(0, 10)}"></div></div>
                ${criteriaHtml}
                <div style="margin-top:15px"><label>Geri Bildirim Tipi</label><select id="feedback-type" class="swal2-input"><option value="Sözlü">Sözlü</option><option value="Mail">Mail</option></select></div>
                <div style="margin-top:15px"><label>Genel Geri Bildirim</label><textarea id="eval-feedback" class="swal2-textarea"></textarea></div>
            </div>`,
        width: '650px', showCancelButton: true, confirmButtonText: 'Kaydet',
        didOpen: () => { if (isTelesatis) window.recalcTotalSliderScore(); else if (isChat) window.recalcTotalScore(); },
        preConfirm: () => {
            const callId = document.getElementById('eval-callid').value.trim();
            if (!callId) { Swal.showValidationMessage('Call ID gerekli'); return false; }
            const details = []; let total = 0;
            criteriaList.forEach((c, i) => {
                const s = isChat ? parseInt(document.getElementById(`badge-${i}`).innerText) : parseInt(document.getElementById(`slider-${i}`).value);
                total += s; details.push({ q: c.text, max: parseInt(c.points), score: s, note: document.getElementById(`note-${i}`).value });
            });
            return { agentName, agentGroup, callId, callDate: formatDateToDDMMYYYY(document.getElementById('eval-calldate').value), score: total, details: JSON.stringify(details), feedback: document.getElementById('eval-feedback').value, feedbackType: document.getElementById('feedback-type').value };
        }
    });

    if (formValues) {
        Swal.fire({ title: 'Kaydediliyor...', didOpen: () => Swal.showLoading() });
        apiCall("logEvaluation", formValues).then(() => {
            Swal.fire({ icon: 'success', title: 'Kaydedildi', timer: 1500, showConfirmButton: false });
            fetchEvaluationsForAgent(agentName);
        }).catch(err => Swal.fire('Hata', err.message, 'error'));
    }
}

async function editEvaluation(targetCallId) {
    const e = allEvaluationsData.find(x => String(x.callId) === String(targetCallId));
    if (!e) return;
    const agentName = e.agent, agentGroup = e.group || 'Genel';

    let criteriaGroup = agentGroup;
    const g = agentGroup.toLowerCase();
    if (g.includes('chat') || g === 'ob') criteriaGroup = 'Chat';
    else if (g.includes('telesat')) criteriaGroup = 'Telesatış';

    Swal.fire({ title: 'Hazırlanıyor...', didOpen: () => Swal.showLoading() });
    const criteriaList = await fetchCriteria(criteriaGroup);
    Swal.close();

    const isChat = criteriaGroup === 'Chat';
    const isTelesatis = criteriaGroup === 'Telesatış';
    const oldDetails = safeParseDetails(e.details);

    let criteriaHtml = '<div class="criteria-container">';
    criteriaList.forEach((c, i) => {
        const pts = parseInt(c.points) || 0; if (pts === 0) return;
        const old = oldDetails.find(d => d.q === c.text) || { score: pts, note: '' };
        if (isChat) {
            const mPts = parseInt(c.mediumScore) || 0, bPts = parseInt(c.badScore) || 0;
            criteriaHtml += `<div class="criteria-row" id="row-${i}" data-max-score="${pts}"><div class="criteria-header"><span>${c.text}</span><span>Max: ${pts}</span></div><div class="criteria-controls"><div class="eval-button-group"><button class="eval-button eval-good ${old.score == pts ? 'active' : ''}" onclick="setButtonScore(${i}, ${pts}, ${pts})">İyi</button>${mPts > 0 ? `<button class="eval-button eval-medium ${old.score == mPts ? 'active' : ''}" onclick="setButtonScore(${i}, ${mPts}, ${pts})">Orta</button>` : ''}${bPts >= 0 ? `<button class="eval-button eval-bad ${old.score == bPts ? 'active' : ''}" onclick="setButtonScore(${i}, ${bPts}, ${pts})">Kötü</button>` : ''}</div><span class="score-badge" id="badge-${i}">${old.score}</span></div><input type="text" id="note-${i}" class="note-input" value="${old.note}" style="display:${old.score < pts ? 'block' : 'none'}"></div>`;
        } else if (isTelesatis) {
            criteriaHtml += `<div class="criteria-row" id="row-${i}" data-max-score="${pts}"><div class="criteria-header"><span>${c.text}</span><span>Max: ${pts}</span></div><div class="criteria-controls" style="display:flex;background:#f9f9f9"><input type="range" class="slider-input" id="slider-${i}" min="0" max="${pts}" value="${old.score}" oninput="updateRowSliderScore(${i}, ${pts})" style="flex-grow:1"><span class="score-badge" id="badge-${i}">${old.score}</span></div><input type="text" id="note-${i}" class="note-input" value="${old.note}" style="display:${old.score < pts ? 'block' : 'none'}"></div>`;
        }
    });

    const { value: formValues } = await Swal.fire({
        title: 'Düzenle',
        html: `<div class="eval-modal-wrapper"><div class="score-dashboard"><div><div style="font-size:0.9rem">Temsilci</div><div style="font-size:1.2rem;font-weight:bold">${agentName}</div></div><div class="score-circle-outer" id="score-ring"><div class="score-circle-inner" id="live-score">${e.score}</div></div></div><div class="eval-header-card"><div><label>Call ID</label><input class="swal2-input" value="${e.callId}" readonly style="background:#eee"></div><div><label>Tarih</label><input type="date" id="eval-calldate" class="swal2-input" value="${parseDateTRToTS(e.callDate) ? new Date(parseDateTRToTS(e.callDate)).toISOString().substring(0, 10) : ''}"></div></div>${criteriaHtml}<div><label>Feedback</label><textarea id="eval-feedback" class="swal2-textarea">${e.feedback || ''}</textarea></div></div>`,
        width: '650px', showCancelButton: true,
        didOpen: () => { if (isTelesatis) window.recalcTotalSliderScore(); else if (isChat) window.recalcTotalScore(); },
        preConfirm: () => {
            const details = []; let total = 0;
            criteriaList.forEach((c, i) => {
                const s = isChat ? parseInt(document.getElementById(`badge-${idx}`).innerText) : parseInt(document.getElementById(`slider-${i}`).value);
                total += s; details.push({ q: c.text, max: parseInt(c.points), score: s, note: document.getElementById(`note-${i}`).value });
            });
            return { agentName, callId: e.callId, callDate: formatDateToDDMMYYYY(document.getElementById('eval-calldate').value), score: total, details: JSON.stringify(details), feedback: document.getElementById('eval-feedback').value };
        }
    });

    if (formValues) {
        apiCall("updateEvaluation", formValues).then(() => {
            Swal.fire({ icon: 'success', title: 'Güncellendi', timer: 1500, showConfirmButton: false });
            fetchEvaluationsForAgent(agentName);
        }).catch(err => Swal.fire('Hata', err.message, 'error'));
    }
}

async function openAgentNotePopup(callId, color) {
    const e = allEvaluationsData.find(x => x.callId === callId);
    const { value: note } = await Swal.fire({
        title: 'Görüş / İtiraz Bildir',
        input: 'textarea',
        inputPlaceholder: 'Lütfen mesajınızı veya itirazınızı buraya yazınız...',
        inputValue: e?.agentNote || '',
        showCancelButton: true,
        confirmButtonText: 'Gönder',
        preConfirm: (v) => v || ''
    });
    if (note !== undefined) {
        apiCall("submitAgentNote", { callId, note }).then(() => {
            Swal.fire('Başarılı', 'Notunuz iletildi. İncelendikten sonra geri dönüş yapılacaktır.', 'success');
            fetchEvaluationsForAgent(currentUser);
        });
    }
}

async function openAdminReplyPopup(callId, agentName, currentNote) {
    const { value: reply } = await Swal.fire({
        title: 'Temsilci Notunu Yanıtla',
        html: `<div style="text-align:left;background:#fff3e0;padding:12px;border-radius:8px;margin-bottom:15px;font-size:0.9rem"><strong>${agentName}:</strong><br>${escapeHtml(currentNote)}</div>`,
        input: 'textarea',
        inputPlaceholder: 'Cevabınızı yazın...',
        showCancelButton: true,
        confirmButtonText: 'Yanıtla ve Kapat'
    });
    if (reply !== undefined) {
        apiCall("adminReplyToNote", { callId, reply }).then(() => {
            Swal.fire('Başarılı', 'Yanıt iletildi ve kayıt kapatıldı.', 'success');
            fetchEvaluationsForAgent(agentName);
        });
    }
}

async function checkQualityNotifications() {
    if (!currentUser) return;
    try {
        const data = await apiCall("checkNotifications", {});
        const count = data.count || 0;
        const dot = document.getElementById('quality-notif-dot');
        if (dot) dot.style.display = count > 0 ? 'block' : 'none';

        if (count > 0 && !isAdminMode) {
            const { isConfirmed } = await Swal.fire({
                title: 'Yeni Değerlendirme!',
                text: `${count} adet yeni değerlendirmeniz var. İncelemek ister misiniz?`,
                icon: 'info',
                showCancelButton: true,
                confirmButtonText: 'Evet, Göster',
                cancelButtonText: 'Daha Sonra'
            });
            if (isConfirmed) openQualityArea();
        }
    } catch (e) { }
}
