# Fix One website

Fix One is the parent brand. Fiks Hjem has its own product page; Fix Movie and Fix I'm Hungry are clearly marked concepts.

Buildless Norwegian Bokmål website in `dist/`. Serve this directory with any static HTTPS host. All routes and asset links are relative, so it also works beneath a GitHub Pages repository prefix.

```sh
python3 -m http.server 58970 --directory dist --bind 127.0.0.1
```

- Four pages: company home, Fiks Hjem, support, privacy.
- Responsive navigation, accessible dialogs, project category selector and client-side material estimator with validation/copy.
- No analytics, tracking pixels, third-party scripts, remote fonts, accounts or data-submission backend.
- App store downloads are not enabled: the app has not launched.
- Images: original generated backgrounds guided by owner-supplied concept mockups; device displays are labeled design sketches.
- Contact published by the owner: Tamad@online.no.

The privacy page describes the current Fiks Hjem test code, including optional external AI, weather and map requests. Final app data labels and policies need review before App Store release.

This website is separate from the mobile app. Deploying it does not publish an iOS or Android app.
