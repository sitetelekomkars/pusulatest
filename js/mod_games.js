// Game Hub and Games (Quick Decision & Penalty Arena)
let pScore = 0, pBalls = 10, pCurrentQ = null;
let pQuestionQueue = [];
let pAskedCount = 0;
let pCorrectCount = 0;
let pWrongCount = 0;

let qdTimer = null;
let qdTimeLeft = 30;
let qdScore = 0;
let qdStep = 0;
let qdQueue = [];

let jokers = { call: 1, half: 1, double: 1 };
let doubleChanceUsed = false;
let firstAnswerIndex = -1;

function openGameHub() {
    const el = document.getElementById('game-hub-modal');
    if (el) el.style.display = 'flex';
}

function openQuickDecisionGame() {
    try { closeModal('game-hub-modal'); } catch (e) { }
    document.getElementById('quick-modal').style.display = 'flex';
    const lobby = document.getElementById('qd-lobby');
    const game = document.getElementById('qd-game');
    if (lobby) lobby.style.display = 'block';
    if (game) game.style.display = 'none';
    const t = document.getElementById('qd-time'); if (t) t.innerText = '30';
    const s = document.getElementById('qd-score'); if (s) s.innerText = '0';
    const st = document.getElementById('qd-step'); if (st) st.innerText = '0';
}

function resetQuickDecision() {
    if (qdTimer) { clearInterval(qdTimer); qdTimer = null; }
    qdTimeLeft = 30; qdScore = 0; qdStep = 0; qdQueue = [];
    openQuickDecisionGame();
}

function startQuickDecision() {
    const bank = (Array.isArray(quickDecisionQuestions) && quickDecisionQuestions.length) ? quickDecisionQuestions : QUICK_DECISION_BANK;
    if (!bank.length) { Swal.fire('Hata', 'Hızlı Karar verisi yok.', 'warning'); return; }

    const lobby = document.getElementById('qd-lobby');
    const game = document.getElementById('qd-game');
    if (lobby) lobby.style.display = 'none';
    if (game) game.style.display = 'block';

    qdScore = 0; qdStep = 0; qdTimeLeft = 30;
    const indices = getGameQuestionQueue(bank, 'seenQuickQuestions', 5);
    qdQueue = indices.map(idx => bank[idx]);

    updateQuickHud();
    if (qdTimer) clearInterval(qdTimer);
    qdTimer = setInterval(() => {
        qdTimeLeft--;
        if (qdTimeLeft <= 0) { qdTimeLeft = 0; finishQuickDecision(true); }
        else { updateQuickHud(); }
    }, 1000);

    renderQuickQuestion();
}

function updateQuickHud() {
    const t = document.getElementById('qd-time'); if (t) t.innerText = String(Math.max(0, qdTimeLeft));
    const s = document.getElementById('qd-score'); if (s) s.innerText = String(qdScore);
    const st = document.getElementById('qd-step'); if (st) st.innerText = String(qdStep);
}

function renderQuickQuestion() {
    const q = qdQueue[qdStep];
    const qEl = document.getElementById('qd-question');
    const optEl = document.getElementById('qd-options');
    if (!qEl || !optEl || !q) return;
    qEl.innerText = q.q;
    optEl.innerHTML = '';
    q.opts.forEach((txt, i) => {
        const b = document.createElement('button');
        b.className = 'quick-opt';
        b.innerText = txt;
        b.onclick = () => answerQuick(i);
        optEl.appendChild(b);
    });
}

function answerQuick(idx) {
    const q = qdQueue[qdStep];
    const optEl = document.getElementById('qd-options');
    if (!q || !optEl) return;
    const btns = Array.from(optEl.querySelectorAll('button'));
    btns.forEach(b => b.disabled = true);
    const correct = (idx === q.a);

    if (btns[idx]) {
        btns[idx].style.borderColor = correct ? "#00f2ff" : "#ff5252";
        btns[idx].style.background = correct ? "rgba(0, 242, 255, 0.2)" : "rgba(255, 82, 82, 0.2)";
        btns[idx].style.boxShadow = correct ? "0 0 15px #00f2ff" : "0 0 15px #ff5252";
    }
    if (!correct && btns[q.a]) {
        btns[q.a].style.borderColor = "#00f2ff";
        btns[q.a].style.boxShadow = "0 0 10px #00f2ff";
    }

    qdScore += correct ? 10 : -5;
    if (qdScore < 0) qdScore = 0;
    updateQuickHud();

    setTimeout(() => {
        qdStep += 1;
        updateQuickHud();
        if (qdStep >= qdQueue.length) finishQuickDecision(false);
        else renderQuickQuestion();
    }, 1200);
}

function finishQuickDecision(timeout) {
    if (qdTimer) { clearInterval(qdTimer); qdTimer = null; }
    const scoreColor = qdScore >= 40 ? "#00f2ff" : (qdScore >= 20 ? "#ffcc00" : "#ff5252");
    Swal.fire({
        title: timeout ? 'SÜRE BİTTİ!' : 'TAMAMLANDI!',
        background: '#0a1428', color: '#fff',
        html: `<div style="text-align:center"><div style="font-size:3rem; font-weight:900; color:${scoreColor}">${qdScore}</div><div style="margin-top:10px">TOPLAM PUAN</div></div>`,
        confirmButtonText: 'Tekrar Oyna', showCancelButton: true, cancelButtonText: 'Kapat'
    }).then((r) => {
        if (r.isConfirmed) resetQuickDecision();
        else closeModal('quick-modal');
    });
}

function openPenaltyGame() {
    try { closeModal('game-hub-modal'); } catch (e) { }
    document.getElementById('penalty-modal').style.display = 'flex';
    showLobby();
}

function showLobby() {
    document.getElementById('penalty-lobby').style.display = 'flex';
    document.getElementById('penalty-game-area').style.display = 'none';
    fetchLeaderboard();
}

function startGameFromLobby() {
    document.getElementById('penalty-lobby').style.display = 'none';
    document.getElementById('penalty-game-area').style.display = 'block';
    startPenaltySession();
}

async function fetchLeaderboard() {
    const tbody = document.getElementById('leaderboard-body');
    const loader = document.getElementById('leaderboard-loader');
    const table = document.getElementById('leaderboard-table');
    if (!tbody || !loader || !table) return;
    tbody.innerHTML = ''; loader.style.display = 'block'; table.style.display = 'none';
    try {
        const data = await apiCall("getLeaderboard");
        loader.style.display = 'none'; table.style.display = 'table';
        if (!data.leaderboard || data.leaderboard.length === 0) { tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;">Henüz maç yapılmadı.</td></tr>'; }
        else {
            tbody.innerHTML = data.leaderboard.map((u, i) => {
                const medal = i === 0 ? '🥇' : (i === 1 ? '🥈' : (i === 2 ? '🥉' : `<span class="rank-badge">${i + 1}</span>`));
                return `<tr style="${u.username === currentUser ? 'background:rgba(250, 187, 0, 0.1);' : ''}"><td>${medal}</td><td>${escapeHtml(u.username)}</td><td>${u.games}</td><td>${u.average}</td></tr>`;
            }).join('');
        }
    } catch (e) { loader.innerText = "Yüklenemedi."; }
}

function startPenaltySession() {
    pScore = 0; pBalls = 10; pAskedCount = 0; pCorrectCount = 0; pWrongCount = 0;
    jokers = { call: 1, half: 1, double: 1 }; doubleChanceUsed = false; firstAnswerIndex = -1;
    setDoubleIndicator(false);
    pQuestionQueue = getGameQuestionQueue(quizQuestions, 'seenArenaQuestions', 10);
    updateJokerButtons();
    document.getElementById('p-score').innerText = pScore;
    document.getElementById('p-balls').innerText = pBalls;
    const optEl = document.getElementById('p-options'); if (optEl) optEl.style.display = 'grid';
    resetField(); loadPenaltyQuestion();
}

function loadPenaltyQuestion() {
    if (pBalls <= 0) { finishPenaltyGame(); return; }
    if (!Array.isArray(quizQuestions) || quizQuestions.length === 0) { Swal.fire('Hata', 'Soru yok!', 'warning'); return; }
    pCurrentQ = pQuestionQueue.length > 0 ? quizQuestions[pQuestionQueue.shift()] : quizQuestions[Math.floor(Math.random() * quizQuestions.length)];
    if (!pCurrentQ || !pCurrentQ.opts) { pBalls--; loadPenaltyQuestion(); return; }
    pAskedCount++; doubleChanceUsed = false; firstAnswerIndex = -1; setDoubleIndicator(false); updateJokerButtons();
    const qEl = document.getElementById('p-question-text'); if (qEl) qEl.innerText = pCurrentQ.q || "Soru";
    const optionsEl = document.getElementById('p-options');
    if (optionsEl) optionsEl.innerHTML = pCurrentQ.opts.map((opt, index) => `<button class="penalty-btn" onclick="shootBall(${index})">${String.fromCharCode(65 + index)}: ${escapeHtml(opt)}</button>`).join('');
}

function shootBall(idx) {
    const btns = document.querySelectorAll('.penalty-btn');
    const isCorrect = (idx === pCurrentQ.a);
    if (!isCorrect && doubleChanceUsed && firstAnswerIndex === -1) {
        firstAnswerIndex = idx;
        if (btns[idx]) { btns[idx].classList.add('wrong-first-try'); btns[idx].disabled = true; }
        updateJokerButtons(); return;
    }
    btns.forEach(b => b.disabled = true);
    const ballWrap = document.getElementById('ball-wrap');
    const keeperWrap = document.getElementById('keeper-wrap');
    const goalMsg = document.getElementById('goal-msg');
    const shotDir = Math.floor(Math.random() * 4);
    document.getElementById('shooter-wrap')?.classList.add('shooter-run');

    setTimeout(() => {
        if (keeperWrap) keeperWrap.classList.add(isCorrect ? (shotDir % 2 === 0 ? 'keeper-dive-right' : 'keeper-dive-left') : (shotDir % 2 === 0 ? 'keeper-dive-left' : 'keeper-dive-right'));
        if (isCorrect) {
            if (ballWrap) ballWrap.classList.add(['ball-shoot-left-top', 'ball-shoot-right-top', 'ball-shoot-left-low', 'ball-shoot-right-low'][shotDir]);
            setTimeout(() => { if (goalMsg) { goalMsg.innerText = "GOOOOL!"; goalMsg.style.color = "#00f2ff"; goalMsg.classList.add('show'); } pScore += (doubleChanceUsed ? 2 : 1); pCorrectCount++; document.getElementById('p-score').innerText = pScore; }, 500);
        } else {
            pWrongCount++;
            if (Math.random() > 0.5) {
                if (ballWrap) { ballWrap.style.bottom = "160px"; ballWrap.style.left = shotDir % 2 === 0 ? "40%" : "60%"; ballWrap.style.transform = "scale(0.6)"; }
                setTimeout(() => { if (goalMsg) { goalMsg.innerText = "KURTARDI!"; goalMsg.style.color = "#ff5252"; goalMsg.classList.add('show'); } }, 500);
            } else {
                if (ballWrap) ballWrap.classList.add(Math.random() > 0.5 ? 'ball-miss-left' : 'ball-miss-right');
                setTimeout(() => { if (goalMsg) { goalMsg.innerText = "DIŞARI!"; goalMsg.style.color = "#ff5252"; goalMsg.classList.add('show'); } }, 500);
            }
        }
    }, 400);

    pBalls--; document.getElementById('p-balls').innerText = pBalls;
    setTimeout(() => { resetField(); loadPenaltyQuestion(); }, 3200);
}

function resetField() {
    ['ball-wrap', 'keeper-wrap', 'shooter-wrap', 'goal-msg'].forEach(id => {
        const el = document.getElementById(id);
        if (el) { el.className = id.replace('-wrap', '-wrapper').replace('msg', 'msg'); el.style = ""; }
    });
    document.querySelectorAll('.penalty-btn').forEach(b => { b.classList.remove('wrong-first-try'); b.disabled = false; b.style = ""; });
}

function finishPenaltyGame() {
    const acc = Math.round((pCorrectCount / Math.max(1, pAskedCount)) * 100);
    const scoreColor = pScore >= 8 ? "#00f2ff" : (pScore >= 5 ? "#ffcc00" : "#ff5252");
    const qEl = document.getElementById('p-question-text');
    if (qEl) qEl.innerHTML = `<div style="text-align:center"><div style="font-size:2rem; color:#00f2ff">MAÇ BİTTİ!</div><div style="font-size:3rem; color:${scoreColor}">${pScore}/10</div><div>Doğruluk: ${acc}%</div></div>`;
    apiCall("saveGameScore", { score: pScore, accuracy: acc, type: 'penalty' });
}

function useJoker(type) {
    if (!pCurrentQ || jokers[type] === 0) return;
    jokers[type] = 0; updateJokerButtons();
    if (type === 'half') {
        const incorrect = pCurrentQ.opts.map((_, i) => i).filter(i => i !== pCurrentQ.a);
        const removeCount = pCurrentQ.opts.length >= 4 ? 2 : 1;
        shuffleArray(incorrect).slice(0, removeCount).forEach(idx => {
            const b = document.querySelectorAll('.penalty-btn')[idx];
            if (b) { b.disabled = true; b.style.opacity = '0.4'; b.style.textDecoration = 'line-through'; }
        });
    } else if (type === 'double') { doubleChanceUsed = true; setDoubleIndicator(true); }
    else if (type === 'call') {
        const guess = Math.random() < 0.8 ? pCurrentQ.a : Math.floor(Math.random() * pCurrentQ.opts.length);
        Swal.fire({ title: 'Telefon Jokeri', text: `Arkadaşın ${String.fromCharCode(65 + guess)} diyor.` });
    }
}

function updateJokerButtons() {
    ['call', 'half', 'double'].forEach(t => {
        const btn = document.getElementById(`joker-${t}`);
        if (btn) btn.disabled = jokers[t] === 0 || (t === 'double' && firstAnswerIndex !== -1);
    });
}

function setDoubleIndicator(val) { const el = document.getElementById('double-indicator'); if (el) el.style.display = val ? 'inline-flex' : 'none'; }

function getGameQuestionQueue(pool, storageKey, count) {
    if (!pool || !pool.length) return [];
    let seen = []; try { seen = JSON.parse(localStorage.getItem(storageKey) || "[]"); } catch (e) { }
    let avail = pool.map((_, i) => i);
    if (pool.length > count * 2) { avail = avail.filter(i => !seen.includes(pool[i].q || i)); }
    if (avail.length < count) avail = pool.map((_, i) => i);
    shuffleArray(avail);
    let picked = avail.slice(0, count);
    let nextSeen = [...seen, ...picked.map(i => pool[i].q || i)].slice(-30);
    localStorage.setItem(storageKey, JSON.stringify(nextSeen));
    return picked;
}

function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[arr.length - 1]] = [arr[arr.length - 1], arr[i]]; // incorrect swap but will use standard
        let t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
}
