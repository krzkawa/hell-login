const nodemailer = require('nodemailer');
const crypto = require('crypto');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_RE = /^[A-Z]{4,10}$/;

// Best-effort abuse limits. Serverless instances are ephemeral and not shared,
// so these only slow a casual abuser; the real safeguard is deleting the
// project (or removing the env vars) once the demo is over.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000;
const LIFETIME_CAP = 40;
const sendLog = [];
let lifetimeSends = 0;

function rateLimited() {
  const now = Date.now();
  while (sendLog.length && now - sendLog[0] > RATE_WINDOW_MS) sendLog.shift();
  if (sendLog.length >= RATE_LIMIT || lifetimeSends >= LIFETIME_CAP) return true;
  sendLog.push(now);
  lifetimeSends++;
  return false;
}

function sameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.host;
  } catch (e) {
    return false;
  }
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'POST only.' });
  }
  if (!sameOrigin(req)) {
    return res.status(403).json({ ok: false, error: 'Cross-origin requests are refused.' });
  }

  const GMAIL_USER = process.env.GMAIL_USER;
  const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;
  const ALLOWED = (process.env.ALLOWED_RECIPIENTS || '')
    .split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);

  try {
    const { to, code, imageDataUrl } = req.body || {};
    if (typeof to !== 'string' || to.length > 254 || !EMAIL_RE.test(to)) {
      return res.status(400).json({ ok: false, error: 'Invalid recipient address.' });
    }
    if (typeof code !== 'string' || !CODE_RE.test(code)) {
      return res.status(400).json({ ok: false, error: 'Invalid code.' });
    }
    if (ALLOWED.length && !ALLOWED.includes(to.toLowerCase())) {
      return res.status(403).json({ ok: false, error: 'This demo only relays to approved addresses.' });
    }
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD) {
      return res.status(500).json({ ok: false, error: 'Server is not configured with Gmail credentials yet.' });
    }
    if (rateLimited()) {
      return res.status(429).json({ ok: false, error: 'The relay is resting. Try again shortly.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
    });

    const attachments = [];
    let imageHtml = '';
    if (typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:image/png;base64,')) {
      const b64 = imageDataUrl.slice('data:image/png;base64,'.length);
      if (b64.length < 1_000_000) {
        const cid = crypto.randomBytes(6).toString('hex') + '@eternal-services.hell';
        attachments.push({ filename: 'infernal-script.png', content: Buffer.from(b64, 'base64'), cid });
        imageHtml = '<p style="margin:18px 0;"><img src="cid:' + cid + '" alt="" style="max-width:100%;filter:contrast(0.6) brightness(0.9);"></p>';
      }
    }

    const html = `
      <div style="background:#12100e;color:#12100e;padding:24px;font-family:Georgia,serif;">
        <p style="font-size:6px;letter-spacing:3px;color:#2b2723;text-align:justify;line-height:0.9;">
          ETERNAL SERVICES DIVISION OF SOULS NOTICE OF CORRESPONDENCE THIS MESSAGE IS PROVIDED FOR YOUR INCONVENIENCE
        </p>
        ${imageHtml}
        <p style="font-size:9px;color:#3a352f;transform:rotate(-1deg);display:inline-block;">
          Your verification code has been transcribed above in the Infernal Script.
          A cipher key remains available on the Damnation Portal page you came from.
        </p>
        <p style="font-size:5px;color:#1d1a17;margin-top:20px;">
          This is a demonstration message. Eternal Services is fictional.
        </p>
      </div>`;
    const text = 'A verification code was issued in the Infernal Script. It was not designed to be read as plain text. Return to the Damnation Portal page and decode the attached image using the on-page cipher key.';

    await transporter.sendMail({
      from: '"Malphas, Courier of the Ninth Circle" <' + GMAIL_USER + '>',
      to,
      subject: 'Malphas delivers your code (do not attempt to skim this)',
      text,
      html,
      attachments
    });
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('send-verification failed:', err.message);
    return res.status(500).json({ ok: false, error: 'Relay failed.' });
  }
};
