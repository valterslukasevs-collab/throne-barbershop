/* ═══════════════════════════════════════════════
   THRONE — Booking Wizard Logic
   Multi-step form, date/time picker, API webhook
   ═══════════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

    // ─── CONFIG ───
    const N8N_WEBHOOK_URL = '/api/book';

    const MASTERS = {
        marcus: 'Marcus Reid',
        alex:   'Alex Stone',
        daniel: 'Daniel Cruz',
        any:    'Any Available'
    };

    const MASTERS_LV = {
        marcus: 'Marcus Reid',
        alex:   'Alex Stone',
        daniel: 'Daniel Cruz',
        any:    'Jebkurš brīvais'
    };

    const SERVICES = {
        'royal-haircut':   { name: 'Royal Haircut',    nameLv: 'Karaliskais griezums',      price: 25, duration: 45 },
        'full-throne':     { name: 'The Full Throne',  nameLv: 'Pilnais Throne',             price: 45, duration: 90 },
        'beard-sculpting': { name: 'Beard Sculpting',  nameLv: 'Bārdas veidošana',           price: 20, duration: 30 },
        'hot-towel-shave': { name: 'Hot Towel Shave',  nameLv: 'Karstā dvieļa skūšana',     price: 30, duration: 40 },
        'hair-design':     { name: 'Hair Design',      nameLv: 'Matu dizains',               price: 15, duration: 20 },
        'junior-king':     { name: 'Junior King',      nameLv: 'Jaunais karalis',            price: 15, duration: 30 },
    };

    const ALLERGEN_NAMES = {
        'latex':            'Latex',
        'fragrance':        'Fragrances',
        'ppd':              'PPD (Hair Dye)',
        'nut-oils':         'Nut Oils',
        'essential-oils':   'Essential Oils',
        'sulfates':         'Sulfates/SLS',
        'ammonia':          'Ammonia',
        'propylene-glycol': 'Propylene Glycol',
    };

    // ─── I18N HELPERS ───
    function getLang() {
        return document.documentElement.lang || 'en';
    }

    const MONTH_NAMES = {
        en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
        lv: ['Janvāris','Februāris','Marts','Aprīlis','Maijs','Jūnijs','Jūlijs','Augusts','Septembris','Oktobris','Novembris','Decembris']
    };

    const DAY_NAMES = {
        en: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        lv: ['Pr','Ot','Tr','Ce','Pk','Se','Sv']
    };

    const TEXTS = {
        en: {
            continue: 'Continue',
            back: 'Back',
            confirmBooking: 'Confirm Booking',
            selectDateFirst: 'Select a date first',
            noSlots: 'No available slots for this service duration',
            satSchedule: (d) => `Saturday: 10:00–18:00 | Service: ${d} min`,
            weekSchedule: (d) => `Mon–Fri: 9:00–20:00 | Service: ${d} min`,
            with: 'with',
        },
        lv: {
            continue: 'Turpināt',
            back: 'Atpakaļ',
            confirmBooking: 'Apstiprināt pierakstu',
            selectDateFirst: 'Vispirms izvēlieties datumu',
            noSlots: 'Nav pieejamu laiku šim pakalpojuma ilgumam',
            satSchedule: (d) => `Sestdiena: 10:00–18:00 | Pakalpojums: ${d} min`,
            weekSchedule: (d) => `Pr–Pk: 9:00–20:00 | Pakalpojums: ${d} min`,
            with: 'ar',
        }
    };

    function t(key) {
        return TEXTS[getLang()]?.[key] || TEXTS.en[key];
    }

    // ─── STATE ───
    let currentStep = 1;
    const totalSteps = 5;
    let booking = {
        service: null,
        master: null,
        date: null,
        time: null,
        name: '',
        phone: '',
        email: '',
        allergens: [],
        notes: ''
    };

    // ─── Pre-fill master from URL ───
    const params = new URLSearchParams(window.location.search);
    const presetMaster = params.get('master');
    if (presetMaster && MASTERS[presetMaster]) {
        const radio = document.querySelector(`input[name="master"][value="${presetMaster}"]`);
        if (radio) {
            radio.checked = true;
            booking.master = presetMaster;
        }
    }

    // ─── ELEMENTS ───
    const steps      = document.querySelectorAll('.booking__step');
    const stepBtns   = document.querySelectorAll('.step[data-step]');
    const stepLines  = document.querySelectorAll('.step__line');
    const prevBtn    = document.getElementById('prevBtn');
    const nextBtn    = document.getElementById('nextBtn');
    const bookingNav = document.getElementById('bookingNav');
    const success    = document.getElementById('bookingSuccess');

    // ─── NAVIGATION ───
    function goToStep(n) {
        if (n < 1 || n > totalSteps) return;

        // Validate current step before moving forward
        if (n > currentStep && !validateStep(currentStep)) return;

        currentStep = n;
        updateStepUI();

        // Pre-fill confirmation on step 5
        if (currentStep === 5) fillConfirmation();
    }

    function updateStepUI() {
        const lang = getLang();

        // Steps
        steps.forEach(s => {
            s.classList.toggle('active', parseInt(s.dataset.step) === currentStep);
        });

        // Progress indicators
        stepBtns.forEach((btn, i) => {
            const stepNum = parseInt(btn.dataset.step);
            btn.classList.toggle('active', stepNum === currentStep);
            btn.classList.toggle('done', stepNum < currentStep);
        });

        // Progress lines
        stepLines.forEach((line, i) => {
            line.classList.toggle('filled', i + 1 < currentStep);
        });

        // Nav buttons
        prevBtn.disabled = currentStep === 1;
        prevBtn.style.visibility = currentStep === 1 ? 'hidden' : 'visible';

        if (currentStep === totalSteps) {
            nextBtn.textContent = t('confirmBooking');
            nextBtn.classList.add('confirm-btn');
        } else {
            nextBtn.textContent = t('continue');
            nextBtn.classList.remove('confirm-btn');
        }

        // Hide nav on success
        bookingNav.style.display = success.classList.contains('active') ? 'none' : 'flex';

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function validateStep(step) {
        switch (step) {
            case 1:
                booking.service = document.querySelector('input[name="service"]:checked')?.value;
                if (!booking.service) {
                    shakeElement('.service-select');
                    return false;
                }
                return true;

            case 2:
                booking.master = document.querySelector('input[name="master"]:checked')?.value;
                if (!booking.master) {
                    shakeElement('.master-select');
                    return false;
                }
                return true;

            case 3:
                if (!booking.date || !booking.time) {
                    shakeElement('.datetime-select');
                    return false;
                }
                return true;

            case 4:
                const name  = document.getElementById('clientName').value.trim();
                const phone = document.getElementById('clientPhone').value.trim();
                const email = document.getElementById('clientEmail').value.trim();

                if (!name || !phone || !email) {
                    shakeElement('.details-form');
                    return false;
                }

                booking.name  = name;
                booking.phone = phone;
                booking.email = email;
                booking.notes = document.getElementById('clientNotes').value.trim();

                // Collect allergens
                booking.allergens = [];
                document.querySelectorAll('input[name="allergens"]:checked').forEach(cb => {
                    booking.allergens.push(cb.value);
                });

                return true;

            default:
                return true;
        }
    }

    function shakeElement(selector) {
        const el = document.querySelector(selector);
        if (!el) return;
        el.style.animation = 'shake 0.4s ease';
        setTimeout(() => { el.style.animation = ''; }, 400);
    }

    // Add shake keyframes
    const style = document.createElement('style');
    style.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-4px)}80%{transform:translateX(4px)}}`;
    document.head.appendChild(style);

    // Button handlers
    nextBtn.addEventListener('click', () => {
        if (currentStep === totalSteps) {
            submitBooking();
        } else {
            goToStep(currentStep + 1);
        }
    });

    prevBtn.addEventListener('click', () => {
        goToStep(currentStep - 1);
    });


    // ─── DATE PICKER ───
    let weekOffset = 0;
    const dateDays = document.getElementById('dateDays');
    const dateMonth = document.getElementById('dateMonth');

    function renderDays() {
        dateDays.innerHTML = '';
        const lang = getLang();
        const today = new Date();
        today.setHours(0,0,0,0);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() + weekOffset * 7);

        // Adjust to Monday
        const dayOfWeek = startOfWeek.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startOfWeek.setDate(startOfWeek.getDate() + mondayOffset);

        const monthNames = MONTH_NAMES[lang] || MONTH_NAMES.en;
        const dayNamesArr = DAY_NAMES[lang] || DAY_NAMES.en;

        dateMonth.textContent = monthNames[startOfWeek.getMonth()] + ' ' + startOfWeek.getFullYear();

        for (let i = 0; i < 7; i++) {
            const d = new Date(startOfWeek);
            d.setDate(startOfWeek.getDate() + i);

            const btn = document.createElement('button');
            btn.className = 'day-btn';
            btn.type = 'button';

            const isPast = d < today;
            const isSunday = d.getDay() === 0;

            btn.innerHTML = `
                <span class="day-btn__name">${dayNamesArr[i]}</span>
                <span class="day-btn__num">${d.getDate()}</span>
            `;

            if (isPast || isSunday) {
                btn.disabled = true;
            } else {
                const dateStr = d.toISOString().split('T')[0];
                btn.dataset.date = dateStr;

                if (booking.date === dateStr) btn.classList.add('selected');

                btn.addEventListener('click', () => {
                    document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    booking.date = dateStr;
                    renderTimeSlots();
                });
            }

            dateDays.appendChild(btn);
        }
    }

    document.getElementById('prevWeek').addEventListener('click', () => {
        if (weekOffset > 0) { weekOffset--; renderDays(); }
    });

    document.getElementById('nextWeek').addEventListener('click', () => {
        if (weekOffset < 4) { weekOffset++; renderDays(); }
    });

    renderDays();


    // ─── TIME SLOTS ───
    const timeSlots = document.getElementById('timeSlots');

    function renderTimeSlots() {
        timeSlots.innerHTML = '';
        booking.time = null; // reset time when date changes

        if (!booking.date) {
            timeSlots.innerHTML = `<p style="color:var(--text-dim);font-size:0.8rem;grid-column:1/-1;text-align:center;">${t('selectDateFirst')}</p>`;
            return;
        }

        // Get selected service duration
        const selectedService = booking.service ? SERVICES[booking.service] : null;
        const duration = selectedService ? selectedService.duration : 45;

        // Working hours depend on day
        const selectedDate = new Date(booking.date);
        const dayOfWeek = selectedDate.getDay();
        const isSaturday = dayOfWeek === 6;

        const startHour = isSaturday ? 10 : 9;
        const endHour   = isSaturday ? 18 : 20;

        const slots = [];
        for (let h = startHour; h < endHour; h++) {
            for (let m = 0; m < 60; m += 30) {
                const slotMinutes = h * 60 + m;
                const endMinutes  = slotMinutes + duration;
                const closingMinutes = endHour * 60;

                if (endMinutes > closingMinutes) continue;

                const hour = String(h).padStart(2, '0');
                const min  = String(m).padStart(2, '0');
                slots.push(`${hour}:${min}`);
            }
        }

        if (slots.length === 0) {
            timeSlots.innerHTML = `<p style="color:var(--accent);font-size:0.8rem;grid-column:1/-1;text-align:center;">${t('noSlots')}</p>`;
            return;
        }

        // Simulate some unavailable slots
        const dateHash = booking.date.split('-').reduce((a, b) => a + parseInt(b), 0);

        slots.forEach((slot, i) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'time-slot';
            btn.textContent = slot;

            const isTaken = (dateHash + i) % 5 === 0;

            if (isTaken) {
                btn.disabled = true;
            } else {
                if (booking.time === slot) btn.classList.add('selected');

                btn.addEventListener('click', () => {
                    document.querySelectorAll('.time-slot').forEach(b => b.classList.remove('selected'));
                    btn.classList.add('selected');
                    booking.time = slot;
                });
            }

            timeSlots.appendChild(btn);
        });

        // Show schedule info
        const info = document.createElement('p');
        info.style.cssText = 'color:var(--text-dim);font-size:0.7rem;grid-column:1/-1;text-align:center;margin-top:8px;';
        const texts = TEXTS[getLang()] || TEXTS.en;
        info.textContent = isSaturday
            ? texts.satSchedule(duration)
            : texts.weekSchedule(duration);
        timeSlots.appendChild(info);
    }

    renderTimeSlots();


    // ─── FILL CONFIRMATION ───
    function fillConfirmation() {
        const svc = SERVICES[booking.service];
        const lang = getLang();

        document.getElementById('confirmService').textContent = lang === 'lv' ? (svc?.nameLv || '—') : (svc?.name || '—');
        document.getElementById('confirmMaster').textContent = (lang === 'lv' ? MASTERS_LV : MASTERS)[booking.master] || '—';
        document.getElementById('confirmDate').textContent = booking.date ? new Date(booking.date).toLocaleDateString(lang === 'lv' ? 'lv-LV' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' }) : '—';
        document.getElementById('confirmTime').textContent = booking.time || '—';
        document.getElementById('confirmDuration').textContent = svc ? svc.duration + ' min' : '—';
        document.getElementById('confirmClient').textContent = booking.name || '—';
        document.getElementById('confirmTotal').textContent = svc ? '€' + svc.price : '—';

        // Allergens
        const allergenRow = document.getElementById('confirmAllergenRow');
        if (booking.allergens.length > 0) {
            allergenRow.style.display = 'flex';
            document.getElementById('confirmAllergens').textContent = booking.allergens.map(a => ALLERGEN_NAMES[a] || a).join(', ');
        } else {
            allergenRow.style.display = 'none';
        }
    }


    // ─── SUBMIT BOOKING ───
    async function submitBooking() {
        const svc = SERVICES[booking.service];
        const lang = getLang();

        const payload = {
            service:       svc?.name,
            service_id:    booking.service,
            price:         svc?.price,
            duration:      svc?.duration,
            master:        MASTERS[booking.master],
            master_id:     booking.master,
            date:          booking.date,
            time:          booking.time,
            client_name:   booking.name,
            client_phone:  booking.phone,
            client_email:  booking.email,
            allergens:     booking.allergens.map(a => ALLERGEN_NAMES[a] || a),
            notes:         booking.notes,
            booked_at:     new Date().toISOString(),
            lang:          lang
        };

        console.log('📋 Booking payload:', payload);

        // Show success immediately
        showSuccess(payload);

        // Send to webhook (fire and forget)
        try {
            await fetch(N8N_WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            console.log('✅ Webhook sent successfully');
        } catch (err) {
            console.log('⚠️ Webhook not configured or unreachable:', err.message);
        }
    }

    function showSuccess(payload) {
        const lang = getLang();

        // Hide wizard steps and nav
        steps.forEach(s => s.classList.remove('active'));
        bookingNav.style.display = 'none';
        document.querySelector('.booking__progress').style.display = 'none';

        // Show success
        success.classList.add('active');

        // Fill success details
        const details = document.getElementById('successDetails');
        details.innerHTML = `
            <strong>${payload.service}</strong> ${t('with')} ${payload.master}<br>
            📅 ${new Date(payload.date).toLocaleDateString(lang === 'lv' ? 'lv-LV' : 'en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}<br>
            🕐 ${payload.time}<br>
            💰 €${payload.price}
        `;
    }


    // ─── LANGUAGE CHANGE LISTENER ───
    // Re-render all dynamic content when language changes
    window.addEventListener('throne-lang-change', () => {
        renderDays();
        renderTimeSlots();
        updateStepUI();

        // Re-fill confirmation if on step 5
        if (currentStep === 5) fillConfirmation();
    });


    // Initial UI
    updateStepUI();

});
