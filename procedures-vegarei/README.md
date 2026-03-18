# procedures.vegarei.com

Vega REI internal SOP library. React + Vite, deployed on Netlify, Google Drive backend.

---

## Local setup

```bash
npm install
cp .env.example .env.local
# Fill in your values in .env.local (see below)
npm run dev
```

Runs at http://localhost:5173. Works without Drive credentials using mock data.

---

## Environment variables

| Variable | Where to get it |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client ID |
| `VITE_DRIVE_INDEX_FILE_ID` | The file ID of `_index.json` in your Drive SOP folder |

---

## Google Cloud Console setup

1. Go to console.cloud.google.com
2. Create project: **Vega Procedures**
3. Enable **Google Drive API**
4. APIs & Services → Credentials → Create OAuth 2.0 Client ID (Web Application)
5. Authorized JavaScript origins:
   - `http://localhost:5173`
   - `https://procedures.vegarei.com`
6. Authorized redirect URIs:
   - `http://localhost:5173`
   - `https://procedures.vegarei.com`
7. Copy Client ID → paste into `VITE_GOOGLE_CLIENT_ID`

---

## Google Drive setup

The SOP folder is already created: **Vega Fund Administration — SOPs**
ID: `1ERQzcaCNdBkhHQUj24LYLCrUB9Pdp7vz`

Folder structure:
```
Vega Fund Administration — SOPs/
  _index.json
  01_Legal_Formation/
  02_Investor_Relations/
    SUB-SOP-001.html
    SUB-SOP-001.meta.json
  03_Compliance/
  04_Tax_Reporting/
    TAX-SOP-001.html
    TAX-SOP-001.meta.json
  05_Operations/
  06_Marketing/
  07_Technology/
```

1. Create the category subfolders in Drive
2. Upload `vega-SUB-SOP-001.html` → rename to `SUB-SOP-001.html` → move to `02_Investor_Relations/`
3. Upload `vega-TAX-SOP-001.html` → rename to `TAX-SOP-001.html` → move to `04_Tax_Reporting/`
4. Create `_index.json` (see template below) and upload to the root SOP folder
5. Create `.meta.json` files for each SOP (see template below)
6. Copy the file IDs from Drive (right-click → Get link → extract ID from URL)
7. Paste the `_index.json` file ID into `VITE_DRIVE_INDEX_FILE_ID`

### _index.json template
```json
{
  "lastUpdated": "2026-03-11",
  "sops": [
    {
      "id": "SUB-SOP-001",
      "title": "Investor Subscription Process",
      "category": "investor",
      "version": "1.1",
      "lastReviewed": "2026-03-11",
      "status": "active",
      "owner": "J Jones",
      "htmlFileId": "PASTE_FILE_ID_HERE",
      "metaFileId": "PASTE_META_FILE_ID_HERE"
    },
    {
      "id": "TAX-SOP-001",
      "title": "Year-End Tax Lifecycle (K-1 Processing)",
      "category": "tax",
      "version": "1.0",
      "lastReviewed": "2026-03-11",
      "status": "active",
      "owner": "J Jones",
      "htmlFileId": "PASTE_FILE_ID_HERE",
      "metaFileId": "PASTE_META_FILE_ID_HERE"
    }
  ]
}
```

### SOP-ID.meta.json template
```json
{
  "id": "SUB-SOP-001",
  "currentVersion": "1.1",
  "revisions": [
    {
      "version": "1.1",
      "date": "2026-03-11",
      "author": "J Jones",
      "summary": "Initial publication",
      "htmlSnapshot": ""
    }
  ]
}
```

---

## Netlify deployment

1. Connect your GitHub repo to Netlify
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Add environment variables in Netlify → Site settings → Environment variables:
   - `VITE_GOOGLE_CLIENT_ID`
   - `VITE_DRIVE_INDEX_FILE_ID`
5. Add custom domain: `procedures.vegarei.com`

---

## Adding new SOPs

1. Get the HTML file from this Claude project chat session
2. Upload to the correct category subfolder in Drive
3. Create a `.meta.json` for it (use template above)
4. Add the entry to `_index.json` with the new file IDs
5. The site picks it up automatically on next load
