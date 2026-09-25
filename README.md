# hell-login

A register and login page built to be as hostile as possible while still working. Made for a bad-UI contest. Every control does its job and every field collects a real value. The fiction is a bureaucracy of hell run by "Eternal Services".

**Live demo: https://hell.dino.icu/**

It sends a real verification email through Gmail SMTP. The code is drawn in a runic cipher as an image, so it can't be copied as text.

Nothing here is a real account system. Nothing is stored. Any password is accepted on login.

## What's in it

**Register (7 clauses, then hold a button)**

1. Drag a fallen label off the input before you can type a username.
2. Enter an email. The send button runs away from your cursor. The code arrives as runes and you decode it with an on-page key.
3. Write a password under 7 rules that appear one at a time, then retype it on a keyboard that reshuffles after every keypress.
4. Set a birth date on three drifting reels. One scrolls backwards. Releasing a reel locks it.
5. Enter a phone number on ten sliders. Every digit sinks toward zero unless you latch it. One slider is inverted.
6. Read an 18-article contract. Articles unlock on a timer (about 3 min 40 s total). Then sign on a canvas and catch a confirm button that dodges.
7. Pick the demon out of 25 faces, three times in a row.

Finish by holding the seal button for 2.6 seconds. You get a certificate with your details and signature.

**Login**

A username, the same shuffling keyboard, and a drag-the-pickaxe captcha.

**Accessibility**

Every widget has a keyboard route (arrow keys for reels and the login slider, Enter to sweep the label or sign). Live regions announce state, focus is visible, and reduced-motion is respected.

## Layout

```
damnation-portal.html        standalone, simulated email, older look
damnation-portal-backend/    local Express server with real email
vercel-deploy/               Vercel version (static page + serverless function)
PRODUCT.md                   product context
```

`vercel-deploy/public/index.html` is the canonical page. The backend copy is kept identical.

## Run locally

Needs Node 20+ and a Gmail account with 2-Step Verification.

```bash
git clone https://github.com/krzkawa/hell-login.git
cd hell-login/damnation-portal-backend
cp .env.example .env
```

Create an App Password at https://myaccount.google.com/apppasswords. Use that, not your normal password. Then edit `.env`:

```
GMAIL_USER=you@gmail.com
GMAIL_APP_PASSWORD=your16charpassword
PORT=3000
```

Install and run:

```bash
npm install
npm start
```

Open http://localhost:3000.

Without credentials the page still works. The email step reports a delivery failure and you can decode the code shown on the page.

## Deploy to Vercel

Set the project's root directory to `vercel-deploy`. Static files are in `public/`, the email endpoint is `api/send-verification.js`.

Set these in the project's environment variables:

| Name | Required | Purpose |
| --- | --- | --- |
| `GMAIL_USER` | yes | Sending address |
| `GMAIL_APP_PASSWORD` | yes | Gmail App Password |
| `ALLOWED_RECIPIENTS` | no | Comma-separated list. If set, only these addresses get email |

Redeploy after changing env vars. If the site asks for a Vercel login, turn off Deployment Protection for the project.

Custom domain: add it under the project's Domains, then point a CNAME at the target Vercel shows you.

## Email endpoint

`POST /api/send-verification` with `{ to, code, imageDataUrl }`.

- Same-origin requests only.
- `code` must be 4 to 10 capital letters.
- 5 sends per minute and 40 per instance lifetime. This is best-effort only, since serverless instances don't share state.

The public endpoint can send mail from your Gmail. Set `ALLOWED_RECIPIENTS`, and delete the project or the Gmail env vars once the demo is over.

On the live demo the real email may be restricted or switched off. If it fails, the on-page code still works.

## Cipher

Letters A to Z map to the Runic block starting at U+16A0. The key is behind the "Reveal the Cipher Key" button on the page.

## Stack

Single-file vanilla HTML, CSS and JS. Canvas for the runes and signature. Pointer Events for all drags. Express and Nodemailer for the local server, Nodemailer in a serverless function on Vercel. Fonts from Google Fonts: Grenze Gotisch, Libre Caslon Text, Special Elite.

## License

MIT. See [LICENSE](LICENSE).

Eternal Services is fictional. No souls were harmed.
