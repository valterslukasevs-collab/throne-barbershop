let token = localStorage.getItem('throne_admin_token') || '';
let appData = { services: {}, masters: {}, schedule: {} };

const DAY_LABELS = { mon: 'Monday', tue: 'Tuesday', wed: 'Wednesday', thu: 'Thursday', fri: 'Friday', sat: 'Saturday', sun: 'Sunday' };

// ── AUTH ──
async function doLogin() {
    const pass = document.getElementById('loginPass').value;
    const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pass })
    });
    const data = await res.json();
    if (data.token) {
        token = data.token;
        localStorage.setItem('throne_admin_token', token);
        showDashboard();
    } else {
        const err = document.getElementById('loginError');
        err.style.display = 'block';
        setTimeout(() => err.style.display = 'none', 3000);
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
        const res = await fetch('/api/admin/data', { headers: { 'Authorization': 'Bearer ' + token } });
        if (res.status === 401) { logout(); return; }
        appData = await res.json();
    } catch { logout(); return; }

    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';

    renderServices();
    renderMasters();
    renderSchedule();
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
            '<input type="text" value="' + s.name + '" data-field="name" placeholder="Name EN">' +
            '<input type="text" value="' + s.nameLv + '" data-field="nameLv" placeholder="Name LV">' +
            '<input type="number" value="' + s.price + '" data-field="price" min="0" style="text-align:center">' +
            '<input type="number" value="' + s.duration + '" data-field="duration" min="5" style="text-align:center">' +
            '<div class="toggle"><label class="switch"><input type="checkbox" ' + (s.active ? 'checked' : '') + ' data-field="active"><span class="slider"></span></label></div>';
        el.appendChild(div);
    }
}

function addService() {
    var id = 'svc-' + Date.now();
    appData.services[id] = { name: '', nameLv: '', price: 0, duration: 30, active: true };
    renderServices();
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
            '<input type="text" value="' + m.name + '" data-field="name" placeholder="Master name">' +
            '<div class="toggle"><label class="switch"><input type="checkbox" ' + (m.active ? 'checked' : '') + ' data-field="active"><span class="slider"></span></label></div>' +
            '<button class="btn btn-danger btn-sm" data-remove="' + key + '">&#10005;</button>';
        el.appendChild(div);
    }
}

function addMaster() {
    var id = 'master-' + Date.now();
    appData.masters[id] = { name: '', active: true };
    renderMasters();
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
    el.innerHTML = '';
    for (var day in appData.schedule) {
        var s = appData.schedule[day];
        var div = document.createElement('div');
        div.className = 'sched-row';
        div.dataset.day = day;
        div.innerHTML =
            '<label>' + (DAY_LABELS[day] || day) + '</label>' +
            '<input type="time" value="' + s.open + '" data-field="open">' +
            '<input type="time" value="' + s.close + '" data-field="close">' +
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

// ── BOOKINGS ──
async function loadBookings() {
    try {
        var res = await fetch('/api/admin/bookings', { headers: { 'Authorization': 'Bearer ' + token } });
        if (res.status === 401) { logout(); return; }
        var bookings = await res.json();
        renderBookings(bookings);
    } catch (e) { console.error(e); }
}

function renderBookings(bookings) {
    var now = new Date();
    var totalRevenue = 0;
    var upcoming = 0;
    var todayCount = 0;
    var todayStr = now.toISOString().slice(0, 10);

    bookings.forEach(function(b) {
        totalRevenue += Number(b.Price) || 0;
        var bDate = b.Date || '';
        if (bDate >= todayStr) upcoming++;
        if (bDate === todayStr) todayCount++;
    });

    document.getElementById('bookingStats').innerHTML =
        '<div class="stat"><div class="stat-value">' + bookings.length + '</div><div class="stat-label">Total Bookings</div></div>' +
        '<div class="stat"><div class="stat-value">' + upcoming + '</div><div class="stat-label">Upcoming</div></div>' +
        '<div class="stat"><div class="stat-value">' + todayCount + '</div><div class="stat-label">Today</div></div>' +
        '<div class="stat"><div class="stat-value">&euro;' + totalRevenue + '</div><div class="stat-label">Total Revenue</div></div>';

    var tbody = document.getElementById('bookingsBody');
    tbody.innerHTML = '';
    bookings.slice(0, 50).forEach(function(b) {
        var bDate = b.Date || '';
        var isPast = bDate < todayStr;
        var tr = document.createElement('tr');
        tr.innerHTML =
            '<td><span class="badge ' + (isPast ? 'badge-past' : 'badge-future') + '">' + (isPast ? 'Past' : 'Upcoming') + '</span></td>' +
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

// ── SAVE ──
async function saveAll() {
    collectServices();
    collectMasters();
    collectSchedule();

    var res = await fetch('/api/admin/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
        body: JSON.stringify(appData)
    });

    if (res.ok) {
        showToast('Changes saved!');
    } else {
        showToast('Error saving');
    }
}

function showToast(msg) {
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    setTimeout(function() { t.classList.remove('show'); }, 2500);
}

// ── EVENT LISTENERS ──
document.getElementById('loginBtn').addEventListener('click', doLogin);
document.getElementById('loginPass').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') doLogin();
});
document.getElementById('saveBtn').addEventListener('click', saveAll);
document.getElementById('logoutBtn').addEventListener('click', logout);
document.getElementById('addServiceBtn').addEventListener('click', addService);
document.getElementById('addMasterBtn').addEventListener('click', addMaster);

// Delegated click for remove master buttons
document.getElementById('mastersList').addEventListener('click', function(e) {
    var btn = e.target.closest('[data-remove]');
    if (!btn) return;
    delete appData.masters[btn.dataset.remove];
    renderMasters();
});

// ── INIT ──
if (token) {
    showDashboard();
} else {
    document.getElementById('loginScreen').style.display = 'flex';
}
