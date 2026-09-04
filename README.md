# Mithu Ma'am's Trivia — Project Notes

## Current state: real Firebase backend (not localStorage anymore)
This site now saves real data to Firestore (database) and Storage (photos) —
project **"Trial and Error"** (ID: `trial-and-error-ec3db`). Every page
that touches data (`index.html`, `admin.html`, `winner.html`, and the wall
counter in `home.html`) connects directly to that same Firebase project, so
submissions from any device, anywhere, show up for everyone — that was the
whole point of moving off localStorage.

- `home.html` — front door, photo/video strip, countdown, live wish count pulled from Firestore
- `index.html` — quiz → photo upload (goes to Firebase Storage) → wish note → saved as a document in Firestore's `submissions` collection
- `admin.html` → password `changeme` → roster pulled live from Firestore, sorted by score → click a name → "Mark as winner" (writes to Firestore) → "Open email to notify them" (opens your mail app, pre-filled)
- `winner.html` — public reveal page, queries Firestore for whichever entry has `isWinner: true`

## ⚠️ Before the real trivia day: lock down Firestore + Storage rules
Right now both are in **test mode**, meaning literally anyone on the
internet can read AND write your data if they find the project — fine for
building/testing, not fine once this is live and public.

Go to Firebase console → Firestore Database → **Rules** tab, and replace
the default with something like:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /submissions/{docId} {
      allow read: if true;           // anyone can view (needed for admin.html, winner.html, wall count)
      allow create: if true;         // anyone can submit their entry
      allow update: if request.resource.data.diff(resource.data).affectedKeys()
                       .hasOnly(['isWinner']); // only allow flipping the winner flag, nothing else
      allow delete: if false;        // nobody can delete via the client
    }
  }
}
```

Do the same for Storage → Rules:
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /wishes/{allPaths=**} {
      allow read: if true;
      allow write: if request.resource.size < 5 * 1024 * 1024  // 5MB max per photo
                    && request.resource.contentType.matches('image/.*');
    }
  }
}
```

This isn't bulletproof security (there's no login system, so it can't
verify *who* is submitting) — but it stops randos from deleting your data or
uploading junk files, which is the realistic risk for a class project like
this.

## Winner notification
No auto-email service — decided against it, wasn't worth the setup overhead
for a one-time email. On the winner's entry in `admin.html`, click **"Open
email to notify them"** — opens your default mail app with their address,
subject, and a short message already filled in. You just hit send.

## Open/close window
**September 5, 2026, 00:00–23:59.** Defined in three places (search for
`2026-09-05`): `index.html` (`APP_CONFIG`), `home.html` (`OPEN_DATE`/`CLOSE_DATE`),
and `winner.html` (`APP_CONFIG`). Update all three if the date changes.

## What's placeholder / needs your input
- **Admin password**: `admin.js` → `ADMIN_PASSWORD`. Fine for a class project, not real security

## Deploying to JustRunMy.App
Still plain static files (HTML/CSS/JS) — Firebase is accessed straight from
the browser via CDN imports, so there's no build step or server needed on
your end.

1. Create a free account at justrunmy.app
2. New app → **zip upload** method
3. Zip this whole folder — **including the `photos/` subfolder** (the memory strip on the homepage loads real images/video from there) — and upload it
4. Set `home.html` as the entry point if the platform doesn't default to it — otherwise rename `home.html` → `index.html` and rename the current `index.html` (the quiz page) to something else like `quiz.html`, updating internal links accordingly
5. You'll get a public HTTPS link — send that to the class
