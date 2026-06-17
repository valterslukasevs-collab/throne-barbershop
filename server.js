/* ═══════════════════════════════════════════════
   THRONE — Booking Backend Server
   Telegram + Gmail + CSV logging + Reminders
   ═══════════════════════════════════════════════ */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');
const url = require('url');
const nodemailer = require('nodemailer');

// ─── LOAD .env (manual parser, no dotenv dependency) ───
(function loadEnv() {
    try {
        const envPath = path.join(__dirname, '.env');
        const content = fs.readFileSync(envPath, 'utf8');
        for (const line of content.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eqIdx = trimmed.indexOf('=');
            if (eqIdx === -1) continue;
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim();
            if (!process.env[key]) process.env[key] = val;
        }
    } catch (e) {
        console.log('  ⚠️  No .env file found, using defaults/environment');
    }
})();

// ─── CONFIG ───
const PORT = 3000;
const TG_TOKEN = process.env.TG_TOKEN || '';
const MASTER_CHAT_ID = process.env.MASTER_CHAT_ID || '';
const GMAIL_USER = process.env.GMAIL_USER || '';
const GMAIL_APP_PASS = process.env.GMAIL_APP_PASS || '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

// ─── SMS CONFIG ───
// Sender number/ID that clients will see
const SMS_SENDER = '2668111';
// SMS API provider - set your API key below
// Options: 'textbelt' (free 1/day), 'twilio', 'smsLv'
const SMS_PROVIDER = process.env.SMS_PROVIDER || 'twilio';
const SMS_API_KEY = process.env.SMS_API_KEY || '';
// Twilio credentials
const TWILIO_SID = process.env.TWILIO_SID || '';
const TWILIO_TOKEN = process.env.TWILIO_TOKEN || '';
const TWILIO_FROM = process.env.TWILIO_FROM || '';

// ─── RATE LIMITER (in-memory, per IP) ───
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 5;       // max requests
const RATE_LIMIT_WINDOW = 60000; // per 1 minute

function isRateLimited(ip) {
    const now = Date.now();
    let entry = rateLimitMap.get(ip);
    if (!entry) {
        entry = { timestamps: [] };
        rateLimitMap.set(ip, entry);
    }
    // Remove timestamps outside the window
    entry.timestamps = entry.timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
    if (entry.timestamps.length >= RATE_LIMIT_MAX) return true;
    entry.timestamps.push(now);
    return false;
}

// Clean up old entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of rateLimitMap) {
        entry.timestamps = entry.timestamps.filter(t => now - t < RATE_LIMIT_WINDOW);
        if (entry.timestamps.length === 0) rateLimitMap.delete(ip);
    }
}, 300000);

// ─── INPUT VALIDATION ───
const MAX_BODY_SIZE = 10 * 1024; // 10 KB
const MAX_STRING_LENGTH = 500;

function sanitizeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');
}

function validateBooking(b) {
    const errors = [];
    const requiredStrings = ['client_name', 'client_phone', 'client_email', 'service', 'master', 'date', 'time'];
    for (const field of requiredStrings) {
        if (!b[field]) { errors.push(`Missing required field: ${field}`); continue; }
        if (typeof b[field] !== 'string') { errors.push(`${field} must be a string`); continue; }
        if (b[field].length > MAX_STRING_LENGTH) { errors.push(`${field} exceeds max length of ${MAX_STRING_LENGTH}`); }
    }
    const requiredNumbers = ['price', 'duration'];
    for (const field of requiredNumbers) {
        if (b[field] === undefined || b[field] === null) { errors.push(`Missing required field: ${field}`); continue; }
        if (typeof b[field] !== 'number' && typeof b[field] !== 'string') { errors.push(`${field} must be a number`); continue; }
        if (isNaN(Number(b[field]))) { errors.push(`${field} must be a valid number`); }
    }
    if (b.allergens && !Array.isArray(b.allergens)) errors.push('allergens must be an array');
    if (b.notes && typeof b.notes !== 'string') errors.push('notes must be a string');
    if (b.notes && b.notes.length > MAX_STRING_LENGTH) errors.push(`notes exceeds max length of ${MAX_STRING_LENGTH}`);
    // Basic email format check
    if (b.client_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(b.client_email)) errors.push('Invalid email format');
    // Phone format: digits, spaces, dashes, parens, optional leading +
    if (b.client_phone && !/^\+?[\d\s\-()]{6,20}$/.test(b.client_phone)) errors.push('Invalid phone format');
    // Date format: YYYY-MM-DD
    if (b.date && !/^\d{4}-\d{2}-\d{2}$/.test(b.date)) errors.push('Invalid date format (YYYY-MM-DD)');
    // Time format: HH:MM
    if (b.time && !/^\d{2}:\d{2}$/.test(b.time)) errors.push('Invalid time format (HH:MM)');
    return errors;
}

function sanitizeBooking(b) {
    return {
        ...b,
        client_name: sanitizeHtml(b.client_name),
        client_phone: sanitizeHtml(b.client_phone),
        client_email: sanitizeHtml(b.client_email),
        service: sanitizeHtml(b.service),
        master: sanitizeHtml(b.master),
        date: sanitizeHtml(b.date),
        time: sanitizeHtml(b.time),
        price: Number(b.price),
        duration: Number(b.duration),
        booked_at: b.booked_at ? sanitizeHtml(b.booked_at) : new Date().toISOString(),
        allergens: Array.isArray(b.allergens) ? b.allergens.map(a => sanitizeHtml(String(a))) : [],
        notes: b.notes ? sanitizeHtml(String(b.notes)) : ''
    };
}

// ─── EMAIL TRANSPORTER ───
const mailer = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_APP_PASS
    }
});

// Verify on startup
mailer.verify((err) => {
    if (err) console.log('  ❌ Gmail error:', err.message);
    else console.log('  ✅ Gmail connected!');
});

// ─── MIME TYPES ───
const MIME = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
    '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg',
    '.svg': 'image/svg+xml', '.ico': 'image/x-icon',
};

// ─── TELEGRAM HELPER ───
function sendTelegram(chatId, text) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' });
        const req = https.request({
            hostname: 'api.telegram.org',
            path: `/bot${TG_TOKEN}/sendMessage`,
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
        }, (res) => {
            let body = '';
            res.on('data', c => body += c);
            res.on('end', () => {
                const r = JSON.parse(body);
                r.ok ? resolve(r) : reject(r);
                console.log(r.ok ? `  ✅ TG sent to ${chatId}` : `  ❌ TG: ${r.description}`);
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

// ─── SMS HELPER ───
async function sendSMS(phone, message) {
    // Normalize phone: ensure +371 prefix for Latvia
    let to = phone.replace(/[\s\-\(\)]/g, '');
    if (!to.startsWith('+')) {
        if (to.startsWith('371')) to = '+' + to;
        else to = '+371' + to;
    }

    try {
        if (SMS_PROVIDER === 'textbelt') {
            // TextBelt — free 1 SMS/day, or paid
            const data = JSON.stringify({
                phone: to,
                message: message,
                key: SMS_API_KEY,
                sender: SMS_SENDER
            });

            return new Promise((resolve, reject) => {
                const req = https.request({
                    hostname: 'textbelt.com',
                    path: '/text',
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
                }, (res) => {
                    let body = '';
                    res.on('data', c => body += c);
                    res.on('end', () => {
                        const r = JSON.parse(body);
                        if (r.success) {
                            console.log(`  ✅ SMS sent to ${to}`);
                            resolve(r);
                        } else {
                            console.log(`  ❌ SMS error: ${r.error || r.message || 'Unknown'}`);
                            reject(r);
                        }
                    });
                });
                req.on('error', (e) => { console.log(`  ❌ SMS error: ${e.message}`); reject(e); });
                req.write(data);
                req.end();
            });

        } else if (SMS_PROVIDER === 'twilio') {
            // Twilio
            const data = `To=${encodeURIComponent(to)}&From=${encodeURIComponent(TWILIO_FROM)}&Body=${encodeURIComponent(message)}`;
            const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');

            return new Promise((resolve, reject) => {
                const req = https.request({
                    hostname: 'api.twilio.com',
                    path: `/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': `Basic ${auth}`,
                        'Content-Length': Buffer.byteLength(data)
                    }
                }, (res) => {
                    let body = '';
                    res.on('data', c => body += c);
                    res.on('end', () => {
                        const r = JSON.parse(body);
                        if (r.sid) {
                            console.log(`  ✅ SMS sent to ${to} (Twilio)`);
                            resolve(r);
                        } else {
                            console.log(`  ❌ SMS Twilio error: ${r.message || 'Unknown'}`);
                            reject(r);
                        }
                    });
                });
                req.on('error', (e) => { console.log(`  ❌ SMS error: ${e.message}`); reject(e); });
                req.write(data);
                req.end();
            });

        } else if (SMS_PROVIDER === 'smsLv') {
            // SMS.lv API (Latvian provider)
            const data = JSON.stringify({
                to: to,
                message: message,
                sender: SMS_SENDER
            });

            return new Promise((resolve, reject) => {
                const req = https.request({
                    hostname: 'api.sms.lv',
                    path: '/send',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${SMS_API_KEY}`,
                        'Content-Length': Buffer.byteLength(data)
                    }
                }, (res) => {
                    let body = '';
                    res.on('data', c => body += c);
                    res.on('end', () => {
                        console.log(`  ✅ SMS sent to ${to} (SMS.lv)`);
                        resolve(JSON.parse(body));
                    });
                });
                req.on('error', (e) => { console.log(`  ❌ SMS error: ${e.message}`); reject(e); });
                req.write(data);
                req.end();
            });
        }
    } catch (err) {
        console.log(`  ❌ SMS failed: ${err.message}`);
    }
}

// ─── EMAIL HELPER ───
async function sendEmail(to, subject, html) {
    try {
        await mailer.sendMail({
            from: `"THRONE Barbershop" <${GMAIL_USER}>`,
            to,
            subject,
            html
        });
        console.log(`  ✅ Email sent to ${to}`);
    } catch (err) {
        console.log(`  ❌ Email error: ${err.message}`);
    }
}

// ─── EMAIL TEMPLATES ───
function emailConfirmation(b) {
    return `
    <div style="font-family:'Helvetica',sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f0eb;padding:40px;border-radius:16px">
        <div style="text-align:center;margin-bottom:30px">
            <div style="display:inline-block;background:#C8A96E;color:#0a0a0a;font-weight:bold;font-size:20px;width:48px;height:48px;line-height:48px;border-radius:10px">T</div>
            <h1 style="font-size:13px;letter-spacing:5px;margin-top:14px;color:#f5f0eb">THRONE</h1>
        </div>
        <h2 style="font-size:22px;font-weight:300;text-align:center;margin-bottom:30px;color:#f5f0eb">Booking Confirmed ✓</h2>
        <div style="background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px">
            <table style="width:100%;border-collapse:collapse;color:#f5f0eb">
                <tr><td style="padding:10px 0;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1.5px">Service</td><td style="padding:10px 0;text-align:right;font-weight:500">${b.service}</td></tr>
                <tr style="border-top:1px solid rgba(255,255,255,0.06)"><td style="padding:10px 0;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1.5px">Master</td><td style="padding:10px 0;text-align:right">${b.master}</td></tr>
                <tr style="border-top:1px solid rgba(255,255,255,0.06)"><td style="padding:10px 0;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1.5px">Date</td><td style="padding:10px 0;text-align:right">${b.date}</td></tr>
                <tr style="border-top:1px solid rgba(255,255,255,0.06)"><td style="padding:10px 0;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1.5px">Time</td><td style="padding:10px 0;text-align:right">${b.time}</td></tr>
                <tr style="border-top:1px solid rgba(255,255,255,0.06)"><td style="padding:10px 0;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1.5px">Duration</td><td style="padding:10px 0;text-align:right">${b.duration} min</td></tr>
                ${b.allergens && b.allergens.length > 0 ? `<tr style="border-top:1px solid rgba(255,255,255,0.06)"><td style="padding:10px 0;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1.5px">Allergens</td><td style="padding:10px 0;text-align:right;color:#e8a040">${b.allergens.join(', ')}</td></tr>` : ''}
                <tr style="border-top:2px solid #C8A96E"><td style="padding:14px 0;color:#C8A96E;font-size:13px;text-transform:uppercase;letter-spacing:1.5px;font-weight:600">Total</td><td style="padding:14px 0;text-align:right;font-size:22px;font-weight:bold;color:#C8A96E">&euro;${b.price}</td></tr>
            </table>
        </div>
        <div style="text-align:center;margin-top:24px">
            <p style="font-size:13px;color:#888;margin-bottom:8px">You will receive reminders:</p>
            <p style="font-size:12px;color:#666">📩 24 hours before &nbsp;|&nbsp; 📩 1 hour before</p>
        </div>
        <p style="text-align:center;margin-top:24px;font-size:11px;color:#444">123 King Street, City Center &nbsp;|&nbsp; +371 20 000 000</p>
        <p style="text-align:center;margin-top:8px;font-size:10px;color:#333">THRONE — Where Kings Are Made 👑</p>
    </div>`;
}

function emailReminder(b, timeLabel) {
    return `
    <div style="font-family:'Helvetica',sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f0eb;padding:40px;border-radius:16px">
        <div style="text-align:center;margin-bottom:24px">
            <div style="display:inline-block;background:#C8A96E;color:#0a0a0a;font-weight:bold;font-size:20px;width:48px;height:48px;line-height:48px;border-radius:10px">T</div>
            <h1 style="font-size:13px;letter-spacing:5px;margin-top:14px;color:#f5f0eb">THRONE</h1>
        </div>
        <h2 style="font-size:20px;font-weight:300;text-align:center;margin-bottom:24px;color:#f5f0eb">⏰ Appointment ${timeLabel}</h2>
        <div style="background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;text-align:center">
            <p style="font-size:16px;margin-bottom:16px;color:#f5f0eb">Hi <strong>${b.client_name}</strong>,</p>
            <p style="font-size:14px;color:#ccc;margin-bottom:20px">Your appointment is <strong style="color:#C8A96E">${timeLabel}</strong></p>
            <table style="width:100%;border-collapse:collapse;color:#f5f0eb;text-align:left">
                <tr><td style="padding:8px 0;color:#888;font-size:11px;text-transform:uppercase">Service</td><td style="padding:8px 0;text-align:right">${b.service}</td></tr>
                <tr style="border-top:1px solid rgba(255,255,255,0.06)"><td style="padding:8px 0;color:#888;font-size:11px;text-transform:uppercase">Master</td><td style="padding:8px 0;text-align:right">${b.master}</td></tr>
                <tr style="border-top:1px solid rgba(255,255,255,0.06)"><td style="padding:8px 0;color:#888;font-size:11px;text-transform:uppercase">Time</td><td style="padding:8px 0;text-align:right;color:#C8A96E;font-weight:bold">${b.time}</td></tr>
            </table>
        </div>
        <p style="text-align:center;margin-top:20px;font-size:13px;color:#888">📍 123 King Street, City Center</p>
        <p style="text-align:center;margin-top:4px;font-size:11px;color:#444">Please arrive on time! 👑</p>
    </div>`;
}

function emailReceipt(b) {
    const receiptId = Date.now().toString(36).toUpperCase();
    return `
    <div style="font-family:'Helvetica',sans-serif;max-width:520px;margin:0 auto;background:#0a0a0a;color:#f5f0eb;padding:40px;border-radius:16px">
        <div style="text-align:center;margin-bottom:24px">
            <div style="display:inline-block;background:#C8A96E;color:#0a0a0a;font-weight:bold;font-size:20px;width:48px;height:48px;line-height:48px;border-radius:10px">T</div>
            <h1 style="font-size:13px;letter-spacing:5px;margin-top:14px;color:#f5f0eb">THRONE</h1>
            <p style="font-size:9px;color:#666;letter-spacing:3px;margin-top:6px">E-RECEIPT</p>
        </div>
        <div style="background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px">
            <div style="display:flex;justify-content:space-between;margin-bottom:16px">
                <span style="font-size:11px;color:#666">Receipt #${receiptId}</span>
                <span style="font-size:11px;color:#666">${b.date} at ${b.time}</span>
            </div>
            <hr style="border:none;border-top:1px solid rgba(255,255,255,0.06);margin:0 0 16px">
            <table style="width:100%;color:#f5f0eb">
                <tr><td style="padding:8px 0">${b.service}</td><td style="text-align:right;color:#C8A96E;font-weight:bold">&euro;${b.price}</td></tr>
                <tr><td style="padding:4px 0;font-size:12px;color:#666" colspan="2">Master: ${b.master} &nbsp;|&nbsp; Duration: ${b.duration} min</td></tr>
            </table>
            <hr style="border:none;border-top:2px solid #C8A96E;margin:16px 0">
            <table style="width:100%;color:#f5f0eb">
                <tr><td style="font-weight:bold;font-size:14px">TOTAL</td><td style="text-align:right;font-size:24px;font-weight:bold;color:#C8A96E">&euro;${b.price}</td></tr>
            </table>
        </div>
        <p style="text-align:center;margin-top:24px;font-size:12px;color:#888">Thank you for visiting THRONE!</p>
        <p style="text-align:center;margin-top:4px;font-size:11px;color:#555">We hope to see you again soon 👑</p>
        <p style="text-align:center;margin-top:16px;font-size:9px;color:#333">123 King Street, City Center &nbsp;|&nbsp; hello@throne.com</p>
    </div>`;
}

// ─── CSV LOGGER ───
function csvEscape(value) {
    // Prevent CSV injection: strip leading =, +, -, @, tab, CR
    let str = String(value);
    if (/^[=+\-@\t\r]/.test(str)) str = "'" + str;
    // Escape quotes by doubling them, then wrap in quotes
    return '"' + str.replace(/"/g, '""') + '"';
}

function logBooking(booking) {
    const csvPath = path.join(__dirname, 'bookings.csv');
    if (!fs.existsSync(csvPath)) {
        fs.writeFileSync(csvPath, 'Booked At,Client Name,Phone,Email,Service,Price,Duration,Master,Date,Time,Allergens,Notes,Status\n');
    }
    const row = [
        booking.booked_at, booking.client_name, booking.client_phone, booking.client_email,
        booking.service, booking.price, booking.duration, booking.master,
        booking.date, booking.time, (booking.allergens || []).join('; '),
        (booking.notes || ''), 'Confirmed'
    ].map(v => csvEscape(v)).join(',') + '\n';
    fs.appendFileSync(csvPath, row);
    console.log('  📊 Logged to bookings.csv');
}

// ─── DEMO MODE (set to false for production) ───
const DEMO_MODE = (process.env.DEMO_MODE || 'true') === 'true';

// ─── SCHEDULE REMINDERS ───
function scheduleReminders(booking) {
    const appointmentTime = new Date(`${booking.date}T${booking.time}:00`);
    const now = Date.now();

    // Calculate real delays
    const real24h    = appointmentTime.getTime() - 24*3600000 - now;
    const real1h     = appointmentTime.getTime() - 3600000 - now;
    const realReceipt = appointmentTime.getTime() + booking.duration*60000 - now;

    // In demo mode, use short delays for testing
    const delay24h    = DEMO_MODE ? 60000  : Math.max(real24h, 60000);     // demo: 1 min
    const delay1h     = DEMO_MODE ? 120000 : Math.max(real1h, 120000);     // demo: 2 min
    const delayReceipt = DEMO_MODE ? 180000 : Math.max(realReceipt, 180000); // demo: 3 min

    // 24h before → Email + SMS to client, TG to master
    setTimeout(async () => {
        console.log(`\n⏰ 24h REMINDER: ${booking.client_name}`);
        await sendEmail(booking.client_email, `Reminder: Tomorrow at THRONE — ${booking.time}`, emailReminder(booking, 'Tomorrow'));
        try { await sendSMS(booking.client_phone, `THRONE: Atgādinājums! Rīt plkst. ${booking.time} jums ir pieraksts: ${booking.service}. Adrese: 123 King Street. Gaidīsim!`); } catch(e) {}
        await sendTelegram(MASTER_CHAT_ID,
            `📅 <b>24h Reminder</b>\n\nTomorrow: <b>${booking.client_name}</b>\n✂️ ${booking.service} at ${booking.time}\n📱 ${booking.client_phone}`
        );
    }, delay24h);

    // 1h before → Email + SMS to client, TG to master
    setTimeout(async () => {
        console.log(`\n⏰ 1h REMINDER: ${booking.client_name}`);
        await sendEmail(booking.client_email, `⏰ In 1 hour: Your appointment at THRONE`, emailReminder(booking, 'in 1 Hour'));
        try { await sendSMS(booking.client_phone, `THRONE: Pēc 1 stundas jums ir pieraksts plkst. ${booking.time}! Lūdzu, ierodies laicīgi. 👑`); } catch(e) {}
        await sendTelegram(MASTER_CHAT_ID,
            `⏰ <b>1h Reminder</b>\n\n<b>${booking.client_name}</b> should be in the chair in 1 hour!\n✂️ ${booking.service} at ${booking.time}\n📱 ${booking.client_phone}`
        );
    }, delay1h);

    // After appointment → E-receipt email + SMS + TG log
    setTimeout(async () => {
        console.log(`\n🧾 E-RECEIPT: ${booking.client_name}`);
        await sendEmail(booking.client_email, `Your E-Receipt — THRONE Barbershop`, emailReceipt(booking));
        await sendTelegram(MASTER_CHAT_ID,
            `🧾 <b>E-Receipt sent</b> to ${booking.client_email}\n${booking.service} — €${booking.price}`
        );
    }, delayReceipt);

    const mode = DEMO_MODE ? '🧪 DEMO' : '🔴 PRODUCTION';
    console.log(`  ⏰ ${mode} — 24h: ${Math.round(delay24h/1000)}s, 1h: ${Math.round(delay1h/1000)}s, receipt: ${Math.round(delayReceipt/1000)}s`);
}

// ─── HTTP SERVER ───
const server = http.createServer(async (req, res) => {
    const parsed = url.parse(req.url, true);

    // ── Security Headers (per OWASP/NIST CSF PR.DS-10) ──
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()');
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' https://images.unsplash.com data:; connect-src 'self'; frame-ancestors 'none'");
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

    // ── API: Booking ──
    if (req.method === 'POST' && parsed.pathname === '/api/book') {
        // Rate limiting
        const clientIp = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
        if (isRateLimited(clientIp)) {
            res.writeHead(429, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ status: 'error', message: 'Too many requests. Please try again later.' }));
        }

        // Body size limit
        let body = '';
        let bodyTooLarge = false;
        req.on('data', c => {
            body += c;
            if (body.length > MAX_BODY_SIZE) {
                bodyTooLarge = true;
                req.destroy();
            }
        });
        req.on('end', async () => {
            if (bodyTooLarge) {
                res.writeHead(413, { 'Content-Type': 'application/json' });
                return res.end(JSON.stringify({ status: 'error', message: 'Request body too large (max 10KB).' }));
            }
            try {
                const raw = JSON.parse(body);

                // Input validation
                const validationErrors = validateBooking(raw);
                if (validationErrors.length > 0) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    return res.end(JSON.stringify({ status: 'error', message: 'Validation failed', errors: validationErrors }));
                }

                // Sanitize inputs
                const b = sanitizeBooking(raw);
                console.log(`\n📋 NEW BOOKING: ${b.client_name} — ${b.service}`);

                // 1. Log to CSV
                logBooking(b);

                // 2. TG → Master notification
                await sendTelegram(MASTER_CHAT_ID,
                    `🔔 <b>New Booking!</b>\n\n` +
                    `👤 <b>${b.client_name}</b>\n📱 ${b.client_phone}\n📧 ${b.client_email}\n\n` +
                    `✂️ <b>${b.service}</b> (€${b.price})\n⏱ ${b.duration} min\n🧑‍🎨 ${b.master}\n📅 ${b.date} at ${b.time}` +
                    (b.allergens?.length ? `\n\n⚠️ <b>Allergens:</b> ${b.allergens.join(', ')}` : '') +
                    (b.notes ? `\n📝 ${b.notes}` : '')
                );

                // 3. Email → Client confirmation
                await sendEmail(b.client_email, `Booking Confirmed — THRONE Barbershop`, emailConfirmation(b));

                // 4. Schedule reminders (24h email+sms, 1h email+sms, receipt email)
                scheduleReminders(b);

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'ok', message: 'Booking confirmed!' }));
            } catch (err) {
                console.error('❌ Error:', err.message);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ status: 'error', message: 'Internal server error' }));
            }
        });
        return;
    }

    // ── Static files ──
    let filePath = parsed.pathname === '/' ? '/index.html' : parsed.pathname;
    const resolved = path.resolve(path.join(__dirname, filePath));
    // Path traversal protection: ensure resolved path is within __dirname
    if (!resolved.startsWith(path.resolve(__dirname))) {
        res.writeHead(403);
        return res.end('403 Forbidden');
    }
    // Block access to sensitive files
    const basename = path.basename(resolved).toLowerCase();
    if (basename === '.env' || basename === '.env.example' || basename === '.gitignore' || basename === 'bookings.csv') {
        res.writeHead(403);
        return res.end('403 Forbidden');
    }
    const ext = path.extname(resolved);
    try {
        const data = fs.readFileSync(resolved);
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        res.end(data);
    } catch { res.writeHead(404); res.end('404'); }
});

server.listen(PORT, () => {
    console.log(`\n👑 THRONE Barbershop Server`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`   API: http://localhost:${PORT}/api/book`);
    console.log(`   TG: @Throne_barber_bot`);
    console.log(`   Email: ${GMAIL_USER}\n`);
});
