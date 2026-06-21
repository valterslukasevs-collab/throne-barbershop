var token = localStorage.getItem('throne_admin_token') || '';
var appData = { services: {}, masters: {}, schedule: {}, allergens: {}, business: {}, social: {}, content: {} };
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
        saved: 'Changes saved!', error_saving: 'Error saving',
        cnt_hero: 'Hero Section', cnt_hero_img: 'Hero Background Image URL',
        cnt_subtitle_en: 'Subtitle (EN)', cnt_subtitle_lv: 'Subtitle (LV)',
        cnt_tagline_en: 'Tagline (EN)', cnt_tagline_lv: 'Tagline (LV)',
        cnt_about: 'About Section', cnt_about_img: 'About Image URL',
        cnt_about_title_en: 'Title (EN)', cnt_about_title_lv: 'Title (LV)',
        cnt_about_em_en: 'Title Italic (EN)', cnt_about_em_lv: 'Title Italic (LV)',
        cnt_text1_en: 'Paragraph 1 (EN)', cnt_text1_lv: 'Paragraph 1 (LV)',
        cnt_text2_en: 'Paragraph 2 (EN)', cnt_text2_lv: 'Paragraph 2 (LV)',
        cnt_stat_clients: 'Clients Count', cnt_stat_years: 'Years Experience',
        cnt_stat_rating: 'Google Rating',
        cnt_masters: 'Masters Profiles', cnt_gallery: 'Gallery', cnt_reviews: 'Reviews',
        cnt_photo: 'Photo URL', cnt_role_en: 'Role (EN)', cnt_role_lv: 'Role (LV)',
        cnt_bio_en: 'Bio (EN)', cnt_bio_lv: 'Bio (LV)',
        cnt_review_en: 'Review (EN)', cnt_review_lv: 'Review (LV)',
        cnt_reviewer: 'Reviewer Name', cnt_avatar: 'Avatar Letter',
        cnt_meta_en: 'Meta (EN)', cnt_meta_lv: 'Meta (LV)', cnt_stars: 'Stars',
        settings_title: 'Settings',
        cloud_desc: 'Cloudinary is used for photo uploads. Create a free account at cloudinary.com, then enter your Cloud Name and create an unsigned Upload Preset.',
        change_password_title: 'Change Admin Password',
        current_password: 'Current Password',
        new_password: 'New Password (min 8 chars)',
        change_password_btn: 'Change Password',
        password_changed: 'Password changed! Please log in again.',
        password_error: 'Error changing password'
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
        saved: 'Izmaiņas saglabātas!', error_saving: 'Kļūda saglabājot',
        cnt_hero: 'Hero sekcija', cnt_hero_img: 'Hero fona attēla URL',
        cnt_subtitle_en: 'Apakšvirsraksts (EN)', cnt_subtitle_lv: 'Apakšvirsraksts (LV)',
        cnt_tagline_en: 'Sauklis (EN)', cnt_tagline_lv: 'Sauklis (LV)',
        cnt_about: 'Par mums sekcija', cnt_about_img: 'Par mums attēla URL',
        cnt_about_title_en: 'Virsraksts (EN)', cnt_about_title_lv: 'Virsraksts (LV)',
        cnt_about_em_en: 'Virsraksts kursīvā (EN)', cnt_about_em_lv: 'Virsraksts kursīvā (LV)',
        cnt_text1_en: '1. rindkopa (EN)', cnt_text1_lv: '1. rindkopa (LV)',
        cnt_text2_en: '2. rindkopa (EN)', cnt_text2_lv: '2. rindkopa (LV)',
        cnt_stat_clients: 'Klientu skaits', cnt_stat_years: 'Gadi pieredzē',
        cnt_stat_rating: 'Google vērtējums',
        cnt_masters: 'Meistaru profili', cnt_gallery: 'Galerija', cnt_reviews: 'Atsauksmes',
        cnt_photo: 'Foto URL', cnt_role_en: 'Loma (EN)', cnt_role_lv: 'Loma (LV)',
        cnt_bio_en: 'Bio (EN)', cnt_bio_lv: 'Bio (LV)',
        cnt_review_en: 'Atsauksme (EN)', cnt_review_lv: 'Atsauksme (LV)',
        cnt_reviewer: 'Vērtētāja vārds', cnt_avatar: 'Avatāra burts',
        cnt_meta_en: 'Meta (EN)', cnt_meta_lv: 'Meta (LV)', cnt_stars: 'Zvaigznes',
        settings_title: 'Iestatījumi',
        cloud_desc: 'Cloudinary tiek izmantots foto augšupielādei. Izveidojiet bezmaksas kontu cloudinary.com, tad ievadiet Cloud Name un izveidojiet unsigned Upload Preset.',
        change_password_title: 'Mainīt administratora paroli',
        current_password: 'Pašreizējā parole',
        new_password: 'Jaunā parole (min 8 simboli)',
        change_password_btn: 'Mainīt paroli',
        password_changed: 'Parole nomainīta! Lūdzu, piesakieties vēlreiz.',
        password_error: 'Kļūda mainot paroli'
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
        if (!appData.cloudinary) appData.cloudinary = {};
        if (!appData.content) appData.content = {};
        if (!appData.content.hero) appData.content.hero = {};
        if (!appData.content.about) appData.content.about = {};
        if (!appData.content.masters) appData.content.masters = [];
        if (!appData.content.gallery) appData.content.gallery = [];
        if (!appData.content.reviews) appData.content.reviews = [];
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
    renderSettings();
    renderContent();
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

// ── SETTINGS (Cloudinary) ──
function renderSettings() {
    var cl = appData.cloudinary || {};
    document.getElementById('cloudName').value = cl.cloudName || '';
    document.getElementById('cloudPreset').value = cl.uploadPreset || '';
}

function collectSettings() {
    appData.cloudinary = {
        cloudName: document.getElementById('cloudName').value.trim(),
        uploadPreset: document.getElementById('cloudPreset').value.trim()
    };
}

function uploadToCloudinary(file, targetInput) {
    var cl = appData.cloudinary || {};
    var cloudName = document.getElementById('cloudName').value.trim() || cl.cloudName;
    var preset = document.getElementById('cloudPreset').value.trim() || cl.uploadPreset;

    if (!cloudName || !preset) {
        showToast('Set Cloudinary settings in Settings tab first');
        return;
    }

    var btn = targetInput.closest('.upload-row') ? targetInput.closest('.upload-row').querySelector('.upload-btn') : null;
    if (btn) { btn.classList.add('uploading'); btn.textContent = 'Uploading...'; }

    var fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', preset);

    fetch('https://api.cloudinary.com/v1_1/' + cloudName + '/image/upload', {
        method: 'POST',
        body: fd
    })
    .then(function(r) { return r.json(); })
    .then(function(data) {
        if (data.secure_url) {
            targetInput.value = data.secure_url;
            showToast('Photo uploaded!');
        } else {
            showToast('Upload error: ' + (data.error ? data.error.message : 'unknown'));
        }
    })
    .catch(function(e) {
        showToast('Upload failed: ' + e.message);
    })
    .finally(function() {
        if (btn) { btn.classList.remove('uploading'); btn.innerHTML = '&#8686; Upload<input type="file" accept="image/*" class="upload-hidden">'; }
    });
}

// ── CONTENT ──
function renderContent() {
    var c = appData.content || {};
    var h = c.hero || {};
    var a = c.about || {};

    document.getElementById('cntHeroImage').value = h.image || '';
    document.getElementById('cntSubtitleEn').value = h.subtitleEn || '';
    document.getElementById('cntSubtitleLv').value = h.subtitleLv || '';
    document.getElementById('cntTaglineEn').value = h.taglineEn || '';
    document.getElementById('cntTaglineLv').value = h.taglineLv || '';

    document.getElementById('cntAboutImage').value = a.image || '';
    document.getElementById('cntAboutTitleEn').value = a.titleEn || '';
    document.getElementById('cntAboutTitleLv').value = a.titleLv || '';
    document.getElementById('cntAboutEmEn').value = a.titleEmEn || '';
    document.getElementById('cntAboutEmLv').value = a.titleEmLv || '';
    document.getElementById('cntText1En').value = a.text1En || '';
    document.getElementById('cntText1Lv').value = a.text1Lv || '';
    document.getElementById('cntText2En').value = a.text2En || '';
    document.getElementById('cntText2Lv').value = a.text2Lv || '';
    document.getElementById('cntStatClients').value = a.statClients || 0;
    document.getElementById('cntStatYears').value = a.statYears || 0;
    document.getElementById('cntStatRating').value = a.statRating || '5.0';

    renderContentMasters();
    renderGallery();
    renderReviews();
}

function renderContentMasters() {
    var el = document.getElementById('contentMastersList');
    el.innerHTML = '';
    var masters = appData.content.masters || [];
    masters.forEach(function(m, i) {
        var div = document.createElement('div');
        div.className = 'cnt-master-block';
        div.dataset.idx = i;
        div.innerHTML =
            '<div class="cnt-master-head"><strong>' + (m.name || 'Master ' + (i+1)) + '</strong><button class="btn btn-danger btn-sm" data-remove-cnt-master="' + i + '">&#10005;</button></div>' +
            '<div class="field-full"><label>' + t('cnt_photo') + '</label><div class="upload-row"><input class="input" type="url" value="' + esc(m.photo) + '" data-field="photo"><label class="upload-btn">&#8686; Upload<input type="file" accept="image/*" class="upload-hidden" data-upload-field="photo"></label></div></div>' +
            '<div class="field-row"><div><label>Name</label><input class="input" type="text" value="' + esc(m.name) + '" data-field="name"></div>' +
            '<div><label>ID</label><input class="input" type="text" value="' + esc(m.id) + '" data-field="id"></div></div>' +
            '<div class="field-row"><div><label>' + t('cnt_role_en') + '</label><input class="input" type="text" value="' + esc(m.roleEn) + '" data-field="roleEn"></div>' +
            '<div><label>' + t('cnt_role_lv') + '</label><input class="input" type="text" value="' + esc(m.roleLv) + '" data-field="roleLv"></div></div>' +
            '<div class="field-full"><label>' + t('cnt_bio_en') + '</label><textarea class="input" rows="2" data-field="bioEn">' + esc(m.bioEn) + '</textarea></div>' +
            '<div class="field-full"><label>' + t('cnt_bio_lv') + '</label><textarea class="input" rows="2" data-field="bioLv">' + esc(m.bioLv) + '</textarea></div>';
        el.appendChild(div);
    });
}

function renderGallery() {
    var el = document.getElementById('galleryList');
    el.innerHTML = '';
    var gallery = appData.content.gallery || [];
    gallery.forEach(function(g, i) {
        var div = document.createElement('div');
        div.className = 'gallery-row';
        div.dataset.idx = i;
        div.innerHTML =
            '<div class="upload-row" style="grid-column:1"><input class="input" type="url" value="' + esc(g.image) + '" data-field="image" placeholder="Image URL"><label class="upload-btn">&#8686; Upload<input type="file" accept="image/*" class="upload-hidden" data-upload-field="image"></label></div>' +
            '<input class="input" type="text" value="' + esc(g.label) + '" data-field="label" placeholder="Label">' +
            '<button class="btn btn-danger btn-sm" data-remove-gallery="' + i + '">&#10005;</button>';
        el.appendChild(div);
    });
}

function renderReviews() {
    var el = document.getElementById('reviewsList');
    el.innerHTML = '';
    var reviews = appData.content.reviews || [];
    reviews.forEach(function(r, i) {
        var div = document.createElement('div');
        div.className = 'review-block';
        div.dataset.idx = i;
        div.innerHTML =
            '<div class="review-head"><strong>' + esc(r.name || 'Review ' + (i+1)) + '</strong><button class="btn btn-danger btn-sm" data-remove-review="' + i + '">&#10005;</button></div>' +
            '<div class="field-full"><label>' + t('cnt_review_en') + '</label><textarea class="input" rows="2" data-field="textEn">' + esc(r.textEn) + '</textarea></div>' +
            '<div class="field-full"><label>' + t('cnt_review_lv') + '</label><textarea class="input" rows="2" data-field="textLv">' + esc(r.textLv) + '</textarea></div>' +
            '<div class="field-row"><div><label>' + t('cnt_reviewer') + '</label><input class="input" type="text" value="' + esc(r.name) + '" data-field="name"></div>' +
            '<div><label>' + t('cnt_avatar') + '</label><input class="input" type="text" value="' + esc(r.avatar) + '" data-field="avatar" maxlength="1" style="width:60px"></div></div>' +
            '<div class="field-row"><div><label>' + t('cnt_meta_en') + '</label><input class="input" type="text" value="' + esc(r.metaEn) + '" data-field="metaEn"></div>' +
            '<div><label>' + t('cnt_meta_lv') + '</label><input class="input" type="text" value="' + esc(r.metaLv) + '" data-field="metaLv"></div></div>' +
            '<div class="field-full"><label>' + t('cnt_stars') + '</label><input class="input" type="number" value="' + (r.stars || 5) + '" data-field="stars" min="1" max="5" style="width:80px"></div>';
        el.appendChild(div);
    });
}

function esc(s) { return String(s || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

function collectContent() {
    appData.content.hero = {
        image: document.getElementById('cntHeroImage').value,
        subtitleEn: document.getElementById('cntSubtitleEn').value,
        subtitleLv: document.getElementById('cntSubtitleLv').value,
        taglineEn: document.getElementById('cntTaglineEn').value,
        taglineLv: document.getElementById('cntTaglineLv').value
    };
    appData.content.about = {
        image: document.getElementById('cntAboutImage').value,
        titleEn: document.getElementById('cntAboutTitleEn').value,
        titleLv: document.getElementById('cntAboutTitleLv').value,
        titleEmEn: document.getElementById('cntAboutEmEn').value,
        titleEmLv: document.getElementById('cntAboutEmLv').value,
        text1En: document.getElementById('cntText1En').value,
        text1Lv: document.getElementById('cntText1Lv').value,
        text2En: document.getElementById('cntText2En').value,
        text2Lv: document.getElementById('cntText2Lv').value,
        statClients: Number(document.getElementById('cntStatClients').value),
        statYears: Number(document.getElementById('cntStatYears').value),
        statRating: document.getElementById('cntStatRating').value
    };

    appData.content.masters = [];
    document.querySelectorAll('#contentMastersList .cnt-master-block').forEach(function(block) {
        appData.content.masters.push({
            id: block.querySelector('[data-field="id"]').value,
            photo: block.querySelector('[data-field="photo"]').value,
            name: block.querySelector('[data-field="name"]').value,
            roleEn: block.querySelector('[data-field="roleEn"]').value,
            roleLv: block.querySelector('[data-field="roleLv"]').value,
            bioEn: block.querySelector('[data-field="bioEn"]').value,
            bioLv: block.querySelector('[data-field="bioLv"]').value
        });
    });

    appData.content.gallery = [];
    document.querySelectorAll('#galleryList .gallery-row').forEach(function(row) {
        appData.content.gallery.push({
            image: row.querySelector('[data-field="image"]').value,
            label: row.querySelector('[data-field="label"]').value
        });
    });

    appData.content.reviews = [];
    document.querySelectorAll('#reviewsList .review-block').forEach(function(block) {
        appData.content.reviews.push({
            textEn: block.querySelector('[data-field="textEn"]').value,
            textLv: block.querySelector('[data-field="textLv"]').value,
            name: block.querySelector('[data-field="name"]').value,
            avatar: block.querySelector('[data-field="avatar"]').value,
            metaEn: block.querySelector('[data-field="metaEn"]').value,
            metaLv: block.querySelector('[data-field="metaLv"]').value,
            stars: Number(block.querySelector('[data-field="stars"]').value)
        });
    });
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
    collectSettings();
    collectContent();

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

document.getElementById('changePasswordBtn').addEventListener('click', async function() {
    var cur = document.getElementById('currentPassword').value;
    var nw = document.getElementById('newPassword').value;
    if (!cur || !nw) { showToast('Fill in both fields'); return; }
    if (nw.length < 8) { showToast('Password must be at least 8 characters'); return; }
    try {
        var res = await fetch('/api/admin/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
            body: JSON.stringify({ currentPassword: cur, newPassword: nw })
        });
        var data = await res.json();
        if (res.ok) {
            showToast(t('password_changed'));
            setTimeout(function() { logout(); }, 1500);
        } else {
            showToast(data.message || t('password_error'));
        }
    } catch(e) {
        showToast(t('password_error'));
    }
    document.getElementById('currentPassword').value = '';
    document.getElementById('newPassword').value = '';
});

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

document.getElementById('addContentMasterBtn').addEventListener('click', function() {
    appData.content.masters.push({ id: 'master-' + Date.now(), photo: '', name: '', roleEn: '', roleLv: '', bioEn: '', bioLv: '' });
    renderContentMasters();
});

document.getElementById('addGalleryBtn').addEventListener('click', function() {
    appData.content.gallery.push({ image: '', label: '' });
    renderGallery();
});

document.getElementById('addReviewBtn').addEventListener('click', function() {
    appData.content.reviews.push({ textEn: '', textLv: '', name: '', avatar: '', metaEn: '', metaLv: '', stars: 5 });
    renderReviews();
});

document.getElementById('contentMastersList').addEventListener('click', function(e) {
    var btn = e.target.closest('[data-remove-cnt-master]');
    if (!btn) return;
    collectContent();
    appData.content.masters.splice(Number(btn.dataset.removeCntMaster), 1);
    renderContentMasters();
});

document.getElementById('galleryList').addEventListener('click', function(e) {
    var btn = e.target.closest('[data-remove-gallery]');
    if (!btn) return;
    collectContent();
    appData.content.gallery.splice(Number(btn.dataset.removeGallery), 1);
    renderGallery();
});

document.getElementById('reviewsList').addEventListener('click', function(e) {
    var btn = e.target.closest('[data-remove-review]');
    if (!btn) return;
    collectContent();
    appData.content.reviews.splice(Number(btn.dataset.removeReview), 1);
    renderReviews();
});

// ── UPLOAD HANDLER ──
document.addEventListener('change', function(e) {
    if (!e.target.matches('.upload-hidden')) return;
    var file = e.target.files[0];
    if (!file) return;

    var targetId = e.target.closest('[data-upload-target]');
    var targetInput;
    if (targetId) {
        targetInput = document.getElementById(targetId.dataset.uploadTarget);
    } else {
        var row = e.target.closest('.upload-row');
        if (row) targetInput = row.querySelector('.input[type="url"], .input[data-field]');
    }

    if (targetInput) uploadToCloudinary(file, targetInput);
    e.target.value = '';
});

// ── INIT ──
if (token) { showDashboard(); }
else { document.getElementById('loginScreen').style.display = 'flex'; }
