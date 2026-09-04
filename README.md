# Mithu Ma'am's Trivia — Project Notes

## File map (renamed for GitHub Pages compatibility)
GitHub Pages always serves `index.html` at the root URL, so the homepage
had to become `index.html` and the quiz got renamed to `quiz.html`:

- `index.html` — **the homepage/front door**: photo/video strip, countdown, live wish count pulled from Firestore, links to the quiz and results
- `quiz.html` — the actual trivia: quiz → photo upload (goes to Firebase Storage) → wish note → saved as a document in Firestore's `submissions` collection
- `admin.html` → password `changeme` → roster pulled live from Firestore, sorted by score → click a name → "Mark as winner" (writes to Firestore) → "Open email to notify them" (opens your mail app, pre-filled)
- `winner.html` — public reveal page, queries Firestore for whichever entry has `isWinner: true`

All data is real Firebase (Firestore + Storage), project **"Trial and
Error"** (ID: `trial-and-error-ec3db`) — every page connects to the same
project, so submissions from any device show up everywhere.

## ⚠️ Before the real trivia day: lock down Firestore + Storage rules
Both are currently in **test mode** — anyone who finds the project URL
could read AND write/delete your data. Fine for testing, not fine once
live. Firebase console → Firestore Database → **Rules** tab:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /submissions/{docId} {
      allow read: if true;
      allow create: if true;
      allow update: if request.resource.data.diff(resource.data).affectedKeys()
                       .hasOnly(['isWinner']);
      allow delete: if false;
    }
  }
}
```

Storage → Rules:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /wishes/{allPaths=**} {
      allow read: if true;
      allow write: if request.resource.size < 5 * 1024 * 1024
                    && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## Winner notification
Manual, on purpose — no auto-email service. On the winner's entry in
`admin.html`, click **"Open email to notify them"** — opens your mail app
with their address, subject, and message pre-filled.

## Open/close window
**September 5, 2026, 00:00–23:59.** Defined in three places (search for
`2026-09-05`): `quiz.html` (`APP_CONFIG`), `index.html`
(`OPEN_DATE`/`CLOSE_DATE`), and `winner.html` (`APP_CONFIG`).

## Fixed: mobile text visibility
Added `<meta name="color-scheme" content="light only">` plus a matching
CSS `color-scheme: light;` rule to every page. Many Android phones
auto-invert/darken colors on sites that don't explicitly declare their
color scheme — this stops that, since the whole design is light-themed
and was never meant to be inverted.

## Deploying to GitHub Pages
1. Create a public repo on GitHub
2. Upload all files **including the `photos/` folder** (drag-and-drop upload works fine — use "uploading an existing file" on the empty repo page)
3. Settings → Pages → Source: "Deploy from a branch" → branch `main`, folder `/ (root)` → Save
4. Your site will be live at `https://yourusername.github.io/repo-name/`
5. Since `index.html` is now the homepage, the root URL correctly loads the front door first
