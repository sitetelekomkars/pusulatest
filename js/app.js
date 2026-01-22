/**
 * Pusula - Main Entry & Global State
 * This file coordinates the initialization of modules and holds shared global state.
 */

// --- CONFIGURATION ---
var BAKIM_MODU = false;
var DEBUG = false;
var SCRIPT_URL = localStorage.getItem("PUSULA_SCRIPT_URL") || "https://script.google.com/macros/s/AKfycbyV1ybWkF3thWE08goIQ_kDB4cNYNuidZlxS4V-RibcajHJGL4xEi1Po8LnorztNLmx/exec";

// --- GLOBAL STATE ---
var currentUser = "";
var globalUserIP = "";
var activeRole = "";
var isAdminMode = false;
var isLocAdmin = false;
var isEditingActive = false;
var currentCategory = "home";

// Data Stores
var database = [];
var newsData = [];
var sportsData = [];
var salesScripts = [];
var quizQuestions = [];
var quickDecisionQuestions = [];
var activeCards = [];
var adminUserList = [];
var allEvaluationsData = [];
var trainingData = [];
var feedbackLogsData = [];
var homeBlocks = {};

// Specialized State
var wizardStepsData = {};
var techWizardData = {};

// Chart Instances
var dashboardChart = null;
var dashTrendChart = null;
var dashChannelChart = null;
var dashScoreDistChart = null;
var dashGroupAvgChart = null;
var sessionTimeout = null;

// Constants
var VALID_CATEGORIES = ['Teknik', 'İkna', 'Kampanya', 'Bilgi'];
var MONTH_NAMES = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

// Barrier for data loading
var __dataLoadedResolve;
window.__dataLoadedPromise = new Promise(r => { __dataLoadedResolve = r; });

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
    // Prevent right click as per original requirement
    document.addEventListener('contextmenu', event => event.preventDefault());
    document.onkeydown = function (e) { if (e.keyCode == 123) return false; };

    // Initialize Auth
    updateGlobalAuthFlags();
    checkSession();

    // Fetch IP (Context support)
    fetch('https://ipapi.co/json/')
        .then(r => r.json())
        .then(d => { globalUserIP = `${d.ip} [${d.city || '-'}, ${d.region || '-'}]`; })
        .catch(() => { });
});

// Global error handlers
window.addEventListener('error', function (e) {
    try { if (isAdminMode || isLocAdmin) console.log('[Global Error]', e && (e.error || e.message) ? (e.error || e.message) : e); } catch (_) { }
    try { if (typeof showGlobalError === 'function') showGlobalError('Beklenmeyen hata: ' + (e && e.message ? e.message : 'Bilinmeyen')); } catch (_) { }
});

window.addEventListener('unhandledrejection', function (e) {
    try { if (isAdminMode || isLocAdmin) console.log('[Unhandled Promise]', e && e.reason ? e.reason : e); } catch (_) { }
    try { if (typeof showGlobalError === 'function') showGlobalError('Beklenmeyen hata: ' + (e && e.reason && e.reason.message ? e.reason.message : 'Bilinmeyen')); } catch (_) { }
});
