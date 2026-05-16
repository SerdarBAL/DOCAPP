# DOCAPP — Dual-UNet LDCT Reader Study

Blind reader-study web app for evaluating low-dose CT → full-dose enhancement
(Dual-UNet model). Each radiologist scrolls 15 CT stacks (5 patients ×
3 modalities: low-dose / model prediction / full-dose, modality blinded),
traces the lesion on the slice it sits on, and fills a region-specific form.
Submissions stream live to a Google Sheet.

## Running locally

```
start.bat   # installs deps on first run, starts dev server, opens browser
stop.bat    # kills the dev server on port 5173
```

The dev server is served at <http://localhost:5173/DOCAPP/>. The Vite config
includes a middleware that serves the on-disk slice folders
(`1_Low_Dose_Input`, `2_Model_Prediction`, `3_Full_Dose_Target`) directly —
no copy required during development.

## Remote data collection (Google Sheets)

GitHub Pages can't run a backend, so submissions are POSTed to a Google Apps
Script web app that appends rows to a Google Sheet.

1. Create a new Google Sheet. Copy its ID — the long token between `/d/` and
   `/edit` in the URL.
2. Open <https://script.google.com> → **New project**. Paste the contents of
   `apps-script-webhook.gs` (in this repo). Replace `SHEET_ID` with the one
   from step 1.
3. Click **Deploy → New deployment → Type: Web app**.
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Authorize the first time it asks.
4. Copy the resulting `/exec` URL.
5. Copy `.env.example` to `.env.local`, paste the URL into `VITE_WEBHOOK_URL`.

The header pill in the top-right will show **Submitted / Send failed / Local
only** so the radiologist (and you, watching the sheet) know each case landed.
If a POST fails the case is also buffered in `localStorage`, and the full
batch can still be downloaded as JSON at the end of the study.

## Deploying to GitHub Pages

```
deploy.bat
```

This:
1. Mirrors the three slice folders into `public/slices/{ldct,pred,fdct}/`
   (gitignored, generated each deploy).
2. Runs `npm run build` (Vite copies `public/` into `dist/`).
3. Pushes `dist/` to the `gh-pages` branch via the `gh-pages` package.

Before the first deploy:

```
git init
git remote add origin https://github.com/<your-username>/DOCAPP.git
git add . && git commit -m "Initial commit"
git push -u origin main
```

The site will be at `https://<your-username>.github.io/DOCAPP/`. If you rename
the repo away from `DOCAPP`, edit `base` in `vite.config.js` and the URL in
`start.bat` to match.

**Important:** the source folders `1_Low_Dose_Input/`, `2_Model_Prediction/`,
`3_Full_Dose_Target/`, and the Excel files are `.gitignore`d so the source
repo stays small and patient metadata never lands on a public main branch.
They are only published to the **gh-pages** branch as built static assets.

## What's in here

| File | Purpose |
| --- | --- |
| `src/App.jsx` | Reader gate → case loop → completion. |
| `src/components/CTViewer.jsx` | PACS-style scrollable stack viewer (wheel / arrow keys / scrubber). |
| `src/components/ClinicalForm.jsx` | Region-specific location + diagnosis form. |
| `src/components/TopBar.jsx` | Progress bar, submission status pill, Reset / Next. |
| `src/components/CompletionScreen.jsx` | End-of-study JSON download (backup). |
| `src/data/patientCases.json` | Auto-generated from the v9 Mar 2023 Excel files. |
| `src/data/mockCases.js` | Expands the manifest into 15 blinded, shuffled cases. |
| `src/submission.js` | Webhook POST with localStorage fallback. |
| `vite.config.js` | Dev-only middleware that serves the slice folders in place. |
| `apps-script-webhook.gs` | Server side: paste into Google Apps Script. |
