# Damnation Portal

A registration and login page built to be as miserable to use as possible, while every part of it actually works. The theme is a bureaucratic Hell: you are signing your soul over to "Eternal Services." Nothing here is broken on purpose. Every annoying control is a deliberate design choice, and every field still collects a real value.

## What's in this repo

```
damnation-portal/
├── damnation-portal.html        Standalone page. No backend; the email is simulated.
├── damnation-portal-backend/    Local Node.js version that sends real email via Gmail.
│   ├── server.js
│   ├── package.json
│   ├── .env.example
│   └── public/index.html
└── vercel-deploy/               Same real-email version, packaged for Vercel.
    ├── api/send-verification.js
    ├── public/index.html
    └── package.json
```

There are three ways to run it:

| Version | Sends real email | Setup |
|---|---|---|
| `damnation-portal.html` | No (simulated) | Open the file in a browser |
| `damnation-portal-backend/` | Yes | Node.js and a Gmail App Password |
| `vercel-deploy/` | Yes | Vercel account and a Gmail App Password |

## The torment, clause by clause

**Register the Damned**

1. **Identification:** the "Soul Designation" label falls onto the input and blocks it. Drag it out of the way before you can type.
2. **Correspondence:** enter an email address, then press the "Dispatch Malphas, Courier of the Ninth Circle" button. A fake SMTP log plays, and a six-letter verification code arrives written in runes. The code is drawn on a canvas, so it can't be selected or copied. It is jittered, rotated and speckled, and it redraws every 900ms. A cipher key is available; transliterate the runes by hand and type the code to verify.
3. **The Blood Oath:** a Password Game-style rule list that reveals one rule at a time. The rules are: at least 8 characters, contains `666`, the digits sum to exactly 66, contains a synonym for suffering, no "god" or "heaven", and under 20 characters. Then you re-enter the password on an on-screen keyboard whose keys reshuffle after every click, in Comic Sans.
4. **Date of Damnation:** three reels with no snapping. They drift on their own, and the Month reel responds to your drag in reverse. Drift alone never counts as a choice; you have to actually drag each reel.
5. **The Summoning Hotline:** ten vertical sliders for a phone number. Every digit sinks back toward zero every few seconds unless you click its padlock. One slider is secretly inverted.
6. **The Contract:** 18 articles of mock legal text. Scrolling is throttled so only one more article unlocks per real minute, with a live countdown. Once you reach the end, you sign in "blood" on a canvas, then catch a confirm button that dodges your cursor.
7. **Trial of Discernment:** a 5x5 grid of near-identical faces. Find the one demon three times in a row. One miss resets the streak.
8. **Seal:** hold the button for about 2.6 seconds to submit.

**Return, Wretch (Login):** the same shuffling keyboard for the password, plus a captcha where you drag a pickaxe onto a diamond.

There is also a purely cosmetic "Board's patience" meter. It affects nothing.

## Option 1: Standalone page

Open `damnation-portal.html` in a browser. It has no dependencies and no build step. The email step runs the full animation but sends nothing; the code shown on the page is the real one to decode.

## Option 2: Local backend with real email

The backend is a small Express server that sends the verification code as a real, deliberately hard-to-read email through your own Gmail account.

1. Turn on 2-Step Verification for the Gmail account you want to send from.
2. Create an App Password at https://myaccount.google.com/apppasswords. Do not use your normal password.
3. Configure and run:
   ```bash
   cd damnation-portal-backend
   cp .env.example .env
   # edit .env: set GMAIL_USER and GMAIL_APP_PASSWORD
   npm install
   npm start
   ```
4. Open http://localhost:3000.

If `.env` isn't configured, the server still starts and the page still works. The log reports the relay as delayed, and you can finish the form using the on-page code.

The endpoint is `POST /api/send-verification` with `{ to, code, imageDataUrl }`. It validates input and rate-limits to 5 sends per minute.

## Option 3: Deploy to Vercel

`vercel-deploy/` is the same project as a static page plus one serverless function.

1. Deploy the `vercel-deploy` folder (for example with `npx vercel` from inside it, or through the Vercel dashboard).
2. In the Vercel project, open Settings > Environment Variables and add:
   - `GMAIL_USER`: the Gmail address that sends the mail
   - `GMAIL_APP_PASSWORD`: your 16-character App Password
   - `ALLOWED_RECIPIENTS` (optional, recommended): a comma-separated list of addresses the demo may email
3. Redeploy so the variables take effect.

Vercel Authentication is on by default, which keeps the site private. Turn it off under Settings > Deployment Protection only when you want the demo to be public.

## Security notes

- Never put your Gmail password or App Password in the page or commit it. Credentials belong in `.env` locally or in Vercel environment variables. `.env` is git-ignored.
- The email endpoint is a public URL once deployed publicly. Anyone who finds it could try to send mail from your Gmail account. The built-in limits are best-effort only: an origin check, 5 sends per minute, and 40 sends per server instance. Serverless instances don't share counters, so these won't stop a determined abuser.
- Set `ALLOWED_RECIPIENTS` for any public demo, and delete the project or remove the Gmail variables when you're done.
- The page cannot send email on its own. Browsers can't speak SMTP, so real email always needs a backend.

## Notes

- Everything is fictional. Eternal Services does not exist, and no souls were harmed.
