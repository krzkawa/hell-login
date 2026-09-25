require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

if (!GMAIL_USER || !GMAIL_APP_PASSWORD || GMAIL_USER.includes('your.address')) {
  console.warn('\n[!] GMAIL_USER / GMAIL_APP_PASSWORD are not configured.');
  console.warn('    Copy .env.example to .env and fill in your own Gmail address');
  console.warn('    and App Password (https://myaccount.google.com/apppasswords).');
  console.warn('    The server will start, but /api/send-verification will fail until then.\n');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD }
});

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static('public'));

const sendLog = [];
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 1000;
function rateLimited() {
  const now = Date.now();
  while (sendLog.length && now - sendLog[0] > RATE_WINDOW_MS) sendLog.shift();
  if (sendLog.length >= RATE_LIMIT) return true;
  sendLog.push(now);
  return false;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CODE_RE = /^[A-Z]{4,10}$/;

app.post('/api/send-verification', async (req, res) => {
  try {
    const { to, code, imageDataUrl } = req.body || {};
    if (typeof to !== 'string' || !EMAIL_RE.test(to)) {
      return res.status(400).json({ ok: false, error: 'Invalid recipient address.' });
    }
    if (typeof code !== 'string' || !CODE_RE.test(code)) {
      return res.status(400).json({ ok: false, error: 'Invalid code.' });
    }
    if (!GMAIL_USER || !GMAIL_APP_PASSWORD || GMAIL_USER.includes('your.address')) {
      return res.status(500).json({ ok: false, error: 'Server is not configured with Gmail credentials yet. See .env.example.' });
    }
    if (rateLimited()) {
      return res.status(429).json({ ok: false, error: 'The relay is resting. Try again shortly.' });
    }

    const attachments = [];
    let imageHtml = '';
    if (typeof imageDataUrl === 'string' && imageDataUrl.startsWith('data:image/png;base64,')) {
      const b64 = imageDataUrl.slice('data:image/png;base64,'.length);
      if (b64.length < 2_000_000) {
        const cid = crypto.randomBytes(6).toString('hex') + '@eternal-services.hell';
        attachments.push({
          filename: 'infernal-script.png',
          content: Buffer.from(b64, 'base64'),
          cid
        });
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
          This is a demonstration message sent by a local script you configured with your own Gmail account.
          Eternal Services is fictional. Reply is not monitored, mostly because nothing here can read.
        </p>
      </div>`;
    const text = 'A verification code was issued in the Infernal Script. It was not designed to be read as plain text. Return to the Damnation Portal page and decode the attached image using the on-page cipher key.';

    await transporter.sendMail({
      from: '"Eternal Services" <' + GMAIL_USER + '>',
      to,
      subject: 'Re: your correspondence (do not attempt to skim this)',
      text,
      html,
      attachments
    });

    res.json({ ok: true });
  } catch (err) {
    console.error('send-verification failed:', err.message);
    res.status(500).json({ ok: false, error: 'Relay failed: ' + err.message });
  }
});

app.listen(PORT, () => {
  console.log('Damnation Portal backend listening on http://localhost:' + PORT);
});
