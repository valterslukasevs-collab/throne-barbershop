var token = localStorage.getItem('throne_admin_token') || '';
var appData = { services: {}, masters: {}, schedule: {}, allergens: {}, business: {}, social: {} };
var adminLang = localStorage.getItem('throne_admin_lang') || 'en';

var DAY_LABELS = {
    en: { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' },
    lv: { mon: 'Pirmdiena', tue: 'Otrdiena', wed: 'Trešdiena', thu: 'Ceturtdiena', fri: 'Piektdiena', sat: 'Sestdiena', sun: 'Svētdiena' }
};

var I18N = {
    en: {
        bookings_title: 'Recent Bookings', services_title: 'Services & Prices', masters_title: 'Masters',
        schedule_title: 'Working Hours', allergens_title: 'Allergens', business_title: 'Business Info',
        social_title: 'Social Media Links', col_name_en: 'Name (EN)', col_name_lv: 'Name (LV)',
        th_status: 'Status', th_client: 'Client', th_service: 'Service', th_master: 'Master',
        th_date: 'Date', th_time: 'Time', th_price: 'Price', th_phone: 'Phone',
        lbl_biz_name: 'Business Name', lbl_tagline_en: 'Tagline (EN)', lbl_tagline_lv: 'Tagline (LV)',
        lbl_phone: 'Phone', lbl_address: 'Address', lbl_wa_num: 'WhatsApp Number',
        status_past: 'Past', status_upcoming: 'Upcoming', status_today: 'Today',
        stat_total: 'Total Bookings', stat_upcoming: 'Upcoming', stat_today: 'Today', stat_revenue: 'Total Revenue',
        saved: 'Changes saved!', error_saving: 'Error saving'
    },
    lv: {
        bookings_title: 'Pēdējie pieraksti', services_title: 'Pakalpojumi un cenas', masters_title: 'Meistari',
        schedule_title: 'Darba laiks', allergens_title: 'Alergēni', business_title: 'Uzņēmuma info',
        social_title: 'Sociālo tīklu saites', col_name_en: 'Nosaukums (EN)', col_name_lv: 'Nosaukums (LV)',
        th_status: 'Statuss', th_client: 'Klients', th_service: 'Pakalpojums', th_master: 'Meistars',
        th_date: 'Datums', th_time: 'Laiks', th_price: 'Cena', th_phone: 'Telefons',
        lbl_biz_name: 'Uzņēmuma nosaukums', lbl_tagline_en: 'Sauklis (EN)', lbl_tagline_lv: 'Sauklis (LV)',
        lbl_phone: 'Telefons', lbl_address: 'Adrese', lbl_wa_num: 'WhatsApp numurs',
        status_past: 'Pagājis', status_upcoming: 'Gaidāms', status_today: 'Šodien',
        stat_total: 'Kopā pieraksti', stat_upcoming: 'Gaidāmie', stat_today: 'Šodien', stat_revenue: 'Kopējie ieņēmumi',
        saved: 'Izmaiņas saglabātas!', error_saving: 'Kļūda saglabājot'
    }
};

function t(key) { return (I18N[adminLang] || I18N.en)[key] || (I18N.en)[key] || key; }

function applyLang() {
    document.querySelectorAll('[data-i18n]').forEach(function(el) {
        var key = el.dataset.i18n;
        if (I18N[adminLang] && I18N[adminLang][key]) el.textContent = I18N[adminLang][key];
        else if (I18N.en[key]) el.textContent = I18N.en[key];
    });
    document.getElementById('langEn').classList.toggle('active', adminLang === 'en');
    document.getElementById('langLv').classList.toggle('active', adminLang === 'lv');
    localStorage.setItem('throne_admin_lang', adminLang);
}

// ── AUTH ──
async function doLogin() {
    var pass = document.getElementById('loginPass').value;
    var res = await fetch('/api/admin/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass })
    });
    var data = await res.json();
    if (data.token) {
        token = data.token;
        localStorage.setItem('throne_admin_token', token);
        showDashboard();
    } else {
        var err = document.getElementById('loginError');
        err.style.display = 'block';
        setTimeout(function() { err.style.display = 'none'; }, 3000);
    }
}

function logout() {
    token = '';
    localStorage.removeItem('throne_admin_token');
    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('loginScreen').style.display = 'flex';
}

async function showDashboard() {
    try {
        var res = await fetch('/api/admin/data', { headers: { 'Authorization': 'Bearer ' + token } });
        if (res.status === 401) { logout(); return; }
        appData = await res.json();
        if (!appData.allergens) appData.allergens = {};
        if (!appData.business) appData.business = {};
        if (!appData.social) appData.social = {};
    } catch(e) { logout(); return; }

    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';

    applyLang();
    renderServices();
    renderMasters();
    renderSchedule();
    renderAllergens();
    renderBusiness();
    renderSocial();
    loadBookings();
}

// ── TABS ──
document.getElementById('tabs').addEventListener('click', function(e) {
    var tab = e.target.closest('.tab');
    if (!tab) return;
    document.querySelectorAll('.tab').forEach(function(t) { t.classList.remove('active'); });
    document.querySelectorAll('.panel').forEach(function(p) { p.classList.remove('active'); });
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
});

// ── LANG ──
document.getElementById('langEn').addEventListener('click', function() { adminLang = 'en'; applyLang(); renderSchedule(); });
document.getElementById('langLv').addEventListener('click', function() { adminLang = 'lv'; applyLang(); renderSchedule(); });

// ── SERVICES ──
function renderServices() {
    var el = document.getElementById('servicesList');
    el.innerHTML = '';
    for (var key in appData.services) {
        var s = appData.services[key];
        var div = document.createElement('div');
        div.className = 'form-row';
        div.dataset.key = key;
        div.innerHTML =
            '<input class="input" type="text" value="' + (s.name || '') + '" data-field="name" placeholder="Name EN">' +
            '<input class="input" type="text" value="' + (s.nameLv || '') + '" data-field="nameLv" placeholder="Name LV">' +
            '<input class="input" type="number" value="' + (s.price || 0) + '" data-field="price" min="0" style="text-align:center">' +
            '<input class="input" type="number" value="' + (s.duration || 30) + '" data-field="duration" min="5" style="text-align:center">' +
            '<div class="toggle"><label class="switch"><input type="checkbox" ' + (s.active ? 'checked' : '') + ' data-field="active"><span class="slider"></span></label></div>';
        el.appendChild(div);
    }
}

function collectServices() {
    document.querySelectorAll('#servicesList .form-row').forEach(function(row) {
        var key = row.dataset.key;
        if (!appData.services[key]) return;
        appData.services[key].name = row.querySelector('[data-field="name"]').value;
        appData.services[key].nameLv = row.querySelector('[data-field="nameLv"]').value;
        appData.services[key].price = Number(row.querySelector('[data-field="price"]').value);
        appData.services[key].duration = Number(row.querySelector('[data-field="duration"]').value);
        appData.services[key].active = row.querySelector('[data-field="active"]').checked;
    });
}

// ── MASTERS ──
function renderMasters() {
    var el = document.getElementById('mastersList');
    el.innerHTML = '';
    for (var key in appData.masters) {
        var m = appData.masters[key];
        var div = document.createElement('div');
        div.className = 'master-row';
        div.dataset.key = key;
        div.innerHTML =
            '<input class="input" type="text" value="' + (m.name || '') + '" data-field="name" placeholder="Master name">' +
            '<div class="toggle"><label class="switch"><input type="checkbox" ' + (m.active ? 'checked' : '') + ' data-field="active"><span class="slider"></span></label></div>' +
            '<button class="btn btn-danger btn-sm" data-remove="' + key + '">&#10005;</button>';
        el.appendChild(div);
    }
}

function collectMasters() {
    document.querySelectorAll('#mastersList .master-row').forEach(function(row) {
        var key = row.dataset.key;
        if (!appData.masters[key]) return;
        appData.masters[key].name = row.querySelector('[data-field="name"]').value;
        appData.masters[key].active = row.querySelector('[data-field="active"]').checked;
    });
}

// ── SCHEDULE ──
function renderSchedule() {
    var el = document.getElementById('scheduleList');
    var labels = DAY_LABELS[adminLang] || DAY_LABELS.en;
    el.innerHTML = '';
    for (var day in appData.schedule) {
        var s = appData.schedule[day];
        var div = document.createElement('div');
        div.className = 'sched-row';
        div.dataset.day = day;
        div.innerHTML =
            '<label>' + (labels[day] || day) + '</label>' +
            '<input type="time" value="' + (s.open || '') + '" data-field="open">' +
            '<input type="time" value="' + (s.close || '') + '" data-field="close">' +
            '<div class="toggle"><label class="switch"><input type="checkbox" ' + (s.active ? 'checked' : '') + ' data-field="active"><span class="slider"></span></label></div>';
        el.appendChild(div);
    }
}

function collectSchedule() {
    document.querySelectorAll('#scheduleList .sched-row').forEach(function(row) {
        var day = row.dataset.day;
        if (!appData.schedule[day]) return;
        appData.schedule[day].open = row.querySelector('[data-field="open"]').value;
        appData.schedule[day].close = row.querySelector('[data-field="close"]').value;
        appData.schedule[day].active = row.querySelector('[data-field="active"]').checked;
    });
}

// ── ALLERGENS ──
function renderAllergens() {
    var el = document.getElementById('allergensList');
    el.innerHTML = '';
    for (var key in appData.allergens) {
        var a = appData.allergens[key];
        var div = document.createElement('div');
        div.className = 'allergen-row';
        div.dataset.key = key;
        div.innerHTML =
            '<input class="input" type="text" value="' + (a.name || '') + '" data-field="name" placeholder="Name EN">' +
            '<input class="input" type="text" value="' + (a.nameLv || '') + '" data-field="nameLv" placeholder="Name LV">' +
            '<div class="toggle"><label class="switch"><input type="checkbox" ' + (a.active ? 'checked' : '') + ' data-field="active"><span class="slider"></span></label></div>' +
            '<button class="btn btn-danger btn-sm" data-remove-allergen="' + key + '">&#10005;</button>';
        el.appendChild(div);
    }
}

function collectAllergens() {
    document.querySelectorAll('#allergensList .allergen-row').forEach(function(row) {
        var key = row.dataset.key;
        if (!appData.allergens[key]) return;
        appData.allergens[key].name = row.querySelector('[data-field="name"]').value;
        appData.allergens[key].nameLv = row.querySelector('[data-field="nameLv"]').value;
        appData.allergens[key].active = row.querySelector('[data-field="active"]').checked;
    });
}

// ── BUSINESS ──
function renderBusiness() {
    var b = appData.business || {};
    document.getElementById('bizName').value = b.name || '';
    document.getElementById('bizTaglineEn').value = b.taglineEn || '';
    document.getElementById('bizTaglineLv').value = b.taglineLv || '';
    document.getElementById('bizPhone').value = b.phone || '';
    document.getElementById('bizEmail').value = b.email || '';
    document.getElementById('bizAddress').value = b.address || '';
    document.getElementById('bizWhatsapp').value = b.whatsapp || '';
}

function collectBusiness() {
    appData.business = {
        name: document.getElementById('bizName').value,
        taglineEn: document.getElementById('bizTaglineEn').value,
        taglineLv: document.getElementById('bizTaglineLv').value,
        phone: document.getElementById('bizPhone').value,
        email: document.getElementById('bizEmail').value,
        address: document.getElementById('bizAddress').value,
        whatsapp: document.getElementById('bizWhatsapp').value
    };
}

// ── SOCIAL ──
function renderSocial() {
    var s = appData.social || {};
    document.getElementById('socialInstagram').value = s.instagram || '';
    document.getElementById('socialFacebook').value = s.facebook || '';
    document.getElementById('socialWhatsapp').value = s.whatsapp || '';
}

function collectSocial() {
    appData.social = {
        instagram: document.getElementById('socialInstagram').value,
        facebook: document.getElementById('socialFacebook').value,
        whatsapp: document.getElementById('socialWhatsapp').value
    };
}

// ── BOOKINGS ──
var allBookings = [];

async function loadBookings() {
    try {
        var res = await fetch('/api/admin/bookings', { headers: { 'Authorization': 'Bearer ' + token } });
        if (res.status === 401) { logout(); return; }
        allBookings = await res.json();
        renderBookings(allBookings);
    } catch (e) { console.error(e); }
}

function renderBookings(bookings) {
    var now = new Date();
    var totalRevenue = 0, upcoming = 0, todayCount = 0;
    var todayStr = now.toISOString().slice(0, 10);

    bookings.forEach(function(b) {
        totalRevenue += Number(b.Price) || 0;
        var bDate = b.Date || '';
        if (bDate > todayStr) upcoming++;
        if (bDate === todayStr) { todayCount++; upcoming++; }
    });

    document.getElementById('bookingStats').innerHTML =
        '<div class="stat"><div class="stat-value">' + bookings.length + '</div><div class="stat-label">' + t('stat_total') + '</div></div>' +
        '<div class="stat"><div class="stat-value">' + upcoming + '</div><div class="stat-label">' + t('stat_upcoming') + '</div></div>' +
        '<div class="stat"><div class="stat-value">' + todayCount + '</div><div class="stat-label">' + t('stat_today') + '</div></div>' +
        '<div class="stat"><div class="stat-value">&euro;' + totalRevenue + '</div><div class="stat-label">' + t('stat_revenue') + '</div></div>';

    var tbody = document.getElementById('bookingsBody');
    tbody.innerHTML = '';
    bookings.slice(0, 100).forEach(function(b) {
        var bDate = b.Date || '';
        var isToday = bDate === todayStr;
        var isPast = bDate < todayStr;
        var statusClass = isToday ? 'badge-today' : (isPast ? 'badge-past' : 'badge-future');
        var statusText = isToday ? t('status_today') : (isPast ? t('status_past') : t('status_upcoming'));
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td><span class="badge ' + statusClass + '">' + statusText + '</span></td>' +
            '<td><strong>' + (b['Client Name'] || '') + '</strong><br><small style="color:var(--sub)">' + (b.Email || '') + '</small></td>' +
            '<td>' + (b.Service || '') + '</td>' +
            '<td>' + (b.Master || '') + '</td>' +
            '<td>' + bDate + '</td>' +
            '<td>' + (b.Time || '') + '</td>' +
            '<td style="color:var(--accent);font-weight:600">&euro;' + (b.Price || '0') + '</td>' +
            '<td>' + (b.Phone || '') + '</td>';
        tbody.appendChild(tr);
    });
}

// ── EXPORT CSV ──
function exportCsv() {
    if (!allBookings.length) return;
    var headers = ['Status', 'Client Name', 'Email', 'Service', 'Master', 'Date', 'Time', 'Price', 'Phone'];
    var todayStr = new Date().toISOString().slice(0, 10);
    var rows = [headers.join(',')];
    allBookings.forEach(function(b) {
        var bDate = b.Date || '';
        var status = bDate === todayStr ? 'Today' : (bDate < todayStr ? 'Past' : 'Upcoming');
        rows.push([status, b['Client Name'], b.Email, b.Service, b.Master, bDate, b.Time, b.Price, b.Phone]
            .map(function(v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }).join(','));
    });
    var blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'throne-bookings-' + todayStr + '.csv';
    a.click();
}

// ── SAVE ──
async function saveAll() {
    collectServices();
    collectMasters();
    collectSchedule();
    collectAllergens();
    collectBusiness();
    collectSocial();

    var res = await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(appData)
    });

    showToast(res.ok ? t('saved') : t('error_saving'));
}

function showToast(msg) {
    var el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(function() { el.classList.remove('show'); }, 2500);
}

// ── EVENT LISTENERS ──
document.getElementById('loginBtn').addEventListener('click', doLogin);
document.getElementById('loginPass').addEventListener('keydown', function(e) { if (e.key === 'Enter') doLogin(); });
document.getElementById('saveBtn').addEventListener('click', saveAll);
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('exportCsvBtn').addEventListener('click', exportCsv);

document.getElementById('addServiceBtn').addEventListener('click', function() {
    appData.services['svc-' + Date.now()] = { name: '', nameLv: '', price: 0, duration: 30, active: true };
    renderServices();
});

document.getElementById('addMasterBtn').addEventListener('click', function() {
    appData.masters['master-' + Date.now()] = { name: '', active: true };
    renderMasters();
});

document.getElementById('addAllergenBtn').addEventListener('click', function() {
    appData.allergens['alg-' + Date.now()] = { name: '', nameLv: '', active: true };
    renderAllergens();
});

document.getElementById('mastersList').addEventListener('click', function(e) {
    var btn = e.target.closest('[data-remove]');
    if (!btn) return;
    delete appData.masters[btn.dataset.remove];
    renderMasters();
});

document.getElementById('allergensList').addEventListener('click', function(e) {
    var btn = e.target.closest('[data-remove-allergen]');
    if (!btn) return;
    delete appData.allergens[btn.dataset.removeAllergen];
    renderAllergens();
});

// ── INIT ──
if (token) { showDashboard(); }
else { document.getElementById('loginScreen').style.display = 'flex'; }
